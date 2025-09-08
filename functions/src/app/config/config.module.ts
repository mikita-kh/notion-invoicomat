import { Global, Inject, Module, OnModuleInit } from '@nestjs/common'
import { ConfigService, ConfigModule as NestConfigModule } from '@nestjs/config'
import { SecretManagerModule } from '../secret-manager/secret-manager.module'
import { loadEnvVariables } from './load-env-variables'
import { Secrets, SECRETS_TOKEN, SecretsProvider } from './secrets.provider'

@Global()
@Module({
  imports: [
    SecretManagerModule,
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.local',
      load: [loadEnvVariables],
    }),
  ],
  providers: [SecretsProvider],
  exports: [NestConfigModule],
})
export class ConfigModule implements OnModuleInit {
  constructor(
    private configService: ConfigService,
    @Inject(SECRETS_TOKEN) private secrets: Secrets,
  ) {}

  onModuleInit() {
    Object.entries(this.secrets).forEach(([key, value]) => {
      if (value) {
        this.configService.set(key, value)
      }
    })
  }
}
