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
