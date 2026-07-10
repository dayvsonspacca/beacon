import { describe, it, expect } from 'bun:test';
import { Event } from './event';
import { Source } from './source';
import { Topic } from './topic';

describe('Event', () => {
  it('holds topic, source and data', () => {
    const event = Event.of(Topic.of('orders.created'), Source.of('api'), {
      orderId: 42,
    });

    expect(event.topic.value).toBe('orders.created');
    expect(event.source.id).toBe('api');
    expect(event.data).toEqual({ orderId: 42 });
  });

  it('generates a unique id on construction', () => {
    const topic = Topic.of('orders.created');
    const source = Source.of('api');

    const a = Event.of(topic, source, {});
    const b = Event.of(topic, source, {});

    expect(a.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(a.id).not.toBe(b.id);
  });
});
