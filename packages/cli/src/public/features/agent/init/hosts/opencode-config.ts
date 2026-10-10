/** Project-root OpenCode configuration file written for the `opencode` agent host. */
export const OPENCODE_CONFIG_FILE = 'opencode.json';

/**
 * Per-server MCP request timeouts in milliseconds. OpenCode's 5 s default does not cover a
 * cold-cache `deno run jsr:@netscript/cli@<version> agent mcp`, so the server would validate and
 * still never connect on the first run after scaffolding.
 */
export const OPENCODE_MCP_TIMEOUT_MS = {
  netscript: 180_000,
  aspire: 120_000,
} as const;

const OPENCODE_SCHEMA_URL = 'https://opencode.ai/config.json';

/** OpenCode only starts language servers it is told about; omitting `lsp` disables them all. */
const DENO_LSP_ENTRY = {
  command: ['deno', 'lsp'],
  extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs'],
} as const;

/** OpenCode ships no Deno formatter, so `formatter: true` alone would not format the project. */
const DENO_FORMATTER_ENTRY = {
  command: ['deno', 'fmt', '$FILE'],
  extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.jsonc', '.md'],
} as const;

/**
 * Merge NetScript's OpenCode wiring into existing `opencode.json` text.
 *
 * The `netscript` and `aspire` MCP entries are always rewritten so the pinned CLI stays current.
 * `lsp.deno` and `formatter.deno` are added when absent; an existing `deno` entry and an explicit
 * `false` opt-out are preserved. Every unrelated key is kept.
 */
export function renderOpenCodeConfig(
  currentText: string | undefined,
  netscriptCommand: readonly string[],
): string {
  const current = currentText ? asRecord(JSON.parse(currentText)) : {};
  const config = {
    $schema: OPENCODE_SCHEMA_URL,
    ...current,
    mcp: {
      ...asRecord(current.mcp),
      netscript: localServer(netscriptCommand, OPENCODE_MCP_TIMEOUT_MS.netscript),
      aspire: localServer(['aspire', 'agent', 'mcp'], OPENCODE_MCP_TIMEOUT_MS.aspire),
    },
    lsp: withDenoEntry(current.lsp, DENO_LSP_ENTRY),
    formatter: withDenoEntry(current.formatter, DENO_FORMATTER_ENTRY),
  };
  return `${JSON.stringify(config, null, 2)}\n`;
}

function localServer(command: readonly string[], timeout: number) {
  return { type: 'local', enabled: true, timeout, command };
}

function withDenoEntry(current: unknown, entry: object): unknown {
  if (current === false) return false;
  const existing = asRecord(current);
  return { ...existing, deno: existing.deno ?? entry };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}
