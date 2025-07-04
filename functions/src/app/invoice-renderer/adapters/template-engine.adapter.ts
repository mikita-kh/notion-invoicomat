import { InvoiceData } from '../invoice-renderer.interfaces'

/**
 * Abstract class for creating template engine adapters.
 * This class ensures that any adapter implementation will have a consistent API for rendering templates.
 */
export abstract class TemplateEngineAdapter {
  /**
   * Renders a template with the given data.
   * @param data The data to render the template with.
   * @returns A promise that resolves to the rendered HTML string.
   */
  abstract render(data: InvoiceData): Promise<string>
}
