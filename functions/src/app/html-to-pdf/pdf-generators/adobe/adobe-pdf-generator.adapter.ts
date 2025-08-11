import { Buffer } from 'node:buffer'
import { Readable } from 'node:stream'
import {
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

type Formats = Uppercase<Required<PdfGenerationOptions>['format']>

@Injectable()
export class AdobePdfGenerator extends PdfGenerator {
  private readonly logger = new Logger(AdobePdfGenerator.name)

  constructor(config: ConfigService<Configuration>) {
    super(config)
  }

  async generatePdf(html: string, options: Required<PdfGenerationOptions>): Promise<Buffer> {
    const processedHtml = this.applyMarginsToHtml(this.applyScaleToHtml(html, options.scale), options.margin)

    const readStream = Readable.from([Buffer.from(processedHtml, 'utf-8')])

    try {
      const pdfServices = new PDFServices({ credentials: this.buildCredentials() })

      const inputAsset = await pdfServices.upload({
        readStream,
        mimeType: MimeType.HTML,
      })

      const job = new HTMLToPDFJob({ inputAsset, params: this.mapToAdobeOptions(options) })
      const pollingURL = await pdfServices.submit({ job })
      const jobResult = await pdfServices.getJobResult({
        pollingURL,
        resultType: HTMLToPDFResult,
      })

      if (!jobResult.result?.asset) {
        const error = new Error('No result asset found in PDF job result')
        this.logger.error('Adobe PDF generation failed: no result asset', { jobResult })
        throw error
      }

      const streamAsset = await pdfServices.getContent({ asset: jobResult.result.asset })
      const buffer = await getStreamAsBuffer(streamAsset.readStream)

      return buffer
    } catch (error) {
      this.logger.error('Failed to generate PDF using Adobe PDF Services', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        options,
      })
      throw error
    } finally {
      readStream.destroy()
    }
  }

  private buildCredentials(): ServicePrincipalCredentials {
    return new ServicePrincipalCredentials({
      clientId: this.config.getOrThrow('PDF_SERVICES_CLIENT_ID'),
      clientSecret: this.config.getOrThrow('PDF_SERVICES_CLIENT_SECRET'),
    })
  }

  private applyScaleToHtml(html: string, scale: number): string {
    if (!scale || scale === 1) {
      return html
    }

    const scaleStyle = `
      <style>
        body {
          transform: scale(${scale});
          transform-origin: top left;
          width: ${100 / scale}%;
        }
      </style>
    `

    return this.appendStyleToHTML(scaleStyle, html)
  }

  private applyMarginsToHtml(html: string, margins?: PdfGenerationOptions['margin']): string {
    if (!margins) {
      return html
    }

    const marginStyles: string[] = []

    if (margins.top)
      marginStyles.push(`margin-top: ${margins.top}${typeof margins.top === 'number' ? 'px' : ''};`)
    if (margins.bottom)
      marginStyles.push(`margin-bottom: ${margins.bottom}${typeof margins.bottom === 'number' ? 'px' : ''};`)
    if (margins.left)
      marginStyles.push(`margin-left: ${margins.left}${typeof margins.left === 'number' ? 'px' : ''};`)
    if (margins.right)
      marginStyles.push(`margin-right: ${margins.right}${typeof margins.right === 'number' ? 'px' : ''};`)

    if (marginStyles.length === 0) {
      return html
    }

    const marginStyle = `
      <style>
        @page { ${marginStyles.join('')} }
        body { margin: 0; padding: 0; }
      </style>
    `

    return this.appendStyleToHTML(marginStyle, html)
  }

  private appendStyleToHTML(style: string, html: string): string {
    if (html.includes('<head>')) {
      return html.replace('<head>', `<head>${style}`)
    } else if (html.includes('<html>')) {
      return html.replace('<html>', `<html><head>${style}</head>`)
    } else {
      return `${style}${html}`
    }
  }

  private mapToAdobeOptions(options: Required<PdfGenerationOptions>): HTMLToPDFParams {
    const formatToPageSizes: Record<Formats, [number, number]> = {
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

    let pageSize = formatToPageSizes[options.format.toUpperCase() as Formats] ?? formatToPageSizes.LETTER

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
}
