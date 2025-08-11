import { BadRequestException, Controller, Get, InternalServerErrorException, Logger, Param, Query, Res } from '@nestjs/common'
import { Response } from 'express'
import { parsePageId } from 'notion-utils'
import { NotionService } from '../notion/notion.service'
import { InvoiceData } from './invoice-renderer.interfaces'
import { InvoiceRendererService } from './invoice-renderer.service'

@Controller('invoice/renderer')
export class InvoiceRendererController {
  private readonly logger = new Logger(InvoiceRendererController.name)

  constructor(
    private readonly notionService: NotionService,
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
      const data = await this.notionService.getNormalizedPageData<InvoiceData>(pageId)
      const context = await this.invoiceRendererService.prepareRendererContext(data)
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
