import { Module } from '@nestjs/common'

import { AppController } from './app.controller'
import { ConfigModule } from './config/config.module'
import { I18nModule } from './i18n/i18n.module'
import { InvoiceProcessorModule } from './invoice-processor/invoice-processor.module'
import { InvoiceRendererModule } from './invoice-renderer/invoice-renderer.module'
import { NotionEventsModule } from './notion-events/notion-events.module'
import { NotionModule } from './notion/notion.module'
import { SecretManagerModule } from './secret-manager/secret-manager.module'

@Module({
  imports: [
    ConfigModule,
    I18nModule,
    NotionModule,
    InvoiceRendererModule,
    InvoiceProcessorModule,
    SecretManagerModule,
    NotionEventsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
