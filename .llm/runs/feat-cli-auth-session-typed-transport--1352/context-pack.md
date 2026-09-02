# Context Pack: CLI auth-session typed credential transport

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-cli-auth-session-typed-transport--1352` |
| Branch | `feat/cli-auth-session-typed-transport` |
| Current phase | `IMPL-EVAL` |
| Archetype | `6 - CLI Tooling`; SDK boundary `2 - Universal Library` |
| Scope overlays | `none` |

## Current State

Live issue #1352 was audited at baseline `37452f11f`. Rows 1 and 3-7 were shipped by PR #1915. The
residual row 2 is now implemented through the PLAN-EVAL-approved narrow path: application code
supplies typed caller context, and `FetchAuthSessionHttp` uses the public auth-core bearer
contribution protocol for credential preparation while retaining its two caller-supplied exact URLs.
The public SDK has no exact-origin override, so this deliberately does not claim a full discovery
transport migration.

## Completed

- Required skills, harness workflow, archetype, gates, doctrine, live issue, merged PR, and PR
  evaluation evidence read.
- Pre-write seven-row audit and SDK public-surface `deno doc` inspection completed.
- Design checkpoint and plan recorded.
- Independent PLAN-EVAL passed in Claude Fable 5 medium session
  `0a21b6d5-3914-41b8-8e75-b78617e78574`; it ruled the narrow composition sanctioned and required
  honest URL-derived transport facts plus a focused redaction regression.
- Product slices committed and pushed: `8bd0e117c` typed adapter preparation and `9fad445ab`
  application context wiring.
- Focused tests passed 14/14 and full package-owned CLI tests passed 1233/1233.
- CLI check, final doc lint, package dry run, JSDoc examples, quality, architecture, source-boundary,
  and lock gates passed. Doc A/B delta is zero; lock is unchanged.
- Exact lint/fmt wrapper exit-2 baseline defect is documented, with zero findings and passing
  changed-file checks.

## In Progress

- Fresh independent IMPL-EVAL against the complete evidence set.

## Next Steps

1. Commit/push merge-readiness evidence.
2. Run a fresh Claude Fable 5 medium IMPL-EVAL and record `evaluate.md`.
3. If all seven rows pass, add exactly one acceptance-evidence block, use `Closes #1352`, and mark
   PR #1931 non-draft. Otherwise keep `Refs #1352` and state the remaining scope.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| No SDK surface widening | `plan.md` D1/D6 | Full exact-URL SDK migration is not currently expressible. |
| Narrow typed credential migration | `plan.md` D2-D4 | Satisfies caller context, canonical bearer logic, and no server-only import. |
| Preserve URL defect ownership | `plan.md` D5 | Reference #1243; do not fix it. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/feat-cli-auth-session-typed-transport--1352/**` | modified | Audit, plan/eval, implementation, drift, and resumable gate evidence |
| `packages/cli/src/public/features/plugins/auth/auth-types.ts` | modified | Typed caller context and optional request options |
| `packages/cli/src/public/features/plugins/auth/auth-session-client.ts` | modified | Public bearer contribution prepares headers for exact URLs |
| `packages/cli/src/public/features/plugins/auth/auth-session-client_test.ts` | new | Credential, URL, redaction, and import-boundary regressions |
| `packages/cli/src/public/features/plugins/auth/auth-plugin-command.ts` | modified | Application context resolver wiring |
| `packages/cli/src/public/features/plugins/auth/auth-plugin-command_test.ts` | modified | Context propagation regression |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS with disclosed baseline wrapper defect | check exit 0; doc A/B +0; lint/fmt wrapper exit 2/zero findings, changed-file checks exit 0 |
| Fitness | PASS | quality and arch exit 0; JSDoc 357/357, `unboundName=116` |
| Runtime | PASS | focused 14/14; package-owned 1233/1233; prohibited external gates not run |
| Consumer | PASS | CLI publish dry-run exit 0, 646 files, 7 existing dynamic-import warnings |

## Open Questions

- Independent evaluator must decide whether the disclosed lint/fmt baseline defect blocks merge
  readiness and independently confirm the narrow row-2 interpretation.

## Drift and Debt

- Drift: `rtk` absent; mandated lint/fmt wrapper ownership mismatch; reverted import-map experiment.
- Debt: none proposed.

## Commits

- `80a53ad42` audit/plan, `8bd0e117c` typed adapter, `9fad445ab` application wiring.
- Draft PR: #1931 with required labels and milestone 0.0.7.
