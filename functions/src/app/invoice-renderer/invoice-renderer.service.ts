import { Injectable, Logger } from '@nestjs/common'
import { I18nService } from '../i18n/i18n.service'
import { TemplateEngineAdapter } from './adapters/template-engine.adapter'
import { ExchangeService } from './services/exchange.service'
import { InvoiceData } from './types/Invoice'

@Injectable()
export class InvoiceRendererService {
  logger = new Logger(InvoiceRendererService.name)
  templateEngineService: TemplateEngineAdapter

  constructor(i18n: I18nService, exchange: ExchangeService) {
    this.templateEngineService = new TemplateEngineAdapter(i18n, exchange)
  }

  async renderInvoice(
    data: InvoiceData,
  ): Promise<string> {
    this.logger.debug('Rendering invoice with data:', data)

    return await this.templateEngineService.render(data)
  }
}
