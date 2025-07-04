import { Module } from '@nestjs/common'
import { InvoiceRendererService } from './invoice-renderer.service'
import { ExchangeService } from './services/exchange.service'
import { TemplateEngineService } from './services/template-engine.service'

@Module({
  providers: [InvoiceRendererService, TemplateEngineService, ExchangeService],
  exports: [InvoiceRendererService, ExchangeService],
})
export class InvoiceRendererModule {}
