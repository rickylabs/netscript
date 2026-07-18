/**
 * NetScript telemetry adapter for native update rollbacks.
 *
 * @module
 */

import { getTracer, withSpanSync } from '@netscript/telemetry/tracer';
import { AUTO_UPDATE_TELEMETRY_NAMES } from '../domain/constants.ts';
import type { AutoUpdateRollbackEvent } from '../domain/types.ts';

/** Narrow telemetry port consumed by auto-update orchestration. */
export interface RollbackTelemetryPort {
  /** Record one native rollback event. */
  reportRollback(event: AutoUpdateRollbackEvent): void;
}

/** NetScript telemetry implementation of native rollback reporting. */
export const NETSCRIPT_ROLLBACK_TELEMETRY: RollbackTelemetryPort = {
  reportRollback(event: AutoUpdateRollbackEvent): void {
    withSpanSync(
      getTracer(AUTO_UPDATE_TELEMETRY_NAMES.tracer),
      AUTO_UPDATE_TELEMETRY_NAMES.span,
      (span): void => {
        span.addEvent(AUTO_UPDATE_TELEMETRY_NAMES.event, {
          'app.version': event.currentVersion,
          'error.type': AUTO_UPDATE_TELEMETRY_NAMES.rollbackErrorType,
          'error.message': event.reason,
        });
      },
    );
  },
};
