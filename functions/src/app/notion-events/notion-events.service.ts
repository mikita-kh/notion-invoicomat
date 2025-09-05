import { Injectable } from '@nestjs/common'
import { InvoiceProcessorService } from '../invoice-processor/invoice-processor.service'
import { NotionWebhookEvent, PagePropertiesUpdatedEvent } from './notion-events.interface'

@Injectable()
export class NotionEventsService {
  constructor(private readonly invoiceProcessorService: InvoiceProcessorService) {}

  processEvent(event: NotionWebhookEvent) {
    if (event.type === 'page.properties_updated') {
      this.handlePagePropertiesUpdated(event as PagePropertiesUpdatedEvent)
    }
  }

  private handlePagePropertiesUpdated(event: PagePropertiesUpdatedEvent) {
    this.invoiceProcessorService.process(event.entity.id, event.data.updated_properties)
  }
}
