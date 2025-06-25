/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onRequest } from 'firebase-functions/v2/https'
import { createNestServer } from './app/main'

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

export const webhook = onRequest(
  {
    secrets: ['NOTION_API_KEY'],
  },
  async (req, res) => {
    const server = await createNestServer()
    return server(req, res)
  },
)

createNestServer()
