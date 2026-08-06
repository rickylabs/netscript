/** Render every adapter plugin's install artifacts and type-check emitted TypeScript. */

import { join, resolve, toFileUrl } from '@std/path';
import {
  artifactText,
  collectInstallArtifacts,
  type NetScriptPlugin,
  type ScaffoldArtifact,
} from '@netscript/plugin/adapter';

type DenoConfig = Readonly<{
  catalog?: Readonly<Record<string, string>>;
  name?: string;
  exports?: string | Readonly<Record<string, string>>;
  imports?: Readonly<Record<string, string>>;
}>;

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

async function readConfig(path: string): Promise<DenoConfig> {
  return JSON.parse(await Deno.readTextFile(path));
}

async function workspaceImports(): Promise<Record<string, string>> {
  const imports: Record<string, string> = {};
  const members: Array<Readonly<{ directory: string; config: DenoConfig }>> = [];
  for (const group of ['packages', 'plugins']) {
    const groupRoot = join(repositoryRoot, group);
    for await (const entry of Deno.readDir(groupRoot)) {
      if (!entry.isDirectory) continue;
      const directory = join(groupRoot, entry.name);
      try {
        members.push({ directory, config: await readConfig(join(directory, 'deno.json')) });
      } catch (error) {
        if (!(error instanceof Deno.errors.NotFound)) throw error;
      }
    }
  }

  for (const { directory, config } of members) {
    for (const [specifier, target] of Object.entries(config.imports ?? {})) {
      imports[specifier] = target.startsWith('.')
        ? toFileUrl(resolve(directory, target)).href
        : target;
    }
  }
  for (const { directory, config } of members) {
    if (config.name === undefined || config.exports === undefined) continue;
    const exports = typeof config.exports === 'string' ? { '.': config.exports } : config.exports;
    for (const [subpath, target] of Object.entries(exports)) {
      const specifier = subpath === '.' ? config.name : `${config.name}/${subpath.slice(2)}`;
      imports[specifier] = toFileUrl(resolve(directory, target)).href;
    }
  }

  const rootConfig = JSON.parse(await Deno.readTextFile(join(repositoryRoot, 'deno.json')));
  for (const [name, version] of Object.entries<string>(rootConfig.catalog)) {
    imports[name] ??= `npm:${name}@${version}`;
  }
  const preactVersion: string = rootConfig.catalog.preact;
  imports.preact = `npm:preact@${preactVersion}`;
  imports['preact/hooks'] = `npm:preact@${preactVersion}/hooks`;
  imports['preact/jsx-runtime'] = `npm:preact@${preactVersion}/jsx-runtime`;
  return imports;
}

async function writeHostFixtures(workspace: string): Promise<void> {
  const fixtures: Readonly<Record<string, string>> = {
    '.netscript/generated/plugin-ai/tools.registry.ts':
      `import type { AiToolDefinition } from '@netscript/ai/tools';\n` +
      `export const registry: ReadonlyMap<string, AiToolDefinition> = new Map();\n`,
    '.netscript/generated/plugin-ai/agents.registry.ts':
      `import type { AgentLoop } from '@netscript/ai/agent';\n` +
      `export const registry: ReadonlyMap<string, () => AgentLoop> = new Map();\n`,
    'ai/components/ui/markdown.tsx': `import type { ComponentChildren, JSX } from 'preact';\n` +
      `export function Markdown(props: { children?: ComponentChildren }): JSX.Element {\n` +
      `  return <>{props.children}</>;\n}\n`,
  };
  for (const [path, source] of Object.entries(fixtures)) {
    const target = join(workspace, path);
    await Deno.mkdir(join(target, '..'), { recursive: true });
    await Deno.writeTextFile(target, source);
  }
}

async function main(): Promise<void> {
  const workspace = await Deno.makeTempDir({ prefix: 'netscript-emitted-samples-' });
  try {
    await writeHostFixtures(workspace);
    const configPath = join(workspace, 'deno.json');
    const rootConfig = await readConfig(join(repositoryRoot, 'deno.json'));
    await Deno.writeTextFile(
      configPath,
      JSON.stringify({
        catalog: rootConfig.catalog,
        imports: await workspaceImports(),
        compilerOptions: {
          strict: true,
          noImplicitAny: true,
          noImplicitReturns: true,
          jsx: 'precompile',
          jsxImportSource: 'preact',
        },
      }),
    );
    const emittedFiles: string[] = [];
    const emissions = new Map<
      string,
      Readonly<{ owner: string; source: string; text: string }>
    >();
    let sampleCount = 0;

    const emit = async (
      plugin: NetScriptPlugin,
      source: string,
      artifact: ScaffoldArtifact,
    ): Promise<void> => {
      if (!artifact.path.endsWith('.ts') && !artifact.path.endsWith('.tsx')) return;
      const text = artifactText(artifact);
      const previous = emissions.get(artifact.path);
      if (previous !== undefined) {
        if (previous.owner !== plugin.name) {
          throw new Error(
            `Emitted sample collision at ${artifact.path}: ${previous.owner} and ${plugin.name}`,
          );
        }
        if (previous.text !== text) {
          throw new Error(
            `Conflicting ${plugin.name} samples at ${artifact.path}: ${previous.source} and ${source}`,
          );
        }
        return;
      }

      emissions.set(artifact.path, { owner: plugin.name, source, text });
      const target = join(workspace, artifact.path);
      await Deno.mkdir(join(target, '..'), { recursive: true });
      await Deno.writeTextFile(target, text);
      emittedFiles.push(target);
    };

    for (const plugin of await adapterPlugins()) {
      for (const artifact of collectInstallArtifacts(plugin)) {
        if (artifact.path.endsWith('.ts') || artifact.path.endsWith('.tsx')) sampleCount += 1;
        await emit(plugin, 'install', artifact);
      }
      for (const resource of plugin.resources ?? []) {
        if (resource.defaultInput === undefined) {
          throw new Error(`${plugin.name} resource ${resource.name} has no defaultInput.`);
        }
        for (const artifact of resource.scaffolder.emit(resource.defaultInput)) {
          if (artifact.path.endsWith('.ts') || artifact.path.endsWith('.tsx')) sampleCount += 1;
          await emit(plugin, `add ${resource.name}`, artifact);
        }
      }
    }

    if (emittedFiles.length === 0) {
      throw new Error('No emitted TypeScript samples were discovered under plugins/*.');
    }

    const command = new Deno.Command(Deno.execPath(), {
      cwd: repositoryRoot,
      args: ['check', '--config', configPath, ...emittedFiles.sort()],
      stdout: 'inherit',
      stderr: 'inherit',
    });
    const result = await command.output();
    if (!result.success) Deno.exit(result.code);
    console.log(
      `Checked ${sampleCount} emitted TypeScript samples from ${emissions.size} artifact paths.`,
    );
  } finally {
    await Deno.remove(workspace, { recursive: true });
  }
}

if (import.meta.main) await main();
