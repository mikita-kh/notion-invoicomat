import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { InvoiceProcessorModule } from '../invoice-processor/invoice-processor.module'
import { SecretManagerModule } from '../secret-manager/secret-manager.module'
import { NotionEventsController } from './notion-events.controller'
import { NotionEventsMiddleware } from './notion-events.middleware'
import { NotionEventsService } from './notion-events.service'

@Module({
  imports: [InvoiceProcessorModule, SecretManagerModule],
  controllers: [NotionEventsController],
  providers: [NotionEventsService],
})
export class NotionEventsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(NotionEventsMiddleware)
      .forRoutes('notion/events')
  }
}
