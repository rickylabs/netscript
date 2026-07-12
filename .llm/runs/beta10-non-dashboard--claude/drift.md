# Drift — beta.10 non-dashboard stream

Append-only.

## D1 — pre-existing worktree state on the PR branch (minor)

`/home/codex/repos/netscript-547-lffix/.claude/worktrees/mcp-skills-orchestrator` (locked) holds
`feat/netscript-mcp-skills` at `57c2cfe1` — **3 commits ahead of `origin/feat/netscript-mcp-skills`
(`5b1a9877`)**, including `93546ae3`, a commit already merged to `main`, plus an uncommitted
~313-line rewrite of `packages/mcp/README.md`.

That state is un-pushed and its provenance is not recorded in any run artifact, so it is not
trustworthy as a baseline. Rather than disturb a locked worktree or guess at a partial local merge,
this run baselines on the **true PR head** (`origin/feat/netscript-mcp-skills` @ `5b1a9877`) in a
fresh worktree at `/home/codex/repos/ns-b10-715`.

The uncommitted `packages/mcp/README.md` draft was preserved to scratch and will be evaluated as
input for P0(b) rather than discarded — but it is treated as a draft to review, not as landed work.

**Severity:** minor. No scope change.

## D2 — root cause of the `quality` CI failure sat in `packages/mcp`, not in the wrapper alone (minor)

The brief scoped P0(a) as a wrapper bug plus "the real underlying batch failure it was hiding". The
underlying failure turned out to be a lint-selection problem caused by a test fixture inside
`packages/mcp` (`tests/fixtures/doctor/broken/deno.json`).

The fix applied is a **selection/config change** (`deno.json` lint task + `lint.exclude`), not a
change to `packages/mcp` source or to the fixture itself — so it stays inside this lane's tooling
boundary and does not require a WSL Codex slice. Had the correct fix been to alter the fixture or
the MCP doctor's test, that would have been delegated to Tier D.

**Severity:** minor. Within approved scope.

## D3 — IMPL-EVAL evaluator surface failed to bootstrap (significant)

**Attempt 1** — OpenHands, `openrouter/qwen/qwen3.7-max`, run `29212768065` — died before producing
a verdict:

```text
openhands.sdk.conversation.exceptions.ConversationRunError:
  Conversation run failed for id=61793d3e-fce4-4846-8d54-26494802be37: No module named 'fastapi'
```

This is an **OpenHands runtime bootstrap fault**, not a task verdict — the workflow's own summary
classifies it `state=agent-failed, verdict=NONE, "This is a workflow failure, not a task verdict."`
Housekeeping steps (ack, trace, commit-artifacts) all succeeded, so the trigger and routing are
fine; the agent container is missing a Python dependency.

**Attempt 2** dispatched on `openrouter/minimax/minimax-m3` (the other permitted open model —
OpenHands is open-models-only; dispatching a closed model is prohibited). The fault looks
model-independent (a runtime bootstrap dependency, not a model call), so attempt 2 may fail the same
way.

**Consequence if it does:** the evaluator surface is **blocked**, and per the harness skill that is
recorded here rather than silently skipped. PR #715 does **not** merge without an opposite-family
IMPL-EVAL verdict. If OpenHands stays broken, the fallback is a separate local Codex (GPT-family)
session as the evaluator — which is a valid opposite-family route to Claude-generated work — but that
fallback requires owner authorization and must be recorded in `supervisor.md`.

**Owner decision needed:** either (a) fix the OpenHands runtime (`fastapi` missing from the agent
image), or (b) authorize the local Codex evaluator fallback for #715.

**Severity:** significant — it blocks the merge gate, not the implementation.

## D4 — #763 Codex thread stalled; relaunched on a different route (minor)

Thread `019f588f` (gpt-5.6-luna · **max**) burned ~1 MB of rollout reasoning and produced **zero file
edits** in 15 minutes, going silent 7.5 min after emitting "Applying patch and finalizing worklog
design". Its sender-lease `ownerPid` (32729) was dead.

Distinguished a stalled thread from a merely-slow one by comparing rollout write times across all
three live slices: `#762` and the tagline slice were both writing within the last 3–5 minutes and had
real file changes on disk; `#763` had neither. Launcher-process death alone is **not** evidence — the
`#762` launcher was SIGTERM'd too and its thread kept committing normally.

Per the known lease defect (a recorded session id blocks relaunch permanently even when dead), the
stale lease was **archived** to `senders/archive/763-stalled-<ts>.json` and released, then the slice
was relaunched with `send-message-v2` — **not** `codex exec resume`, which spawns an unmanaged
standalone process the daemon cannot see.

- **Old thread:** `019f588f-44df-7013-842c-be28f1bb1a56` — abandoned, no work lost (0 commits, 0 dirty).
- **New thread:** `019f589e-3e7a-7870-b996-c5634fd67f8c` — provider=openai · **gpt-5.6-sol** ·
  effort=**high** (route verdict: matched). Confirmed working within a minute
  ("Designing CLI version extraction helper").

Route changed deliberately: `luna`/`max` is the small-fix route per lane policy, but it produced no
output on two turns here, so this slice was moved to the normal implementation route. If `luna`/`max`
stalls again on other slices, that is a lane-policy signal worth raising.

**Severity:** minor. No scope change, no work lost.
