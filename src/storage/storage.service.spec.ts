import { StorageService } from './storage.service';
import { createInMemoryStorage } from '../testing';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    service = createInMemoryStorage();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('creates the jobs table', () => {
    const table = service.db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'jobs'",
      )
      .get();

    expect(table).toEqual({ name: 'jobs' });
  });

  it('inserts and reads a job with defaults applied', () => {
    service.db
      .prepare('INSERT INTO jobs (id, topic, payload) VALUES (?, ?, ?)')
      .run('evt-1', 'orders.created', '{"orderId":42}');

    const job = service.db
      .prepare('SELECT * FROM jobs WHERE id = ?')
      .get('evt-1') as Record<string, unknown>;

    expect(job.topic).toBe('orders.created');
    expect(job.status).toBe('queued');
    expect(job.attempts).toBe(0);
    expect(job.created_at).toBeTruthy();
  });
});
