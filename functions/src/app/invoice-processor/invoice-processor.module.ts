import { Module } from '@nestjs/common'
import { FirebaseModule } from '../firebase/firebase.module'
import { InvoiceRendererModule } from '../invoice-renderer/invoice-renderer.module'
import { NotionModule } from '../notion/notion.module'
import { InvoiceProcessorService } from './invoice-processor.service'

@Module({
  imports: [NotionModule, InvoiceRendererModule, FirebaseModule],
  providers: [InvoiceProcessorService],
  exports: [InvoiceProcessorService],
})
export class InvoiceProcessorModule {}
