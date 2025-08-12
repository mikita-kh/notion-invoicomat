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

type SupportedFormat = Uppercase<Required<PdfGenerationOptions>['format']>
type PageSize = [width: number, height: number]

@Injectable()
export class AdobePdfGenerator extends PdfGenerator {
  private readonly logger = new Logger(AdobePdfGenerator.name)

  // Standard page sizes in inches (width, height)
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

  constructor(protected readonly config: ConfigService<Configuration>) {
    super(config)
  }

  async generatePdf(html: string, options: Required<PdfGenerationOptions>): Promise<Buffer> {
    this.logger.debug('Starting Adobe PDF generation', options)

    const readStream = Readable.from([Buffer.from(html, 'utf-8')])

    try {
      const pdfServices = new PDFServices({ credentials: this.buildCredentials() })
      const inputAsset = await pdfServices.upload({
        readStream,
        mimeType: MimeType.HTML,
      })
      const job = new HTMLToPDFJob({
        inputAsset,
        params: this.buildAdobeParams(options),
      })
      const buffer = await this.executeJob(pdfServices, job)

      this.logger.debug('Adobe PDF generation completed successfully', {
        bufferSize: buffer.length,
      })

      return buffer
    } catch (error) {
      this.logger.error('Adobe PDF generation failed', { cause: error })
      throw new Error('PDF generation failed', { cause: error })
    } finally {
      readStream?.destroy()
    }
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
      throw new Error(`PDF job execution failed`, { cause: error })
    }
  }

  private buildCredentials(): ServicePrincipalCredentials {
    return new ServicePrincipalCredentials({
      clientId: this.config.getOrThrow('PDF_SERVICES_CLIENT_ID'),
      clientSecret: this.config.getOrThrow('PDF_SERVICES_CLIENT_SECRET'),
    })
  }
}
