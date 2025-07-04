import { Module } from '@nestjs/common'
import { ExchangeModule } from '../exchange/exchange.module'
import { I18nModule } from '../i18n/i18n.module'
import { NunjucksTemplateEngineAdapter } from './adapters/nunjucks-template-engine.adapter'
import { TemplateEngineAdapter } from './adapters/template-engine.adapter'
import { InvoiceRendererService } from './invoice-renderer.service'

@Module({
  imports: [ExchangeModule, I18nModule],
  providers: [
    {
      provide: TemplateEngineAdapter,
      useClass: NunjucksTemplateEngineAdapter,
    },
    InvoiceRendererService,
  ],
  exports: [InvoiceRendererService],
})
export class InvoiceRendererModule {}
