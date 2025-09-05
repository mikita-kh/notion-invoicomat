import { Buffer } from 'node:buffer'
import { InvoiceData } from '../invoice-renderer/invoice-renderer.interfaces'

export interface InvoiceProcessingContext {
  pageId: string
  invoiceData?: InvoiceData
  pdfBuffer?: Buffer
  fileUrl?: string
}

export interface InvoiceProcessingResult {
  success: boolean
  pageId: string
  fileUrl?: string
  fileName?: string
  skipped?: boolean
  error?: string
}

export enum InvoiceStatus {
  ShouldProcess = 'Should process',
  InProgress = 'In progress',
  Ready = 'Ready',
  Error = 'Error',
}
