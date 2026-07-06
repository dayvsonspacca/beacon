import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { StorageModule } from '../storage/storage.module';
import { QueueWorker } from './queue.worker';

@Module({
  imports: [StorageModule, EventsModule],
  providers: [QueueWorker],
})
export class QueueModule {}
