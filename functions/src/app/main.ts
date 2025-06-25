import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'

import once from 'lodash.once'
import { AppModule } from './app.module'
import { FirebaseLogger } from './shared/firebase-logger/firebase-logger'

export const createNestServer = once(async () => {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  app.useLogger(new FirebaseLogger())
  await app.init()

  return app.getHttpAdapter().getInstance()
})
