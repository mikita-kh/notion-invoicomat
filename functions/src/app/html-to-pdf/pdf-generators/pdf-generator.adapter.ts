import { Buffer } from 'node:buffer'
import { ConfigService } from '@nestjs/config'
import { PDFOptions } from 'puppeteer-core'
import { Configuration } from '../../config/config.interface'

export type PdfGenerationOptions = Pick<PDFOptions, 'format' | 'landscape' | 'displayHeaderFooter'>
export abstract class PdfGenerator {
  constructor(protected readonly config: ConfigService<Configuration>) {}
  abstract generatePdf(html: string, options: Required<PdfGenerationOptions>): Promise<Buffer>
}
