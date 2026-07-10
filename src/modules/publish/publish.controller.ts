import { randomUUID } from 'node:crypto';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { BeaconClient } from '../auth/clients.service';
import { CurrentClient } from '../auth/current-client.decorator';
import { BeaconEvent } from '../events/event';
import { EventsService } from '../events/events.service';
import { PublishDto } from './dto/publish.dto';

@Controller('publish')
@UseGuards(AuthGuard)
export class PublishController {
  constructor(private readonly events: EventsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  publish(@Body() body: PublishDto, @CurrentClient() client: BeaconClient) {
    const eventId = randomUUID();
    this.events.emit(
      BeaconEvent.of(eventId, { ...body, source: client.source }),
    );
    return { eventId, status: 'published' };
  }
}
