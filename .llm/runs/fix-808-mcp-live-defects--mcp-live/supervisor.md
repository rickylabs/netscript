# Supervisor Identity — fix-808-mcp-live-defects--mcp-live

Written at run start per `workflow/lane-policy.md` § Supervisor identity.

| Field | Value |
| --- | --- |
| Model | Codex (runtime model identifier not exposed to the session) |
| Session | current Codex workspace session |
| Host | `YogaBook9i` · WSL2 Linux · user `codex` |
| Checkout | `/home/codex/repos/b10-808` |
| Worktree | `/home/codex/repos/b10-808` |
| Branch | `fix/808-mcp-live-defects` |
| Baseline | `7bc256a1f1ed9f2ee7bafb78c37917e59909ffe9` (`origin/main`, 2026-07-17) |
| Run ID | `fix-808-mcp-live-defects--mcp-live` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `complex_implementation` | Codex · OpenAI · session-selected model/effort | Three release-blocking runtime fixes and live proof |

## Recorded lane/eval overrides

- Owner directive: “Do NOT dispatch evals; do not merge.” This is treated as the written
  Plan-Gate waiver allowed by `workflow/run-loop.md` §4. No PLAN-EVAL or IMPL-EVAL session will be
  launched, and no evaluator verdict will be claimed. The draft PR remains at `status:impl-eval`.
