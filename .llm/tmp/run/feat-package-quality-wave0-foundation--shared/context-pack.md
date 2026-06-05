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

Baseline reading and re-audit are complete. `@netscript/shared` currently fails publish dry-run with
35 slow-type problems and fails doc lint with 106 errors. The current package is already
`0.0.1-alpha.0`, but it still publishes `./utils`, exposes inferred Zod public aliases, has a short
README, and lacks `/docs`.

## Completed

- Read harness workflow, supervisor plan, phase registry, Wave 0 scaffold, stale shared plan/evaluation, standards, public surface patterns, docs structure, doctrine 01..10, A1 gate matrix, and architecture debt registry.
- Ran `deno run -A tools/fitness/release-readiness.ts --out ./audit --include-plugins`.
- Ran `deno publish --dry-run --allow-dirty` in `packages/shared`.
- Verified current consumers of `@netscript/shared` and `@shared/utils`.
- Recorded Design checkpoint before implementation edits.

## In Progress

- Slice 1 commit: harness artifact creation and design checkpoint.

## Next Steps

1. Commit Slice 1 and comment on PR #3.
2. Implement the narrowed published surface under `packages/shared/src/**`.
3. Run slice gates and commit Slice 2.
4. Add README and docs structure, then run full gates.

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

## Gates

| Gate family | Current status | Evidence |
|-------------|----------------|----------|
| Static | baseline failing | publish dry-run 35 slow-types; doc lint 106 errors; standards 1 fail |
| Fitness | baseline failing/warn | F-5/F-6/F-7 fail; F-11 warn due legacy `utils/` |
| Runtime | n/a | A1 small contract |
| Consumer | pending | final `deno task check` required |

## Open Questions

- Whether the evaluator will accept retaining the physical unpublished `utils/` folder for later-wave consumer migration. This is logged as significant drift rather than silently treated as done.

## Drift and Debt

- Drift: current package version and audit output layout differ from stale plan; plugin import maps still reference `@shared/utils`.
- Debt: existing `packages/shared` AP-2/AP-1 datetime debt remains physically present but will be removed from the published surface in this wave.

## Commits

- Pending.
