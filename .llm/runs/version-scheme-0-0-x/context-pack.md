# Context Pack: `0.0.x` release scheme

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `version-scheme-0-0-x` |
| Branch | `chore/version-scheme-0-0-x` |
| Current phase | `implementation — owner-authorized plan evaluation` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `docs` |

## Current State

Research and Design are complete against `origin/main@8dca67985`. The selected local
Claude/OpenRouter PLAN-EVAL route remains unavailable because it has no OpenRouter credential. The
owner explicitly waived that automated lane, is evaluating the committed plan personally, and
authorized implementation to proceed. No PLAN-EVAL verdict is recorded or implied.

## Completed

- Loaded all owner-named skills plus repo-required RTK, JSR audit, and Claude manager guidance.
- Reproduced the 325-reference baseline and classified release-owned/current/historical surfaces.
- Identified nested-lock, generic Markdown-pin, CLI guard, and runtime-version derivation gaps.
- Selected Archetype 6 with Docs overlay and locked four sequential commit slices.

## In Progress

- S1–S4 implementation and owned gates are complete. Separate-session IMPL-EVAL remains required;
  the PR stays draft and no implementation verdict is self-recorded.

## Next Steps

- Update the draft PR with the final tier table, `Closes #996`, and gate evidence.
- Run the harness IMPL-EVAL in a separate evaluator session.

1. Execute S1–S4 from the committed plan.
2. Keep the PR draft until the required release dry-run proof and final evaluation are complete.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Derive/make-derivable/literal-only-last | Owner brief | Applies per occurrence. |
| Preserve historical shipped refs | Owner non-scope | Beta.5/7/10 incidents and fixtures remain. |
| Include tracked nested locks | Research + D3 | Fixes invisible Fresh UI beta.11 residue. |
| Generic, blocking Markdown pins | Research + D5 | Protects `0.0.2` → `0.0.3` and docs/site. |
| Pre-1.0 maturity terminology | Owner scheme + D8 | Normal `0.0.x` is no longer a beta prerelease. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/version-scheme-0-0-x/{supervisor,research,plan,worklog,context-pack,drift}.md` | new | Harness bootstrap/plan artifacts |
| `.llm/runs/version-scheme-0-0-x/codex-thread-ids.md` | new (launcher-owned) | Route/session provenance |
| `.llm/tools/deps`, `.llm/tools/release`, `.github/workflows/release-canary.yml` | modified | Nested-lock and generic release-pin policy |
| `packages/cli/src/**` tests | modified | Generic guard plus derived/version-neutral fixtures |
| `.llm/tools/generate-publish-assets.ts`, package generated metadata | modified/new | Runtime version derivation for core packages |
| `packages/mcp`, `packages/plugin-{sagas,streams}-core` | modified | Generated runtime version consumers |
| `packages/fresh-ui/deno.lock` | regenerated | Native Deno reconciliation; beta.11 removed |
| `.llm/tools/run-deno-{lint,fmt}.ts` | modified | Explicit package-config passthrough for trustworthy scoped gates |
| Root/docs/RFC/resources/skills and mirrors | modified | Normal `0.0.x` policy and pre-1.0 maturity language |
| CLI embedded assets and fixture tests | modified/generated | Frozen release literals deleted or derived |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | Baseline PASS | Census and raw Git evidence in `worklog.md` |
| Fitness | Owner evaluation in progress | Automated PLAN-EVAL unavailable; no verdict recorded |
| Runtime | Degraded | Runtime controller cannot prove mobile attachment |
| Consumer | NOT_RUN | Release dry-run reserved for S4 |

## Open Questions

- None blocking implementation under the recorded owner authorization.

## Drift and Debt

- Drift: seven entries in `drift.md`, including the blocking evaluator-route failure.
- Debt: none created; existing package debt is not deepened by the plan.

## Commits

- See the draft PR's commit list + per-slice PR comments after the plan commit is pushed.
