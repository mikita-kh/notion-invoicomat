import { Injectable, Logger, NestMiddleware } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NextFunction, Request, Response } from 'express'
import { Configuration } from '../config/config.interface'
import { SecretManagerService } from '../secret-manager/secret-manager.service'

interface NotionVerificationRequest {
  verification_token: string
}

function isNotionVerificationRequest(body: unknown): body is NotionVerificationRequest {
  return typeof body === 'object' && body !== null && 'verification_token' in body && typeof body.verification_token === 'string' && body.verification_token.length > 0
}

@Injectable()
export class NotionEventsMiddleware implements NestMiddleware {
  private readonly logger = new Logger(NotionEventsMiddleware.name)

  constructor(
    private readonly configService: ConfigService<Configuration>,
    private readonly secretManagerService: SecretManagerService,
  ) {}

  private async setVerificationToken(token: string): Promise<void> {
    this.configService.set('NOTION_VERIFICATION_TOKEN', token)

    try {
      await this.secretManagerService.saveSecret('NOTION_VERIFICATION_TOKEN', token)
    } catch (error) {
      this.logger.error('Error saving NOTION_VERIFICATION_TOKEN to Secret Manager', error)
      throw error
    }
  }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { body } = req

      // Check if this is a verification request
      if (isNotionVerificationRequest(body)) {
        this.logger.log('Received Notion webhook verification request')

        const verificationToken = body.verification_token
        this.logger.log(`Verification token received: ${verificationToken.substring(0, 20)}...`)

        try {
          // Save the verification token to Google Secret Manager
          await this.setVerificationToken(verificationToken)
          this.logger.log('Successfully saved verification token to Secret Manager')

          // Respond immediately to complete verification
          res.status(200).json({
            success: true,
            message: 'Verification token received and stored',
          })
        } catch (error) {
          this.logger.error('Failed to save verification token to Secret Manager', error)
          res.status(500).json({
            success: false,
            error: 'Failed to store verification token',
          })
        }
        return
      }

      next()
    } catch (error) {
      this.logger.error('Error in NotionVerificationMiddleware', error)
      res.status(500).json({
        success: false,
        error: 'Internal server error during webhook processing',
      })
    }
  }
}
