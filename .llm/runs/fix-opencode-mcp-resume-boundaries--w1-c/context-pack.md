# Context Pack: OpenCode MCP attachment and provider-valid resume

## Run Metadata

| Field          | Value                                      |
| -------------- | ------------------------------------------ |
| Run ID         | `fix-opencode-mcp-resume-boundaries--w1-c` |
| Branch         | `fix/opencode-mcp-resume-boundaries`       |
| Current phase  | `terminal-handoff`                         |
| Archetype      | N/A — internal agentic infrastructure      |
| Scope overlays | none                                       |

## Current State

Implementation, trustworthy gates, and independent evaluation are complete. The branch contains
deterministic generated MCP translation/overlay, a bounded provider-visible MCP preflight,
privacy-safe discovery/history receipts, provider-boundary normalization before every dispatch,
explicit session resume, and the same attachment/guard in web/eval/hybrid children. Live measured
MCP and real OpenRouter resume rows pass. The draft PR remains under milestone-orchestrator
authority.

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
- Separate DeepSeek V4 Flash 0731/max session `b332e8ae-d235-4923-80de-82cbb8b016be` returned PASS;
  `evaluate.md` is committed at `67a0bf33d`.
- Review-thread gate passed with 0 threads/unanswered; current-head PR checks passed with 0 current
  failures.
- Both live issue acceptance checklists are checked with evidence; PR #1344 remains draft at
  `status:impl-eval` with milestone `0.0.5`.
- Root lock is byte-identical to baseline `d32ef0c1…`.

## In Progress

- None in the implementation worktree.

## Next Steps

1. Milestone orchestrator reviews the draft evidence and owns any ready transition.
2. Do not repeat the valid IMPL-EVAL PASS, mark ready, merge, or start a release from this run.

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
| IMPL-EVAL    | PASS           | `evaluate.md`; separate DeepSeek/max session               |

## Open Questions

- None.

## Drift and Debt

- Drift: stale coordination details; exact host debug seam excludes MCP; transient run-owned lock
  mutation detected/reversed before staging. All are fully recorded in `drift.md`.
- Debt: none.

## Commits

- S0 `c9a152277`; PLAN-EVAL artifact `bf36fc75b`; implementation/evidence `219814909`; evaluator
  brief `c0bbb0863`; IMPL-EVAL PASS artifact `67a0bf33d`.
