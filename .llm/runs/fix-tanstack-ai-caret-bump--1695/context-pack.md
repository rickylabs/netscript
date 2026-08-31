# Context Pack: TanStack AI coherent family bump

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-tanstack-ai-caret-bump--1695` |
| Branch | `deps/tanstack-ai-caret-bump` |
| Current phase | `blocked finding during post-#1829 collision integration` |
| Archetype | `4 - Public DSL / Builder` |
| Scope overlays | `none` |

## Current State

Research and Plan & Design are complete, with `PLAN-EVAL: N/A` recorded before implementation. All
four pins and the lock are updated. TanStack 0.52's required activity context, name-less tool-end
event, and AG-UI usage-array changes are handled at the existing chat bridge with focused tests.
The prior integration was complete, but the owner subsequently released #1829 and authorized one
new collision pass. Then-current `origin/main` was fetched as `f59874abd`; its single merge is now
in progress with the two AI conflicts manually analyzed. #1829's own three-test filter returned RC
1 (2 pass, 1 fail), so owner instructions require an immediate stop without workaround or push.

## Completed

- Exact branch/base/current-main verification.
- Harness/doctrine/archetype/JSR bootstrap and baseline scan.
- Authoritative `deps:latest` stable-version lookup.
- Old/new `deno doc`, upstream changelog, call-site, model-ID, and current-main diff audit.
- Plan-Gate assessment with justified N/A.
- Coherent four-pin move and normal lock resolution.
- Breaking-change adaptations plus focused regressions.
- Intermediate structured check (101 files), tests (149), lint, format, quality, JSR, publish, and
  dependency audit evidence.
- One-time final main integration and authoritative rerun: 101 files check/lint/fmt clean, 152 tests
  pass, quality/JSR/publish/dependency audits RC 0.

## In Progress

- Nothing. The worktree intentionally remains in an uncommitted merge-conflict state pending owner
  and coordinator direction on the genuine #1829/TanStack 0.52 interaction.

## Next Steps

1. Owner/coordinator decides how #1829's direct `finishReason` expectation should interact with the
   TanStack 0.52 event-restoration contract.
2. Do not resume gates, commit, push, PR lifecycle, or IMPL-EVAL until that decision is supplied.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Stable targets come only from `deps:latest` | owner + toolchain skill | 0.52.0 / 0.18.3 / 0.3.8 / 0.22.3 |
| PLAN-EVAL N/A | `plan.md` | Bounded mechanical slice after compatibility research. |
| IMPL-EVAL external | owner | Supervisor dispatches after PR; this session stops. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-tanstack-ai-caret-bump--1695/*` | new | Harness bootstrap/research/plan evidence; launcher thread IDs preserved. |
| `packages/ai/deno.json` | modified | Four coherent stable caret pins. |
| `deno.lock` | modified | Resolved TanStack family closure; exact delta in `worklog.md`. |
| `packages/ai/src/adapters/tanstack-chat-client.ts` | modified | 0.52 activity/event compatibility. |
| `packages/ai/tests/tanstack_chat_client_test.ts` | new | Tool-end and usage-array regressions. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | integrated green | `worklog.md` |
| Fitness | integrated green except unchanged doc-lint baseline | `worklog.md` |
| Runtime | integrated green | 152 package tests |
| Consumer | integrated green | current-main Responses call sites included |

## Open Questions

- Blocking finding: `TanStack usage: a fully populated upstream object survives the owned boundary`
  receives `finishReason: undefined` instead of `"stop"` under the bumped dependency (RC 1).

## Drift and Debt

- Drift: launcher run-ID correction, unavailable `rtk`, stable version newer than brief example, and
  final main newer than the correction's snapshot.
- Debt: no new debt planned; existing JSR/doc/cardinality baseline must not worsen.

## Commits

- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).
