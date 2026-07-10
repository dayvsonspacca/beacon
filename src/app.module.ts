import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { PublishModule } from './publish/publish.module';
import { SubscribeModule } from './subscribe/subscribe.module';

@Module({
  imports: [AuthModule, HealthModule, PublishModule, SubscribeModule],
})
export class AppModule {}
