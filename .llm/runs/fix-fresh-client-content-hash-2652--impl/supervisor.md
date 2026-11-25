# Supervisor Identity — fix-fresh-client-content-hash-2652--impl

Written at run start by the batch coordinator. Machine paths, hosts, users and session identifiers
are intentionally not recorded in this run's committed artifacts.

| Field | Value |
| --- | --- |
| Model | Claude Opus 5.5 (`claude-opus-5-5`), effort `xhigh` — topic coordinator for this issue batch |
| Session | T3 coordinator thread (identifier not recorded) |
| Host | not recorded |
| Checkout | repository root |
| Worktree | T3-provisioned isolated worktree for this lane (path not recorded) |
| Branch | `fix/fresh-client-content-hash-2652` |
| Baseline | `87965d800b7d61312e8612c82bdb0cb98bdf5b29` (`main`, 2026-11-24); `v0.0.10-canary.4` = `7c51c7efb64cbf65c567232245c13fea69f45fe4` |
| Run ID | `fix-fresh-client-content-hash-2652--impl` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `feature/implementation` | providerInstanceId `codex`, model `gpt-6.2-sol`, options `{reasoningEffort: 'xhigh'}` via T3 `delegate_task`, isolation `worktree` | builder (OpenAI family) |
| `feature/implementation_evaluation` | Claude Opus 5.5 (`claude-opus-5-5`, effort `xhigh`), the batch coordinator acting as a different-family reviewer (Anthropic vs OpenAI) | IMPL-EVAL at the exact PR head (Anthropic family) |

Reference `.llm/harness/workflow/lane-policy.md`; its route table is not copied here.

## Recorded lane/eval overrides

- **Owner matrix override (builder):** providerInstanceId `codex`, model `gpt-6.2-sol`, options `{reasoningEffort: 'xhigh'}`. Verbatim grant in `worklog.md` § Owner model
  authorization.
- **Owner matrix override (evaluator):** Claude Opus 5.5 (`claude-opus-5-5`, effort `xhigh`), the batch coordinator acting as a different-family reviewer (Anthropic vs OpenAI). Same grant.
- **Transport:** T3 `delegate_task` instead of the `.llm/tools/agentic/` launcher; the owner
  explicitly authorized T3 dispatch for this batch.
- Mirrored in `drift.md`.
