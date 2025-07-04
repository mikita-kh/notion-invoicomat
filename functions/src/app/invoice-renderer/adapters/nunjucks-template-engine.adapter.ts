import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { Injectable } from '@nestjs/common'
import { Environment, FileSystemLoader } from 'nunjucks'
import postcss from 'postcss'
import tailwindcss, { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'
import { ToWords } from 'to-words'

import { ExchangeService } from '../../exchange/exchange.service'
import { I18nService } from '../../i18n/i18n.service'
import { InvoiceData } from '../invoice-renderer.interfaces'

type SupportedCurrency = 'PLN' | 'EUR' | 'USD'

@Injectable()
export class NunjucksTemplateEngineAdapter {
  #environment = new Environment(new FileSystemLoader(path.join(__dirname, `templates`), { watch: false, noCache: true }))
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
    return this.i18n.t(key, { lang, args, ns: this.#ns })
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
    const invoiceInForeignCurrency = currency !== this.#defaultCurrency
    let exchange = { rate: 1, currency, no: '', date: '' }

    if (invoiceInForeignCurrency) {
      exchange = await this.exchange.getRate(currency, data.sale_date ?? data.issue_date)
    }

    const context = {
      ...data,
      invoice_in_foreign_currency: invoiceInForeignCurrency,
      currency,
      exchange,
    }

    const htmlContent = await this.#renderTemplate(context)
    const [fontFamilyName, cssWithInlinedFonts] = await this.#loadAndInlineFonts()
    const css = await this.#compileOptimizedCss(htmlContent, fontFamilyName)

    return `<!DOCTYPE html>
            <html lang="en">
              <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Invoice</title>
                  <style>${cssWithInlinedFonts}</style>
                  <style>${css}</style>
              </head>
              <body>
                  ${htmlContent}
              </body>
            </html>`
  }

  async #renderTemplate(context: Record<string, any>): Promise<string> {
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

  async #compileOptimizedCss(htmlContent: string, fontFamilyName: string): Promise<string> {
    const inputCss = `
      @tailwind base;
      @tailwind components;
      @tailwind utilities;
    `

    const config: Config = {
      content: [{ raw: htmlContent, extension: 'html' }],
      theme: {
        extend: {
          fontFamily: {
            ...defaultTheme.fontFamily,
            sans: [fontFamilyName, ...defaultTheme.fontFamily.sans],
          },
        },
      },
    }

    const processor = postcss([
      tailwindcss(config),
    ])

    const { css } = await processor.process(inputCss, { from: undefined })

    return css
  }

  async #loadAndInlineFonts() {
    const cssPath = require.resolve('@fontsource-variable/inter')
    const cssWithFonts = await readFile(cssPath, 'utf-8')
    const fontFamilyName = cssWithFonts.match(/font-family:\s*['"]([^'"]+)['"]/)![1]!

    return [fontFamilyName, (await Promise.all(
      cssWithFonts.split(/(url\([^)]+\))/).map(async (part) => {
        if (part.startsWith('url(')) {
          const relativePath = part.slice(4, -1).replace(/['"]/g, '')
          const fontFilePath = path.resolve(path.dirname(cssPath), relativePath)

          return `url('data:font/${path.extname(fontFilePath).slice(1)};base64,${(await readFile(fontFilePath)).toString('base64')}')`
        }
        return part
      }),
    )).join('')]
  }
}
