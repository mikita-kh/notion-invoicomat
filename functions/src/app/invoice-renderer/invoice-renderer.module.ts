import path from 'node:path'
import { Module } from '@nestjs/common'
import { ExchangeModule } from '../exchange/exchange.module'
import { HtmlDocumentModule } from '../html-document/html-document.module'
import { HtmlToPdfModule } from '../html-to-pdf/html-to-pdf.module'
import { InvoiceRendererService } from './invoice-renderer.service'

@Module({
  imports: [
    ExchangeModule,
    HtmlToPdfModule,
    HtmlDocumentModule.forFeature({
      templateEngine: {
        type: 'nunjucks',
        config: {
          nunjucks: {
            templatesPath: path.join(__dirname, './templates'),
          },
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
