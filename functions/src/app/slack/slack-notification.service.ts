import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { GenericMessageEvent } from '@slack/types'

type SlackMessage = Pick<GenericMessageEvent, 'text' | 'blocks'>

@Injectable()
export class SlackNotificationService {
  private readonly logger = new Logger(SlackNotificationService.name)

  constructor(
    private readonly config: ConfigService<{ SLACK_WEBHOOK_URL: string }>,
  ) {}

  async sendMessage(message: SlackMessage): Promise<void> {
    try {
      const webhookUrl = this.config.get<string>('SLACK_WEBHOOK_URL')

      if (!webhookUrl) {
        this.logger.warn('Slack webhook URL is not configured, skipping notification')
        return
      }
      const debugId = new Date().toLocaleString()

      this.logger.debug(`[${debugId}] Sending Slack message`, message)

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      })

      const responseText = await response.text()

      this.logger.debug(`[${debugId}] Slack response: ${response.status} ${responseText}`)

      if (!response.ok) {
        throw new Error(responseText)
      }

      this.logger.log(`[${debugId}] Slack notification sent successfully`)
    } catch (error) {
      this.logger.error('Failed to send Slack notification', error)
    }
  }
}
