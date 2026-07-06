import { Module } from '@nestjs/common';
import { PublishModule } from './publish/publish.module';
import { QueueModule } from './queue/queue.module';
import { StorageModule } from './storage/storage.module';
import { SubscribeModule } from './subscribe/subscribe.module';

@Module({
  imports: [StorageModule, PublishModule, QueueModule, SubscribeModule],
})
export class AppModule {}
