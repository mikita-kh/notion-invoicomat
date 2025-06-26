import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import { Injectable, OnModuleInit } from '@nestjs/common'
import fg from 'fast-glob'
import { IntlMessageFormat } from 'intl-messageformat'

type LocaleMap = Record<string, Record<string, string>>

@Injectable()
export class I18nService implements OnModuleInit {
  #messages: LocaleMap = {}

  async onModuleInit() {
    const files = await fg('locales/*.json', { cwd: __dirname, absolute: true })

    this.#messages = Object.fromEntries(
      await Promise.all(
        files.map(async (file) => {
          const lang = basename(file, '.json')
          return [lang, JSON.parse(await readFile(file, 'utf-8'))]
        }),
      ),
    )
  }

  t(key: string, lang = 'en', vars: Record<string, any>): string {
    const msg = this.#messages[lang]?.[key]
    if (!msg)
      return `[${key}]`

    if (!vars) {
      return msg
    }

    try {
      return new IntlMessageFormat(msg, lang).format(vars) as string
    } catch {
      return `[${key}]`
    }
  }
}

/*
import { LocaleConfig, LocaleInterface } from '../types';

export default class Locale implements LocaleInterface {
  public config: LocaleConfig = {
    currency: {
      name: 'Złoty',
      plural: 'Złote',
      singular: 'Złoty',
      symbol: 'zł',
      fractionalUnit: {
        name: 'Grosz',
        singular: 'Grosz',
        plural: 'Groszy',
        symbol: 'gr',
      },
    },
    texts: {
      and: 'i',
      minus: 'minus',
      only: 'tylko',
      point: 'przecinek',
    },
    numberWordsMapping: [
      { number: 1000000000, value: 'miliard', singularValue: 'miliard' },
      { number: 1000000, value: 'milion', singularValue: 'milion' },
      { number: 1000, value: 'tysiąc', singularValue: 'tysiąc' },
      { number: 900, value: 'dziewięćset' },
      { number: 800, value: 'osiemset' },
      { number: 700, value: 'siedemset' },
      { number: 600, value: 'sześćset' },
      { number: 500, value: 'pięćset' },
      { number: 400, value: 'czterysta' },
      { number: 300, value: 'trzysta' },
      { number: 200, value: 'dwieście' },
      { number: 100, value: 'sto' },
      { number: 90, value: 'dziewięćdziesiąt' },
      { number: 80, value: 'osiemdziesiąt' },
      { number: 70, value: 'siedemdziesiąt' },
      { number: 60, value: 'sześćdziesiąt' },
      { number: 50, value: 'pięćdziesiąt' },
      { number: 40, value: 'czterdzieści' },
      { number: 30, value: 'trzydzieści' },
      { number: 20, value: 'dwadzieścia' },
      { number: 19, value: 'dziewiętnaście' },
      { number: 18, value: 'osiemnaście' },
      { number: 17, value: 'siedemnaście' },
      { number: 16, value: 'szesnaście' },
      { number: 15, value: 'piętnaście' },
      { number: 14, value: 'czternaście' },
      { number: 13, value: 'trzynaście' },
      { number: 12, value: 'dwanaście' },
      { number: 11, value: 'jedenaście' },
      { number: 10, value: 'dziesięć' },
      { number: 9, value: 'dziewięć' },
      { number: 8, value: 'osiem' },
      { number: 7, value: 'siedem' },
      { number: 6, value: 'sześć' },
      { number: 5, value: 'pięć' },
      { number: 4, value: 'cztery' },
      { number: 3, value: 'trzy' },
      { number: 2, value: 'dwa' },
      { number: 1, value: 'jeden' },
      { number: 0, value: 'zero' },
    ],
    ignoreOneForWords: ['tysiąc', 'milion', 'miliard'],
    pluralWords: ['milion', 'miliard'],
    pluralMark: 'y',
    splitWord: '',
    onlyInFront: false,
    decimalLengthWordMapping: {
      1: 'dziesiątych',
      2: 'setnych',
      3: 'tysięcznych',
    },
  };
}

 */
