import { join } from '@std/path';
import {
  TOKEN_ASSET_DIR,
  TOKEN_OVERRIDE_FILE,
  TOKEN_PRESET_FILE,
} from '../../domain/tokens/token-config.ts';
import {
  type AppTokenDependencies,
  appTokenPath,
  assertTokenApp,
  readTokenConfig,
  readTokenOverride,
  readTokenSources,
} from './token-files.ts';

/** Validate the entire build before replacing the five generated application assets. */
export async function buildAppTokens(
  input: {
    readonly root: string;
    readonly preset?: string;
    readonly override?: string;
  },
  dependencies: AppTokenDependencies,
): Promise<{ readonly preset: string; readonly files: readonly string[] }> {
  const { fs, tokenEngine } = dependencies;
  await assertTokenApp(input.root, fs);
  const config = await readTokenConfig(input.root, fs);
  const defaults = await tokenEngine.defaults();
  let preset = input.preset ?? config?.preset;
  const presetPath = join(input.root, TOKEN_ASSET_DIR, TOKEN_PRESET_FILE);
  if (!preset && await fs.exists(presetPath)) {
    const existing = JSON.parse(await fs.readFile(presetPath));
    if (typeof existing?.id !== 'string') throw new Error('Invalid generated theme-preset.json');
    preset = existing.id;
  }
  preset ??= defaults.preset;
  if (!defaults.presets.includes(preset)) throw new Error(`Unknown token preset: ${preset}`);
  const overridePath = input.override ?? config?.override ??
    (!config && await fs.exists(join(input.root, TOKEN_OVERRIDE_FILE))
      ? TOKEN_OVERRIDE_FILE
      : undefined);
  const sources = config?.sourceRoot
    ? await readTokenSources(input.root, config.sourceRoot, fs)
    : undefined;
  const override = await readTokenOverride(input.root, overridePath, fs);
  const result = await tokenEngine.build({ preset, sources, override });
  for (const name of defaults.outputFiles) {
    if (typeof result.files[name] !== 'string') throw new Error(`Token engine omitted ${name}`);
    appTokenPath(input.root, join(TOKEN_ASSET_DIR, name));
  }
  const files = defaults.outputFiles.map((name) => join(TOKEN_ASSET_DIR, name));
  for (let index = 0; index < files.length; index++) {
    await fs.writeFile(
      appTokenPath(input.root, files[index]),
      result.files[defaults.outputFiles[index]],
    );
  }
  return { preset: result.preset, files };
}
