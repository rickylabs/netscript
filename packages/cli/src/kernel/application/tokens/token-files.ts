import { isAbsolute, join, relative, resolve } from '@std/path';
import type { TokenDocument, TokenResolver, TokenSources } from '@netscript/fresh-ui/tokens';
import {
  TOKEN_ASSET_DIR,
  TOKEN_CONFIG_FILE,
  TOKEN_PREVIEW_PREFIX,
  TOKEN_RESOLVER_FILE,
  TOKEN_STATIC_DIR,
  TokenConfigSchema,
} from '../../domain/tokens/token-config.ts';
import type { FileSystemPort } from '../../ports/file-system-port.ts';
import type { TokenEnginePort } from '../../ports/token-engine-port.ts';

/** Collaborators shared by the three app token operations. */
export interface AppTokenDependencies {
  readonly fs: FileSystemPort;
  readonly tokenEngine: TokenEnginePort;
}

/** Preview CSS uses Fresh static files; core artifacts remain app imports. */
export function tokenOutputFile(name: string): string {
  return join(name.startsWith(TOKEN_PREVIEW_PREFIX) ? TOKEN_STATIC_DIR : TOKEN_ASSET_DIR, name);
}

/** Bound configurable input paths to the selected application. */
export function appTokenPath(root: string, path: string): string {
  const target = resolve(root, path);
  const inside = relative(resolve(root), target);
  if (
    isAbsolute(path) || inside === '..' || inside.startsWith('../') || inside.startsWith('..\\')
  ) {
    throw new Error(`Token paths must stay inside the Fresh app: ${path}`);
  }
  return target;
}

/** Explicit project roots must also identify an app, not a multi-app workspace. */
export async function assertTokenApp(root: string, fs: FileSystemPort): Promise<void> {
  if (
    !await fs.exists(join(root, 'deno.json')) || !await fs.exists(join(root, 'routes')) ||
    !(await fs.stat(join(root, 'routes'))).isDirectory
  ) throw new Error('Token commands require a Fresh app with deno.json and routes; select --app');
}

/** Missing configuration uses bundled sources; declared configuration is validated strictly. */
export async function readTokenConfig(root: string, fs: FileSystemPort) {
  const path = join(root, TOKEN_CONFIG_FILE);
  return await fs.exists(path)
    ? TokenConfigSchema.parse(JSON.parse(await fs.readFile(path)))
    : undefined;
}

/** Load caller-owned documents; the builder validates their complete DTCG contract. */
export async function readTokenSources(
  root: string,
  sourceRoot: string,
  fs: FileSystemPort,
): Promise<TokenSources> {
  const directory = appTokenPath(root, sourceRoot);
  const resolver: TokenResolver = JSON.parse(
    await fs.readFile(join(directory, TOKEN_RESOLVER_FILE)),
  );
  const documents: Record<string, TokenDocument> = {};
  for await (const entry of fs.walk(directory)) {
    if (!entry.isFile || !entry.path.endsWith('.json')) continue;
    const name = relative(directory, entry.path).replaceAll('\\', '/');
    if (name !== TOKEN_RESOLVER_FILE) documents[name] = JSON.parse(await fs.readFile(entry.path));
  }
  return { resolver, documents };
}

/** Read an explicit override even when absent, so a typo cannot silently drop customization. */
export async function readTokenOverride(
  root: string,
  path: string | undefined,
  fs: FileSystemPort,
): Promise<TokenDocument | undefined> {
  return path === undefined ? undefined : JSON.parse(await fs.readFile(appTokenPath(root, path)));
}
