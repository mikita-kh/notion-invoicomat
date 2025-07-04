import { Injectable, Logger } from '@nestjs/common'
import { TemplateEngineAdapter } from './adapters/template-engine.adapter'
import { InvoiceData } from './invoice-renderer.interfaces'

@Injectable()
export class InvoiceRendererService {
  #logger = new Logger(InvoiceRendererService.name)

  constructor(private readonly templateEngine: TemplateEngineAdapter) {}

  async renderInvoice(
    data: InvoiceData,
  ): Promise<string> {
    try {
      this.#logger.debug('Rendering invoice with data:', data)
      const html = await this.templateEngine.render(data)
      this.#logger.log('Invoice rendered successfully')
      return html
    } catch (error) {
      this.#logger.error('Error rendering invoice:', error)
      throw error
    }
  }
}
