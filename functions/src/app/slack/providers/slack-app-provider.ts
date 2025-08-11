import { Provider } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { App, ExpressReceiver } from '@slack/bolt'
import { Configuration } from '../../config/configuration'
import { SLACK_APP, SLACK_RECEIVER } from '../slack.constants'

export const SlackAppProvider: Provider = {
  provide: SLACK_APP,
  useFactory: async (
    config: ConfigService<Configuration>,
    receiver: ExpressReceiver,
  ) => {
    const app = new App({
      receiver,
      token: config.getOrThrow('SLACK_BOT_TOKEN'),
      ignoreSelf: true,
    })

    return app
  },
  inject: [ConfigService, SLACK_RECEIVER],
}
