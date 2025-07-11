import * as process from 'node:process'

export function configuration() {
  return {
    NOTION_TOKEN: process.env.NOTION_API_KEY || '',
    SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL || '',
    SLACK_NOTION_BOT_ID: process.env.SLACK_NOTION_BOT_ID || '',
  } as const
}
