import { Controller, MessageEvent, Query, Sse } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { EventsService } from '../events/events.service';
import { normalizeTopic } from '../events/topics';

@Controller('subscribe')
export class SubscribeController {
  constructor(private readonly events: EventsService) {}

  @Sse()
  subscribe(@Query('topic') topic?: string): Observable<MessageEvent> {
    const pattern = normalizeTopic(topic ?? '') || '**';
    return this.events
      .stream(pattern)
      .pipe(map((event) => ({ type: event.topic, data: event })));
  }
}
