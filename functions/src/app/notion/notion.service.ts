import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable, Logger, Optional } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Client as NotionClient, PageObjectResponse } from '@notionhq/client'
import { Cache } from 'cache-manager'
import { NotionTransformerService } from './notion-transformer.service'

@Injectable()
export class NotionService {
  #client: NotionClient
  #logger = new Logger(NotionService.name)

  constructor(
    private readonly configService: ConfigService,
    private readonly notionTransformerService: NotionTransformerService,
    @Optional() @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.#client = new NotionClient({
      auth: this.configService.get<string>('NOTION_API_KEY'),
    })
  }

  async getNormilizedPageData(id: string) {
    let result = await this.cacheManager?.get<Record<string, any>>(id)

    if (!result) {
      const { properties } = await this.#retrievePageWithResolvedRelations(id)

      result = this.notionTransformerService.transform({
        id,
        properties,
      })

      await this.cacheManager?.set(id, result)
    }

    return result
  }

  async #retrievePageWithResolvedRelations(id: string, visited = new Map<string, true>()) {
    const properties: PageObjectResponse['properties'] = {}

    if (typeof id !== 'string') {
      this.#logger.warn(`Invalid page ID: ${id}`)
      return { properties, id }
    }

    if (visited.has(id)) {
      return { properties, id }
    }

    visited.set(id, true)

    const page = await this.#client.pages
      .retrieve({ page_id: id })

    if ('properties' in page) {
      for (const [propertyName, propertyValue] of Object.entries(page.properties)) {
        if (propertyValue.type === 'relation') {
          properties[propertyName] = {
            ...propertyValue,
            relation: await Promise.all(
              propertyValue.relation
                .filter(relationItem => Boolean(relationItem.id))
                .map(relationItem => this.#retrievePageWithResolvedRelations(relationItem.id, visited)),
            ),
          }
        } else {
          properties[propertyName] = propertyValue
        }
      }
    }

    return { id, properties }
  }

  async updatePageProperty(pageId: string, propertyName: string, propertyValue: any): Promise<void> {
    try {
      this.#logger.debug(`Updating page ${pageId} property ${propertyName}`)

      await this.#client.pages.update({
        page_id: pageId,
        properties: {
          [propertyName]: propertyValue,
        },
      })

      // Очищаем кэш для этой страницы
      await this.cacheManager?.del(pageId)

      this.#logger.log(`Page property updated successfully: ${pageId}.${propertyName}`)
    } catch (error) {
      this.#logger.error(`Error updating page property: ${pageId}.${propertyName}`, error)
      throw error
    }
  }
}
