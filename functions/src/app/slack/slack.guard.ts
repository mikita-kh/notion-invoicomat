import { CanActivate, ExecutionContext, HttpException, HttpStatus, Inject, Injectable, Logger, mixin } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { SlackEvent } from '@slack/types'
import { Request } from 'express'

type PrimitiveBotIdSource = string | string[]
type BotIdSource = PrimitiveBotIdSource | ((config: ConfigService) => PrimitiveBotIdSource)

export function SlackGuard(botIdSource: BotIdSource) {
  @Injectable()
  class SlackGuardMixin implements CanActivate {
    private readonly logger = new Logger(SlackGuardMixin.name)
    constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

    canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest<Request>()

      const { body } = request

      if (body && 'event' in body) {
        const event = body.event as SlackEvent

        if (event && 'bot_id' in event && event.bot_id) {
          let expectedIds = typeof botIdSource === 'function'
            ? botIdSource(this.config)
            : botIdSource

          if (typeof expectedIds === 'string') {
            expectedIds = [expectedIds]
          }

          return Array.isArray(expectedIds) && expectedIds.includes(event.bot_id)
        }
      }

      this.logger.debug('Ignored Slack event', body)
      // Respond with 204 No Content for events not coming from the expected Slack bot(s)
      throw new HttpException('Ignored Slack event', HttpStatus.NO_CONTENT)
    }
  }

  return mixin(SlackGuardMixin)
}
