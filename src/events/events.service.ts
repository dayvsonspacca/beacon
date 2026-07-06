import { Injectable } from '@nestjs/common';
import { filter, Observable, Subject } from 'rxjs';
import { EventPayload } from './event-payload';
import { matchesTopic } from './topics';

export interface BeaconEvent extends EventPayload {
  eventId: string;
}

@Injectable()
export class EventsService {
  private readonly events$ = new Subject<BeaconEvent>();

  emit(event: BeaconEvent): void {
    this.events$.next(event);
  }

  stream(pattern = '**'): Observable<BeaconEvent> {
    return this.events$.pipe(
      filter((event) => matchesTopic(event.topic, pattern)),
    );
  }
}
