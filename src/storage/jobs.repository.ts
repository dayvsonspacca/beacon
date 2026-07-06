import { Injectable } from '@nestjs/common';
import { StorageService } from './storage.service';

export interface NewJob {
  id: string;
  topic: string;
  payload: Record<string, any>;
}

@Injectable()
export class JobsRepository {
  constructor(private readonly storage: StorageService) {}

  insert(job: NewJob): void {
    this.storage.db
      .prepare('INSERT INTO jobs (id, topic, payload) VALUES (?, ?, ?)')
      .run(job.id, job.topic, JSON.stringify(job.payload));
  }
}
