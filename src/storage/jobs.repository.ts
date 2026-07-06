import { Injectable } from '@nestjs/common';
import { StorageService } from './storage.service';

export interface NewJob {
  id: string;
  topic: string;
  payload: Record<string, any>;
}

export interface Job extends NewJob {
  status: string;
  attempts: number;
  createdAt: string;
}

interface JobRow {
  id: string;
  topic: string;
  payload: string;
  status: string;
  attempts: number;
  created_at: string;
}

@Injectable()
export class JobsRepository {
  constructor(private readonly storage: StorageService) {}

  insert(job: NewJob): void {
    this.storage.db
      .prepare('INSERT INTO jobs (id, topic, payload) VALUES (?, ?, ?)')
      .run(job.id, job.topic, JSON.stringify(job.payload));
  }

  claimNext(): Job | undefined {
    const row = this.storage.db
      .prepare(
        `UPDATE jobs SET status = 'processing', attempts = attempts + 1
         WHERE id = (
           SELECT id FROM jobs
           WHERE status = 'queued'
             AND available_at <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
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
      payload: JSON.parse(row.payload) as Record<string, any>,
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

  private setStatus(id: string, status: string): void {
    this.storage.db
      .prepare('UPDATE jobs SET status = ? WHERE id = ?')
      .run(status, id);
  }
}
