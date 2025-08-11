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
    margin: {
      top: '0.75in',
      right: '0.75in',
      bottom: '0.75in',
      left: '0.75in',
    },
    scale: 0.75,
  }

  constructor(private readonly pdfGenerator: PdfGenerator) {}

  async generatePdf(html: string, {
    format = HtmlToPdfService.defaultOptions.format,
    landscape = HtmlToPdfService.defaultOptions.landscape,
    displayHeaderFooter = HtmlToPdfService.defaultOptions.displayHeaderFooter,
    margin = HtmlToPdfService.defaultOptions.margin,
    scale = HtmlToPdfService.defaultOptions.scale,
  }: HtmlToPdfOptions = {}): Promise<Buffer> {
    try {
      this.logger.debug(`Starting PDF generation to ${this.pdfGenerator.constructor.name} provider`, { format, landscape, displayHeaderFooter, margin, scale })
      const pdf = await this.pdfGenerator.generatePdf(html, {
        format,
        landscape,
        displayHeaderFooter,
        margin,
        scale,
      })
      this.logger.debug('PDF generated successfully', { buffer: { size: pdf.length } })
      return pdf
    } catch (error) {
      this.logger.error('Failed to generate PDF', error)
      throw error
    }
  }
}
