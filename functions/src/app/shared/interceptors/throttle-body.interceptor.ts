import { createHash } from 'node:crypto'
import { CallHandler, ExecutionContext, HttpException, HttpStatus, Injectable, NestInterceptor } from '@nestjs/common'
import { LRUCache } from 'lru-cache'

@Injectable()
export class ThrottleBodyInterceptor<Body = any> implements NestInterceptor {
  private readonly cache: LRUCache<string, boolean>

  constructor(private readonly ttlSeconds: number = 30, private readonly getBodyHash = this.createBodyHash) {
    this.cache = new LRUCache<string, boolean>({
      max: 10000,
      ttl: this.ttlSeconds * 1000,
      updateAgeOnGet: false,
      updateAgeOnHas: false,
    })
  }

  intercept(context: ExecutionContext, next: CallHandler) {
    const { body } = context.switchToHttp().getRequest()
    const bodyHash = this.getBodyHash(body)

    if (this.cache.has(bodyHash)) {
      throw new HttpException(
        `Duplicate request detected. Please wait ${this.ttlSeconds} seconds before retrying.`,
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }

    this.cache.set(bodyHash, true)

    return next.handle()
  }

  private createBodyHash(body: Body): string {
    try {
      const bodyString = typeof body === 'string' ? body : JSON.stringify(body)
      return createHash('sha256').update(bodyString, 'utf8').digest('hex')
    } catch {
      // Fallback для случаев, когда JSON.stringify не работает
      return createHash('sha256').update(String(body), 'utf8').digest('hex')
    }
  }
}
