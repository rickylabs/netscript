/**
 * CI change classifier for the expensive `e2e-cli` gate.
 *
 * Decides whether the two expensive jobs in `.github/workflows/e2e-cli.yml`
 * (`scaffold-static`, `scaffold-runtime`) need to run for a given pull request,
 * based on:
 *
 *   1. the set of changed files (docs-only detection), and
 *   2. explicit opt-in / opt-out labels.
 *
 * Design contract (see PR "ci: docs-only + label-gated skip lanes"):
 *
 *   - A file is "docs-only" (non-impacting for the scaffold/e2e gate) iff it
 *     matches the docs allowlist AND does NOT match the impacting denylist.
 *   - The denylist ALWAYS wins: anything under `packages/`, `plugins/`, `apps/`,
 *     any `deno.json*` / `deno.lock`, or `.github/workflows/**` is treated as
 *     impacting even if it is a Markdown file. This honours the hard rule that
 *     those surfaces must never be classified docs-only.
 *   - `docsOnly` is true only when there is at least one changed file and every
 *     changed file is docs-only.
 *
 * Label precedence (highest first):
 *   1. `ci:full`          -> force BOTH jobs to run (overrides docs-only + skip).
 *   2. `ci:skip-scaffold` -> skip `scaffold-static`.
 *      `ci:skip-e2e`      -> skip `scaffold-runtime`.
 *   3. docs-only          -> skip both.
 *   4. otherwise          -> run both.
 *
 * The classifier is intentionally conservative: an unrecognised path forces the
 * gate to run. It NEVER skips because it failed to classify.
 *
 * This module is pure (`decide`) plus a thin CLI. The CLI reads inputs from env
 * and appends job outputs to `$GITHUB_OUTPUT`. It is exercised by
 * `ci-classify-changes.test.ts` and run as a self-check step in the classify
 * job.
 */

/** Prefix/exact matches that force the gate to run, regardless of extension. */
const IMPACTING_PREFIXES = [
  'packages/',
  'plugins/',
  'apps/',
  '.github/workflows/',
] as const;

const IMPACTING_EXACT = new Set([
  'deno.json',
  'deno.jsonc',
  'deno.lock',
]);

/** Directory prefixes whose contents are docs / agent-context only. */
const DOCS_PREFIXES = [
  'docs/',
  '.llm/',
  '.agents/',
  '.claude/',
] as const;

/** Extensions that are docs-only wherever they live (subject to the denylist). */
const DOCS_EXTENSIONS = ['.md', '.mdx'] as const;

/** Normalise a git path: strip a leading `./`, collapse backslashes. */
function normalise(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\//, '');
}

/** Does this path force the expensive gate to run (impacting surface)? */
export function isImpacting(rawPath: string): boolean {
  const path = normalise(rawPath);
  if (IMPACTING_EXACT.has(path)) return true;
  // Any `deno.json*` at any depth (e.g. generated workspace roots) is impacting.
  const base = path.slice(path.lastIndexOf('/') + 1);
  if (base === 'deno.json' || base === 'deno.jsonc' || base === 'deno.lock') {
    return true;
  }
  return IMPACTING_PREFIXES.some((prefix) => path.startsWith(prefix));
}

/** Is this path a docs-only surface (only meaningful when not impacting)? */
export function isDocs(rawPath: string): boolean {
  const path = normalise(rawPath);
  if (DOCS_EXTENSIONS.some((ext) => path.endsWith(ext))) return true;
  if (DOCS_PREFIXES.some((prefix) => path.startsWith(prefix))) return true;
  return false;
}

/**
 * True iff `path` is docs-only: matches the docs allowlist and is not on the
 * impacting denylist (denylist wins).
 */
export function isDocsOnlyPath(path: string): boolean {
  if (isImpacting(path)) return false;
  return isDocs(path);
}

export interface DecisionInput {
  /** GitHub event name (e.g. `pull_request`, `workflow_dispatch`). */
  eventName: string;
  /** Changed file paths (relative to repo root). */
  files: readonly string[];
  /** PR label names. */
  labels: readonly string[];
}

export interface Decision {
  runStatic: boolean;
  runRuntime: boolean;
  docsOnly: boolean;
  reason: string;
}

/**
 * Pure decision function. `workflow_dispatch` (and any non-PR event) always
 * runs both jobs because there is no diff to classify.
 */
export function decide(input: DecisionInput): Decision {
  const labels = new Set(input.labels);
  const forceFull = labels.has('ci:full');
  const skipScaffold = labels.has('ci:skip-scaffold');
  const skipE2e = labels.has('ci:skip-e2e');

  // No diff to classify (manual dispatch, push, etc.) -> run everything unless
  // an explicit skip label is present. `ci:full` still wins.
  if (input.eventName !== 'pull_request') {
    if (forceFull) {
      return {
        runStatic: true,
        runRuntime: true,
        docsOnly: false,
        reason: `${input.eventName}: ci:full -> run both`,
      };
    }
    return {
      runStatic: !skipScaffold,
      runRuntime: !skipE2e,
      docsOnly: false,
      reason: `${input.eventName}: no diff to classify -> run (skip labels honoured)`,
    };
  }

  const changed = input.files.map(normalise).filter((p) => p.length > 0);
  const impacting = changed.filter((p) => !isDocsOnlyPath(p));
  const docsOnly = changed.length > 0 && impacting.length === 0;

  if (forceFull) {
    return {
      runStatic: true,
      runRuntime: true,
      docsOnly,
      reason: 'ci:full label present -> force both jobs',
    };
  }

  // scaffold-static
  let runStatic: boolean;
  let staticReason: string;
  if (skipScaffold) {
    runStatic = false;
    staticReason = 'scaffold-static skipped by ci:skip-scaffold';
  } else if (docsOnly) {
    runStatic = false;
    staticReason = 'scaffold-static skipped: docs-only change';
  } else {
    runStatic = true;
    staticReason = 'scaffold-static: code change detected';
  }

  // scaffold-runtime
  let runRuntime: boolean;
  let runtimeReason: string;
  if (skipE2e) {
    runRuntime = false;
    runtimeReason = 'scaffold-runtime skipped by ci:skip-e2e';
  } else if (docsOnly) {
    runRuntime = false;
    runtimeReason = 'scaffold-runtime skipped: docs-only change';
  } else {
    runRuntime = true;
    runtimeReason = 'scaffold-runtime: code change detected';
  }

  const impactingNote = docsOnly
    ? `${changed.length} file(s), all docs-only`
    : `${impacting.length}/${changed.length} impacting file(s), e.g. ${
      impacting.slice(0, 3).join(', ') || '(none)'
    }`;

  return {
    runStatic,
    runRuntime,
    docsOnly,
    reason: `${impactingNote}. ${staticReason}; ${runtimeReason}`,
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

async function main(): Promise<void> {
  const eventName = Deno.env.get('EVENT_NAME') ?? 'pull_request';
  const files = parseFiles(Deno.env.get('CHANGED_FILES'));
  const labels = parseLabels(Deno.env.get('PR_LABELS'));

  const decision = decide({ eventName, files, labels });

  const lines = [
    `run_static=${decision.runStatic}`,
    `run_runtime=${decision.runRuntime}`,
    `docs_only=${decision.docsOnly}`,
    `reason=${decision.reason}`,
  ];

  // Human-readable log.
  console.log('[ci-classify-changes]');
  console.log(`  event:        ${eventName}`);
  console.log(`  labels:       ${labels.join(', ') || '(none)'}`);
  console.log(`  changed:      ${files.length} file(s)`);
  console.log(`  run_static:   ${decision.runStatic}`);
  console.log(`  run_runtime:  ${decision.runRuntime}`);
  console.log(`  docs_only:    ${decision.docsOnly}`);
  console.log(`  reason:       ${decision.reason}`);

  const outPath = Deno.env.get('GITHUB_OUTPUT');
  if (outPath) {
    await Deno.writeTextFile(outPath, lines.join('\n') + '\n', { append: true });
  }
}

if (import.meta.main) {
  await main();
}
