# Plan: chore/prod-readiness (repo-wide cleanup)

> **DRAFT** — pending deeper research (dead-code/shim inventory) + PLAN-EVAL (separate session).

## Run Metadata

| Field | Value |
|-------|-------|
| Run ID | `chore-prod-readiness--cleanup` |
| Branch | `chore/prod-readiness` (off `release/jsr-readiness`) |
| Phase | `plan` (draft) |
| Target | Repo-wide cleanup, including root |
| Archetype | N/A — cross-cutting repo hygiene (no public-API archetype) |
| Scope overlays | partial `SCOPE-docs.md` (deletes dead doc *files*; no content rewrites) |

## Archetype

N/A. This is repo hygiene, not a package surface. It touches many packages but **adds or
removes no public API** — pure removal of dead/cruft/shim material. Any unit whose public
surface would change by a removal escalates to that unit's archetype rules.

## Goal

A production-clean repo: zero dead code, zero temp/garbage/build cruft, zero stray root files,
**all** backward-compat shims/aliases removed, dead doc *files* deleted — without rewriting doc
*content* (owned by the docs sub-runs) and without regressing publishability.

## Scope

- Every folder including root: dead code paths, unused exports/modules, orphaned files.
- **ALL** backward-compat shims/aliases (re-export shims, deprecated alias entrypoints, compat layers).
- Temp/garbage/build cruft (stray scratch, `dist/`-style leftovers not gitignored, `.bak`/`.tmp`).
- Stray root files (e.g. `agents-handover.md` and similar handover/scratch files at repo root).
- Dead documentation **files** (delete the file; do not rewrite surviving content).

## Non-Scope

- Doc **content** rewrites (Groups 3/4 own those).
- Dependency/`deno.json` task hygiene (Group 2 owns).
- Any version pin / `scaffold-versions.ts` / `packages/aspire/src/public/mod.ts` (off-limits).
- Catalog / `catalog:` changes (Option-A law — never).
- Introducing new abstractions or aliases (this run only deletes).

## Hidden Scope

- A "compat shim" may be load-bearing: re-exports consumed by `examples/`, `apps/`, `cli`, or
  generated scaffold output. Each removal needs an import/consumer scan + green tests first.
- "Dead" must be proven dead (import-graph + grep across `packages/`/`plugins/`/`examples/`/`apps/`
  + generated scaffold templates), not assumed.
- `.llm/tmp/` holds both **tracked** run artifacts and **gitignored** scratch — only the gitignored
  scratch is cruft; tracked run dirs are durable evidence (do not delete).

## Locked Decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| PR-1 | Removals only; **no new alias/shim/compat layer** introduced. | Cleanup, not refactor. Aligns with L-no-backcompat. |
| PR-2 | Every shim removal is preceded by a consumer/import scan; tests must stay green. | Shims may be load-bearing. |
| PR-3 | Delete dead doc files; never rewrite surviving doc content here. | Content is Groups 3/4. |

## Open-Decision Sweep

| Decision | Status | Notes |
|----------|--------|-------|
| Definition/tooling for "dead code" (coverage vs import-graph vs `deno info`/codemogger) | must resolve now | Determines what is safely removable; PLAN-EVAL will check the method. |
| Are `examples/`/`apps/` in cleanup scope or treated as fixtures | safe to defer | Resolve in Plan & Design; affects denominator. |
| Compat-shim inventory (which shims exist) | must resolve now | The core research deliverable; drives the slice list. |

## Risk Register

| Risk | Mitigation |
|------|------------|
| Removing a shim breaks a consumer (cli/examples/scaffold output) | Consumer/import scan per removal; `e2e:cli` at merge-readiness. |
| Deleting a "dead" file that is actually referenced (docs links, CI, tasks) | Grep refs (incl. CI/tasks/markdown links) before delete. |
| Regressing `publish:dry-run` / slow-types | Re-run `publish:dry-run` after removals. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
|----|--------|------|
| Backward-compat shims/aliases (L-no-backcompat) | existing | resolve (delete all) |
| Stray root/scratch files | existing | resolve (delete) |

## Fitness Gates

| Gate | Required | Expected evidence |
|------|----------|-------------------|
| publish:dry-run (27 units, 0 slow types) | yes | `.llm/tools/run-publish-dry-run.ts` |
| check (scoped) | yes | `.llm/tools/run-deno-check.ts --ext ts,tsx` |
| test | yes | `deno task test` green |
| lint/fmt (source TS) | yes | scoped wrappers |
| arch:check not regressed | yes | `deno task arch:check` vs baseline |
| e2e:cli merge-readiness | yes (eval pass) | `deno task e2e:cli` `scaffold.runtime` |

## Arch-Debt Implications

| Entry | Action | Notes |
|-------|--------|-------|
| `.llm/harness/debt/arch-debt.md` | update/close | Close any debt entries resolved by shim removal; carry forward the rest. |

## Validation Plan

| Order | Gate | Command/check | Expected |
|-------|------|---------------|----------|
| 1 | publishability | `deno task publish:dry-run` | 27 units, 0 slow types |
| 2 | check | scoped `run-deno-check.ts` | 0 errors |
| 3 | test | `deno task test` | green |
| 4 | arch | `deno task arch:check` | not regressed |
| 5 | merge-readiness | `deno task e2e:cli` | green at eval pass |

## Dependencies

- Branches off the umbrella; runs in parallel with `chore/deps-hygiene`.
- A prerequisite for **docs IMPL** (docs document the cleaned surface).

## Drift Watch

- Any shim that turns out load-bearing (record consumer + decision).
- Any "dead" file that proves referenced.
- Scope creep into doc content or dependency hygiene (belongs to other groups).
