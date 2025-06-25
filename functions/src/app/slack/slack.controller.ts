import { Body, Controller, Post, UseInterceptors } from '@nestjs/common'
import { SlackEvent } from '@slack/types'
import { SlackService } from './slack.service'
import { SlackUrlVerificationInterceptor } from './slack.url-verification.interceptor'

@Controller('slack')
export class SlackController {
  constructor(private readonly slackService: SlackService) {}

  @Post('events')
  @UseInterceptors(SlackUrlVerificationInterceptor)
  handleSlackEvent(@Body('event') data: SlackEvent) {
    // Handle other Slack events
    this.slackService.handleEvent(data)
  }
}
