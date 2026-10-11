import {
  AdoNetConnectionStringSyntaxError,
  tokenizeAdoNetConnectionString,
} from './connection-strings/tokenize-ado-net.ts';
import { PostgresConnectionStringError } from './postgres-connection-string-error.ts';

const OPTION_KEYS: ReadonlyMap<string, string> = new Map([
  ['host', 'host'],
  ['server', 'host'],
  ['port', 'port'],
  ['database', 'database'],
  ['username', 'username'],
  ['user id', 'username'],
  ['user name', 'username'],
  ['userid', 'username'],
  ['uid', 'username'],
  ['password', 'password'],
  ['pwd', 'password'],
  ['psw', 'password'],
  ['db', 'database'],
  ['ssl mode', 'sslmode'],
  ['sslmode', 'sslmode'],
]);

const SSL_MODES: ReadonlyMap<string, string> = new Map([
  ['disable', 'disable'],
  ['prefer', 'prefer'],
  ['require', 'require'],
  ['verifyca', 'verify-ca'],
  ['verifyfull', 'verify-full'],
]);

/**
 * Normalize PostgreSQL URIs or Npgsql key=value settings without dropping options.
 *
 * URIs pass through byte-for-byte. ADO.NET keys are case-insensitive; single/double
 * quoted values support delimiters and doubled quote escapes. Missing fields use
 * localhost:5432, database/user postgres and an empty password. Absent SSL Mode
 * leaves driver defaults; explicit modes preserve the requested TLS policy.
 *
 * @param connectionString - PostgreSQL URI or semicolon-separated Npgsql settings.
 * @returns A PostgreSQL URI with encoded credentials and database name.
 * @throws {PostgresConnectionStringError} For unknown keys, unrepresentable values,
 * certificate settings, SSL Mode=Allow, or malformed syntax.
 * @example
 * ```ts
 * import { normalizePostgresConnectionString } from '@netscript/database/connection-strings/postgres';
 * const url = normalizePostgresConnectionString(
 *   'Host=localhost;Username=app;Password=secret;Database=app;SSL Mode=VerifyFull',
 * );
 * console.log(url); // postgres://app:secret@localhost:5432/app?sslmode=verify-full
 * ```
 */
export function normalizePostgresConnectionString(connectionString: string): string {
  if (/^postgres(?:ql)?:\/\//i.test(connectionString)) return connectionString;

  const parts = readPostgresOptions(connectionString);
  const host = parts.get('host') ?? 'localhost';
  const port = parts.get('port') ?? '5432';
  const database = parts.get('database') ?? 'postgres';
  const username = parts.get('username') ?? 'postgres';
  const password = parts.get('password') ?? '';
  const sslmode = parts.get('sslmode');
  const tls = sslmode === undefined ? '' : `?${new URLSearchParams({ sslmode })}`;
  return `postgres://${username}:${password}@${host}:${port}/${database}${tls}`;
}

function readPostgresOptions(input: string): Map<string, string> {
  const parts = new Map<string, string>();
  try {
    for (const { key, value } of tokenizeAdoNetConnectionString(input)) {
      const option = OPTION_KEYS.get(key);
      if (!option) throw new PostgresConnectionStringError('unsupported-key', key);
      parts.set(option, translatePostgresValue(option, key, value));
    }
  } catch (error) {
    if (error instanceof AdoNetConnectionStringSyntaxError) {
      throw new PostgresConnectionStringError('invalid-format');
    }
    throw error;
  }
  if (parts.size === 0) throw new PostgresConnectionStringError('invalid-format');
  return parts;
}

function translatePostgresValue(option: string, key: string, value: string): string {
  if (option === 'sslmode') {
    const mode = SSL_MODES.get(value.toLowerCase());
    if (mode) return mode;
  } else if (option === 'host') {
    if (isSingleHost(value)) return value;
    if (isSingleHost(`[${value}]`)) return `[${value}]`;
  } else if (option === 'port') {
    if (/^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 65535) return value;
  } else if (option === 'database') {
    if (value && value !== '.' && value !== '..') return encodePostgresValue(value, key);
  } else if (option === 'password' || value) {
    return encodePostgresValue(value, key);
  }
  throw new PostgresConnectionStringError('unsupported-value', key);
}

function encodePostgresValue(value: string, key: string): string {
  if (value.includes('\0')) throw new PostgresConnectionStringError('unsupported-value', key);
  try {
    return encodeURIComponent(value).replace(
      /[!'()*]/g,
      (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
    );
  } catch (error) {
    if (error instanceof URIError) {
      throw new PostgresConnectionStringError('unsupported-value', key);
    }
    throw error;
  }
}

function isSingleHost(value: string): boolean {
  if (/^[a-z\d_.-]+$/i.test(value)) return true;
  if (!/^\[[a-f\d:]+\]$/i.test(value)) return false;
  try {
    new URL(`http://${value}`);
    return true;
  } catch {
    return false;
  }
}
