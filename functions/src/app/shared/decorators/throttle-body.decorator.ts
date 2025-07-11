import { UseInterceptors } from '@nestjs/common'
import { ThrottleBodyInterceptor } from '../interceptors/throttle-body.interceptor'

export function ThrottleBody<Body = any>(
  ttlSeconds: number = 30,
  getBodyHash?: (body: Body) => string,
) {
  return UseInterceptors(new ThrottleBodyInterceptor<Body>(ttlSeconds, getBodyHash))
}
