import { Injectable, Logger } from '@nestjs/common'
import { SlackEvent } from '@slack/types'
import { parsePageId } from 'notion-utils'
import { InvoiceProcessorService } from '../invoice-processor/invoice-processor.service'
import { SlackNotificationService } from './slack-notification.service'

@Injectable()
export class SlackService {
  logger = new Logger(SlackService.name)

  constructor(
    private readonly invoiceProcessor: InvoiceProcessorService,
    private readonly slackNotification: SlackNotificationService,
  ) {}

  async handleEvent(slackEvent: SlackEvent) {
    const notionPageId = this.extractPageIdFromSlackEvent(slackEvent)

    if (notionPageId) {
      try {
        const result = await this.invoiceProcessor.process(notionPageId)
        this.logger.log('Invoice processing completed', result)

        await this.sendSuccessMessage(notionPageId)
      } catch (error) {
        this.logger.error(`Failed to process invoice for page: ${notionPageId}`, error)

        await this.sendErrorMessage(notionPageId, error)
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

  private async sendSuccessMessage(notionPageId: string): Promise<void> {
    const message = {
      text: `✅ Invoice Generated Successfully`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `✅ *Invoice Generated Successfully*\n\n📄 Notion Page: <https://notion.so/${notionPageId}|View Invoice>\n⏰ Processed at: ${new Date().toISOString()}`,
          },
        },
      ],
    }

    await this.slackNotification.sendMessage(message)
  }

  private async sendErrorMessage(notionPageId: string, error: any): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const message = {
      text: `❌ Invoice Generation Failed`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `❌ *Invoice Generation Failed*\n\n🚨 Error: \`${errorMessage}\`\n⏰ Failed at: ${new Date().toISOString()}`,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: '💡 Check the logs for more details or try processing again.',
            },
          ],
        },
      ],
    }

    await this.slackNotification.sendMessage(message)
  }
}
