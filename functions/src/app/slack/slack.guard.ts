import { CanActivate, ExecutionContext, Inject, Injectable, mixin } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { SlackEvent } from '@slack/types'
import { Request } from 'express'

type PrimitiveBotIdSource = string | string[]
type BotIdSource = PrimitiveBotIdSource | ((config: ConfigService) => PrimitiveBotIdSource)

export function SlackGuard(botIdSource: BotIdSource) {
  @Injectable()
  class SlackGuardMixin implements CanActivate {
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

      return false
    }
  }

  return mixin(SlackGuardMixin)
}
