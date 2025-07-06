import { Injectable, Logger } from '@nestjs/common'
import { SlackEvent } from '@slack/types'
import { parsePageId } from 'notion-utils'
import { InvoiceProcessorService } from '../invoice-processor/invoice-processor.service'

@Injectable()
export class SlackService {
  logger = new Logger(SlackService.name)

  constructor(
    private readonly invoiceProcessor: InvoiceProcessorService,
  ) {}

  async handleEvent(slackEvent: SlackEvent) {
    const notionPageId = this.extractPageIdFromSlackEvent(slackEvent)

    if (notionPageId) {
      try {
        const result = await this.invoiceProcessor.process(notionPageId)
        this.logger.log('Invoice processing completed', result)
      } catch (error) {
        this.logger.error(`Failed to process invoice for page: ${notionPageId}`, error)
        throw error
      }
    }
  }

  private extractPageIdFromSlackEvent(slackEvent: SlackEvent): string | undefined {
    if (slackEvent.type === 'message' && 'blocks' in slackEvent && Array.isArray(slackEvent.blocks)) {
      for (const block of slackEvent.blocks) {
        if (block && block.type === 'section' && 'text' in block && block.text?.type === 'mrkdwn' && typeof block.text.text === 'string') {
          const pageId = parsePageId(block.text.text)

          if (pageId) {
            return pageId
          }
        }
      }
    }
    this.logger.warn('No Notion page ID found in Slack event', slackEvent)
    return undefined
  }

  static isUrlVerification(data: any): data is { type: 'url_verification', challenge: string } {
    return data && data.type === 'url_verification' && typeof data.challenge === 'string'
  }
}
