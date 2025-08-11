import { DynamicModule, Module } from '@nestjs/common'
import { HtmlToPdfService } from './html-to-pdf.service'
import { AdobePdfGenerator } from './pdf-generators/adobe/adobe-pdf-generator.adapter'
import { PdfGenerator } from './pdf-generators/pdf-generator.adapter'
import { PuppeteerPdfGenerator } from './pdf-generators/puppeteer/puppeteer-pdf-generator.adapter'

export interface HtmlToPdfFeatureOptions {
  pdfGenerator?: 'adobe' | 'puppeteer'
}

export interface HtmlToPdfModuleOptions extends HtmlToPdfFeatureOptions {
  global?: boolean
}

@Module({})
export class HtmlToPdfModule {
  private static resolvePdfGenerator(provider: 'adobe' | 'puppeteer') {
    switch (provider) {
      case 'puppeteer':
        return PuppeteerPdfGenerator
      case 'adobe':
        return AdobePdfGenerator
      default:
        throw new Error(
          `Unknown PDF provider: ${provider}. Use 'adobe' or 'puppeteer'`,
        )
    }
  }

  static forRoot({
    pdfGenerator = 'adobe',
    global = true,
  }: HtmlToPdfModuleOptions = {}): DynamicModule {
    const pdfGeneratorClass = this.resolvePdfGenerator(pdfGenerator)

    return {
      module: HtmlToPdfModule,
      global,
      providers: [
        { provide: PdfGenerator, useClass: pdfGeneratorClass },
        HtmlToPdfService,
      ],
      exports: [HtmlToPdfService],
    }
  }

  static forFeature({
    pdfGenerator = 'adobe',
  }: HtmlToPdfFeatureOptions = {}): DynamicModule {
    const pdfGeneratorClass = this.resolvePdfGenerator(pdfGenerator)

    return {
      module: HtmlToPdfModule,
      providers: [
        { provide: PdfGenerator, useClass: pdfGeneratorClass },
        HtmlToPdfService,
      ],
      exports: [HtmlToPdfService],
    }
  }
}
