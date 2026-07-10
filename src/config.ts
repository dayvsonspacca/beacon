/** Instance configuration, resolved from environment variables. */

export function clientsConfigPath(): string {
  return process.env.BEACON_CONFIG_PATH ?? 'beacon.toml';
}
