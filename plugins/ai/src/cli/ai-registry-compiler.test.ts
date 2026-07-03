import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import type { ProjectFileEntry, ProjectFiles } from '@netscript/plugin/cli';
import { type AiRegistryTarget, compileAiRegistry } from './ai-registry-compiler.ts';

const TOOLS_TARGET: AiRegistryTarget = {
  kind: 'ai-tools',
  dir: 'ai/tools',
  registryPath: '.netscript/generated/plugin-ai/tools.registry.ts',
  fileSuffixes: ['.ts'],
  exclude: ['_registry.ts', 'mod.ts', 'types.ts'],
  varPrefix: 'tool',
  typeImport: { name: 'AiToolDefinition', from: '@netscript/ai/tools' },
};

const AGENTS_TARGET: AiRegistryTarget = {
  kind: 'ai-agents',
  dir: 'ai/agents',
  registryPath: '.netscript/generated/plugin-ai/agents.registry.ts',
  fileSuffixes: ['.ts'],
  exclude: ['_registry.ts', 'mod.ts', 'types.ts'],
  varPrefix: 'agent',
  typeImport: { name: 'AgentLoop', from: '@netscript/ai/agent' },
};

Deno.test('compileAiRegistry emits a name-keyed tool registry', async () => {
  const files = new MemoryProjectFiles([
    'ai/tools/echo.ts',
    'ai/tools/summarize.ts',
    'ai/tools/_registry.ts',
    'ai/tools/nested/ignored.ts',
    'ai/agents/assistant.ts',
  ]);

  const result = await compileAiRegistry(files, TOOLS_TARGET);

  assertEquals(result.registryPath, '.netscript/generated/plugin-ai/tools.registry.ts');
  assertEquals(result.written, true);
  assertEquals(result.count, 2);
  assertEquals(result.files, ['ai/tools/echo.ts', 'ai/tools/summarize.ts']);

  const source = files.written.get('.netscript/generated/plugin-ai/tools.registry.ts') ?? '';
  assertStringIncludes(source, "import type { AiToolDefinition } from '@netscript/ai/tools';");
  assertStringIncludes(source, 'import * as tool0 from "../../../ai/tools/echo.ts";');
  assertStringIncludes(source, 'import * as tool1 from "../../../ai/tools/summarize.ts";');
  assertStringIncludes(source, '...resolveAiToolDefinitions(tool0, "ai/tools/echo.ts"),');
  assertStringIncludes(
    source,
    'export const registry: ReadonlyMap<string, AiToolDefinition> = ' +
      'new Map<string, AiToolDefinition>(',
  );
  assertStringIncludes(source, '[definition.descriptor.name, definition]');
  assertStringIncludes(
    source,
    'function isAiToolDefinition(candidate: unknown): candidate is AiToolDefinition {',
  );
  assertNoUnsoundCasts(source);
});

Deno.test('compileAiRegistry emits a stem-keyed agent factory registry', async () => {
  const files = new MemoryProjectFiles([
    'ai/agents/assistant.ts',
    'ai/agents/researcher.ts',
    'ai/agents/mod.ts',
  ]);

  const result = await compileAiRegistry(files, AGENTS_TARGET);

  assertEquals(result.written, true);
  assertEquals(result.count, 2);
  assertEquals(result.files, ['ai/agents/assistant.ts', 'ai/agents/researcher.ts']);

  const source = files.written.get('.netscript/generated/plugin-ai/agents.registry.ts') ?? '';
  assertStringIncludes(source, "import type { AgentLoop } from '@netscript/ai/agent';");
  assertStringIncludes(source, 'import * as agent0 from "../../../ai/agents/assistant.ts";');
  assertStringIncludes(
    source,
    '["assistant", resolveAgentFactory(agent0, "ai/agents/assistant.ts")],',
  );
  assertStringIncludes(
    source,
    'export const registry: ReadonlyMap<string, () => AgentLoop> = ' +
      'new Map<string, () => AgentLoop>(entries);',
  );
  assertStringIncludes(
    source,
    'function isAgentFactory(candidate: unknown): candidate is () => AgentLoop {',
  );
  assertNoUnsoundCasts(source);
});

Deno.test('compileAiRegistry short-circuits when the resource dir is empty/missing', async () => {
  const files = new MemoryProjectFiles(['ai/agents/assistant.ts']);

  const result = await compileAiRegistry(files, TOOLS_TARGET);

  assertEquals(result.written, false);
  assertEquals(result.count, 0);
  assertEquals(files.written.has('.netscript/generated/plugin-ai/tools.registry.ts'), false);
});

/** Assert the generated module contains no `as`/`any` unsound casts. */
function assertNoUnsoundCasts(source: string): void {
  for (const pattern of [' as Record', ' as unknown', ' as any', ': any', '<any>']) {
    assertEquals(
      source.includes(pattern),
      false,
      `generated module must not contain "${pattern}"`,
    );
  }
}

/** In-memory {@linkcode ProjectFiles} fixture for deterministic registry tests. */
class MemoryProjectFiles implements ProjectFiles {
  readonly projectRoot = '/project';
  readonly written = new Map<string, string>();
  readonly #contents: Map<string, string>;

  constructor(paths: readonly string[]) {
    this.#contents = new Map(paths.map((path) => [path, 'export default {};']));
  }

  resolve(path: string): string {
    return `${this.projectRoot}/${path}`;
  }

  // deno-lint-ignore require-await
  async writeTextFile(path: string, content: string): Promise<void> {
    this.written.set(path, content);
  }

  // deno-lint-ignore require-await
  async readTextFile(path: string): Promise<string | undefined> {
    return this.#contents.get(path);
  }

  // deno-lint-ignore require-await
  async listFiles(path: string, extensions: readonly string[] = []): Promise<
    readonly ProjectFileEntry[]
  > {
    const prefix = `${path}/`;
    const entries: ProjectFileEntry[] = [];
    for (const [relativePath, content] of this.#contents) {
      if (!relativePath.startsWith(prefix)) continue;
      if (extensions.length && !extensions.some((ext) => relativePath.endsWith(ext))) continue;
      entries.push(
        Object.freeze({ path: this.resolve(relativePath), relativePath, size: content.length }),
      );
    }
    return Object.freeze(
      entries.sort((left, right) => left.relativePath.localeCompare(right.relativePath)),
    );
  }

  toImportUrl(path: string): string {
    return `file://${this.resolve(path)}`;
  }

  relative(path: string): string {
    return path.startsWith(`${this.projectRoot}/`) ? path.slice(this.projectRoot.length + 1) : path;
  }
}
