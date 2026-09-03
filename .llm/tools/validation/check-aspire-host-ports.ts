#!/usr/bin/env -S deno run --allow-read
/**
 * Reject a scaffold default that pins an Aspire **host** port.
 *
 * Aspire's `port` option is the host (proxy) port, not the port the process
 * binds. A pinned host port is a machine-global reservation that
 * `aspire start --isolated` cannot randomise away, so two workspaces scaffolded
 * from the same template collide by construction and the dashboard can
 * advertise a URL owned by another instance (#952).
 *
 * The generators are allowed to *emit* a pin — a config entry that carries
 * `HostPort` opts into one deliberately. What is forbidden is a **scaffold
 * default** that pins one without the developer asking: a literal `Port:` or
 * `HostPort:` in the `appsettings.json` the scaffold writes, or a
 * `withHttpEndpoint({ port: <literal> ... })` emitted from a source position
 * that is not driven by config.
 *
 * A deliberate exception may carry an inline `aspire-host-port-ok: <reason>`
 * marker; an empty reason is itself a failure.
 */
import { walk } from 'jsr:@std/fs@^1/walk';
import { relative } from 'jsr:@std/path@^1';
import { isTransientAspireScanPath } from './aspire-scan-scope.ts';

const DEFAULT_ROOTS = ['packages/cli/src', 'plugins'] as const;
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.template', '.json']);
const ALLOW_MARKER = 'aspire-host-port-ok:';
const GENERATED_STATE_DIR = /[\\/](?:\.data|\.git|node_modules)(?:[\\/]|$)/;

/**
 * `withHttpEndpoint({ port: 8010 ... })` — a numeric literal in the host-port
 * slot. An interpolation (`${...}`) is config-driven and therefore fine.
 */
const LITERAL_HOST_PORT = /withHttpEndpoint\(\s*\{[^}]*\bport:\s*\d/;

/**
 * A scaffold writing a `Port:` / `HostPort:` key into a resource entry it
 * composes for `appsettings.json`.
 *
 * The pre-fix defect was `Port: appProxyPort` and `Port: options.servicePort` —
 * identifiers, not numeric literals — so matching only literals would look past
 * exactly the shape that shipped. Any *unconditional* write of the key is the
 * defect; a conditional opt-in
 * (`...(opts.hostPort ? { HostPort: opts.hostPort } : {})`) is the fix, and is
 * recognised by the ternary on the same line.
 */
const ENTRY_PORT_KEY = /\b(?:Host)?Port:\s*\S/;
const JSON_PORT_KEY = /"(?:Host)?Port"\s*:\s*\d/;
const CONDITIONAL_WRITE = /\?/;

/** Plugin contribution paths participate in AppHost composition. */
const PLUGIN_CONTRIBUTION = /^plugins\/[^/]+\/src\/aspire\/[^/]+-contribution\.ts$/;

/** A contribution supplying a fallback defeats Aspire's run-time allocation. */
const CONTRIBUTION_PORT_FALLBACK = /\bctx\.port\([^)]*,[^)]*\)/;

/** Loopback URLs with an embedded port bypass the resource-reference contract. */
const LOOPBACK_PORT_URL = /https?:\/\/(?:localhost|127\.0\.0\.1):(?:\d+|\$\{[^}]*PORT[^}]*\})/;

/** A generator that bakes a numeric infrastructure host port into its output. */
const INFRASTRUCTURE_GENERATOR =
  'packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-infrastructure.ts';
const INFRASTRUCTURE_LITERAL_HOST_PORT = /\bport:\s*\d/;

/** Files that compose resource entries for the scaffolded `appsettings.json`. */
const SCAFFOLD_ENTRY_FILES = [
  'packages/cli/src/kernel/application/scaffold/render-ts-apphost.ts',
  'packages/cli/src/kernel/templates/aspire/generate-appsettings.ts',
];

const ENDPOINT_LITERAL_MESSAGE =
  'Generated `withHttpEndpoint` pins a literal host port. Drive it from the ' +
  'resource entry (`HostPort`) so `aspire start --isolated` can allocate.';
const CONTRIBUTION_FALLBACK_MESSAGE =
  'Plugin contribution supplies a fallback port. Use `ctx.port(resource)` so Aspire allocates it.';

/** One place a scaffold default pins a host port. */
export interface HostPortFinding {
  readonly path: string;
  readonly line: number;
  readonly text: string;
  readonly message: string;
}

/** A pin that carries an explicit `aspire-host-port-ok:` justification. */
export interface HostPortAllowance {
  readonly path: string;
  readonly line: number;
  readonly reason: string;
}

/** Result of one scan over the configured roots. */
export interface HostPortScanResult {
  readonly scannedFiles: number;
  readonly findings: readonly HostPortFinding[];
  readonly allowances: readonly HostPortAllowance[];
}

function normalized(path: string): string {
  return path.replaceAll('\\', '/');
}

function isTestPath(path: string): boolean {
  const value = `/${normalized(path)}`;
  return value.includes('/tests/') || value.includes('_test.') || value.includes('/fixtures/');
}

function isGeneratedSource(path: string): boolean {
  return normalized(path).includes('.generated.');
}

function allowanceReason(line: string): string | undefined {
  const index = line.indexOf(ALLOW_MARKER);
  if (index === -1) return undefined;
  return line.slice(index + ALLOW_MARKER.length).trim();
}

function lineNumberAt(content: string, index: number): number {
  let line = 1;
  for (let position = 0; position < index; position += 1) {
    if (content[position] === '\n') line += 1;
  }
  return line;
}

function sourceLineAt(content: string, index: number): string {
  const start = content.lastIndexOf('\n', Math.max(0, index - 1)) + 1;
  const nextBreak = content.indexOf('\n', index);
  return content.slice(start, nextBreak === -1 ? content.length : nextBreak);
}

/**
 * Scans one file's content for scaffold defaults that pin an Aspire host port.
 *
 * @param path - Repo-relative path, used for reporting and rule selection
 * @param content - Full file text
 */
export function scanContent(
  path: string,
  content: string,
): { findings: HostPortFinding[]; allowances: HostPortAllowance[] } {
  const findings: HostPortFinding[] = [];
  const allowances: HostPortAllowance[] = [];
  const normalizedPath = normalized(path);
  if (isTransientAspireScanPath(normalizedPath)) return { findings, allowances };
  const checksEntryPorts = SCAFFOLD_ENTRY_FILES.includes(normalizedPath);
  const checksGeneratedJson = normalizedPath.endsWith('/aspire/appsettings.json');
  const checksContribution = PLUGIN_CONTRIBUTION.test(normalizedPath);
  const checksInfrastructureGenerator = normalizedPath === INFRASTRUCTURE_GENERATOR;

  const fullTextChecks = [
    { pattern: LITERAL_HOST_PORT, message: ENDPOINT_LITERAL_MESSAGE },
    ...(checksContribution
      ? [{ pattern: CONTRIBUTION_PORT_FALLBACK, message: CONTRIBUTION_FALLBACK_MESSAGE }]
      : []),
  ];

  for (const check of fullTextChecks) {
    const pattern = new RegExp(check.pattern.source, `${check.pattern.flags}g`);
    for (const match of content.matchAll(pattern)) {
      const index = match.index ?? 0;
      const text = sourceLineAt(content, index);
      const line = lineNumberAt(content, index);
      const reason = allowanceReason(text);
      if (reason !== undefined) {
        if (reason.length > 0) {
          allowances.push({ path, line, reason });
          continue;
        }
        findings.push({
          path,
          line,
          text: text.trim(),
          message: `\`${ALLOW_MARKER}\` marker has an empty reason.`,
        });
        continue;
      }
      findings.push({ path, line, text: text.trim(), message: check.message });
    }
  }

  content.split('\n').forEach((text, index) => {
    const hitsEntry = checksEntryPorts &&
      ENTRY_PORT_KEY.test(text) &&
      !CONDITIONAL_WRITE.test(text);
    const hitsGeneratedJson = checksGeneratedJson && JSON_PORT_KEY.test(text);
    const hitsContributionUrl = checksContribution && LOOPBACK_PORT_URL.test(text);
    const hitsInfrastructureLiteral = checksInfrastructureGenerator &&
      INFRASTRUCTURE_LITERAL_HOST_PORT.test(text);
    if (
      !hitsEntry &&
      !hitsGeneratedJson &&
      !hitsContributionUrl &&
      !hitsInfrastructureLiteral
    ) return;

    const line = index + 1;
    const reason = allowanceReason(text);
    if (reason !== undefined) {
      if (reason.length > 0) {
        allowances.push({ path, line, reason });
        return;
      }
      findings.push({
        path,
        line,
        text: text.trim(),
        message: `\`${ALLOW_MARKER}\` marker has an empty reason.`,
      });
      return;
    }

    findings.push({
      path,
      line,
      text: text.trim(),
      message: hitsContributionUrl
        ? 'Plugin contribution embeds a loopback port. Use a resource reference or the allocated `ctx.port(resource)` value.'
        : hitsInfrastructureLiteral
        ? 'Infrastructure generator embeds a host port. Emit `port` only from an explicit database/cache `Port` entry.'
        : 'Scaffold writes a literal host port into appsettings.json. Leave it unset so ' +
          'Aspire allocates the host and target ports.',
    });
  });

  return { findings, allowances };
}

/**
 * Walks the given roots and reports every scaffold default that pins a host port.
 *
 * @param roots - Repo-relative directories to scan
 */
export async function scanHostPorts(
  roots: readonly string[] = DEFAULT_ROOTS,
): Promise<HostPortScanResult> {
  const findings: HostPortFinding[] = [];
  const allowances: HostPortAllowance[] = [];
  let scannedFiles = 0;

  for (const root of roots) {
    for await (
      const entry of walk(root, {
        includeDirs: false,
        skip: [GENERATED_STATE_DIR],
      })
    ) {
      const path = normalized(relative('.', entry.path));
      if (isTransientAspireScanPath(path)) continue;
      if (![...SOURCE_EXTENSIONS].some((suffix) => path.endsWith(suffix))) continue;
      if (path.includes('/node_modules/') || isTestPath(path) || isGeneratedSource(path)) continue;

      scannedFiles += 1;
      const result = scanContent(path, await Deno.readTextFile(entry.path));
      findings.push(...result.findings);
      allowances.push(...result.allowances);
    }
  }

  return { scannedFiles, findings, allowances };
}

if (import.meta.main) {
  if (Deno.args.includes('--help') || Deno.args.includes('-h')) {
    console.log([
      'Usage:',
      '  deno run --allow-read check-aspire-host-ports.ts [root ...] [--pretty]',
      '',
      'Roots default to packages/cli/src and plugins. Pass a generated project root to validate the scaffold',
      'that consumers actually received.',
    ].join('\n'));
    Deno.exit(0);
  }
  const pretty = Deno.args.includes('--pretty');
  const roots = Deno.args.filter((arg) => !arg.startsWith('-'));
  const result = await scanHostPorts(roots.length > 0 ? roots : DEFAULT_ROOTS);

  if (pretty) {
    console.log(`Scanned ${result.scannedFiles} files.`);
    for (const allowance of result.allowances) {
      console.log(`  allowed  ${allowance.path}:${allowance.line} — ${allowance.reason}`);
    }
    for (const finding of result.findings) {
      console.log(`  FAIL     ${finding.path}:${finding.line} — ${finding.message}`);
      console.log(`           ${finding.text}`);
    }
    console.log(result.findings.length === 0 ? 'OK — no pinned host ports.' : 'FAILED');
  } else {
    console.log(JSON.stringify(result, null, 2));
  }

  if (result.findings.length > 0) Deno.exit(1);
}
