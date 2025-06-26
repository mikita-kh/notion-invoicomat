import { Module } from '@nestjs/common'
import { InvoiceRendererService } from './invoice-renderer.service'
import { I18nService } from './services/i18n.service'
import { TailwindService } from './services/tailwind.service'
import { TemplateEngineService } from './services/template-engine.service'

@Module({
  providers: [InvoiceRendererService, TailwindService, I18nService, TemplateEngineService],
  exports: [InvoiceRendererService],
})
export class InvoiceRendererModule {}
