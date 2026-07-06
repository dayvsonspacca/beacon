import { Module } from '@nestjs/common';
import { PublishModule } from './publish/publish.module';
import { QueueModule } from './queue/queue.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [StorageModule, PublishModule, QueueModule],
})
export class AppModule {}
