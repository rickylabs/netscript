/** Finite provider profiles and validated OpenRouter presets for agentic runners. */

import type { AgentKind, Effort, ProviderKind, RouteIdentity } from './contract.ts';

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

export const PROVIDER_ROUTE_KEYS = ['ANTHROPIC_BASE_URL', 'OPENAI_BASE_URL'] as const;
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
  'codex-design-glm-5-2',
  'codex-long-medium-grok-4-5',
] as const;
export type OpenRouterPresetId = typeof OPENROUTER_PRESET_IDS[number];
export const OPENROUTER_PRESET_MODELS = [
  'minimax/minimax-m3',
  'z-ai/glm-5.2',
  'x-ai/grok-4.5',
] as const;

export interface OpenRouterPreset {
  readonly id: OpenRouterPresetId;
  readonly profileId: Extract<ProviderProfileId, 'claude-openrouter' | 'codex-openrouter'>;
  readonly model: typeof OPENROUTER_PRESET_MODELS[number];
  readonly effort: Effort;
  readonly purpose: 'workflow-fanout' | 'creative-design' | 'long-running-medium';
}

export const OPENROUTER_PRESETS: Readonly<Record<OpenRouterPresetId, OpenRouterPreset>> = Object
  .freeze({
    'claude-fanout-minimax-m3': Object.freeze({
      id: 'claude-fanout-minimax-m3',
      profileId: 'claude-openrouter',
      model: 'minimax/minimax-m3',
      effort: 'high',
      purpose: 'workflow-fanout',
    }),
    'codex-design-glm-5-2': Object.freeze({
      id: 'codex-design-glm-5-2',
      profileId: 'codex-openrouter',
      model: 'z-ai/glm-5.2',
      effort: 'xhigh',
      purpose: 'creative-design',
    }),
    'codex-long-medium-grok-4-5': Object.freeze({
      id: 'codex-long-medium-grok-4-5',
      profileId: 'codex-openrouter',
      model: 'x-ai/grok-4.5',
      effort: 'medium',
      purpose: 'long-running-medium',
    }),
  });

/** Returns a finite provider profile by id. */
export function getProviderProfile(id: ProviderProfileId): ProviderProfile {
  return PROVIDER_PROFILES[id];
}

/** Builds a value-free child environment policy for a selected profile. */
export function childEnvironmentPolicyForProfile(
  profile: ProviderProfile,
): import('./ports.ts').ChildEnvironmentPolicy {
  return {
    clearKeys: profile.clearKeys,
    bindings: [{
      sourceKey: profile.credentialSourceKey,
      targetKey: profile.credentialTargetKey,
    }],
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
