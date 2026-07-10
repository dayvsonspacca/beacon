import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { BeaconClient, ClientsService } from './clients.service';

export type AuthenticatedRequest = Request & { client?: BeaconClient };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly clients: ClientsService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    const client = token ? this.clients.findByToken(token) : undefined;

    if (!client) {
      throw new UnauthorizedException('invalid or missing bearer token');
    }

    request.client = client;
    return true;
  }
}
