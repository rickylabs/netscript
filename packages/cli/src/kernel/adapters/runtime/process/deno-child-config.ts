import { fromFileUrl, toFileUrl } from '@std/path';
import { parse as parseJsonc } from '@std/jsonc';

/**
 * Select resolution for a CLI-owned Deno child. Source checkouts use workspace
 * members while retaining the consumer import map; published CLIs use its config.
 */
export async function denoChildConfigArgs(
  projectConfig?: string,
  moduleUrl: string = import.meta.url,
): Promise<string[]> {
  const sourceConfig = await sourceWorkspaceConfig(moduleUrl);
  if (sourceConfig) {
    return [
      '--config',
      sourceConfig,
      ...(projectConfig ? ['--import-map', await consumerImportMap(projectConfig)] : []),
    ];
  }
  return projectConfig ? ['--config', projectConfig] : [];
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

async function consumerImportMap(projectConfig: string): Promise<string> {
  try {
    const config = parseJsonc(await Deno.readTextFile(projectConfig));
    if (config && typeof config === 'object') {
      const importMap: unknown = Reflect.get(config, 'importMap');
      if (typeof importMap === 'string') {
        const url = new URL(importMap, toFileUrl(projectConfig));
        return url.protocol === 'file:' ? fromFileUrl(url) : url.href;
      }
    }
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
  return projectConfig;
}
