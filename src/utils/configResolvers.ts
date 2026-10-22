/* eslint-disable no-unused-vars */
import config from './configUtils';

export const DEFAULT_LISTEN_HOST = '127.0.0.1';

export const DEFAULT_LOG_LEVEL = 'info';

export interface KeyValueConfig {
  has(key: string): boolean;
  get<T>(key: string): T;
}

const defaultConfig = (config as unknown) as KeyValueConfig;

/**
 * Reads an optional string key and falls back to a default when the key is
 * absent or blank, so that a missing/empty configuration value never changes
 * the behaviour silently nor crashes the application at startup.
 */
const resolveString = (cfg: KeyValueConfig, key: string, fallback: string): string => {
  const value = cfg.has(key) ? String(cfg.get<unknown>(key) ?? '').trim() : '';

  return value === '' ? fallback : value;
};

/**
 * Host the API binds to. Defaults to loopback so that the API is only
 * reachable through the reverse proxy; set the `host` configuration key to
 * override (e.g. "0.0.0.0" when a deliberate LAN-exposed run is needed).
 */
export const getListenHost = (cfg: KeyValueConfig = defaultConfig): string => resolveString(cfg, 'host', DEFAULT_LISTEN_HOST);

/**
 * Log level used by winston. Defaults to info, so that production does not
 * emit debug lines when the configuration file omits the key.
 */
export const getLogLevel = (cfg: KeyValueConfig = defaultConfig): string => resolveString(cfg, 'LogLevel', DEFAULT_LOG_LEVEL);
