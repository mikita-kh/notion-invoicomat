import { Provider } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ExpressReceiver } from '@slack/bolt'
import { Configuration } from '../../config/configuration'
import { SLACK_RECEIVER } from '../slack.constants'

export const SlackReceiverProvider: Provider = {
  provide: SLACK_RECEIVER,
  useFactory: (config: ConfigService<Configuration>) => new ExpressReceiver({
    signingSecret: config.getOrThrow('SLACK_SIGNING_SECRET'),
    signatureVerification: config.get('IS_CLOUD_ENVIRONMENT'),
    processBeforeResponse: false,
  }),
  inject: [ConfigService],
}
