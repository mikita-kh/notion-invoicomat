import { createHash } from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import slugify from 'slugify'
import { Currency } from '../exchange/exchange.interfaces'
import { ExchangeService } from '../exchange/exchange.service'
import { FirebaseStorageService } from '../firebase/firebase-storage.service'
import { HtmlToPdfOptions, HtmlToPdfService } from '../html-to-pdf/html-to-pdf.service'
import { InvoiceData, InvoiceRendererContext } from '../invoice-renderer/invoice-renderer.interfaces'
import { InvoiceRendererService } from '../invoice-renderer/invoice-renderer.service'
import { NotionService } from '../notion/notion.service'
import { InvoiceStatus } from './invoice-processor.interfaces'

@Injectable()
export class InvoiceProcessorService {
  private readonly logger = new Logger(InvoiceProcessorService.name)

  constructor(
    private readonly notion: NotionService,
    private readonly invoiceRenderer: InvoiceRendererService,
    private readonly exchange: ExchangeService,
    private readonly firebaseStorage: FirebaseStorageService,
    private readonly htmlToPdf: HtmlToPdfService,
  ) {}

  private async shouldProcess(notionPageId: string, propertyIds: string[]) {
    if (!propertyIds.length) {
      this.logger.log(`No properties to process for page ${notionPageId}`)
      return false
    }

    const pageProperties = await this.notion.getPageProperties(notionPageId)

    if (!pageProperties) {
      return false
    }

    const statusePoperty = pageProperties[this.notionInvoiceStatusName]

    if (
      statusePoperty?.id
      && propertyIds.includes(statusePoperty.id)
      && statusePoperty.type === 'status'
      && statusePoperty.status?.name === InvoiceStatus.ShouldProcess
    ) {
      this.logger.log(`Property "${this.notionInvoiceStatusName}" has status ${InvoiceStatus.ShouldProcess} that indicates the page should be processed.`)
      return true
    }

    this.logger.log(`No properties indicate the page should be processed.`)
    return false
  }

  async process(notionPageId: string, propertyIds: string[]) {
    if (!await this.shouldProcess(notionPageId, propertyIds)) {
      return
    }

    try {
      await this.markInProgress(notionPageId)

      const context = await this.prepareRendererContext(notionPageId)
      const url = await this.getOrCreatePdfUrl(context)

      await this.markReady(notionPageId, url, context)
    } catch (error) {
      await this.markFailed(notionPageId, error)
      throw new Error(`Failed to process invoice for page: ${notionPageId}`, { cause: error })
    }
  }

  private async markInProgress(pageId: string): Promise<void> {
    this.logger.log(`Marking page ${pageId} as In Progress`)
    await this.updateNotionPageStatusProperty(pageId, InvoiceStatus.InProgress)
  }

  async prepareRendererContext(pageId: string): Promise<InvoiceRendererContext> {
    this.logger.log(`Preparing context for page ${pageId}`)
    const invoiceData = await this.fetchInvoiceData(pageId)
    const [{ currency }] = invoiceData.entries
    const exchange = await this.exchange.getRate(currency as Currency, invoiceData.sale_date ?? invoiceData.issue_date)

    const context: InvoiceRendererContext = {
      ...invoiceData,
      invoice_in_foreign_currency: exchange.rate !== 1,
      currency,
      exchange,
    }

    this.logger.debug('Prepared renderer context', { context })

    return context
  }

  private async renderHTML(context: InvoiceRendererContext) {
    this.logger.log('Rendering HTML for invoice')
    return this.invoiceRenderer.renderInvoiceAsHTML(context)
  }

  private async getOrCreatePdfUrl(context: InvoiceRendererContext, config?: HtmlToPdfOptions): Promise<string> {
    this.logger.log('Resolving PDF for invoice')

    const html = await this.renderHTML(context)
    const htmlHash = createHash('md5').update(html).digest('hex')
    const storagePath = this.buildStoragePath(context, htmlHash)

    const existingPdf = await this.firebaseStorage.exists(storagePath)
    if (!existingPdf) {
      this.logger.log('Generating PDF for invoice')
      const pdf = await this.htmlToPdf.generatePdf(html, config)

      this.logger.log('Saving invoice PDF to Firebase')
      await this.firebaseStorage.save(
        pdf,
        storagePath,
        'application/pdf',
      )
      this.logger.debug('Invoice PDF uploaded to Firebase Storage', { fileName: storagePath.split('/').at(-1)?.split('-')?.[0] })
    }

    return this.firebaseStorage.publicUrl(storagePath)
  }

  private async markReady(pageId: string, url: string, context: InvoiceRendererContext): Promise<void> {
    this.logger.log(`Marking page ${pageId} as Ready with URL ${url}`)
    await this.updateNotionPageInvoiceProperty(pageId, { url, name: context.invoice_number })
    await this.updateNotionPageStatusProperty(pageId, InvoiceStatus.Ready)
  }

  private async markFailed(pageId: string, error: unknown): Promise<void> {
    this.logger.error(`Marking page ${pageId} as Failed`, error)
    await this.updateNotionPageStatusProperty(pageId, InvoiceStatus.Error)
  }

  private async fetchInvoiceData(pageId: string): Promise<InvoiceData> {
    try {
      this.logger.debug(`Retrieving invoice data for page: ${pageId}`)
      const invoiceData = (await this.notion.getNormalizedPageData<InvoiceData>(pageId))
      this.logger.debug('Invoice data retrieved', invoiceData)
      return invoiceData
    } catch (error) {
      this.logger.error(`Error retrieving invoice data for page: ${pageId}`, { cause: error })
      throw new Error(`Failed to retrieve invoice data for page: ${pageId}`, { cause: error })
    }
  }

  private readonly bucketInvoicesRoot = 'invoices'

  private buildStoragePath(invoiceData: InvoiceData, htmlHash: string): string {
    const folderName = invoiceData.issue_date.split('-').slice(0, 2).join('-')
    const fileName = `${invoiceData.client[0].id}-${invoiceData.invoice_number}-${htmlHash}.pdf`
    return [this.bucketInvoicesRoot, folderName, slugify(fileName, { lower: false })].join('/')
  }

  private readonly notionInvoicePropertyName = 'Invoice'

  private async updateNotionPageInvoiceProperty(
    pageId: string,
    { url, name }: { url: string, name: string },
  ): Promise<void> {
    try {
      this.logger.log(`Updating Notion page ${pageId} '${this.notionInvoicePropertyName}' property with URL ${url}`)
      await this.notion.updatePageProperty(pageId, this.notionInvoicePropertyName, { type: 'files', files: [{ name, external: { url } }] })
    } catch (error) {
      this.logger.error(`Error updating Notion page ${pageId} '${this.notionInvoicePropertyName}' property`, { cause: error })
      throw new Error(`Failed to update Notion page ${pageId} '${this.notionInvoicePropertyName}' property`, { cause: error })
    }
  }

  private readonly notionInvoiceStatusName = 'Status'

  private async updateNotionPageStatusProperty(
    pageId: string,
    status: InvoiceStatus,
  ): Promise<void> {
    try {
      this.logger.log(`Updating Notion page ${pageId} '${this.notionInvoiceStatusName}' property with ${status}`)
      await this.notion.updatePageProperty(pageId, this.notionInvoiceStatusName, { type: 'status', status: { name: status } })
    } catch (error) {
      this.logger.warn(`Error updating Notion page ${pageId} '${this.notionInvoiceStatusName}' property`, { cause: error })
    }
  }
}
