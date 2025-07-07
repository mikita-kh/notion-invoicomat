import * as process from 'node:process'

export function configuration() {
  return {
    NOTION_TOKEN: process.env.NOTION_API_KEY || '',
  }
}
