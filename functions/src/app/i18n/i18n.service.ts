import { Injectable, Logger } from '@nestjs/common'
import { IntlMessageFormat } from 'intl-messageformat'
import { I18nFileLoader } from './loaders/i18n.file-loader'
import { I18nTranslation } from './loaders/i18n.loader'

@Injectable()
export class I18nService {
  #logger = new Logger(I18nService.name)

  #fallbackLanguage = 'en'

  #defaultNamespace = 'translation'

  private translations = new Map<string, I18nTranslation[string]>()

  constructor(private readonly loader: I18nFileLoader) {}

  async loadTranslations() {
    try {
      this.translations.clear()
      this.#logger.log('Loading translations...')
      const translations = await this.loader.translations()

      for (const [lang, data] of Object.entries(translations)) {
        this.translations.set(lang, data)
      }
    } catch (error) {
      this.#logger.error('Failed to load translations:', error)
      throw error
    }
  }

  t(key: string, { lang = this.#fallbackLanguage, args, ns = this.#defaultNamespace }: { lang?: string, args?: Record<string, any>, ns?: string } = {}): string {
    const translations = this.translations.get(lang) || this.translations.get(this.#fallbackLanguage) || {}

    let translationTemplate = translations[ns]?.[key] ?? key

    if (Object(args) === args && Object.keys(args as object).length > 0) {
      try {
      // Use IntlMessageFormat for advanced formatting
        const formatter = new IntlMessageFormat(translationTemplate, lang)
        return formatter.format(args || {}) as string
      } catch (error) {
        this.#logger.warn(`IntlMessageFormat error for key "${key}":`, error)

        Object.entries(args as object).forEach(([argKey, value]) => {
          translationTemplate = translationTemplate.replace(new RegExp(`{${argKey}}`, 'g'), String(value))
        })
      }
    }

    return translationTemplate
  }
}
