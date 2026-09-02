# Plan: wire the MCP export-corpus gate into CI

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `ci-mcp-export-corpus-gate--1920` |
| Branch | `ci/mcp-export-corpus-gate` |
| Phase | `plan` |
| Target | CI quality tooling and the generated MCP export corpus |
| Archetype | `2 — Integration` (`packages/mcp`; generated internal asset only) |
| Scope overlays | `none` |

## Archetype

`packages/mcp` is assigned Archetype 2 by doctrine. This slice does not reshape that package: it
refreshes one generator-owned infrastructure asset and adds one existing catalog gate invocation to
the repository CI workflow.

## Current Doctrine Verdict

`packages/mcp`: **Keep** — preserve MCP transports behind token-bounded tool contracts. The planned
change neither alters transports nor changes a public contract.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A14 | The existing export-corpus fitness function must run on every PR that can stale it. |
| A7 | Reuse the existing gate catalog and runner instead of introducing another CI mechanism. |

## Goal

Make the existing deterministic MCP export-corpus freshness check an exercised, receipt-producing
step in the CI `quality` job for every change that can affect its generated contents.

## Scope

- Regenerate the checked-in MCP export corpus at the dispatched base.
- Add one `run-gate.ts --gate mcp-export-corpus` step to `quality`, using ID
  `quality-mcp-export-corpus` and receipt `quality/mcp-export-corpus.json`.
- Prove generator determinism across repeated warm-cache runs and a pristine `DENO_DIR`.
- Prove classifier reachability and both failing/passing freshness directions.

## Non-Scope

- No generator dirty-tree guard (#1867 F-3), dependency, lockfile, package surface, gate-catalog,
  other workflow/job, or unrelated corpus-drift fix.
- No CLI E2E run, merge, ready transition, issue closure, or rebase.

## Hidden Scope

- The CI step is insufficient unless every generator input class selects `RUN_DENO`; classifier
  reachability is part of acceptance.
- The generated corpus collides with concurrent public-surface work, so final handoff requires an
  explicit remote-main comparison and regeneration after any authorized integration.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Add the step next to the sibling generated-corpus freshness steps and gate it on `RUN_DENO`. | The command shells out to Deno and every content-affecting input class sets `needs_deno`. |
| D2 | Use the existing catalog ID without modifying catalog code. | The gate already exists and the defect is CI reachability only. |
| D3 | Stop on any pristine-cache byte mismatch. | CI/local nondeterminism would make the required gate harmful. |
| D4 | Perform the stale RED in a detached throwaway worktree. | Prevent an uncommitted fresh corpus from silently rescuing the stale baseline. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| CI placement/condition | resolved now | Exact sibling shape plus `RUN_DENO`; no implementation discretion remains. |
| Concurrent-main integration | safe to defer | Compare remote main at handoff; notify the supervisor before any rebase/integration. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Generator differs between warm and pristine caches. | Three captured generations with SHA and cardinalities; stop on mismatch. |
| CI step exists but is skipped for corpus-affecting changes. | Derive and execute classifier examples for all generator input classes. |
| False RED from live-tree generated content. | Run RED from the stale baseline in a throwaway worktree. |
| Concurrent surface PR invalidates the blob. | Compare `origin/main` at handoff and re-verify metadata after any authorized integration. |
| Lockfile churn. | Use existing `--no-lock` tasks and verify `deno.lock` is unchanged. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-18 | avoid | Treat the generated blob as generator output; validate semantic metadata and freshness, never hand-edit it. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| A14 / existing corpus fitness gate | yes | stale exit 1, fresh exit 0, CI YAML parsed step, durable receipt path |
| F-19 scoped tooling check | yes | structured `.llm/tools` TypeScript check exits 0 |
| Other Archetype-2 gates | N/A | no hand-authored package code or public surface changes |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| Existing MCP debt | none | The generated corpus and CI wiring do not deepen package structure or contract debt. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Baseline | `deno task check:mcp-export-corpus` | exit 1 at stale base |
| 2 | Determinism | two warm generations plus one pristine-`DENO_DIR` generation | exit 0; identical file SHA, subpaths, symbols |
| 3 | YAML structure | parse `.github/workflows/ci.yml` and read back the named step | one exact gate/id/output invocation under `quality` |
| 4 | Trigger path | invoke classifier decisions for corpus input classes | `needsDeno=true` for every case |
| 5 | RED teeth | gate in stale-base throwaway worktree | exit 1 |
| 6 | GREEN teeth | freshness gate in live worktree | exit 0 |
| 7 | Tooling check | requested structured check wrapper | exit 0 |
| 8 | Hygiene/currency | raw git status, lock diff, and remote-main SHA | only scoped files; no lock change; report exact base |

## Dependencies

- Deno 2.9.5, existing root lock/import map, existing gate runner/catalog.

## Drift Watch

- Pristine-cache divergence, classifier gaps, `origin/main` movement, corpus collision, or any
  required file outside the authorized workflow/generated-asset/run-artifact scope.
