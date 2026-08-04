# Worklog — fix-windows-node-modules-materialization--1246

## 2026-08-04 — S0 research and plan

- Read issue #1246 first, including the owner correction and revised acceptance list.
- Verified branch/worktree, no upstream, baseline equals `origin/main` at
  `3a267aef17c251350a3e842699119e98365316f4`.
- Recorded pre-existing unrelated `deno.lock` modification for preservation.
- Read requested skills plus repo-required CLI, Fresh, tools, and RTK instructions.
- Read Archetype-6 doctrine, frontend overlay, gate matrix, milestone D6 ruling, and relevant CLI
  architecture debt.
- Searched the official Deno tracker and releases; classified the defect as upstream Deno
  materialization corruption with NetScript mitigation responsibility.
- Locked implementation decisions before source edits.
- Local PLAN-EVAL not launched under D6; see `plan-eval.md`.

### Evidence

- Issue: https://github.com/rickylabs/netscript/issues/1246
- Closest upstream: https://github.com/denoland/deno/issues/35804
- Direct affected evidence: 2.9.1, 2.9.3 (upstream), 2.9.4 (NetScript incident)
- Pre-window pin: Deno 2.9.0, already used throughout NetScript CI

## 2026-08-04 — S1 verifier contract and scaffold integration

- Opened draft PR #1264 with the requested labels, milestone, `Refs #1246`, and acceptance-evidence
  scaffold; posted RESEARCH, PLAN, and D6 composed-waiver phase comments.
- Linked the independent Deno 2.9.4 evidence to `deno/deno#35804`.
- Added a generated fail-closed cache-vs-local npm materialization verifier for both Aspire and
  `--no-aspire` projects.
- Added root `deps:verify`, wired root and Fresh dev paths to run it before application/Vite startup,
  and generated a private root `package.json` with `engines.deno: 2.9.0`.
- Added generated README install/preflight/recovery instructions and upstream link.
- Added an executable strict-TypeScript regression fixture: incomplete local materialization fails
  with exact remediation; complete materialization passes.

### Focused gate evidence

- Focused tests: `33 passed (19 steps), 0 failed`.
- Scoped check: 14 files, 1 batch, 0 occurrences.
- Scoped lint: 14 files, 1 batch, 0 occurrences.
- Scoped fmt: 14 files, 1 batch, 0 findings.
- `quality:scan`: no findings; seven pre-existing allowlisted findings reported.
- Root `arch:check`: completed with repository-baseline warnings only.
- Focused `packages/cli` doctrine reporter remains baseline-red (`FAIL=50 WARN=50`) and initially
  surfaced the generated `Deno.exit` text; implementation changed to thrown failures so this slice
  adds no new exit-boundary warning. Existing CLI doctrine debt remains unchanged.

## 2026-08-04 — S2 consumer/runtime evidence

- Full CLI package suite: `595 passed (484 steps), 0 failed`.
- First canonical `scaffold.runtime` attempt was correctly refused because another live worktree
  held the global lease; the holder and foreign resources were left untouched.
- First acquired `scaffold.runtime` run reached the real generated Fresh dev boundary and failed
  because Deno-owned `.scripts-warned-*` cache metadata is intentionally absent from the local
  package copy. This was a detector false positive, not product corruption.
- Narrowed comparison to exclude exactly `.scripts-warned-*`, retained all package-owned dotfiles,
  and added the marker to both executable fixtures. The incomplete Babel fixture still fails; the
  complete fixture passes with two verified package files.
- Corrected canonical command completed `passed=71 failed=0`, including project-boundary Fresh dev,
  generated type checks, Aspire restore/start, dashboard readiness, app-home serving, plugin/runtime
  behavior, telemetry, and cleanup.
- Post-run leak reporter found no resources owned by this worktree; all listed survivors belonged
  to foreign worktrees and were left untouched.
- Final focused check/lint/fmt on the corrected generator and test: 2 files, zero findings.

### Platform limitation

WSL/Linux consumer proof is green, but it is not native Windows evidence. The PR therefore retains
`Refs #1246` and defers native Windows no-intervention startup plus Windows CI to 0.0.6/upstream.

## 2026-08-04 — formal IMPL-EVAL

- Launched the required separate evaluator through the local Claude/OpenRouter transport with
  `qwen/qwen3.7-max`, high effort, session `ef9775bb-95fe-422c-9507-602dba016727`.
- The evaluator's first turn attempted to delegate to a closed Claude model; the open-model request
  guard denied it before execution. The same Qwen session resumed without delegation and performed
  the evaluation directly.
- The evaluator independently reran scoped static gates, focused tests, inspected the diff, PR
  metadata, consumer wiring, doctrine fitness gates, and recorded `PASS` in `evaluate.md`.
- Supervisor audit found one non-gating wording error claiming no sibling files were added. The same
  evaluator session corrected F-16/AP-16 to the actual folder cardinality and retained `PASS`.
- No evaluator source mutation occurred. The unrelated pre-existing `deno.lock` change remains
  unstaged and untouched by this run.
