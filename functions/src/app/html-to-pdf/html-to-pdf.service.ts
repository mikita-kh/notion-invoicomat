import { Buffer } from 'node:buffer'
import os from 'node:os'
import process from 'node:process'

import { Injectable, Logger } from '@nestjs/common'
import chromium from '@sparticuz/chromium'
import puppeteer, { LaunchOptions } from 'puppeteer-core'

export interface HtmlToPdfOptions {
  format?: 'A4' | 'A3' | 'Letter' | 'Legal'
  orientation?: 'portrait' | 'landscape'
  margin?: {
    top?: string
    bottom?: string
    left?: string
    right?: string
  }
  printBackground?: boolean
  displayHeaderFooter?: boolean
  headerTemplate?: string
  footerTemplate?: string
  scale?: number
  width?: string
  height?: string
  pageRanges?: string
  preferCSSPageSize?: boolean
}

@Injectable()
export class HtmlToPdfService {
  private readonly logger = new Logger(HtmlToPdfService.name)

  async generatePdf(html: string, options: HtmlToPdfOptions = {}): Promise<Buffer> {
    this.logger.debug('Generating PDF with Puppeteer')

    const isCloudFunctionEnvironment = Boolean(process.env.FUNCTION_TARGET)

    const defaultLaunchOptions: LaunchOptions = {
      defaultViewport: {
        deviceScaleFactor: 1,
        hasTouch: false,
        height: 1080,
        isLandscape: true,
        isMobile: false,
        width: 1920,
      },
      headless: true,
    }

    const browser = await (isCloudFunctionEnvironment
      ? puppeteer.launch({
          ...defaultLaunchOptions,
          args: [...chromium.args, '--disable-dev-shm-usage'],
          executablePath: await chromium.executablePath(),
          userDataDir: os.tmpdir(),
        })
      : puppeteer.launch(defaultLaunchOptions))

    try {
      const page = await browser.newPage()

      await page.setContent(html, { waitUntil: 'networkidle0' })

      const pdfBuffer = await page.pdf({
        format: options.format || 'A4',
        landscape: options.orientation === 'landscape',
        margin: options.margin || {
          top: '2rem',
          bottom: '2rem',
          left: '2rem',
          right: '2rem',
        },
        printBackground: options.printBackground ?? true,
        displayHeaderFooter: options.displayHeaderFooter ?? false,
        headerTemplate: options.headerTemplate || '',
        footerTemplate: options.footerTemplate || '',
        scale: options.scale || 1,
        width: options.width,
        height: options.height,
        pageRanges: options.pageRanges,
        preferCSSPageSize: options.preferCSSPageSize ?? false,
      })

      this.logger.debug('PDF generated successfully')
      return Buffer.from(pdfBuffer)
    } catch (error) {
      this.logger.error('Error generating PDF:', error)
      throw error
    } finally {
      await browser.close()
    }
  }
}
