import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { ConfigModule } from './config/config.module'
import { InvoiceRendererModule } from './invoice-renderer/invoice-renderer.module'
import { NotionModule } from './notion/notion.module'
import { SlackModule } from './slack/slack.module'

@Module({
  imports: [
    ConfigModule,
    SlackModule,
    NotionModule,
    InvoiceRendererModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
