# Plan: chore/prod-readiness (repo-wide cleanup)

> **PLAN-EVAL-ready** (2026-06-18). Open decisions resolved; slice plan below. Awaiting PLAN-EVAL
> (OpenHands minimax M3, separate session) before any Codex slice.

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
| PR-5 | **Functional** shims/workarounds (F1 Aspire D-7, F2 esbuild CJS, F3 servy alias — pending verify) are **OFF-LIMITS**. Only deprecation/back-compat aliases are removed. | They are correctness workarounds, not back-compat debt. |
| PR-6 | "Dead code" = proven unreachable via `deno info` import-graph + `.llm/tools/find-import-patterns.ts` / codemogger + grep across all code surfaces incl. scaffold templates. No removal without proof. | Avoids deleting reachable code; gives PLAN-EVAL a checkable method. |

## Open-Decision Sweep

| Decision | Status | Resolution |
|----------|--------|-----------|
| Definition/tooling for "dead code" | **RESOLVED** | PR-6 — import-graph (`deno info`) + `find-import-patterns.ts`/codemogger + grep, proof required. |
| Are `examples/`/`apps/` in cleanup scope | **RESOLVED** | Absent at top level; the generated-consumer surface to scan is `packages/cli/src/kernel/templates/`. |
| Compat-shim inventory | **RESOLVED** | `research.md` S-inventory (S1–S8 remove-candidates; F1–F3 off-limits). |

## Slice Plan (risk-ordered; each = own commit + consumer-scan + gate + PR comment + `commits.md`)

| Slice | Scope | Risk | Gate focus |
|-------|-------|------|------------|
| **G1-0** | Relocate `AGENTS-handoff.md` → `openhands-handoff` skill; re-point 3 refs; delete root file; regen `.claude/` mirror. | low | `validate-claude-surface.ts` green; grep no dangling `AGENTS-handoff` refs. |
| **G1-1** | Tracked-cruft sweep: tracked `.bak`/`.tmp`/build leftovers + orphaned `.md` (no nav/README/CI link). | low | grep refs (CI/tasks/markdown links) before each delete. |
| **G1-2** | Internal back-compat shims: S1 telemetry `job.ts` re-export, S2 CLI `windows.ts` 8 deprecated constants, S7 `workspace-mutator.ts` deprecated config path. | low–med | consumer scan each; scoped check/test. |
| **G1-3** | `@netscript/database` public deprecated API: S3, S4, S5. | med (public) | per-unit consumer scan + `deno doc --lint` + `publish:dry-run`. |
| **G1-4** | `@netscript/fresh` public deprecated options: S8. | med (public) | option consumers + `deno doc --lint` + dry-run. |
| **G1-5** | `plugin-workers-core` public deprecated recurring-job API: S6. | **high** | scaffold-template scan + full `e2e:cli scaffold.runtime`. |
| **G1-6** | Dead-code sweep (PR-6 proof) across remaining surfaces. | med | import-graph + grep proof per removal; scoped check/test. |

> Slices are independent where possible; G1-5 is the single high-risk slice and is gated on a full
> `scaffold.runtime` E2E. If any public-surface removal proves consumer-breaking beyond cleanup
> scope, record drift and escalate rather than expanding scope silently.

## Risk Register

| Risk | Mitigation |
|------|------------|
| Removing a shim breaks a consumer (cli/plugins/scaffold output) | Consumer/import scan per removal (PR-2); `e2e:cli` at merge-readiness. |
| Deleting a "dead" file that is actually referenced (docs links, CI, tasks) | Grep refs (incl. CI/tasks/markdown links) before delete (PR-6). |
| Dropping a referenced root doc (`AGENTS-handoff.md`) | PR-4 relocates content into the skill **before** delete; `validate-claude-surface.ts` gate. |
| Regressing `publish:dry-run` / slow-types | Re-run `publish:dry-run` after removals (esp. G1-3/4/5). |
| Removing a functional workaround mistaken for a shim | PR-5 fences F1–F3 off-limits. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
|----|--------|------|
| Backward-compat shims/aliases (L-no-backcompat) | existing | resolve (delete all back-compat aliases S1–S8) |
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
