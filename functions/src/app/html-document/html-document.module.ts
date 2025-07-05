import { Module } from '@nestjs/common'
import { HtmlDocumentService } from './html-document.service'

@Module({
  providers: [HtmlDocumentService],
})
export class HtmlDocumentModule {

}
