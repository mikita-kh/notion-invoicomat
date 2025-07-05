export abstract class FontInlinerAdapter {
  protected cssPathes: string[]
  constructor(protected readonly cssPath: string | string[]) {
    this.cssPathes = Array.isArray(cssPath) ? cssPath : [cssPath]
  }

  abstract fontFamily(): Promise<string[]>
  abstract inline(): Promise<string[]>
}
