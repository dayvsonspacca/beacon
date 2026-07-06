import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class StorageService implements OnModuleDestroy {
  private readonly logger = new Logger(StorageService.name);
  readonly db: DatabaseSync;

  constructor() {
    const path = process.env.BEACON_DB_PATH ?? 'data/beacon.db';
    if (path !== ':memory:') {
      mkdirSync(dirname(path), { recursive: true });
    }

    this.db = new DatabaseSync(path);
    this.db.exec('PRAGMA journal_mode = WAL');
    this.db.exec(readFileSync(join(__dirname, 'schema.sql'), 'utf8'));
    this.logger.log(`database ready at ${path}`);
  }

  onModuleDestroy(): void {
    this.db.close();
  }
}
