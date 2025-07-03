import { Module } from '@nestjs/common'
import { InvoiceRendererService } from './invoice-renderer.service'
import { ExchangeService } from './services/exchange.service'
import { I18nService } from './services/i18n.service'
import { TemplateEngineService } from './services/template-engine.service'

@Module({
  providers: [InvoiceRendererService, I18nService, TemplateEngineService, ExchangeService],
  exports: [InvoiceRendererService, ExchangeService],
})
export class InvoiceRendererModule {}
