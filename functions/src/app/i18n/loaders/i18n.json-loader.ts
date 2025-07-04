import { Injectable, Logger } from '@nestjs/common'
import { I18nFileLoader } from './i18n.file-loader'

@Injectable()
export class I18nJsonLoader extends I18nFileLoader {
  #logger = new Logger(I18nJsonLoader.name)

  get fileExtname() {
    return 'json'
  }

  parseFile(content: string) {
    try {
      return JSON.parse(content)
    } catch {
      this.#logger.error(`Failed to parse JSON file: ${content}`)
    }

    return {}
  }
}
