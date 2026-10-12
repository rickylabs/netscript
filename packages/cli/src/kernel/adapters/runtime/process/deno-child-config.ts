import { dirname, fromFileUrl, isAbsolute, resolve, toFileUrl } from '@std/path';
import { parse as parseJsonc } from '@std/jsonc';

/** Resolution arguments and the consumer-owned lock for a source child. */
export interface DenoChildConfig {
  /** Deno config/import-map arguments. */
  readonly configArgs: readonly string[];
  /** Explicit consumer lock arguments for normal generation; inspection supplies its frozen lock. */
  readonly consumerLockArgs: readonly string[];
}

/**
 * Select resolution for a CLI-owned Deno child. Source checkouts use workspace
 * members while retaining the consumer import map; published CLIs use its config.
 */
export async function denoChildConfig(
  projectConfig?: string,
  moduleUrl: string = import.meta.url,
  childSpecifier: string = moduleUrl,
): Promise<DenoChildConfig> {
  const sourceConfig = await sourceWorkspaceConfig(moduleUrl);
  const childUrl = isAbsolute(childSpecifier)
    ? toFileUrl(childSpecifier)
    : new URL(childSpecifier, moduleUrl);
  if (sourceConfig && childUrl.href.startsWith(new URL('.', toFileUrl(sourceConfig)).href)) {
    const consumer = projectConfig ? await consumerResolution(projectConfig) : undefined;
    return {
      configArgs: [
        '--config',
        sourceConfig,
        ...(consumer ? ['--import-map', consumer.importMap] : []),
      ],
      consumerLockArgs: consumer?.lockArgs ?? [],
    };
  }
  return { configArgs: projectConfig ? ['--config', projectConfig] : [], consumerLockArgs: [] };
}

async function sourceWorkspaceConfig(
  moduleUrl: string,
): Promise<string | undefined> {
  const module = new URL(moduleUrl);
  if (module.protocol !== 'file:') return undefined;
  const marker = '/packages/cli/';
  const index = module.pathname.lastIndexOf(marker);
  if (index < 0) return undefined;
  const root = new URL(module.href);
  root.pathname = module.pathname.slice(0, index + 1);
  root.search = '';
  root.hash = '';
  try {
    const configUrl = new URL('deno.json', root);
    const config = JSON.parse(await Deno.readTextFile(configUrl));
    const cli = JSON.parse(
      await Deno.readTextFile(new URL('packages/cli/deno.json', root)),
    );
    if (
      cli.name === '@netscript/cli' && Array.isArray(config.workspace) &&
      config.workspace.some((member: unknown) =>
        typeof member === 'string' &&
        ['packages/*', 'packages/cli'].includes(member.replace(/^\.\//, ''))
      )
    ) return fromFileUrl(configUrl);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
  return undefined;
}

async function consumerResolution(projectConfig: string): Promise<{
  readonly importMap: string;
  readonly lockArgs: readonly string[];
}> {
  let importMap = projectConfig;
  let lock: unknown;
  try {
    const config = parseJsonc(await Deno.readTextFile(projectConfig));
    if (config && typeof config === 'object') {
      lock = Reflect.get(config, 'lock');
      const configuredMap: unknown = Reflect.get(config, 'importMap');
      if (typeof configuredMap === 'string') {
        const url = new URL(configuredMap, toFileUrl(resolve(projectConfig)));
        importMap = url.protocol === 'file:' ? fromFileUrl(url) : url.href;
      }
    }
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
  const path = typeof lock === 'string'
    ? lock
    : lock && typeof lock === 'object' && typeof Reflect.get(lock, 'path') === 'string'
    ? String(Reflect.get(lock, 'path'))
    : 'deno.lock';
  return {
    importMap,
    lockArgs: lock === false ? ['--no-lock'] : [
      `--lock=${resolve(dirname(projectConfig), path)}`,
      ...(lock && typeof lock === 'object' && Reflect.get(lock, 'frozen') === true
        ? ['--frozen']
        : []),
    ],
  };
}
