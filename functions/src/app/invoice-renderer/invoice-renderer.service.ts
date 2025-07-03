import { createHash } from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'
import { TemplateEngineService } from './services/template-engine.service'
import { InvoiceData } from './types/Invoice'

@Injectable()
export class InvoiceRendererService {
  logger = new Logger(InvoiceRendererService.name)

  constructor(
    private readonly templateEngineService: TemplateEngineService,
  ) {}

  async renderInvoice(
    data: InvoiceData,
  ): Promise<string> {
    const html = await this.templateEngineService.render(data)
    const css = await this.compileOptimizedCss(html)

    return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">  
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Invoice</title>
                <style>${css}</style>
            </head>
            <body>
                ${html}
            </body>
            </html>`
  }

  #optimizedCss = new Map<string, string>()

  async compileOptimizedCss(htmlContent: string): Promise<string> {
    const hash = createHash('md5').update(htmlContent).digest('hex')

    if (this.#optimizedCss.has(hash)) {
      return this.#optimizedCss.get(hash)!
    }

    const inputCss = `
      @tailwind base;
      @tailwind components;
      @tailwind utilities;
    `

    const config = {
      content: [{ raw: htmlContent, extension: 'html' }],
    }

    const processor = postcss([
      tailwindcss(config),
    ])

    const { css } = await processor.process(inputCss, { from: undefined })

    this.#optimizedCss.set(hash, css)

    return css
  }
}
