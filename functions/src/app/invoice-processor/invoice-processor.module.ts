import { Module } from '@nestjs/common'
import { ExchangeModule } from '../exchange/exchange.module'
import { FirebaseModule } from '../firebase/firebase.module'
import { InvoiceRendererModule } from '../invoice-renderer/invoice-renderer.module'
import { NotionModule } from '../notion/notion.module'
import { InvoiceProcessorService } from './invoice-processor.service'
import { InvoiceProcessorController } from './invoice-renderer.controller'

@Module({
  controllers: [InvoiceProcessorController],
  imports: [
    ExchangeModule.forFeature({
      adapter: 'nbp',
      baseCurrency: 'PLN',
    }),
    FirebaseModule,
    InvoiceRendererModule,
    NotionModule,
  ],
  providers: [InvoiceProcessorService],
  exports: [InvoiceProcessorService],
})
export class InvoiceProcessorModule {}
