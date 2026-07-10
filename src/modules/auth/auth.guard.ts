import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { Source } from '../../core/source';
import { SourceService } from './source.service';

export type AuthenticatedRequest = Request & { source?: Source };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly sources: SourceService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    const source = token ? this.sources.findByToken(token) : undefined;

    if (!source) {
      throw new UnauthorizedException('invalid or missing bearer token');
    }

    request.source = source;
    return true;
  }
}
