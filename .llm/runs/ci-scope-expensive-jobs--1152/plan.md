# Plan — ci-scope-expensive-jobs--1152 (status: awaiting PLAN-EVAL)

Closes #1152. Owner-ratified constraints are locked (see `supervisor.md`); this plan decides only
mechanism and rollout.

## Locked design decisions

### D1 — One classifier, five outputs (capability vector)

`decide()` grows from `{run_static, run_runtime}` to also emit `needs_deno`, `needs_docker`,
`needs_desktop`, `needs_docs`, `needs_surface`. One pure function, one test file, many workflow
consumers. **Safety invariant (unit-tested):** an unrecognised (non-docs, non-listed) path sets the
ENTIRE vector true — every output fails toward running. `ci:full` forces the entire vector true.
`ci:skip-scaffold`/`ci:skip-e2e` keep exactly their current semantics (scaffold tiers only); they
never widen to `check-test`/`quality`. No other labels — routing stays in tested code.

### D2 — Output semantics (v1, deliberately wide)

| Output | v1 rule | Consumers |
| --- | --- | --- |
| `needs_deno` | `NOT docs_only` — any non-docs-only path | `check-test`, `quality` (ci.yml) |
| `needs_docker` | any `packages/**`/`plugins/**`/`apps/**`, tier-defining workflow, toolchain `deno.json*`, any `deno.lock` | `scaffold-runtime` |
| `needs_desktop` | `packages/cli/**`, tier-defining workflow, toolchain `deno.json*`, `deno.lock` | `desktop-native-linux` |
| `needs_docs` | any `docs/**` or `**/*.md(x)` change | docs-accuracy/tagline steps in `quality` |
| `needs_surface` | any `packages/**` change (mirrors today's `paths:` filter) | `surface-diff` |

- `needs_deno = !docsOnly` is the maximally conservative start: the only PRs that skip the required
  trio's work are the pure docs/agent-context class (5/20 in the audit, ~10 min each). Tightening
  (e.g. exempting non-tier workflow edits) comes later, against observed green history only.
- `needs_docker` v1 keeps ALL of `packages/**` — per the ratified "start deliberately wide, tighten
  only against observed green" rule, the v1 docker win is **precision on workflows and
  `deno.json`** (the measured #1122 waste), not package-set guessing. Package-level tightening
  (e.g. `fresh-ui`-only diffs) is a follow-up driven by the post-landing measurement, recorded on
  #1152.
- `needs_desktop` is the narrow one v1 can afford: the `.deb`/updater surface is entirely
  `packages/cli` (deploy feature + e2e gates). Everything else skips desktop. This supersedes the
  #1151 proxy (`run_static || run_runtime`).

### D3 — Precision fixes from #1122

- `.github/workflows/` stops escalating wholesale. `TIER_DEFINING_WORKFLOWS = e2e-cli.yml, ci.yml`
  (+ `.github/scripts/**`, which stays impacting-by-fallback and gets a pinning test) escalate the
  scaffold vector. Other workflow edits (`release-canary.yml`, `pages.yml`, `publish.yml`, …) set
  `needs_deno` only (conservative; they are still not docs).
- `deno.json`/`deno.jsonc` gets structural discrimination: a new pure function
  `classifyDenoConfigChange(oldText, newText)` → `tasks-only` | `toolchain`. `tasks-only` (only the
  `tasks` key differs) ⇒ `needs_deno` only. Anything else — `imports`, `workspace`,
  `compilerOptions`, unparseable, file added/deleted — ⇒ full vector. The classify job feeds
  base/head file contents via `git show BASE:deno.json` / `git show HEAD:deno.json`; absent or
  unreadable content ⇒ `toolchain` (fail toward running). `deno.lock` stays unconditionally
  impacting.

### D4 — Consumers reuse the ONE skip pattern

Every newly gated job copies `scaffold-static`'s exact pattern: job always starts,
`RUN: ${{ needs.classify.result != 'success' || needs.classify.outputs.<out> == 'true' }}`,
"Skipped by policy" step, every real step guarded by `env.RUN == 'true'`. Required checks
(`check-test`, `quality`) keep reporting SUCCESS; no `paths:`/job-`if:` skips, no second pattern,
no routing tables in YAML. `ci.yml` gets its own `classify` job running the same script (non-PR
events — push to main — classify as "run everything", preserving today's push behavior).
`surface-diff.yml` drops its `paths:` filter for a classify+`needs_surface` gate, making it
eligible as a required check.

### D5 — "Invert the docker default" without a third suite

The deno-only default tier IS `scaffold-static` (it exists, runs green, and covers scaffold +
registry + typecheck). v1 therefore implements the split as: `run_runtime := needs_docker`
(docker becomes the exception), `run_static` unchanged (any impacting change). No new e2e suite and
no `packages/cli/e2e` surgery in this PR — inventing a third "runtime-deno" job would duplicate
scaffold-static and drag framework-source work into a CI-tooling PR (wrong lane per CLAUDE.md).
**Flagged for PLAN-EVAL/owner:** if a genuine third tier is wanted later, it is a separate
WSL-Codex slice on `packages/cli/e2e`.

## Slices (sequential, one branch, one commit each)

- **S1** — classifier: emit the five outputs with v1-wide semantics; no workflow consumer changes.
  Tests: per-output positive AND negative cases, unknown-path-forces-all, ci:full-forces-all,
  `.github/scripts/**`-forces-all.
- **S2** — classifier precision: `TIER_DEFINING_WORKFLOWS` + `classifyDenoConfigChange`. Tests:
  #1122 replay (`release-canary.yml` + tasks-only `deno.json` ⇒ scaffold vector false,
  `needs_deno` true), tier workflow ⇒ all true, unparseable/deleted `deno.json` ⇒ all true.
  Settle the `.llm/tools/**/*.ts` edge (research item 1) empirically; encode + test the verdict.
- **S3** — `e2e-cli.yml`: `scaffold-runtime` reads `run_runtime` (now docker-gated), desktop reads
  `needs_desktop` (replacing the #1151 proxy), lane-visibility updated.
- **S4** — `ci.yml`: classify job + `needs_deno` gates on `check-test`/`quality` with
  skipped-by-policy; `needs_docs` step-gates for docs-accuracy/tagline; lane-visibility updated.
- **S5** — `surface-diff.yml`: fold the paths filter into `needs_surface`.
- **S6** — live verification (stacked demo PRs w/ `e2e-cli-gate`: docs-only ⇒ all skip;
  release-workflow-only ⇒ scaffold/docker/desktop skip) + before/after measurement posted on
  #1152 + workflow header docs.

Each slice: commit → push → PR comment with evidence; classifier test run is the per-slice gate
(`deno test .github/scripts/ci-classify-changes.test.ts`); no docker/scaffold runs from this
shared machine — live verification rides GitHub Actions via the stacked-demo technique.

## Risks / open questions for PLAN-EVAL

1. **D5 interpretation** of the "splits into a deno-only default tier" acceptance box (recommended:
   scaffold-static is that tier; no third suite in this PR).
2. **`needs_deno` for non-tier workflow edits** (v1 keeps true — costs ~9 min on rare
   workflow-only PRs, safe; tightening is data-driven later).
3. **`ci.yml` consumers cannot be demoed pre-merge** (branch-filtered trigger) — verified by
   expression parity with the proven e2e-cli pattern + first post-merge docs-only PR.
4. `deps-report` and `close-gate` stay ungated (cheap/informational or must-always-run).
