import { EventPayload } from '../events/event-payload';
import { JobStatus } from './jobs.repository';
import { StorageService } from './storage.service';

export function createInMemoryStorage(): StorageService {
  process.env.BEACON_DB_PATH = ':memory:';
  try {
    return new StorageService();
  } finally {
    delete process.env.BEACON_DB_PATH;
  }
}

export function payloadOf(overrides: Partial<EventPayload> = {}): EventPayload {
  return {
    topic: 'orders.created',
    source: 'api',
    data: {},
    persist: false,
    ...overrides,
  };
}

export function jobStatus(
  storage: StorageService,
  id: string,
): { status: JobStatus; attempts: number } {
  return storage.db
    .prepare('SELECT status, attempts FROM jobs WHERE id = ?')
    .get(id) as { status: JobStatus; attempts: number };
}
