# Context Pack — #461

- Objective: per-request key/baseURL resolution across chat adapters, including Ollama host.
- Base: `fd0dafaf0d4fe2f60e037a547dd2e2fc8068eae3`.
- Branch/worktree: `feat/461-byok-seam` at `/home/codex/repos/ns-b8-461`.
- Current phase: implementation and generator gates complete under owner-waived PLAN-EVAL D1; commit/push next.
- Locked seam: `ChatClientCallOptions` → request-time adapter resolver in `toTanstackChatClient`.
- Required gates: scoped check/lint/fmt, unit tests, no-secret-leak tests, full export doc lint, architecture gate, publish dry-run.
- PR creation is forbidden; final result must be committed and pushed directly to the named branch.
- Evidence: 112 tests pass; scoped check/lint/fmt clean; 12-entrypoint doc lint clean; architecture gate clean for `packages/ai`; canonical publish dry-run exits 0.
