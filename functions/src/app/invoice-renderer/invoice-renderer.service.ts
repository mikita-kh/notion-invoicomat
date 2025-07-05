import { Injectable, Logger } from '@nestjs/common'
import { ExchangeService } from '../exchange/exchange.service'
import { HtmlDocumentService } from '../html-document/html-document.service'
import { InvoiceData } from './invoice-renderer.interfaces'

@Injectable()
export class InvoiceRendererService {
  #logger = new Logger(InvoiceRendererService.name)
  #defaultCurrency = 'PLN'

  constructor(private readonly htmlDocument: HtmlDocumentService, private readonly exchange: ExchangeService) {}

  async renderInvoice(
    data: InvoiceData,
  ): Promise<string> {
    try {
      this.#logger.debug('Rendering invoice with data:', data)
      const html = await this.htmlDocument.render('invoice', data)
      this.#logger.log('Invoice rendered successfully')
      return html
    } catch (error) {
      this.#logger.error('Error rendering invoice:', error)
      throw error
    }
  }

  async prepapeInvoiceData(
    data: InvoiceData,
  ): Promise<InvoiceData> {
    const [{ currency }] = data.entries
    const invoiceInForeignCurrency = currency !== this.#defaultCurrency
    let exchange = { rate: 1, currency, no: '', date: '' }

    if (invoiceInForeignCurrency) {
      exchange = await this.exchange.getRate(currency, data.sale_date ?? data.issue_date)
    }

    const context = {
      ...data,
      invoice_in_foreign_currency: invoiceInForeignCurrency,
      currency,
      exchange,
    }

    return context
  }
}
