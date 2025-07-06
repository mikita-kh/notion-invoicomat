import { Body, Controller, Logger, Post, UseInterceptors } from '@nestjs/common'
import { SlackEvent } from '@slack/types'
import { SlackService } from './slack.service'
import { SlackUrlVerificationInterceptor } from './slack.url-verification.interceptor'

@Controller('slack')
export class SlackController {
  private readonly logger = new Logger(SlackController.name)

  constructor(private readonly slackService: SlackService) {}

  @Post('events')
  @UseInterceptors(SlackUrlVerificationInterceptor)
  async handleSlackEvent(@Body('event') data: SlackEvent) {
    this.logger.debug('Received Slack event', data)
    // Handle other Slack events
    await this.slackService.handleEvent(data)
    return { status: 'ok' }
  }
}
