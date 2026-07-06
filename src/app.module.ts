import { Module } from '@nestjs/common';
import { PublishModule } from './publish/publish.module';

@Module({
  imports: [PublishModule],
})
export class AppModule {}
