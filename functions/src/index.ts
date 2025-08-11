import { Logger } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import express from 'express'
import { onRequest } from 'firebase-functions/v2/https'
import { createNestApp } from './app/main'

const expressInstance = express()
const appInitializer = createNestApp(expressInstance)

let app: NestExpressApplication | null = null

export const webhook = onRequest(
  {
    secrets: [
      'NOTION_API_KEY',
      'SLACK_BOT_TOKEN',
      'SLACK_SIGNING_SECRET',
      'PDF_SERVICES_CLIENT_ID',
      'PDF_SERVICES_CLIENT_SECRET',
    ],
    memory: '256MiB',
    timeoutSeconds: 30,
  },
  async (req, res) => {
    try {
      app ??= await appInitializer
    } catch (initError) {
      console.error('🔥 Failed to initialize Nest app:', initError)
      res.status(500).json({
        error: 'App Initialization Failed',
        message: initError instanceof Error ? initError.message : 'Unknown error',
      })
      return
    }

    try {
      const server = app.getHttpAdapter().getInstance()
      server(req, res)
    } catch (handleError) {
      app.get(Logger).error('💥 Error while handling request:', handleError)
      res.status(500).json({
        error: 'Request Handling Failed',
        message: handleError instanceof Error ? handleError.message : 'Unknown error',
      })
    }
  },
)
