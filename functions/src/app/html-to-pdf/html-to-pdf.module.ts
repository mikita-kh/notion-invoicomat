import { Module } from '@nestjs/common'
import { HtmlToPdfService } from './html-to-pdf.service'

@Module({
  providers: [HtmlToPdfService],
  exports: [HtmlToPdfService],
})
export class HtmlToPdfModule {}
