import { randomUUID } from 'node:crypto';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import type { BeaconClient } from '../auth/clients.service';
import { CurrentClient } from '../auth/current-client.decorator';
import { JobsRepository } from '../storage/jobs.repository';
import { PublishDto } from './dto/publish.dto';

@Controller('publish')
export class PublishController {
  constructor(private readonly jobs: JobsRepository) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  publish(@Body() body: PublishDto, @CurrentClient() client: BeaconClient) {
    const eventId = randomUUID();
    this.jobs.insert({
      id: eventId,
      payload: { ...body, source: client.source },
    });
    return { eventId, status: 'queued' };
  }
}
