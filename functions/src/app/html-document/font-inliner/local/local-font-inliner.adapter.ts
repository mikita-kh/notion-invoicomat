import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { Injectable } from '@nestjs/common'
import { FontInlinerAdapter } from '../font-inliner.adapter'

@Injectable()
export class LocalFontInlinerAdapter extends FontInlinerAdapter {
  constructor(cssPath: string | string[]) {
    super(cssPath, { cacheFonts: true })
  }

  protected async getCssContent(cssPath: string): Promise<string> {
    try {
      const cssContent = await readFile(cssPath, 'utf-8')
      return cssContent
    } catch (error) {
      throw new Error(`Failed to read CSS file at ${cssPath}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  protected async inlineFontUrl(urlPart: string, cssPath: string): Promise<string> {
    const relativePath = urlPart.slice(4, -1).replace(/['"]/g, '')
    const fontFilePath = path.resolve(path.dirname(cssPath), relativePath)

    try {
      const fontBuffer = await readFile(fontFilePath)
      const fontExtension = this.getFontExtensionFromPath(fontFilePath)
      const base64Font = fontBuffer.toString('base64')

      return `url('data:font/${fontExtension};base64,${base64Font}')`
    } catch (error) {
      console.warn(`Failed to inline font from ${fontFilePath}:`, error)
      // Fallback to original URL
      return urlPart
    }
  }

  protected getFontExtensionFromPath(fontPath: string): string {
    return path.extname(fontPath).slice(1).toLowerCase() || 'woff2'
  }
}
