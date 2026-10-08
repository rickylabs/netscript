import {
  type ClaimedCommandOutboxRow,
  COMMAND_RELAY_FAILURE_CLASSES,
  type CommandOutboxRelease,
  type CommandRelayFailureClass,
} from '@netscript/database/commands';
import type {
  CommandOutboxRelayOptions,
  CommandOutboxSink,
  RunningCommandOutboxRelay,
} from './relay-ports.ts';
import { CommandRelayError } from './command-relay-error.ts';
import { relayAcceptance, relayDelivery } from './relay-delivery.ts';
import { observeRelay, relayPublicationContext, withRelayParent } from './relay-observer.ts';
import { commandString } from '../application/command-identity.ts';

const POLICY_CEILINGS = Object.freeze({
  batchSize: 64,
  concurrency: 64,
  leaseMs: 60000,
  maxAttempts: 10000,
  maxRetryDelayMs: 86400000,
});
/**
 * Compose one bounded decoded relay; callers own scheduling and shutdown.
 *
 * Publication precedes a live-token settlement, so a crash after acceptance redelivers
 * stable identities. Overlapping drains queue under one concurrency ceiling. stop aborts
 * new work, signals supplied publishers, and waits for all active/queued drains. Sinks that
 * ignore cancellation are still awaited. Claim/settlement errors surface to the scheduler;
 * uncertain publication settlement leaves the row leased for later expiry and redelivery.
 *
 * @example
 * ```ts
 * import { createCommandOutboxRelay, type CommandOutboxRelayOptions } from '@netscript/service/commands/relay';
 * declare const options: CommandOutboxRelayOptions;
 * const relay = createCommandOutboxRelay(options);
 * await relay.drainOnce();
 * await relay.stop();
 * ```
 */
export function createCommandOutboxRelay(
  options: CommandOutboxRelayOptions,
): RunningCommandOutboxRelay {
  for (
    const key of ['batchSize', 'concurrency', 'leaseMs', 'maxAttempts', 'maxRetryDelayMs'] as const
  ) {
    if (
      !Number.isSafeInteger(options[key]) || options[key] < 1 || options[key] > POLICY_CEILINGS[key]
    ) throw new TypeError('[netscript.command.relay] bounded policy required');
  }
  if (
    options.concurrency > options.batchSize || typeof options.classify !== 'function' ||
    typeof options.retryAt !== 'function' ||
    typeof options.clock?.now !== 'function' || typeof options.ids?.next !== 'function' ||
    options.sinks.size > 64 ||
    (options.telemetry &&
      (!options.provider || !['postgres', 'mssql', 'mysql', 'sqlite'].includes(options.provider)))
  ) {
    throw new TypeError('[netscript.command.relay] explicit valid composition required');
  }
  const { store, batchSize, concurrency, leaseMs, maxAttempts, maxRetryDelayMs, telemetry } =
    options;
  const clock = options.clock.now.bind(options.clock), nextId = options.ids.next.bind(options.ids);
  const classify = options.classify,
    retryAt = options.retryAt,
    provider = options.provider ?? 'postgres';
  const sinks = new Map<string, CommandOutboxSink>();
  for (const [key, sink] of options.sinks) {
    if (
      !commandString(key) || !key.trim() || key !== sink.id || typeof sink.publish !== 'function'
    ) throw new TypeError('[netscript.command.relay] invalid sink registry');
    sinks.set(key, Object.freeze({ id: key, publish: sink.publish.bind(sink) }));
  }
  function now(): Date {
    const value = clock();
    if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
      throw new TypeError('[netscript.command.relay] invalid clock');
    }
    return new Date(value.getTime());
  }
  function failure(error: unknown): CommandRelayFailureClass {
    if (error instanceof CommandRelayError) return error.failure;
    try {
      const value = classify(error);
      if (COMMAND_RELAY_FAILURE_CLASSES.includes(value)) return value;
    } catch { /* Invalid classifier is finite configuration failure. */ }
    return 'misconfigured';
  }
  async function release(
    row: ClaimedCommandOutboxRow,
    classification: CommandRelayFailureClass,
  ): Promise<void> {
    const current = now();
    let request: CommandOutboxRelease = {
      id: row.id,
      claimToken: row.claimToken,
      now: current,
      failure: classification,
      disposition: 'terminal',
      terminalAt: current,
    };
    if (row.attemptCount < maxAttempts) {
      try {
        const at = retryAt(row.attemptCount, new Date(current.getTime()));
        if (
          !(at instanceof Date) || !Number.isFinite(at.getTime()) ||
          at.getTime() <= current.getTime() || at.getTime() - current.getTime() > maxRetryDelayMs
        ) throw new TypeError('invalid retry');
        request = {
          id: row.id,
          claimToken: row.claimToken,
          now: current,
          failure: classification,
          disposition: 'retry',
          retryAt: new Date(at.getTime()),
        };
      } catch {
        request = { ...request, failure: 'misconfigured' };
      }
    }
    await store.release(request);
  }
  const stopping = new AbortController(), active = new Set<Promise<number>>();
  let tail: Promise<void> = Promise.resolve(),
    stopped = false,
    stopPromise: Promise<void> | undefined;
  async function drain(signal: AbortSignal): Promise<number> {
    if (signal.aborted) return 0;
    const token = nextId();
    if (!commandString(token) || !token.trim()) {
      throw new TypeError('[netscript.command.relay] invalid lease generation');
    }
    const rows = await store.claim(
      { limit: batchSize, leaseMs, now: now(), claimToken: token },
      signal,
    );
    if (rows.length > batchSize || rows.some((row) => row.claimToken !== token)) {
      throw new CommandRelayError('invalid_response');
    }
    let cursor = 0, published = 0;
    async function deliver(row: ClaimedCommandOutboxRow): Promise<boolean> {
      if (signal.aborted) {
        await release(row, 'timeout');
        return false;
      }
      let delivery;
      try {
        delivery = relayDelivery(row);
        if (!sinks.has(delivery.destination)) throw new CommandRelayError('misconfigured');
      } catch (error) {
        await release(row, failure(error));
        return false;
      }
      if (
        !Number.isSafeInteger(row.attemptCount) || row.attemptCount < 1 ||
        row.attemptCount > maxAttempts
      ) {
        await release(row, 'misconfigured');
        return false;
      }
      const sink = sinks.get(delivery.destination);
      if (!sink) throw new CommandRelayError('misconfigured');
      const start = {
        name: row.commandName,
        definitionVersion: row.commandVersion,
        provider,
        isolation: 'default' as const,
        idempotency: 'claimed' as const,
      };
      return await withRelayParent(
        delivery,
        () =>
          observeRelay(telemetry, 'traceRelay', start, async () => {
            let acceptance;
            try {
              acceptance = await observeRelay(telemetry, 'tracePublish', start, async () =>
                relayAcceptance(
                  await sink.publish(relayPublicationContext(delivery, Boolean(telemetry)), signal),
                ), () =>
                true);
            } catch (error) {
              await release(row, signal.aborted ? 'timeout' : failure(error));
              return false;
            }
            if (signal.aborted) {
              await release(row, 'timeout');
              return false;
            }
            // Settlement failures deliberately surface: uncertain commit cannot be repaired by releasing a lease.
            return await store.markPublished({
              id: row.id,
              claimToken: row.claimToken,
              publishedAt: now(),
              ...(acceptance === undefined ? {} : { acceptance }),
            }, signal);
          }, (value) =>
            value),
      );
    }
    async function worker(): Promise<void> {
      while (cursor < rows.length) {
        const row = rows[cursor++];
        if (await deliver(row)) published++;
      }
    }
    const outcomes = await Promise.allSettled(
      Array.from({ length: Math.min(concurrency, rows.length) }, () => worker()),
    );
    for (const outcome of outcomes) if (outcome.status === 'rejected') throw outcome.reason;
    return published;
  }
  return Object.freeze<RunningCommandOutboxRelay>({
    drainOnce(signal) {
      if (stopped) return Promise.resolve(0);
      const combined = signal ? AbortSignal.any([stopping.signal, signal]) : stopping.signal;
      const task = tail.then(() => drain(combined));
      active.add(task);
      task.then(() => active.delete(task), () => active.delete(task));
      tail = task.then(() => {}, () => {});
      return task;
    },
    stop() {
      if (!stopPromise) {
        stopped = true;
        stopping.abort();
        stopPromise = Promise.allSettled([...active]).then(() => {});
      }
      return stopPromise;
    },
  });
}
