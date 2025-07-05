import { I18nService } from '../../i18n/i18n.service'

export type Currency = 'PLN' | 'EUR' | 'USD'

export interface TemplateEngineAdapterOptions {
  locale: {
    ns: string
    code: string
    lang: string | [string, string?]
    currency: Currency
  }
}

/**
 * Abstract class for creating template engine adapters.
 * This class ensures that any adapter implementation will have a consistent API for rendering templates.
 */
export abstract class TemplateEngineAdapter {
  protected currency: Currency
  protected localeCode: string
  protected primaryLanguage: string
  protected secondaryLanguage?: string

  constructor(protected readonly i18n: I18nService, protected readonly options: TemplateEngineAdapterOptions) {
    const { lang } = this.options.locale;
    [this.primaryLanguage, this.secondaryLanguage] = (Array.isArray(lang) ? lang : [lang, undefined]).map(l => l?.toLowerCase()) as [string, string?]
    this.currency = this.options.locale.currency
    this.localeCode = this.options.locale.code
  }
  /**
   * Renders a template with the given data.
   * @param data The data to render the template with.
   * @returns A promise that resolves to the rendered HTML string.
   */
  abstract render(template: string, data: Record<string, any>): Promise<string>
}
