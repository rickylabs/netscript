import { assertEquals, assertMatch } from '@std/assert';
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
