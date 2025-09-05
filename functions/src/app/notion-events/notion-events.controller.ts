import { Body, Controller, HttpStatus, Post, Res, UseGuards } from '@nestjs/common'
import express from 'express'
import { NotionEventsGuard } from './notion-events.guard'
import { NotionWebhookEvent } from './notion-events.interface'
import { NotionEventsService } from './notion-events.service'

@UseGuards(NotionEventsGuard)
@Controller('notion')
export class NotionEventsController {
  constructor(private readonly notionEventsService: NotionEventsService) {}

  @Post('events')
  handleEvent(@Body() body: NotionWebhookEvent, @Res() res: express.Response) {
    this.notionEventsService.processEvent(body)

    res.status(HttpStatus.NO_CONTENT).send()
  }
}
