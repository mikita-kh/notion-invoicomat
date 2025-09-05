import { BadRequestException, Controller, Get, InternalServerErrorException, Logger, Param, Query, Res } from '@nestjs/common'
import { Response } from 'express'
import { parsePageId } from 'notion-utils'
import { InvoiceRendererService } from '../invoice-renderer/invoice-renderer.service'
import { InvoiceProcessorService } from './invoice-processor.service'

@Controller('invoice/processor')
export class InvoiceProcessorController {
  private readonly logger = new Logger(InvoiceProcessorController.name)

  constructor(
    private readonly invoiceProcessorService: InvoiceProcessorService,
    private readonly invoiceRendererService: InvoiceRendererService,
  ) {}

  @Get(':id')
  async getPage(
    @Res() res: Response,
    @Param('id') id: string,
    @Query('format') format: 'html' | 'pdf' = 'html',
  ): Promise<void> {
    const pageId = parsePageId(id)

    if (!pageId) {
      this.logger.error(`Invalid page ID: ${id}`)
      throw new BadRequestException(`Invalid page ID: ${id}`)
    }

    if (!['html', 'pdf'].includes(format)) {
      this.logger.error(`Unsupported format: ${format}`)
      throw new BadRequestException(`Unsupported format: ${format}`)
    }

    try {
      const context = await this.invoiceProcessorService.prepareRendererContext(pageId)
      if (format === 'html') {
        res.setHeader('Content-Type', 'text/html')
        res.send(await this.invoiceRendererService.renderInvoiceAsHTML(context))
      } else if (format === 'pdf') {
        const pdfBuffer = await this.invoiceRendererService.renderInvoiceAsPDF(context, {
          // format: 'A4',
          // scale: 0.75,
          // printBackground: true,
        })

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', 'inline; filename="invoice.pdf"')
        res.send(pdfBuffer)
      }
    } catch (error) {
      this.logger.error('Error rendering invoice:', error)
      throw new InternalServerErrorException('Failed to render the invoice. Please try again later.')
    }
  }
}
