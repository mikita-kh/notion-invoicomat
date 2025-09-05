import { Buffer } from 'node:buffer'
import { Injectable, Logger } from '@nestjs/common'
import { StatusPropertyItemObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import slugify from 'slugify'
import { Currency } from '../exchange/exchange.interfaces'
import { ExchangeService } from '../exchange/exchange.service'
import { FirebaseStorageService } from '../firebase/firebase-storage.service'
import { InvoiceData, InvoiceRendererContext } from '../invoice-renderer/invoice-renderer.interfaces'
import { InvoiceRendererService } from '../invoice-renderer/invoice-renderer.service'
import { NotionService } from '../notion/notion.service'
import { InvoiceStatus } from './invoice-processor.interfaces'

@Injectable()
export class InvoiceProcessorService {
  private readonly logger = new Logger(InvoiceProcessorService.name)

  private notionInvoiceStatusPropertyId: string | null = null

  constructor(
    private readonly notion: NotionService,
    private readonly invoiceRenderer: InvoiceRendererService,
    private readonly exchange: ExchangeService,
    private readonly firebaseStorage: FirebaseStorageService,
  ) {}

  private async shouldProcess(notionPageId: string, propertyIds: string[]) {
    if (!propertyIds.length) {
      this.logger.log(`No properties to process for page ${notionPageId}`)
      return false
    }

    const statusPropertyId = await this.getNotionInvoiceStatusPropertyId(notionPageId)

    const hasStatusProperty = statusPropertyId !== null && propertyIds.includes(statusPropertyId)

    if (hasStatusProperty) {
      const property = await this.notion.getPagePropertyById(notionPageId, statusPropertyId)

      if ((property as StatusPropertyItemObjectResponse).status?.name === InvoiceStatus.ShouldProcess) {
        this.logger.log(`Property ${statusPropertyId} indicates the page should be processed.`)
        return true
      }
    }

    return false
  }

  async process(notionPageId: string, propertyIds: string[]) {
    if (!this.shouldProcess(notionPageId, propertyIds)) {
      return
    }

    try {
      await this.markInProgress(notionPageId)

      const context = await this.prepareRendererContext(notionPageId)
      const pdf = await this.generatePdf(context)
      const url = await this.upload(context, pdf)

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

  private async generatePdf(context: InvoiceRendererContext) {
    this.logger.log('Generating PDF for invoice')
    return this.invoiceRenderer.renderInvoiceAsPDF(context)
  }

  private async upload(context: InvoiceRendererContext, pdf: Buffer): Promise<string> {
    const [bucketRoot, folderName, fileName] = this.buildStoragePath(context)
    return this.uploadToFirebaseStorage(pdf, [bucketRoot, folderName, fileName])
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

  private buildStoragePath(invoiceData: InvoiceData): [string, string, string] {
    const folderName = invoiceData.issue_date.split('-').slice(0, 2).join('-')
    const fileName = `${invoiceData.client[0].id}-${invoiceData.invoice_number}.pdf`
    return [this.bucketInvoicesRoot, folderName, slugify(fileName, { lower: false })]
  }

  private async uploadToFirebaseStorage(
    pdfBuffer: Buffer,
    bucketPath: string[],
  ): Promise<string> {
    try {
      this.logger.log('Saving invoice PDF to Firebase')
      const fileUrl = await this.firebaseStorage.save(
        pdfBuffer,
        bucketPath.join('/'),
        'application/pdf',
      )
      this.logger.debug('Invoice PDF uploaded to Firebase Storage', { fileName: bucketPath.at(-1), fileUrl })
      return fileUrl
    } catch (error) {
      this.logger.error(`Error saving invoice PDF to Firebase: ${bucketPath.join('/')}`, { cause: error })
      throw new Error(`Failed to save invoice PDF to Firebase: ${bucketPath.join('/')}`, { cause: error })
    }
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
      this.logger.error(`Error updating Notion page ${pageId} '${this.notionInvoiceStatusName}' property`, { cause: error })
    }
  }

  async getNotionInvoiceStatusPropertyId(pageId: string) {
    if (!this.notionInvoiceStatusPropertyId) {
      const pageProperties = await this.notion.getPageProperties(pageId)
      this.notionInvoiceStatusPropertyId = pageProperties?.[this.notionInvoiceStatusName]?.id ?? null
    }

    return this.notionInvoiceStatusPropertyId
  }
}
