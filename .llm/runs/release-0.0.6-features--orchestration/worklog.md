# Worklog — 0.0.6 runtime / public-surface lane

## 2026-08-12 — Stage A, bootstrap

**Identity / worktree proof.**

| Check | Command | Result |
| --- | --- | --- |
| Branch | `git rev-parse --abbrev-ref HEAD` | `chore/release-0.0.6-features-orchestration` |
| HEAD | `git rev-parse --short HEAD` | `01aa12b67` |
| Tree | `git status --porcelain` | clean at open |
| Remote | `git fetch origin main` | `origin/main@01aa12b67` — lane starts at tip |
| Runtime | `deno task agentic:runtime doctor` | `no_change (schema 1.0)`; components 18; **sessions 0** |

Zero live agentic sessions at open, so no collision risk when the first implementation session
launches.

**Issue re-baseline (live bodies fetched, not recalled).**

| Issue | State | Milestone | Labels | Acceptance boxes |
| --- | --- | --- | --- | --- |
| #1405 | OPEN | 26 / `0.0.6` | `type:fix`, `area:plugins`, `status:triage`, `priority:p2` | 5, all unticked |
| #1398 | OPEN | 26 / `0.0.6` | `type:fix`, `area:plugins`, `area:telemetry`, `status:triage`, `priority:p1` | 4, all unticked |

Both still carry `status:triage` and no assignee — neither has been started by another lane.

**Predecessor state.** PR #1395 merged 2026-08-09T01:25:15Z; PR #1402 merged 2026-08-09T05:11:32Z.
Both are ancestors of the baseline, so #1398 is being planned against the landed envelope and the
landed reconnect supervisor, not against their PR branches.

**Evaluator-transport precondition.** `gh pr view 1524` → **OPEN**, `mergedAt: null`. Its own DoD
still has `Bounded live DeepSeek smoke` and `Repository default variable is updated` unticked. The
brief's OpenHands eval route is conditional on #1524 passing/landing, so this run falls back to
fresh local sessions. Recorded as `drift.md` D-2; re-checked before each eval dispatch.

**Research.** #1405 researched in-session (small, fully specified) →
`slices/research-1405.md`, both defects confirmed at exact call sites with a line-cited call-site
table for `#failActive`. #1398 research delegated to a Claude Opus sub-agent (read-only, `drift.md`
D-1 records the lane override) — report pending.
