import { Injectable } from '@nestjs/common';
import { filter, Observable, Subject } from 'rxjs';
import { Event } from '../../core/event';

@Injectable()
export class EventsService {
  private readonly events$ = new Subject<Event>();

  emit(event: Event): void {
    this.events$.next(event);
  }

  stream(pattern = '**'): Observable<Event> {
    return this.events$.pipe(filter((event) => event.topic.matches(pattern)));
  }
}
