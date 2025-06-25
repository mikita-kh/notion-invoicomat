import { Injectable, Logger } from '@nestjs/common'
import { SlackEvent } from '@slack/types'
import { parsePageId } from 'notion-utils'
import { NotionService } from '../notion/notion.service'

@Injectable()
export class SlackService {
  logger = new Logger(SlackService.name)

  constructor(private readonly notionService: NotionService) {}

  async handleEvent(data: SlackEvent) {
    let notionPageId: string | undefined

    if (data.type === 'message' && 'blocks' in data && Array.isArray(data.blocks)) {
      const sections = data.blocks.filter(this.#isMarkdownSectionBlock, this)

      for (const section of sections) {
        notionPageId = parsePageId(section.text.text)

        if (notionPageId) {
          break
        }
      }
    }

    if (notionPageId) {
      await this.notionService.getNormilizedPageData(notionPageId)
    }
  }

  #isMarkdownSectionBlock(block: any): block is { type: 'section', text: { type: 'mrkdwn', text: string } } {
    return block && block.type === 'section' && 'text' in block && block.text?.type === 'mrkdwn' && typeof block.text.text === 'string'
  }

  static isUrlVerification(data: any): data is { type: 'url_verification', challenge: string } {
    return data && data.type === 'url_verification' && typeof data.challenge === 'string'
  }
}
