import { resolve } from '@std/path';
import { deriveDefaultAppName } from '../../domain/scaffold/app-name.ts';
import { applyUiPreset } from '../ui/v2/apply-preset.ts';
import type { UiRegistryDependencies } from '../ui/v2/registry-client.ts';

/** Generated-app identity required to apply an init preset without guessing workspace paths. */
export interface InitPresetInput {
  readonly projectRoot: string;
  readonly name: string;
  readonly appName?: string;
  readonly preset: string;
}

/** Public and local-source init share the same app selection and S2 preset application. */
export async function applyInitPreset(
  input: InitPresetInput,
  deps: UiRegistryDependencies,
): Promise<void> {
  await applyUiPreset({
    root: resolve(input.projectRoot, 'apps', input.appName ?? deriveDefaultAppName(input.name)),
    preset: input.preset,
  }, deps);
}
