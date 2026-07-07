/** Instance configuration, resolved from environment variables. */

export function databasePath(): string {
  return process.env.BEACON_DB_PATH ?? 'data/beacon.db';
}

export function clientsConfigPath(): string {
  return process.env.BEACON_CONFIG_PATH ?? 'beacon.toml';
}
