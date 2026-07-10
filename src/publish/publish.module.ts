import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EventsModule } from '../events/events.module';
import { PublishController } from './publish.controller';

@Module({
  imports: [AuthModule, EventsModule],
  controllers: [PublishController],
})
export class PublishModule {}
