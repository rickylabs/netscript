/** Read-only translation of the PR 0A Codex mobile-control probe. */

import type { MobileControlProbe } from '../../wsl-foundation-lib.ts';
import type { CapabilityState, RuntimeDiagnostic } from '../contract.ts';

/** Converts managed app-server health into the controller capability vocabulary. */
export function translateMobileControl(probe: MobileControlProbe): CapabilityState {
  return probe.status === 'ready'
    ? 'available'
    : probe.status === 'version_skew'
    ? 'degraded'
    : 'blocked';
}

/** Describes unavailable live repair without executing or suggesting a mutation. */
export function deferredMobileRepairDiagnostic(): RuntimeDiagnostic {
  return {
    code: 'capability_deferred',
    category: 'capability',
    retryable: false,
    message: 'live Codex remote repair is deferred to issue #580',
    ownerIssue: 580,
  };
}
