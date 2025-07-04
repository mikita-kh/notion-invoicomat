import path from 'node:path'
import { Global, Module, OnModuleInit } from '@nestjs/common'
import { I18nService } from './i18n.service'
import { I18nFileLoader } from './loaders/i18n.file-loader'
import { I18nJsonLoader } from './loaders/i18n.json-loader'

@Global()
@Module({
  providers: [
    I18nService,
    {
      provide: I18nFileLoader,
      useFactory: () => new I18nJsonLoader({
        path: path.join(__dirname, 'locales'),
      }),
    },
  ],
  exports: [I18nService],
})
export class I18nModule implements OnModuleInit {
  constructor(private readonly i18nService: I18nService) {}

  async onModuleInit() {
    await this.i18nService.loadTranslations()
  }
}
