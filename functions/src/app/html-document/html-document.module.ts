import { DynamicModule, forwardRef, Module, Provider } from '@nestjs/common'
import { I18nModule } from '../i18n/i18n.module'
import { I18nService } from '../i18n/i18n.service'
import { CssCompilerAdapter } from './css-compiler/css-compiler.adapter'
import { TailwindCssCompiler } from './css-compiler/tailwind/tailwind-css-compiler.adapter'
import { FontInlinerAdapter } from './font-inliner/font-inliner.adapter'
import { LocalFontInlinerAdapter } from './font-inliner/local/local-font-inliner.adapter'
import { RemoteFontInlinerAdapter } from './font-inliner/remote/remote-font-inliner.adapter'
import { HTML_DOCUMENT_MODULE_OPTIONS } from './html-document.constants'
import { HtmlDocumentModuleOptions } from './html-document.interfaces'
import { HtmlDocumentService } from './html-document.service'
import { NunjucksTemplateEngineAdapter } from './template-engine/nunjucks/nunjucks-template-engine.adapter'
import { TemplateEngineAdapter } from './template-engine/template-engine.adapter'

@Module({})
export class HtmlDocumentModule {
  static forRoot(options: HtmlDocumentModuleOptions): DynamicModule {
    const providers = this.createProviders(options)

    return {
      module: HtmlDocumentModule,
      imports: [I18nModule],
      providers: [
        {
          provide: HTML_DOCUMENT_MODULE_OPTIONS,
          useValue: options,
        },
        ...providers,
        HtmlDocumentService,
      ],
      exports: [HtmlDocumentService],
      global: false,
    }
  }

  static forFeature(options: HtmlDocumentModuleOptions): DynamicModule {
    const providers = this.createProviders(options)

    return {
      module: HtmlDocumentModule,
      imports: [forwardRef(() => I18nModule)],
      providers: [
        {
          provide: HTML_DOCUMENT_MODULE_OPTIONS,
          useValue: options,
        },
        ...providers,
        HtmlDocumentService,
      ],
      exports: [HtmlDocumentService],
    }
  }

  private static createProviders(options: HtmlDocumentModuleOptions): Provider[] {
    const providers: Provider[] = []

    // Template Engine Provider
    providers.push(this.createTemplateEngineProvider(options.templateEngine))

    // CSS Compiler Provider
    providers.push(this.createCssCompilerProvider(options.cssCompiler))

    // Font Inliner Provider
    providers.push(this.createFontInlinerProvider(options.fontInliner))

    return providers
  }

  private static createTemplateEngineProvider(options: HtmlDocumentModuleOptions['templateEngine']): Provider {
    const type = options?.type || 'nunjucks'

    switch (type) {
      case 'nunjucks':
        return {
          provide: TemplateEngineAdapter,
          useFactory: (i18nService: I18nService) => new NunjucksTemplateEngineAdapter(i18nService, options.config),
          inject: [I18nService],
        }
      default:
        throw new Error(`Unknown template engine type: ${type}`)
    }
  }

  private static createCssCompilerProvider(options: HtmlDocumentModuleOptions['cssCompiler']): Provider {
    switch (options.type) {
      case 'tailwind':
        return {
          provide: CssCompilerAdapter,
          useClass: TailwindCssCompiler,
        }
      default:
        throw new Error(`Unknown CSS compiler type: ${options.type}`)
    }
  }

  private static createFontInlinerProvider(options: HtmlDocumentModuleOptions['fontInliner']): Provider {
    switch (options.type) {
      case 'local':
        return {
          provide: FontInlinerAdapter,
          useFactory: () => new LocalFontInlinerAdapter(options.config.cssPath),
        }
      case 'remote':
        return {
          provide: FontInlinerAdapter,
          useFactory: () => new RemoteFontInlinerAdapter(options.config.cssPath, { cacheFonts: !!options.config.cacheFonts }),
        }
      default:
        throw new Error(`Unknown font inliner type: ${options.type}`)
    }
  }
}
