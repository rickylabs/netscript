import { assert, assertEquals, assertRejects } from '@std/assert';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import {
  type AiToolRegistry,
  createToolRegistry,
  defineAiTool,
  renderUiTool,
  ToolInputValidationError,
} from '../tools.ts';
import { RENDER_UI_TOOL_NAME } from '../src/contracts/ui.ts';
import { ToolNotFoundError } from '../src/contracts/errors.ts';

/** A hand-written Standard Schema validating `{ text: string }`. */
const textSchema: StandardSchemaV1<unknown, { text: string }> = {
  '~standard': {
    version: 1,
    vendor: 'test',
    validate(value: unknown) {
      if (
        typeof value === 'object' && value !== null &&
        typeof (value as { text?: unknown }).text === 'string'
      ) {
        return { value: { text: (value as { text: string }).text } };
      }
      return { issues: [{ message: '"text" must be a string.', path: ['text'] }] };
    },
  },
};

function makeEchoTool(onRun: () => void) {
  return defineAiTool('echo')
    .describe('Echo text back')
    .parameters({
      type: 'object',
      properties: { text: { type: 'string' } },
      required: ['text'],
    })
    .input(textSchema)
    .server((input) => {
      onRun();
      return { echoed: input.text };
    });
}

Deno.test('defineAiTool().server(): valid input runs the handler and returns typed output', async () => {
  let ran = false;
  const echo = makeEchoTool(() => (ran = true));
  const result = await echo.execute({ text: 'hi' });
  assert(ran, 'handler should run for valid input');
  assertEquals(result.kind, 'server');
  assertEquals(result.deferred, false);
  assertEquals(result.input, { text: 'hi' });
  assertEquals(result.output, { echoed: 'hi' });
});

Deno.test('defineAiTool().server(): rejects invalid input BEFORE the handler runs', async () => {
  let ran = false;
  const echo = makeEchoTool(() => (ran = true));
  const error = await assertRejects(
    () => echo.execute({ text: 123 }),
    ToolInputValidationError,
  );
  assert(!ran, 'handler must NOT run when input validation fails');
  assertEquals(error.toolName, 'echo');
  assert(error.issues.length > 0, 'validation error should carry issues');
});

Deno.test('createToolRegistry: dispatch throws ToolNotFoundError for an unregistered name', async () => {
  const registry = createToolRegistry();
  await assertRejects(
    () => registry.dispatch('does-not-exist', {}),
    ToolNotFoundError,
  );
});

Deno.test('createToolRegistry: registered server tool dispatches with validated input', async () => {
  let ran = false;
  const registry = createToolRegistry([makeEchoTool(() => (ran = true))]);
  const result = await registry.dispatch('echo', { text: 'world' });
  assert(ran);
  assertEquals(result.output, { echoed: 'world' });

  // Invalid input is rejected before the handler on the dispatch path too.
  ran = false;
  await assertRejects(() => registry.dispatch('echo', {}), ToolInputValidationError);
  assert(!ran);
});

Deno.test('render_ui descriptor round-trips through registration + dispatch WITHOUT a live renderer', async () => {
  const registry: AiToolRegistry = createToolRegistry([renderUiTool]);

  // Descriptor is the render_ui wire contract, schema-only (no renderer).
  assertEquals(renderUiTool.descriptor.name, RENDER_UI_TOOL_NAME);
  assertEquals(renderUiTool.kind, 'client');
  assert(registry.has(RENDER_UI_TOOL_NAME));
  assertEquals(registry.get(RENDER_UI_TOOL_NAME)?.name, RENDER_UI_TOOL_NAME);

  const input = { component: 'Chart', props: { data: [1, 2, 3] }, title: 'Sales' };
  const result = await registry.dispatch(RENDER_UI_TOOL_NAME, input);
  assertEquals(result.deferred, true, 'client tool defers execution, no renderer runs');
  assertEquals(result.output, undefined);
  assertEquals(result.input, input, 'validated input round-trips to the renderer');

  // Invalid render_ui input is rejected by the wire-contract schema.
  await assertRejects(
    () => registry.dispatch(RENDER_UI_TOOL_NAME, { title: 'no component' }),
    ToolInputValidationError,
  );
});

Deno.test('createToolRegistry satisfies ToolRegistryPort: definitions are visible + handler-bridged', async () => {
  const registry = createToolRegistry([makeEchoTool(() => {})]);
  assertEquals(registry.list().map((d) => d.name), ['echo']);
  assertEquals(registry.listDefinitions().length, 1);

  const handler = registry.resolveHandler('echo');
  assert(handler !== undefined, 'a definition should bridge to a port ToolHandler');
  const toolResult = await handler({ id: 'call-1', name: 'echo', arguments: '{"text":"bridged"}' });
  assertEquals(toolResult.toolCallId, 'call-1');
  assertEquals(toolResult.content, JSON.stringify({ echoed: 'bridged' }));
});
