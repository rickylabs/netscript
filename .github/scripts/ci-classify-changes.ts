/**
 * CI change classifier — the single decision point for every expensive job.
 *
 * Emits a capability vector, consumed by `.github/workflows/e2e-cli.yml`,
 * `.github/workflows/ci.yml`, and `.github/workflows/surface-diff.yml`
 * (#1152; paths are the mechanism, labels are the override):
 *
 *   - `run_static`         -> scaffold-static (any scaffold-impacting change)
 *   - `run_runtime_sqlite` -> scaffold-runtime-sqlite (the cheap runtime tier,
 *                             reached when static runs unless e2e is skipped)
 *   - `run_runtime`        -> scaffold-runtime; docker is the exception tier,
 *                             reached on the docker signal (v1: deliberately wide)
 *   - `needs_deno`    -> check-test / quality: any change the Deno toolchain
 *                        checks or tests (root `deno test` discovers
 *                        `.llm/tools` and `.github/scripts` tests, so code
 *                        files there count even though the dirs are docs-ish)
 *   - `needs_docker`  -> the path-pure docker signal behind `run_runtime`
 *   - `needs_desktop` -> desktop-native-linux: the `.deb`/updater surface
 *                        lives entirely under `packages/cli/`
 *   - `needs_docs`    -> quality's docs lane: `docs/**` or Markdown outside
 *                        the agent-context prefixes (`.llm/`, `.agents/`,
 *                        `.claude/`)
 *   - `needs_surface` -> surface-diff (mirrors its old `paths: packages/**`)
 *
 * Precision rules (#1122): only the tier-defining workflows (`e2e-cli.yml`,
 * `ci.yml`) escalate the scaffold tiers — `release-canary.yml`, `pages.yml`
 * and peers cannot affect scaffold behaviour by construction and set only
 * `needs_deno`. A root `deno.json` edit that changes ONLY the `tasks` key is
 * a script alias, not a toolchain change: it sets `needs_deno` only. Any
 * other root config change — and any unparseable or unavailable content —
 * escalates everything.
 *
 * Label precedence (highest first) — the set is frozen at exactly three:
 *   1. `ci:full`          -> force EVERY output true.
 *   2. `ci:skip-scaffold` -> skip `scaffold-static`.
 *      `ci:skip-e2e`      -> skip both runtime tiers.
 *      (Skip labels keep their scaffold-tier-only semantics; they never
 *      widen to the required trio or desktop.)
 *   3. otherwise          -> paths decide.
 *
 * SAFETY PROPERTY (unit-tested): an unrecognised path forces EVERY output
 * true. The classifier NEVER skips because it failed to classify. Non-PR
 * events (no diff) and empty diffs also force everything.
 *
 * This module is pure (`decide`) plus a thin CLI. The CLI reads inputs from
 * env and appends job outputs to `$GITHUB_OUTPUT`. It is exercised by
 * `ci-classify-changes.test.ts` and run as a self-check step in each
 * consuming workflow's classify job.
 */

/** Workflows that DEFINE the scaffold tiers; editing them escalates them. */
const TIER_DEFINING_WORKFLOWS = new Set([
  '.github/workflows/e2e-cli.yml',
  '.github/workflows/ci.yml',
]);

/** Prefixes whose non-Markdown contents are shipping code. */
const CODE_PREFIXES = [
  'packages/',
  'plugins/',
  'apps/',
] as const;

/** Directory prefixes whose contents are docs / agent-context only. */
const DOCS_PREFIXES = [
  'docs/',
  '.llm/',
  '.agents/',
  '.claude/',
] as const;

/** Agent-context prefixes: Markdown here is invisible to the docs surface. */
const AGENT_CONTEXT_PREFIXES = [
  '.llm/',
  '.agents/',
  '.claude/',
] as const;

/** Extensions that are docs-only wherever they live (subject to critical paths). */
const DOCS_EXTENSIONS = ['.md', '.mdx'] as const;

/**
 * Extensions the Deno toolchain checks/tests even under docs prefixes
 * (root `deno test` discovers `.llm/tools/**` and `.github/scripts/**`).
 */
const CODE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'] as const;

/** One capability contribution per changed path; OR-ed across the diff. */
export interface Capabilities {
  scaffold: boolean;
  docker: boolean;
  desktop: boolean;
  deno: boolean;
  docs: boolean;
  surface: boolean;
}

const NONE: Capabilities = {
  scaffold: false,
  docker: false,
  desktop: false,
  deno: false,
  docs: false,
  surface: false,
};

const ALL: Capabilities = {
  scaffold: true,
  docker: true,
  desktop: true,
  deno: true,
  docs: true,
  surface: true,
};

/** Normalise a git path: strip a leading `./`, collapse backslashes. */
function normalise(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\//, '');
}

function hasExtension(path: string, extensions: readonly string[]): boolean {
  return extensions.some((ext) => path.endsWith(ext));
}

function isDenoConfigBase(path: string): boolean {
  const base = path.slice(path.lastIndexOf('/') + 1);
  return base === 'deno.json' || base === 'deno.jsonc' || base === 'deno.lock';
}

export type DenoConfigChange = 'tasks-only' | 'toolchain';

/**
 * Structural discrimination for the ROOT `deno.json`/`deno.jsonc` (#1122):
 * a diff that touches ONLY the `tasks` key is a script alias, not a
 * toolchain change. Anything else — a differing top-level key, missing or
 * unparseable content, a non-object document — is `toolchain`. Fails toward
 * running.
 */
export function classifyDenoConfigChange(
  oldText: string | undefined,
  newText: string | undefined,
): DenoConfigChange {
  if (oldText === undefined || newText === undefined) return 'toolchain';
  if (oldText.trim().length === 0 || newText.trim().length === 0) return 'toolchain';
  let oldValue: unknown;
  let newValue: unknown;
  try {
    oldValue = JSON.parse(oldText);
    newValue = JSON.parse(newText);
  } catch {
    return 'toolchain';
  }
  if (!isPlainObject(oldValue) || !isPlainObject(newValue)) return 'toolchain';
  const keys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)]);
  for (const key of keys) {
    if (key === 'tasks') continue;
    if (JSON.stringify(oldValue[key]) !== JSON.stringify(newValue[key])) return 'toolchain';
  }
  return 'tasks-only';
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Capability contribution of a single changed path. `rootDenoConfig` is the
 * verdict for the root `deno.json`/`deno.jsonc`, when that file is in the
 * diff. Precedence: root config -> nested config/lock -> tier workflow ->
 * other workflow -> Markdown -> code prefixes -> docs prefixes ->
 * unrecognised (which forces EVERYTHING).
 */
export function classifyPath(
  rawPath: string,
  rootDenoConfig: DenoConfigChange = 'toolchain',
): Capabilities {
  const path = normalise(rawPath);
  if (path === 'deno.json' || path === 'deno.jsonc') {
    return rootDenoConfig === 'tasks-only'
      ? { ...NONE, deno: true }
      : { ...NONE, scaffold: true, docker: true, desktop: true, deno: true };
  }
  if (isDenoConfigBase(path)) {
    // Any other deno.json*/deno.lock (root lock, nested workspace roots):
    // toolchain surface, always escalates.
    return {
      ...NONE,
      scaffold: true,
      docker: true,
      desktop: true,
      deno: true,
      surface: path.startsWith('packages/'),
    };
  }
  if (TIER_DEFINING_WORKFLOWS.has(path)) {
    return { ...NONE, scaffold: true, docker: true, desktop: true, deno: true };
  }
  if (path.startsWith('.github/workflows/')) {
    // Non-tier workflows cannot affect scaffold behaviour by construction
    // (#1122), but workflow content is exercised by repo tests
    // (e.g. `.llm/tools/release/release-canary-workflow_test.ts`).
    return { ...NONE, deno: true };
  }
  if (hasExtension(path, DOCS_EXTENSIONS)) {
    return {
      ...NONE,
      docs: !AGENT_CONTEXT_PREFIXES.some((prefix) => path.startsWith(prefix)),
      surface: path.startsWith('packages/'),
    };
  }
  if (CODE_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return {
      ...NONE,
      scaffold: true,
      docker: true,
      deno: true,
      desktop: path.startsWith('packages/cli/'),
      surface: path.startsWith('packages/'),
    };
  }
  if (DOCS_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return {
      ...NONE,
      docs: path.startsWith('docs/'),
      // Root `deno test`/task gates execute code under `.llm/tools` etc.
      deno: hasExtension(path, CODE_EXTENSIONS),
    };
  }
  // Unrecognised path: force EVERY gate. NEVER skip on a failed classification.
  return { ...ALL };
}

/** Does this path force the scaffold tiers (back-compat helper for tests)? */
export function isImpacting(rawPath: string, rootDenoConfig?: DenoConfigChange): boolean {
  return classifyPath(rawPath, rootDenoConfig).scaffold;
}

/**
 * True iff `path` contributes to neither the scaffold tiers nor the Deno
 * toolchain lane — the informational docs-only notion behind `docs_only`.
 */
export function isDocsOnlyPath(path: string, rootDenoConfig?: DenoConfigChange): boolean {
  const caps = classifyPath(path, rootDenoConfig);
  return !caps.scaffold && !caps.deno;
}

export interface DecisionInput {
  /** GitHub event name (e.g. `pull_request`, `workflow_dispatch`). */
  eventName: string;
  /** Changed file paths (relative to repo root). */
  files: readonly string[];
  /** PR label names. */
  labels: readonly string[];
  /**
   * Root `deno.json` contents at base/head, for the tasks-only
   * discrimination. Missing content classifies as `toolchain`.
   */
  rootDenoConfig?: { base?: string; head?: string };
}

export interface Decision {
  runStatic: boolean;
  runRuntimeSqlite: boolean;
  runRuntime: boolean;
  docsOnly: boolean;
  needsDeno: boolean;
  needsDocker: boolean;
  needsDesktop: boolean;
  needsDocs: boolean;
  needsSurface: boolean;
  reason: string;
}

function fullDecision(docsOnly: boolean, reason: string): Decision {
  return {
    runStatic: true,
    runRuntimeSqlite: true,
    runRuntime: true,
    docsOnly,
    needsDeno: true,
    needsDocker: true,
    needsDesktop: true,
    needsDocs: true,
    needsSurface: true,
    reason,
  };
}

/**
 * Pure decision function. `workflow_dispatch` (and any non-PR event) always
 * runs everything because there is no diff to classify; an empty PR diff
 * does the same.
 */
export function decide(input: DecisionInput): Decision {
  const labels = new Set(input.labels);
  const forceFull = labels.has('ci:full');
  const skipScaffold = labels.has('ci:skip-scaffold');
  const skipE2e = labels.has('ci:skip-e2e');

  // No diff to classify (manual dispatch, push, etc.) -> run everything
  // unless an explicit skip label is present. `ci:full` still wins.
  if (input.eventName !== 'pull_request') {
    if (forceFull) {
      return fullDecision(false, `${input.eventName}: ci:full -> run everything`);
    }
    return {
      ...fullDecision(
        false,
        `${input.eventName}: no diff to classify -> run (skip labels honoured)`,
      ),
      runStatic: !skipScaffold,
      runRuntimeSqlite: !skipScaffold && !skipE2e,
      runRuntime: !skipE2e,
    };
  }

  const changed = input.files.map(normalise).filter((p) => p.length > 0);
  if (changed.length === 0) {
    return fullDecision(false, 'empty diff: nothing to classify -> run everything');
  }

  const rootConfigChanged = changed.some((p) => p === 'deno.json' || p === 'deno.jsonc');
  const rootDenoConfig: DenoConfigChange = rootConfigChanged
    ? classifyDenoConfigChange(input.rootDenoConfig?.base, input.rootDenoConfig?.head)
    : 'toolchain';

  const caps = { ...NONE };
  for (const path of changed) {
    const contribution = classifyPath(path, rootDenoConfig);
    caps.scaffold ||= contribution.scaffold;
    caps.docker ||= contribution.docker;
    caps.desktop ||= contribution.desktop;
    caps.deno ||= contribution.deno;
    caps.docs ||= contribution.docs;
    caps.surface ||= contribution.surface;
  }

  const impacting = changed.filter((p) => !isDocsOnlyPath(p, rootDenoConfig));
  const docsOnly = impacting.length === 0;

  if (forceFull) {
    return fullDecision(docsOnly, 'ci:full label present -> force everything');
  }

  // scaffold-static
  let runStatic: boolean;
  let staticReason: string;
  if (skipScaffold) {
    runStatic = false;
    staticReason = 'scaffold-static skipped by ci:skip-scaffold';
  } else if (!caps.scaffold) {
    runStatic = false;
    staticReason = 'scaffold-static skipped: no scaffold-impacting change';
  } else {
    runStatic = true;
    staticReason = 'scaffold-static: scaffold-impacting change detected';
  }

  // scaffold-runtime (the docker tier: docker is the exception, not the default)
  let runRuntime: boolean;
  let runtimeReason: string;
  if (skipE2e) {
    runRuntime = false;
    runtimeReason = 'scaffold-runtime skipped by ci:skip-e2e';
  } else if (!caps.docker) {
    runRuntime = false;
    runtimeReason = 'scaffold-runtime skipped: no docker-tier change';
  } else {
    runRuntime = true;
    runtimeReason = 'scaffold-runtime: docker-tier change detected';
  }

  // scaffold-runtime-sqlite (the cheap runtime tier follows the static
  // scaffold signal; ci:skip-e2e remains authoritative over both runtimes).
  const runRuntimeSqlite = runStatic && !skipE2e;

  const impactingNote = docsOnly
    ? `${changed.length} file(s), all docs-only`
    : `${impacting.length}/${changed.length} impacting file(s), e.g. ${
      impacting.slice(0, 3).join(', ') || '(none)'
    }`;
  const vectorNote = `vector deno=${caps.deno} docker=${caps.docker} desktop=${caps.desktop} ` +
    `docs=${caps.docs} surface=${caps.surface}`;

  return {
    runStatic,
    runRuntimeSqlite,
    runRuntime,
    docsOnly,
    needsDeno: caps.deno,
    needsDocker: caps.docker,
    needsDesktop: caps.desktop,
    needsDocs: caps.docs,
    needsSurface: caps.surface,
    reason: `${impactingNote}. ${staticReason}; ${runtimeReason}. ${vectorNote}`,
  };
}

/** Parse a labels input that may be a JSON array or a comma-separated string. */
export function parseLabels(raw: string | undefined): string[] {
  if (!raw) return [];
  const trimmed = raw.trim();
  if (trimmed.length === 0) return [];
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v).trim()).filter((v) => v.length > 0);
      }
    } catch {
      // fall through to comma split
    }
  }
  return trimmed.split(',').map((v) => v.trim()).filter((v) => v.length > 0);
}

/** Parse a newline- or comma-separated file list. */
export function parseFiles(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/\r?\n/)
    .flatMap((line) => line.split(','))
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

/**
 * Parse `git diff --name-status -M` output into the full set of touched paths.
 *
 * Renames/copies (`R<score>` / `C<score>`) report `STATUS\told\tnew` — BOTH
 * sides are returned, so a `packages/cli/a.ts -> docs/a.md` rename still
 * surfaces the impacting source path (the rename hole found in adversarial
 * review: `--name-only` emits only the destination). Deletions (`D`) keep the
 * deleted path. All other statuses (`A`/`M`/`T`/...) contribute their path.
 * Lines without a recognisable status column are treated as bare paths, so an
 * unclassifiable input can only ever FORCE the gate, never skip it.
 */
export function parseNameStatus(raw: string | undefined): string[] {
  if (!raw) return [];
  const paths: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    if (line.trim().length === 0) continue;
    const parts = line.split('\t').map((v) => v.trim()).filter((v) => v.length > 0);
    if (parts.length === 0) continue;
    const status = parts[0];
    if (/^[RC]\d*$/.test(status) && parts.length >= 3) {
      // Rename/copy: include BOTH the old and the new path.
      paths.push(parts[1], parts[2]);
    } else if (/^[A-Z]\d*$/.test(status) && parts.length >= 2) {
      // Single-path statuses (A/M/D/T/U/...): everything after the status.
      paths.push(...parts.slice(1));
    } else {
      // No status column recognised — treat the fields as paths (conservative).
      paths.push(...parts);
    }
  }
  return paths;
}

/**
 * Make the reason safe to transport through `$GITHUB_OUTPUT` and job outputs:
 * strip control characters (incl. newlines, which a crafted filename could use
 * to inject extra output assignments) and cap the length. Consumers must still
 * only print it via `printf '%s\n' "$REASON"` from an env var — never
 * interpolate it into shell source.
 */
export function sanitizeReason(reason: string): string {
  // deno-lint-ignore no-control-regex
  const flat = reason.replace(/[\x00-\x1f\x7f]+/g, ' ').trim();
  return flat.length > 500 ? `${flat.slice(0, 497)}...` : flat;
}

async function main(): Promise<void> {
  const eventName = Deno.env.get('EVENT_NAME') ?? 'pull_request';
  // Prefer the rename-aware name-status form; fall back to a plain file list.
  const nameStatus = Deno.env.get('CHANGED_NAME_STATUS');
  const files = nameStatus !== undefined && nameStatus.trim().length > 0
    ? parseNameStatus(nameStatus)
    : parseFiles(Deno.env.get('CHANGED_FILES'));
  const labels = parseLabels(Deno.env.get('PR_LABELS'));
  const rootBase = Deno.env.get('ROOT_DENO_JSON_BASE');
  const rootHead = Deno.env.get('ROOT_DENO_JSON_HEAD');

  const decision = decide({
    eventName,
    files,
    labels,
    rootDenoConfig: {
      base: rootBase && rootBase.trim().length > 0 ? rootBase : undefined,
      head: rootHead && rootHead.trim().length > 0 ? rootHead : undefined,
    },
  });
  const reason = sanitizeReason(decision.reason);

  const lines = [
    `run_static=${decision.runStatic}`,
    `run_runtime_sqlite=${decision.runRuntimeSqlite}`,
    `run_runtime=${decision.runRuntime}`,
    `docs_only=${decision.docsOnly}`,
    `needs_deno=${decision.needsDeno}`,
    `needs_docker=${decision.needsDocker}`,
    `needs_desktop=${decision.needsDesktop}`,
    `needs_docs=${decision.needsDocs}`,
    `needs_surface=${decision.needsSurface}`,
    `reason=${reason}`,
  ];

  // Human-readable log.
  console.log('[ci-classify-changes]');
  console.log(`  event:         ${eventName}`);
  console.log(`  labels:        ${labels.join(', ') || '(none)'}`);
  console.log(`  changed:       ${files.length} file(s)`);
  console.log(`  run_static:    ${decision.runStatic}`);
  console.log(`  run_runtime_sqlite: ${decision.runRuntimeSqlite}`);
  console.log(`  run_runtime:   ${decision.runRuntime}`);
  console.log(`  docs_only:     ${decision.docsOnly}`);
  console.log(`  needs_deno:    ${decision.needsDeno}`);
  console.log(`  needs_docker:  ${decision.needsDocker}`);
  console.log(`  needs_desktop: ${decision.needsDesktop}`);
  console.log(`  needs_docs:    ${decision.needsDocs}`);
  console.log(`  needs_surface: ${decision.needsSurface}`);
  console.log(`  reason:        ${reason}`);

  const outPath = Deno.env.get('GITHUB_OUTPUT');
  if (outPath) {
    await Deno.writeTextFile(outPath, lines.join('\n') + '\n', { append: true });
  }
}

if (import.meta.main) {
  await main();
}
