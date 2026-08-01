/** Render every adapter plugin's install artifacts and type-check emitted TypeScript. */

import { join, resolve, toFileUrl } from '@std/path';
import {
  artifactText,
  collectInstallArtifacts,
  type NetScriptPlugin,
} from '@netscript/plugin/adapter';

if (import.meta.dirname === undefined) {
  throw new Error('The emitted-sample gate requires a file URL.');
}
const repositoryRoot = resolve(import.meta.dirname, '../../..');
const pluginsRoot = join(repositoryRoot, 'plugins');

function isNetScriptPlugin(value: unknown): value is NetScriptPlugin {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<NetScriptPlugin>;
  return typeof candidate.name === 'string' &&
    typeof candidate.kind === 'string' &&
    typeof candidate.install === 'object' &&
    candidate.install !== null &&
    Array.isArray(candidate.install.starterResources);
}

async function adapterPlugins(): Promise<readonly NetScriptPlugin[]> {
  const plugins: NetScriptPlugin[] = [];
  for await (const entry of Deno.readDir(pluginsRoot)) {
    if (!entry.isDirectory) continue;
    const modulePath = join(pluginsRoot, entry.name, 'src', 'adapter', 'plugin.ts');
    try {
      const module: Record<string, unknown> = await import(toFileUrl(modulePath).href);
      const plugin = Object.values(module).find(isNetScriptPlugin);
      if (plugin !== undefined) plugins.push(plugin);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) continue;
      throw error;
    }
  }
  return plugins.sort((left, right) => left.name.localeCompare(right.name));
}

async function main(): Promise<void> {
  const workspace = await Deno.makeTempDir({ prefix: 'netscript-emitted-samples-' });
  try {
    const emittedFiles: string[] = [];
    const owners = new Map<string, string>();
    for (const plugin of await adapterPlugins()) {
      for (const artifact of collectInstallArtifacts(plugin)) {
        if (!artifact.path.endsWith('.ts') && !artifact.path.endsWith('.tsx')) continue;
        const previousOwner = owners.get(artifact.path);
        if (previousOwner !== undefined) {
          throw new Error(
            `Emitted sample collision at ${artifact.path}: ${previousOwner} and ${plugin.name}`,
          );
        }
        owners.set(artifact.path, plugin.name);
        const target = join(workspace, artifact.path);
        await Deno.mkdir(join(target, '..'), { recursive: true });
        await Deno.writeTextFile(target, artifactText(artifact));
        emittedFiles.push(target);
      }
    }

    if (emittedFiles.length === 0) {
      throw new Error('No emitted TypeScript samples were discovered under plugins/*.');
    }

    const command = new Deno.Command(Deno.execPath(), {
      cwd: repositoryRoot,
      args: ['check', '--config', join(repositoryRoot, 'deno.json'), ...emittedFiles.sort()],
      stdout: 'inherit',
      stderr: 'inherit',
    });
    const result = await command.output();
    if (!result.success) Deno.exit(result.code);
    console.log(
      `Checked ${emittedFiles.length} emitted TypeScript samples from ${owners.size} artifact paths.`,
    );
  } finally {
    await Deno.remove(workspace, { recursive: true });
  }
}

if (import.meta.main) await main();
