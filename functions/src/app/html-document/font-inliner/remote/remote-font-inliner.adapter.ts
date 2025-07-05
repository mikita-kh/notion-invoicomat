import { Buffer } from 'node:buffer'
import { Injectable } from '@nestjs/common'
import { FontInlinerAdapter } from '../font-inliner.adapter'

@Injectable()
export class RemoteFontInlinerAdapter extends FontInlinerAdapter {
  protected async getCssContent(cssUrl: string): Promise<string> {
    try {
      const response = await fetch(cssUrl)

      if (!response.ok) {
        throw new Error(`Failed to fetch CSS: ${response.status} ${response.statusText}`)
      }

      const cssContent = await response.text()

      return cssContent
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }

      throw new Error(`Failed to fetch CSS from ${cssUrl}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  protected async inlineFontUrl(urlPart: string, cssUrl: string): Promise<string> {
    const fontUrl = urlPart.slice(4, -1).replace(/['"]/g, '')

    // Resolve relative URLs
    const { href: absoluteFontUrl } = new URL(fontUrl, cssUrl)

    try {
      const response = await fetch(absoluteFontUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch font: ${response.status} ${response.statusText}`)
      }

      const fontBuffer = await response.arrayBuffer()
      const fontExtension = this.getFontExtensionFromMimeType(response.headers.get('content-type') || '', absoluteFontUrl)
      const base64Font = Buffer.from(fontBuffer).toString('base64')

      return `url('data:font/${fontExtension};base64,${base64Font}')`
    } catch (error) {
      console.warn(`Failed to inline font from ${absoluteFontUrl}:`, error)
      // Fallback to original URL
      return urlPart
    }
  }

  private getFontExtensionFromMimeType(mimeType: string, fallbackUrl: string): string {
    const cleanMimeType = mimeType.split(';')[0].trim().toLowerCase()

    switch (cleanMimeType) {
      case 'font/woff':
      case 'application/font-woff':
        return 'woff'
      case 'font/woff2':
      case 'application/font-woff2':
        return 'woff2'
      case 'font/ttf':
      case 'application/font-ttf':
      case 'font/truetype':
      case 'application/x-font-truetype':
        return 'ttf'
      case 'font/otf':
      case 'application/font-otf':
      case 'font/opentype':
      case 'application/x-font-opentype':
        return 'otf'
      case 'application/vnd.ms-fontobject':
        return 'eot'
      case 'image/svg+xml':
        return 'svg'
      default:
        // console.warn(`Unknown font MIME type: ${mimeType}, falling back to URL extension detection`)
        return this.getFontExtensionFromPath(fallbackUrl)
    }
  }

  protected getFontExtensionFromPath(url: string): string {
    const path = new URL(url).pathname
    const extension = path.split('.').pop()?.toLowerCase()

    switch (extension) {
      case 'woff':
        return 'woff'
      case 'woff2':
        return 'woff2'
      case 'ttf':
        return 'ttf'
      case 'otf':
        return 'otf'
      case 'eot':
        return 'eot'
      case 'svg':
        return 'svg'
      default:
        return 'woff' // Default fallback
    }
  }
}
