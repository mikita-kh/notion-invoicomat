import { Injectable } from '@nestjs/common'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'

@Injectable()
export class TailwindService {
  async compileOptimizedCss(htmlContent: string): Promise<string> {
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

    const result = await processor.process(inputCss, { from: undefined })

    return result.css
  }
}
