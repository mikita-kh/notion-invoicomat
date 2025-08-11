import { Buffer } from 'node:buffer'
import { Readable } from 'node:stream'
import {
  Asset,
  HTMLToPDFJob,
  HTMLToPDFParams,
  HTMLToPDFResult,
  MimeType,
  PageLayout,
  PDFServices,
  ServicePrincipalCredentials,
} from '@adobe/pdfservices-node-sdk'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { getStreamAsBuffer } from 'get-stream'
import { Configuration } from '../../../config/configuration'
import { PdfGenerationOptions, PdfGenerator } from '../pdf-generator.adapter'

type SupportedFormat = Uppercase<Required<PdfGenerationOptions>['format']>
type PageSize = [width: number, height: number]

interface AdobeError extends Error {
  code?: string
  details?: unknown
}

@Injectable()
export class AdobePdfGenerator extends PdfGenerator {
  private readonly logger = new Logger(AdobePdfGenerator.name)

  private static readonly PAGE_SIZES: Record<SupportedFormat, PageSize> = {
    LETTER: [8.5, 11],
    LEGAL: [8.5, 14],
    TABLOID: [11, 17],
    LEDGER: [17, 11],
    A0: [33.1102, 46.811],
    A1: [23.3858, 33.1102],
    A2: [16.5354, 23.3858],
    A3: [11.6929, 16.5354],
    A4: [8.2677, 11.6929],
    A5: [5.8268, 8.2677],
    A6: [4.1339, 5.8268],
  }

  constructor(config: ConfigService<Configuration>) {
    super(config)
  }

  async generatePdf(html: string, options: Required<PdfGenerationOptions>): Promise<Buffer> {
    this.logger.debug('Starting Adobe PDF generation', {
      format: options.format,
      landscape: options.landscape,
      scale: options.scale,
    })

    this.validateOptions(options)
    const processedHtml = this.preprocessHtml(html, options)

    let readStream: Readable | null = null

    try {
      readStream = Readable.from([Buffer.from(processedHtml, 'utf-8')])
      const pdfServices = this.getPdfServices()

      const inputAsset = await this.uploadHtml(pdfServices, readStream)
      const job = this.createJob(inputAsset, options)
      const buffer = await this.executeJob(pdfServices, job)

      this.logger.debug('Adobe PDF generation completed successfully', {
        bufferSize: buffer.length,
      })

      return buffer
    } catch (error) {
      this.handleError(error as AdobeError, options)
      throw error
    } finally {
      readStream?.destroy()
    }
  }

  private validateOptions(options: Required<PdfGenerationOptions>): void {
    // Validate scale
    if (options.scale < 0.1 || options.scale > 2.0) {
      throw new Error(`Invalid scale value: ${options.scale}. Must be between 0.1 and 2.0`)
    }

    // Validate format
    const format = options.format.toUpperCase() as SupportedFormat
    if (!(format in AdobePdfGenerator.PAGE_SIZES)) {
      throw new Error(`Unsupported format: ${options.format}. Supported formats: ${Object.keys(AdobePdfGenerator.PAGE_SIZES).join(', ')}`)
    }
  }

  private preprocessHtml(html: string, options: Required<PdfGenerationOptions>): string {
    const styles = [
      this.generateMarginsStyle(options.margin),
      this.generateScaleStyle(options.scale),
    ].filter((style): style is string => style !== null)

    return this.injectStyles(html, styles)
  }

  private generateMarginsStyle(margins: PdfGenerationOptions['margin']): string | null {
    if (!margins) {
      return null
    }

    const marginStyles: string[] = []

    for (const [side, value] of Object.entries(margins)) {
      if (value) {
        marginStyles.push(`margin-${side}: ${value}${typeof value === 'number' ? 'px' : ''};`)
      }
    }

    if (marginStyles.length === 0) {
      return null
    }

    return `
      @page { ${marginStyles.join('')} }
      body { margin: 0; padding: 0; }
    `
  }

  private generateScaleStyle(scale: number): string | null {
    if (!scale || scale === 1) {
      return null
    }

    return `
      body {
        transform: scale(${scale});
        transform-origin: top left;
        width: ${100 / scale}%;
      }
    `
  }

  private injectStyles(html: string, styles: string[]): string {
    const styleBlock = `<style>${styles.join('\n')}</style>`

    if (html.includes('<head>')) {
      return html.replace('<head>', `<head>${styleBlock}`)
    } else if (html.includes('<html>')) {
      return html.replace('<html>', `<html><head>${styleBlock}</head>`)
    }

    return `${styleBlock}${html}`
  }

  private getPdfServices(): PDFServices {
    return new PDFServices({ credentials: this.buildCredentials() })
  }

  private async uploadHtml(pdfServices: PDFServices, readStream: Readable) {
    try {
      return await pdfServices.upload({
        readStream,
        mimeType: MimeType.HTML,
      })
    } catch (error) {
      throw new Error(`Failed to upload HTML to Adobe PDF Services: ${(error as Error).message}`)
    }
  }

  private createJob(inputAsset: Asset, options: Required<PdfGenerationOptions>): HTMLToPDFJob {
    return new HTMLToPDFJob({
      inputAsset,
      params: this.buildAdobeParams(options),
    })
  }

  private buildAdobeParams(options: Required<PdfGenerationOptions>): HTMLToPDFParams {
    const format = options.format.toUpperCase() as SupportedFormat
    let pageSize = AdobePdfGenerator.PAGE_SIZES[format]

    if (options.landscape) {
      pageSize = [pageSize[1], pageSize[0]]
    }

    return new HTMLToPDFParams({
      pageLayout: new PageLayout({
        pageWidth: pageSize[0],
        pageHeight: pageSize[1],
      }),
      includeHeaderFooter: options.displayHeaderFooter ?? false,
    })
  }

  private async executeJob(pdfServices: PDFServices, job: HTMLToPDFJob): Promise<Buffer> {
    try {
      const pollingURL = await pdfServices.submit({ job })
      const jobResult = await pdfServices.getJobResult({
        pollingURL,
        resultType: HTMLToPDFResult,
      })

      if (!jobResult.result?.asset) {
        throw new Error('No result asset found in PDF job result')
      }

      const streamAsset = await pdfServices.getContent({ asset: jobResult.result.asset })
      return await getStreamAsBuffer(streamAsset.readStream)
    } catch (error) {
      throw new Error(`PDF job execution failed: ${(error as Error).message}`)
    }
  }

  private handleError(error: AdobeError, options: Required<PdfGenerationOptions>): void {
    this.logger.error('Adobe PDF generation failed', {
      message: error.message,
      code: error.code,
      details: error.details,
      stack: error.stack,
      options: {
        format: options.format,
        landscape: options.landscape,
        scale: options.scale,
      },
    })
  }

  private buildCredentials(): ServicePrincipalCredentials {
    return new ServicePrincipalCredentials({
      clientId: this.config.getOrThrow('PDF_SERVICES_CLIENT_ID'),
      clientSecret: this.config.getOrThrow('PDF_SERVICES_CLIENT_SECRET'),
    })
  }
}
