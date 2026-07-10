import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Event } from '../../core/event';
import { Source } from '../../core/source';
import { Topic } from '../../core/topic';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentSource } from '../auth/current-source.decorator';
import { EventsService } from '../events/events.service';
import { PublishDto } from './dto/publish.dto';

@Controller('publish')
@UseGuards(AuthGuard)
export class PublishController {
  constructor(private readonly events: EventsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  publish(@Body() body: PublishDto, @CurrentSource() source: Source) {
    const event = Event.of(Topic.of(body.topic), source, body.data);
    this.events.emit(event);
    return { eventId: event.id, status: 'published' };
  }
}
