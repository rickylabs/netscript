# Supervisor

- Run: `fix-1026-aspire-agent-wiring--discoverability`
- Model/session: Codex GPT-5 primary session
- Host/worktree: Linux, `/home/codex/repos/fix-1026`
- Branch: `fix/1026-aspire-agent-wiring`
- Baseline: `3ab64720f` (`origin/main`)

## Lane assignments

| Work | Route | Session invariant |
| --- | --- | --- |
| Research and plan | primary Codex supervisor | generator only |
| PLAN-EVAL | canonical open-model evaluator route from `workflow/lane-policy.md` | separate session |
| Implementation | primary Codex supervisor, normal implementation | cannot self-evaluate |
| Slice review | opposite-family review route | separate reviewer before sign-off |
| IMPL-EVAL | canonical open-model evaluator route | separate session from generator and PLAN-EVAL |

No routing override is authorized or currently needed.
