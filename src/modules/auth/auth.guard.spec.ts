import { describe, it, expect } from 'bun:test';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Source } from '../../core/source';
import { AuthGuard, AuthenticatedRequest } from './auth.guard';
import { SourceService } from './source.service';

function fakeSources(entries: Array<[string, Source]>): SourceService {
  const byToken = new Map(entries);
  return {
    findByToken: (token: string) => byToken.get(token),
  } as SourceService;
}

function contextFor(request: Partial<AuthenticatedRequest>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as ExecutionContext;
}

describe('AuthGuard', () => {
  const blog = Source.of('blog');

  it('allows a valid bearer token and attaches the source', () => {
    const guard = new AuthGuard(fakeSources([['btk_1', blog]]));
    const request: Partial<AuthenticatedRequest> = {
      headers: { authorization: 'Bearer btk_1' },
    };

    expect(guard.canActivate(contextFor(request))).toBe(true);
    expect(request.source).toBe(blog);
  });

  it.each([
    ['missing header', {}],
    ['not a bearer scheme', { authorization: 'Basic btk_1' }],
    ['unknown token', { authorization: 'Bearer btk_wrong' }],
    ['empty token', { authorization: 'Bearer ' }],
  ])('rejects request with %s', (_label, headers) => {
    const guard = new AuthGuard(fakeSources([['btk_1', blog]]));

    expect(() => guard.canActivate(contextFor({ headers }))).toThrow(
      UnauthorizedException,
    );
  });
});
