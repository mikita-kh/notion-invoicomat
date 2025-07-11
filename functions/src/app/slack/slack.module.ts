import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { InvoiceProcessorModule } from '../invoice-processor/invoice-processor.module'
import { SlackNotificationService } from './slack-notification.service'
import { SlackController } from './slack.controller'
import { SlackMiddleware } from './slack.middleware'
import { SlackService } from './slack.service'

@Module({
  imports: [InvoiceProcessorModule],
  controllers: [SlackController],
  providers: [SlackService, SlackNotificationService],
  exports: [SlackNotificationService],
})
export class SlackModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(SlackMiddleware)
      .forRoutes('slack/events')
  }
}
