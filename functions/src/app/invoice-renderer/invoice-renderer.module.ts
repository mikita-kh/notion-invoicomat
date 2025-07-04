import { Module } from '@nestjs/common'
import { I18nModule } from '../i18n/i18n.module'
import { InvoiceRendererService } from './invoice-renderer.service'
import { ExchangeService } from './services/exchange.service'

@Module({
  imports: [I18nModule],
  providers: [InvoiceRendererService, ExchangeService],
  exports: [InvoiceRendererService, ExchangeService],
})
export class InvoiceRendererModule {}
