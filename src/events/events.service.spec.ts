import { EventsService } from './events.service';
import { matchesTopic, normalizeTopic } from './topics';

describe('normalizeTopic', () => {
  it('trims and lowercases', () => {
    expect(normalizeTopic('  Orders.CREATED ')).toBe('orders.created');
  });
});

describe('matchesTopic', () => {
  it.each([
    ['orders.created', 'orders.created', true],
    ['orders.created', 'orders.*', true],
    ['orders.created', '**', true],
    ['orders.created', 'orders.**', true],
    ['orders.created.v2', 'orders.*', false],
    ['orders.created.v2', 'orders.**', true],
    ['orders.created', 'users.*', false],
    ['orders.created', 'orders.shipped', false],
    ['ordersXcreated', 'orders.created', false],
  ])('topic %s vs pattern %s -> %s', (topic, pattern, expected) => {
    expect(matchesTopic(topic, pattern)).toBe(expected);
  });
});

describe('EventsService', () => {
  it('delivers only events matching the subscribed pattern', () => {
    const service = new EventsService();
    const received: string[] = [];

    const subscription = service
      .stream('orders.*')
      .subscribe((event) => received.push(event.topic));

    const base = { eventId: 'e', source: 's', data: {}, persist: false };
    service.emit({ ...base, topic: 'orders.created' });
    service.emit({ ...base, topic: 'users.registered' });
    service.emit({ ...base, topic: 'orders.shipped' });

    subscription.unsubscribe();
    expect(received).toEqual(['orders.created', 'orders.shipped']);
  });
});
