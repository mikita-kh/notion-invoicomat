import { NunjucksTemplateEngineAdapterOptions } from './template-engine/nunjucks/nunjucks-template-engine.adapter'

export interface HtmlDocumentModuleOptions {
  templateEngine: {
    type: 'nunjucks'
    config: NunjucksTemplateEngineAdapterOptions
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
