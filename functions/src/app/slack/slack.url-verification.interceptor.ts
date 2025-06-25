import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Request, Response } from 'express'
import { EMPTY, Observable } from 'rxjs'
import { SlackService } from './slack.service'

@Injectable()
export class SlackUrlVerificationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp()
    const req = ctx.getRequest<Request>()
    const res = ctx.getResponse<Response>()

    if (SlackService.isUrlVerification(req.body)) {
      res.status(200).json({ challenge: req.body.challenge })
      return EMPTY
    }

    return next.handle()
  }
}
