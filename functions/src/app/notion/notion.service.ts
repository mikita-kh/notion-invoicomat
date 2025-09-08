import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Client as NotionClient, PageObjectResponse, UpdatePageParameters } from '@notionhq/client'
import { Configuration } from '../config/configuration'
import { NotionTransformerService } from './notion-transformer.service'

@Injectable()
export class NotionService {
  private readonly logger = new Logger(NotionService.name)
  private readonly client: NotionClient

  constructor(
    private readonly configService: ConfigService<Configuration>,
    private readonly notionTransformerService: NotionTransformerService,
  ) {
    this.client = new NotionClient({
      auth: this.configService.getOrThrow('NOTION_API_KEY'),
    })
  }

  async getNormalizedPageData<T extends Record<string, any> = Record<string, any>>(id: string) {
    const { properties } = await this.#retrievePageWithResolvedRelations(id)

    return this.notionTransformerService.transform<T>({
      id,
      properties,
    })
  }

  async getPageProperties(pageId: string) {
    const getPageResponse = await this.client.pages.retrieve({
      page_id: pageId,
    })

    if ('properties' in getPageResponse) {
      return getPageResponse.properties
    }

    return {}
  }

  getPagePropertyById(pageId: string, propertyId: string) {
    return this.client.pages.properties.retrieve({
      page_id: pageId,
      property_id: propertyId,
    })
  }

  async #retrievePageWithResolvedRelations(id: string, resolved = new Map<string, true>()) {
    const properties: PageObjectResponse['properties'] = {}

    if (typeof id !== 'string') {
      this.logger.warn(`Invalid page ID: ${id}`)
      return { properties, id }
    }

    if (resolved.has(id)) {
      return { properties, id }
    }

    resolved.set(id, true)

    const page = await this.client.pages
      .retrieve({ page_id: id })

    if ('properties' in page) {
      for (const [propertyName, propertyValue] of Object.entries(page.properties)) {
        if (propertyValue.type === 'relation') {
          properties[propertyName] = {
            ...propertyValue,
            relation: await Promise.all(
              propertyValue.relation
                .filter(relationItem => Boolean(relationItem.id))
                .map(relationItem => this.#retrievePageWithResolvedRelations(relationItem.id, resolved)),
            ),
          }
        } else {
          properties[propertyName] = propertyValue
        }
      }
    }

    return { id, properties }
  }

  async updatePageProperty(pageId: string, propertyName: string, propertyValue: NonNullable<UpdatePageParameters['properties']>[string]): Promise<void> {
    try {
      this.logger.debug(`Updating page ${pageId} property ${propertyName}`)

      await this.client.pages.update({
        page_id: pageId,
        properties: {
          [propertyName]: propertyValue,
        },
      })

      this.logger.log(`Page property updated successfully: ${pageId}.${propertyName}`)
    } catch (error) {
      this.logger.error(`Error updating page property: ${pageId}.${propertyName}`, error)
      throw error
    }
  }
}
