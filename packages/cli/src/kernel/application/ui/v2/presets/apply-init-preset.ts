import { SCAFFOLD_DIRS } from '../../../../constants/scaffold/scaffold-dirs.ts';
import { resolve } from '@std/path';
import { deriveDefaultAppName } from '../../../../domain/scaffold/app-name.ts';
import { type ResolvedUiPreset, resolveUiPreset } from './resolve-preset.ts';
import { applyUiPreset } from './apply-preset.ts';
import type { UiRegistryDependencies } from '../registry-client.ts';

/** Generated-app identity required to apply an init preset without guessing workspace paths. */
export interface InitPresetInput {
  readonly projectRoot: string;
  readonly name: string;
  readonly appName?: string;
  readonly preset: string;
}

/** Prepared preset application is deferred until the scaffold exists. */
export type PreparedInitPreset = (input: InitPresetInput) => Promise<void>;

/** Fetch and validate before init can write, retaining the exact resolved payload. */
export async function prepareInitPreset(
  preset: string,
  deps: UiRegistryDependencies,
): Promise<PreparedInitPreset> {
  const resolved = await resolveUiPreset(preset, deps);
  return (input) => applyInitPreset(input, deps, resolved);
}

/** Public and local-source init share the same app selection and S2 preset application. */
export async function applyInitPreset(
  input: InitPresetInput,
  deps: UiRegistryDependencies,
  resolved?: ResolvedUiPreset,
): Promise<void> {
  await applyUiPreset(
    {
      root: resolve(
        input.projectRoot,
        SCAFFOLD_DIRS.APPS,
        input.appName ?? deriveDefaultAppName(input.name),
      ),
      preset: input.preset,
    },
    deps,
    resolved,
  );
}
