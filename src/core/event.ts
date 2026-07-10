import { randomUUID } from 'node:crypto';
import { Source } from './source';
import { Topic } from './topic';

export class Event {
  private constructor(
    readonly id: string,
    readonly topic: Topic,
    readonly source: Source,
    readonly data: object,
  ) {}

  static of(topic: Topic, source: Source, data: object): Event {
    return new Event(randomUUID(), topic, source, data);
  }

  // keeps the SSE wire format flat — subscribers parse {eventId, topic, source, data}
  toJSON() {
    return {
      eventId: this.id,
      topic: this.topic.value,
      source: this.source.id,
      data: this.data,
    };
  }
}
