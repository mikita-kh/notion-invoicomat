import { Dirent } from 'node:fs'
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import set from 'lodash.set'

export interface I18nAbstractLoaderOptions {
  path: string
  includeSubfolders?: boolean
  filePattern?: string
  watch?: boolean
}

export interface I18nTranslation {
  [key: string]: { [key: string]: I18nTranslation | string } | string
}

async function getFiles(dirPath: string): Promise<string[]> {
  const dirs = await readdir(dirPath, {
    withFileTypes: true,
  })

  const files: Dirent[] = []

  for (const file of dirs) {
    if (file.isFile() && path.extname(file.name) === '.json') {
      files.push(file)
    }
  }

  return files.map(file => path.join(dirPath, file.name))
}

export class I18nLoader {
  #path = path.join(__dirname, '/locales/')

  async languages(): Promise<string[]> {
    return this.#parseLanguages()
  }

  async load(): Promise<I18nTranslation> {
    return this.#parseTranslations()
  }

  async #parseTranslations(): Promise<I18nTranslation> {
    const i18nPath = path.normalize(this.#path + path.sep)

    const translations: I18nTranslation = {}

    if (!(await stat(i18nPath))) {
      throw new Error(`i18n path (${i18nPath}) cannot be found`)
    }

    const languages = await this.#parseLanguages()

    const files = (await Promise.all(languages.map(lang => path.join(i18nPath, lang)).map(getFiles))).flat()

    for (const file of files) {
      const data: I18nTranslation = JSON.parse(await readFile(file, 'utf8'))

      const pathParts = [
        ...path
          .dirname(path.relative(i18nPath, file))
          .split(path.sep),
        path.basename(file).split('.')[0],
      ]

      set(translations, pathParts, data)
    }

    return translations
  }

  async #parseLanguages(): Promise<string[]> {
    const i18nPath = path.normalize(this.#path + path.sep)

    const dirs = await readdir(i18nPath, { withFileTypes: true })

    const directories: Dirent[] = []

    for (const dir of dirs) {
      if (dir.isDirectory()) {
        directories.push(dir)
      }
    }

    return directories.map(dir => dir.name)
  }
}
