import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { JobsRepository } from './jobs.repository';
import { StorageService } from './storage.service';
import { createInMemoryStorage, jobStatus, payloadOf } from '../testing';

describe('JobsRepository', () => {
  let storage: StorageService;
  let repository: JobsRepository;

  beforeEach(() => {
    storage = createInMemoryStorage();
    repository = new JobsRepository(storage);
  });

  afterEach(() => {
    storage.onModuleDestroy();
  });

  it('inserts a job as queued with serialized payload', () => {
    const payload = payloadOf({ data: { id: 1 } });
    repository.insert({ id: 'evt-1', payload });

    const row = storage.db
      .prepare('SELECT * FROM jobs WHERE id = ?')
      .get('evt-1') as Record<string, unknown>;

    expect(row.topic).toBe('orders.created');
    expect(row.status).toBe('queued');
    expect(JSON.parse(row.payload as string)).toEqual(payload);
  });

  it('rejects duplicate ids', () => {
    const job = { id: 'evt-1', payload: payloadOf() };
    repository.insert(job);

    expect(() => repository.insert(job)).toThrow(/UNIQUE/);
  });

  describe('claimNext', () => {
    it('claims the oldest queued job, marking it processing', () => {
      repository.insert({ id: 'evt-1', payload: payloadOf({ topic: 'a' }) });
      repository.insert({ id: 'evt-2', payload: payloadOf({ topic: 'b' }) });

      const job = repository.claimNext();

      expect(job).toMatchObject({
        id: 'evt-1',
        topic: 'a',
        payload: payloadOf({ topic: 'a' }),
        status: 'processing',
        attempts: 1,
      });
    });

    it('does not claim the same job twice', () => {
      repository.insert({ id: 'evt-1', payload: payloadOf({ topic: 'a' }) });

      expect(repository.claimNext()?.id).toBe('evt-1');
      expect(repository.claimNext()).toBeUndefined();
    });

    it('returns undefined when there is nothing queued', () => {
      expect(repository.claimNext()).toBeUndefined();
    });
  });

  describe('findLastDelivered', () => {
    function deliver(id: string, topic: string) {
      repository.insert({ id, payload: payloadOf({ topic }) });
      // spread created_at apart so ordering is deterministic
      storage.db
        .prepare("UPDATE jobs SET status = 'done', created_at = ? WHERE id = ?")
        .run(`2026-07-07T00:00:0${id.slice(-1)}.000Z`, id);
    }

    beforeEach(() => {
      deliver('evt-1', 'orders.created');
      deliver('evt-2', 'orders.shipped');
      deliver('evt-3', 'users.registered');
      deliver('evt-4', 'orders.created');
    });

    it('returns the newest matching events, oldest first', () => {
      const jobs = repository.findLastDelivered('orders.created', 2);

      expect(jobs.map((j) => j.id)).toEqual(['evt-1', 'evt-4']);
    });

    it('respects the limit', () => {
      const jobs = repository.findLastDelivered('orders.created', 1);

      expect(jobs.map((j) => j.id)).toEqual(['evt-4']);
    });

    it('matches wildcard patterns', () => {
      const jobs = repository.findLastDelivered('orders.*', 10);

      expect(jobs.map((j) => j.id)).toEqual(['evt-1', 'evt-2', 'evt-4']);
    });

    it('matches everything with the catch-all pattern', () => {
      const jobs = repository.findLastDelivered('**', 2);

      expect(jobs.map((j) => j.id)).toEqual(['evt-3', 'evt-4']);
    });

    it('ignores jobs that were not delivered', () => {
      repository.insert({
        id: 'evt-9',
        payload: payloadOf({ topic: 'orders.created' }),
      });

      const jobs = repository.findLastDelivered('orders.created', 10);

      expect(jobs.map((j) => j.id)).toEqual(['evt-1', 'evt-4']);
    });
  });

  describe('status transitions', () => {
    beforeEach(() => {
      repository.insert({ id: 'evt-1', payload: payloadOf({ topic: 'a' }) });
      repository.claimNext();
    });

    it('markDone sets done', () => {
      repository.markDone('evt-1');
      expect(jobStatus(storage, 'evt-1').status).toBe('done');
    });

    it('markFailed sets failed', () => {
      repository.markFailed('evt-1');
      expect(jobStatus(storage, 'evt-1').status).toBe('failed');
    });

    it('requeue makes the job claimable again, keeping attempts', () => {
      repository.requeue('evt-1');
      expect(jobStatus(storage, 'evt-1').status).toBe('queued');

      const reclaimed = repository.claimNext();
      expect(reclaimed?.id).toBe('evt-1');
      expect(reclaimed?.attempts).toBe(2);
    });

    it('requeue with delay keeps the job unavailable until it matures', () => {
      repository.requeue('evt-1', 60);
      expect(jobStatus(storage, 'evt-1').status).toBe('queued');

      expect(repository.claimNext()).toBeUndefined();
    });
  });
});
