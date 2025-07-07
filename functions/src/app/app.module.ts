import { Module } from '@nestjs/common'

import { AppController } from './app.controller'
import { ConfigModule } from './config/config.module'
import { I18nModule } from './i18n/i18n.module'
import { InvoiceProcessorModule } from './invoice-processor/invoice-processor.module'
import { InvoiceRendererModule } from './invoice-renderer/invoice-renderer.module'
import { NotionModule } from './notion/notion.module'
import { SlackModule } from './slack/slack.module'

@Module({
  imports: [
    ConfigModule,
    I18nModule,
    SlackModule,
    NotionModule,
    InvoiceRendererModule,
    InvoiceProcessorModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
