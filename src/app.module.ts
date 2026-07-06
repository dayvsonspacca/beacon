import { Module } from '@nestjs/common';
import { PublishModule } from './publish/publish.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [StorageModule, PublishModule],
})
export class AppModule {}
