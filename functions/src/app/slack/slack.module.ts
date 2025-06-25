import { Module } from '@nestjs/common'
import { NotionModule } from '../notion/notion.module'
import { SlackController } from './slack.controller'
import { SlackService } from './slack.service'

@Module({
  imports: [NotionModule],
  controllers: [SlackController],
  providers: [SlackService],
})
export class SlackModule {}
