import { Module } from '@nestjs/common'
import { InvoiceProcessorModule } from '../invoice-processor/invoice-processor.module'
import { SlackController } from './slack.controller'
import { SlackService } from './slack.service'

@Module({
  imports: [InvoiceProcessorModule],
  controllers: [SlackController],
  providers: [SlackService],
})
export class SlackModule {}
