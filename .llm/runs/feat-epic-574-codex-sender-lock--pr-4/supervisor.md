# Supervisor: PR 4 — Codex single-sender lock + safe daemon recovery (#580)

| Field | Value |
| --- | --- |
| Run ID | `feat-epic-574-codex-sender-lock--pr-4` |
| Issue | #580 |
| Branch | `feat/epic-574-codex-sender-lock` |
| Worktree | `/home/codex/repos/netscript-epic-574-pr4-sender-lock` |
| Base (integration) | `rickylabs-epic-574-wsl-agentic-runtime` @ `fe3c63fb` (contains #579) |
| Archetype | 6 — CLI / Tooling |
| Coordinator | Claude Opus 4.8 (WSL supervisor) |

Lanes: Claude coordinator (Plan-Gate + Tier-A + merge); WSL Codex impl (mobile-visible, gpt-5.6-sol
high); external evaluator waived by owner (drift). Interactive mobile/sleep/network reconnect canaries
are owner-accepted-working per directive (2026-07-10). One sender per worktree.
