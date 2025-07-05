export interface CssCompilerResult {
  css: string
  sourceMap?: string
  warnings?: string[]
}

export abstract class CssCompilerAdapter<AdapterOptions = Record<string, any>> {
  abstract compile(options?: AdapterOptions): Promise<CssCompilerResult>
}
