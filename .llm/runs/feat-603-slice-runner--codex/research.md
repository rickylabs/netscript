# Research — issue #603

- `launch-codex-slice.ts` already owns brief validation, git safety, RouteIdentity comparison,
  sender ownership, launch transport, and thread parsing. The runner should delegate launch to it.
- `codex-resume.ts` establishes the safe one-resume command shape.
- Issue #604's pure classifier is already present as `classify-codex-failure.ts`; volatile regexes
  already have their single home in `config/codex-failure-patterns.ts`.
- `LocalSenderOwnershipAdapter` persists the one-sender-per-canonical-worktree record and exposes
  the active session id needed to validate attach mode.
- This is internal infrastructure tooling, so package/plugin archetypes and jsr-audit are N/A.
