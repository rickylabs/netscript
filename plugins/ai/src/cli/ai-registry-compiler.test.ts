import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { artifactText, substituteTokens } from '@netscript/plugin/adapter';
import type { ProjectFileEntry, ProjectFiles } from '@netscript/plugin/cli';
import { mcpToolStub } from '../adapter/resources/mcp-tool/mcp-tool.stub.ts';
import { toolScaffolder } from '../adapter/resources/tool/tool.ts';
import {
  type AiRegistryTarget,
  compileAiRegistry,
  exportsReadyAiToolDefinition,
  inspectAiRegistries,
} from './ai-registry-compiler.ts';

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

Deno.test('compileAiRegistry includes the emitted tool stub without executing it', async () => {
  const tool = toolScaffolder.emit({ id: 'e2e-tool' })[0];
  const files = new MemoryProjectFiles(new Map([[tool.path, artifactText(tool)]]));
  const result = await compileAiRegistry(files, TOOLS_TARGET);

  assertEquals(result.files, ['ai/tools/e2e-tool.ts']);
  assertEquals(result.count, 1);
  const source = files.written.get(TOOLS_TARGET.registryPath) ?? '';
  assertStringIncludes(source, 'import * as tool0 from "../../../ai/tools/e2e-tool.ts";');
  assertStringIncludes(source, '...resolveAiToolDefinitions(tool0, "ai/tools/e2e-tool.ts"),');
});

Deno.test('compileAiRegistry excludes the actual skill-loader stub by source shape', async () => {
  assertEquals(TOOLS_TARGET.exclude.includes('skill-loader.ts'), false);
  const tool = toolScaffolder.emit({ id: 'e2e-tool' })[0];
  const files = new MemoryProjectFiles(
    new Map([
      [tool.path, artifactText(tool)],
      ['ai/tools/skill-loader.ts', substituteTokens(mcpToolStub, {})],
    ]),
  );

  const result = await compileAiRegistry(files, TOOLS_TARGET);

  assertEquals(result.files, ['ai/tools/e2e-tool.ts']);
  assertEquals(result.count, 1);
  assertEquals(
    (files.written.get(TOOLS_TARGET.registryPath) ?? '').includes('skill-loader.ts'),
    false,
  );
});

Deno.test('inspect report exactly matches compile selection for every target without writes', async () => {
  const fixture = new Map([
    [
      'ai/tools/e2e-tool.ts',
      `
export default {
  descriptor: { name: 'e2e-tool' },
  schema: {},
  execute: async () => ({ state: 'output-available', output: { ok: true } }),
};
`,
    ],
    [
      'ai/tools/skill-loader.ts',
      `
export function createSkillLoaderTool(skills: unknown) {
  return { skills };
}
`,
    ],
    ['ai/agents/assistant.ts', 'export default function assistant() { return {}; }\n'],
  ]);
  const targets = [TOOLS_TARGET, AGENTS_TARGET] as const;
  const inspectFiles = new MemoryProjectFiles(fixture);
  const compileFiles = new MemoryProjectFiles(fixture);
  const writesBeforeInspect = new Map(inspectFiles.written);

  const report = await inspectAiRegistries(inspectFiles, targets);

  assertEquals(inspectFiles.written, writesBeforeInspect);
  assertEquals(report.inspectionProtocol, 1);
  assertEquals(report.registries.map((entry) => entry.registryPath), [
    TOOLS_TARGET.registryPath,
    AGENTS_TARGET.registryPath,
  ]);
  for (const [index, target] of targets.entries()) {
    const compiled = await compileAiRegistry(compileFiles, target);
    assertEquals(report.registries[index].sourceFiles, compiled.files);
  }
});

Deno.test('compileAiRegistry never resolves imports from app-owned tool modules', async () => {
  const source = `
    import { defineAiTool as buildTool } from '@unresolvable/example';
    export default buildTool('remote-safe').server(() => ({ ok: true }));
  `;
  const files = new MemoryProjectFiles(new Map([['ai/tools/remote-safe.ts', source]]));

  const result = await compileAiRegistry(files, TOOLS_TARGET);

  assertEquals(result.files, ['ai/tools/remote-safe.ts']);
  assertEquals(result.written, true);
});

Deno.test('tool source selection ignores factories, comments, strings, and malformed input', () => {
  assertEquals(
    exportsReadyAiToolDefinition(`
      // export const fake = defineAiTool('comment');
      const text = "export default defineAiTool('string')";
      export function createTool() { return defineAiTool('factory'); }
    `),
    false,
  );
  assertEquals(exportsReadyAiToolDefinition('export const broken = ['), false);
  assertEquals(
    exportsReadyAiToolDefinition(`
      import { defineAiTool as tool } from '@netscript/ai/tools';
      export const tools = [
        tool('one').server(() => 1),
        tool('two').server(() => 2),
      ];
    `),
    true,
  );
});

Deno.test('tool source selection accepts structural objects but not partial or factory values', () => {
  assertEquals(
    exportsReadyAiToolDefinition(`
      export default {
        descriptor: { name: 'e2e-tool' },
        schema: {},
        execute: async () => ({ state: 'output-available', output: { ok: true } }),
      };
    `),
    true,
  );
  assertEquals(
    exportsReadyAiToolDefinition(`
      export const partial = {
        descriptor: { name: 'partial' },
        execute: async () => ({ ok: true }),
      };
    `),
    false,
  );
  assertEquals(
    exportsReadyAiToolDefinition(`
      export function createSkillLoaderTool(skills) {
        return { skills };
      }
    `),
    false,
  );
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

  constructor(paths: readonly string[] | Map<string, string>) {
    this.#contents = paths instanceof Map ? new Map(paths) : new Map(paths.map((path) => [
      path,
      path.startsWith('ai/tools/')
        ? "export const tool = defineAiTool('fixture').server(() => ({}));"
        : 'export default {};',
    ]));
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
  async removeFile(path: string): Promise<boolean> {
    return this.#contents.delete(path);
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
