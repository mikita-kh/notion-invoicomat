import { Injectable, Logger } from '@nestjs/common'
import * as admin from 'firebase-admin'

@Injectable()
export class FirebaseAdminService {
  private readonly logger = new Logger(FirebaseAdminService.name)

  initializeFirebaseAdmin() {
    if (!this.initialized) {
      try {
        admin.initializeApp()
        this.logger.log('Firebase Admin SDK initialized successfully')
      } catch (error) {
        this.logger.error('Failed to initialize Firebase Admin SDK', error)
        throw error
      }
    }
  }

  get initialized() {
    return admin.apps.length > 0
  }

  get app() {
    this.initializeFirebaseAdmin()
    return admin.app()
  }

  get storage() {
    this.initializeFirebaseAdmin()
    return admin.storage()
  }

  get firestore() {
    this.initializeFirebaseAdmin()
    return admin.firestore()
  }

  get firestore2() {
    this.initializeFirebaseAdmin()
    return admin.projectManagement()
  }
}
