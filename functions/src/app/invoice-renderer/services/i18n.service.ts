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
