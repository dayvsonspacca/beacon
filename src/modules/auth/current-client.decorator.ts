import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from './auth.guard';
import { BeaconClient } from './clients.service';

export const CurrentClient = createParamDecorator(
  (_data: unknown, context: ExecutionContext): BeaconClient => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.client) {
      throw new Error('no authenticated client on request (guard missing?)');
    }
    return request.client;
  },
);
