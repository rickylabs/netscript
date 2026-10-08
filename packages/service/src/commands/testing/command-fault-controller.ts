import { constructCommandExecutor } from '../application/create-command-executor.ts';
import type {
  CommandBoundaryObserver,
  CommandFaultBoundary,
} from '../application/executor-boundary.ts';
import type { CommandExecutor } from '../domain/execution.ts';
import { CommandError } from '../domain/failure.ts';
import type { CommandExecutorOptions } from '../ports/executor-ports.ts';

/** One-use faults and a bounded history belonging to one testing executor instance. */
export interface CommandFaultController {
  /** Arm one failure at a named boundary. Arming it again replaces the pending failure. */
  failNext(boundary: CommandFaultBoundary, error?: Error): void;
  /** Remove pending faults and visited history, retaining the executor binding. */
  clear(): void;
  /** Inspect the latest 128 boundary visits as a detached frozen array. */
  visited(): readonly CommandFaultBoundary[];
}

const boundaries: readonly CommandFaultBoundary[] = Object.freeze([
  'before_transaction',
  'after_claim',
  'after_handler',
  'after_audit',
  'after_outbox',
  'after_receipt_complete',
  'after_commit_before_return',
]);
const observers = new WeakMap<CommandFaultController, CommandBoundaryObserver>();
const attached = new WeakSet<CommandFaultController>();

/** Create a testing-only controller, with no global hook or production configuration. */
export function createCommandFaultController(): CommandFaultController {
  const pending = new Map<CommandFaultBoundary, Error>();
  const history: CommandFaultBoundary[] = [];
  const controller: CommandFaultController = Object.freeze({
    failNext(boundary: CommandFaultBoundary, error?: Error): void {
      if (!boundaries.includes(boundary) || (error !== undefined && !(error instanceof Error))) {
        throw new TypeError('[netscript.command.testing] invalid fault');
      }
      pending.set(
        boundary,
        error ?? new CommandError({
          kind: 'store_failure',
          retryable: false,
          phase: 'business',
        }),
      );
    },
    clear(): void {
      pending.clear();
      history.length = 0;
    },
    visited(): readonly CommandFaultBoundary[] {
      return Object.freeze([...history]);
    },
  });
  observers.set(controller, (boundary) => {
    history.push(boundary);
    if (history.length > 128) history.shift();
    const error = pending.get(boundary);
    pending.delete(boundary);
    if (error !== undefined) throw error;
  });
  return controller;
}

/**
 * Exercise the production executor algorithm with an explicit testing-only controller.
 * A genuine controller binds once, preventing accidental cross-instance fault sharing.
 *
 * @example
 * ```ts
 * import { createCommandFaultController, createTestingCommandExecutor, createMemoryCommandStore }
 *   from '@netscript/service/commands/testing';
 * const faults = createCommandFaultController();
 * const executor = createTestingCommandExecutor({ store: createMemoryCommandStore() }, faults);
 * faults.failNext('after_handler');
 * ```
 */
export function createTestingCommandExecutor<TTx>(
  options: CommandExecutorOptions<TTx>,
  faults: CommandFaultController,
): CommandExecutor<TTx> {
  const observer = observers.get(faults);
  if (observer === undefined || attached.has(faults)) {
    throw new TypeError('[netscript.command.testing] controller requires a fresh binding');
  }
  const executor = constructCommandExecutor(options, observer);
  attached.add(faults);
  return executor;
}
