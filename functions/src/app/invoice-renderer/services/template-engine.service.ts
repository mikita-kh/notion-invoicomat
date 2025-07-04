import { Buffer } from 'node:buffer'
import { join } from 'node:path'
import { Injectable } from '@nestjs/common'
import { Environment, FileSystemLoader } from 'nunjucks'
import { ToWords } from 'to-words'
import { I18nService } from '../../i18n/i18n.service'
import { InvoiceData } from '../types/Invoice'
import { ExchangeService } from './exchange.service'

type SupportedCurrency = 'PLN' | 'EUR' | 'USD'

@Injectable()
export class TemplateEngineService {
  #environment = new Environment(new FileSystemLoader(join(__dirname, `templates`), { watch: false }))
  #defaultLocale = 'pl-PL'
  #primaryLanguage = 'en'
  #secondaryLanguage = 'pl'
  #defaultCurrency: SupportedCurrency = 'PLN'
  #invoiceTemplate = 'invoice.njk'
  #ns = 'invoice'

  constructor(private readonly i18n: I18nService, private readonly exchange: ExchangeService) {
    this.#environment.addGlobal('_', this.#translate.bind(this))
    this.#environment.addGlobal('defaultCurrency', this.#defaultCurrency)
    this.#environment.addGlobal('primaryLanguage', this.#primaryLanguage)
    this.#environment.addGlobal('secondaryLanguage', this.#secondaryLanguage)

    this.#environment.addFilter('format_number', this.#makeFormatNumberFilter())
    this.#environment.addFilter('format_price', this.#makeFormatPriceFilter())
    this.#environment.addFilter('to_words', this.#makeToWordsFilter())
    this.#environment.addFilter('t', this.#makeI18nFilter())
    this.#environment.addFilter('to_base64', this.#makeToBase64Filter(), true)
  }

  #makeFormatNumberFilter() {
    return (number: number, minmaxFractionDigits = 2) => {
      return Number(number).toLocaleString(this.#defaultLocale, {
        minimumFractionDigits: +minmaxFractionDigits,
        maximumFractionDigits: +minmaxFractionDigits,
      })
    }
  }

  #formatPrice(price: number, currency: SupportedCurrency = this.#defaultCurrency) {
    return Number(price).toLocaleString(this.#defaultLocale, {
      currency,
      style: 'currency',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      currencyDisplay: 'code',
      useGrouping: true,
    })
  }

  #makeFormatPriceFilter() {
    return (price: number, currency: SupportedCurrency = this.#defaultCurrency) => {
      return this.#formatPrice(price, currency)
    }
  }

  #makeI18nFilter() {
    return this.#translate.bind(this)
  }

  #translate(key: string, lang = this.#primaryLanguage, args: Record<string, any>) {
    return this.i18n.t(`${this.#ns}.${key}`, { lang, args })
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

    return (price: number, currency: SupportedCurrency = this.#defaultCurrency) => {
      return toWords.convert(price, { currencyOptions: currencyOptionsMap[currency] })
    }
  }

  async render(data: InvoiceData): Promise<string> {
    const [{ currency }] = data.entries
    const invoiceInForeignCurrency = data.cur[0] !== this.#defaultCurrency
    let rate = { mid: 1 }

    if (invoiceInForeignCurrency) {
      ({ rates: [rate] } = (await this.exchange.getRate(data.cur[0], data.sale_date ?? data.issue_date)))
    }

    const context = {
      ...data,
      invoice_in_foreign_currency: invoiceInForeignCurrency,
      currency,
      rate,
    }

    return new Promise((resolve, reject) => {
      this.#environment.render(this.#invoiceTemplate, context, (err, res) => {
        if (err || res === null) {
          reject(err)
        } else {
          resolve(res)
        }
      })
    })
  }
}
