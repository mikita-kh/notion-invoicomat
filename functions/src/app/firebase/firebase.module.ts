import { Module, OnModuleInit } from '@nestjs/common'
import { FirebaseAdminService } from './firebase-admin.service'
import { FirebaseStorageService } from './firebase-storage.service'

@Module({
  providers: [FirebaseAdminService, FirebaseStorageService],
  exports: [FirebaseAdminService, FirebaseStorageService],
})
export class FirebaseModule implements OnModuleInit {
  constructor(private readonly firebaseAdminService: FirebaseAdminService) {}

  onModuleInit() {
    this.firebaseAdminService.initializeFirebaseAdmin()
  }
}
