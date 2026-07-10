import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { HealthController } from './health/health.controller';
import { PublishModule } from './modules/publish/publish.module';
import { SubscribeModule } from './modules/subscribe/subscribe.module';

@Module({
  imports: [AuthModule, PublishModule, SubscribeModule],
  controllers: [HealthController],
})
export class AppModule {}
