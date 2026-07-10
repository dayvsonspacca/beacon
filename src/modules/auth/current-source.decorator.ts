import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Source } from '../../core/source';
import { AuthenticatedRequest } from './auth.guard';

export const CurrentSource = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Source => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.source) {
      throw new Error('no authenticated source on request (guard missing?)');
    }
    return request.source;
  },
);
