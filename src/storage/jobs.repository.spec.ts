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
});
