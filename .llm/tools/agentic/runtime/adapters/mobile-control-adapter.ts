/** Read-only translation of the PR 0A Codex mobile-control probe. */

import type { MobileControlProbe } from '../../wsl/wsl-foundation-lib.ts';
import type { CapabilityState, RuntimeDiagnostic } from '../contract.ts';

/** Converts managed app-server health into the controller capability vocabulary. */
export function translateMobileControl(probe: MobileControlProbe): CapabilityState {
  return probe.status === 'ready'
    ? 'available'
    : probe.status === 'version_skew'
    ? 'degraded'
    : 'blocked';
}

/** Describes a repair refusal when active work makes mutation unsafe. */
export function activeMobileRepairDiagnostic(): RuntimeDiagnostic {
  return {
    code: 'active_session',
    category: 'safety',
    retryable: false,
    message: 'Codex remote repair refuses to interrupt active work',
  };
}
