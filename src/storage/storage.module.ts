import { Module } from '@nestjs/common';
import { JobsRepository } from './jobs.repository';
import { StorageService } from './storage.service';

@Module({
  providers: [StorageService, JobsRepository],
  exports: [JobsRepository],
})
export class StorageModule {}
