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

/** Canonical generated tool registry target used by AI resource commands. */
export const AI_TOOLS_TARGET: AiRegistryTarget = {
  kind: 'ai-tools',
  dir: 'ai/tools',
  registryPath: '.netscript/generated/plugin-ai/tools.registry.ts',
  fileSuffixes: ['.ts'],
  exclude: ['_registry.ts', 'mod.ts', 'types.ts'],
  varPrefix: 'tool',
  typeImport: { name: 'AiToolDefinition', from: '@netscript/ai/tools' },
};

/** Canonical generated agent registry target used by AI resource commands. */
export const AI_AGENTS_TARGET: AiRegistryTarget = {
  kind: 'ai-agents',
  dir: 'ai/agents',
  registryPath: '.netscript/generated/plugin-ai/agents.registry.ts',
  fileSuffixes: ['.ts'],
  exclude: ['_registry.ts', 'mod.ts', 'types.ts'],
  varPrefix: 'agent',
  typeImport: { name: 'AgentLoop', from: '@netscript/ai/agent' },
};

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

/** One generator-selected source set reported for a declared registry target. */
export interface AiRegistryInspectionEntry {
  /** Project-relative path of the declared generated registry. */
  readonly registryPath: string;
  /** Project-relative source files selected for that registry, in compiler order. */
  readonly sourceFiles: readonly string[];
}

/** Version-1 read-only inspection document emitted by the AI registry generator. */
export interface AiRegistryInspectionReport {
  /** Inspection protocol version implemented by this document. */
  readonly inspectionProtocol: 1;
  /** Generator-selected source evidence for every declared target. */
  readonly registries: readonly AiRegistryInspectionEntry[];
}

/** Select the source files the AI compiler would include, without writing a registry. */
export async function selectAiRegistrySources(
  files: ProjectFiles,
  target: AiRegistryTarget,
): Promise<readonly string[]> {
  const discovered = (await listResourceFiles(files, target.dir, target.fileSuffixes))
    .map((entry) => entry.relativePath.replaceAll('\\', '/'))
    .filter((path) => isRegistryInput(path, target))
    .sort((left, right) => left.localeCompare(right));
  return target.kind === 'ai-tools'
    ? await selectToolDefinitionModules(files, discovered)
    : discovered;
}

/** Build the version-1 AI inspection report from the same selector used by compilation. */
export async function inspectAiRegistries(
  files: ProjectFiles,
  targets: readonly AiRegistryTarget[],
): Promise<AiRegistryInspectionReport> {
  const registries: AiRegistryInspectionEntry[] = [];
  for (const target of targets) {
    registries.push({
      registryPath: target.registryPath,
      sourceFiles: await selectAiRegistrySources(files, target),
    });
  }
  return { inspectionProtocol: 1, registries };
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
  const inputs = await selectAiRegistrySources(files, target);

  if (inputs.length === 0) {
    return { files: inputs, registryPath: target.registryPath, count: 0, written: false };
  }

  const source = target.kind === 'ai-agents'
    ? renderAgentRegistry(target, inputs)
    : renderToolRegistry(target, inputs);
  await files.writeTextFile(target.registryPath, source);
  return { files: inputs, registryPath: target.registryPath, count: inputs.length, written: true };
}

async function selectToolDefinitionModules(
  files: ProjectFiles,
  inputs: readonly string[],
): Promise<readonly string[]> {
  const selected: string[] = [];
  for (const path of inputs) {
    const source = await files.readTextFile(path);
    if (source !== undefined && exportsReadyAiToolDefinition(source)) selected.push(path);
  }
  return selected;
}

/**
 * Report whether source exports a ready AI tool definition.
 *
 * This deliberately recognizes only exported initializers (or arrays of them):
 * `defineAiTool(...)` chains and object literals with top-level `descriptor`,
 * `schema`, and `execute` properties. It never considers values created inside
 * function bodies. The small lexer skips comments and string/template contents
 * so incidental text cannot become registry membership. Unrecognized or
 * incomplete input simply returns false.
 */
export function exportsReadyAiToolDefinition(source: string): boolean {
  try {
    const tokens = lexSource(source);
    const builders = new Set(['defineAiTool']);
    for (let index = 0; index < tokens.length - 3; index++) {
      if (
        tokens[index] === 'defineAiTool' && tokens[index + 1] === 'as' &&
        isIdentifier(tokens[index + 2])
      ) {
        builders.add(tokens[index + 2]);
      }
    }

    for (let index = 0; index < tokens.length; index++) {
      if (tokens[index] !== 'export') continue;
      if (tokens[index + 1] === 'default') {
        if (isToolInitializer(tokens, index + 2, builders)) return true;
        continue;
      }
      if (tokens[index + 1] !== 'const') continue;
      let cursor = index + 2;
      while (cursor < tokens.length && tokens[cursor] !== ';') {
        while (cursor < tokens.length && tokens[cursor] !== '=' && tokens[cursor] !== ';') cursor++;
        if (tokens[cursor] !== '=') break;
        if (isToolInitializer(tokens, cursor + 1, builders)) return true;
        cursor = skipInitializer(tokens, cursor + 1);
        if (tokens[cursor] === ',') cursor++;
      }
    }
  } catch {
    // Static selection is best-effort by contract; malformed source is excluded.
  }
  return false;
}

function isToolInitializer(
  tokens: readonly string[],
  start: number,
  builders: ReadonlySet<string>,
): boolean {
  if (builders.has(tokens[start]) && tokens[start + 1] === '(') return true;
  if (tokens[start] === '{') return declaresToolObject(tokens, start);
  if (tokens[start] !== '[') return false;
  let cursor = start + 1;
  while (cursor < tokens.length && tokens[cursor] !== ']') {
    if (!isToolInitializer(tokens, cursor, builders)) return false;
    cursor = skipInitializer(tokens, cursor);
    if (tokens[cursor] === ',') cursor++;
  }
  return tokens[cursor] === ']';
}

function declaresToolObject(tokens: readonly string[], start: number): boolean {
  const required = new Set(['descriptor', 'schema', 'execute']);
  let depth = 0;
  let atPropertyStart = true;
  for (let index = start; index < tokens.length; index++) {
    const token = tokens[index];
    if (token === '{') {
      depth++;
      continue;
    }
    if (token === '}') {
      depth--;
      if (depth === 0) return required.size === 0;
      continue;
    }
    if (depth !== 1) continue;
    if (token === ',') {
      atPropertyStart = true;
      continue;
    }
    if (!atPropertyStart) continue;
    if (isIdentifier(token) && (tokens[index + 1] === ':' || tokens[index + 1] === '(')) {
      required.delete(token);
    }
    atPropertyStart = false;
  }
  return false;
}

function skipInitializer(tokens: readonly string[], start: number): number {
  const closing: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
  const stack: string[] = [];
  for (let index = start; index < tokens.length; index++) {
    const token = tokens[index];
    if (token in closing) stack.push(closing[token]);
    else if (stack.at(-1) === token) stack.pop();
    else if (stack.length === 0 && (token === ',' || token === ';')) return index;
  }
  return tokens.length;
}

function lexSource(source: string): readonly string[] {
  const tokens: string[] = [];
  for (let index = 0; index < source.length;) {
    const char = source[index];
    const next = source[index + 1];
    if (/\s/.test(char)) {
      index++;
    } else if (char === '/' && next === '/') {
      index = source.indexOf('\n', index + 2);
      if (index < 0) break;
    } else if (char === '/' && next === '*') {
      const end = source.indexOf('*/', index + 2);
      if (end < 0) break;
      index = end + 2;
    } else if (char === "'" || char === '"' || char === '`') {
      const quote = char;
      index++;
      while (index < source.length) {
        if (source[index] === '\\') index += 2;
        else if (source[index++] === quote) break;
      }
      tokens.push('<string>');
    } else if (/[A-Za-z_$]/.test(char)) {
      let end = index + 1;
      while (end < source.length && /[\w$]/.test(source[end])) end++;
      tokens.push(source.slice(index, end));
      index = end;
    } else {
      tokens.push(char);
      index++;
    }
  }
  return tokens;
}

function isIdentifier(token: string | undefined): token is string {
  return token !== undefined && /^[A-Za-z_$][\w$]*$/.test(token);
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
