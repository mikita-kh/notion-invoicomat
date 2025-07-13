import { Buffer } from 'node:buffer'

import { Injectable, Logger } from '@nestjs/common'
import { Currency } from '../exchange/exchange.interfaces'
import { ExchangeService } from '../exchange/exchange.service'
import { HtmlDocumentService } from '../html-document/html-document.service'
import { HtmlToPdfOptions, HtmlToPdfService } from '../html-to-pdf/html-to-pdf.service'
import { InvoiceData, InvoiceRendererContext } from './invoice-renderer.interfaces'

@Injectable()
export class InvoiceRendererService {
  private readonly logger = new Logger(InvoiceRendererService.name)

  constructor(
    private readonly htmlDocument: HtmlDocumentService,
    private readonly exchange: ExchangeService,
    private readonly htmlToPdf: HtmlToPdfService,
  ) {}

  async renderInvoiceAsPDF(
    rendererContext: InvoiceRendererContext,
    config: HtmlToPdfOptions = {},
  ): Promise<Buffer> {
    try {
      const html = await this.renderInvoiceAsHTML(rendererContext)
      const pdf = await this.htmlToPdf.generatePdf(html, config)
      this.logger.log('Invoice PDF created successfully')
      return pdf
    } catch (error) {
      this.logger.error('Error rendering invoice:', error)
      throw error
    }
  }

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

  async prepareRendererContext(
    data: InvoiceData,
  ): Promise<InvoiceRendererContext> {
    const [{ currency }] = data.entries
    const exchange = await this.exchange.getRate(currency as Currency, data.sale_date ?? data.issue_date)

    const context: InvoiceRendererContext = {
      ...data,
      invoice_in_foreign_currency: exchange.rate !== 1,
      currency,
      exchange,
    }

    return context
  }
}
