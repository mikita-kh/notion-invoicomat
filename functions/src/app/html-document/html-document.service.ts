import { forwardRef, Inject, Injectable } from '@nestjs/common'
import { I18nService } from '../i18n/i18n.service'
import { CssCompilerAdapter } from './css-compiler/css-compiler.adapter'
import { FontInlinerAdapter } from './font-inliner/font-inliner.adapter'
import { TemplateEngineAdapter } from './template-engine/template-engine.adapter'

@Injectable()
export class HtmlDocumentService {
  constructor(
    private readonly templateEngine: TemplateEngineAdapter,
    private readonly fontInliner: FontInlinerAdapter,
    private readonly cssCompiler: CssCompilerAdapter,
    @Inject(forwardRef(() => I18nService))
    private readonly i18nService: I18nService,
  ) {}

  async render(template: string, context: Record<string, any>): Promise<string> {
    const html = await this.templateEngine.render(template, context)
    const [fontFamily] = await this.fontInliner.fontFamily()
    const [cssWithInlinedFonts] = await this.fontInliner.inline()
    const css = await this.cssCompiler.compile({
      html,
      fontFamily,
    })

    return `<!DOCTYPE html><html><head><meta charset="UTF-8" /><style>${cssWithInlinedFonts}</style><style>${css}</style></head><body>${html}</body></html>`
  }

  async renderWithI18n(
    template: string,
    context: Record<string, any>,
    locale?: string,
  ): Promise<string> {
    // Добавляем переводы в контекст
    const contextWithI18n = {
      ...context,
      t: (key: string, options?: any) => this.i18nService.t(key, { ...options, locale }),
    }

    return this.render(template, contextWithI18n)
  }
}
