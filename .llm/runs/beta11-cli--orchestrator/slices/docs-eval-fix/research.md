# Docs eval loop fix — research

Run: `beta11-cli--orchestrator`\
Slice: `docs-eval-fix`\
Lane: Codex GPT-5.6 Sol, medium (`normal_implementation`)\
Supervisor: Fable 5 orchestrator `86d308d5`

## Scope

Diagnose and repair the automated docs-accuracy workflow so eligible documentation PRs dispatch
OpenHands once when ready for review (or when explicitly re-requested), deduplicate durably per head
SHA, retain `docs-eval:skip` and `ci:full`, and surface one actionable failure without retriggering.

## Evidence

### Live failure correlation (GitHub API, 2026-07-18)

GitHub credentials were resolved in-process with `resolveGithubToken()` from
`.llm/tools/agentic/lib/agentic-lib.ts`; no token was written to disk or argv. PR metadata, workflow
runs, comments, jobs, and raw job logs were fetched through the GitHub REST API.

| PR   | Durable trigger comments | OpenHands summaries | Observed behavior                                                                   |
| ---- | -----------------------: | ------------------: | ----------------------------------------------------------------------------------- |
| #858 |                        1 |                   1 | One push-triggered eval; downstream run `29631090296` failed.                       |
| #861 |                       14 |                  14 | Fourteen head SHAs generated fourteen failed evals while the docs PR was iterating. |
| #862 |                       18 |                  17 | Eighteen head-SHA triggers and seventeen completed summaries at evidence time.      |

Representative upstream workflow run:
[`29631086400`](https://github.com/rickylabs/netscript/actions/runs/29631086400) succeeded after
posting #858's trigger. Its downstream OpenHands run
[`29631090296`](https://github.com/rickylabs/netscript/actions/runs/29631090296) failed before any
task verdict. The same failure signature repeated on #861 and #862.

Raw downstream job logs identify the actual execution failure:

```text
ModuleNotFoundError: No module named 'fastapi'
openhands.sdk.conversation.exceptions.ConversationRunError: ... No module named 'fastapi'
```

The failing environment installed LiteLLM 1.92.0 through the current OpenHands SDK. LiteLLM imported
its MCP proxy handler on the normal completion path, which imports FastAPI; the SDK installation did
not provide it. Bootstrap succeeded, the model/provider resolved to `openrouter/minimax/minimax-m3`
/ `OPENROUTER`, and the crash happened before the model call. This rules out model credits, timeout,
and authentication as the observed cause.

### Root causes

1. The docs workflow listened to `opened`, every `synchronize`, and every `labeled` event. Draft PR
   pushes therefore dispatched continuously instead of waiting for merge readiness.
2. Dedupe was intentionally revoked after any later `openhands-agent-summary`. Once a failed summary
   appeared, another event on the same head was allowed to post another trigger. Across new head
   SHAs, synchronize made the storm unbounded for the life of the draft.
3. The upstream check reported success after comment creation; the actionable failure appeared only
   in the downstream OpenHands workflow.
4. Every downstream agent turn crashed on the missing FastAPI runtime dependency.

### #806 lineage

PR #806 introduced the trusted-base prompt, PAT-only chain, `docs-eval:skip`, head-SHA marker, and
the prior "identical unanswered trigger" rule. Its review explicitly accepted rerunning after a
summary on later label churn. That original cost tradeoff conflicts with the owner's current
exactly-once/ready-only requirement and is superseded here; the trusted prompt, open-model guard,
PAT requirement, and escape hatch remain.

### Locked correction

- Events: `pull_request: ready_for_review` and an exact authorized PR comment `/docs-eval rerun`; no
  `opened`, `synchronize`, or `labeled` dispatch.
- Eligibility: `type:docs`, `area:docs`, or `ci:full`.
- Skip: `docs-eval:skip` produces an attributed successful summary and no marker/trigger.
- Dedupe: the first marker for a head SHA is permanent. A prior answer/failure never reopens the
  claim. Per-PR Actions concurrency serializes marker lookup + comment creation.
- Runner: install FastAPI explicitly so LiteLLM can enter its completion path.
- Failure: token/config/runner failure produces one red run and one workflow-owned actionable
  summary; no workflow event can automatically re-dispatch it.

## Stop-lines

1. No merge without green CI and opposite-family eval PASS.
2. No release publish, tag, canary, or stable action.
3. No milestone 13 closure.
4. Every sub-agent brief must repeat all stop-lines (no sub-agents are being dispatched here).
5. #824 remains drafts-only pending owner ratification.
