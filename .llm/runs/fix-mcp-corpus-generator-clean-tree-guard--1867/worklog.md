# Worklog — #1867 F-3 generator clean-tree guard

## Run metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-mcp-corpus-generator-clean-tree-guard--1867` |
| Branch | `fix/mcp-corpus-generator-clean-tree-guard` |
| Baseline | `3066a0cc5f1573a326f8da54891d4be1434acaac` (`origin/main`, 2026-09-02) |
| Supervisor | `topic-internals-0.0.7` |
| Archetype | N/A — repository-internal documentation generator tooling; no package/plugin implementation changes |
| Scope overlays | none |

This supervised leaf uses the owner-authorized compact artifact set (`worklog.md`, `evidence.md`,
and `drift.md`). The implementation brief is the carried-in contract; the design and locked
decisions below are the leaf plan of record.

## Design

### Public surface

- `deno task gen:mcp-export-corpus` refuses to write when
  `git status --porcelain -- packages plugins` reports paths, unless `--allow-dirty` is explicit.
- `generate-export-surface-corpus.ts --check` retains its existing freshness-only behavior.
- `generate-export-surface-corpus.ts --allow-dirty` permits the write and records the bypass as a
  loud stderr warning naming the dirty paths.

### Domain vocabulary

- **generator read set** — the `packages` and `plugins` trees consumed through manifests,
  entrypoints, and transitive `deno doc` traversal.
- **dirty read set** — non-empty stdout from the exact scoped porcelain probe.
- **write path** — generation without `--check`; the only path that can bake and persist a corpus.
- **override** — explicit `--allow-dirty` intent on the write path.
- **probe unavailable** — Git cannot start or cannot establish repository status; generation
  continues with a loud warning for legitimate consumers outside a checkout.

### Ports

- `git status --porcelain -- packages plugins` is the sole repository-state probe.
- Deno subprocess and filesystem APIs remain the existing execution/write ports.

### Constants

- `GENERATOR_READ_SET` — `packages`, `plugins`.
- `ALLOW_DIRTY_ARGUMENT` — `--allow-dirty`.

### Locked decisions

| ID | Decision | Rationale / trade-off |
| --- | --- | --- |
| D1 | Guard write mode only; never run the dirtiness probe for `--check`. | Check mode cannot mutate or bake a wrong artifact. Keeping the new failure source out of the required CI freshness gate preserves its signal and avoids disabling it as flaky. |
| D2 | Refuse dirty read-set writes by default before corpus construction and output I/O. | A plausible wrong blob is worse than a failed command; preflight ordering makes unchanged output bytes an enforceable invariant. |
| D3 | Support explicit `--allow-dirty` in write mode and emit the bypass plus offending porcelain lines to stderr. | This preserves the common surface-edit + corpus commit workflow. Stderr is allowed provenance and keeps the generated artifact deterministic; embedding override state would make the subsequent clean `--check` fail by construction. The trade-off is that attribution persists only where command stderr is captured. |
| D4 | Warn and continue when Git is unavailable or the root is not a repository. | Consumers outside a checkout must remain able to generate; the warning makes the missing safety proof visible without treating environment shape as corruption. |
| D5 | Add `git` only to the generator task's `--allow-run` allowlist. | The exact required probe cannot execute under the current `--allow-run=deno` permission. No task rewiring, dependency, or lock change is needed. |

### Open-decision sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Guard mode | resolved now | D1 |
| Legitimate dirty workflow | resolved now | D3 |
| Missing Git/non-repository behavior | resolved now | D4 |
| Manifest permission | resolved now | D5; flagged to the owner before edit |

### Risks

| Risk | Mitigation |
| --- | --- |
| Guard runs after writing. | Invoke it before `buildExportSurfaceCorpus()` and assert output bytes remain unchanged on refusal. |
| Unrelated run artifacts block generation. | Probe only `packages` and `plugins`; test an outside dirty path. |
| Required CI check acquires a dirty-tree failure. | Bypass the probe entirely in `--check`; cover with a dirty non-corpus input under `packages`. |
| Override becomes silent habit. | Require a named flag and print a loud stderr warning with every offending path. |
| Missing Git blocks consumers. | Catch spawn failures and non-zero status, warn, and continue. |
| Task permission broadens more than needed. | Add only `git` beside existing `deno`; assert no other manifest or lock drift. |

### Commit slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 0 | Bootstrap the bounded leaf plan and review surface. | Plan checklist; `PLAN-EVAL: N/A` | this run directory |
| 1 | Establish RED integration contracts in real detached throwaway worktrees. | raw focused test with real exit at the RED commit | generator test + this run directory |
| 2 | Refuse unsafe writes while preserving check, override, outside-dirty, and no-Git flows. | focused test + corpus freshness + scoped check/fmt | generator, test, `deno.json`, this run directory |
| 3 | Record final gate, scope, lock, and handoff evidence. | every requested command with real exit | this run directory |

### Deferred scope

- F-2 CI wiring is already delivered by #1920/#1929 and will not be changed.
- The corpus artifact will not be regenerated or committed.
- Workflows, dependencies, lockfiles, `packages/**`, and `plugins/**` are not implementation scope.
- Ready-for-review, merge, and issue closure remain with the topic supervisor after separate
  IMPL-EVAL.

### Contributor path

Start at the CLI argument parsing and write-mode preflight at the bottom of
`generate-export-surface-corpus.ts`, then read the throwaway-worktree integration cases in its
sibling test. Use `--allow-dirty` only when intentionally generating from uncommitted public
surfaces and retain stderr in review evidence.

## PLAN-EVAL

N/A. This is a small, bounded defect whose implementation brief and issue comment supply the exact
scope, read-set command, acceptance behaviors, non-scope, and gates. Both decision-heavy
interactions were resolved and recorded above before tests or implementation; no material
architecture, sequencing, or scope question remains.

## Progress log

| Time (UTC) | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-02 14:23 | 0 | re-baseline | Branch and `origin/main` are the exact assigned base; tree is clean; #1867 comment confirms F-3-only boundary. |
| 2026-09-02 14:23 | 0 | design | Locked write-only guard, explicit stderr-recorded override, warn-and-continue fallback, and minimal task permission. |
| 2026-09-02 14:27 | 1 | RED contracts | Added committed-worktree CLI cases for clean write, package/plugin refusal-before-write, outside dirtiness, check-mode isolation, override provenance, and missing Git. |
| 2026-09-02 14:29 | 1 | RED refinement | First exact-commit run exited 1 with the expected missing-guard failures, but the no-Git fixture also hid Deno; narrowed PATH to Deno's bin directory before the authoritative RED rerun. |
| 2026-09-02 14:31 | 1 | authoritative RED | Detached `33ec78509` run exited 1: 8 passed, 4 failed for the four absent guard/override/warning contracts; cleanup exited 0. |
| 2026-09-02 14:32 | 2 | implementation | Added the exact scoped Git preflight before corpus construction, default refusal, stderr-recorded override, warning fallback, and minimal generator task permission. |

## Gate results

Pending RED-first implementation.

## Handoff notes

- The separate evaluator should inspect preflight ordering, raw porcelain path reporting, the
  `--check` bypass, and whether each test executes from a committed detached worktree.
- Mandatory IMPL-EVAL is assigned to the separate topic-supervisor route; this leaf will not
  self-certify.
