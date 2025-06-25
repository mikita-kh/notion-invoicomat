import { Buffer } from 'node:buffer'
import { Injectable } from '@nestjs/common'
import { Environment, FileSystemLoader } from 'nunjucks'
import { ToWords } from 'to-words'
import { I18nService } from './i18n.service'

type SupportedCurrency = 'PLN' | 'EUR' | 'USD'

@Injectable()
export class TemplateEngineService {
  #environment = new Environment(new FileSystemLoader(`${__dirname}./templates`, { }))
  #defaultLocale = 'pl-PL'
  #defaultCurrency: SupportedCurrency = 'PLN'
  #invoiceTemplate = 'invoice.njk'

  constructor(private readonly i18n: I18nService) {
    this.#environment.addGlobal('_', this.i18n)
    this.#environment.addGlobal('primaryLanguage', 'en')
    this.#environment.addGlobal('secondaryLanguage', 'pl')

    this.#environment.addFilter('format_number', this.#makeFormatNumberFilter())
    this.#environment.addFilter('format_price', this.#makeFormatPriceFilter())
    this.#environment.addFilter('to_worlds', this.#makeToWordsFilter())
    this.#environment.addFilter('t', this.#makeI18nFilter())
    this.#environment.addFilter('to_base64', this.#makeToBase64Filter())
  }

  #makeFormatNumberFilter() {
    return (number: number, minmaxFractionDigits: number) => {
      return Number(number).toLocaleString(this.#defaultLocale, {
        minimumFractionDigits: +minmaxFractionDigits,
        maximumFractionDigits: +minmaxFractionDigits,
      })
    }
  }

  #makeFormatPriceFilter() {
    return (price: number, currency: SupportedCurrency = this.#defaultCurrency) => {
      return Number(price).toLocaleString(this.#defaultLocale, {
        currency,
        style: 'currency',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        currencyDisplay: 'code',
        useGrouping: true,
      })
    }
  }

  #makeI18nFilter() {
    return (key: string, lang = 'en', vars: Record<string, any>) => this.i18n.t(key, lang, vars)
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
      toWords.convert(price, { currencyOptions: currencyOptionsMap[currency] })
    }
  }

  render(data: any): Promise<string> {
    return new Promise((resolve, reject) => {
      this.#environment.render(this.#invoiceTemplate, data, (err, res) => {
        if (err || res === null) {
          reject(err)
        } else {
          resolve(res)
        }
      })
    })
  }
}
