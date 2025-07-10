import { LOG_LEVELS } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express'
import { Express } from 'express'
import { AppModule } from './app.module'
import 'firebase-functions/logger/compat'

export async function createNestApp(expressInstance: Express): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(expressInstance),
    {
      logger: LOG_LEVELS,
    },
  )

  await app.init()

  return app
}
