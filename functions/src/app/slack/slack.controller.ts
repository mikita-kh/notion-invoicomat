import { Controller, Inject, Post, Req, Res } from '@nestjs/common'
import { ExpressReceiver } from '@slack/bolt'
import { Request, Response } from 'express'
import { SLACK_RECEIVER } from './slack.constants'

@Controller('slack')
export class SlackController {
  constructor(@Inject(SLACK_RECEIVER) private readonly receiver: ExpressReceiver) {}

  @Post('events')
  async handleSlackEvent(@Req() req: Request, @Res() res: Response): Promise<void> {
    this.receiver.app(req, res)
  }
}
