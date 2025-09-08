import { FactoryProvider } from '@nestjs/common'
import { SecretManagerService } from '../secret-manager/secret-manager.service'

export const SECRETS_TOKEN = Symbol('SecretsProvider')

export interface Secrets {
  NOTION_VERIFICATION_TOKEN: string
}

export const SecretsProvider: FactoryProvider<Partial<Secrets>> = {
  provide: SECRETS_TOKEN,
  useFactory: async (secretManagerService: SecretManagerService) => ({
    NOTION_VERIFICATION_TOKEN: await secretManagerService.getSecret('NOTION_VERIFICATION_TOKEN'),
  }),
  inject: [SecretManagerService],
}
