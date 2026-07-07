import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { ClientsService } from './clients.service';

@Module({
  providers: [ClientsService, { provide: APP_GUARD, useClass: AuthGuard }],
  exports: [ClientsService],
})
export class AuthModule {}
