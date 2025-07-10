import { Controller, Get, Logger, Param } from '@nestjs/common'
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
  async getPage(@Param('id') id: string) {
    const pageId = parsePageId(id)

    if (!pageId) {
      this.logger.error(`Invalid page ID: ${id}`)
      throw new Error(`Invalid page ID: ${id}`)
    }

    const data = await this.notionService.getNormilizedPageData(pageId)

    try {
      return await this.invoiceRendererService.renderInvoiceAsHTML(data as InvoiceData)
    } catch (error) {
      this.logger.error('Error rendering invoice:', error)
    }

    return data
  }
}
