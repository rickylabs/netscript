# Dispatch record — docs-1782 (issue #1782, repair slice 1 of #1777)

| Field | Value |
| --- | --- |
| Codex thread | `01a053cd-0c37-7290-9f5c-a09d53e53a93` |
| Worktree | `/home/agent/projects/netscript/worktrees/007-leaf-1782` |
| Branch | `docs/aspire-public-surface` (no upstream by design; explicit refspec only) |
| Base | `origin/main` `2a65a8cd` |
| Requested route | Codex · OpenAI · `gpt-5.6-sol` · medium |
| Observed route | identical — **route verdict: matched** |
| Sender lease | `ownerPid` **2950006**, verified alive |
| Live processes at worktree | 2 |
| Brief (checked in) | `briefs/docs-1782-brief.md` |
| Launcher | `.llm/tools/agentic/codex/launch-codex-slice.ts` |

Supervisor Remote Control proof: Claude session `1d06dd31-be07-405a-9762-e641197e285f`, bridge
`session_016g86jW5sMJE9z9EHHGPByH`, PID `5519`, registry `~/.claude/sessions/5519.json`.

**Steering — same thread, never a second sender at this worktree:**

```bash
deno run --allow-all .llm/tools/agentic/codex/codex-resume.ts \
  --thread-id 01a053cd-0c37-7290-9f5c-a09d53e53a93 \
  --worktree /home/agent/projects/netscript/worktrees/007-leaf-1782 \
  --user node --message-file <path>
```

## Launcher trap hit and recorded

The first launch **failed, exit 4**, at the `git-safety` stage:

```
"problems":["HEAD is '2a65a8cd0', expected base '2a65a8cd'"]
```

`--expect-base` is compared **literally against `git rev-parse --short HEAD`**, and this repository's
short SHA is **9 characters** here, not the 8 that is usually assumed. Passing a hand-truncated
8-character prefix fails with a message that reads like a base mismatch rather than a length
mismatch. Always pass `$(git -C <worktree> rev-parse --short HEAD)` rather than typing a prefix.

Caught only because the launch was **proved** rather than assumed — the same check that was missing
on the #1778 dispatch. An unverified `nohup` would have left this slice silently unstarted.
