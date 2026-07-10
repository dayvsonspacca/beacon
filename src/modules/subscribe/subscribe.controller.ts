import {
  Controller,
  MessageEvent,
  Query,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { AuthGuard } from '../auth/auth.guard';
import { Topic } from '../../core/topic';
import { EventsService } from '../events/events.service';

@Controller('subscribe')
@UseGuards(AuthGuard)
export class SubscribeController {
  constructor(private readonly events: EventsService) {}

  @Sse()
  subscribe(@Query('topic') topic?: string): Observable<MessageEvent> {
    // empty filter -> undefined -> the stream's catch-all default
    const pattern = Topic.of(topic ?? '').value || undefined;

    return this.events
      .stream(pattern)
      .pipe(map((event) => ({ type: event.topic.value, data: event })));
  }
}
