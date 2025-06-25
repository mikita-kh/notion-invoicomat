import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Client as NotionClient, PageObjectResponse } from '@notionhq/client'
import { NotionTransformerService } from './notion-transformer.service'

@Injectable()
export class NotionService {
  #client: NotionClient
  #cache = new Map()

  constructor(
    private readonly configService: ConfigService,
    private readonly notionTransformerService: NotionTransformerService,
  ) {
    this.#client = new NotionClient({
      auth: this.configService.get<string>('NOTION_API_KEY'),
    })
  }

  async getNormilizedPageData(id: string) {
    this.#cache.clear()

    const { properties } = await this.#retrievePageWithResolvedRelations({ id })

    return this.notionTransformerService.transform({
      id,
      properties,
    })
  }

  async #retrievePageWithResolvedRelations({ id }: { id: string }) {
    const properties: PageObjectResponse['properties'] = {}

    if (this.#cache.has(id)) {
      return { properties, id }
    }

    this.#cache.set(id, true)

    const page = await this.#client.pages
      .retrieve({ page_id: id })

    if ('properties' in page) {
      for (const [propertyName, propertyValue] of Object.entries(page.properties)) {
        if (propertyValue.type === 'relation') {
          properties[propertyName] = {
            ...propertyValue,
            relation: await Promise.all(
              propertyValue.relation.map(relationItem => this.#retrievePageWithResolvedRelations({ id: relationItem.id })),
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
