// get notion page data
import { Controller, Get, Param } from '@nestjs/common'
import { parsePageId } from 'notion-utils'
import { InvoiceRendererService } from './invoice-renderer/invoice-renderer.service'
import { NotionService } from './notion/notion.service'

@Controller('notion')
export class AppController {
  constructor(private readonly notionService: NotionService, private readonly invoiceRendererService: InvoiceRendererService) {}

  @Get('page/:id')
  async getPage(@Param('id') id: string) {
    const data = await this.notionService.getNormilizedPageData(parsePageId(id)!)

    return this.invoiceRendererService.renderInvoice(data as any)
  }
}
