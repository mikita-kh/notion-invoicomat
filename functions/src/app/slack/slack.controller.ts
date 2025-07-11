import { Body, Controller, Logger, Post, UseGuards } from '@nestjs/common'
import { SlackEvent } from '@slack/types'
import { SlackGuard } from './slack.guard'
import { SlackService } from './slack.service'

@Controller('slack')
export class SlackController {
  private readonly logger = new Logger(SlackController.name)

  constructor(private readonly slackService: SlackService) {}

  @Post('events')
  @UseGuards(SlackGuard(config => config.get<string>('SLACK_NOTION_BOT_ID')!))
  async handleSlackEvent(@Body('event') data: SlackEvent) {
    this.logger.debug('Received Slack event', data)
    // Handle other Slack events
    await this.slackService.handleEvent(data)
    return { status: 'ok' }
  }
}
