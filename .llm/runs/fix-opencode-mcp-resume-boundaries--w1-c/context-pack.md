# Context Pack: OpenCode MCP attachment and provider-valid resume

## Run Metadata

| Field          | Value                                      |
| -------------- | ------------------------------------------ |
| Run ID         | `fix-opencode-mcp-resume-boundaries--w1-c` |
| Branch         | `fix/opencode-mcp-resume-boundaries`       |
| Current phase  | `impl-eval`                                |
| Archetype      | N/A — internal agentic infrastructure      |
| Scope overlays | none                                       |

## Current State

Implementation and trustworthy gates are complete. The branch contains deterministic generated MCP
translation/overlay, a bounded provider-visible MCP preflight, privacy-safe discovery/history
receipts, provider-boundary normalization before every dispatch, explicit session resume, and the
same attachment/guard in web/eval/hybrid children. Live measured MCP and real OpenRouter resume rows
pass. Mandatory separate IMPL-EVAL is the remaining hard stop.

## Completed

- Required skills/harness workflow and GitHub publishing workflow read.
- Live #1324/#1330 bodies and #1324 follow-up read.
- `origin/main`, branch/worktree ownership, OpenCode 1.17.20, route policy, GitHub auth, and lock
  hash verified.
- Prepared coordination artifacts recovered from commit `3e757c273` and re-baselined.
- Minimax M3/high PLAN-EVAL session `f7af5fb2-d91d-4e58-bea3-2538195fc856`: PASS.
- Full #1324/#1330 fixture matrices implemented.
- Focused matrix 50/50; exact-head agentic suite 455/455.
- Scoped check/lint/fmt, volatile guard, and docs links pass.
- Real generated-project preflight and product turn prove two connected servers and two distinct
  NetScript MCP calls (one preflight, one product).
- Session `ses_023871aaeffehRNSqFc3I43Fvc` resumed successfully on 1/1 current OpenCode routes and
  emitted `provider_valid` before-dispatch evidence.
- Root lock is byte-identical to baseline `d32ef0c1…`.

## In Progress

- Independent DeepSeek V4 Flash 0731/max IMPL-EVAL through the checked-in local route.

## Next Steps

1. Commit/push the implementation and evidence slice; move PR/issues to `status:impl-eval`.
2. Run one separate DeepSeek V4 Flash 0731/max IMPL-EVAL and record `evaluate.md`.
3. Repair only an exact-head `FAIL_FIX`; never repeat a valid PASS.
4. Run thread/CI/exact-head/lock terminal gates, update PR/issues, and hand off the draft.

## Key Decisions

| Decision                             | Source              | Notes                                                    |
| ------------------------------------ | ------------------- | -------------------------------------------------------- |
| Inline final overlay                 | plan D3             | preserves external provider/permission/credential config |
| Pre-dispatch plugin                  | plan D4–D6          | no destructive session storage rewrite                   |
| Loopback status + provider preflight | drift + live source | pinned host exposes MCP tools only at provider dispatch  |

## Files Changed

| Path                                        | Status       | Notes                                                              |
| ------------------------------------------- | ------------ | ------------------------------------------------------------------ |
| `.llm/tools/agentic/opencode/**`            | new/modified | config, preflight, provider guard, run/session contracts and tests |
| `.llm/tools/agentic/claude/hybrid-*`        | modified     | isolated worker reuses attachment with narrow project read         |
| `.llm/tools/agentic/README.md`, `deno.json` | modified     | documented CLI and loopback/write permissions                      |
| run directory                               | modified     | plan/eval/live/drift/gate evidence                                 |

## Gates

| Gate family  | Current status | Evidence                                                   |
| ------------ | -------------- | ---------------------------------------------------------- |
| Plan         | PASS           | `plan-eval.md`; separate Minimax session                   |
| Static       | PASS           | 50 focused; 455 suite; 161-file check/lint/fmt; docs links |
| Runtime/live | PASS           | `live-acceptance.md`, `live-receipt.jsonl`                 |
| IMPL-EVAL    | pending        | separate DeepSeek/max session required now                 |

## Open Questions

- None; evaluator adversarial sweep pending.

## Drift and Debt

- Drift: stale coordination details; exact host debug seam excludes MCP; transient run-owned lock
  mutation detected/reversed before staging. All are fully recorded in `drift.md`.
- Debt: none.

## Commits

- S0 `c9a152277`; PLAN-EVAL artifact `bf36fc75b`; implementation/evidence commit is the evaluator
  target after push.
