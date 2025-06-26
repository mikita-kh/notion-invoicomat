import { Injectable } from '@nestjs/common'
import { TailwindService } from './services/tailwind.service'
import { TemplateEngineService } from './services/template-engine.service'
import { InvoiceData } from './types/Invoice'

@Injectable()
export class InvoiceRendererService {
  constructor(
    private readonly tailwindService: TailwindService,
    private readonly templateEngineService: TemplateEngineService,
  ) {}

  async renderInvoice(
    data: InvoiceData,
  ): Promise<string> {
    // Process the template with Tailwind CSS

    const html = await this.templateEngineService.render(data)
    const css = await this.tailwindService.compileOptimizedCss(html)

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
}
