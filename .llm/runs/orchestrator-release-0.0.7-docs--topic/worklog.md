# Worklog — topic-docs-0.0.7

## 2026-08-15 — Sonnet 5/low canary reconciliation (superseded)

- Initialized this run directory and recorded the lane at the Sonnet 5/low route.
- Verified the topic and leaf worktrees and PR #1652; launched nothing.
- Committed at `f6ee57afa`. Retained as historical evidence; its route facts are superseded — see
  `drift.md`.

## 2026-08-15 — Opus 5/high supervisor reconciliation turn

Skills and contracts read in full: `AGENTS.md`, `CLAUDE.md`, and the `netscript-harness`,
`agent-milestone-orchestrator`, `claude-manager`, `codex-wsl-remote`, `netscript-tools`,
`netscript-pr`, `netscript-doctrine` skills; `briefs/topic-claude-reset-common.md`; the
coordinator's `supervisor.md`, `context-pack.md`, `drift.md`, `milestone-status.md`,
`briefs/reset-gates/dispatch.json`, `milestone-cluster-state.json`, and `leaf-contracts.json`; the
leaf run `docs-comparison-docs-programme--1551`.

Identity established and proved (no inference):

- process argv carries the explicit route (requested route matched):

  ```text
  --model claude-opus-5 --effort high --permission-mode bypassPermissions --remote-control netscript-007-docs
  ```

- native session registry `~/.claude/sessions/2429469.json` matches PID `2429469` and cwd
  `/home/codex/repos/netscript-007-docs` and exposes non-empty
  `bridgeSessionId: session_01PLRauSHN1PnvrNF2ucefF6`; Claude session
  `fcf04b0f-3c2f-4844-9508-84c52ce8298c`, CLI `2.1.233`.
- Remote Control URL `https://claude.ai/code/session_01PLRauSHN1PnvrNF2ucefF6`, attached and
  owner-visible.

State re-established from live sources, not from the parked record:

- `git ls-remote origin` — `main` `01e0960494c95ce56eb35892c211a095eb13e6ed`, topic branch
  `f6ee57afa`, leaf branch `d35cbca30872d1f55118d63437638e93270c2ac3`.
- both worktrees clean; `git worktree list` shows one worktree per branch and no dual ownership.
- PR #1652 via GitHub API: open, **draft**, `mergeable: true` / `mergeable_state: clean`, milestone
  `0.0.7`, head `d35cbca30872d1f55118d63437638e93270c2ac3`, base `01e096049`, labels `type:docs` ·
  `area:docs` · `priority:p2` · `ci:skip-e2e` · `ci:skip-scaffold` · `status:plan-eval` (exactly one
  `status:`).
- `deno task agentic:pr-checks -- --repo rickylabs/netscript --pr 1652 --pretty` →
  `pr-checks PASS headSha=d35cbca30872d1f55118d63437638e93270c2ac3 checks=49 currentFailures=0`;
  every red-looking row classifies as `superseded`, the current rows are `current-pass` (draft-gated
  skips).
- resource state: `docker ps -a` empty; no milestone resource lease; no evaluator process; the
  parked topic thread `019ffcc0-e19b-71d1-95ce-8c72559eb026` and the leaf implementer thread
  `019ffcc9-16c2-7573-b7f6-d627172408e8` are both absent from the process table. The Codex
  app-server daemon is up and managed with `--remote-control`; the unrelated
  autocorner/daily-assistant Codex threads are outside this cluster and were not touched.
- the other three live Claude topic supervisors sit at `netscript-007-{internals,fixes,features}`;
  none is attached to this worktree.

Actions taken: rewrote `supervisor.md` and `context-pack.md` to the current central route and added
the attachment proof, appended `drift.md`, wrote this entry, committed, and pushed by explicit
refspec.

Actions deliberately **not** taken: no leaf launch or resume, no evaluator launch, no implementation
edit, no PR/issue/label mutation, no ready transition, no merge, no cluster-state mutation, no
release-writer lease. Dispatch order 6 has not been granted, and the cluster's global evaluator
concurrency is 1.

## 2026-08-15 — dispatch order 6 granted; PLAN-EVAL cycle 1 launched

Grant verified at coordinator head `168715e2710f846fb20562627bbf84ecb1c780fc`
(`chore(harness): scope evaluator queues per topic`). The amendment changes `dispatch.json` from
`concurrency: 1` to `concurrency: 4` with `concurrencyScope: per-topic-orchestrator` and
`perOrchestratorConcurrency: 1`; the coordinator drift entry `2026-08-14T23:13:20Z` records that
cluster-wide serialization was a mis-encoding and that formal evaluator leases no longer consume
`expensiveGates`. Docs order 6 may therefore run alongside the other topics. This lane still runs
exactly one evaluator at a time.

Immutable head re-verified before launch, independently of the parked record:

| Check                                   | Value                                      |
| --------------------------------------- | ------------------------------------------ |
| local `HEAD`                            | `d35cbca30872d1f55118d63437638e93270c2ac3` |
| `origin/docs/comparison-docs-programme` | `d35cbca30872d1f55118d63437638e93270c2ac3` |
| PR #1652 head                           | `d35cbca30872d1f55118d63437638e93270c2ac3` |
| `git status --porcelain`                | empty (clean)                              |
| merge-base with `main`                  | `01e0960494c95ce56eb35892c211a095eb13e6ed` |

All four agree with dispatch order 6. No mismatch; the gate was allowed to proceed.

### Evaluator identity (attachment proved, not inferred)

| Field                | Value                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Role                 | formal PLAN-EVAL cycle 1, `comparison-docs-programme` / PR #1652                                                    |
| Requested route      | native Claude · Opus 5 · effort **low** · Remote Control · bypassPermissions                                        |
| Observed route       | `respawnFlags`: `--model claude-opus-5 --effort low --remote-control --permission-mode bypassPermissions`           |
| Observed runtime     | session banner reports `Opus 5 with low effort · Claude Max`                                                        |
| Route verdict        | **matched**                                                                                                         |
| Claude session id    | `40a06314-b69a-4ca0-a4a0-1224c5e377ca`                                                                              |
| Job id               | `40a06314`                                                                                                          |
| PID                  | `2465471`                                                                                                           |
| Exact cwd            | `/home/codex/repos/netscript-007-docs-comparison`                                                                   |
| `bridgeSessionId`    | `session_0126JRYrbXqvoJwskcF31RwW` (non-empty)                                                                      |
| Remote Control URL   | `https://claude.ai/code/session_0126JRYrbXqvoJwskcF31RwW`                                                           |
| Remote Control state | active (`bridge_status` at `2026-08-14T23:18:03Z`)                                                                  |
| Branch at cwd        | `docs/comparison-docs-programme` @ `d35cbca30`                                                                      |
| Family separation    | opposite family to Codex generator `019ffcc9-16c2-7573-b7f6-d627172408e8`; fresh session, never used for generation |

Observed launch route is read from `~/.claude/jobs/40a06314/state.json` `respawnFlags`, because a
`--bg` session receives `--model`/`--effort` over the daemon claim socket and they do not appear in
`/proc/<pid>/cmdline`. Attachment is the `~/.claude/sessions/2465471.json` PID/cwd/`bridgeSessionId`
triple.

### Initial-prompt provenance — recorded honestly

The `claude --bg` launch placed the topic orchestrator's 6143-character wrapper brief **after** the
variadic `--add-dir` flag, so the CLI parsed it as a second directory argument rather than the
initial message. `respawnFlags[9]` holds the brief text as an `--add-dir` value and the job's
`intent` is empty. The launcher reported `idle — send a prompt to start`, and the transcript
confirms the session took **no** initial message from this orchestrator.

The turn that actually started the evaluator is the single user record at `2026-08-14T23:18:40Z`
(`origin.kind: human`, `promptSource: typed`) sent over Remote Control — a 514-character directive
that binds the evaluator to the coordinator's authoritative brief
(`briefs/reset-gates/comparison-docs-programme.md`), requires re-verification of source head
`d35cbca30872d1f55118d63437638e93270c2ac3` with refusal on mismatch, and constrains it to commit
only `plan-eval.md`, push explicitly, post the structured PR comment, then stop without implementing
or mutating coordinator state.

Disposition: the governing contract is intact — the coordinator's brief file is the binding
authority and it already mandates the route/identity recording, Plan-Gate row coverage, single
verdict token, commit/push/comment shape, and the boundary set. The orchestrator's wrapper brief was
supplementary and is not required for a valid gate, so the running evaluation was **not**
interrupted to re-deliver it. Do not describe the wrapper brief as delivered.

### Watch and boundaries

No second gate will be opened and no docs implementation will resume until this verdict is terminal.
The lane is watching for `plan-eval.md` plus the evaluator's push to
`docs/comparison-docs-programme`; the Codex leaf thread `019ffcc9-16c2-7573-b7f6-d627172408e8`
remains idle and unresumed.
