export interface I18nTranslation {
  [lang: string]: {
    [ns: string]: {
      [key: string]: string
    }
  }
}

export abstract class I18nLoader {
  abstract languages(): Promise<string[]>

  abstract translations(): Promise<I18nTranslation>
}
