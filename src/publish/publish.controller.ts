import { randomUUID } from 'node:crypto';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { JobsRepository } from '../storage/jobs.repository';
import { PublishDto } from './dto/publish.dto';

@Controller('publish')
export class PublishController {
  constructor(private readonly jobs: JobsRepository) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  publish(@Body() body: PublishDto) {
    const eventId = randomUUID();
    this.jobs.insert({ id: eventId, topic: body.topic, payload: body });
    return { eventId, status: 'queued' };
  }
}
