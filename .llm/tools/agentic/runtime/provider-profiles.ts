/** Finite provider profiles and validated OpenRouter presets for agentic runners. */

import type { AgentKind, Effort, ProviderKind, RouteIdentity } from './contract.ts';
import {
  OPENROUTER_ANTHROPIC_BASE_URL as CONFIG_OPENROUTER_ANTHROPIC_BASE_URL,
  OPENROUTER_RESPONSES_BASE_URL as CONFIG_OPENROUTER_RESPONSES_BASE_URL,
} from '../config/endpoints.ts';
import { OPENROUTER_MODEL_IDS } from '../config/models.ts';

export const PROVIDER_PROFILE_IDS = [
  'claude-anthropic-native',
  'codex-openai-native',
  'claude-openrouter',
  'codex-openrouter',
  'claude-custom',
] as const;
export type ProviderProfileId = typeof PROVIDER_PROFILE_IDS[number];

export const PROVIDER_CREDENTIAL_KEYS = [
  'ANTHROPIC_API_KEY',
  'ANTHROPIC_AUTH_TOKEN',
  'OPENAI_API_KEY',
  'OPENROUTER_API_KEY',
] as const;
export type ProviderCredentialKey = typeof PROVIDER_CREDENTIAL_KEYS[number];

export const PROVIDER_ROUTE_KEYS = [
  'ANTHROPIC_BASE_URL',
  'OPENAI_BASE_URL',
  'CLAUDE_CONFIG_DIR',
] as const;
export type ProviderRouteKey = typeof PROVIDER_ROUTE_KEYS[number];

export type ProviderEndpointKind = 'native' | 'openrouter' | 'custom';
export interface ProviderProfile {
  readonly id: ProviderProfileId;
  readonly agent: Extract<AgentKind, 'claude' | 'codex'>;
  readonly provider: Extract<ProviderKind, 'anthropic' | 'openai' | 'openrouter' | 'custom'>;
  readonly endpointKind: ProviderEndpointKind;
  readonly credentialSourceKey: ProviderCredentialKey;
  readonly credentialTargetKey: ProviderCredentialKey;
  readonly clearKeys: readonly (ProviderCredentialKey | ProviderRouteKey)[];
}

/** Re-exported from the central config; the single source is `config/endpoints.ts`. */
export const OPENROUTER_ANTHROPIC_BASE_URL: string = CONFIG_OPENROUTER_ANTHROPIC_BASE_URL;
export const OPENROUTER_RESPONSES_BASE_URL: string = CONFIG_OPENROUTER_RESPONSES_BASE_URL;
/** Codex-local id for the custom OpenRouter Responses provider table. */
export const CODEX_OPENROUTER_MODEL_PROVIDER_ID = 'netscript_openrouter' as const;

function profile(
  values: Omit<ProviderProfile, 'clearKeys'>,
  retainedKeys: readonly (ProviderCredentialKey | ProviderRouteKey)[],
): ProviderProfile {
  const retained = new Set(retainedKeys);
  return Object.freeze({
    ...values,
    clearKeys: [...PROVIDER_CREDENTIAL_KEYS, ...PROVIDER_ROUTE_KEYS].filter((key) =>
      !retained.has(key)
    ),
  });
}

export const PROVIDER_PROFILES: Readonly<Record<ProviderProfileId, ProviderProfile>> = Object
  .freeze({
    'claude-anthropic-native': profile({
      id: 'claude-anthropic-native',
      agent: 'claude',
      provider: 'anthropic',
      endpointKind: 'native',
      credentialSourceKey: 'ANTHROPIC_API_KEY',
      credentialTargetKey: 'ANTHROPIC_API_KEY',
    }, ['ANTHROPIC_API_KEY']),
    'codex-openai-native': profile({
      id: 'codex-openai-native',
      agent: 'codex',
      provider: 'openai',
      endpointKind: 'native',
      credentialSourceKey: 'OPENAI_API_KEY',
      credentialTargetKey: 'OPENAI_API_KEY',
    }, ['OPENAI_API_KEY']),
    'claude-openrouter': profile({
      id: 'claude-openrouter',
      agent: 'claude',
      provider: 'openrouter',
      endpointKind: 'openrouter',
      credentialSourceKey: 'OPENROUTER_API_KEY',
      credentialTargetKey: 'ANTHROPIC_AUTH_TOKEN',
    }, ['ANTHROPIC_AUTH_TOKEN']),
    'codex-openrouter': profile({
      id: 'codex-openrouter',
      agent: 'codex',
      provider: 'openrouter',
      endpointKind: 'openrouter',
      credentialSourceKey: 'OPENROUTER_API_KEY',
      credentialTargetKey: 'OPENROUTER_API_KEY',
    }, ['OPENROUTER_API_KEY']),
    'claude-custom': profile({
      id: 'claude-custom',
      agent: 'claude',
      provider: 'custom',
      endpointKind: 'custom',
      credentialSourceKey: 'ANTHROPIC_AUTH_TOKEN',
      credentialTargetKey: 'ANTHROPIC_AUTH_TOKEN',
    }, ['ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_BASE_URL']),
  });

export const OPENROUTER_PRESET_IDS = [
  'claude-fanout-minimax-m3',
  'claude-evaluator-qwen-3-7-max',
  'claude-design-glm-5-2',
  'codex-design-glm-5-2',
  'codex-long-medium-grok-4-5',
] as const;
export type OpenRouterPresetId = typeof OPENROUTER_PRESET_IDS[number];
export const OPENROUTER_AGENTIC_TURN_STATUSES = [
  'supported',
  'unsupported',
  'unverified',
] as const;
export type OpenRouterAgenticTurnStatus = typeof OPENROUTER_AGENTIC_TURN_STATUSES[number];
export const OPENROUTER_TRANSPORTS = ['anthropic-messages', 'responses'] as const;
export type OpenRouterTransport = typeof OPENROUTER_TRANSPORTS[number];
export const OPENROUTER_REASONING_TRACE_STATUSES = ['present', 'absent', 'unverified'] as const;
export type OpenRouterReasoningTraceStatus = typeof OPENROUTER_REASONING_TRACE_STATUSES[number];
export const OPENROUTER_INCOMPATIBILITIES = ['codex-native-namespace-tool'] as const;
export type OpenRouterIncompatibility = typeof OPENROUTER_INCOMPATIBILITIES[number];
export const OPENROUTER_PRESET_MODELS: readonly [
  typeof OPENROUTER_MODEL_IDS.minimax,
  typeof OPENROUTER_MODEL_IDS.qwen,
  typeof OPENROUTER_MODEL_IDS.glm,
  typeof OPENROUTER_MODEL_IDS.grok,
] = [
  OPENROUTER_MODEL_IDS.minimax,
  OPENROUTER_MODEL_IDS.qwen,
  OPENROUTER_MODEL_IDS.glm,
  OPENROUTER_MODEL_IDS.grok,
];

export interface OpenRouterPreset {
  readonly id: OpenRouterPresetId;
  readonly profileId: Extract<ProviderProfileId, 'claude-openrouter' | 'codex-openrouter'>;
  readonly model: typeof OPENROUTER_PRESET_MODELS[number];
  readonly effort: Effort;
  readonly purpose: 'workflow-fanout' | 'evaluation' | 'creative-design' | 'long-running-medium';
  readonly agenticTurn: OpenRouterAgenticTurnStatus;
  readonly transport: OpenRouterTransport;
  readonly reasoningTrace: OpenRouterReasoningTraceStatus;
  readonly incompatibility: OpenRouterIncompatibility | null;
}

export const OPENROUTER_PRESETS: Readonly<Record<OpenRouterPresetId, OpenRouterPreset>> = Object
  .freeze({
    'claude-fanout-minimax-m3': Object.freeze({
      id: 'claude-fanout-minimax-m3',
      profileId: 'claude-openrouter',
      model: OPENROUTER_MODEL_IDS.minimax,
      effort: 'high',
      purpose: 'workflow-fanout',
      agenticTurn: 'supported',
      transport: 'anthropic-messages',
      reasoningTrace: 'present',
      incompatibility: null,
    }),
    'claude-evaluator-qwen-3-7-max': Object.freeze({
      id: 'claude-evaluator-qwen-3-7-max',
      profileId: 'claude-openrouter',
      model: OPENROUTER_MODEL_IDS.qwen,
      effort: 'high',
      purpose: 'evaluation',
      agenticTurn: 'supported',
      transport: 'anthropic-messages',
      reasoningTrace: 'present',
      incompatibility: null,
    }),
    'claude-design-glm-5-2': Object.freeze({
      id: 'claude-design-glm-5-2',
      profileId: 'claude-openrouter',
      model: OPENROUTER_MODEL_IDS.glm,
      effort: 'xhigh',
      purpose: 'creative-design',
      agenticTurn: 'supported',
      transport: 'anthropic-messages',
      reasoningTrace: 'absent',
      incompatibility: null,
    }),
    'codex-design-glm-5-2': Object.freeze({
      id: 'codex-design-glm-5-2',
      profileId: 'codex-openrouter',
      model: OPENROUTER_MODEL_IDS.glm,
      effort: 'xhigh',
      purpose: 'creative-design',
      agenticTurn: 'unsupported',
      transport: 'responses',
      reasoningTrace: 'unverified',
      incompatibility: 'codex-native-namespace-tool',
    }),
    'codex-long-medium-grok-4-5': Object.freeze({
      id: 'codex-long-medium-grok-4-5',
      profileId: 'codex-openrouter',
      model: OPENROUTER_MODEL_IDS.grok,
      effort: 'medium',
      purpose: 'long-running-medium',
      agenticTurn: 'unverified',
      transport: 'responses',
      reasoningTrace: 'unverified',
      incompatibility: null,
    }),
  });

/** Returns a finite provider profile by id. */
export function getProviderProfile(id: ProviderProfileId): ProviderProfile {
  return PROVIDER_PROFILES[id];
}

/** Builds a value-free child environment policy for a selected profile. */
export function childEnvironmentPolicyForProfile(
  profile: ProviderProfile,
  route?: RouteIdentity,
  codexHome?: string,
): import('./ports.ts').ChildEnvironmentPolicy {
  const fixedValues: import('./ports.ts').ChildEnvironmentFixedValue[] = [];
  const emptyKeys: string[] = [];
  if (profile.id === 'claude-openrouter') {
    fixedValues.push({ targetKey: 'ANTHROPIC_BASE_URL', value: OPENROUTER_ANTHROPIC_BASE_URL });
    emptyKeys.push('ANTHROPIC_API_KEY');
  } else if (profile.id === 'claude-custom' && route?.baseUrl) {
    fixedValues.push({ targetKey: 'ANTHROPIC_BASE_URL', value: route.baseUrl });
    emptyKeys.push('ANTHROPIC_API_KEY');
  }
  if (profile.agent === 'claude' && profile.endpointKind !== 'native' && route) {
    const home = route.worktree.match(/^(\/home\/[^/]+)(?:\/|$)/)?.[1];
    if (home) {
      fixedValues.push({
        targetKey: 'CLAUDE_CONFIG_DIR',
        value: `${home}/.config/netscript-agentic/runtime/${profile.id}`,
      });
    }
  }
  if (codexHome) {
    fixedValues.push({ targetKey: 'CODEX_HOME', value: codexHome });
    fixedValues.push({
      targetKey: 'WSLENV',
      value: `${profile.credentialTargetKey}:CODEX_HOME/p`,
    });
  }
  return {
    clearKeys: profile.clearKeys,
    ...(emptyKeys.length ? { emptyKeys } : {}),
    bindings: [{
      sourceKey: profile.credentialSourceKey,
      targetKey: profile.credentialTargetKey,
    }],
    ...(fixedValues.length ? { fixedValues } : {}),
  };
}

/** Resolves the explicit profile or the backward-compatible native profile for a route. */
export function resolveProviderProfile(route: RouteIdentity): ProviderProfile | null {
  if (route.profileId) return PROVIDER_PROFILES[route.profileId] ?? null;
  if (route.agent === 'claude' && route.provider === 'anthropic') {
    return PROVIDER_PROFILES['claude-anthropic-native'];
  }
  if (route.agent === 'codex' && route.provider === 'openai') {
    return PROVIDER_PROFILES['codex-openai-native'];
  }
  return null;
}

/** Returns the preset only when its route profile, model, and effort match exactly. */
export function matchOpenRouterPreset(route: RouteIdentity): OpenRouterPreset | null {
  return Object.values(OPENROUTER_PRESETS).find((preset) =>
    route.profileId === preset.profileId && route.model === preset.model &&
    route.effort === preset.effort
  ) ?? null;
}
