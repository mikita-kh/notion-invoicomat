import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { FontInlinerAdapter } from '../font-inliner.adapter'

export class LocalFontInlinerAdapter extends FontInlinerAdapter {
  #cache = new Map<string, string>()

  constructor(cssPath: string | string[]) {
    super(cssPath)
  }

  async inline() {
    return Promise.all(
      this.cssPathes.map(cssPath => this.#extractInlinedFontsByLocalPath(cssPath)),
    )
  }

  async fontFamily() {
    return Promise.all(
      this.cssPathes.map(cssPath => this.#extractFontFamilyByLocalPath(cssPath)),
    )
  }

  async #getCssByLocalPath(cssPath: string) {
    if (!this.#cache.has(cssPath)) {
      try {
        const cssContent = await readFile(cssPath, 'utf-8')
        this.#cache.set(cssPath, cssContent)
      } catch (error) {
        throw new Error(`Failed to read CSS file at ${cssPath}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    return this.#cache.get(cssPath)!
  }

  async #extractFontFamilyByLocalPath(cssPath: string): Promise<string> {
    const cssWithFonts = await this.#getCssByLocalPath(cssPath)
    const match = cssWithFonts.match(/font-family:\s*['"]([^'"]+)['"]/)
    if (!match) {
      throw new Error(`Could not extract font family name from CSS at ${cssPath}`)
    }
    return match[1]
  }

  async #extractInlinedFontsByLocalPath(cssPath: string): Promise<string> {
    const cssWithFonts = await this.#getCssByLocalPath(cssPath)

    const parts = cssWithFonts.split(/(url\([^)]+\))/)

    const inlinedParts = await Promise.all(
      parts.map(async (part) => {
        if (part.startsWith('url(')) {
          return this.#inlineFontUrl(part, cssPath)
        }
        return part
      }),
    )

    return inlinedParts.join('')
  }

  async #inlineFontUrl(urlPart: string, cssPath: string): Promise<string> {
    const relativePath = urlPart.slice(4, -1).replace(/['"]/g, '')
    const fontFilePath = path.resolve(path.dirname(cssPath), relativePath)

    const fontBuffer = await readFile(fontFilePath)
    const fontExtension = path.extname(fontFilePath).slice(1)
    const base64Font = fontBuffer.toString('base64')

    return `url('data:font/${fontExtension};base64,${base64Font}')`
  }
}
