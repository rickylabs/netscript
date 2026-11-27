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
 * The same reservation leaks in one layer up when plugin runtime source falls
 * back to a literal loopback service URL (`options.baseUrl ??
 * 'http://localhost:4437'`): the plugin silently talks to whichever instance owns
 * that port instead of the one Aspire discovery names (#1893). Runtime source is
 * therefore held to the S5 policy too — no loopback URL with an embedded port in
 * plugin source, and none of the retired well-known service ports anywhere in
 * plugin or CLI source. {@link LINE_RULES} is that single policy; the S5 test
 * asserts it over the shipped tree rather than restating it.
 *
 * A deliberate exception may carry an inline `aspire-host-port-ok: <reason>`
 * marker; an empty reason is itself a failure.
 */
import { walk } from 'jsr:@std/fs@^1/walk';
import { relative } from 'jsr:@std/path@^1';
import { isTransientAspireScanPath } from './aspire-scan-scope.ts';

/** Roots scanned when none are given: everything the S5 runtime-literal policy covers. */
export const DEFAULT_ROOTS: readonly string[] = ['packages/cli/src', 'packages/cli/e2e', 'plugins'];
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

/** Plugin runtime source: every shipped plugin file the walk did not skip as test/generated. */
const PLUGIN_RUNTIME_SOURCE = /^plugins\/[^/]+\//;

/** Loopback URLs with an embedded port bypass the resource-reference contract. */
const LOOPBACK_PORT_URL = /https?:\/\/(?:localhost|127\.0\.0\.1):(?:\d+|\$\{[^}]*PORT[^}]*\})/;

/** Source whose service endpoints must come from Aspire discovery, not a retired default. */
const SERVICE_ENDPOINT_SOURCE = /^(?:plugins|packages\/cli\/(?:src|e2e))\//;

/**
 * The plugin API and streams defaults retired by #1740 (S5): workers..auth
 * `8091`-`8094`, durable streams `4437`, and a `127.0.0.1:80xx` probe.
 */
const RETIRED_SERVICE_PORT = /809[1-4]|4437|127\.0\.0\.1:80/;

/** A generator that bakes a numeric infrastructure host port into its output. */
const INFRASTRUCTURE_GENERATOR =
  'packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-infrastructure.ts';
const INFRASTRUCTURE_LITERAL_HOST_PORT = /\bport:\s*\d/;

/** Generator source and emitted infrastructure helpers share the executable argv contract. */
const INFRASTRUCTURE_EXECUTABLE_SOURCE =
  /(?:^|\/)(?:generate-register-infrastructure(?:\.ts|-\d+\.ts\.template)|register-infrastructure\.mts)$/;

/** A literal process bind port is a host reservation too, including the generator's default. */
const EXECUTABLE_LITERAL_ARGV_PORT =
  /(['"])--port\1\s*,\s*(['"`])(?:\d+|\$\{CACHE_DEFAULT_PORT\})\2/;
const EXECUTABLE_LITERAL_MESSAGE =
  'Infrastructure executable argv pins a host listen port. Add the endpoint expression ' +
  '`EndpointProperty.TargetPort` through `withArgsCallback` so Aspire allocates it per run.';

/** Files that compose resource entries for the scaffolded `appsettings.json`. */
const SCAFFOLD_ENTRY_FILES = [
  'packages/cli/src/kernel/application/scaffold/render-ts-apphost.ts',
  'packages/cli/src/kernel/templates/aspire/generate-appsettings.ts',
];

/**
 * One line-level policy: the source it governs, the line shape it rejects, and
 * the remedy reported for a hit. Rules are independent so a new defect class is
 * one more entry, not another branch in the scanner.
 */
export interface HostPortLineRule {
  /** Whether the rule governs a repo-relative, `/`-separated path. */
  readonly appliesTo: (path: string) => boolean;
  /** Whether one source line is a violation. */
  readonly matches: (text: string) => boolean;
  /** Remedy reported with each finding. */
  readonly message: string;
}

const ENTRY_PORT_MESSAGE =
  'Scaffold writes a literal host port into appsettings.json. Leave it unset so ' +
  'Aspire allocates the host and target ports.';

/**
 * The line policy shared by the gate and its S5 test. At most one finding per
 * line: the first rule that governs the path and matches the line wins.
 */
export const LINE_RULES: readonly HostPortLineRule[] = [
  {
    appliesTo: (path) => PLUGIN_RUNTIME_SOURCE.test(path),
    matches: (text) => LOOPBACK_PORT_URL.test(text),
    message: 'Plugin runtime source embeds a loopback service port. Resolve the URL through ' +
      'Aspire discovery (a resource reference, the allocated `ctx.port(resource)` value, or the ' +
      'injected service URL) so it never targets another instance.',
  },
  {
    appliesTo: (path) => SERVICE_ENDPOINT_SOURCE.test(path),
    matches: (text) => RETIRED_SERVICE_PORT.test(text),
    message: 'Source embeds a retired well-known service port. Resolve the endpoint through ' +
      'Aspire discovery instead of a fixed default.',
  },
  {
    appliesTo: (path) => path === INFRASTRUCTURE_GENERATOR,
    matches: (text) => INFRASTRUCTURE_LITERAL_HOST_PORT.test(text),
    message: 'Infrastructure generator embeds a host port. Emit `port` only from an explicit ' +
      'database/cache `Port` entry.',
  },
  {
    appliesTo: (path) => SCAFFOLD_ENTRY_FILES.includes(path),
    matches: (text) => ENTRY_PORT_KEY.test(text) && !CONDITIONAL_WRITE.test(text),
    message: ENTRY_PORT_MESSAGE,
  },
  {
    appliesTo: (path) => path.endsWith('/aspire/appsettings.json'),
    matches: (text) => JSON_PORT_KEY.test(text),
    message: ENTRY_PORT_MESSAGE,
  },
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
  scopePath: string = path,
): { findings: HostPortFinding[]; allowances: HostPortAllowance[] } {
  const findings: HostPortFinding[] = [];
  const allowances: HostPortAllowance[] = [];
  const normalizedPath = normalized(path);
  if (isTransientAspireScanPath(scopePath)) return { findings, allowances };
  const checksContribution = PLUGIN_CONTRIBUTION.test(normalizedPath);
  const lineRules = LINE_RULES.filter((rule) => rule.appliesTo(normalizedPath));

  const fullTextChecks = [
    { pattern: LITERAL_HOST_PORT, message: ENDPOINT_LITERAL_MESSAGE },
    ...(INFRASTRUCTURE_EXECUTABLE_SOURCE.test(normalizedPath)
      ? [{ pattern: EXECUTABLE_LITERAL_ARGV_PORT, message: EXECUTABLE_LITERAL_MESSAGE }]
      : []),
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

  if (lineRules.length === 0) return { findings, allowances };
  content.split('\n').forEach((text, index) => {
    const rule = lineRules.find((candidate) => candidate.matches(text));
    if (rule === undefined) return;

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

    findings.push({ path, line, text: text.trim(), message: rule.message });
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
  generatedProject: boolean = false,
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
      // An explicitly selected generated project is the subject of a functional gate,
      // even when its parent is scratch. Only state INSIDE that project is excluded.
      const scopePath = generatedProject ? normalized(relative(root, entry.path)) : path;
      if (isTransientAspireScanPath(scopePath)) continue;
      if (![...SOURCE_EXTENSIONS].some((suffix) => path.endsWith(suffix))) continue;
      if (path.includes('/node_modules/') || isTestPath(path) || isGeneratedSource(path)) continue;

      scannedFiles += 1;
      const result = scanContent(path, await Deno.readTextFile(entry.path), scopePath);
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
      '  deno run --allow-read check-aspire-host-ports.ts [root ...] [--pretty] [--generated-project]',
      '',
      'Roots default to packages/cli/src, packages/cli/e2e and plugins. Pass a generated project root to validate the scaffold',
      'that consumers actually received.',
      '--generated-project checks an explicitly selected scaffold, including one created under scratch; internal transient state is still excluded.',
    ].join('\n'));
    Deno.exit(0);
  }
  const pretty = Deno.args.includes('--pretty');
  const roots = Deno.args.filter((arg) => !arg.startsWith('-'));
  const generatedProject = Deno.args.includes('--generated-project');
  if (generatedProject && roots.length !== 1) {
    throw new Error('--generated-project requires one root');
  }
  const result = await scanHostPorts(roots.length > 0 ? roots : DEFAULT_ROOTS, generatedProject);

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
