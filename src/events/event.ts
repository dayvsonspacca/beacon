export interface EventPayload {
  topic: string;
  source: string;
  data: Record<string, any>;
}

export class BeaconEvent implements EventPayload {
  readonly eventId: string;
  readonly topic: string;
  readonly source: string;
  readonly data: Record<string, any>;

  private constructor(eventId: string, payload: EventPayload) {
    this.eventId = eventId;
    this.topic = payload.topic;
    this.source = payload.source;
    this.data = payload.data;
  }

  static from(job: { id: string; payload: EventPayload }): BeaconEvent {
    return new BeaconEvent(job.id, job.payload);
  }
}
