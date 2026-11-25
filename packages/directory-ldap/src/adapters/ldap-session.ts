/**
 * Startup secret/CA file loaders, deadline/abort guards, and ordered multi-host LDAP failover.
 *
 * @module
 */

import {
  type CallContext,
  DirectoryTimeout,
  DirectoryUnauthorized,
  DirectoryUnavailable,
  DirectoryUnsupported,
} from '@netscript/plugin-directory-core';
import { mapLdapError, type ResolvedLdapConfig, type ResolvedLdapHost } from '../domain/mod.ts';
import type { LdapClientConnectOptions, LdapClientFactory, LdapClientPort } from '../ports/mod.ts';

type TimerHandle = ReturnType<typeof setTimeout>;

function stripTrailingNewlines(value: string): string {
  return value.replace(/(?:\r?\n)+$/, '');
}

/** Reads the bind password file once at startup and rejects missing or empty files. */
export async function readSecretFileAtStartup(path: string): Promise<string> {
  let content: string;
  try {
    content = await Deno.readTextFile(path);
  } catch {
    throw new Error('Failed to read LDAP bindPasswordFile at startup.');
  }
  const secret = stripTrailingNewlines(content);
  if (secret.length === 0) {
    throw new RangeError('LDAP bindPasswordFile must contain a non-empty secret.');
  }
  return secret;
}

/** Reads an optional custom PEM CA bundle once at startup and rejects empty files. */
export async function readCaFileAtStartup(path: string): Promise<string> {
  let content: string;
  try {
    content = await Deno.readTextFile(path);
  } catch {
    throw new Error('Failed to read LDAP tls.caFile at startup.');
  }
  const pem = content.trim();
  if (pem.length === 0) {
    throw new RangeError('LDAP tls.caFile must contain PEM certificate data.');
  }
  return pem;
}

/** Resolves effective timeout budget in milliseconds from `CallContext` or adapter default. */
export function resolveCallTimeoutMs(ctx: CallContext, defaultTimeoutMs: number): number {
  if (ctx.timeoutMs === undefined) {
    return defaultTimeoutMs;
  }
  if (!Number.isFinite(ctx.timeoutMs)) {
    throw new RangeError('CallContext.timeoutMs must be a finite number.');
  }
  return ctx.timeoutMs;
}

/** Fails closed with `DirectoryTimeout` when `ctx` is already aborted or has non-positive budget. */
export function assertNotTimedOutOrAborted(
  directoryName: string,
  operation: string,
  ctx: CallContext,
  timeoutMs: number,
): void {
  if (ctx.signal?.aborted) {
    throw new DirectoryTimeout(
      directoryName,
      operation,
      'Directory call was aborted before execution.',
      { timeoutMs },
    );
  }
  if (timeoutMs <= 0) {
    throw new DirectoryTimeout(
      directoryName,
      operation,
      `Directory call exceeded timeout budget (${timeoutMs}ms).`,
      { timeoutMs },
    );
  }
}

async function runWithDeadline<T>(
  operation: () => Promise<T>,
  onCancel: () => void,
  directoryName: string,
  operationName: string,
  remainingMs: number,
  signal: AbortSignal | undefined,
): Promise<T> {
  if (signal?.aborted || remainingMs <= 0) {
    onCancel();
    throw new DirectoryTimeout(
      directoryName,
      operationName,
      'LDAP directory operation exceeded its timeout budget.',
      { timeoutMs: Math.max(0, remainingMs) },
    );
  }

  let timer: TimerHandle | undefined;
  let onAbort: (() => void) | undefined;

  const deadlinePromise = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      onCancel();
      reject(
        new DirectoryTimeout(
          directoryName,
          operationName,
          'LDAP directory operation exceeded its timeout budget.',
          { timeoutMs: remainingMs },
        ),
      );
    }, remainingMs);

    if (signal) {
      onAbort = () => {
        onCancel();
        reject(
          new DirectoryTimeout(
            directoryName,
            operationName,
            'LDAP directory operation was aborted.',
            { timeoutMs: remainingMs },
          ),
        );
      };
      signal.addEventListener('abort', onAbort, { once: true });
    }
  });

  try {
    return await Promise.race([operation(), deadlinePromise]);
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    if (signal && onAbort) {
      signal.removeEventListener('abort', onAbort);
    }
  }
}

function toLdapTimeLimitSeconds(remainingMs: number): number {
  return Math.max(1, Math.ceil(remainingMs / 1_000));
}

/** Bound LDAP host runner supporting single-host probes and ordered multi-host failover. */
export interface LdapSessionRunner {
  runOnHost<T>(
    host: ResolvedLdapHost,
    operationName: string,
    remainingMs: number,
    signal: AbortSignal | undefined,
    task: (client: LdapClientPort, timeLimitSeconds: number) => Promise<T>,
  ): Promise<T>;
  withFailover<T>(
    operationName: string,
    ctx: CallContext,
    task: (client: LdapClientPort, timeLimitSeconds: number) => Promise<T>,
  ): Promise<T>;
}

/** Creates an {@link LdapSessionRunner} encapsulating bind password, CA PEM, and host failover. */
export function createLdapSessionRunner(
  config: ResolvedLdapConfig,
  bindPassword: string,
  caPem: string | undefined,
  clientFactory: LdapClientFactory,
): LdapSessionRunner {
  function buildConnectOptions(
    host: ResolvedLdapHost,
    timeoutMs: number,
  ): LdapClientConnectOptions {
    const servername = config.servername ?? host.hostname;
    return {
      url: host.url,
      timeoutMs,
      connectTimeoutMs: Math.min(config.connectTimeoutMs, timeoutMs),
      ...(host.directTls
        ? {
          tlsOptions: {
            rejectUnauthorized: true,
            ...(caPem !== undefined ? { ca: caPem } : {}),
            servername,
          },
        }
        : {}),
    };
  }

  async function runOnHost<T>(
    host: ResolvedLdapHost,
    operationName: string,
    remainingMs: number,
    signal: AbortSignal | undefined,
    task: (client: LdapClientPort, timeLimitSeconds: number) => Promise<T>,
  ): Promise<T> {
    const client = clientFactory(buildConnectOptions(host, remainingMs));
    let unbound = false;
    const safeUnbind = (): void => {
      if (unbound) return;
      unbound = true;
      void client.unbind().catch(() => {});
    };

    try {
      return await runWithDeadline(
        async () => {
          if (host.useStartTls) {
            await client.startTLS({
              rejectUnauthorized: true,
              ...(caPem !== undefined ? { ca: caPem } : {}),
              servername: config.servername ?? host.hostname,
            });
          }
          await client.bind(config.bindDn, bindPassword);
          return await task(client, toLdapTimeLimitSeconds(remainingMs));
        },
        safeUnbind,
        config.name,
        operationName,
        remainingMs,
        signal,
      );
    } catch (err) {
      throw mapLdapError(err, config.name, operationName, remainingMs);
    } finally {
      if (!unbound) {
        unbound = true;
        try {
          await client.unbind();
        } catch {
          // Ignore close errors after operation completion.
        }
      }
    }
  }

  async function withFailover<T>(
    operationName: string,
    ctx: CallContext,
    task: (client: LdapClientPort, timeLimitSeconds: number) => Promise<T>,
  ): Promise<T> {
    const timeoutMs = resolveCallTimeoutMs(ctx, config.defaultTimeoutMs);
    assertNotTimedOutOrAborted(config.name, operationName, ctx, timeoutMs);
    const deadlineWallMs = Date.now() + timeoutMs;

    let lastError: unknown;
    let sawTimeout = false;
    let sawUnavailable = false;

    for (const host of config.hosts) {
      const remainingMs = deadlineWallMs - Date.now();
      if (ctx.signal?.aborted || remainingMs <= 0) {
        throw new DirectoryTimeout(
          config.name,
          operationName,
          'LDAP directory operation exceeded its timeout budget.',
          { timeoutMs },
        );
      }
      try {
        return await runOnHost(host, operationName, remainingMs, ctx.signal, task);
      } catch (err) {
        const mapped = mapLdapError(err, config.name, operationName, timeoutMs);
        if (mapped instanceof DirectoryUnauthorized || mapped instanceof DirectoryUnsupported) {
          throw mapped;
        }
        if (mapped instanceof DirectoryTimeout) {
          sawTimeout = true;
        } else {
          sawUnavailable = true;
        }
        lastError = mapped;
      }
    }

    if (sawTimeout && !sawUnavailable) {
      throw lastError instanceof DirectoryTimeout
        ? lastError
        : new DirectoryTimeout(config.name, operationName, 'All configured LDAP hosts timed out.', {
          timeoutMs,
        });
    }
    throw lastError instanceof DirectoryUnavailable ? lastError : new DirectoryUnavailable(
      config.name,
      operationName,
      'All configured LDAP hosts were unreachable.',
    );
  }

  return { runOnHost, withFailover };
}
