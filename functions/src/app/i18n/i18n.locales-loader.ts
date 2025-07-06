import { Dirent } from 'node:fs'
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'

import { Logger } from '@nestjs/common'

export interface I18nTranslation {
  [lang: string]: {
    [ns: string]: {
      [key: string]: string
    }
  }
}

export class I18nLocalesLoader {
  private readonly logger = new Logger(I18nLocalesLoader.name)
  private readonly localesPath = path.join(__dirname, 'locales')

  async languages(): Promise<string[]> {
    const i18nPath = path.normalize(this.localesPath + path.sep)
    const dirs = await readdir(i18nPath, { withFileTypes: true })

    return dirs
      .filter(dir => dir.isDirectory())
      .map(dir => dir.name)
  }

  async translations(): Promise<I18nTranslation> {
    const i18nPath = path.normalize(this.localesPath + path.sep)

    const translations: I18nTranslation = {}

    if (!(await stat(i18nPath))) {
      throw new Error(`i18n path (${i18nPath}) cannot be found`)
    }

    const languages = await this.languages()

    const files = (
      await Promise.all(
        languages
          .map(lang => path.join(i18nPath, lang))
          .map(dirPath => this.getJsonFiles(dirPath)),
      )
    ).flat()

    for (const file of files) {
      const data = this.parseJsonFile(await readFile(file, 'utf8'))

      const [lang] = path.dirname(path.relative(i18nPath, file)).split(path.sep)
      const ns = path.basename(file, '.json')

      translations[lang] ??= {} as I18nTranslation[string]
      translations[lang][ns] ??= data
    }

    return translations
  }

  private async getJsonFiles(dirPath: string): Promise<string[]> {
    const dirs = await readdir(dirPath, { withFileTypes: true })

    const files: Dirent[] = dirs.filter(
      file => file.isFile() && path.extname(file.name) === '.json',
    )

    return files.map(file => path.join(dirPath, file.name))
  }

  private parseJsonFile(content: string): I18nTranslation[string][string] {
    try {
      return JSON.parse(content)
    } catch {
      this.logger.error(`Failed to parse JSON file: ${content}`)
      return {}
    }
  }
}
