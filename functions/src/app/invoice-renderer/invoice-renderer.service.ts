import { Injectable, Logger } from '@nestjs/common'
import { HtmlDocumentService } from '../html-document/html-document.service'
import { InvoiceRendererContext } from './invoice-renderer.interfaces'

@Injectable()
export class InvoiceRendererService {
  private readonly logger = new Logger(InvoiceRendererService.name)

  constructor(private readonly htmlDocument: HtmlDocumentService) {}

  async renderInvoiceAsHTML(
    rendererContext: InvoiceRendererContext,
  ): Promise<string> {
    try {
      this.logger.debug('Rendering invoice with data:', rendererContext)
      const html = await this.htmlDocument.render('invoice', rendererContext)
      this.logger.log('Invoice html rendered successfully')
      return html
    } catch (error) {
      this.logger.error('Error rendering invoice:', error)
      throw error
    }
  }
}
