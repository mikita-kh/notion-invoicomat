export interface NotionEvents {}

export interface NotionWebhookEvent {
  id: string
  timestamp: string
  workspace_id: string
  workspace_name?: string
  subscription_id: string
  integration_id: string
  type: string
  authors: Array<{ id: string, type: 'person' | 'bot' | 'agent' }>
  accessible_by?: Array<{ id: string, type: 'person' | 'bot' }>
  attempt_number: number
  entity: { id: string, type: 'page' | 'block' | 'database' }
  data: Record<string, any>
}

export interface PagePropertiesUpdatedEvent extends NotionWebhookEvent {
  type: 'page.properties_updated'
  data: {
    parent: { id: string, type: string }
    updated_properties: string[]
  }
}
