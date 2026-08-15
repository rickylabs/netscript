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

## 2026-08-15 — PLAN-EVAL cycle 1 terminal: PASS (corrected evidence)

Formal gate closed. Coordinator reconciliation grant received after the corrected terminal gate.

| Field                  | Value                                                                   |
| ---------------------- | ----------------------------------------------------------------------- |
| Verdict                | `PASS` (single token, `plan-eval.md:81`)                                |
| Evaluated source head  | `d35cbca30872d1f55118d63437638e93270c2ac3`                              |
| Evaluator session      | `40a06314-b69a-4ca0-a4a0-1224c5e377ca`                                  |
| Registry bridge        | `session_0126JRYrbXqvoJwskcF31RwW`                                      |
| Remote Control URL     | `https://claude.ai/code/session_0126JRYrbXqvoJwskcF31RwW`               |
| Verdict commit         | `9ae97c9348865e08f8b301ce34709241e964c831` (`plan-eval.md` only)        |
| Final evaluator commit | `a790e91e26a4fb84636b4f3c57bd6444196b4ca9` (`plan-eval.md` only)        |
| Remote leaf branch     | `a790e91e26a4fb84636b4f3c57bd6444196b4ca9`                              |
| PR #1652 after gate    | still draft, still `status:plan-eval`, milestone `0.0.7`, labels intact |

### Tier-A review of the verdict (performed, not delegated)

Boundary compliance verified: each evaluator commit touched exactly one file (`plan-eval.md`), the
push landed, exactly one new `[PHASE: PLAN-EVAL] [VERDICT: PASS]` comment was posted
(`2026-08-14T23:22:00Z`, later edited in place rather than duplicated), and no label, ready
transition, merge, issue, milestone, or coordinator artifact was touched.

Cited evidence independently re-checked against the tree and GitHub — all held:

- `deno.json:84-85` defines `docs:links` and `docs:accuracy`;
- `docs/site/deno.json:4` chains `check:source-format && lume && check:rendered-output`;
- `rg defineRegion packages/` → 0 hits, confirming the consumer-local attribution correction;
- `plan.md:26-35` (8 locked decisions), `:188-198` (9 risk rows with stop conditions), `:200-209`
  (deferred acceptance map → #1645–#1650);
- #1650 open in `Backlog / Triage` with `type:docs` + `area:docs` + `priority:p2` + exactly one
  `status:triage`.

The evaluator also disclaimed the prior contamination on its own initiative: the 2026-08-13
`APPROVED` comment and the Minimax/OpenRouter advisory run "carry no weight and were not consulted".
That closes the one gap left by the wrapper brief that never reached it.

### Attachment-evidence defect and its resolution

Tier-A found the published `bridgeSessionId` and Remote Control URL wrong (`cse_…`, non-resolving).
Root cause is **not** a transcription slip: `~/.claude/jobs/40a06314/state.json` genuinely carries
`cse_0126JRYrbXqvoJwskcF31RwW` while `~/.claude/sessions/2465471.json` carries
`session_0126JRYrbXqvoJwskcF31RwW`, and only the `session_…` form resolves. The evaluator had read
the jobs file, which is the correct source for the observed **route** (`respawnFlags`) but not for
the identity triple.

The topic orchestrator did **not** edit the verdict artifact — a supervisor rewriting an evaluator's
evidence would break the separation the gate exists to enforce. The same evaluator session was
steered to correct both fields, record the file disagreement, amend its existing PR comment in place
instead of posting a second phase comment, and commit only `plan-eval.md`. Delivered at `a790e91e2`.
Verdict, evaluated head, and every Plan-Gate row are unchanged.

Route proof was never in doubt: session id, PID `2465471`, cwd, and `respawnFlags`
(`--model claude-opus-5 --effort low --remote-control --permission-mode bypassPermissions`) were all
correct and independently confirmed.

### Stale residue removed (coordinator-directed)

The evaluator's non-blocking note 3 flagged `docs/site/comparisons/` and `docs/site/migration/` as
untracked residue of the interrupted S1 turn. Verified before touching anything: both existed as
directories, `git ls-files` returned **0** tracked files under each, and `find -mindepth 1`
(including hidden entries) returned **0** entries — genuinely empty and untracked. Removed with
`rmdir` (which refuses a non-empty directory, so the guard is structural, not a promise). Both gone;
leaf worktree remains clean at `a790e91e2`. No tracked file was deleted and no `rm -rf` was used.

### Remaining non-blocking notes carried into implementation

1. S3 must assert the new pages against `docs/site/glossary.md` explicitly for the `SCOPE-docs`
   Terminology gate; falsifiable by an S3 gate table with no glossary assertion.
2. S2 numbers reproduce only from the private pinned EIS-Chat revision; the rendered case page must
   state who can reproduce them. Falsifiable by a published `measured` number with no
   reproducibility statement.

## 2026-08-15 — S1 dispatched to the existing Codex thread

Lifecycle transition posted and applied together, per `netscript-pr`: PR #1652 comment
`[PHASE: IMPL] [STATUS: S1 DISPATCHED]` (`issuecomment-5299181113`) and the label move
`status:plan-eval` → `status:impl`. Verified after the write: exactly one `status:` label, PR still
`draft: true`, milestone `0.0.7`, and `area:docs` / `type:docs` / `priority:p2` / `ci:skip-e2e` /
`ci:skip-scaffold` all preserved.

Pre-dispatch environment check: Codex daemon `running`, managed at `0.147.0` with the control socket
intact and 4 app-server processes; leaf worktree `docs/comparison-docs-programme@a790e91e2`,
`dirty=0`, `upstream=NONE` by design, `agents: 0 recent`.

Steering used the existing thread, never a replacement sender:

| Field    | Value                                                                                                 |
| -------- | ----------------------------------------------------------------------------------------------------- |
| Thread   | `019ffcc9-16c2-7573-b7f6-d627172408e8` (the registered sender for this worktree)                      |
| Tool     | `deno task agentic:codex-resume` → exactly one `codex exec resume`                                    |
| Verified | `--dry-run` first: correct thread, correct worktree, 4565-byte message, quoting intact                |
| Launch   | detached via `nohup … &`, **not** wrapped in `timeout` — a timeout bounds the agent, not the launcher |
| Live PID | `2510461`                                                                                             |

### S1 brief boundaries

Six files only (`docs/site/_data.ts`, `docs/site/_data/xref.ts`, `comparisons/index.md`,
`comparisons/methodology.md`, plus the run's `worklog.md` and `context-pack.md`); gate
`S1-method-nav` (`deno task --cwd docs/site build`, `deno task docs:links`, `git diff --check`) with
raw exit codes plus the four manual assertions; one commit, explicit-refspec push, one structured PR
comment. No case-result claim and no measured number ship in S1.

Both surviving evaluator notes were folded into the brief as S1 work rather than left to retrofit:
glossary consistency for the `SCOPE-docs` Terminology gate, and stating the S2 reproducibility
precondition on the methodology page so the case page is not its first mention.

The brief also warns the thread explicitly that its memory of writing S1 files is from the reverted
turn — no such content was ever committed, and the two empty directories it may remember creating
have been removed.

Hard stops restated to the generator: stop after S1; no S2/S3; no self-certification, because the
Tier-A slice review and sign-off commit are the orchestrator's; no `packages/**`/`plugins/**`,
lockfile, private-source, `#1551`, ready, merge, publish, scaffold/E2E, or lease action.

### Correction to an earlier characterization in this log

My first Tier-A report called the `cse_…` bridge id a transcription slip. It was not: both identity
files genuinely carry different values, and the evaluator had read the jobs file. The prior entry
already records the accurate root cause; noted here so no reader takes the earlier framing as the
finding.

## 2026-08-15 — Tier-A S1 sign-off: PASS (independently re-executed)

S1 is terminal at `98fc58997c3ff5ca21403ba67521c584a5d26a0e` = `3a8c73841` (S1) + `98fc58997`
(Tier-A fix). Sign-off is the supervisor's, per the harness slice-review invariant. PR comment
`issuecomment-5299334257`.

### Verification the orchestrator executed itself

Waited for `task_complete` in the leaf rollout before touching the worktree, so the build could not
collide with a live turn. The `pgrep` hits that looked like a running agent were this session's own
shell wrappers carrying the pattern in their command line — identified by reading the rollout's last
record, not by string match.

| Check                                   | Raw exit | Result                                             |
| --------------------------------------- | -------- | -------------------------------------------------- |
| `deno task --cwd docs/site build`       | `0`      | 226 HTML files, 4 documented-syntax allowances     |
| `deno task --cwd docs/site check:links` | `0`      | 34,980 internal links across 226 pages all resolve |

Both reproduce the leaf's reported evidence exactly. Rendered assertions checked against `_site`
directly: `/netscript/comparisons/` and `/netscript/comparisons/methodology/` appear in the Concepts
menu right after the explanation entries and are carried on 176 pages; `/netscript/migration/` has
zero hrefs anywhere in the rendered site. Head unchanged at `98fc58997` and the worktree stayed
clean after the build. Local, remote, and PR head all agree.

One self-correction during verification: an initial grep for `href="/comparisons/` returned zero and
briefly looked like a contradiction of the navigation assertion. That was this orchestrator's error
— the site renders under a `/netscript/` base path. Re-checked with the correct prefix and the
assertion holds. No finding was raised on it.

### Findings resolved

- **T1** — four `/migration/` references removed (`_data.ts` root, `migration:index` xref entry plus
  its legend line, `comparisons/index.md` body xref, `methodology.md` `nextPrev.next`). `git grep`
  at the signed-off head returns zero matches. Replacements preserve meaning rather than deleting
  content: the roadmap sentence now names #1650 in plain text.
- **T2** — `check:links` added as a mandatory S1 gate row and is the check that produced the
  34,980-link proof.

### Standing observation

Three defects surfaced inside one PASSed plan: an S1 acceptance unsatisfiable from its own file
list, four links into a section owned by a later slice, and an S1 gate structurally unable to prove
its own content contract. The common thread is per-slice self-consistency, which the PLAN-EVAL
checklist does not currently test. Raised to the coordinator as a checklist gap, not as a reason to
doubt this leaf — the plan's substance held and the leaf stopped correctly at every boundary.
