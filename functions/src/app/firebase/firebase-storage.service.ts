import { Buffer } from 'node:buffer'

import { Injectable, Logger } from '@nestjs/common'
import { FirebaseAdminService } from './firebase-admin.service'

@Injectable()
export class FirebaseStorageService {
  private readonly logger = new Logger(FirebaseStorageService.name)

  constructor(private readonly firebaseAdmin: FirebaseAdminService) {
  }

  get #bucket() {
    return this.firebaseAdmin.storage.bucket()
  }

  async save(
    buffer: Buffer,
    fileName: string,
    contentType: string = 'application/pdf',
  ): Promise<string> {
    try {
      this.logger.debug(`Uploading file: ${fileName}`)

      const file = this.#bucket.file(fileName)

      await file.save(buffer, { contentType })

      await file.makePublic()
      const publicUrl = file.publicUrl()

      this.logger.log(`File uploaded successfully: ${publicUrl}`)

      return publicUrl
    } catch (error) {
      this.logger.error(`Error uploading file: ${fileName}`, error)
      throw error
    }
  }

  async delete(fileName: string): Promise<void> {
    try {
      this.logger.debug(`Deleting file: ${fileName}`)

      const file = this.#bucket.file(fileName)
      await file.delete()

      this.logger.log(`File deleted successfully: ${fileName}`)
    } catch (error) {
      this.logger.error(`Error deleting file: ${fileName}`, error)
      throw error
    }
  }

  async exists(fileName: string): Promise<boolean> {
    try {
      const file = this.#bucket.file(fileName)
      const [exists] = await file.exists()
      return exists
    } catch (error) {
      this.logger.error(`Error checking file existence: ${fileName}`, error)
      return false
    }
  }
}
