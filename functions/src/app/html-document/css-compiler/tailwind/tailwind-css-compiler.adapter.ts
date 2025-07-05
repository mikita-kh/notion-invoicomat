import { Injectable } from '@nestjs/common'
import postcss from 'postcss'
import tailwindcss, { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'
import { CssCompilerAdapter, CssCompilerResult } from '../css-compiler.adapter'

export interface TailwindCompilerOptions {
  fontFamily?: string
  htmlContent: string
}

@Injectable()
export class TailwindCssCompiler extends CssCompilerAdapter {
  private readonly inputCss = `
    @tailwind base;
    @tailwind components;
    @tailwind utilities;
  `

  async compile(options: TailwindCompilerOptions): Promise<CssCompilerResult> {
    const config = this.buildTailwindConfig(options)

    try {
      const processor = postcss([tailwindcss(config)])
      const result = await processor.process(this.inputCss, { from: undefined })

      return {
        css: result.css,
        sourceMap: result.map?.toString(),
        warnings: result.warnings().map(warning => warning.toString()),
      }
    } catch (error) {
      throw new Error(`Tailwind compilation failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private buildTailwindConfig(options: TailwindCompilerOptions): Config {
    const baseConfig: Config = {
      content: [{ raw: options.htmlContent, extension: 'html' }],
      theme: {
        extend: this.buildFontConfig(options.fontFamily),
      },
      plugins: [],
    }

    return baseConfig
  }

  private buildFontConfig(fontFamily?: string): Partial<Config['theme']> {
    if (!fontFamily) {
      return {}
    }

    return {
      fontFamily: {
        ...defaultTheme.fontFamily,
        sans: [fontFamily, ...defaultTheme.fontFamily.sans],
      },
    }
  }
}
