import {
  BadRequestException,
  Controller,
  MessageEvent,
  Query,
  Sse,
} from '@nestjs/common';
import {
  concat,
  defer,
  filter,
  finalize,
  from,
  map,
  Observable,
  ReplaySubject,
} from 'rxjs';
import { BeaconEvent } from '../events/event';
import { EventsService } from '../events/events.service';
import { normalizeTopic } from '../events/topics';
import { JobsRepository } from '../storage/jobs.repository';

const MAX_BACKLOG = 100;

@Controller('subscribe')
export class SubscribeController {
  constructor(
    private readonly events: EventsService,
    private readonly jobs: JobsRepository,
  ) {}

  @Sse()
  subscribe(
    @Query('topic') topic?: string,
    @Query('last') last?: string,
  ): Observable<MessageEvent> {
    // empty filter -> undefined -> the stream's catch-all default
    const pattern = normalizeTopic(topic ?? '') || undefined;
    const backlogSize = this.parseLast(last);

    const stream$ = backlogSize
      ? this.withBacklog(pattern ?? '**', backlogSize)
      : this.events.stream(pattern);

    return stream$.pipe(map((event) => ({ type: event.topic, data: event })));
  }

  /**
   * Replays the last `limit` delivered events, then hands over to the live
   * stream. The live subscription starts buffering before the backlog query
   * so nothing published in between is lost; the overlap is deduplicated
   * by eventId.
   */
  private withBacklog(pattern: string, limit: number): Observable<BeaconEvent> {
    return defer(() => {
      const live = new ReplaySubject<BeaconEvent>();
      const liveSubscription = this.events.stream(pattern).subscribe(live);

      const backlog = this.jobs
        .findLastDelivered(pattern, limit)
        .map((job) => BeaconEvent.from(job));
      const replayed = new Set(backlog.map((event) => event.eventId));

      return concat(
        from(backlog),
        live.pipe(filter((event) => !replayed.has(event.eventId))),
      ).pipe(finalize(() => liveSubscription.unsubscribe()));
    });
  }

  private parseLast(last?: string): number | undefined {
    if (last === undefined) {
      return undefined;
    }
    const parsed = Number(last);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_BACKLOG) {
      throw new BadRequestException(
        `last must be an integer between 1 and ${MAX_BACKLOG}`,
      );
    }
    return parsed;
  }
}
