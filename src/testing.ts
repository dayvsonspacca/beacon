import { BeaconEvent, EventPayload } from './events/event';

export function payloadOf(overrides: Partial<EventPayload> = {}): EventPayload {
  return {
    topic: 'orders.created',
    source: 'api',
    data: {},
    ...overrides,
  };
}

export function eventOf(overrides: Partial<BeaconEvent> = {}): BeaconEvent {
  return { eventId: 'evt-1', ...payloadOf(), ...overrides };
}
