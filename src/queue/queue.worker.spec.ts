import { BeaconEvent, EventsService } from '../events/events.service';
import { JobsRepository } from '../storage/jobs.repository';
import { StorageService } from '../storage/storage.service';
import { QueueWorker } from './queue.worker';

describe('QueueWorker', () => {
  let storage: StorageService;
  let repository: JobsRepository;
  let events: EventsService;
  let worker: QueueWorker;

  beforeEach(() => {
    process.env.BEACON_DB_PATH = ':memory:';
    storage = new StorageService();
    repository = new JobsRepository(storage);
    events = new EventsService();
    worker = new QueueWorker(repository, events);
  });

  afterEach(() => {
    storage.onModuleDestroy();
    delete process.env.BEACON_DB_PATH;
  });

  function statusOf(id: string) {
    const row = storage.db
      .prepare('SELECT status, attempts FROM jobs WHERE id = ?')
      .get(id) as { status: string; attempts: number };
    return row;
  }

  it('drains queued jobs and marks them done', () => {
    repository.insert({ id: 'evt-1', topic: 'a', payload: {} });
    repository.insert({ id: 'evt-2', topic: 'b', payload: {} });

    worker.drain();

    expect(statusOf('evt-1')).toEqual({ status: 'done', attempts: 1 });
    expect(statusOf('evt-2')).toEqual({ status: 'done', attempts: 1 });
  });

  it('emits the event to subscribers when processing', () => {
    const received: BeaconEvent[] = [];
    events.stream('orders.*').subscribe((event) => received.push(event));

    repository.insert({
      id: 'evt-1',
      topic: 'orders.created',
      payload: {
        topic: 'orders.created',
        source: 'api',
        data: { orderId: 1 },
        persist: false,
      },
    });
    worker.drain();

    expect(received).toEqual([
      {
        eventId: 'evt-1',
        topic: 'orders.created',
        source: 'api',
        data: { orderId: 1 },
        persist: false,
      },
    ]);
  });

  it('requeues a failing job with backoff and marks it failed after max attempts', () => {
    repository.insert({ id: 'evt-1', topic: 'a', payload: {} });
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
    expect(statusOf('evt-1')).toEqual({ status: 'queued', attempts: 1 });

    // backoff: not claimable again within the same drain pass
    worker.drain();
    expect(statusOf('evt-1')).toEqual({ status: 'queued', attempts: 1 });

    matureJob();
    worker.drain();
    expect(statusOf('evt-1')).toEqual({ status: 'queued', attempts: 2 });

    matureJob();
    worker.drain();
    expect(statusOf('evt-1')).toEqual({ status: 'failed', attempts: 3 });
  });
});
