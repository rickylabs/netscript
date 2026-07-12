import { assertStringIncludes } from '@std/assert';
import { createToolRegistry } from '../mod.ts';

Deno.test('command tool descriptions disclose policy and output bounds', () => {
  const tools = createToolRegistry();
  const list = tools.find((tool) => tool.name === 'list_commands')!;
  const execute = tools.find((tool) => tool.name === 'execute_command')!;
  assertStringIncludes(list.description, 'bounded CLI command descriptors');
  assertStringIncludes(execute.description, 'allowlist gate');
  assertStringIncludes(execute.description, 'bounded combined output tail');
});
