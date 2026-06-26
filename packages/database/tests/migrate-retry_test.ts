/**
 * Tests for the bounded, signature-scoped Prisma migration retry that makes
 * `db init` deterministic against the transient Windows schema-engine
 * `ERR_STREAM_PREMATURE_CLOSE` failure.
 *
 * @module
 */

import { assertEquals } from 'jsr:@std/assert@^1';
import { describe, it } from 'jsr:@std/testing@^1/bdd';

import {
  isRetriableMigrationFailure,
  type PrismaSpawn,
  type PrismaSpawnOptions,
  type PrismaSpawnResult,
  runPrismaWithRetry,
} from '../scripts/migrate.ts';

const PREMATURE_CLOSE = [
  'Datasource "db": PostgreSQL database "app-db", schema "public" at "localhost:51148"',
  'Error: Schema engine exited. Error [ERR_STREAM_PREMATURE_CLOSE]: Command failed with',
  'ERR_STREAM_PREMATURE_CLOSE: schema-engine-windows.exe cli can-connect-to-database',
  'Premature close',
].join('\n');

const REAL_SCHEMA_ERROR = [
  'Error: P1012',
  'error: Argument "provider" is missing in data source block "db".',
].join('\n');

function noopLog(_message: string): void {}

function createRetryOptions(
  overrides: Partial<Parameters<typeof runPrismaWithRetry>[1]>,
): Parameters<typeof runPrismaWithRetry>[1] {
  return {
    interactive: false,
    maxAttempts: 4,
    baseRetryDelayMs: 10,
    maxRetryDelayMs: 100,
    attemptTimeoutMs: 45_000,
    log: noopLog,
    ...overrides,
  };
}

function scriptedSpawn(results: PrismaSpawnResult[]): {
  spawn: PrismaSpawn;
  calls: () => number;
  options: () => PrismaSpawnOptions[];
} {
  let index = 0;
  const seenOptions: PrismaSpawnOptions[] = [];
  const spawn: PrismaSpawn = (_args, _interactive, options) => {
    seenOptions.push(options);
    const result = results[Math.min(index, results.length - 1)];
    index += 1;
    return Promise.resolve(result);
  };
  return { spawn, calls: () => index, options: () => seenOptions };
}

describe('isRetriableMigrationFailure', () => {
  it('matches the schema-engine premature-close signature', () => {
    assertEquals(isRetriableMigrationFailure(PREMATURE_CLOSE), true);
    assertEquals(isRetriableMigrationFailure('Error [ERR_STREAM_PREMATURE_CLOSE]'), true);
    assertEquals(isRetriableMigrationFailure('Schema engine exited.'), true);
    assertEquals(isRetriableMigrationFailure('xxx Premature close yyy'), true);
    assertEquals(
      isRetriableMigrationFailure('schema-engine-windows.exe cli can-connect-to-database'),
      true,
    );
    assertEquals(
      isRetriableMigrationFailure('Timed out waiting for Prisma schema engine after 45000ms'),
      true,
    );
  });

  it('does not match real schema/SQL errors', () => {
    assertEquals(isRetriableMigrationFailure(REAL_SCHEMA_ERROR), false);
    assertEquals(isRetriableMigrationFailure("P1001: Can't reach database server"), false);
    assertEquals(isRetriableMigrationFailure(''), false);
  });
});

describe('runPrismaWithRetry', () => {
  it('retries the transient failure and then succeeds', async () => {
    const { spawn, calls, options } = scriptedSpawn([
      { code: 1, stderr: PREMATURE_CLOSE },
      { code: 1, stderr: PREMATURE_CLOSE },
      { code: 0, stderr: '' },
    ]);
    const sleeps: number[] = [];
    const code = await runPrismaWithRetry(
      { label: 'migrate dev', args: ['migrate', 'dev'] },
      createRetryOptions({
        spawn,
        sleep: (ms) => {
          sleeps.push(ms);
          return Promise.resolve();
        },
      }),
    );
    assertEquals(code, 0);
    assertEquals(calls(), 3);
    assertEquals(sleeps, [10, 20]);
    assertEquals(options().map((option) => option.timeoutMs), [45_000, 45_000, 45_000]);
  });

  it('stops at maxAttempts when the transient failure persists', async () => {
    const { spawn, calls } = scriptedSpawn([{ code: 1, stderr: PREMATURE_CLOSE }]);
    const logs: string[] = [];
    const code = await runPrismaWithRetry(
      { label: 'migrate dev', args: ['migrate', 'dev'] },
      createRetryOptions({
        maxAttempts: 3,
        baseRetryDelayMs: 0,
        log: (message) => logs.push(message),
        spawn,
        sleep: () => Promise.resolve(),
      }),
    );
    assertEquals(code, 1);
    assertEquals(calls(), 3);
    assertEquals(logs.at(-1)?.includes('exhausted 3 attempts'), true);
  });

  it('caps exponential retry delays', async () => {
    const { spawn } = scriptedSpawn([
      { code: 1, stderr: PREMATURE_CLOSE },
      { code: 1, stderr: PREMATURE_CLOSE },
      { code: 1, stderr: PREMATURE_CLOSE },
      { code: 0, stderr: '' },
    ]);
    const sleeps: number[] = [];
    const code = await runPrismaWithRetry(
      { label: 'migrate dev', args: ['migrate', 'dev'] },
      createRetryOptions({
        maxAttempts: 4,
        baseRetryDelayMs: 10,
        maxRetryDelayMs: 15,
        spawn,
        sleep: (ms) => {
          sleeps.push(ms);
          return Promise.resolve();
        },
      }),
    );
    assertEquals(code, 0);
    assertEquals(sleeps, [10, 15, 15]);
  });

  it('never retries a real schema error (no masking)', async () => {
    const { spawn, calls } = scriptedSpawn([{ code: 1, stderr: REAL_SCHEMA_ERROR }]);
    const code = await runPrismaWithRetry(
      { label: 'migrate dev', args: ['migrate', 'dev'] },
      createRetryOptions({
        spawn,
        sleep: () => Promise.resolve(),
      }),
    );
    assertEquals(code, 1);
    assertEquals(calls(), 1);
  });

  it('runs interactive invocations exactly once with no retry', async () => {
    const { spawn, calls, options } = scriptedSpawn([{ code: 1, stderr: '' }]);
    const code = await runPrismaWithRetry(
      { label: 'migrate dev', args: ['migrate', 'dev'] },
      createRetryOptions({
        interactive: true,
        maxAttempts: 4,
        baseRetryDelayMs: 0,
        spawn,
        sleep: () => Promise.resolve(),
      }),
    );
    assertEquals(code, 1);
    assertEquals(calls(), 1);
    assertEquals(options(), [{ timeoutMs: undefined }]);
  });

  it('returns 0 immediately on first-attempt success', async () => {
    const { spawn, calls } = scriptedSpawn([{ code: 0, stderr: '' }]);
    const code = await runPrismaWithRetry(
      { label: 'migrate dev', args: ['migrate', 'dev'] },
      createRetryOptions({
        spawn,
        sleep: () => Promise.resolve(),
      }),
    );
    assertEquals(code, 0);
    assertEquals(calls(), 1);
  });
});
