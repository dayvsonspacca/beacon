import { existsSync, readFileSync } from 'node:fs';
import { Injectable, Logger } from '@nestjs/common';
import { parse } from 'smol-toml';

export interface BeaconClient {
  source: string;
  token: string;
}

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);
  private readonly byToken = new Map<string, BeaconClient>();

  constructor() {
    const path = process.env.BEACON_CONFIG_PATH ?? 'beacon.toml';
    if (!existsSync(path)) {
      throw new Error(
        `${path} not found — beacon requires a client config; copy beacon.toml.example and set your tokens`,
      );
    }

    for (const client of this.parseClients(path)) {
      this.byToken.set(client.token, client);
    }
    this.logger.log(`authentication enabled (${this.byToken.size} clients)`);
  }

  findByToken(token: string): BeaconClient | undefined {
    return this.byToken.get(token);
  }

  private parseClients(path: string): BeaconClient[] {
    const config = parse(readFileSync(path, 'utf8'));
    const clients = config.clients;
    if (!Array.isArray(clients) || clients.length === 0) {
      throw new Error(`${path}: expected at least one [[clients]] entry`);
    }

    const sources = new Set<string>();
    const tokens = new Set<string>();
    return clients.map((entry, i) => {
      const { source, token } = entry as Record<string, unknown>;
      if (typeof source !== 'string' || source.trim() === '') {
        throw new Error(`${path}: clients[${i}] needs a non-empty "source"`);
      }
      if (typeof token !== 'string' || token.trim() === '') {
        throw new Error(`${path}: clients[${i}] needs a non-empty "token"`);
      }
      if (sources.has(source)) {
        throw new Error(`${path}: duplicate client source "${source}"`);
      }
      if (tokens.has(token)) {
        throw new Error(`${path}: duplicate token (clients[${i}])`);
      }
      sources.add(source);
      tokens.add(token);
      return { source, token };
    });
  }
}
