# Plan: issue #303 public-surface doc-lint remainder

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `beta5-impl--supervisor` |
| Branch | `chore/303-enterprise-surface-sweep` |
| Phase | `plan` |
| Target | publishable `@netscript/*` packages/plugins under `packages/` and `plugins/` |
| Archetype | Mixed: package archetypes 1-7 plus plugin archetype 5 |
| Scope overlays | frontend/service only where existing packages already expose those surfaces; no new behavior |

## Archetype

This is a cross-repo public-surface hygiene slice. Each touched root keeps its existing doctrine
archetype from `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md`; no package is
restructured. Plugin roots use Archetype 5. Package roots use their current Archetype 1-7 assignment.

## Current Doctrine Verdict

Doctrine file 10 lists mixed verdicts across the repo. This slice does not close structural debt.
It enforces A1/A14 public-surface publishability by fixing documentation, explicit export types, and
private-type leaks in place.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1 | Public types are the product and must be documented/type-explicit before publish. |
| A2 | Published boundaries must stay simple; no API redesign unless explicitly deferred. |
| A9 | Existing package archetypes stay intact during the sweep. |
| A14 | `deno doc --lint` and `publish:dry-run` are the gate, not optional polish. |

## Goal

Make the full export map of every publishable `@netscript/*` package/plugin doc-lint clean and make
`deno task publish:dry-run` clean without adding unsanctioned slow-types allowances.

## Scope

- Run full-export-map doc lint for all 35 publishable roots.
- Fix missing JSDoc, missing explicit export return/types, and trivial private-type leaks.
- Run publish dry-run and preserve the single sanctioned oRPC-bound slow-types allowance from
  commit `86eca907`.
- Verify accepted casts and plugin service seam `any` residue; fix only trivial leaks.
- Keep `notes.md` at repo root for stop/deferral items.

## Non-Scope

- DB layer changes owned by ROUTE-TO-PRISMA.
- AI stack re-architecture owned by #238.
- Stale-file deletion owned by #307.
- Doctrine prose owned by #305.
- `deno task e2e:cli`; the supervisor triggers runtime smoke at merge readiness.

## Hidden Scope

- Each package's `deno.json` export map must be linted across every subpath.
- TSX/Fresh UI public surfaces are included where publishable.
- `deno.lock` must remain unchanged; any lock churn is reverted and noted.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| LD-1 | Use `.llm/tools/run-deno-doc-lint.ts` / `deno task doc:lint` for doc-lint evidence. | It discovers the full export map and attributes findings by entrypoint/file. |
| LD-2 | Treat `86eca907` as the only sanctioned slow-types exception. | The user brief and doctrine file 02 explicitly authorize only that oRPC-bound carve-out. |
| LD-3 | Defer public API redesigns to `notes.md`. | This slice is documentation/type hygiene, not a surface redesign wave. |
| LD-4 | Commit by package cluster with PR comments after each push. | Required harness commit-trail rule and keeps reviewable slices small. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Whether to add new slow-types allowances | resolved: no | New allowances are prohibited. |
| Whether to delete stale files surfaced by lint | resolved: no | #307 owns stale-file deletion; fix in place only. |
| Whether to run CLI E2E | resolved: no | User explicitly prohibited `deno task e2e:cli`. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Doc-lint exposes private-type leaks that require API redesign. | Stop on that item, record in `notes.md`, and continue independent trivial fixes. |
| Publish dry-run mutates `deno.lock`. | Inspect and revert lock churn; record in `notes.md`. |
| Large multi-package sweep becomes unreviewable. | Slice by package cluster and comment gate evidence after each push. |
| Sibling subpath false-flags from `mod.ts`-only lint. | Always lint full export maps. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-14 | risk | Do not add upstream re-export shortcuts while fixing docs/types. |
| AP-22 | risk | Do not introduce sub-barrels; edit existing entrypoints in place. |
| Public private-type leak | risk | Fix trivial exported type annotations; defer redesigns. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-5 | yes | Full-export-map doc-lint summary per package. |
| F-6 | yes | `deno task publish:dry-run` clean, with only sanctioned allowance. |
| F-7 | yes | `deno doc --lint` zero diagnostics over planned publish surface. |
| F-19 | yes | Scoped check/lint/fmt wrappers over `packages` and `plugins`. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| Existing oRPC slow-types carve-out | preserve | Do not remove commit `86eca907` allowance. |
| New API redesign needed for slow types | defer in `notes.md` | Do not create broad doctrine debt unless supervisor directs. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | doc-lint inventory | `deno task doc:lint --root <root> --pretty` for every publishable root | Zero diagnostics or actionable findings before fixes. |
| 2 | scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages --root plugins --ext ts,tsx` | PASS. |
| 3 | scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages --root plugins --ext ts,tsx` | PASS. |
| 4 | scoped fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages --root plugins --ext ts,tsx` | PASS. |
| 5 | publish dry-run | `deno task publish:dry-run` | PASS with no unsanctioned slow-types allowance. |
| 6 | workspace check | `deno task check` | PASS. |
| 7 | workspace tests | `deno task test` | PASS. |

## Dependencies

- Deno 2.9 workspace tooling.
- GitHub CLI for draft PR, labels, milestone, and comments in this clone.

## Drift Watch

- Any evaluator launch fallback.
- Any package requiring public API redesign.
- Any lockfile churn.
- Any package excluded from the full-export-map sweep.
