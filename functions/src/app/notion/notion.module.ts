import { CacheModule } from '@nestjs/cache-manager'
import { Module } from '@nestjs/common'
import { NotionTransformerService } from './notion-transformer.service'
import { NotionService } from './notion.service'

@Module({
  imports: [CacheModule.register()],
  providers: [NotionService, NotionTransformerService],
  exports: [NotionService],
})
export class NotionModule {}
