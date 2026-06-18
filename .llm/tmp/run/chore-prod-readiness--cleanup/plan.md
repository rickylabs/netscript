# Plan: chore/prod-readiness (repo-wide cleanup)

> **PLAN-EVAL cycle 2 — revised 2026-06-18.** Cycle-1 verdict was `FAIL_PLAN` (OpenHands minimax M3,
> separate session; see `plan-eval.md`). All 7 required fixes applied: PR-7 deprecate-before-remove
> (S4′ defer, S5 refactor), F3 confirmed functional + arch-debt, G1-3 split into G1-3a/b/c, S6
> scaffolder consumer added to G1-5, `scaffold.runtime` smoke on every public slice, bounded G1-6,
> per-slice file list + LOC budget. Awaiting PLAN-EVAL re-run before any Codex slice.

## Run Metadata

| Field | Value |
|-------|-------|
| Run ID | `chore-prod-readiness--cleanup` |
| Branch | `chore/prod-readiness` (off `release/jsr-readiness`) |
| Phase | `plan` (PLAN-EVAL-ready) |
| Target | Repo-wide cleanup, including root |
| Archetype | N/A — cross-cutting repo hygiene (no public-API archetype) |
| Scope overlays | partial `SCOPE-docs.md` (deletes dead doc *files*; no content rewrites) |

## Archetype

N/A. This is repo hygiene, not a package surface. It touches many packages but for the internal
slices **adds or removes no public API**. Slices that remove **public** deprecated API (database,
fresh, plugin-workers-core) escalate to that unit's archetype gates (`deno doc --lint`,
`publish:dry-run`, consumer/scaffold scan).

## Goal

A production-clean repo: zero dead code, zero temp/garbage/build cruft, zero stray root files,
**all** backward-compat shims/aliases removed, dead doc *files* deleted — without rewriting doc
*content* (owned by the docs sub-runs) and without regressing publishability.

## Scope

- Every folder including root: dead code paths, unused exports/modules, orphaned files.
- **ALL** backward-compat shims/aliases (re-export shims, deprecated alias entrypoints) — see the
  S-inventory in `research.md`. **Excludes** functional shims/workarounds (F-inventory: Aspire D-7,
  esbuild CJS, servy alias) which are load-bearing, not back-compat.
- Temp/garbage/build cruft: **tracked** `.bak`/`.tmp`/build leftovers (gitignored scratch is already
  untracked → out of scope).
- Root-doc hygiene: **`AGENTS-handoff.md`** content relocates into the `openhands-handoff` skill,
  then the root file is deleted (PR-4 / Slice G1-0). No other stray root files exist.
- Dead documentation **files** (delete the file; do not rewrite surviving content).

## Non-Scope

- Doc **content** rewrites (Groups 3/4 own those).
- Dependency/`deno.json` task hygiene (Group 2 owns).
- Any version pin / `scaffold-versions.ts` / `packages/aspire/src/public/mod.ts` (off-limits).
- Catalog / `catalog:` changes (Option-A law — never).
- Introducing new abstractions or aliases (this run only deletes/relocates).
- Functional shims/workarounds (F1 Aspire D-7, F2 esbuild CJS, F3 servy alias) — off-limits.

## Hidden Scope

- A "compat shim" may be load-bearing: re-exports consumed by `cli`, plugins, or **generated
  scaffold output** under `packages/cli/src/kernel/templates/`. Each removal needs an
  import/consumer scan + green tests first (PR-2).
- "Dead" must be proven dead (import-graph + grep across `packages/`/`plugins/`/`ops/`/`.llm/tools/`/
  `docs/` + scaffold templates), not assumed (PR-6). No top-level `examples/` or `apps/` exist.
- `.llm/tmp/` holds both **tracked** run artifacts and **gitignored** scratch — only the gitignored
  scratch is cruft, and it is already untracked; tracked `.llm/tmp/run/` dirs are durable evidence
  (do not delete).

## Locked Decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| PR-1 | Removals/relocations only; **no new alias/shim/compat layer** introduced. | Cleanup, not refactor. Aligns with L-no-backcompat. |
| PR-2 | Every shim removal is preceded by a consumer/import scan (incl. scaffold templates); tests must stay green. | Shims may be load-bearing. |
| PR-3 | Delete dead doc *files*; never rewrite surviving doc content here. | Content is Groups 3/4. |
| PR-4 | **`AGENTS-handoff.md` is valid → it becomes skill content, not a root file** (user directive 2026-06-18). Fold into canonical `.agents/skills/openhands-handoff/SKILL.md`, re-point the 3 refs, delete the root file, regenerate `.claude/skills/` mirror, `validate-claude-surface.ts` green. Atomic (Slice G1-0). | Valid contributor protocol belongs in the skill surface; root stays clean. |
| PR-5 | **Functional** shims/workarounds (F1 Aspire D-7, F2 esbuild CJS, **F3 `ConnectionStrings__{provider}db` — VERIFIED functional**) are **OFF-LIMITS**. Only deprecation/back-compat aliases are removed. | F3 is read by `service/src/diagnostics/database-connectivity.ts:48,71,94`; live runtime contract, filed as arch-debt, not back-compat debt. |
| PR-6 | "Dead code" = proven unreachable via `deno info` import-graph + `.llm/tools/find-import-patterns.ts` / codemogger + grep across all code surfaces incl. scaffold templates. No removal without proof. **G1-6 is bounded**: it sweeps only surfaces already touched by G1-0..G1-5 plus `.llm/tools/`; any newly-discovered dead surface beyond that list is *recorded and deferred*, not removed this run. | Avoids deleting reachable code; bounds an otherwise open-ended sweep so PLAN-EVAL can size it. |
| PR-7 | **Deprecate-before-remove for public symbols.** A public symbol is *removed* this run only if it already carries `@deprecated` on `main`. An un-marked public alias (**S4′ `mysqlJsonExtension`**) is *deprecated this run, removal deferred*. A deprecated option backed by a live internal writer (**S5 `trustedConnection`**) is *refactored* (writer migrated to `authentication.type='ntlm'`), not deleted. | Silent deletion of an un-announced public symbol is a breaking change even at alpha; behavioural options need a migration, not a delete. |

## Open-Decision Sweep

| Decision | Status | Resolution |
|----------|--------|-----------|
| Definition/tooling for "dead code" | **RESOLVED** | PR-6 — import-graph (`deno info`) + `find-import-patterns.ts`/codemogger + grep, proof required. |
| Are `examples/`/`apps/` in cleanup scope | **RESOLVED** | Absent at top level; the generated-consumer surface to scan is `packages/cli/src/kernel/templates/`. |
| Compat-shim inventory | **RESOLVED** | `research.md` S-inventory (S1–S8 remove-candidates; F1–F3 off-limits). |
| F3 `ConnectionStrings__{provider}db` class | **RESOLVED** | Functional/off-limits — read by `database-connectivity.ts:48,71,94`. Arch-debt `database-connectivity-legacy-connstring-alias`. |
| S4′ `mysqlJsonExtension` (un-`@deprecated` public alias) | **RESOLVED** | PR-7 — deprecate this run, defer removal (G1-3b). Not a silent delete. |
| S5 `trustedConnection` shape | **RESOLVED** | PR-7 — behavioural refactor (writer @`mssql.adapter.ts:415–416` → `authentication.type='ntlm'`), not a delete (G1-3c). |

## Slice Plan (risk-ordered; each = own commit + consumer-scan + gate + PR comment + `commits.md`)

| Slice | Scope | Risk | Gate focus |
|-------|-------|------|------------|
| **G1-0** | Relocate `AGENTS-handoff.md` → `openhands-handoff` skill; re-point 3 refs; delete root file; regen `.claude/` mirror. | low | `validate-claude-surface.ts` green; grep no dangling `AGENTS-handoff` refs. |
| **G1-1** | Tracked-cruft sweep: tracked `.bak`/`.tmp`/build leftovers + orphaned `.md` (no nav/README/CI link). | low | grep refs (CI/tasks/markdown links) before each delete. |
| **G1-2** | Internal back-compat shims: S1 telemetry `job.ts` re-export, S2 CLI `windows.ts` 8 deprecated constants, S7 `workspace-mutator.ts` deprecated config path. | low–med | consumer scan each; scoped check/test. |
| **G1-3a** | S3 — remove `@deprecated` postgres-connstring fn alias (`database/mod.ts:254`). | med (public) | consumer scan + `deno doc --lint` + `publish:dry-run` + **`e2e:cli scaffold.runtime` smoke**. |
| **G1-3b** | S4 — remove the already-`@deprecated` `mssqlJsonExtension` (`sql-json.extension.ts:556`). **S4′ — ADD `@deprecated` to `mysqlJsonExtension` (:571); DEFER its removal** (PR-7). | med (public) | importer scan + `deno doc --lint` + `publish:dry-run` + **`scaffold.runtime` smoke**. |
| **G1-3c** | S5 — **refactor** `trustedConnection`: migrate internal writer (`mssql.adapter.ts:415–416`) to `authentication.type='ntlm'`, then remove the public option (`:66`). Not a delete (PR-7). | med (behavioural) | mssql adapter behavioural test + `deno doc --lint` + `publish:dry-run` + **`scaffold.runtime` smoke**. |
| **G1-4** | S8 — `@netscript/fresh` public deprecated options (`staticFiles`/`fsRoutes`, `define-fresh-app.ts:48,71`). | med (public) | option consumers + `deno doc --lint` + `publish:dry-run` + **`e2e:cli scaffold.runtime` smoke**. |
| **G1-5** | S6 — `plugin-workers-core` public deprecated recurring-job API **+ its generated-output consumer** `plugins/workers/src/scaffolding/job-scaffolders.ts:64–65` and the scaffolder's test fixture (migrate to scheduled-trigger API). | **high** | scaffold-template scan + scaffolder+fixture update + **full `e2e:cli scaffold.runtime`**. |
| **G1-6** | **Bounded** dead-code sweep (PR-6 proof) over surfaces already touched by G1-0..G1-5 **plus `.llm/tools/`**. New dead surfaces beyond that list are *recorded + deferred*, not removed. | med | import-graph + grep proof per removal; scoped check/test. |

> Slices are independent where possible. **G1-3a/b/c are sequenced within `@netscript/database`** (same
> unit). G1-5 is the single high-risk slice (scaffold output emits `.schedule(...)`) and is gated on a
> full `scaffold.runtime` E2E; if its migration exceeds ~30 LOC it is sub-split by the implementer.
> Every public-surface slice (G1-3a/b/c, G1-4, G1-5) carries a `scaffold.runtime` smoke because the
> scaffold templates are a consumer surface. If any removal proves consumer-breaking beyond cleanup
> scope, record drift and escalate rather than expanding scope silently.

### Per-slice file list + LOC budget (PLAN-EVAL fix, cycle 1)

> Estimates are net source LOC (most slices are deletions); the implementer MEASURE-FIRST confirms.
> A slice exceeding ~30 net LOC (only G1-5 is expected to) must be sub-split.

| Slice | Files touched | Est. net LOC |
|-------|---------------|--------------|
| G1-0 | `AGENTS-handoff.md` (del), `.agents/skills/openhands-handoff/SKILL.md` (+content), `.claude/skills/openhands-handoff/SKILL.md` (regen), `.llm/harness/workflow/agent-handoff.md:26` (re-point) | ~+90 / −95 (content move; root file removed) |
| G1-1 | tracked `.bak`/`.tmp`/build leftovers + orphaned `.md` (exact list = scan output; deletions only) | deletions only |
| G1-2 | `packages/telemetry/src/context/job.ts` (del file), `packages/cli/src/kernel/constants/windows.ts:217–231` (−15), `packages/cli/src/kernel/adapters/plugin/workspace-mutator.ts:250` (−~4) | −~25 |
| G1-3a | `packages/database/mod.ts:254` | −~5 |
| G1-3b | `packages/database/extensions/sql-json.extension.ts` (del `mssqlJsonExtension` 550–565 ≈ −16; +`@deprecated` on `mysqlJsonExtension` ≈ +1) | −15 |
| G1-3c | `packages/database/adapters/mssql.adapter.ts` (remove option `:66` −1; rewrite writer `:415–419` ≈ ±8) + mssql adapter test | +~8 / −~3 |
| G1-4 | `packages/fresh/src/runtime/server/define-fresh-app.ts:48,71` (+ internal option readers) | −~12 |
| G1-5 | `packages/plugin-workers-core/{streams/schema.ts:106, builders/job-builder.ts:48,130, public/root.ts:179}`, `plugins/workers/src/scaffolding/job-scaffolders.ts:64–65`, scaffolder test fixture | ~30–50 (migration; sub-split if >30) |
| G1-6 | only files within G1-0..G1-5 surfaces + `.llm/tools/` proven dead | deletions only |

## Risk Register

| Risk | Mitigation |
|------|------------|
| Removing a shim breaks a consumer (cli/plugins/scaffold output) | Consumer/import scan per removal (PR-2); `e2e:cli` at merge-readiness. |
| Deleting a "dead" file that is actually referenced (docs links, CI, tasks) | Grep refs (incl. CI/tasks/markdown links) before delete (PR-6). |
| Dropping a referenced root doc (`AGENTS-handoff.md`) | PR-4 relocates content into the skill **before** delete; `validate-claude-surface.ts` gate. |
| Regressing `publish:dry-run` / slow-types | Re-run `publish:dry-run` after removals (esp. G1-3a/b/c, G1-4, G1-5). |
| Removing a functional workaround mistaken for a shim | PR-5 fences F1–F3 off-limits (F3 verified functional). |
| Silently deleting an un-`@deprecated` public symbol (S4′) | PR-7 deprecate-before-remove: S4′ `mysqlJsonExtension` deprecated this run, removal deferred. |
| Removing a deprecated option still written internally (S5) | PR-7: G1-3c migrates the internal writer to `authentication.type='ntlm'` before dropping the option; adapter behavioural test. |
| Scaffolder emits a removed API (S6 `.schedule`) → `scaffold.runtime` typecheck break | G1-5 updates `job-scaffolders.ts:64–65` + fixture in the same slice; gated on full `scaffold.runtime`. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
|----|--------|------|
| Backward-compat shims/aliases (L-no-backcompat) | existing | resolve (delete already-`@deprecated` aliases S1–S4, S6–S8); S4′ deprecate-now/defer; S5 refactor (PR-7) |
| Valid protocol stranded as a root `.md` | existing | resolve (relocate `AGENTS-handoff.md` into skill, PR-4) |
| Tracked build/scratch cruft | existing | resolve (delete, G1-1) |

## Fitness Gates

| Gate | Required | Expected evidence |
|------|----------|-------------------|
| publish:dry-run (27 units, 0 slow types) | yes | `.llm/tools/run-publish-dry-run.ts` |
| check (scoped) | yes | `.llm/tools/run-deno-check.ts --ext ts,tsx` |
| test | yes | `deno task test` green |
| lint/fmt (source TS) | yes | scoped wrappers |
| `validate-claude-surface.ts` (G1-0) | yes | green after skill relocation + mirror regen |
| arch:check not regressed | yes | `deno task arch:check` vs baseline |
| `scaffold.runtime` smoke (per public slice) | yes (G1-3a/b/c, G1-4, G1-5) | `deno task e2e:cli run scaffold.runtime` — scaffold templates are a consumer surface |
| e2e:cli merge-readiness | yes (eval pass) | `deno task e2e:cli` full `scaffold.runtime` |

## Arch-Debt Implications

| Entry | Action | Notes |
|-------|--------|-------|
| `.llm/harness/debt/arch-debt.md` | update/close | Close any debt entries resolved by shim removal; carry forward the rest. |
| `database-connectivity-legacy-connstring-alias` | **add** | F3: `ConnectionStrings__{provider}db` is a functional alias read by `service/src/diagnostics/database-connectivity.ts:48,71,94`; consolidation deferred (out of cleanup scope). |
| `mysqljsonextension-deprecated-removal-deferred` | **add** | S4′: `mysqlJsonExtension` deprecated in G1-3b; physical removal deferred to a post-alpha cycle (PR-7). |

## Validation Plan

| Order | Gate | Command/check | Expected |
|-------|------|---------------|----------|
| 1 | publishability | `deno task publish:dry-run` | 27 units, 0 slow types |
| 2 | check | scoped `run-deno-check.ts` | 0 errors |
| 3 | test | `deno task test` | green |
| 4 | claude-surface (if G1-0 in batch) | `validate-claude-surface.ts` | green |
| 5 | arch | `deno task arch:check` | not regressed |
| 6 | merge-readiness | `deno task e2e:cli` | green at eval pass |

## Dependencies

- Branches off the umbrella; runs in parallel with `chore/deps-hygiene`.
- A prerequisite for **docs IMPL** (docs document the cleaned surface).

## Drift Watch

- Any shim that turns out load-bearing (record consumer + decision).
- Any "dead" file that proves referenced.
- Any public-surface removal whose blast radius exceeds cleanup scope (escalate).
- Scope creep into doc content or dependency hygiene (belongs to other groups).
