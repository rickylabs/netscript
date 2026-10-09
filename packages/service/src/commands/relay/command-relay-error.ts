import {
  COMMAND_RELAY_FAILURE_CLASSES,
  type CommandRelayFailureClass,
} from '@netscript/database/commands';
/** Closed relay diagnostic; no raw payload, receipt or transport error text is persisted. */
export class CommandRelayError extends Error {
  /** Validated finite failure vocabulary. */ readonly failure: CommandRelayFailureClass;
  /** Construct a finite diagnostic at a checked sink or decode boundary. */
  constructor(failure: CommandRelayFailureClass) {
    if (!COMMAND_RELAY_FAILURE_CLASSES.includes(failure)) {
      throw new TypeError('[netscript.command.relay] invalid failure');
    }
    super('[netscript.command.relay] ' + failure);
    this.name = 'CommandRelayError';
    this.failure = failure;
  }
}
