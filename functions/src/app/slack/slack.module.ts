import { Module } from '@nestjs/common'
import { InvoiceProcessorModule } from '../invoice-processor/invoice-processor.module'
import { SlackAppProvider } from './providers/slack-app-provider'
import { SlackReceiverProvider } from './providers/slack-receiver-provider'
import { SlackController } from './slack.controller'
import { SlackService } from './slack.service'

@Module({
  imports: [InvoiceProcessorModule],
  controllers: [SlackController],
  providers: [SlackReceiverProvider, SlackAppProvider, SlackService],
  exports: [SlackService],
})
export class SlackModule {}
