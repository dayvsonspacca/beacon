import { JobsRepository } from './jobs.repository';
import { StorageService } from './storage.service';

describe('JobsRepository', () => {
  let storage: StorageService;
  let repository: JobsRepository;

  beforeEach(() => {
    process.env.BEACON_DB_PATH = ':memory:';
    storage = new StorageService();
    repository = new JobsRepository(storage);
  });

  afterEach(() => {
    storage.onModuleDestroy();
    delete process.env.BEACON_DB_PATH;
  });

  it('inserts a job as queued with serialized payload', () => {
    repository.insert({
      id: 'evt-1',
      topic: 'orders.created',
      payload: { topic: 'orders.created', source: 'api', data: { id: 1 } },
    });

    const row = storage.db
      .prepare('SELECT * FROM jobs WHERE id = ?')
      .get('evt-1') as Record<string, unknown>;

    expect(row.topic).toBe('orders.created');
    expect(row.status).toBe('queued');
    expect(JSON.parse(row.payload as string)).toEqual({
      topic: 'orders.created',
      source: 'api',
      data: { id: 1 },
    });
  });

  it('rejects duplicate ids', () => {
    const job = { id: 'evt-1', topic: 'a', payload: {} };
    repository.insert(job);

    expect(() => repository.insert(job)).toThrow(/UNIQUE/);
  });

  describe('claimNext', () => {
    it('claims the oldest queued job, marking it processing', () => {
      repository.insert({ id: 'evt-1', topic: 'a', payload: { n: 1 } });
      repository.insert({ id: 'evt-2', topic: 'b', payload: { n: 2 } });

      const job = repository.claimNext();

      expect(job).toMatchObject({
        id: 'evt-1',
        topic: 'a',
        payload: { n: 1 },
        status: 'processing',
        attempts: 1,
      });
    });

    it('does not claim the same job twice', () => {
      repository.insert({ id: 'evt-1', topic: 'a', payload: {} });

      expect(repository.claimNext()?.id).toBe('evt-1');
      expect(repository.claimNext()).toBeUndefined();
    });

    it('returns undefined when there is nothing queued', () => {
      expect(repository.claimNext()).toBeUndefined();
    });
  });

  describe('status transitions', () => {
    function statusOf(id: string) {
      const row = storage.db
        .prepare('SELECT status FROM jobs WHERE id = ?')
        .get(id) as { status: string };
      return row.status;
    }

    beforeEach(() => {
      repository.insert({ id: 'evt-1', topic: 'a', payload: {} });
      repository.claimNext();
    });

    it('markDone sets done', () => {
      repository.markDone('evt-1');
      expect(statusOf('evt-1')).toBe('done');
    });

    it('markFailed sets failed', () => {
      repository.markFailed('evt-1');
      expect(statusOf('evt-1')).toBe('failed');
    });

    it('requeue makes the job claimable again, keeping attempts', () => {
      repository.requeue('evt-1');
      expect(statusOf('evt-1')).toBe('queued');

      const reclaimed = repository.claimNext();
      expect(reclaimed?.id).toBe('evt-1');
      expect(reclaimed?.attempts).toBe(2);
    });

    it('requeue with delay keeps the job unavailable until it matures', () => {
      repository.requeue('evt-1', 60);
      expect(statusOf('evt-1')).toBe('queued');

      expect(repository.claimNext()).toBeUndefined();
    });
  });
});
