import { Buffer } from 'node:buffer'
import { SecretManagerServiceClient } from '@google-cloud/secret-manager'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Configuration } from '../config/configuration'

@Injectable()
export class SecretManagerService {
  private readonly logger = new Logger(SecretManagerService.name)
  private readonly client = new SecretManagerServiceClient()
  private readonly projectId: string

  constructor(private readonly configService: ConfigService<Configuration>) {
    this.projectId = this.configService.getOrThrow('GCLOUD_PROJECT')
  }

  private async accessSecretVersion(secretName: string): Promise<string | null> {
    const [version] = await this.client.accessSecretVersion({
      name: `projects/${this.projectId}/secrets/${secretName}/versions/latest`,
    })

    return version.payload?.data?.toString() ?? null
  }

  async createIfNotExists(secretName: string): Promise<void> {
    const parent = `projects/${this.projectId}`
    try {
      await this.client.getSecret({ name: `${parent}/secrets/${secretName}` })
      this.logger.log(`Secret ${secretName} already exists.`)
    } catch (error: any) {
      if (error.code === 5) { // NOT_FOUND
        this.logger.log(`Secret ${secretName} not found. Creating it...`)
        await this.client.createSecret({
          parent,
          secretId: secretName,
          secret: {
            replication: {
              automatic: {},
            },
          },
        })
        this.logger.log(`Secret ${secretName} created.`)
      } else if (error.code === 7) { // PERMISSION_DENIED
        const policy = await this.client.getIamPolicy({
          resource: `${parent}/secrets/${secretName}`,
        })
        this.logger.error(`Permission denied when accessing secret ${secretName}. Current IAM Policy:`, { ...policy })
      } else {
        throw new Error(`Failed to check secret ${secretName}`, { cause: error })
      }
    }
  }

  async getSecret(secretName: string): Promise<string | undefined> {
    try {
      const secretValue = await this.accessSecretVersion(secretName)

      if (typeof secretValue === 'string') {
        return secretValue
      }
    } catch (error: any) {
      if (error.code === 5) { // NOT_FOUND
        this.logger.warn(`Secret ${secretName} not found.`)
      } else {
        if (error.code === 7) { // PERMISSION_DENIED
          this.logger.error(`Permission denied when accessing secret ${secretName}.`, { error })
        }

        throw new Error(`Failed to access secret ${secretName}`, { cause: error })
      }
    }

    return undefined
  }

  async saveSecret(secretName: string, payload: string): Promise<void> {
    if (!payload) {
      this.logger.warn(`Payload for secret ${secretName} is empty. Skipping save.`)
      return
    }

    const parent = `projects/${this.projectId}`
    const secretPath = `${parent}/secrets/${secretName}`

    try {
      await this.createIfNotExists(secretName)
    } catch (error: any) {
      this.logger.warn(`Error ensuring secret ${secretName} exists`, { error })
    }

    try {
      // Get the current secret value to compare
      const currentValue = await this.accessSecretVersion(secretName)

      if (currentValue === payload) {
        this.logger.log(`Secret ${secretName} already has the same value. Skipping update.`)
        return
      }

      this.logger.log(`Secret ${secretName} value has changed. Creating new version...`)
    } catch (error: any) {
      if (error.code === 7) { // PERMISSION_DENIED
        const policy = await this.client.getIamPolicy({
          resource: secretPath,
        })
        this.logger.error(`Permission denied when accessing secret ${secretName}. Current IAM Policy:`, { ...policy })
      }

      throw new Error(`Failed to check secret ${secretName}`, { cause: error })
    }

    try {
    // Add new version with the updated value
      const [{ name }] = await this.client.addSecretVersion({
        parent: secretPath,
        payload: {
          data: Buffer.from(payload, 'utf8'),
        },
      })

      this.logger.log(`Successfully saved secret ${name}.`)
    } catch (error: any) {
      throw new Error(`Error saving secret ${secretName}`, { cause: error })
    }
  }
}
