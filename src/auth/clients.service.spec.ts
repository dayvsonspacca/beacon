import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ClientsService } from './clients.service';

describe('ClientsService', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'beacon-config-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    delete process.env.BEACON_CONFIG_PATH;
  });

  function withConfig(toml: string): ClientsService {
    const path = join(dir, 'beacon.toml');
    writeFileSync(path, toml);
    process.env.BEACON_CONFIG_PATH = path;
    return new ClientsService();
  }

  it('refuses to boot without a config file', () => {
    process.env.BEACON_CONFIG_PATH = join(dir, 'missing.toml');

    expect(() => new ClientsService()).toThrow(/not found/);
  });

  it('loads clients and finds them by token', () => {
    const service = withConfig(`
      [[clients]]
      source = "blog"
      token = "btk_1"

      [[clients]]
      source = "checkout"
      token = "btk_2"
    `);

    expect(service.findByToken('btk_1')).toEqual({
      source: 'blog',
      token: 'btk_1',
    });
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
