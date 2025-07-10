import process from 'node:process'
import { Controller, Get, Logger } from '@nestjs/common'

@Controller()
export class AppController {
  logger = new Logger(AppController.name)

  @Get('health-check')
  async healthCheck() {
    const timestamp = new Date().toISOString()
    const uptime = process.uptime()

    return {
      status: 'ok',
      timestamp,
      uptime: `${Math.floor(uptime)}s`,
      service: 'notion-invoicomat',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    }
  }
}
