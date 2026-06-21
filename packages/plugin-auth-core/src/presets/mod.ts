/**
 * Provider and backend preset contract surface.
 *
 * @module
 */

/** Preset kinds supported by auth plugin configuration. */
export const AUTH_PRESET_KINDS: readonly ['provider', 'backend'] = ['provider', 'backend'];

/** Auth preset kind. */
export type AuthPresetKind = (typeof AUTH_PRESET_KINDS)[number];

/** Provider preset definition contributed by backend packages. */
export type AuthProviderPreset = Readonly<{
  kind: 'provider';
  id: string;
  backend: string;
  displayName: string;
  scopes?: readonly string[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

/** Backend preset definition contributed by backend packages. */
export type AuthBackendPreset = Readonly<{
  kind: 'backend';
  id: string;
  displayName: string;
  providerKinds: readonly string[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

/** Auth preset definition accepted by the auth plugin config layer. */
export type AuthPresetDefinition = AuthProviderPreset | AuthBackendPreset;

/** Registry shape for auth provider and backend presets. */
export type AuthPresetRegistry = ReadonlyMap<string, AuthPresetDefinition>;

/** Creates a duplicate-guarded preset registry from preset definitions. */
export function createAuthPresetRegistry(
  presets: readonly AuthPresetDefinition[],
): AuthPresetRegistry {
  const registry = new Map<string, AuthPresetDefinition>();
  for (const preset of presets) {
    const key = `${preset.kind}:${preset.id}`;
    if (registry.has(key)) {
      throw new Error(`Auth preset "${key}" is already registered.`);
    }
    registry.set(key, preset);
  }
  return registry;
}
