import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health.controller';
import { PublishModule } from './publish/publish.module';
import { SubscribeModule } from './subscribe/subscribe.module';

@Module({
  imports: [AuthModule, PublishModule, SubscribeModule],
  controllers: [HealthController],
})
export class AppModule {}
