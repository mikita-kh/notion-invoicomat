import { Buffer } from 'node:buffer'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Observable } from 'rxjs'
import { Configuration } from '../config/configuration'

@Injectable()
export class NotionEventsGuard implements CanActivate {
  constructor(private readonly configService: ConfigService<Configuration>) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const verificationToken = this.configService.get('NOTION_VERIFICATION_TOKEN', { infer: true })

    if (!verificationToken) {
      return true
    }

    const request = context.switchToHttp().getRequest()

    const calculatedSignature = `sha256=${createHmac('sha256', verificationToken).update(JSON.stringify(request.body)).digest('hex')}`

    return timingSafeEqual(
      Buffer.from(calculatedSignature),
      Buffer.from(request.headers['x-notion-signature']),
    )
  }
}
