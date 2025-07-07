import process from 'node:process'

import { CacheModule } from '@nestjs/cache-manager'
import { Module } from '@nestjs/common'

import { AppController } from './app.controller'
import { ConfigModule } from './config/config.module'
import { I18nModule } from './i18n/i18n.module'
import { InvoiceProcessorModule } from './invoice-processor/invoice-processor.module'
import { InvoiceRendererModule } from './invoice-renderer/invoice-renderer.module'
import { NotionModule } from './notion/notion.module'
import { SlackModule } from './slack/slack.module'

const isDevOrEmulator = process.env.NODE_ENV === 'development' || process.env.FUNCTIONS_EMULATOR === 'true'

@Module({
  imports: [
    ...(isDevOrEmulator
      ? [CacheModule.register({ ttl: 3.6e6, isGlobal: true })] // Cache for 1 hour
      : []),
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
