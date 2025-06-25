// get notion page data
import { Controller, Get, Param } from '@nestjs/common'
import { parsePageId } from 'notion-utils'
import { NotionService } from './notion/notion.service'

@Controller('notion')
export class AppController {
  constructor(private readonly notionService: NotionService) {}

  @Get('page/:id')
  async getPage(@Param('id') id: string) {
    return this.notionService.getNormilizedPageData(parsePageId(id)!)
  }
}
