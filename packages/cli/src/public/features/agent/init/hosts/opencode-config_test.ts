import { assert, assertEquals } from '@std/assert';
import { netscriptJsrSpecifier } from '../../../../../kernel/constants/jsr-specifiers.ts';
import { OPENCODE_MCP_TIMEOUT_MS, renderOpenCodeConfig } from './opencode-config.ts';

const NETSCRIPT_COMMAND = ['deno', 'run', '-A', netscriptJsrSpecifier('cli'), 'agent', 'mcp'];
/** OpenCode's documented per-server default when `timeout` is omitted. */
const OPENCODE_DEFAULT_TIMEOUT_MS = 5_000;

Deno.test('OpenCode config declares netscript and aspire in the local mcp shape with a cold-start timeout', () => {
  const config = JSON.parse(renderOpenCodeConfig(undefined, NETSCRIPT_COMMAND));
  assertEquals(config.$schema, 'https://opencode.ai/config.json');
  assertEquals(config.mcp, {
    netscript: {
      type: 'local',
      enabled: true,
      timeout: OPENCODE_MCP_TIMEOUT_MS.netscript,
      command: NETSCRIPT_COMMAND,
    },
    aspire: {
      type: 'local',
      enabled: true,
      timeout: OPENCODE_MCP_TIMEOUT_MS.aspire,
      command: ['aspire', 'agent', 'mcp'],
    },
  });
  for (const server of ['netscript', 'aspire']) {
    assert(
      config.mcp[server].timeout > OPENCODE_DEFAULT_TIMEOUT_MS,
      `${server} timeout must exceed OpenCode's 5 s default`,
    );
  }
});

Deno.test('OpenCode config is not MCP-only: it enables the Deno language server and formatter', () => {
  const config = JSON.parse(renderOpenCodeConfig(undefined, NETSCRIPT_COMMAND));
  assertEquals(Object.keys(config).sort(), ['$schema', 'formatter', 'lsp', 'mcp']);
  assertEquals(config.lsp.deno, {
    command: ['deno', 'lsp'],
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs'],
  });
  assertEquals(config.formatter.deno, {
    command: ['deno', 'fmt', '$FILE'],
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.jsonc', '.md'],
  });
});

Deno.test('OpenCode config merge preserves unrelated keys and user entries', () => {
  const existing = JSON.stringify({
    $schema: 'https://example.test/custom.json',
    model: 'local/model',
    mcp: {
      other: { type: 'remote', url: 'https://mcp.example.test' },
      netscript: { type: 'local', command: ['stale'] },
    },
    lsp: { gopls: { command: ['gopls'] }, deno: { command: ['deno', 'lsp'], env: { A: '1' } } },
    formatter: true,
  });
  const config = JSON.parse(renderOpenCodeConfig(existing, NETSCRIPT_COMMAND));
  assertEquals(config.$schema, 'https://example.test/custom.json');
  assertEquals(config.model, 'local/model');
  assertEquals(config.mcp.other, { type: 'remote', url: 'https://mcp.example.test' });
  assertEquals(config.mcp.netscript.command, NETSCRIPT_COMMAND);
  assertEquals(config.lsp.gopls, { command: ['gopls'] });
  assertEquals(config.lsp.deno, { command: ['deno', 'lsp'], env: { A: '1' } });
  assertEquals(config.formatter.deno.command, ['deno', 'fmt', '$FILE']);
});

Deno.test('OpenCode config keeps an explicit false lsp or formatter opt-out', () => {
  const config = JSON.parse(
    renderOpenCodeConfig('{"lsp":false,"formatter":false}', NETSCRIPT_COMMAND),
  );
  assertEquals(config.lsp, false);
  assertEquals(config.formatter, false);
  assertEquals(config.mcp.netscript.command, NETSCRIPT_COMMAND);
});

Deno.test('OpenCode config rendering is idempotent', () => {
  const first = renderOpenCodeConfig('{"model":"local/model"}', NETSCRIPT_COMMAND);
  assertEquals(renderOpenCodeConfig(first, NETSCRIPT_COMMAND), first);
  const fresh = renderOpenCodeConfig(undefined, NETSCRIPT_COMMAND);
  assertEquals(renderOpenCodeConfig(fresh, NETSCRIPT_COMMAND), fresh);
});
