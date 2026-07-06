import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { QueueWorker } from './queue.worker';

@Module({
  imports: [StorageModule],
  providers: [QueueWorker],
})
export class QueueModule {}
