import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Client as NotionClient, PageObjectResponse } from '@notionhq/client'
import { Cache } from 'cache-manager'
import { InvoiceData } from '../invoice-renderer/types/Invoice'
import { NotionTransformerService } from './notion-transformer.service'

@Injectable()
export class NotionService {
  #client: NotionClient
  #logger = new Logger(NotionService.name)

  constructor(
    private readonly configService: ConfigService,
    private readonly notionTransformerService: NotionTransformerService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.#client = new NotionClient({
      auth: this.configService.get<string>('NOTION_API_KEY'),
    })
  }

  async getNormilizedPageData(id: string) {
    let result = await this.cacheManager.get<InvoiceData>(id)

    if (!result) {
      const { properties } = await this.#retrievePageWithResolvedRelations(id)

      result = this.notionTransformerService.transform<InvoiceData>({
        id,
        properties,
      })

      await this.cacheManager.set(id, result, 3.6e6) // Cache for 1 hour
    }

    return result
  }

  async #retrievePageWithResolvedRelations(id: string, cache = new Map<string, Pick<PageObjectResponse, 'id' | 'properties'>>()) {
    const properties: PageObjectResponse['properties'] = {}

    if (typeof id !== 'string') {
      this.#logger.warn(`Invalid page ID: ${id}`)
      return { properties, id }
    }

    if (cache.has(id)) {
      return cache.get(id)!
    }

    cache.set(id, { properties, id })

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
                .map(relationItem => this.#retrievePageWithResolvedRelations(relationItem.id)),
            ),
          }
        } else {
          properties[propertyName] = propertyValue
        }
      }
    }

    return { id, properties }
  }
}
