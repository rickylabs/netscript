# Context Pack: S1 / Wave 0 Foundation (@netscript/shared)

## Run Metadata

| Field | Value |
|-------|-------|
| Run ID | `feat-package-quality-wave0-foundation--shared` |
| Branch | `feat/package-quality-wave0-foundation` |
| Current phase | `implement` |
| Archetype | `A1 - small-contract` |
| Scope overlays | `docs` |

## Current State

Implementation and docs are complete for `packages/shared`. The published surface is root-only,
barrel-only, backed by `src/**`, and excludes the legacy `utils/` folder from the JSR publish set.
Package doc lint, publish dry-run, package tests, package-scoped standards, and root `deno task
check` pass.

## Completed

- Read harness workflow, supervisor plan, phase registry, Wave 0 scaffold, stale shared plan/evaluation, standards, public surface patterns, docs structure, doctrine 01..10, A1 gate matrix, and architecture debt registry.
- Ran `deno run -A tools/fitness/release-readiness.ts --out ./audit --include-plugins`.
- Ran `deno publish --dry-run --allow-dirty` in `packages/shared`.
- Verified current consumers of `@netscript/shared` and `@shared/utils`.
- Recorded Design checkpoint before implementation edits.
- Moved the published surface into `src/domain`, `src/application`, `src/diagnostics`, and
  `src/public`.
- Replaced public dependency class signatures with package-owned schema/procedure types.
- Added README and package `/docs` structure.
- Ran final gates.

## In Progress

- Ready to commit implementation/docs slice and update PR #3.

## Next Steps

1. Commit implementation/docs slice.
2. Push branch.
3. Comment on PR #3 with slice summary and gates.

## Key Decisions

| Decision | Source | Notes |
|----------|--------|-------|
| Remove `./utils` from published exports/includes. | Doctrine AP-16 and plan_shared folder vocabulary target. | Physical `utils/` deletion deferred to avoid cross-wave plugin edits. |
| Keep `baseContract` published. | Existing plugin contracts import it from `@netscript/shared`. | Must avoid inferred slow types with an explicit or structural type. |
| Use explicit object types instead of public `z.infer`. | `deno doc --lint` private-type-ref failures. | Applies to pagination and error payloads. |

## Files Changed

| Path | Status | Notes |
|------|--------|-------|
| `.llm/tmp/run/feat-package-quality-wave0-foundation--shared/worklog.md` | new | Design checkpoint and baseline evidence. |
| `.llm/tmp/run/feat-package-quality-wave0-foundation--shared/context-pack.md` | new | Resumable run state. |
| `.llm/tmp/run/feat-package-quality-wave0-foundation--shared/drift.md` | new | Drift log. |
| `.llm/tmp/run/feat-package-quality-wave0-foundation--shared/commits.md` | new | Commit tracker. |
| `packages/shared/mod.ts` | modified | Root barrel-only public entry. |
| `packages/shared/deno.json` | modified | Root-only exports, strict compiler options, publish include/exclude. |
| `packages/shared/src/**` | new | Published implementation split. |
| `packages/shared/README.md` | modified | Mandated docs sections and examples. |
| `packages/shared/docs/**` | new | Package docs structure. |
| `packages/shared/contracts.ts` | deleted | Stale published-surface predecessor replaced by `src/**`. |

## Gates

| Gate family | Current status | Evidence |
|-------------|----------------|----------|
| Static | passing | publish dry-run 0 slow-types; doc lint clean; package standards exits 0 |
| Fitness | passing with residual warnings | naming/test-location warnings remain for legacy unpublished `utils/` |
| Runtime | n/a | A1 small contract |
| Consumer | passing | `deno task check` green |

## Open Questions

- Evaluator should confirm acceptance of retaining the physical unpublished `utils/` folder for later-wave consumer migration.
- Evaluator should note that exact root standards command without `--root` fails on repository-root metadata outside Wave 0, while package-scoped standards passes.

## Drift and Debt

- Drift: current package version and audit output layout differ from stale plan; plugin import maps still reference `@shared/utils`.
- Debt: existing `packages/shared` AP-2/AP-1 datetime debt remains physically present but will be removed from the published surface in this wave.

## Commits

- `27b4bf3`: `chore(shared): record wave0 design baseline`
