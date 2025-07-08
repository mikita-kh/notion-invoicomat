import { Module } from '@nestjs/common'
import { NotionTransformerService } from './notion-transformer.service'
import { NotionService } from './notion.service'

@Module({
  providers: [NotionService, NotionTransformerService],
  exports: [NotionService],
})
export class NotionModule {}
