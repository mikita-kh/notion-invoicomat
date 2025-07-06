import { Buffer } from 'node:buffer'

import { Injectable, Logger } from '@nestjs/common'
import { ExchangeService } from '../exchange/exchange.service'
import { HtmlDocumentService } from '../html-document/html-document.service'
import { HtmlToPdfOptions, HtmlToPdfService } from '../html-to-pdf/html-to-pdf.service'
import { InvoiceData, InvoiceRendererContext } from './invoice-renderer.interfaces'

@Injectable()
export class InvoiceRendererService {
  #logger = new Logger(InvoiceRendererService.name)
  #defaultCurrency = 'PLN'

  constructor(
    private readonly htmlDocument: HtmlDocumentService,
    private readonly exchange: ExchangeService,
    private readonly htmlToPdf: HtmlToPdfService,
  ) {}

  async renderInvoice(
    data: InvoiceData,
    config: HtmlToPdfOptions = {},
  ): Promise<Buffer> {
    try {
      this.#logger.debug('Rendering invoice with data:', data)
      const html = await this.htmlDocument.render('invoice', data)
      const pdf = await this.htmlToPdf.generatePdf(html, config)
      this.#logger.log('Invoice rendered successfully')
      return pdf
    } catch (error) {
      this.#logger.error('Error rendering invoice:', error)
      throw error
    }
  }

  async prepapeInvoiceData(
    data: InvoiceData,
  ): Promise<InvoiceRendererContext> {
    const [{ currency }] = data.entries
    const invoiceInForeignCurrency = currency !== this.#defaultCurrency
    let exchange = { rate: 1, currency, no: '', date: '' }

    if (invoiceInForeignCurrency) {
      exchange = await this.exchange.getRate(currency, data.sale_date ?? data.issue_date)
    }

    const context: InvoiceRendererContext = {
      ...data,
      invoice_in_foreign_currency: invoiceInForeignCurrency,
      currency,
      exchange,
    }

    return context
  }
}
