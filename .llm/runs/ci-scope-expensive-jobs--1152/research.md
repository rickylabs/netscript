# Research — ci-scope-expensive-jobs--1152

Sources: issues #1151/#1152 (owner-authored, measured over the last 20 closed PRs), owner brief
`.llm/tmp/BRIEF.md`, `#1122` worked example (owner comment on #1152), direct reads of
`.github/workflows/{ci,e2e-cli,surface-diff}.yml` and `.github/scripts/ci-classify-changes.ts`.

## Measured baseline (last 20 closed PRs, from #1152)

| Job | Gate today | Total | Ran on |
| --- | --- | --- | --- |
| `check-test` | none | ~138 min | 20/20 |
| `scaffold-runtime` | classifier | ~128 min | 15/20 |
| `scaffold-static` | classifier | ~46 min | 15/20 |
| `desktop-native-linux` | declared, not honored (#1151, fixed in PR #1153) | ~41 min | 20/20 |
| `quality` | none | ~38 min | 20/20 |

Five of twenty PRs touched no shipping code and still paid ~10 min each.

## Current mechanics

- `ci-classify-changes.ts`: pure `decide()` emits `run_static`/`run_runtime`/`docs_only`/`reason`.
  Conservative: unrecognised path ⇒ impacting ⇒ run. Consumed only by `e2e-cli.yml`.
- `e2e-cli.yml`: `classify` job → `scaffold-static`/`scaffold-runtime` read `env.RUN` with the
  fail-closed pattern (`classify.result != 'success' || run_* == 'true'`), short-circuiting to a
  "Skipped by policy" step that still reports SUCCESS. `desktop-native-linux` now reads the proxy
  `run_static || run_runtime` (PR #1153).
- `ci.yml`: `check-test` and `quality` have **no** condition; both are required checks via the
  `main-branch-protection` ruleset, so they must keep reporting even when skipped. `deps-report` is
  informational. Triggers include `push` to main (no PR diff ⇒ classifier already runs everything
  for non-PR events).
- `surface-diff.yml`: workflow-level `paths: packages/**` filter — job does not report at all on
  non-matching PRs (cannot become a required check as-is).

## The #1122 finding (precision failure, not just cost)

`IMPACTING_PREFIXES` contains `.github/workflows/` wholesale and `IMPACTING_EXACT` contains
`deno.json`. PR #1122 edited `release-canary.yml` + added a `deno.json` task + `.llm/tools/release`
scripts — zero `packages/`/`plugins/` — and paid 2× the full aspire+docker+postgres suite
(including a 15-min timeout) plus desktop. Only `e2e-cli.yml` and `ci.yml` *define* the scaffold
tiers; `release-canary.yml`, `pages.yml`, `publish.yml` etc. cannot affect them by construction.
Likewise a `tasks`-only `deno.json` edit is not a toolchain change.

## Edges found during re-baseline (must be settled in implementation)

1. **`.llm/tools/**/*.ts` is classified docs-only today** (`.llm/` is a `DOCS_PREFIXES` entry), yet
   root `deno task test` (`deno test --allow-all` from repo root) may discover `.llm/tools`
   test files, and several `deno task` gates execute `.llm/tools` scripts. If root test discovery
   includes them, non-md files under `.llm/tools/` must set `needs_deno`. Verify empirically;
   default toward running.
2. **`.github/scripts/**` (the classifier itself)** is unclassified today ⇒ impacting by fallback.
   Keep that behavior under the redesign and pin it with an explicit unit test — a classifier edit
   must force everything.
3. **Required-check inventory**: `check-test` and `quality` are ruleset-required; `scaffold-static`
   intends to become required. Every newly gated job must keep the start-and-report-SUCCESS
   pattern.
4. **`desktop` path surface**: desktop packaging/deploy code lives entirely under
   `packages/cli/src/public/features/deploy/` (+ its e2e gates under `packages/cli/e2e/`); no other
   package participates in the `.deb`/updater build.

## Verification technique proven on #1151

A stacked demo PR against the feature branch carrying the `e2e-cli-gate` label runs the edited
workflow (pull_request events use the merged workflow file) — run 30825776156 proved the
skipped-by-policy path live before merge. Reusable for #1152's negative cases. `ci.yml` cannot be
exercised this way (its `pull_request` trigger is branch-filtered to main/feat/epic), so its
consumers are verified by expression-parity review pre-merge + first docs-only PR post-merge.
