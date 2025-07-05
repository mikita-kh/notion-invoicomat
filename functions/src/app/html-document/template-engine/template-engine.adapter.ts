import { I18nService } from '../../i18n/i18n.service'

/**
 * Abstract class for creating template engine adapters.
 * This class ensures that any adapter implementation will have a consistent API for rendering templates.
 */
export abstract class TemplateEngineAdapter {
  constructor(protected readonly i18n: I18nService) {}
  /**
   * Renders a template with the given data.
   * @param data The data to render the template with.
   * @returns A promise that resolves to the rendered HTML string.
   */
  abstract render(template: string, data: Record<string, any>): Promise<string>
}
