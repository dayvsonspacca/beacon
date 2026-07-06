import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { SubscribeController } from './subscribe.controller';

@Module({
  imports: [EventsModule],
  controllers: [SubscribeController],
})
export class SubscribeModule {}
