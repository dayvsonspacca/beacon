import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard, AuthenticatedRequest } from './auth.guard';
import { BeaconClient, ClientsService } from './clients.service';

function fakeClients(clients: BeaconClient[]): ClientsService {
  const byToken = new Map(clients.map((c) => [c.token, c]));
  return {
    findByToken: (token: string) => byToken.get(token),
  } as ClientsService;
}

function contextFor(request: Partial<AuthenticatedRequest>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as ExecutionContext;
}

describe('AuthGuard', () => {
  const blog: BeaconClient = { source: 'blog', token: 'btk_1' };

  it('allows a valid bearer token and attaches the client', () => {
    const guard = new AuthGuard(fakeClients([blog]));
    const request: Partial<AuthenticatedRequest> = {
      headers: { authorization: 'Bearer btk_1' },
    };

    expect(guard.canActivate(contextFor(request))).toBe(true);
    expect(request.client).toEqual(blog);
  });

  it.each([
    ['missing header', {}],
    ['not a bearer scheme', { authorization: 'Basic btk_1' }],
    ['unknown token', { authorization: 'Bearer btk_wrong' }],
    ['empty token', { authorization: 'Bearer ' }],
  ])('rejects request with %s', (_label, headers) => {
    const guard = new AuthGuard(fakeClients([blog]));

    expect(() => guard.canActivate(contextFor({ headers }))).toThrow(
      UnauthorizedException,
    );
  });
});
