import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PublishModule } from './publish/publish.module';
import { SubscribeModule } from './subscribe/subscribe.module';

@Module({
  imports: [AuthModule, PublishModule, SubscribeModule],
})
export class AppModule {}
