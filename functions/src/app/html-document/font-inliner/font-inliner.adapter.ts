export abstract class FontInlinerAdapter {
  protected cssPathes: string[]
  protected cache = new Map<string, string>()

  constructor(protected readonly cssPath: string | string[], protected readonly config?: { cacheFonts?: boolean }) {
    this.cssPathes = Array.isArray(cssPath) ? cssPath : [cssPath]
  }

  async fontFamily(): Promise<string[]> {
    return Promise.all(
      this.cssPathes.map(cssPath => this.extractFontFamily(cssPath)),
    )
  }

  async inline(): Promise<string[]> {
    return Promise.all(
      this.cssPathes.map(cssPath => this.extractInlinedFonts(cssPath)),
    )
  }

  protected async extractFontFamily(cssPath: string): Promise<string> {
    const cssWithFonts = await this.getCssContent(cssPath)
    const match = cssWithFonts.match(/font-family:\s*['"]([^'"]+)['"]/)
    if (!match) {
      throw new Error(`Could not extract font family name from CSS at ${cssPath}`)
    }
    return match[1]
  }

  protected async extractInlinedFonts(cssPath: string): Promise<string> {
    const cssWithFonts = await this.getCssContentByPath(cssPath)
    const parts = cssWithFonts.split(/(url\([^)]+\))/)

    const inlinedParts = await Promise.all(
      parts.map(async (part) => {
        if (part.startsWith('url(')) {
          return this.inlineFontUrl(part, cssPath)
        }
        return part
      }),
    )

    return inlinedParts.join('')
  }

  protected async getCssContentByPath(cssPath: string): Promise<string> {
    const cachedContent = this.getCssContentFromCache(cssPath)

    if (cachedContent) {
      return cachedContent
    }

    const cssContent = await this.getCssContent(cssPath)

    this.addCssContentToCache(cssPath, cssContent)

    return cssContent
  }

  protected getCssContentFromCache(cssPath: string): string | undefined {
    return this.config?.cacheFonts ? this.cache.get(cssPath) : undefined
  }

  protected addCssContentToCache(cssPath: string, cssContent: string): void {
    if (this.config?.cacheFonts) {
      this.cache.set(cssPath, cssContent)
    }
  }

  protected abstract getFontExtensionFromPath(path: string): string
  protected abstract getCssContent(cssPath: string): Promise<string>
  protected abstract inlineFontUrl(urlPart: string, cssPath: string): Promise<string>
}
