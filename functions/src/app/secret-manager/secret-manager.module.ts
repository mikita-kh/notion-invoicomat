import { Module } from '@nestjs/common'
import { FirebaseModule } from '../firebase/firebase.module'
import { SecretManagerService } from './secret-manager.service'

@Module({
  imports: [FirebaseModule],
  providers: [SecretManagerService],
  exports: [SecretManagerService],
})
export class SecretManagerModule {}
