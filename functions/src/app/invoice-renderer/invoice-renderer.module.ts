import { Module } from '@nestjs/common'
import { ExchangeModule } from '../exchange/exchange.module'
import { HtmlDocumentModule } from '../html-document/html-document.module'
import { I18nModule } from '../i18n/i18n.module'
import { InvoiceRendererService } from './invoice-renderer.service'

@Module({
  imports: [
    ExchangeModule,
    I18nModule,
    HtmlDocumentModule.forFeature({
      templateEngine: {
        type: 'nunjucks',
        config: {
          locale: {
            code: 'en-US',
            currency: 'PLN',
            lang: ['en', 'pl'],
            ns: 'invoice',
          },
        },
      },
      cssCompiler: {
        type: 'tailwind',
      },
      fontInliner: {
        type: 'local',
        config: {
          cssPath: require.resolve('@fontsource-variable/inter'),
        },
      },
    }),
  ],
  providers: [InvoiceRendererService],
  exports: [InvoiceRendererService],
})
export class InvoiceRendererModule {}
