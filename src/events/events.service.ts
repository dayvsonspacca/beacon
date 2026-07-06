import { Injectable } from '@nestjs/common';
import { filter, Observable, Subject } from 'rxjs';

export interface BeaconEvent {
  eventId: string;
  topic: string;
  source: string;
  data: Record<string, any>;
  persist: boolean;
}

export function matchesTopic(topic: string, pattern: string): boolean {
  if (pattern === '**') {
    return true;
  }
  const regex = pattern
    .split('.')
    .map((segment) => {
      if (segment === '**') return '.*';
      if (segment === '*') return '[^.]+';
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('\\.');
  return new RegExp(`^${regex}$`).test(topic);
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
