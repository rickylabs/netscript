# Dispatch record — docs-1778 (issue #1778, slice 1 of #1777)

Recorded in the **topic run** because a live worker whose only evidence sits untracked inside its own
leaf worktree is, from the coordinator's view, indistinguishable from no worker at all. That was the
gap on this dispatch: the thread existed and was working, and none of it was auditable from here.

## Worker — live, proven at 2026-08-30T17:4xZ

| Field | Value |
| --- | --- |
| Codex thread / session id | `01a05350-a6c4-7340-be12-c78a50141d74` |
| Rollout | `/home/agent/.codex/sessions/2026/08/30/rollout-2026-08-30T17-36-29-01a05350-a6c4-7340-be12-c78a50141d74.jsonl` |
| Worktree | `/home/agent/projects/netscript/worktrees/007-leaf-1778` |
| Branch | `docs/exports-drift-clean-six` (no upstream by design; push by explicit refspec only) |
| Base | `origin/main` `de57fab0` |
| Requested route | Codex · OpenAI · `gpt-5.6-sol` · medium (`normal_implementation`) |
| Observed route | identical — **route verdict: matched** |
| Runtime | `approval=never`, `sandbox=dangerFullAccess` |
| Sender lease | `sessionId` `01a05350-…`, `ownerPid` **2796985**, verified alive |
| Live processes at worktree | 3 (`app-server-message-cli`, `codex app-server`, `codex-code-mode-host`) |
| Brief (staged on host) | `/home/agent/docs-1778-brief.md` |
| Brief (checked in) | `briefs/docs-1778-brief.md`, this run dir |
| Launcher | `.llm/tools/agentic/codex/launch-codex-slice.ts` — the checked-in agentic runtime, not ad hoc |

**Steering — same thread, never a second sender at this worktree:**

```bash
deno run --allow-all .llm/tools/agentic/codex/codex-resume.ts \
  --thread-id 01a05350-a6c4-7340-be12-c78a50141d74 \
  --worktree /home/agent/projects/netscript/worktrees/007-leaf-1778 \
  --user node --message-file <path>
```

## Remote Control proof — supervisor

| Field | Value |
| --- | --- |
| Claude session id | `1d06dd31-be07-405a-9762-e641197e285f` |
| Bridge session id | `session_016g86jW5sMJE9z9EHHGPByH` |
| Remote Control URL | `https://claude.ai/code/session_016g86jW5sMJE9z9EHHGPByH` |
| PID / registry | `5519`, `~/.claude/sessions/5519.json` |
| tmux | `netscript-007-docs-r2:@16.%16` |
| Attachment proof | non-empty `bridgeSessionId` in the registry entry whose `pid`/`cwd` match the live process, plus `--remote-control` in argv |

Route identity caveat, unchanged: this session was launched by `hybrid-launcher.ts`, so argv carries
no `--model`/`--effort`. Its route is asserted by configuration, not proved by process inspection.

## Watcher

`.llm/tools/harness/watch-run.ts` against the leaf run dir, backgrounded — it `watchFs`-es
`worklog.md` and exits on change, so supervision is event-driven rather than polled.

## Scope guard on this slice

The brief forbids any `docs/site/**` change and instructs the author to **drop** a package rather
than weaken its `symbolCoverage` policy to make the gate pass. Six clean packages
(`aspire`, `cli`, `cron`, `database`, `kv`, `logger`) measured at zero findings on `de57fab0`;
shipping five honestly is an acceptable outcome, shipping six by lowering the bar is not.
