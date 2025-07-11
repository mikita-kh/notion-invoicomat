import { Injectable, NestMiddleware } from '@nestjs/common'
import { NextFunction, Request, Response } from 'express'
import { SlackService } from './slack.service'

@Injectable()
export class SlackMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (SlackService.isUrlVerification(req.body)) {
      const { challenge } = req.body
      res.status(200).send({ challenge })
      return
    }

    next()
  }
}
