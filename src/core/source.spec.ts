import { describe, it, expect } from 'bun:test';
import { Source } from './source';

describe('Source', () => {
  it('trims the id on construction', () => {
    expect(Source.of('  billing-service ').id).toBe('billing-service');
  });

  it('rejects empty ids', () => {
    expect(() => Source.of('   ')).toThrow('source id must be non-empty');
  });

  it('compares by id', () => {
    expect(Source.of('api').equals(Source.of('api'))).toBe(true);
    expect(Source.of('api').equals(Source.of('worker'))).toBe(false);
  });

  it('stringifies to its id', () => {
    expect(String(Source.of('api'))).toBe('api');
  });
});
