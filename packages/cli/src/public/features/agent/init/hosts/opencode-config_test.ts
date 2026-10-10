import { assert, assertEquals, assertStringIncludes, assertThrows } from '@std/assert';
import { parse as parseJsonc } from '@std/jsonc';
import { netscriptJsrSpecifier } from '../../../../../kernel/constants/jsr-specifiers.ts';
import {
  OPENCODE_MCP_TIMEOUT_MS,
  planOpenCodeConfig,
  renderOpenCodeConfig,
} from './opencode-config.ts';

const NETSCRIPT_COMMAND = ['deno', 'run', '-A', netscriptJsrSpecifier('cli'), 'agent', 'mcp'];
/** Read a nested value from parsed JSONC without casting. */
function at(value: unknown, ...path: readonly string[]): unknown {
  return path.reduce<unknown>(
    (current, key) =>
      current !== null && typeof current === 'object' ? Reflect.get(current, key) : undefined,
    value,
  );
}

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

const COMMENTED_CONFIG = `// Team OpenCode settings
{
  "model": "local/model", // keep this model
  "mcp": {
    "other": { "type": "remote", "url": "https://mcp.example.test" },
  },
}
`;

Deno.test('OpenCode config merges JSONC with comments and trailing commas, keeping both', () => {
  const rendered = renderOpenCodeConfig(COMMENTED_CONFIG, NETSCRIPT_COMMAND);
  assertStringIncludes(rendered, '// Team OpenCode settings');
  assertStringIncludes(rendered, '// keep this model');
  const config = parseJsonc(rendered);
  assertEquals(at(config, 'model'), 'local/model');
  assertEquals(at(config, 'mcp', 'other'), { type: 'remote', url: 'https://mcp.example.test' });
  assertEquals(at(config, 'mcp', 'netscript', 'command'), NETSCRIPT_COMMAND);
  assertEquals(at(config, 'mcp', 'aspire', 'command'), ['aspire', 'agent', 'mcp']);
  assertEquals(at(config, 'lsp', 'deno'), {
    command: ['deno', 'lsp'],
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs'],
  });
  assertEquals(renderOpenCodeConfig(rendered, NETSCRIPT_COMMAND), rendered);
});

Deno.test('OpenCode config rejects malformed JSONC with a fix-then-rerun message', () => {
  assertThrows(
    () => renderOpenCodeConfig('{ "mcp": ', NETSCRIPT_COMMAND, 'opencode.json'),
    Error,
    'opencode.json is not valid JSONC',
  );
});

Deno.test('OpenCode plan writes the full wiring to opencode.jsonc when it exists', () => {
  const writes = planOpenCodeConfig(
    { path: 'opencode.json', text: undefined },
    { path: 'opencode.jsonc', text: COMMENTED_CONFIG },
    NETSCRIPT_COMMAND,
  );
  assertEquals(writes.map((write) => write.path), ['opencode.jsonc']);
  assertStringIncludes(writes[0].content, '// keep this model');
});

Deno.test('OpenCode plan refreshes a stale server declared in the overridden file', () => {
  const staleJson = '{"model":"x","mcp":{"netscript":{"type":"local","command":["stale"]}}}\n';
  const writes = planOpenCodeConfig(
    { path: 'opencode.json', text: staleJson },
    { path: 'opencode.jsonc', text: COMMENTED_CONFIG },
    NETSCRIPT_COMMAND,
  );
  assertEquals(writes.map((write) => write.path), ['opencode.jsonc', 'opencode.json']);
  const json = parseJsonc(writes[1].content);
  assertEquals(at(json, 'model'), 'x');
  assertEquals(at(json, 'mcp', 'netscript'), {
    type: 'local',
    enabled: true,
    timeout: OPENCODE_MCP_TIMEOUT_MS.netscript,
    command: NETSCRIPT_COMMAND,
  });
  assertEquals(
    at(json, 'mcp', 'aspire'),
    undefined,
    'undeclared servers stay in the effective file',
  );
  assertEquals(at(json, 'lsp'), undefined, 'lsp and formatter stay in the effective file');
});

Deno.test('OpenCode plan leaves an overridden file without NetScript servers untouched', () => {
  const unrelated = '{ "theme": "dark" }\n';
  const writes = planOpenCodeConfig(
    { path: 'opencode.json', text: unrelated },
    { path: 'opencode.jsonc', text: COMMENTED_CONFIG },
    NETSCRIPT_COMMAND,
  );
  assertEquals(writes[1], { path: 'opencode.json', content: unrelated });
});

Deno.test('OpenCode plan writes opencode.json when no JSONC file exists', () => {
  const writes = planOpenCodeConfig(
    { path: 'opencode.json', text: undefined },
    { path: 'opencode.jsonc', text: undefined },
    NETSCRIPT_COMMAND,
  );
  assertEquals(writes.map((write) => write.path), ['opencode.json']);
});
