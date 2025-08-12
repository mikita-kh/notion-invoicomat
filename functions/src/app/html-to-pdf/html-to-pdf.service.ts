import { Buffer } from 'node:buffer'
import { Injectable, Logger } from '@nestjs/common'
import { PdfGenerationOptions, PdfGenerator } from './pdf-generators/pdf-generator.adapter'

export interface HtmlToPdfOptions extends PdfGenerationOptions {}

@Injectable()
export class HtmlToPdfService {
  private readonly logger = new Logger(HtmlToPdfService.name)

  static defaultOptions: Required<HtmlToPdfOptions> = {
    format: 'A4',
    landscape: false,
    displayHeaderFooter: false,
  }

  constructor(private readonly pdfGenerator: PdfGenerator) {}

  async generatePdf(html: string, {
    format = HtmlToPdfService.defaultOptions.format,
    landscape = HtmlToPdfService.defaultOptions.landscape,
    displayHeaderFooter = HtmlToPdfService.defaultOptions.displayHeaderFooter,
  }: HtmlToPdfOptions = {}): Promise<Buffer> {
    try {
      this.logger.debug(`Starting PDF generation to ${this.pdfGenerator.constructor.name} provider`, { format, landscape, displayHeaderFooter })
      const pdf = await this.pdfGenerator.generatePdf(html, {
        format,
        landscape,
        displayHeaderFooter,
      })
      this.logger.debug('PDF generated successfully', { buffer: { size: pdf.length } })
      return pdf
    } catch (error) {
      this.logger.error('Failed to generate PDF', { cause: error })
      throw new Error('PDF generation failed', { cause: error })
    }
  }
}
