/**
 * AI runtime-registry compiler.
 *
 * Compiles a project's app-owned AI resource files (`ai/tools/*.ts`,
 * `ai/agents/*.ts`) into generated static `*.registry.ts` modules, exactly the
 * way the workers/sagas/triggers plugins compile their conventions. This module
 * owns only the AI-specific *specifics* (the discovered directory, the emitted
 * import line, the entry shape, and the registry map shape); the shared path math
 * and module assembly are delegated to {@linkcode renderRegistryModule} from
 * `@netscript/plugin/cli` — no forked generator logic lives here.
 *
 * Two resource kinds are supported:
 * - `ai-tools` — each file exports an {@link AiToolDefinition} (via `defineAiTool`);
 *   the registry keys each definition by its `descriptor.name` wire name.
 * - `ai-agents` — each file exports a zero-argument factory returning an agent
 *   loop; the registry keys each factory by its file stem.
 *
 * @module
 */

import {
  type ProjectFileEntry,
  type ProjectFiles,
  renderRegistryModule,
} from '@netscript/plugin/cli';

/** Type import emitted into a generated AI registry module header. */
export interface AiRegistryTypeImport {
  /** Exported type name (e.g. `AiToolDefinition`). */
  readonly name: string;
  /** Module specifier the type is imported from (e.g. `@netscript/ai/tools`). */
  readonly from: string;
}

/** A single AI runtime-registry codegen target, as declared in the manifest. */
export interface AiRegistryTarget {
  /** Discriminates the registry shape emitted for this target. */
  readonly kind: 'ai-tools' | 'ai-agents';
  /** Project-relative directory scanned for resource files (e.g. `ai/tools`). */
  readonly dir: string;
  /** Project-relative output path of the generated registry module. */
  readonly registryPath: string;
  /** File suffixes eligible for inclusion (e.g. `[".ts"]`). */
  readonly fileSuffixes: readonly string[];
  /** Base file names excluded from the registry (e.g. `["_registry.ts"]`). */
  readonly exclude: readonly string[];
  /** Import alias prefix used for each discovered module (e.g. `tool`). */
  readonly varPrefix: string;
  /** Type imported into the generated module header. */
  readonly typeImport: AiRegistryTypeImport;
}

/** Result of compiling one AI runtime-registry target. */
export interface AiRegistryCompileResult {
  /** Project-relative source files included in the registry, sorted. */
  readonly files: readonly string[];
  /** Project-relative path of the generated registry module. */
  readonly registryPath: string;
  /** Number of resource files included. */
  readonly count: number;
  /** Whether a registry module was written (skipped when no files are found). */
  readonly written: boolean;
}

/**
 * Compile one AI runtime-registry target into its generated module.
 *
 * Discovers the target's top-level resource files, and — when at least one is
 * found — writes the generated registry module. A missing or empty directory
 * short-circuits: nothing is written and {@linkcode AiRegistryCompileResult.written}
 * is `false`.
 */
export async function compileAiRegistry(
  files: ProjectFiles,
  target: AiRegistryTarget,
): Promise<AiRegistryCompileResult> {
  const inputs = (await listResourceFiles(files, target.dir, target.fileSuffixes))
    .map((entry) => entry.relativePath.replaceAll('\\', '/'))
    .filter((path) => isRegistryInput(path, target))
    .sort((left, right) => left.localeCompare(right));

  if (inputs.length === 0) {
    return { files: inputs, registryPath: target.registryPath, count: 0, written: false };
  }

  const source = target.kind === 'ai-agents'
    ? renderAgentRegistry(target, inputs)
    : renderToolRegistry(target, inputs);
  await files.writeTextFile(target.registryPath, source);
  return { files: inputs, registryPath: target.registryPath, count: inputs.length, written: true };
}

/**
 * List a resource directory, treating a wholly missing directory as empty.
 *
 * `LocalProjectFiles.listFiles` surfaces `NotFound` while iterating a missing
 * directory on some platforms rather than short-circuiting, so a plugin whose
 * resource dir was never scaffolded would otherwise crash the generator. This
 * keeps the missing/empty case a no-op without touching the shared adapter.
 */
async function listResourceFiles(
  files: ProjectFiles,
  dir: string,
  suffixes: readonly string[],
): Promise<readonly ProjectFileEntry[]> {
  try {
    return await files.listFiles(dir, suffixes);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return [];
    }
    throw error;
  }
}

function isRegistryInput(path: string, target: AiRegistryTarget): boolean {
  const prefix = `${target.dir}/`;
  if (!path.startsWith(prefix)) {
    return false;
  }
  const rest = path.slice(prefix.length);
  if (rest.includes('/')) {
    return false;
  }
  return !target.exclude.includes(rest);
}

function fileStem(relativePath: string): string {
  const base = relativePath.slice(relativePath.lastIndexOf('/') + 1);
  return base.replace(/\.tsx?$/, '');
}

function renderToolRegistry(target: AiRegistryTarget, files: readonly string[]): string {
  const type = target.typeImport.name;
  return renderRegistryModule({
    registryPath: target.registryPath,
    items: files.map((relativePath) => ({ relativePath })),
    alias: (index) => `${target.varPrefix}${index}`,
    renderImport: (alias, specifier) => `import * as ${alias} from ${JSON.stringify(specifier)};`,
    renderEntry: (alias, item) => [
      `  ...resolveAiToolDefinitions(${alias}, ${JSON.stringify(item.relativePath)}),`,
    ],
    header: [
      '/**',
      ' * AI Tool Registry - AUTO-GENERATED',
      ' *',
      ' * DO NOT EDIT - regenerated by the AI plugin CLI.',
      ' *',
      ' * @module',
      ' */',
      '',
      `import type { ${type} } from '${target.typeImport.from}';`,
    ],
    body: (entries) => [
      `const definitions: readonly ${type}[] = [`,
      ...entries,
      '];',
      '',
      `export const registry: ReadonlyMap<string, ${type}> = new Map<string, ${type}>(`,
      `  definitions.map((definition): readonly [string, ${type}] => [` +
      'definition.descriptor.name, definition]),',
      ');',
      '',
      'function resolveAiToolDefinitions(',
      '  module: Record<string, unknown>,',
      '  path: string,',
      `): readonly ${type}[] {`,
      '  const candidates = [module.default, module.tool, module.definition, ...Object.values(module)];',
      '  const definitions = candidates.flatMap((candidate) =>',
      '    Array.isArray(candidate) ? candidate : [candidate]',
      '  ).filter(isAiToolDefinition);',
      '',
      '  if (definitions.length === 0) {',
      '    throw new Error(`AI tool module ${path} does not export an ' + type + '.`);',
      '  }',
      '  return definitions;',
      '}',
      '',
      `function isAiToolDefinition(candidate: unknown): candidate is ${type} {`,
      "  if (typeof candidate !== 'object' || candidate === null) {",
      '    return false;',
      '  }',
      "  return 'descriptor' in candidate &&",
      "    'schema' in candidate &&",
      "    'execute' in candidate &&",
      "    typeof candidate.execute === 'function';",
      '}',
      '',
    ],
  });
}

interface AgentItem {
  readonly relativePath: string;
  readonly stem: string;
}

function renderAgentRegistry(target: AiRegistryTarget, files: readonly string[]): string {
  const type = target.typeImport.name;
  return renderRegistryModule<AgentItem>({
    registryPath: target.registryPath,
    items: files.map((relativePath) => ({ relativePath, stem: fileStem(relativePath) })),
    alias: (index) => `${target.varPrefix}${index}`,
    renderImport: (alias, specifier) => `import * as ${alias} from ${JSON.stringify(specifier)};`,
    renderEntry: (alias, item) => [
      `  [${JSON.stringify(item.stem)}, resolveAgentFactory(${alias}, ${
        JSON.stringify(item.relativePath)
      })],`,
    ],
    header: [
      '/**',
      ' * AI Agent Registry - AUTO-GENERATED',
      ' *',
      ' * DO NOT EDIT - regenerated by the AI plugin CLI.',
      ' *',
      ' * @module',
      ' */',
      '',
      `import type { ${type} } from '${target.typeImport.from}';`,
    ],
    body: (entries) => [
      `const entries: readonly (readonly [string, () => ${type}])[] = [`,
      ...entries,
      '];',
      '',
      `export const registry: ReadonlyMap<string, () => ${type}> = new Map<string, () => ${type}>(` +
      'entries);',
      '',
      'function resolveAgentFactory(',
      '  module: Record<string, unknown>,',
      '  path: string,',
      `): () => ${type} {`,
      '  const candidate = module.default ?? Object.values(module).find(isAgentFactory);',
      '  if (!isAgentFactory(candidate)) {',
      '    throw new Error(`AI agent module ${path} does not export an agent factory.`);',
      '  }',
      '  return candidate;',
      '}',
      '',
      `function isAgentFactory(candidate: unknown): candidate is () => ${type} {`,
      "  return typeof candidate === 'function';",
      '}',
      '',
    ],
  });
}
