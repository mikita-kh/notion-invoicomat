import { Buffer } from 'node:buffer'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import chromium from '@sparticuz/chromium'
import puppeteer, { Browser, Page } from 'puppeteer-core'
import { Configuration } from '../../../config/configuration'
import { PdfGenerationOptions, PdfGenerator } from '../pdf-generator.adapter'

@Injectable()
export class PuppeteerPdfGenerator extends PdfGenerator {
  private readonly logger = new Logger(PuppeteerPdfGenerator.name)

  constructor(config: ConfigService<Configuration>) {
    super(config)
  }

  async generatePdf(html: string, options: Required<PdfGenerationOptions>): Promise<Buffer> {
    let browser: Browser | null = null
    let page: Page | null = null

    try {
      browser = await this.launchBrowser()

      page = await browser.newPage()
      page.setDefaultTimeout(0)
      page.setDefaultNavigationTimeout(0)
      page.on('error', (error) => {
        this.logger.error(
          'Error raised while loading template bundle in the browser',
          error,
        )
      })

      await page.setContent(html, { waitUntil: 'networkidle0' })

      const buffer = await page.pdf({
        ...options,
        printBackground: true,
        preferCSSPageSize: false,
      })

      return Buffer.from(buffer)
    } catch (error) {
      this.logger.error(`Failed to generate PDF using Puppeteer`, error)
      throw error
    } finally {
      await page?.close().catch(err => this.logger.warn('Failed to close page', err))
      await browser?.close().catch(err => this.logger.warn('Failed to close browser', err))
    }
  }

  private async launchBrowser(): Promise<Browser> {
    const browser = await puppeteer.launch({
      headless: true,
      defaultViewport: null,
      ...(this.config.get('IS_CLOUD_ENVIRONMENT')
        ? {
            args: chromium.args,
            executablePath: await chromium.executablePath(),
          }
        : {
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-accelerated-2d-canvas',
              '--no-first-run',
              '--no-zygote',
              '--single-process',
              '--disable-gpu',
            ],
            executablePath: puppeteer.executablePath(),
          }),
    })

    return browser
  }
}
