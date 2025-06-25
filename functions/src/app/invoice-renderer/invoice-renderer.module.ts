import { Module } from '@nestjs/common'
import { InvoiceRendererService } from './invoice-renderer.service'
import { TailwindService } from './services/tailwind.service'

@Module({
  providers: [InvoiceRendererService, TailwindService],
  exports: [InvoiceRendererService, TailwindService],
})
export class InvoiceRendererModule {}
