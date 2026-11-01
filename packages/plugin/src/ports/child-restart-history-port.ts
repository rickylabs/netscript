import type { ChildRestartHistory } from '../domain/child-health.ts';

/**
 * Synchronous history storage for a single background resource's process lifetime.
 *
 * Writes complete before bootstrap or failure proceeds, so an immediate process exit cannot
 * discard restart accounting. A resource has one writer; replicas require separate histories.
 *
 * @example
 * ```ts
 * import type { ChildRestartHistory, ChildRestartHistoryPort } from '@netscript/plugin/health';
 * let value: ChildRestartHistory | undefined;
 * const history: ChildRestartHistoryPort = {
 *   read: () => value,
 *   write: (next) => { value = next; },
 * };
 * ```
 */
export interface ChildRestartHistoryPort {
  /** Read a validated record, or undefined only when no history exists. */
  read(): ChildRestartHistory | undefined;
  /** Atomically replace the bounded record, throwing when persistence fails. */
  write(history: ChildRestartHistory): void;
}
