import { Module } from '@nestjs/common'
import { ExchangeModule } from '../exchange/exchange.module'
import { FirebaseModule } from '../firebase/firebase.module'
import { HtmlToPdfModule } from '../html-to-pdf/html-to-pdf.module'
import { InvoiceRendererModule } from '../invoice-renderer/invoice-renderer.module'
import { NotionModule } from '../notion/notion.module'
import { InvoiceProcessorController } from './invoice-processor.controller'
import { InvoiceProcessorService } from './invoice-processor.service'

@Module({
  controllers: [InvoiceProcessorController],
  imports: [
    ExchangeModule.forFeature({
      adapter: 'nbp',
      baseCurrency: 'PLN',
    }),
    FirebaseModule,
    InvoiceRendererModule,
    HtmlToPdfModule.forFeature({
      pdfGenerator: 'adobe',
    }),
    NotionModule,
  ],
  providers: [InvoiceProcessorService],
  exports: [InvoiceProcessorService],
})
export class InvoiceProcessorModule {}
