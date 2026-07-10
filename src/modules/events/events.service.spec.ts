import { describe, it, expect } from 'bun:test';
import { eventOf } from '../../testing';
import { EventsService } from './events.service';

describe('EventsService', () => {
  it('delivers only events matching the subscribed pattern', () => {
    const service = new EventsService();
    const received: string[] = [];

    const subscription = service
      .stream('orders.*')
      .subscribe((event) => received.push(event.topic.value));

    service.emit(eventOf({ topic: 'orders.created' }));
    service.emit(eventOf({ topic: 'users.registered' }));
    service.emit(eventOf({ topic: 'orders.shipped' }));

    subscription.unsubscribe();
    expect(received).toEqual(['orders.created', 'orders.shipped']);
  });
});
