# Context Pack: scaffold TypeScript project boundaries (#1016)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1016-scaffold-tsconfig--project-boundary` |
| Branch | `fix/1016-scaffold-tsconfig` |
| Current phase | `implement` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Current State

PLAN-EVAL passed in the owner-designated separate Opus 5 supervisor session. The implementation and all targeted/scoped/consumer gates are complete. The canonical runtime gate ran once and failed at the pre-existing Aspire certificate-trust environment boundary before database initialization.

## Completed

- Loaded requested skills/doctrine/harness gates.
- Reproduced Prisma exit 1 and Vite SSR failure under an invalid parent `extends`.
- Prototyped root/app self-contained configs: Prisma passes, SSR returns HTTP 200, Deno check remains exit 0.
- Locked one implementation slice and its gate set.
- Implemented the two generators/writes and semantic tests.
- Targeted tests, scoped wrappers, quality/doctrine, doc lint, publish dry-run, and real parent A/B completed.

## In Progress

- Slice review/sign-off and IMPL-EVAL; runtime gate environment failure must remain explicit.

## Next Steps

1. Complete opposite-family slice review and sign-off commit.
2. Push/comment the implementation slice and update the PR body with verbatim A/B evidence.
3. Run owner-designated separate Opus 5 IMPL-EVAL without claiming the failed runtime gate green.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Root `{ "files": [] }` | plan D1 | Minimal Deno-neutral boundary. |
| App bundler/Preact options plus `files: []` | plan D2 | Proven Vite/Fresh SSR boundary without editor overreach. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-1016-scaffold-tsconfig--project-boundary/*` | changed | Harness plan, evaluator verdict, implementation evidence, and drift. |
| `packages/cli/src/kernel/**/tsconfig.ts` | new | Tier-1 root/app generators. |
| Scaffold constants/writers/tests | changed | Emits and semantically verifies both project boundaries. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | Targeted tests and all three scoped wrappers green. |
| Fitness | PASS with pre-existing warnings | Quality gate exit 0; CLI doc-lint/publish dry-run exit 0. |
| Runtime | FAIL (environment) | One-pass gate: 16 pass, database.init fail on Aspire cert trust timeout, cleanup pass. |
| Consumer | PASS | Fresh generated project: DB generation exit 0, Deno check exit 0, SSR HTTP 200. |

## Open Questions

- Whether the runtime gate must be rerun on an Aspire-capable host before merge; this session obeyed the instruction to run it once and will not silently retry.

## Drift and Debt

- Drift: Vite failure is request-time SSR, not startup-time; the former local evaluator credential item is resolved by owner waiver.
- Debt: no new or deepened architecture debt.

## Commits

- See the draft PR's commit list + per-slice PR comments.
