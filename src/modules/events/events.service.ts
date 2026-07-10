import { Injectable } from '@nestjs/common';
import { filter, Observable, Subject } from 'rxjs';
import { BeaconEvent } from './event';
import { matchesTopic } from './topics';

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
