import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { PublishController } from './publish.controller';

@Module({
  imports: [StorageModule],
  controllers: [PublishController],
})
export class PublishModule {}
