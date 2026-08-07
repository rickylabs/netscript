import { assertEquals, assertThrows } from '@std/assert';
import { validateOpenCodeMcpAttachment } from './opencode-preflight.ts';

Deno.test('MCP preflight keeps available count separate from expected tools and calls', () => {
  assertEquals(
    validateOpenCodeMcpAttachment(
      ['netscript', 'aspire'],
      { netscript: { status: 'connected' }, aspire: { status: 'connected' } },
      ['read', 'netscript_search_docs', 'netscript_doctor', 'aspire_list_resources'],
    ),
    {
      expectedServerCount: 2,
      connectedServerCount: 2,
      availableToolCount: 4,
      expectedToolCount: 2,
      documentationTool: 'netscript_search_docs',
    },
  );
});

Deno.test('MCP preflight fails closed for missing connection or invalid host tool shape', () => {
  assertThrows(
    () =>
      validateOpenCodeMcpAttachment(
        ['netscript', 'aspire'],
        { netscript: { status: 'connected' }, aspire: { status: 'failed' } },
        ['netscript_search_docs', 'aspire_doctor'],
      ),
    Error,
    'required_server_not_connected',
  );
  assertThrows(
    () =>
      validateOpenCodeMcpAttachment(
        ['netscript', 'aspire'],
        { netscript: { status: 'connected' }, aspire: { status: 'connected' } },
        { invalid: true },
      ),
    Error,
    'invalid_tool_shape',
  );
});

Deno.test('MCP preflight diagnostics reject unsafe generated server identities', () => {
  assertThrows(
    () => validateOpenCodeMcpAttachment(['private server'], {}, []),
    Error,
    'safe server identities',
  );
});
