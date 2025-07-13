import { Buffer } from 'node:buffer'
import { Injectable, Logger } from '@nestjs/common'
import slugify from 'slugify'
import { FirebaseStorageService } from '../firebase/firebase-storage.service'
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
    private readonly firebaseStorage: FirebaseStorageService,
  ) {}

  async process(notionPageId: string) {
    try {
      await this.markInProgress(notionPageId)

      const context = await this.prepareContext(notionPageId)
      const pdf = await this.generatePdf(context)
      const url = await this.upload(context, pdf)

      await this.markReady(notionPageId, url, context)
    } catch (error) {
      await this.markFailed(notionPageId, error)
      throw new Error(`Failed to process invoice for page: ${notionPageId}`)
    }
  }

  private async markInProgress(pageId: string): Promise<void> {
    this.logger.log(`Marking page ${pageId} as In Progress`)
    await this.updateNotionPageStatusProperty(pageId, InvoiceStatus.InProgress)
  }

  private async prepareContext(pageId: string): Promise<InvoiceRendererContext> {
    this.logger.log(`Preparing context for page ${pageId}`)
    const invoiceData = await this.fetchInvoiceData(pageId)
    return this.prepareRendererContext(invoiceData)
  }

  private async generatePdf(context: InvoiceRendererContext): Promise<Buffer> {
    this.logger.log('Generating PDF for invoice')
    return this.invoiceRenderer.renderInvoiceAsPDF(context, {
      format: 'A4',
      scale: 0.75,
      printBackground: true,
    })
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
      const invoiceData = (await this.notion.getNormalizedPageData(pageId)) as InvoiceData
      this.logger.debug('Invoice data retrieved', invoiceData)
      return invoiceData
    } catch (error) {
      this.logger.error(`Error retrieving invoice data for page: ${pageId}`, error)
      throw error
    }
  }

  private async prepareRendererContext(data: InvoiceData): Promise<InvoiceRendererContext> {
    this.logger.debug('Preparing renderer context for invoice data:', data)
    return this.invoiceRenderer.prepareRendererContext(data)
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
      this.logger.error(`Error saving invoice PDF to Firebase: ${bucketPath.join('/')}`, error)
      throw error
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
      this.logger.error(`Error updating Notion page ${pageId} '${this.notionInvoicePropertyName}' property`, error)
      throw error
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
      this.logger.error(`Error updating Notion page ${pageId} '${this.notionInvoiceStatusName}' property`, error)
    }
  }
}
