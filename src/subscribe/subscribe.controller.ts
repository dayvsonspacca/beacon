import { Controller, MessageEvent, Query, Sse } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { EventsService } from '../events/events.service';

@Controller('subscribe')
export class SubscribeController {
  constructor(private readonly events: EventsService) {}

  @Sse()
  subscribe(@Query('topic') topic?: string): Observable<MessageEvent> {
    const pattern = topic?.trim().toLowerCase() || '**';
    return this.events
      .stream(pattern)
      .pipe(map((event) => ({ type: event.topic, data: event })));
  }
}
