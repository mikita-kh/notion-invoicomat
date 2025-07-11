import { Body, Controller, Logger, Post, UseGuards } from '@nestjs/common'
import { GenericMessageEvent, SlackEvent } from '@slack/types'
import { ThrottleBody } from '../shared/decorators/throttle-body.decorator'
import { SlackGuard } from './slack.guard'
import { SlackService } from './slack.service'

interface SlackEventBody {
  event?: GenericMessageEvent
}

@Controller('slack')
export class SlackController {
  private readonly logger = new Logger(SlackController.name)

  constructor(private readonly slackService: SlackService) {}

  @Post('events')
  @UseGuards(SlackGuard(config => config.get<string>('SLACK_NOTION_BOT_ID')!))
  @ThrottleBody(30, (body: SlackEventBody) => `${body.event?.user}:${body.event?.ts}`)
  async handleSlackEvent(@Body() data: { event: SlackEvent }) {
    this.logger.debug('Received Slack event', data)
    // Handle other Slack events
    await this.slackService.handleEvent(data.event)
    return { status: 'ok' }
  }
}
