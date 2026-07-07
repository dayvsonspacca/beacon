import { Injectable } from '@nestjs/common';
import { EventPayload } from '../events/event-payload';
import { matchesTopic } from '../events/topics';
import { StorageService } from './storage.service';

export type JobStatus = 'queued' | 'processing' | 'done' | 'failed';

export interface NewJob {
  id: string;
  payload: EventPayload;
}

export interface Job extends NewJob {
  topic: string;
  status: JobStatus;
  attempts: number;
  createdAt: string;
}

interface JobRow {
  id: string;
  topic: string;
  payload: string;
  status: JobStatus;
  attempts: number;
  created_at: string;
}

const NOW_UTC = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

function toNewJob(row: Pick<JobRow, 'id' | 'payload'>): NewJob {
  return {
    id: row.id,
    payload: JSON.parse(row.payload) as EventPayload,
  };
}

@Injectable()
export class JobsRepository {
  constructor(private readonly storage: StorageService) {}

  insert(job: NewJob): void {
    this.storage.db
      .prepare('INSERT INTO jobs (id, topic, payload) VALUES (?, ?, ?)')
      .run(job.id, job.payload.topic, JSON.stringify(job.payload));
  }

  /** The last `limit` delivered events matching `pattern`, oldest first. */
  findLastDelivered(pattern: string, limit: number): NewJob[] {
    const newest: NewJob[] = [];

    if (!pattern.includes('*')) {
      const rows = this.storage.db
        .prepare(
          `SELECT id, payload FROM jobs
           WHERE status = 'done' AND topic = ?
           ORDER BY created_at DESC, id DESC LIMIT ?`,
        )
        .all(pattern, limit) as unknown as JobRow[];
      newest.push(...rows.map(toNewJob));
    } else {
      const rows = this.storage.db
        .prepare(
          `SELECT id, topic, payload FROM jobs
           WHERE status = 'done'
           ORDER BY created_at DESC, id DESC`,
        )
        .iterate() as IterableIterator<JobRow>;
      for (const row of rows) {
        if (!matchesTopic(row.topic, pattern)) continue;
        newest.push(toNewJob(row));
        if (newest.length === limit) break;
      }
    }

    return newest.reverse();
  }

  claimNext(): Job | undefined {
    const row = this.storage.db
      .prepare(
        `UPDATE jobs SET status = 'processing', attempts = attempts + 1
         WHERE id = (
           SELECT id FROM jobs
           WHERE status = 'queued' AND available_at <= ${NOW_UTC}
           ORDER BY created_at LIMIT 1
         )
         RETURNING *`,
      )
      .get() as JobRow | undefined;

    if (!row) {
      return undefined;
    }
    return {
      id: row.id,
      topic: row.topic,
      payload: JSON.parse(row.payload) as EventPayload,
      status: row.status,
      attempts: row.attempts,
      createdAt: row.created_at,
    };
  }

  markDone(id: string): void {
    this.setStatus(id, 'done');
  }

  markFailed(id: string): void {
    this.setStatus(id, 'failed');
  }

  requeue(id: string, delaySeconds = 0): void {
    this.storage.db
      .prepare(
        `UPDATE jobs SET status = 'queued',
         available_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+' || ? || ' seconds')
         WHERE id = ?`,
      )
      .run(delaySeconds, id);
  }

  private setStatus(id: string, status: JobStatus): void {
    this.storage.db
      .prepare('UPDATE jobs SET status = ? WHERE id = ?')
      .run(status, id);
  }
}
