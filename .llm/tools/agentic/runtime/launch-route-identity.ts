import { type Effort, EFFORTS, PROVIDER_KINDS, type ProviderKind } from './contract.ts';
import { CODEX_OPENROUTER_MODEL_PROVIDER_ID } from './provider-profiles.ts';

export interface RequestedLaunchIdentity {
  readonly provider: ProviderKind;
  readonly model: string;
  readonly effort: Effort;
}

export interface ObservedLaunchIdentity {
  readonly provider: string | null;
  readonly model: string | null;
  readonly effort: string | null;
}

export interface LaunchIdentityEvidence {
  readonly requested: RequestedLaunchIdentity;
  readonly observed: ObservedLaunchIdentity;
  readonly status: 'matched' | 'pending' | 'mismatch';
  readonly mismatches: readonly ('provider' | 'model' | 'effort')[];
}

export interface LaunchIdentityEnforcement {
  readonly allowed: boolean;
  readonly operatorAction: string | null;
}

export const ROUTE_MISMATCH_OPERATOR_ACTION: string =
  'BLOCKED: inspect the requested/observed route and retry only after correcting the launch; ' +
  'use --allow-route-mismatch only for an explicit operator-approved exception.';

/** Validates explicit launch identity without reading credentials or provider output. */
export function requestedLaunchIdentity(values: {
  provider?: string;
  model?: string;
  effort?: string;
}): RequestedLaunchIdentity {
  if (!values.provider || !PROVIDER_KINDS.includes(values.provider as ProviderKind)) {
    throw new Error('a supported explicit --provider is required');
  }
  if (!values.model?.trim()) throw new Error('a non-empty explicit --model is required');
  if (!values.effort || !EFFORTS.includes(values.effort as Effort)) {
    throw new Error('a supported explicit --effort is required');
  }
  return {
    provider: values.provider as ProviderKind,
    model: values.model.trim(),
    effort: values.effort as Effort,
  };
}

/** Produces secret-safe requested-versus-observed launch evidence. */
export function compareLaunchIdentity(
  requested: RequestedLaunchIdentity,
  observed: ObservedLaunchIdentity,
): LaunchIdentityEvidence {
  const missing = observed.provider === null || observed.model === null || observed.effort === null;
  const mismatches: ('provider' | 'model' | 'effort')[] = [];
  const observedProvider = observed.provider?.toLowerCase() === CODEX_OPENROUTER_MODEL_PROVIDER_ID
    ? 'openrouter'
    : observed.provider?.toLowerCase();
  if (observedProvider !== undefined && observedProvider !== requested.provider) {
    mismatches.push('provider');
  }
  if (observed.model !== null && observed.model !== requested.model) mismatches.push('model');
  if (observed.effort !== null && observed.effort.toLowerCase() !== requested.effort) {
    mismatches.push('effort');
  }
  return {
    requested,
    observed,
    status: mismatches.length > 0 ? 'mismatch' : missing ? 'pending' : 'matched',
    mismatches,
  };
}

/** Enforces route evidence by default, with one explicit operator opt-out. */
export function enforceLaunchIdentity(
  evidence: LaunchIdentityEvidence,
  allowRouteMismatch: boolean,
): LaunchIdentityEnforcement {
  if (evidence.status === 'matched' || allowRouteMismatch) {
    return { allowed: true, operatorAction: null };
  }
  return { allowed: false, operatorAction: ROUTE_MISMATCH_OPERATOR_ACTION };
}
