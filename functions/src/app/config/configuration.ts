import * as process from 'node:process'

export function configuration() {
  return {
    NOTION_TOKEN: process.env.NOTION_API_KEY || '',
    // Firebase Admin SDK автоматически использует переменные окружения
    // FIREBASE_CONFIG и GCLOUD_PROJECT в Firebase Functions
  }
}
