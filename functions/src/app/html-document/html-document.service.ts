import { Injectable } from '@nestjs/common'
import { CssCompilerAdapter } from './css-compiler/css-compiler.adapter'
import { FontInlinerAdapter } from './font-inliner/font-inliner.adapter'
import { TemplateEngineAdapter } from './template-engine/template-engine.adapter'

@Injectable()
export class HtmlDocumentService {
  constructor(
    private readonly templateEngine: TemplateEngineAdapter,
    private readonly fontInliner: FontInlinerAdapter,
    private readonly cssCompiler: CssCompilerAdapter,
  ) {}

  async render(template: string, context: Record<string, any>): Promise<string> {
    const htmlContent = await this.templateEngine.render(template, context)
    const [fontFamily] = await this.fontInliner.fontFamily()
    const [cssWithInlinedFonts] = await this.fontInliner.inline()
    const { css } = await this.cssCompiler.compile({
      htmlContent,
      fontFamily,
    })

    return `<!DOCTYPE html><html><head><meta charset="UTF-8" /><style>${cssWithInlinedFonts}</style><style>${css}</style></head><body>${htmlContent}</body></html>`
  }
}
