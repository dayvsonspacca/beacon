import { Event } from './core/event';
import { Source } from './core/source';
import { Topic } from './core/topic';

interface EventOverrides {
  topic?: string;
  source?: string;
  data?: object;
}

export function eventOf(overrides: EventOverrides = {}): Event {
  return Event.of(
    Topic.of(overrides.topic ?? 'orders.created'),
    Source.of(overrides.source ?? 'api'),
    overrides.data ?? {},
  );
}
