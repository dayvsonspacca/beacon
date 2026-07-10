import { describe, it, expect } from 'bun:test';
import { Topic } from './topic';

describe('Topic', () => {
  it('normalizes on construction', () => {
    expect(Topic.of('  Orders.CREATED ').value).toBe('orders.created');
  });

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
    expect(Topic.of(topic).matches(pattern)).toBe(expected);
  });

  it('stringifies to its normalized value', () => {
    expect(String(Topic.of(' Orders.Created '))).toBe('orders.created');
  });
});
