import type { CommandStoreCapabilities } from './command-store.ts';

const PROVIDERS = ['postgres', 'mssql', 'mysql', 'sqlite'];
const ISOLATIONS = [
  'ReadUncommitted',
  'ReadCommitted',
  'RepeatableRead',
  'Serializable',
  'Snapshot',
];

/**
 * Validate and detach an immutable provider capability declaration.
 *
 * The provider must construct its bound delegates itself; this function validates the
 * declaration and cannot certify physical atomicity or driver cancellation.
 *
 * @example
 * ```ts
 * import { createCommandStoreCapabilities } from '@netscript/database/commands';
 * const capabilities = createCommandStoreCapabilities({
 *   provider: 'postgres', transactionModel: 'interactive', sideRecordAtomicity: 'same_commit',
 *   callbackAttempts: 'one', cancellation: 'cooperative',
 *   selectableIsolationLevels: ['Serializable'], defaultIsolation: 'Serializable',
 *   receiptClaimWait: { minimumMs: 0, maximumMs: 1000, granularityMs: 1 },
 * });
 * ```
 */
export function createCommandStoreCapabilities(
  input: CommandStoreCapabilities,
): CommandStoreCapabilities {
  const wait = input.receiptClaimWait;
  if (
    !PROVIDERS.includes(input.provider) || input.transactionModel !== 'interactive' ||
    input.sideRecordAtomicity !== 'same_commit' || input.callbackAttempts !== 'one' ||
    !['cooperative', 'driver'].includes(input.cancellation) ||
    input.selectableIsolationLevels.some((level) => !ISOLATIONS.includes(level)) ||
    new Set(input.selectableIsolationLevels).size !== input.selectableIsolationLevels.length ||
    (input.defaultIsolation !== 'provider_configured' &&
      !input.selectableIsolationLevels.includes(input.defaultIsolation)) ||
    !Number.isSafeInteger(wait.minimumMs) || !Number.isSafeInteger(wait.maximumMs) ||
    !Number.isSafeInteger(wait.granularityMs) || wait.minimumMs < 0 ||
    wait.maximumMs < wait.minimumMs || wait.granularityMs < 1 ||
    wait.minimumMs % wait.granularityMs !== 0 || wait.maximumMs % wait.granularityMs !== 0
  ) {
    throw new TypeError('[netscript.command.store] invalid capabilities');
  }
  return Object.freeze({
    ...input,
    selectableIsolationLevels: Object.freeze([...input.selectableIsolationLevels]),
    receiptClaimWait: Object.freeze({ ...wait }),
  });
}
