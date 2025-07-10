import { Buffer } from 'node:buffer'
import { Injectable, Logger } from '@nestjs/common'
import { FirebaseStorageService } from '../firebase/firebase-storage.service'
import { InvoiceData } from '../invoice-renderer/invoice-renderer.interfaces'
import { InvoiceRendererService } from '../invoice-renderer/invoice-renderer.service'
import { NotionService } from '../notion/notion.service'
import { InvoiceStatus } from './invoice-processor.interfaces'

@Injectable()
export class InvoiceProcessorService {
  private readonly logger = new Logger(InvoiceProcessorService.name)

  constructor(
    private readonly notionService: NotionService,
    private readonly invoiceRenderer: InvoiceRendererService,
    private readonly firebaseStorage: FirebaseStorageService,
  ) {}

  async process(notionPageId: string) {
    try {
      await this.updateNotionPageStatusProperty(notionPageId, InvoiceStatus.InProgress)
      const invoiceData = await this.receiveInvoiceData(notionPageId)
      const pdfBuffer = await this.generateInvoicePdf(invoiceData)
      const fileUrl = await this.saveInvoicePdfToFirebase(pdfBuffer, invoiceData)
      await this.updateNotionPageInvoiceProperty(notionPageId, fileUrl)
      await this.updateNotionPageStatusProperty(notionPageId, InvoiceStatus.Ready)
    } catch {
      await this.updateNotionPageStatusProperty(notionPageId, InvoiceStatus.Error)
      throw new Error(`Failed to process invoice for page: ${notionPageId}`)
    }
  }

  private async receiveInvoiceData(pageId: string): Promise<InvoiceData> {
    try {
      this.logger.debug(`Retrieving invoice data for page: ${pageId}`)
      const invoiceData = (await this.notionService.getNormilizedPageData(pageId)) as InvoiceData
      this.logger.debug('Invoice data retrieved', invoiceData)
      return invoiceData
    } catch (error) {
      this.logger.error(`Error retrieving invoice data for page: ${pageId}`, error)
      throw error
    }
  }

  private async generateInvoicePdf(invoiceData: InvoiceData): Promise<Buffer> {
    try {
      this.logger.debug('Rendering invoice PDF', { invoiceData })
      const pdfBuffer = await this.invoiceRenderer.renderInvoice(invoiceData, {
        format: 'A4',
        scale: 0.75,
        printBackground: true,
      })
      this.logger.debug('Invoice PDF rendered successfully')
      return pdfBuffer
    } catch (error) {
      this.logger.error('Error rendering invoice PDF', error)
      throw error
    }
  }

  private async saveInvoicePdfToFirebase(
    pdfBuffer: Buffer,
    invoiceData: InvoiceData,
  ): Promise<string> {
    try {
      this.logger.log('Saving invoice PDF to Firebase')
      const folderName = invoiceData.issue_date.split('-').slice(0, 2).join('-')
      const fileName = `${invoiceData.client[0].id}-${invoiceData.invoice_number}.pdf`
      const bucketPath = `invoices/${folderName}/${fileName}`
      const fileUrl = await this.firebaseStorage.save(
        pdfBuffer,
        bucketPath,
        'application/pdf',
      )
      this.logger.debug('Invoice PDF uploaded to Firebase Storage', { fileName, fileUrl })
      return fileUrl
    } catch (error) {
      this.logger.error(`Error saving invoice PDF to Firebase for page: ${invoiceData.id}`, error)
      throw error
    }
  }

  private readonly notionInvoicePropertyName = 'Invoice'

  private async updateNotionPageInvoiceProperty(
    pageId: string,
    url: string,
  ): Promise<void> {
    try {
      this.logger.log(`Updating Notion page ${pageId} '${this.notionInvoicePropertyName}' property with URL ${url}`)
      await this.notionService.updatePageProperty(pageId, this.notionInvoicePropertyName, { type: 'url', url })
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
      await this.notionService.updatePageProperty(pageId, this.notionInvoiceStatusName, { type: 'select', select: { name: status } })
    } catch (error) {
      this.logger.error(`Error updating Notion page ${pageId} '${this.notionInvoiceStatusName}' property`, error)
    }
  }
}
