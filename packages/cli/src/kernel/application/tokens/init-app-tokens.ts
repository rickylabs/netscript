import { join } from '@std/path';
import {
  TOKEN_CONFIG_FILE,
  TOKEN_CONFIG_VERSION,
  TOKEN_OVERRIDE_FILE,
  TOKEN_SOURCE_DIR,
  type TokenConfig,
} from '../../domain/tokens/token-config.ts';
import { type AppTokenDependencies, appTokenPath, assertTokenApp } from './token-files.ts';

/** Copy editable DTCG sources and a final semantic alias layer without compiling assets. */
export async function initAppTokens(
  input: { readonly root: string; readonly preset?: string; readonly force?: boolean },
  dependencies: AppTokenDependencies,
): Promise<{ readonly preset: string; readonly files: readonly string[] }> {
  const { fs, tokenEngine } = dependencies;
  await assertTokenApp(input.root, fs);
  const defaults = await tokenEngine.defaults();
  const preset = input.preset ?? defaults.preset;
  if (!defaults.presets.includes(preset)) throw new Error(`Unknown token preset: ${preset}`);
  const config: TokenConfig = {
    version: TOKEN_CONFIG_VERSION,
    preset,
    sourceRoot: TOKEN_SOURCE_DIR,
    override: TOKEN_OVERRIDE_FILE,
  };
  const files = {
    ...Object.fromEntries(
      Object.entries(defaults.sources).map((
        [name, value],
      ) => [join(TOKEN_SOURCE_DIR, name), value]),
    ),
    [TOKEN_OVERRIDE_FILE]: JSON.stringify({ semantic: {} }, null, 2) + '\n',
    [TOKEN_CONFIG_FILE]: JSON.stringify(config, null, 2) + '\n',
  };
  // Check the whole plan before writing, so an existing late file leaves everything untouched.
  for (const name of Object.keys(files)) {
    if (!input.force && await fs.exists(appTokenPath(input.root, name))) {
      throw new Error(`Token source already exists: ${name}; use --force to replace it`);
    }
  }
  // Force replaces the managed source tree, including obsolete JSON documents.
  const sourceRoot = appTokenPath(input.root, TOKEN_SOURCE_DIR);
  if (input.force && await fs.exists(sourceRoot)) await fs.remove(sourceRoot);
  for (const [name, content] of Object.entries(files)) {
    await fs.writeFile(appTokenPath(input.root, name), content);
  }
  return { preset, files: Object.keys(files) };
}
