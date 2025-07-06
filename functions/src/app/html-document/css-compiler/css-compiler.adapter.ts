export interface CssCompilerResult {
  css: string
  sourceMap?: string
  warnings?: string[]
}

export interface CompilerOptions {
  fontFamily?: string
  htmlContent: string
}

export abstract class CssCompilerAdapter {
  abstract compile(options?: CompilerOptions): Promise<CssCompilerResult>
}
