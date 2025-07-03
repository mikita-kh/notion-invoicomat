import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import once from 'lodash.once'
import { AppModule } from './app.module'
import 'firebase-functions/logger/compat'

export const createNestServer = once(async () => {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  await app.init()

  return app.getHttpAdapter().getInstance()
})
