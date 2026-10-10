import {
  applyEdits,
  type FormattingOptions,
  type JSONPath,
  modify,
  parse,
  type ParseError,
  printParseErrorCode,
} from 'jsonc-parser';

/** Project-root OpenCode configuration file created for the `opencode` agent host. */
export const OPENCODE_CONFIG_FILE = 'opencode.json';
/** Project-root OpenCode JSONC configuration; OpenCode lets it override `opencode.json`. */
export const OPENCODE_JSONC_CONFIG_FILE = 'opencode.jsonc';

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
const FORMATTING: FormattingOptions = { insertSpaces: true, tabSize: 2, eol: '\n' };

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

/** One OpenCode configuration file read from the project root. */
export interface OpenCodeConfigSource {
  readonly path: string;
  /** Current file text, or `undefined` when the file does not exist. */
  readonly text: string | undefined;
}

/** A planned OpenCode configuration write. */
export interface OpenCodeConfigWrite {
  readonly path: string;
  readonly content: string;
}

/**
 * Plan NetScript's OpenCode configuration writes for both project config files.
 *
 * The effective file (`opencode.jsonc` when it exists, otherwise `opencode.json`) receives the full
 * NetScript wiring. Because OpenCode merges both files, the other file only has an existing
 * `netscript` or `aspire` server declaration refreshed, so a stale declaration cannot win the merge.
 * `lsp` and `formatter` defaults are decided on the merged (effective) value, so an opt-out or a
 * `deno` entry inherited from `opencode.json` is never overridden from `opencode.jsonc`.
 * Both files are parsed as JSONC and edited in place, keeping comments and unrelated settings; a
 * malformed file aborts the plan before anything is written.
 */
export function planOpenCodeConfig(
  json: OpenCodeConfigSource,
  jsonc: OpenCodeConfigSource,
  netscriptCommand: readonly string[],
): readonly OpenCodeConfigWrite[] {
  const [primary, secondary] = jsonc.text === undefined ? [json, jsonc] : [jsonc, json];
  const inherited = secondary.text === undefined ? {} : parseConfig(secondary.text, secondary.path);
  const writes = [{
    path: primary.path,
    content: renderOpenCodeConfig(primary.text, netscriptCommand, primary.path, inherited),
  }];
  if (secondary.text !== undefined) {
    writes.push({
      path: secondary.path,
      content: refreshOpenCodeServers(secondary.text, netscriptCommand, secondary.path),
    });
  }
  return writes;
}

/**
 * Merge NetScript's OpenCode wiring into existing configuration text.
 *
 * The `netscript` and `aspire` MCP entries are always rewritten so the pinned CLI stays current.
 * `lsp.deno` and `formatter.deno` are added when absent from the effective configuration (this
 * file merged over `inherited`, the lower-precedence project file OpenCode also loads); an existing
 * `deno` entry and an explicit `false` opt-out in either file are preserved. Comments and every
 * unrelated key are kept.
 */
export function renderOpenCodeConfig(
  currentText: string | undefined,
  netscriptCommand: readonly string[],
  label = OPENCODE_CONFIG_FILE,
  inherited: Readonly<Record<string, unknown>> = {},
): string {
  if (currentText === undefined || currentText.trim() === '') {
    const config: Record<string, unknown> = {
      $schema: OPENCODE_SCHEMA_URL,
      mcp: mcpServers(netscriptCommand),
    };
    if (needsDenoEntry(undefined, inherited.lsp)) config.lsp = { deno: DENO_LSP_ENTRY };
    if (needsDenoEntry(undefined, inherited.formatter)) {
      config.formatter = { deno: DENO_FORMATTER_ENTRY };
    }
    return `${JSON.stringify(config, null, 2)}\n`;
  }
  const current = parseConfig(currentText, label);
  let text = setServers(currentText, current, netscriptCommand, false);
  if (current.$schema === undefined) text = edit(text, ['$schema'], OPENCODE_SCHEMA_URL);
  text = withDenoEntry(text, 'lsp', current.lsp, inherited.lsp, DENO_LSP_ENTRY);
  return withDenoEntry(
    text,
    'formatter',
    current.formatter,
    inherited.formatter,
    DENO_FORMATTER_ENTRY,
  );
}

/** Refresh only the `netscript` and `aspire` servers a file already declares. */
function refreshOpenCodeServers(
  currentText: string,
  netscriptCommand: readonly string[],
  label: string,
): string {
  return setServers(currentText, parseConfig(currentText, label), netscriptCommand, true);
}

function setServers(
  currentText: string,
  current: Record<string, unknown>,
  netscriptCommand: readonly string[],
  onlyDeclared: boolean,
): string {
  const servers = mcpServers(netscriptCommand);
  const declared = isRecord(current.mcp) ? current.mcp : {};
  let text = currentText;
  for (const name of ['netscript', 'aspire'] as const) {
    if (onlyDeclared && !(name in declared)) continue;
    text = edit(text, ['mcp', name], servers[name]);
  }
  return text;
}

function mcpServers(netscriptCommand: readonly string[]) {
  return {
    netscript: localServer(netscriptCommand, OPENCODE_MCP_TIMEOUT_MS.netscript),
    aspire: localServer(['aspire', 'agent', 'mcp'], OPENCODE_MCP_TIMEOUT_MS.aspire),
  };
}

function localServer(command: readonly string[], timeout: number) {
  return { type: 'local', enabled: true, timeout, command };
}

function withDenoEntry(
  text: string,
  key: 'lsp' | 'formatter',
  current: unknown,
  inherited: unknown,
  entry: object,
): string {
  if (!needsDenoEntry(current, inherited)) return text;
  return isRecord(current) ? edit(text, [key, 'deno'], entry) : edit(text, [key], { deno: entry });
}

/** Whether the effective `lsp`/`formatter` value lacks a `deno` entry and is not opted out. */
function needsDenoEntry(current: unknown, inherited: unknown): boolean {
  const effective = mergedSetting(inherited, current);
  if (effective === false) return false;
  return !(isRecord(effective) && effective.deno !== undefined);
}

/** OpenCode's project merge: objects merge key by key, any other higher-precedence value wins. */
function mergedSetting(lower: unknown, higher: unknown): unknown {
  if (higher === undefined) return lower;
  return isRecord(lower) && isRecord(higher) ? { ...lower, ...higher } : higher;
}

function edit(text: string, path: JSONPath, value: unknown): string {
  return applyEdits(text, modify(text, path, value, { formattingOptions: FORMATTING }));
}

function parseConfig(text: string, label: string): Record<string, unknown> {
  const errors: ParseError[] = [];
  const value: unknown = parse(text, errors, { allowTrailingComma: true });
  if (errors.length > 0) {
    const [first] = errors;
    throw new Error(
      `${label} is not valid JSONC (${
        printParseErrorCode(first.error)
      } at offset ${first.offset}); ` +
        'fix it, then re-run `netscript agent init`.',
    );
  }
  if (!isRecord(value)) throw new Error(`${label} must contain a JSON object.`);
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
