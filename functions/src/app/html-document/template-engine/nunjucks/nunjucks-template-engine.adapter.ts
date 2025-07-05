import { Buffer } from 'node:buffer'
import path from 'node:path'

import { Injectable } from '@nestjs/common'
import { Environment, FileSystemLoader } from 'nunjucks'
import { ToWords } from 'to-words'

import { I18nService } from '../../../i18n/i18n.service'
import { TemplateEngineAdapter, TemplateEngineAdapterOptions } from '../template-engine.adapter'

@Injectable()
export class NunjucksTemplateEngineAdapter extends TemplateEngineAdapter {
  #environment = new Environment(new FileSystemLoader(path.join(__dirname, `templates`), { watch: false, noCache: true }))

  constructor(protected readonly i18n: I18nService, options: TemplateEngineAdapterOptions) {
    super(i18n, options)

    this.#environment.addGlobal('_', this.#translate.bind(this))
    this.#environment.addGlobal('currency', this.currency)
    this.#environment.addGlobal('locale', this.localeCode)
    this.#environment.addGlobal('primaryLanguage', this.primaryLanguage)
    this.#environment.addGlobal('secondaryLanguage', this.secondaryLanguage)

    this.#environment.addFilter('format_number', this.#makeFormatNumberFilter())
    this.#environment.addFilter('format_price', this.#makeFormatPriceFilter())
    this.#environment.addFilter('to_words', this.#makeToWordsFilter())
    this.#environment.addFilter('to_base64', this.#makeToBase64Filter(), true)
  }

  #makeFormatNumberFilter() {
    return (number: number, minmaxFractionDigits = 2) => {
      return Number(number).toLocaleString(this.localeCode, {
        minimumFractionDigits: +minmaxFractionDigits,
        maximumFractionDigits: +minmaxFractionDigits,
      })
    }
  }

  #formatPrice(price: number, currency = this.currency) {
    return Number(price).toLocaleString(this.localeCode, {
      currency,
      style: 'currency',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      currencyDisplay: 'code',
      useGrouping: true,
    })
  }

  #makeFormatPriceFilter() {
    return (price: number, currency = this.currency) => {
      return this.#formatPrice(price, currency)
    }
  }

  #translate(key: string, lang = this.primaryLanguage, args: Record<string, any>) {
    return this.i18n.t(key, { lang, args, ns: this.options.locale.ns })
  }

  #makeToBase64Filter() {
    return async (url: string, callback: (error: Error | null, uri?: string) => void) => {
      const response = await fetch(url)

      if (!response.ok) {
        callback(new Error(`Failed to fetch image: ${response.statusText}`))
      }

      const contentType = response.headers.get('content-type') ?? 'image/png'
      const arrayBuffer = await response.arrayBuffer()
      callback(null, `data:${contentType};base64,${Buffer.from(arrayBuffer).toString('base64')}`)
    }
  }

  #makeToWordsFilter() {
    const currencyOptionsMap = {
      PLN: {
        name: 'Polish zloty',
        plural: 'Polish zloty',
        symbol: '',
        fractionalUnit: {
          name: 'gr',
          plural: 'gr',
          symbol: '',
        },
      },
      EUR: {
        name: 'Euro',
        plural: 'Euro',
        symbol: '€',
        fractionalUnit: {
          name: 'cent',
          plural: 'cents',
          symbol: '',
        },
      },
      USD: {
        name: 'US dollar',
        plural: 'US dollars',
        symbol: '$',
        fractionalUnit: {
          name: 'cent',
          plural: 'cents',
          symbol: '',
        },
      },
    }

    const toWords = new ToWords({
      localeCode: 'en-US',
      converterOptions: {
        currency: true,
        ignoreDecimal: false,
        ignoreZeroCurrency: false,
        doNotAddOnly: true,
      },
    })

    return (price: number, currency = this.currency) => {
      return toWords.convert(price, { currencyOptions: currencyOptionsMap[currency] })
    }
  }

  async render(template: string, context: Record<string, any>): Promise<string> {
    if (!template.endsWith('.njk')) {
      template += '.njk'
    }

    const htmlContent = await this.#renderTemplate(template, context)

    return htmlContent
  }

  async #renderTemplate(template: string, context: Record<string, any>): Promise<string> {
    return new Promise((resolve, reject) => {
      this.#environment.render(template, context, (err, res) => {
        if (err || res === null) {
          reject(err)
        } else {
          resolve(res)
        }
      })
    })
  }
}
