import { assertEquals } from '@std/assert';
import { TOOL_INPUT_SCHEMAS, type ToolName, validateSchema } from '@netscript/mcp';

Deno.test('comparison snippets compile against the current local public APIs', async () => {
  const result = await new Deno.Command(Deno.execPath(), {
    args: ['run', '-A', 'tools/docs-site/check-comparison-examples.ts'],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assertEquals(
    result.code,
    0,
    new TextDecoder().decode(result.stdout) +
      new TextDecoder().decode(result.stderr),
  );
});

Deno.test('comparison MCP recipe uses the current tool input schemas', async () => {
  const calls: { name: ToolName; arguments: unknown }[] = JSON.parse(
    await Deno.readTextFile('docs/site/comparisons/_examples/mcp.json'),
  );
  assertEquals(calls.slice(0, 3).map((call) => call.name), [
    'list_api_services',
    'list_service_operations',
    'get_operation_schema',
  ]);
  for (const call of calls) validateSchema(TOOL_INPUT_SCHEMAS[call.name], call.arguments);
});
