/** Exhaustive credential-free validation for every OpenRouter preset. */

import type { GitInfo } from '../lib/agentic-lib.ts';
import { inspectCodexHandoff, planCodexCommand } from './adapters/codex-adapter.ts';
import { planClaudeCommand } from './adapters/claude-adapter.ts';
import {
  CODEX_OPENROUTER_PROFILE_FILE,
  CODEX_OPENROUTER_PROFILE_NAME,
} from './adapters/codex-profile-adapter.ts';
import { EFFORTS, type RouteIdentity } from './contract.ts';
import {
  OPENROUTER_AGENTIC_TURN_STATUSES,
  OPENROUTER_INCOMPATIBILITIES,
  OPENROUTER_PRESET_IDS,
  OPENROUTER_PRESETS,
  OPENROUTER_TRANSPORTS,
  type OpenRouterPreset,
  type OpenRouterPresetId,
  resolveProviderProfile,
} from './provider-profiles.ts';

export interface OpenRouterPresetCanaryRow {
  readonly id: OpenRouterPresetId;
  readonly validation: 'passed' | 'failed';
  readonly launchValid: boolean;
  readonly liveEligible: boolean;
  readonly agenticTurn: OpenRouterPreset['agenticTurn'] | null;
  readonly transport: OpenRouterPreset['transport'] | null;
  readonly incompatibility: OpenRouterPreset['incompatibility'] | null;
  readonly diagnostics: readonly string[];
}

export interface OpenRouterPresetCanarySuite {
  readonly mode: 'static';
  readonly status: 'passed' | 'failed';
  readonly expectedPresetIds: readonly OpenRouterPresetId[];
  readonly observedPresetIds: readonly string[];
  readonly rows: readonly OpenRouterPresetCanaryRow[];
  readonly diagnostics: readonly string[];
}

type PresetRegistry = Readonly<Record<string, OpenRouterPreset | undefined>>;

function route(preset: OpenRouterPreset, worktree: string): RouteIdentity {
  const profile = resolveProviderProfile({
    agent: preset.profileId.startsWith('claude-') ? 'claude' : 'codex',
    provider: 'openrouter',
    profileId: preset.profileId,
    model: preset.model,
    effort: preset.effort,
    worktree,
    mobileRequired: false,
  });
  return {
    agent: profile?.agent ?? 'codex',
    provider: 'openrouter',
    profileId: preset.profileId,
    model: preset.model,
    effort: preset.effort,
    worktree,
    mobileRequired: false,
  };
}

function launchDiagnostics(preset: OpenRouterPreset, worktree: string): readonly string[] {
  const selected = route(preset, worktree);
  const content = { path: `${worktree}/.llm/tmp/provider-canary-prompt.md` } as const;
  if (selected.agent === 'claude') {
    const plan = planClaudeCommand({
      command: {
        kind: 'launch',
        commandId: `preset-canary:${preset.id}`,
        mode: 'plan',
        route: selected,
        content,
      },
      nativeExt4: true,
    });
    return [
      ...plan.diagnostics.map((entry) => entry.code),
      ...(plan.request ? [] : ['missing_launch_request']),
    ];
  }
  const profileHome = `${worktree}/.llm/tmp/codex-openrouter-profile`;
  const git: GitInfo = {
    found: true,
    branch: 'provider-canary',
    head: 'static-canary',
    upstream: 'NONE',
    dirty: 0,
  };
  const plan = planCodexCommand({
    command: {
      kind: 'launch',
      commandId: `preset-canary:${preset.id}`,
      mode: 'plan',
      route: selected,
      content,
    },
    git,
    expectedBranch: git.branch,
    nativeExt4: true,
    handoff: inspectCodexHandoff('use harness\n\n## SKILL\n- netscript-harness\n'),
    profile: {
      name: CODEX_OPENROUTER_PROFILE_NAME,
      home: profileHome,
      path: `${profileHome}/${CODEX_OPENROUTER_PROFILE_FILE}`,
    },
  });
  return [
    ...plan.diagnostics.map((entry) => entry.code),
    ...(plan.request ? [] : ['missing_launch_request']),
  ];
}

function validatePreset(
  id: OpenRouterPresetId,
  preset: OpenRouterPreset | undefined,
  worktree: string,
): OpenRouterPresetCanaryRow {
  if (!preset) {
    return {
      id,
      validation: 'failed',
      launchValid: false,
      liveEligible: false,
      agenticTurn: null,
      transport: null,
      incompatibility: null,
      diagnostics: ['preset_missing'],
    };
  }
  const diagnostics: string[] = [];
  const profile = resolveProviderProfile(route(preset, worktree));
  if (preset.id !== id) diagnostics.push('preset_id_mismatch');
  if (!profile || profile.endpointKind !== 'openrouter') diagnostics.push('profile_invalid');
  if (!preset.model.trim()) diagnostics.push('model_missing');
  if (!EFFORTS.includes(preset.effort)) diagnostics.push('effort_invalid');
  if (!OPENROUTER_AGENTIC_TURN_STATUSES.includes(preset.agenticTurn)) {
    diagnostics.push('agentic_status_invalid');
  }
  if (!OPENROUTER_TRANSPORTS.includes(preset.transport)) diagnostics.push('transport_invalid');
  if (
    profile &&
    preset.transport !== (profile.agent === 'claude' ? 'anthropic-messages' : 'responses')
  ) diagnostics.push('transport_profile_mismatch');
  if (
    preset.incompatibility !== null &&
    !OPENROUTER_INCOMPATIBILITIES.includes(preset.incompatibility)
  ) diagnostics.push('incompatibility_invalid');
  if (preset.agenticTurn === 'unsupported' && !preset.incompatibility) {
    diagnostics.push('unsupported_without_reason');
  }
  if (preset.agenticTurn !== 'unsupported' && preset.incompatibility) {
    diagnostics.push('non_unsupported_with_reason');
  }
  const launch = launchDiagnostics(preset, worktree);
  diagnostics.push(...launch);
  return {
    id,
    validation: diagnostics.length ? 'failed' : 'passed',
    launchValid: launch.length === 0,
    liveEligible: preset.agenticTurn === 'supported' && !preset.incompatibility,
    agenticTurn: preset.agenticTurn,
    transport: preset.transport,
    incompatibility: preset.incompatibility,
    diagnostics,
  };
}

/** Validates registry coverage, capability coherence, and real launch composition without secrets. */
export function evaluateOpenRouterPresetCanaries(
  worktree: string,
  registry: PresetRegistry = OPENROUTER_PRESETS,
): OpenRouterPresetCanarySuite {
  const observedPresetIds = Object.keys(registry).sort();
  const diagnostics: string[] = [];
  const expected = [...OPENROUTER_PRESET_IDS].sort();
  if (JSON.stringify(observedPresetIds) !== JSON.stringify(expected)) {
    diagnostics.push('preset_coverage_mismatch');
  }
  if (!worktree.startsWith('/home/')) diagnostics.push('non_native_worktree');
  const rows = OPENROUTER_PRESET_IDS.map((id) => validatePreset(id, registry[id], worktree));
  if (rows.some((row) => row.validation === 'failed')) diagnostics.push('preset_validation_failed');
  return {
    mode: 'static',
    status: diagnostics.length ? 'failed' : 'passed',
    expectedPresetIds: OPENROUTER_PRESET_IDS,
    observedPresetIds,
    rows,
    diagnostics,
  };
}
