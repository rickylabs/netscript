import { SCAFFOLD_DIRS } from '../../../../constants/scaffold/scaffold-dirs.ts';
import { resolve } from '@std/path';
import { deriveDefaultAppName } from '../../../../domain/scaffold/app-name.ts';
import { applyUiPreset } from './apply-preset.ts';
import type { UiRegistryDependencies } from '../registry-client.ts';

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
    root: resolve(
      input.projectRoot,
      SCAFFOLD_DIRS.APPS,
      input.appName ?? deriveDefaultAppName(input.name),
    ),
    preset: input.preset,
  }, deps);
}
