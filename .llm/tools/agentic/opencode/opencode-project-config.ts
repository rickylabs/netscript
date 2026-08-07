/** Project-local MCP attachment for the pinned OpenCode host boundary. */

import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type Environment = Readonly<Record<string, string | undefined>>;

export interface OpenCodeLocalMcp {
  readonly type: 'local';
  readonly command: readonly string[];
  readonly cwd?: string;
  readonly environment?: Readonly<Record<string, string>>;
  readonly enabled?: boolean;
}

export interface OpenCodeProjectAttachment {
  readonly projectRoot: string;
  readonly sourcePath: string;
  readonly servers: Readonly<Record<string, OpenCodeLocalMcp>>;
}

interface FileInfo {
  readonly isFile: boolean;
  readonly isDirectory: boolean;
}

export interface OpenCodeProjectIo {
  readonly readTextFile: (path: string) => Promise<string>;
  readonly stat: (path: string) => Promise<FileInfo>;
}

export interface PrepareOpenCodeEnvironmentOptions {
  readonly cwd: string;
  readonly receiptPath?: string;
  readonly io?: OpenCodeProjectIo;
  readonly projectBoundary?: string;
}

const defaultIo: OpenCodeProjectIo = {
  readTextFile: Deno.readTextFile,
  stat: Deno.stat,
};

const BOUNDARY_MARKERS = ['.git', 'deno.json', 'deno.jsonc', 'package.json'] as const;
const BOUNDARY_PLUGIN_PATH = fileURLToPath(
  new URL('./opencode-boundary-plugin.ts', import.meta.url),
);

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object`);
  }
  return value as Record<string, unknown>;
}

function strings(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`${label} must be an array of strings`);
  }
  return [...value];
}

function stringMap(value: unknown, label: string): Record<string, string> {
  const source = record(value, label);
  const result: Record<string, string> = {};
  for (const [key, item] of Object.entries(source)) {
    if (typeof item !== 'string') throw new Error(`${label}.${key} must be a string`);
    result[key] = item;
  }
  return result;
}

async function exists(io: OpenCodeProjectIo, path: string, kind?: 'file' | 'directory') {
  try {
    const info = await io.stat(path);
    return kind === 'file' ? info.isFile : kind === 'directory' ? info.isDirectory : true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
}

/** Strictly translates generated Claude-style stdio declarations to OpenCode local MCP entries. */
export function translateGeneratedMcp(source: unknown): Record<string, OpenCodeLocalMcp> {
  const root = record(source, '.mcp.json');
  const declarations = record(root.mcpServers, '.mcp.json.mcpServers');
  const translated: Record<string, OpenCodeLocalMcp> = {};
  for (const name of Object.keys(declarations).sort()) {
    if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/.test(name)) {
      throw new Error('.mcp.json contains an unsafe server name');
    }
    const declaration = record(declarations[name], `.mcp.json.mcpServers.${name}`);
    if (declaration.type !== undefined && declaration.type !== 'stdio') {
      throw new Error(`.mcp.json.mcpServers.${name}.type must be stdio when present`);
    }
    if (typeof declaration.command !== 'string' || !declaration.command.trim()) {
      throw new Error(`.mcp.json.mcpServers.${name}.command must be a non-empty string`);
    }
    const args = declaration.args === undefined
      ? []
      : strings(declaration.args, `.mcp.json.mcpServers.${name}.args`);
    const cwd = declaration.cwd;
    if (cwd !== undefined && (typeof cwd !== 'string' || !cwd.trim())) {
      throw new Error(`.mcp.json.mcpServers.${name}.cwd must be a non-empty string`);
    }
    const environment = declaration.env === undefined
      ? undefined
      : stringMap(declaration.env, `.mcp.json.mcpServers.${name}.env`);
    if (declaration.disabled !== undefined && typeof declaration.disabled !== 'boolean') {
      throw new Error(`.mcp.json.mcpServers.${name}.disabled must be a boolean`);
    }
    translated[name] = {
      type: 'local',
      command: [declaration.command, ...args],
      ...(typeof cwd === 'string' ? { cwd } : {}),
      ...(environment ? { environment } : {}),
      ...(typeof declaration.disabled === 'boolean' ? { enabled: !declaration.disabled } : {}),
    };
  }
  if (Object.keys(translated).length === 0) {
    throw new Error('.mcp.json.mcpServers must contain at least one server');
  }
  return translated;
}

/** Finds the nearest declaration but never walks above the first project/git boundary. */
export async function discoverOpenCodeProjectAttachment(
  cwd: string,
  io: OpenCodeProjectIo = defaultIo,
  projectBoundary?: string,
): Promise<OpenCodeProjectAttachment | undefined> {
  let current = resolve(cwd);
  const boundary = projectBoundary ? resolve(projectBoundary) : undefined;
  while (true) {
    const sourcePath = join(current, '.mcp.json');
    if (await exists(io, sourcePath, 'file')) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(await io.readTextFile(sourcePath));
      } catch (error) {
        throw new Error(
          `.mcp.json is malformed JSON: ${error instanceof Error ? error.name : 'parse failure'}`,
        );
      }
      return {
        projectRoot: current,
        sourcePath,
        servers: translateGeneratedMcp(parsed),
      };
    }
    if (boundary && current === boundary) return undefined;
    const atBoundary = (await Promise.all(
      BOUNDARY_MARKERS.map((marker) => exists(io, join(current, marker))),
    )).some(Boolean);
    const parent = dirname(current);
    if (atBoundary || parent === current) return undefined;
    current = parent;
  }
}

function pluginSpecifier(): string {
  const normalized = BOUNDARY_PLUGIN_PATH.replaceAll('\\', '/');
  return `file://${normalized.startsWith('/') ? '' : '/'}${normalized}`;
}

/** Builds the owned inline overlay; unrelated provider/permission/model keys survive untouched. */
export function mergeOpenCodeInlineConfig(
  inlineSource: string | undefined,
  servers: Readonly<Record<string, OpenCodeLocalMcp>>,
): Record<string, unknown> {
  let config: Record<string, unknown> = {};
  if (inlineSource?.trim()) {
    try {
      config = record(JSON.parse(inlineSource), 'OPENCODE_CONFIG_CONTENT');
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`OPENCODE_CONFIG_CONTENT is malformed JSON: ${error.name}`);
      }
      throw error;
    }
  }
  const priorMcp = config.mcp === undefined
    ? {}
    : record(config.mcp, 'OPENCODE_CONFIG_CONTENT.mcp');
  const priorPlugins = config.plugin === undefined
    ? []
    : strings(config.plugin, 'OPENCODE_CONFIG_CONTENT.plugin');
  const plugin = pluginSpecifier();
  return {
    ...config,
    mcp: { ...priorMcp, ...servers },
    plugin: [...priorPlugins.filter((item) => item !== plugin), plugin],
  };
}

/** Attaches current-project MCP plus the dispatch guard without copying external config files. */
export async function prepareOpenCodeProjectEnvironment(
  env: Environment,
  options: PrepareOpenCodeEnvironmentOptions,
): Promise<Record<string, string>> {
  const child: Record<string, string> = {};
  for (const [name, value] of Object.entries(env)) if (value !== undefined) child[name] = value;
  const attachment = await discoverOpenCodeProjectAttachment(
    options.cwd,
    options.io ?? defaultIo,
    options.projectBoundary,
  );
  const inline = mergeOpenCodeInlineConfig(
    env.OPENCODE_CONFIG_CONTENT,
    attachment?.servers ?? {},
  );
  child.OPENCODE_CONFIG_CONTENT = JSON.stringify(inline);
  if (options.receiptPath) {
    child.NETSCRIPT_OPENCODE_RECEIPT = isAbsolute(options.receiptPath)
      ? options.receiptPath
      : resolve(options.cwd, options.receiptPath);
  }
  return child;
}
