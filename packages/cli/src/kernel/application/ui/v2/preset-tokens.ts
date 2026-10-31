import { basename, relative, resolve } from '@std/path';
import { buildAppTokens } from '../../tokens/build-app-tokens.ts';
import { readTokenConfig } from '../../tokens/token-files.ts';
import {
  TOKEN_ASSET_DIR,
  TOKEN_CONFIG_FILE,
  TOKEN_OVERRIDE_FILE,
} from '../../../domain/tokens/token-config.ts';
import type { UiConfig } from '../../../domain/ui/ui-config.ts';
import type { UiRegistryDependencies } from './registry-client.ts';
import type { UiWritePlan } from './ui-write-plan.ts';

/** Reuse S1 validation/compilation once, selecting only the requested generated output files. */
export async function stageUiPresetTokens(input: {
  readonly root: string;
  readonly preset: string;
  readonly only: ReadonlySet<string>;
  readonly config: UiConfig;
  readonly plan: UiWritePlan;
  readonly deps: UiRegistryDependencies;
}): Promise<{ readonly preset: string; readonly files: readonly string[] }> {
  const { root, plan, deps, only, config } = input;
  if (!deps.tokenEngine) throw new Error('UI presets require the token engine');
  const output = new Set(await deps.tokenEngine.outputFiles());
  const files: string[] = [];
  const map = (path: string) => {
    const name = relative(resolve(root, TOKEN_ASSET_DIR), resolve(path)).replaceAll('\\', '/');
    return output.has(name) ? resolve(root, config.aliases.assets, name) : path;
  };
  const result = await buildAppTokens({ root, preset: input.preset }, {
    tokenEngine: deps.tokenEngine,
    fs: {
      ...plan.fs,
      readFile: (path) => plan.fs.readFile(map(path)),
      exists: (path) => plan.fs.exists(map(path)),
      stat: (path) => plan.fs.stat(map(path)),
      writeFile: async (path, content) => {
        const font = basename(path) === 'fonts.json';
        if (only.size && !(font ? only.has('font') : only.has('theme'))) return;
        const target = map(path);
        files.push(relative(root, target).replaceAll('\\', '/'));
        await plan.fs.writeFile(target, content);
      },
    },
  });
  if (!only.size || only.has('theme')) {
    const previous = await readTokenConfig(root, plan.fs);
    const override = previous?.override ??
      (!previous && await plan.fs.exists(resolve(root, TOKEN_OVERRIDE_FILE))
        ? TOKEN_OVERRIDE_FILE
        : undefined);
    await plan.fs.writeFile(
      resolve(root, TOKEN_CONFIG_FILE),
      JSON.stringify(
        { ...previous, version: 1, preset: result.preset, ...(override ? { override } : {}) },
        null,
        2,
      ) + '\n',
    );
  }
  return { preset: result.preset, files };
}
