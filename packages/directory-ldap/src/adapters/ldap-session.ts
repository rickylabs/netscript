/**
 * Startup secret/CA file loaders, shared deadline/abort guards, and hung-host-resilient
 * multi-host LDAP failover.
 *
 * @module
 */

import {
  assertDirectoryCallContext,
  type CallContext,
  classifyDirectoryAbortError,
  DirectoryTimeout,
  DirectoryUnauthorized,
  DirectoryUnavailable,
  DirectoryUnsupported,
  runWithDirectoryDeadline,
} from '@netscript/plugin-directory-core';
import {
  isLdapBaseDnMisconfigurationError,
  isNonLdapProgramError,
  mapLdapError,
  type ResolvedLdapConfig,
  type ResolvedLdapHost,
} from '../domain/mod.ts';
import type { LdapClientConnectOptions, LdapClientFactory, LdapClientPort } from '../ports/mod.ts';

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

/** Reads an optional custom PEM CA bundle once at startup and validates PEM certificate framing. */
export async function readCaFileAtStartup(path: string): Promise<string> {
  let content: string;
  try {
    content = await Deno.readTextFile(path);
  } catch {
    throw new Error('Failed to read LDAP tls.caFile at startup.');
  }
  const pem = content.trim();
  if (
    pem.length === 0 ||
    !pem.includes('-----BEGIN CERTIFICATE-----') ||
    !pem.includes('-----END CERTIFICATE-----')
  ) {
    throw new RangeError(
      'LDAP tls.caFile must contain PEM-encoded certificate data (-----BEGIN CERTIFICATE-----).',
    );
  }
  return pem;
}

function toLdapTimeLimitSeconds(remainingMs: number): number {
  return Math.max(1, Math.ceil(remainingMs / 1_000));
}

/** Bound LDAP host runner supporting single-host probes and multi-host failover. */
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
  let preferredHostIndex = 0;

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

    const attemptDeadlineMs = Date.now() + remainingMs;
    const handshakeBudgetMs = Math.max(1, Math.min(config.connectTimeoutMs, remainingMs));

    try {
      await runWithDirectoryDeadline({
        directoryName: config.name,
        operation: operationName,
        timeoutMs: handshakeBudgetMs,
        signal,
        onCancel: safeUnbind,
        task: async () => {
          if (host.useStartTls) {
            await client.startTLS({
              rejectUnauthorized: true,
              ...(caPem !== undefined ? { ca: caPem } : {}),
              servername: config.servername ?? host.hostname,
            });
          }
          await client.bind(config.bindDn, bindPassword);
        },
      });

      const taskRemainingMs = Math.max(0, attemptDeadlineMs - Date.now());
      return await runWithDirectoryDeadline({
        directoryName: config.name,
        operation: operationName,
        timeoutMs: taskRemainingMs,
        signal,
        onCancel: safeUnbind,
        task: () => task(client, toLdapTimeLimitSeconds(taskRemainingMs)),
      });
    } catch (err) {
      if (isNonLdapProgramError(err)) {
        throw err;
      }
      if (isLdapBaseDnMisconfigurationError(err)) {
        throw err;
      }
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
    const timeoutMs = assertDirectoryCallContext(
      config.name,
      operationName,
      ctx,
      config.defaultTimeoutMs,
    )!;
    const deadlineWallMs = Date.now() + timeoutMs;
    const hostCount = config.hosts.length;
    const startIndex = preferredHostIndex;

    let lastError: unknown;
    let sawTimeout = false;
    let sawUnavailable = false;

    for (let attempt = 0; attempt < hostCount; attempt++) {
      const hostIndex = (startIndex + attempt) % hostCount;
      const host = config.hosts[hostIndex]!;
      const remainingMs = deadlineWallMs - Date.now();
      if (ctx.signal?.aborted) {
        throw classifyDirectoryAbortError(config.name, operationName, ctx.signal.reason, timeoutMs);
      }
      if (remainingMs <= 0) {
        throw new DirectoryTimeout(
          config.name,
          operationName,
          'LDAP directory operation exceeded its timeout budget.',
          { timeoutMs },
        );
      }

      const hostsLeft = hostCount - attempt;
      const attemptBudgetMs = hostsLeft > 1
        ? Math.max(1, Math.floor(remainingMs / hostsLeft))
        : remainingMs;

      try {
        const result = await runOnHost(host, operationName, attemptBudgetMs, ctx.signal, task);
        preferredHostIndex = hostIndex;
        return result;
      } catch (err) {
        if (isNonLdapProgramError(err)) {
          throw err;
        }
        if (ctx.signal?.aborted) {
          throw classifyDirectoryAbortError(
            config.name,
            operationName,
            ctx.signal.reason,
            timeoutMs,
          );
        }
        if (isLdapBaseDnMisconfigurationError(err)) {
          throw mapLdapError(err, config.name, operationName, timeoutMs);
        }
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
