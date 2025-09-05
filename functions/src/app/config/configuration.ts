import process from 'node:process'

export function configuration() {
  return {
    NOTION_API_KEY: process.env.NOTION_API_KEY,
    NOTION_VERIFICATION_TOKEN: process.env.NOTION_VERIFICATION_TOKEN,
    PDF_SERVICES_CLIENT_ID: process.env.PDF_SERVICES_CLIENT_ID,
    PDF_SERVICES_CLIENT_SECRET: process.env.PDF_SERVICES_CLIENT_SECRET,
    GCLOUD_PROJECT: process.env.GCLOUD_PROJECT,
    IS_CLOUD_ENVIRONMENT: process.env.FUNCTION_TARGET !== undefined,
  } as const
}

export type Configuration = ReturnType<typeof configuration>
