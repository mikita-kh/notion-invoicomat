import { EnvVariables } from './load-env-variables'
import { Secrets } from './secrets.provider'

export type Configuration = EnvVariables & Secrets
