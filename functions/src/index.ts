import { onRequest } from 'firebase-functions/v2/https'
import { createNestServer } from './app/main'

export const webhook = onRequest(
  {
    secrets: ['NOTION_API_KEY', 'SLACK_WEBHOOK_URL'],
    memory: '2GiB',
    timeoutSeconds: 30,
  },
  async (req, res) => {
    const server = await createNestServer()
    return server(req, res)
  },
)

createNestServer()
