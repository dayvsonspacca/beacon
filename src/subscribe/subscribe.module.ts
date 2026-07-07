import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { StorageModule } from '../storage/storage.module';
import { SubscribeController } from './subscribe.controller';

@Module({
  imports: [EventsModule, StorageModule],
  controllers: [SubscribeController],
})
export class SubscribeModule {}
