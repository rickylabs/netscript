/** Fail-closed MCP attachment proof for measured OpenCode runs. */

import { appendFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { LOOPBACK_HOST, LOOPBACK_HTTP_PROTOCOL } from '../config/endpoints.ts';
import { OPENCODE_TOOL } from '../config/versions.ts';
import { normalizeTaskArguments } from '../lib/task-arguments.ts';
import { environmentWithOpenCodeCredential } from '../lib/provider-credential.ts';
import type { RouteAvailability } from '../runtime/routing-policy.ts';
import {
  discoverOpenCodeProjectAttachment,
  type Environment,
  prepareOpenCodeProjectEnvironment,
} from './opencode-project-config.ts';

export interface OpenCodePreflightReceipt {
  readonly kind: 'mcp_preflight';
  readonly expectedServerCount: number;
  readonly connectedServerCount: number;
  readonly availableToolCount: number;
  readonly expectedToolCount: number;
  readonly mcpCallCount: 1;
  readonly documentationLookup: 'passed';
}

if (import.meta.main) {
  try {
    const args = normalizeTaskArguments(Deno.args);
    if (args.includes('--help')) {
      await Deno.stdout.write(
        new TextEncoder().encode(
          'copilot-preflight --model <exact-connector-id> [--variant <effort>] [--cwd <worktree>]\nRead-only model catalog; never runs inference.\n',
        ),
      );
    } else {
      const flags = new Map<string, string>();
      for (let i = 0; i < args.length; i += 2) {
        const flag = args[i];
        const value = args[i + 1];
        if (!['--model', '--variant', '--cwd'].includes(flag) || !value || flags.has(flag)) {
          throw new Error('invalid preflight arguments');
        }
        flags.set(flag, value);
      }
      const receipt = await preflightCopilotCatalog(flags.get('--model') ?? '', {
        cwd: flags.get('--cwd') ?? Deno.cwd(),
        variant: flags.get('--variant') ?? 'provider_default',
      });
      await Deno.stdout.write(new TextEncoder().encode(JSON.stringify(receipt) + '\n'));
      if (!receipt.present || !receipt.variantPresent) Deno.exit(2);
    }
  } catch {
    await Deno.stderr.write(new TextEncoder().encode('Copilot catalog preflight failed\n'));
    Deno.exit(2);
  }
}

export interface OpenCodePreflightOptions {
  readonly cwd: string;
  readonly requiredServers: readonly string[];
  readonly model: string;
  readonly variant: string;
  readonly env: Environment;
  readonly receiptPath: string;
  readonly startupTimeoutMs?: number;
  readonly lookupTimeoutMs?: number;
}

interface McpStatus {
  readonly status?: unknown;
}

/** Exact connector catalog evidence, never a credential or inferred model slug. */
export interface CopilotCatalogAttestation {
  readonly model: string;
  readonly present: boolean;
  readonly variant: string;
  readonly variantPresent: boolean;
  readonly capturedAt: string;
}

function catalogModelMetadata(model: string, catalog: string): unknown {
  const normalized = catalog.replaceAll('\r\n', '\n');
  const marker = `${model}\n`;
  const from = normalized.indexOf(marker);
  if (from < 0) return undefined;
  const metadataFrom = from + marker.length;
  const next = normalized.indexOf('\ngithub-copilot/', metadataFrom);
  const source = normalized.slice(metadataFrom, next < 0 ? undefined : next).trim();
  if (!source.startsWith('{')) return undefined;
  try {
    return JSON.parse(source);
  } catch {
    return undefined;
  }
}

/** Matches an explicit model against complete catalog lines without substring acceptance. */
export function attestCopilotCatalog(
  model: string,
  catalog: string,
  capturedAt: string,
  variant = 'provider_default',
): CopilotCatalogAttestation {
  if (!/^github-copilot\/[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(model)) {
    throw new Error('Copilot catalog requires an explicit connector model');
  }
  if (!Number.isFinite(Date.parse(capturedAt))) throw new Error('invalid catalog timestamp');
  const present = catalog.split(/\r?\n/).some((line) => line.trim() === model);
  const metadata = variant === 'provider_default'
    ? undefined
    : catalogModelMetadata(model, catalog);
  const variants = metadata && typeof metadata === 'object' && !Array.isArray(metadata)
    ? (metadata as { variants?: unknown }).variants
    : undefined;
  const variantPresent = present && (variant === 'provider_default' ||
    (!!variants && typeof variants === 'object' && !Array.isArray(variants) &&
      Object.hasOwn(variants, variant)));
  return {
    model,
    present,
    variant,
    variantPresent,
    capturedAt,
  };
}

/** Feeds absent catalog capability into the existing route fallback mechanism. */
export function copilotCatalogAvailability(
  attestation: CopilotCatalogAttestation,
): RouteAvailability {
  return {
    unavailableTransports: attestation.present && attestation.variantPresent
      ? []
      : ['github_copilot'],
  };
}

/** Reads OpenCode's catalog without starting a model turn or inspecting its OAuth store. */
export async function preflightCopilotCatalog(
  model: string,
  options: {
    readonly cwd: string;
    readonly variant?: string;
    readonly env?: Environment;
    readonly now?: () => string;
    readonly listModels?: (binary: string, options: Deno.CommandOptions) => Promise<string>;
  },
): Promise<CopilotCatalogAttestation> {
  const capturedAt = (options.now ?? (() => new Date().toISOString()))();
  const variant = options.variant ?? 'provider_default';
  attestCopilotCatalog(model, '', capturedAt, variant);
  const env = await environmentWithOpenCodeCredential(model, options.env ?? Deno.env.toObject());
  const binary = resolveBinary(env);
  const command: Deno.CommandOptions = {
    args: [
      'models',
      'github-copilot',
      ...(variant === 'provider_default' ? [] : ['--verbose']),
    ],
    cwd: options.cwd,
    env,
    clearEnv: true,
    stdin: 'null',
    stdout: 'piped',
    stderr: 'null',
    signal: AbortSignal.timeout(15_000),
  };
  let catalog: string;
  try {
    if (options.listModels) catalog = await options.listModels(binary, command);
    else {
      const result = await new Deno.Command(binary, command).output();
      if (!result.success) throw new Error('catalog unavailable');
      catalog = new TextDecoder().decode(result.stdout);
    }
  } catch {
    throw new Error('Copilot catalog unavailable; mark github_copilot transport unavailable');
  }
  return attestCopilotCatalog(model, catalog, capturedAt, variant);
}

function safeServerName(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/.test(value);
}

function toolPrefix(server: string): string {
  return `${server.replace(/[^A-Za-z0-9_-]/g, '_')}_`;
}

function resolveBinary(env: Environment): string {
  return env.OPENCODE_BIN?.trim() || OPENCODE_TOOL.binary;
}

/** Validates declared server attachment without retaining arbitrary host output. */
export function validateOpenCodeMcpAttachment(
  requiredServers: readonly string[],
  statuses: unknown,
  toolIds: unknown,
): Omit<OpenCodePreflightReceipt, 'kind' | 'mcpCallCount' | 'documentationLookup'> & {
  readonly documentationTool: string;
} {
  if (requiredServers.length === 0 || requiredServers.some((name) => !safeServerName(name))) {
    throw new Error('MCP preflight requires one or more safe server identities');
  }
  if (!statuses || typeof statuses !== 'object' || Array.isArray(statuses)) {
    throw new Error('MCP preflight failed: invalid_status_shape');
  }
  if (!Array.isArray(toolIds) || toolIds.some((id) => typeof id !== 'string')) {
    throw new Error('MCP preflight failed: invalid_tool_shape');
  }
  const statusMap = statuses as Record<string, McpStatus>;
  const connected = requiredServers.filter((name) => statusMap[name]?.status === 'connected');
  if (connected.length !== requiredServers.length) {
    throw new Error('MCP preflight failed: required_server_not_connected');
  }
  const ids = toolIds as string[];
  const netscript = requiredServers.find((name) => name === 'netscript') ?? requiredServers[0];
  const documentationTool = `${toolPrefix(netscript)}search_docs`;
  return {
    expectedServerCount: requiredServers.length,
    connectedServerCount: connected.length,
    availableToolCount: ids.length,
    expectedToolCount: requiredServers.length,
    documentationTool,
  };
}

function reserveLoopbackPort(): number {
  const listener = Deno.listen({ hostname: LOOPBACK_HOST, port: 0 });
  const port = (listener.addr as Deno.NetAddr).port;
  listener.close();
  return port;
}

async function fetchJson(url: URL, timeoutMs = 1_000): Promise<unknown> {
  const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) throw new Error('MCP preflight failed: host_request_failed');
  return await response.json();
}

async function waitForHost(
  base: URL,
  cwd: string,
  requiredServers: readonly string[],
  timeoutMs: number,
): Promise<unknown> {
  const deadline = Date.now() + timeoutMs;
  const status = new URL('/mcp', base);
  status.searchParams.set('directory', cwd);
  while (Date.now() < deadline) {
    try {
      const value = await fetchJson(status);
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const statuses = value as Record<string, McpStatus>;
        if (requiredServers.every((name) => statuses[name]?.status === 'connected')) return value;
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error('MCP preflight failed: required_server_not_connected');
}

async function appendPreflightReceipt(path: string, receipt: OpenCodePreflightReceipt) {
  await appendFile(path, `${JSON.stringify(receipt)}\n`, { encoding: 'utf8' });
}

async function runDocumentationLookup(
  binary: string,
  cwd: string,
  env: Record<string, string>,
  documentationTool: string,
  model: string,
  variant: string,
  receiptPath: string,
  timeoutMs: number,
): Promise<void> {
  let priorReceiptCount = 0;
  try {
    priorReceiptCount =
      (await Deno.readTextFile(receiptPath)).split(/\r?\n/).filter(Boolean).length;
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
  const child = new Deno.Command(binary, {
    args: [
      'run',
      `Call ${documentationTool} exactly once with a harmless query about NetScript project configuration. After the tool succeeds, reply only PREFLIGHT_OK.`,
      '--model',
      model,
      '--variant',
      variant,
      '--format',
      'json',
    ],
    cwd,
    env,
    stdin: 'null',
    stdout: 'null',
    stderr: 'null',
  }).spawn();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const result = await Promise.race([
    child.status.then((status) => ({ kind: 'status' as const, status })),
    new Promise<{ kind: 'timeout' }>((resolve) => {
      timeout = setTimeout(() => resolve({ kind: 'timeout' }), timeoutMs);
    }),
  ]);
  if (timeout !== undefined) clearTimeout(timeout);
  if (result.kind === 'timeout') {
    try {
      child.kill('SIGTERM');
    } catch {
      // The owned lookup may have exited at the deadline.
    }
    const force = setTimeout(() => {
      try {
        child.kill('SIGKILL');
      } catch {
        // The owned lookup exited during its grace period.
      }
    }, 1_000);
    await child.status;
    clearTimeout(force);
    throw new Error('MCP preflight failed: documentation_lookup_timeout');
  }
  if (!result.status.success) {
    throw new Error('MCP preflight failed: documentation_lookup_failed');
  }
  let receiptSource = '';
  try {
    receiptSource = await Deno.readTextFile(receiptPath);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
  const receipts = receiptSource.split(/\r?\n/).filter(Boolean).slice(priorReceiptCount);
  const calls = receipts.flatMap((line) => {
    try {
      const value = JSON.parse(line) as Record<string, unknown>;
      return value.kind === 'discovery' && value.source === 'mcp' &&
          value.toolId === documentationTool
        ? [value]
        : [];
    } catch {
      throw new Error('MCP preflight failed: invalid_receipt');
    }
  });
  if (calls.length !== 1) throw new Error('MCP preflight failed: documentation_call_not_proved');
}

async function terminateOwnedChild(child: Deno.ChildProcess): Promise<void> {
  try {
    child.kill('SIGTERM');
  } catch {
    await child.status;
    return;
  }
  const exited = await Promise.race([
    child.status.then(() => true),
    new Promise<false>((resolve) => setTimeout(() => resolve(false), 1_000)),
  ]);
  if (exited) return;
  try {
    child.kill('SIGKILL');
  } catch {
    // The owned host exited during its grace period.
  }
  await child.status;
}

/** Starts only its owned loopback host and always terminates that exact child. */
export async function preflightOpenCodeMcp(
  options: OpenCodePreflightOptions,
): Promise<OpenCodePreflightReceipt> {
  const cwd = resolve(options.cwd);
  const receiptPath = resolve(cwd, options.receiptPath);
  await Deno.mkdir(dirname(receiptPath), { recursive: true });
  const attachment = await discoverOpenCodeProjectAttachment(cwd);
  if (!attachment) throw new Error('MCP preflight failed: project_declaration_missing');
  for (const required of options.requiredServers) {
    if (!(required in attachment.servers)) {
      throw new Error('MCP preflight failed: required_declaration_missing');
    }
  }
  const env = await prepareOpenCodeProjectEnvironment(options.env, {
    cwd,
    receiptPath: options.receiptPath,
  });
  const binary = resolveBinary(env);
  const port = await reserveLoopbackPort();
  const child = new Deno.Command(binary, {
    args: ['serve', '--hostname', LOOPBACK_HOST, '--port', String(port)],
    cwd,
    env,
    stdin: 'null',
    stdout: 'null',
    stderr: 'null',
  }).spawn();
  try {
    const base = new URL(`${LOOPBACK_HTTP_PROTOCOL}//${LOOPBACK_HOST}:${port}`);
    const statuses = await waitForHost(
      base,
      cwd,
      options.requiredServers,
      options.startupTimeoutMs ?? 15_000,
    );
    const toolUrl = new URL('/experimental/tool/ids', base);
    toolUrl.searchParams.set('directory', cwd);
    const toolIds = await fetchJson(toolUrl, 5_000);
    const validated = validateOpenCodeMcpAttachment(options.requiredServers, statuses, toolIds);
    await runDocumentationLookup(
      binary,
      cwd,
      env,
      validated.documentationTool,
      options.model,
      options.variant,
      receiptPath,
      options.lookupTimeoutMs ?? 120_000,
    );
    const { documentationTool: _documentationTool, ...counts } = validated;
    const receipt: OpenCodePreflightReceipt = {
      kind: 'mcp_preflight',
      ...counts,
      mcpCallCount: 1,
      documentationLookup: 'passed',
    };
    await appendPreflightReceipt(receiptPath, receipt);
    return receipt;
  } finally {
    await terminateOwnedChild(child);
  }
}
