import { assert, assertEquals, assertMatch, assertThrows } from '@std/assert';
import { createToolRegistry, TOOL_INPUT_SCHEMAS, TOOL_NAMES, TOOL_OUTPUT_SCHEMAS } from '../mod.ts';
import { validateSchema } from '../src/domain/schema.ts';

Deno.test('registry enumerates the complete v1 contract surface', () => {
  const registry = createToolRegistry();
  assertEquals(registry.map((tool) => tool.name), [...TOOL_NAMES]);
  assertEquals(new Set(registry.map((tool) => tool.name)).size, TOOL_NAMES.length);
  for (const tool of registry) {
    assertEquals(tool.inputSchema, TOOL_INPUT_SCHEMAS[tool.name]);
    assertEquals(tool.outputSchema, TOOL_OUTPUT_SCHEMAS[tool.name]);
    assertEquals(tool.inputSchema.jsonSchema.type, 'object');
    assertEquals(tool.outputSchema.jsonSchema.type, 'object');
    assertMatch(tool.description, /bounded summary/);
  }
});

Deno.test('list_docs output schema requires observable corpus health metadata', () => {
  const schema = TOOL_OUTPUT_SCHEMAS.list_docs.jsonSchema as {
    readonly required?: readonly string[];
    readonly properties?: Readonly<Record<string, unknown>>;
  };
  assert(schema.required?.includes('corpus'));
  assertEquals(schema.properties?.corpus, {
    type: 'object',
    properties: {
      kind: { enum: ['filesystem', 'embedded'] },
      root: { type: ['string', 'null'] },
      documentCount: { type: 'integer' },
    },
    required: ['kind', 'root', 'documentCount'],
    additionalProperties: false,
  });
  const base = { count: 0, docs: [], corpus: { kind: 'embedded', documentCount: 6 } };
  validateSchema(TOOL_OUTPUT_SCHEMAS.list_docs, {
    ...base,
    corpus: { ...base.corpus, root: null },
  });
  validateSchema(TOOL_OUTPUT_SCHEMAS.list_docs, {
    ...base,
    corpus: { ...base.corpus, kind: 'filesystem', root: '/project/.netscript/docs' },
  });
  assertThrows(() =>
    validateSchema(TOOL_OUTPUT_SCHEMAS.list_docs, {
      ...base,
      corpus: { ...base.corpus, root: 42 },
    })
  );
});

Deno.test('contracts reject malformed required fields, types, bounds, and extra keys', () => {
  const invalid: Array<[keyof typeof TOOL_INPUT_SCHEMAS, unknown]> = [
    ['get_run', {}],
    ['doctor', { endpoint: 42 }],
    ['execute_command', { command: 'x', args: [1] }],
    ['list_runs', { limit: 101 }],
    ['list_docs', { unexpected: true }],
  ];
  for (const [name, value] of invalid) {
    let rejected = false;
    try {
      validateSchema(TOOL_INPUT_SCHEMAS[name], value);
    } catch {
      rejected = true;
    }
    assertEquals(rejected, true, `${name} accepted malformed input`);
  }
});

Deno.test('non-doctor tools expose planned structured failures in S1', async () => {
  const tool = createToolRegistry().find((candidate) => candidate.name === 'get_app_status');
  const result = await tool!.flow({});
  assertEquals(result, {
    ok: false,
    error: {
      code: 'not_implemented',
      message: 'get_app_status is registered but not implemented in S1',
      status: 'planned',
    },
  });
});

Deno.test('docs drift proof: documentation reflects registered tool surface and count', async () => {
  const readme = await Deno.readTextFile(new URL('../README.md', import.meta.url));
  const refMcp = await Deno.readTextFile(
    new URL('../../../docs/site/reference/mcp/index.md', import.meta.url),
  );
  const agentTooling = await Deno.readTextFile(
    new URL('../../../docs/site/ai/agent-tooling.md', import.meta.url),
  );

  assertEquals(TOOL_NAMES.length, 21);
  assertEquals(TOOL_NAMES.includes('record_drift'), true);

  assert(
    readme.includes('21 token-bounded tools'),
    'README.md does not state 21 token-bounded tools',
  );
  assert(
    refMcp.includes('21 token-bounded tools') || refMcp.includes('21 tools'),
    'reference/mcp/index.md missing 21 tools count',
  );
  assert(
    agentTooling.includes('Twenty-one tools') || agentTooling.includes('21 tools'),
    'agent-tooling.md missing 21 tools count',
  );

  for (const toolName of TOOL_NAMES) {
    assert(readme.includes(`\`${toolName}\``), `README.md missing tool: ${toolName}`);
    assert(refMcp.includes(`\`${toolName}\``), `reference/mcp/index.md missing tool: ${toolName}`);
    assert(agentTooling.includes(`\`${toolName}\``), `agent-tooling.md missing tool: ${toolName}`);
  }
});
