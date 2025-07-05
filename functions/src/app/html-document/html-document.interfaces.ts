import { TemplateEngineAdapterOptions } from './template-engine/template-engine.adapter'

export interface HtmlDocumentModuleOptions {
  templateEngine: {
    type: 'nunjucks'
    config: TemplateEngineAdapterOptions
  }
  cssCompiler: {
    type: 'tailwind'
  }
  fontInliner: {
    type: 'local' | 'remote'
    config: {
      cssPath: string | string[]
      cacheFonts?: boolean
    }
  }
}

export interface HtmlDocumentModuleAsyncOptions {
  imports?: any[]
  inject?: any[]
  useFactory?: (...args: any[]) => HtmlDocumentModuleOptions | Promise<HtmlDocumentModuleOptions>
  useClass?: any
  useExisting?: any
}

export const HTML_DOCUMENT_MODULE_OPTIONS = Symbol('HTML_DOCUMENT_MODULE_OPTIONS')
