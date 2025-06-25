import { Injectable, LoggerService } from '@nestjs/common'
import { logger as firebaseLogger } from 'firebase-functions/v2'

@Injectable()
export class FirebaseLogger implements LoggerService {
  log(message: any, ...optionalParams: any[]) {
    firebaseLogger.info(message, ...optionalParams)
  }

  error(message: any, trace?: string, context?: string) {
    firebaseLogger.error(message, { trace, context })
  }

  warn(message: any, ...optionalParams: any[]) {
    firebaseLogger.warn(message, ...optionalParams)
  }

  debug(message: any, ...optionalParams: any[]) {
    firebaseLogger.debug(message, ...optionalParams)
  }

  verbose(message: any, ...optionalParams: any[]) {
    firebaseLogger.debug('[verbose]', message, ...optionalParams)
  }
}
