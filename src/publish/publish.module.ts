import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { PublishController } from './publish.controller';

@Module({
  imports: [EventsModule],
  controllers: [PublishController],
})
export class PublishModule {}
