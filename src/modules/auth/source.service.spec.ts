import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SourceService } from './source.service';

describe('SourceService', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'beacon-config-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    delete process.env.BEACON_CONFIG_PATH;
  });

  function withConfig(toml: string): SourceService {
    const path = join(dir, 'beacon.toml');
    writeFileSync(path, toml);
    process.env.BEACON_CONFIG_PATH = path;
    const service = new SourceService();
    service.onModuleInit();
    return service;
  }

  it('refuses to boot without a config file', () => {
    process.env.BEACON_CONFIG_PATH = join(dir, 'missing.toml');

    expect(() => new SourceService().onModuleInit()).toThrow(/not found/);
  });

  it('loads sources and finds them by token', () => {
    const service = withConfig(`
      [[clients]]
      source = "blog"
      token = "btk_1"

      [[clients]]
      source = "checkout"
      token = "btk_2"
    `);

    expect(service.findByToken('btk_1')?.id).toBe('blog');
    expect(service.findByToken('btk_unknown')).toBeUndefined();
  });

  it.each([
    ['empty file', ''],
    ['missing token', '[[clients]]\nsource = "blog"'],
    ['missing source', '[[clients]]\ntoken = "btk_1"'],
    ['empty source', '[[clients]]\nsource = " "\ntoken = "btk_1"'],
    [
      'duplicate source',
      '[[clients]]\nsource = "a"\ntoken = "t1"\n[[clients]]\nsource = "a"\ntoken = "t2"',
    ],
    [
      'duplicate token',
      '[[clients]]\nname = "a"\ntoken = "t1"\n[[clients]]\nname = "b"\ntoken = "t1"',
    ],
  ])('rejects invalid config: %s', (_label, toml) => {
    expect(() => withConfig(toml)).toThrow();
  });
});
