import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EventsModule } from '../events/events.module';
import { SubscribeController } from './subscribe.controller';

@Module({
  imports: [AuthModule, EventsModule],
  controllers: [SubscribeController],
})
export class SubscribeModule {}
