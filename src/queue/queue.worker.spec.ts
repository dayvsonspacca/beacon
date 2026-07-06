import { BeaconEvent, EventsService } from '../events/events.service';
import { JobsRepository } from '../storage/jobs.repository';
import { StorageService } from '../storage/storage.service';
import { createInMemoryStorage, jobStatus, payloadOf } from '../storage/testing';
import { QueueWorker } from './queue.worker';

describe('QueueWorker', () => {
  let storage: StorageService;
  let repository: JobsRepository;
  let events: EventsService;
  let worker: QueueWorker;

  beforeEach(() => {
    storage = createInMemoryStorage();
    repository = new JobsRepository(storage);
    events = new EventsService();
    worker = new QueueWorker(repository, events);
  });

  afterEach(() => {
    storage.onModuleDestroy();
  });

  it('drains queued jobs and marks them done', () => {
    repository.insert({ id: 'evt-1', topic: 'a', payload: payloadOf() });
    repository.insert({ id: 'evt-2', topic: 'b', payload: payloadOf() });

    worker.drain();

    expect(jobStatus(storage, 'evt-1')).toEqual({ status: 'done', attempts: 1 });
    expect(jobStatus(storage, 'evt-2')).toEqual({ status: 'done', attempts: 1 });
  });

  it('emits the event to subscribers when processing', () => {
    const received: BeaconEvent[] = [];
    events.stream('orders.*').subscribe((event) => received.push(event));

    const payload = payloadOf({ data: { orderId: 1 } });
    repository.insert({ id: 'evt-1', topic: payload.topic, payload });
    worker.drain();

    expect(received).toEqual([{ eventId: 'evt-1', ...payload }]);
  });

  it('requeues a failing job with backoff and marks it failed after max attempts', () => {
    repository.insert({ id: 'evt-1', topic: 'a', payload: payloadOf() });
    jest
      .spyOn(
        worker as unknown as { process: (job: unknown) => void },
        'process',
      )
      .mockImplementation(() => {
        throw new Error('boom');
      });

    const matureJob = () =>
      storage.db
        .prepare("UPDATE jobs SET available_at = '1970-01-01T00:00:00.000Z'")
        .run();

    worker.drain();
    expect(jobStatus(storage, 'evt-1')).toEqual({ status: 'queued', attempts: 1 });

    // backoff: not claimable again within the same drain pass
    worker.drain();
    expect(jobStatus(storage, 'evt-1')).toEqual({ status: 'queued', attempts: 1 });

    matureJob();
    worker.drain();
    expect(jobStatus(storage, 'evt-1')).toEqual({ status: 'queued', attempts: 2 });

    matureJob();
    worker.drain();
    expect(jobStatus(storage, 'evt-1')).toEqual({ status: 'failed', attempts: 3 });
  });
});
