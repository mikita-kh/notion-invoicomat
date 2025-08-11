import { Inject, Injectable, Logger } from '@nestjs/common'
import { AllMiddlewareArgs, SayArguments, App as SlackApp, SlackEventMiddlewareArgs } from '@slack/bolt'
import { SlackEvent } from '@slack/types'
import { parsePageId } from 'notion-utils'
import { InvoiceProcessorService } from '../invoice-processor/invoice-processor.service'
import { SLACK_APP } from './slack.constants'

@Injectable()
export class SlackService {
  logger = new Logger(SlackService.name)

  constructor(
    @Inject(SLACK_APP) private readonly slackApp: SlackApp,
    private readonly invoiceProcessor: InvoiceProcessorService,
  ) {
    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    this.slackApp.message(args => this.handleEvent(args))
  }

  private async handleEvent({ event: slackEvent, say, client }: SlackEventMiddlewareArgs<'message'> & AllMiddlewareArgs) {
    const { id: notionPageId, url: notionPageUrl } = this.extractNotionPageFromSlackEvent(slackEvent)

    if (notionPageId && notionPageUrl) {
      const processingMessage = await say(this.createProcessingMessage(notionPageUrl))
      const notify = (args: SayArguments) => processingMessage.ts ? client.chat.update({ ts: processingMessage.ts, channel: slackEvent.channel, ...args }) : say(args)
      this.processInvoiceAsync(notionPageId, notionPageUrl, notify).finally(() => {
        this.logger.log('Invoice has been finished for page:', notionPageId)
      })
    }
  }

  private async processInvoiceAsync(
    notionPageId: string,
    notionPageUrl: string,
    notify: (message: SayArguments) => Promise<unknown>,
  ) {
    try {
      await this.invoiceProcessor.process(notionPageId)
      await notify(this.createSuccessMessage(notionPageUrl))
    } catch (error) {
      this.logger.error(`Failed to process invoice for page: ${notionPageId}`, error)
      await notify(this.createErrorMessage(error, notionPageUrl))
    }
  }

  private createProcessingMessage(notionPageUrl: string) {
    return {
      text: `🔄 Processing invoice...`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🔄 *Invoice Processing Started*\n\n📄 Page: <${notionPageUrl}|View in Notion>\n⏰ Started at: ${new Date().toISOString()}`,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: '⚡ Processing your invoice... You\'ll receive a notification when it\'s ready!',
            },
          ],
        },
      ],
    }
  }

  private createSuccessMessage(notionPageUrl: string) {
    return {
      text: `✅ Invoice Generated Successfully!`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `✅ *Invoice Generated Successfully!*\n\n📄 Page: <${notionPageUrl}|View in Notion>\n📎 Your PDF invoice has been generated and saved\n⏰ Completed at: ${new Date().toISOString()}`,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: '🎉 Your invoice is ready! Check your configured storage location for the PDF file.',
            },
          ],
        },
      ],
    }
  }

  private createErrorMessage(error: unknown, notionPageUrl: string) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    return {
      text: `❌ Invoice Generation Failed`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `❌ *Invoice Generation Failed*\n\n� Page: <${notionPageUrl}|View in Notion>\n�🚨 Error: \`${errorMessage}\`\n⏰ Failed at: ${new Date().toISOString()}`,
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*🔧 Troubleshooting Tips:*\n• Check if the Notion page has all required fields\n• Verify your Notion API permissions\n• Ensure the page is properly formatted',
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: '💡 Check the logs for detailed error information or try processing the invoice again.',
            },
          ],
        },
      ],
    }
  }

  private extractNotionPageFromSlackEvent(slackEvent: SlackEvent): { id: string | null, url: string | null } {
    if (slackEvent.type === 'message' && 'blocks' in slackEvent && Array.isArray(slackEvent.blocks)) {
      for (const block of slackEvent.blocks) {
        if ('text' in block && block.text && 'text' in block.text) {
          const pageId = parsePageId(block.text.text)

          if (pageId) {
            const [part] = block.text.text.split(pageId)
            const pageUrl = `${part.slice(block.text.text.lastIndexOf('https://www.notion.so/'))}${pageId}`

            return {
              id: pageId,
              url: pageUrl,
            }
          }
        }
      }
    }
    this.logger.warn('No Notion page ID found in Slack event', slackEvent)
    return { id: null, url: null }
  }
}
