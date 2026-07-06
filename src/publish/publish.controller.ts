import { Body, Controller, Post } from '@nestjs/common';
import { PublishDto } from './dto/publish.dto';

@Controller('publish')
export class PublishController {
  @Post()
  publish(@Body() body: PublishDto) {
    return body;
  }
}
