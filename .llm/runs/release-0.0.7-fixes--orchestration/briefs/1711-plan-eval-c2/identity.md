# PLAN-EVAL cycle 2 — identity and transport, recorded BEFORE launch

| Field | Value |
| --- | --- |
| Cycle | **2** (final; no cycle 3) |
| Target | issue **#1112**, draft PR **#1711** |
| Immutable plan head | `da769cd7c8e0438f2317ed761ec10bce15692d03` — verified local == remote == PR, clean incl. untracked |
| Base | `main@cf648f1ff973d74c213bb125a6f5f5b9328e693b` |
| Selection rationale | **Risk-selected critical** under the owner's narrowed policy: changes a published Prisma integration boundary and generated-client compatibility |
| Generator (author) | Codex `01a047f1-56bf-7060-b9c4-dbc5dc4ad2a8`, `gpt-5.6-sol` · high — **not resumed**, kept available |
| Cycle-1 evaluator | session `29284a3f-…` — **stopped and released** after its terminal `FAIL_PLAN`; not reused |
| Requested route | native Claude `claude-fable-5` · **medium** · `--remote-control` |
| Transport | `claude --bg` daemon/background route — the one that registers a job, session, bridge, and RC URL |
| providerEnv | **empty** |
| Evaluator worktree | `/home/codex/repos/netscript-007-eval-1711-c2` — **distinct** from the cycle-1 worktree, which is preserved so its artifact commit `5b58738ab` stays reachable |
| Brief | `briefs/1711-plan-eval-c2/plan-eval.md`, 5640 bytes, sha256 `1b44d925190adcef…` |

**Four-way distinctness** holds: author (Codex `01a047f1`), topic supervisor (Claude Opus 5,
`ea346a9a-…`), cycle-1 evaluator (`29284a3f-…`, stopped), and this cycle-2 evaluator are four separate
sessions. Generator ≠ evaluator by family as well as by session.

**Scope is bounded** to the repaired F1 architecture and the five Tier-A claims. The brief explicitly
lists what cycle 1 accepted and forbids re-litigating it.

**Preconditions verified before launch:** plan head identical three ways, worktree clean including
untracked, **zero** active `#1711`/`#1112` evaluator sessions, Docker **0**, no runtime lease.

Observed route recorded below after launch, proven from the registered job state — not from the
`--remote-control` flag, which is what made cycle 1's first attempt wrong.

## Observed route — after launch. **ATTACHED**

| Field | Value |
| --- | --- |
| Background job id | **`18b66c8f`** |
| Session id | **`18b66c8f-ebab-441e-9707-0d31a507dff8`** |
| Bridge session id | **`cse_01EQXNxAuAuhDuRKvGYBx5iY`** |
| Remote Control URL | **`https://claude.ai/code/cse_01EQXNxAuAuhDuRKvGYBx5iY`** |
| `bridgeOutboundOnly` | **`false`** — mandatory attachment gate satisfied |
| Backend / PID / State | `daemon` / `363143` / `working` |
| cwd | `/home/codex/repos/netscript-007-eval-1711-c2` — the distinct cycle-2 worktree |
| `providerEnv` | **`{}`** — empty |
| `respawnFlags` | `--effort medium --remote-control --permission-mode bypassPermissions --model claude-fable-5` |
| Route verdict | **matched** — native Claude Fable 5 · medium · Remote Control |

Attachment claimed on `bridgeOutboundOnly: false` **plus** non-empty `bridgeSessionId` **plus** matching
cwd — the evidence `claude-manager` requires — not on the `--remote-control` flag alone.

Exactly one evaluator is live (`claude agents --json` shows a single `#1711` session). The cycle-1
worktree is preserved untouched so its verdict artifact `5b58738ab` remains reachable.
