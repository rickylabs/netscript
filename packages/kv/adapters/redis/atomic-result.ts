/** Validate the complete Redis EXEC receipt before certifying a commit. */
import { KvAtomicCommitUnconfirmedError } from '../../application/errors.ts';

/**
 * Require one successful command tuple for every queued mutation.
 *
 * Null EXEC is handled by the caller as an optimistic conflict. A null detail
 * inside a successful tuple is valid; only its explicit null error slot proves
 * command success. A command failure can leave other mutations applied.
 *
 * @param result - Non-null result returned by the transport.
 * @param commands - Exact number of queued Redis commands.
 * @throws {KvAtomicCommitUnconfirmedError} On missing or failed confirmation.
 */
export function assertRedisAtomicResult(result: unknown, commands: number): void {
  if (!Array.isArray(result) || result.length !== commands) {
    throw new KvAtomicCommitUnconfirmedError('malformed_result');
  }
  for (const command of result) {
    if (!Array.isArray(command) || command.length !== 2 || command[0] === undefined) {
      throw new KvAtomicCommitUnconfirmedError('malformed_result');
    }
    if (command[0] !== null) {
      throw new KvAtomicCommitUnconfirmedError('command_failed');
    }
  }
}
