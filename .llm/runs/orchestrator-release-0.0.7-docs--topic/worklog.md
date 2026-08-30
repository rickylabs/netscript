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

## 2026-08-15 — S2 authorized and dispatched

Coordinator authorized S2 immediately on a terminal S1 sign-off, with docs-lane-only serialization
(no waiting on fixes, internals, or features).

Pre-handoff reconciliation: local `HEAD`, `origin/docs/comparison-docs-programme`, and the daemon's
view all read `98fc58997`, `dirty=0`, `upstream=NONE` by design, `agents: 0 recent`; Codex daemon
`running`/managed at `0.147.0` with the control socket intact. Topic checkpoint `706b3ace6` pushed
before the handoff.

Steered the **same** thread `019ffcc9-16c2-7573-b7f6-d627172408e8` via `agentic:codex-resume`
(detached, not `timeout`-wrapped). Live PID `2573062`. No replacement sender was created.

### S2 boundary

Six files: the measurement tool and its test under `.llm/tools/docs/`, the two evidence JSON files
under `docs/site/comparisons/evidence/`, plus `worklog.md` and `context-pack.md`; `drift.md` only on
divergence.

### Gate strengthened before dispatch (carried from Tier-A finding T2)

The approved `S2-evidence-repro` gate is five commands — check/lint/fmt/test wrappers plus
`git diff --check` — and contains **no site build and no rendered link check**, even though S2
writes two new files under `docs/site/**`. As written it cannot prove that adding those files leaves
the site building and every link resolving: the same structural blind spot that let four dangling
links through S1's green gate.

Added as mandatory to S2, and as a standing rule for any slice touching `docs/site/**`:

```text
rtk proxy deno task --cwd docs/site build
rtk proxy deno task --cwd docs/site check:links
```

This strengthens evidence and changes no scope. It is the third instance of the same plan-level
pattern — a slice gate that cannot prove that slice's own contract — and is recorded as such rather
than treated as a one-off.

Privacy boundary restated to the generator: identifiers, classifications, hashes, and aggregates
only; never file contents; unmatched Next.js values stay absent/deferred, never zero or estimated.
Stop after S2 for Tier-A, which will again re-execute the gate independently.

## 2026-08-15 — S2 blocked; evidence preserved; lane holding for a coordinator decision

S2 never started. The leaf stopped before writing the measurement tool, its test, the manifest, or
the measurements JSON, and before reading any consumer file. No fetch, clone, checkout, or worktree
creation occurred.

Blocker evidence committed at `0a13c0162`
(`docs(comparison): record the S2 immutable-input
blocker`) — exactly the three run artifacts, no S2
code path, both lockfiles unchanged, pushed to `origin/docs/comparison-docs-programme`, worktree
clean. The leaf's `drift.md` entry carries both facts this orchestrator verified independently: the
pinned commit is the current `refs/heads/master` tip on the authorized remote, and `research.md:51`
records GitHub-only inspection with no checkout, which is why the local-roots tool contract has no
input to read. It is marked severity `significant`, blocked, no rescope, no scope growth, and names
the PLAN-EVAL miss.

### Escalated to the coordinator — not resolved by this lane

The likely fix is a single `git fetch` into an already-authorized clone. This lane did not run it.
Provisioning that input writes private consumer source to disk from an external remote, which sits
outside the docs-authoring boundary granted here, even though `leaf-contracts.json` lists
`external:EIS-Chat@5191de83f3da97559f21d8891c6c8afdf1cf473a` as an authorized file surface for this
leaf. That tension is the coordinator's to settle.

Options put to the coordinator, with the recorded recommendation:

1. authorize the fetch into one existing clone at the pinned revision — minimal, preserves the
   tool's determinism, requires no plan change (**recommended**);
2. re-specify the tool to read through authorized GitHub access as P0 did — rejected in
   recommendation because a network-dependent measurement tool contradicts the plan's own
   byte-stability and pinned-input reproduction requirements;
3. defer S2/S3 measurement content to a residual issue — a milestone scope change, coordinator-only.

Re-pinning to an available revision is called out as the option to refuse: the entire research
baseline was corrected against `5191de83`, so swapping the pin invalidates that work.

### Lane state while holding

Leaf `docs/comparison-docs-programme` at `0a13c0162`, clean, local equals remote. PR #1652 draft at
`status:impl`, milestone `0.0.7`, labels unchanged. S1 remains terminal and Tier-A signed off at
`98fc58997`. Codex thread `019ffcc9-16c2-7573-b7f6-d627172408e8` idle and preserved; no replacement
sender was ever created. No merge, publish, readiness mutation, relabel, issue mutation, or
Aspire/Docker/shared expensive-gate lease from this lane.

## 2026-08-15 — coordinator provisioned the S2 input; S2 resumed

The coordinator materialized the exact authorized EIS-Chat input. Reconciled by this orchestrator
before dispatch — verified, not accepted on report:

| Fact                          | Verified value                                               |
| ----------------------------- | ------------------------------------------------------------ |
| Input root                    | `/home/codex/repos/eis-chat-007-input`                       |
| `git rev-parse HEAD`          | `5191de83f3da97559f21d8891c6c8afdf1cf473a` — exact pin match |
| HEAD state                    | detached, not on a branch                                    |
| Working tree                  | clean, no untracked entries                                  |
| Tracked files                 | 1830                                                         |
| Registration                  | real worktree of `/home/codex/repos/eis-chat`                |
| Pinned object in parent clone | present (`git cat-file -t` → `commit`)                       |

No pre-existing checkout was disturbed: `/home/codex/repos/eis-chat`,
`/home/codex/repos/refs/eis-chat`, and `/home/codex/eis-chat-ref` all remain on `master` at
`aeaf2df`, `5fdff77`, and `a08ebe5` respectively — the same values recorded when the blocker was
raised. The coordinator added a revision rather than moving one, which is what makes the input
immutable for the gate.

This closes the fourth plan defect without a plan change: S2's tool contract required an authorized
local root at the pinned revision, and one now exists. The contract's "verify the revision before
reading, refuse on mismatch" clause becomes genuinely testable for the first time, so the brief
requires the refusal path to carry a real test case.

Pre-dispatch reconciliation: leaf at `0a13c0162`, `dirty=0`, local equals remote, daemon
`running`/managed at `0.147.0`. Resumed the **same** thread `019ffcc9-16c2-7573-b7f6-d627172408e8`
via `agentic:codex-resume`, detached, never `timeout`-wrapped, no replacement sender.

Boundaries restated to the generator: the input root is strictly read-only — no fetch, pull,
checkout, reset, commit, branch, or write anywhere under `/home/codex/repos/eis-chat*`; derived data
only, never file contents. The `docs/site` build and rendered link check remain mandatory for this
slice under Tier-A finding T2. Stop after S2 for Tier-A, whose gate this orchestrator will
re-execute independently.

## 2026-08-15 — Tier-A S2 sign-off: PASS (reproduction verified byte-identical)

S2 terminal at `4e6d52b3d2cb0bf24aca9a47a67da46a213fef64`; PR comment `issuecomment-5300472067`.

### Reproduction — the decisive evidence

Re-ran the manifest's own documented command against the pinned root with `--observed-at` set to the
committed `2026-08-15T03:57:30Z`, writing to a temp path. Raw exit `0`, and `cmp` reports the output
**byte-identical** to the committed `session-measurements.json`. The published procedure genuinely
regenerates the published numbers — the plan's central claim, now proven rather than asserted.

### Gate re-executed by the orchestrator

| Row                     | Raw exit | Result                                |
| ----------------------- | -------- | ------------------------------------- |
| `run-deno-check.ts`     | `0`      | 2 files, 0 occurrences                |
| `run-deno-lint.ts`      | `2`      | N/A — not applicable                  |
| `run-deno-fmt.ts`       | `0`      | 2 files, 0 findings                   |
| `run-deno-test.ts`      | `0`      | 5 passed, 0 failed                    |
| `git diff --check`      | `0`      | clean                                 |
| `docs/site build`       | `0`      | 226 HTML files                        |
| `docs/site check:links` | `0`      | 34,980 links across 226 pages resolve |

The two site rows added under finding T2 earned their place: link and page counts are **identical**
to S1's, and no `evidence` path exists in `_site`, proving the two JSON files were not rendered as
pages and did not disturb the site. The approved `S2-evidence-repro` gate contained neither row.

### Privacy audit

Both JSON files carry only paths, classifications, and SHA-256 hashes; zero code-like tokens; every
string over 200 characters is policy prose or the reproduction command. Unmatched Next.js metrics
are `absent`/`deferred` with issue owners. The external input stayed clean and pinned at `5191de83…`
through both the leaf's run and the orchestrator's reproduction. Lockfiles unchanged, leaf tree
clean.

### Raised for owner decision, not blocked

The manifest publishes private-repository **paths**. This is inside the approved contract — the plan
authorizes identifiers, and paths are identifiers, not code — but `rickylabs/netscript` is public,
so those paths disclose the private product's URL structure and feature naming, irreversibly on
merge. Abstracting them would weaken the reproducibility the manifest exists to provide, so this is
a trade-off for the owner to settle while the PR is still draft, not a Tier-A block.

### Lint applicability

Recorded N/A with the root-config reason, explicitly not passed, skipped, or waived. The leaf's
worklog states it in exactly those terms.

## 2026-08-15 — S3 dispatched (final approved slice)

Pre-handoff reconcile: leaf `4e6d52b3d`, clean, local equals remote; external input clean at
`5191de8`. Resumed the same thread `019ffcc9-16c2-7573-b7f6-d627172408e8`, detached, PID `2780982`.
No replacement sender has ever been created for this leaf.

Two obligations were carried explicitly into the brief so they cannot be lost between slices:

1. **S3 inherits the rendered-root assertion.** The S1 correction deferred "both `/comparisons/` and
   `/migration/` render under Concepts" to the slice that owns the migration files. S3 must assert
   both, and re-add the migration wiring S1 was made to drop — the `migration:index` xref entry and
   its legend line — now that pages exist to make the links resolve.
2. **`_data.ts` is not in the approved S3 file list**, yet restoring `/migration/` to the Concepts
   `roots` requires it. The brief names this in advance as a seventh content file and a divergence
   to be recorded in `drift.md` and stated in the PR comment, rather than added silently. Flagging
   it before dispatch rather than catching it at review is the direct lesson of the five earlier
   defects.

The S3 gate needs no orchestrator addition: `deno task --cwd docs/site verify` already chains
`build && check:links && check:caveats`, so the rendered link contract that finding T2 exposed is
covered natively here. The `deno doc` rows are read-only public-surface inspection and authorize no
`packages/**` edit.

Numbers discipline restated: every published figure must trace to the S2 manifest and measurements,
no new numbers computed in prose, no deferred value restated as measured. Privacy boundary restated,
including an instruction not to _widen_ the path disclosure already raised to the coordinator — the
case page references classifications and aggregates and enumerates no additional private paths.

Stop after S3 for Tier-A, whose gate this orchestrator will re-execute; then the run stops again for
a separate opposite-family IMPL-EVAL, which the leaf may not launch.

## 2026-08-15 — E0 owner-priority correction: both comments rewritten in place, Tier-A PASS

Terminal at leaf `54e1c3bff7efc5df9da51bc06a15976717fa0929`; sign-off comment
`issuecomment-5300659348`.

| Comment                                                                    | Updated                | Length          |
| -------------------------------------------------------------------------- | ---------------------- | --------------- |
| https://github.com/rickylabs/netscript/issues/1551#issuecomment-5265826161 | `2026-08-15T04:58:05Z` | 28,481 → 10,040 |
| https://github.com/rickylabs/netscript/issues/1551#issuecomment-5265971722 | `2026-08-15T04:58:11Z` | 25,976 → 11,774 |

Both `created_at` unchanged, proving true in-place replacement rather than new comments. No
follow-up was posted and neither body is framed as an update; both titles dropped "Draft" and now
open as the definitive current case study.

| Route                           | Previously published | At the pin    |
| ------------------------------- | -------------------- | ------------- |
| `…/session/[session]/index.tsx` | 119 / 117            | **94 / 92**   |
| `…/channel/[channel]/index.tsx` | 208 / 204            | **181 / 178** |

Both labelled `measured`; every superseded figure removed rather than footnoted.

### Orchestrator verification

Ancestry re-checked (`d838cfca`, `b261f463` ancestors; `834a2b36` identical tree, evidence-only);
line counts re-derived from the read-only input; update-framing scan clean apart from the legitimate
word "revision"; privacy scan clean with the largest excerpt 45 lines of a 181-line file showing a
`definePage()` builder chain and no business data.

Scope held exactly: the commit touches **only five run artifacts**.
`docs/site/comparisons/evidence/`, `.llm/tools/docs/`, and every S1 page are byte-unchanged since
the S2 sign-off — the leaf correctly refused to manufacture edits to a pin that is not obsolete, so
S2's manifest, procedure, and measurements remain valid exactly as signed off. Lockfiles unchanged,
leaf tree clean, input clean at the pin. No `docs/site/**` change, so the site build and link rows
were not applicable and were not claimed.

PR verified after the slice: draft `true`, `Part of #1551` present, no closing keyword, milestone
`0.0.7`, exactly one `status:` (`status:impl`), labels unchanged.

### Recorded for IMPL-EVAL

`plan.md` was amended after the PLAN-EVAL gate to add the inserted E0 slice and refresh its status
line, so the evaluator will assess a plan that differs from the artifact gated at `d35cbca30`. The
amendment documents the insertion and asserts no locked decision changed; it does not alter one.
Surfaced deliberately so the difference is not discovered as a surprise.

### Correction to this lane's earlier reasoning

The preceding hold was this orchestrator's error, not a real blocker. It searched for refs newer
than the pin, found none, and concluded no improvements existed. The correct comparison was the pin
against what the comments described: the comments predate improvements that are ancestors of the
pin. The coordinator's correction and the owner's statement were both right, and the lane lost time
on a false blocker.

## 2026-08-15 — S3 resumed after the E0 correction (final approved slice)

Pre-handoff reconcile: leaf `54e1c3bff` with local, remote, and PR head in agreement and a clean
tree; thread idle at `task_complete`; Codex daemon `running`/managed at `0.147.0`; read-only input
clean at `5191de8`. Resumed the same thread `019ffcc9-16c2-7573-b7f6-d627172408e8`, detached, PID
`109856`. No replacement sender has ever been created for this leaf.

Three items were marked settled in the brief so the leaf does not reopen them:

- the two rewritten #1551 comments are canonical as they stand — no further edit, addendum, or
  follow-up;
- the pin does not change, and no new input root is provisioned;
- the coordinator has ruled that the manifest's published reproducibility identifiers are **not** a
  blocker. This lane raised that as an owner-awareness item at S2 sign-off; it is now decided and
  will not be re-raised.

Two obligations carried forward from earlier corrections, restated up front rather than left to be
caught at review:

1. S3 inherits the rendered-root assertion deferred from S1 and must assert that **both**
   `/comparisons/` and `/migration/` render under Concepts, re-adding the migration xref wiring S1
   was made to drop.
2. `_data.ts` remains outside the approved S3 file list, so restoring `/migration/` to the Concepts
   `roots` is a divergence to be recorded in `drift.md` and stated in the PR comment, never added
   silently.

One new consistency obligation, created by E0: the docs case page and the rewritten comment
`5265826161` must not contradict each other on pin, measured counts, feature inventory, evidence
labels, or deferrals. Where they conflict, the S2 evidence files are authoritative — fix the page
and report the discrepancy rather than silently reconciling.

The S3 gate needs no orchestrator addition: `deno task --cwd docs/site verify` already chains
`build && check:links && check:caveats`, so the rendered link contract exposed by finding T2 is
covered natively. The `deno doc` rows are read-only public-surface inspection and authorize no
`packages/**` edit.

Stop is after S3 for Tier-A, whose gate this orchestrator will re-execute; then the run stops for a
separate opposite-family IMPL-EVAL that the leaf may not launch.

## 2026-08-15 — Tier-A S3 sign-off: PASS. All approved slices complete.

S3 terminal at `15429cf8487cfe3504ae0443fd435d2a72d4528b`; sign-off comment
`issuecomment-5300735863`. Local, remote, and PR head all agree.

### Gate re-executed by the orchestrator after the turn went idle

| Row                               | Raw exit | Result                                                                    |
| --------------------------------- | -------- | ------------------------------------------------------------------------- |
| `docs/site verify`                | `0`      | 229 HTML files; 36,084 links across 229 pages resolve; 18 caveats resolve |
| `docs:links`                      | `0`      | 103 docs; 0 broken links/anchors/orphans                                  |
| `docs:accuracy`                   | `0`      | PASS; 201 source pages, 91/91 public commands                             |
| `deno doc --filter definePage`    | `0`      | resolves                                                                  |
| `deno doc --filter definePartial` | `0`      | resolves                                                                  |
| `deno doc …/defer/mod.ts`         | `0`      | resolves                                                                  |
| `git diff --check`                | `0`      | clean                                                                     |
| lockfile guard vs `origin/main`   | `0`      | both unchanged                                                            |

Link coverage rose from 34,980/226 at S2 to 36,084/229 — the three new pages, everything resolving.

### The S1 → S3 assertion loop is closed with rendered proof

Read directly from `_site/index.html` under Concepts: `/netscript/comparisons/`,
`/netscript/comparisons/methodology/`, `/netscript/comparisons/nextjs-session/`,
`/netscript/migration/`, and `/netscript/migration/nextjs/`. Both roots present. This is the exact
assertion S1 could not satisfy from its own file list; deferring it to the owning slice was the
right correction and it is now proven rather than asserted.

### The anticipated divergence held its shape

S3 touched nine files — the seven approved plus `drift.md` and `docs/site/_data.ts`. The `_data.ts`
need was predicted in the dispatch brief before the slice ran, and the leaf recorded it at severity
`significant` with no rescope and no scope growth. Predicting it in advance rather than catching it
at review is the direct payoff of the five earlier defects.

### Content verification

Case page reports 94 physical / 92 nonblank, labelled `measured`, matching rewritten comment
`5265826161` exactly; no superseded figure appears. Mechanism matrix is 8 columns × 8 rows with zero
empty cells, exceeding the six the plan requires; aggregate table 6 × 6 complete; both migration
pages link #1650. Input stayed clean at the pin through both the slice and the orchestrator's gate
run.

### Lane position

All approved implementation slices (S1, S2, S3) plus the inserted E0 correction are complete and
Tier-A signed off. The run stops here for the separate opposite-family IMPL-EVAL, which this
orchestrator will not self-launch. Route per the reset dispatch policy: fresh native Claude,
opposite-family to Codex author `019ffcc9-16c2-7573-b7f6-d627172408e8`, Remote Control attached,
serialized within this topic, effort right-sized; Fable 5 not pre-dispatched and requiring a
coordinator amendment.

Two facts handed to that evaluator: `plan.md` was amended post-gate to record E0, so it differs from
the artifact gated at `d35cbca30`; and five plan defects of one family were found and corrected
during implementation, all recorded in the leaf's `drift.md`.

## 2026-08-15 — formal IMPL-EVAL dispatched at the immutable S3 head

Coordinator granted the single formal gate after the terminal Tier-A S3 PASS. Per-topic
serialization confirmed satisfied before launch: zero evaluator sessions were attached to the leaf
worktree.

Pre-launch reconcile: leaf `15429cf84`, tree clean, local equals remote equals PR head.

### Evaluator identity (attachment proved)

| Field              | Value                                                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Role               | formal IMPL-EVAL, PR #1652, evaluated head `15429cf8487cfe3504ae0443fd435d2a72d4528b`                            |
| Requested route    | native Claude · Opus 5 · effort **medium** · Remote Control · `bypassPermissions`                                |
| Observed route     | `respawnFlags`: `--model claude-opus-5 --effort medium --remote-control --permission-mode bypassPermissions`     |
| Route verdict      | **matched**                                                                                                      |
| Claude session id  | `c6950ed9-7405-4f28-9464-1e1977f2979c`                                                                           |
| Background job id  | `c6950ed9`                                                                                                       |
| PID                | `138125`                                                                                                         |
| Exact cwd          | `/home/codex/repos/netscript-007-docs-comparison`                                                                |
| `bridgeSessionId`  | `session_01QjkTyGWr2HSHrLLVLdfhCR` (non-empty, sessions-registry form)                                           |
| Remote Control URL | `https://claude.ai/code/session_01QjkTyGWr2HSHrLLVLdfhCR`                                                        |
| Family separation  | opposite family to Codex author `019ffcc9-16c2-7573-b7f6-d627172408e8`; fresh session, never used for generation |

### Launcher lesson applied and verified

The earlier PLAN-EVAL launch lost its wrapper brief to the variadic `--add-dir` flag. This launch
put the single-value `--name` immediately before the positional prompt. Verified two ways rather
than assumed: `respawnFlags` contains **no** long prompt string, and the transcript's first
`type:"user"` record is 7,561 characters opening with `use harness  # Formal IMPL-EVAL` and
containing the exact evaluated head. The brief reached the evaluator.

### Brief contents

The evaluator judges the complete changeset — the two rewritten #1551 comments including
`created_at` immutability and absence of any follow-up, the 8×8 matrix and six-column rule,
counts/pins/comment consistency re-derived rather than accepted, migration scope, navigation and
xrefs, the journaled `_data.ts` divergence, and private-source/secret leakage across pages, evidence
JSON, tool, and both comments.

It was handed two facts up front rather than left to discover them: that `plan.md` was amended after
the PLAN-EVAL gate to record E0, and that five plan defects of one family were corrected during
implementation. It was explicitly told not to accept this orchestrator's rulings — including the S2
lint N/A determination — but to verify them.

Gates are proportional and cheap only: `verify`, `docs:links`, `docs:accuracy`, `git diff --check`,
and the lockfile guard. No Aspire, Docker, product E2E, scaffold, or resource lease. The evaluator
may commit and push only `evaluate.md` plus required bookkeeping, then post one attributed verdict
comment, and may not implement, ready, merge, publish, relabel, touch #1551, change the pin, or
re-edit the rewritten comments.

The lane stops after this single formal gate and awaits the coordinator.

## 2026-08-15 — formal IMPL-EVAL verdict: FAIL_FIX

Terminal at evaluated head `15429cf8487cfe3504ae0443fd435d2a72d4528b`. Artifact commit
`e95f4838038a27a0f209d2ce37c9f53bd4ed4299` (`evaluate.md` only, 327 lines); verdict comment
`issuecomment-5300794391`. Local, remote, and PR head all `e95f48380`; tree clean.

All five proportional gates green in the evaluator's own run: `verify` `0`, `docs:links` `0`,
`docs:accuracy` `0`, `git diff --check` `0`, lockfile guard `0`. No Aspire, Docker, E2E, or lease.

### Two blocking findings — both independently re-verified by this orchestrator

**F1 — `181 / 178` labelled `Measured` with no published input that reproduces it.** Comment
`5265971722` states "**Measured.** … yields 181 physical / 178 nonblank" while
`docs/site/comparisons/evidence/` contains only `session-source-manifest.json` and
`session-measurements.json` — Session inputs only, no Channel record. The comment also weakened the
label's own definition in its legend, dropping the _published script_ and _raw aggregate output_
requirements that `methodology.md:44`, comment `5265826161:17`, and `nextjs-session.md:41` all
retain. PR #1652's Definition of Done asserts "Every number is reproduced by published inputs and
procedure." The count is honest — the generator reproduced it against the authorized checkout — but
no reader can reproduce it from anything published, which is exactly what the label claims.
Verified: the evidence directory listing is Session-only.

**F2 — evidence cited through mutable branch refs.** Comment `5265826161` links the manifest and
aggregate as `…/blob/docs/comparison-docs-programme/…`. Verified both blob URLs resolve to the
branch, not a commit; the case page does it correctly at `nextjs-session.md:26-27` with the
immutable permalink `…/blob/4e6d52b3d2cb0bf24aca9a47a67da46a213fef64/…`. Both return 200 today and
will 404 the moment #1652 merges and the branch is deleted. `methodology.md:58` requires an
"immutable commit or release identifier" for evidence sources.

F3 (manifest omits three `methodology.md` §3 fields), F4 (PR body materially false at the evaluated
head), and F5 (matrix column heading diverges from the methodology) are minor.

### This orchestrator's Tier-A pass missed both blocking findings

The S3 Tier-A review verified that the Session count `94 / 92` matched between the case page and
comment `5265826161`, and treated the comment set as consistent. It did **not** check that the
Channel figure `181 / 178` had a reproducible published input, and did **not** check the mutability
of the evidence URLs inside the comments. Both defects sit precisely on the evidence-integrity
contract this changeset exists to establish, and both were reachable with the same cheap checks the
review already ran on adjacent facts. The Tier-A PASS at `15429cf84` stands as recorded, but it was
not sufficient, and the gate that caught this is the reason generator-and-supervisor separation from
the formal evaluator is a hard invariant rather than a formality.

### Position

No fix was attempted. The coordinator's grant ends at this single formal gate, and `FAIL_FIX` means
the plan remains valid while the docs need more work — a bounded fix slice on the same Codex author
thread, then fresh Tier-A and a re-run of the formal gate on the new head. The lane holds for
coordinator direction. PR #1652 remains draft at `status:impl`, `Part of #1551`, no closing keyword,
labels unchanged.

## 2026-08-15 — bounded repair slice dispatched for all five IMPL-EVAL findings

Pre-dispatch reconcile: leaf `e95f48380`, tree clean, local equals remote equals PR head; input
clean at `5191de8`; the cycle-1 evaluator session `c6950ed9` confirmed `idle` with its artifact
committed and verdict posted, so no concurrent writer holds the worktree. Resumed the preserved
author thread `019ffcc9-16c2-7573-b7f6-d627172408e8`, detached, PID `164008`. No replacement sender.

Findings dispatched with explicit dispositions:

- **F1** — relabel the Channel `181 / 178` count to `inspected` and restore the shared `measured`
  definition in comment `5265971722`'s legend. No remeasurement, no pin change. Publishing a Channel
  manifest instead is allowed only if genuinely smaller, and the leaf must stop and report before
  choosing it — that path would pull Channel evidence into 0.0.7 scope that #1649 owns.
- **F2** — rewrite both mutable branch-ref URLs in comment `5265826161` in place to commit-SHA
  permalinks.
- **F3** — add `frameworkVersions`, `featureFlags`, `inspectedAt` to the manifest with schema, tool,
  tests, and emitted measurements kept consistent and byte-stable reproduction preserved.
- **F4** — rewrite the PR body to the actual landed S1/S2/S3/E0 and validation state, with no
  Definition-of-Done box ticked that is not truthfully satisfied; the evaluation boxes stay
  unchecked at cycle-1 `FAIL_FIX`.
- **F5** — align the matrix heading to `Residual owner` per `methodology.md:130`.

### Sequencing constraint identified before dispatch

F3 changes the manifest, so an F2 permalink to `4e6d52b3d` would cite superseded content. The brief
therefore requires the repository changes to land first and the comment edits to use the **resulting
repair commit SHA**. It also flags that `nextjs-session.md:26-27` currently permalinks `4e6d52b3d…`,
which F3 supersedes, and requires that permalink updated in the same slice — a consistency
consequence the findings list does not state explicitly.

Gates: the five cheap docs rows plus the structured check/fmt/test wrappers for the tool and its
test, since F3 touches both. The lint row remains N/A on the root-config evidence. No Aspire,
Docker, E2E, scaffold, or lease.

### Tier-A interpretation, flagged to the coordinator

The grant says "arrange independent Tier-A review". Read against the harness, Tier-A is the topic
supervisor's role and "independent" means independent of the implementing lane, which this
orchestrator satisfies. The alternative reading — a reviewer independent of _this orchestrator_,
given that its cycle-1 Tier-A missed both blocking findings — is plausible but is not the harness's
defined shape and no route was supplied for it. This lane will perform Tier-A itself, hardened
specifically against the two classes it missed: label-versus-published-evidence reachability, and
mutability of every published evidence URL. The coordinator can redirect to a separate reviewer if
that was the intent.

## 2026-08-15 — formal IMPL-EVAL cycle 2 dispatched

Pre-launch reconcile: local `HEAD`, `origin/docs/comparison-docs-programme`, PR head, and the
coordinator's target SHA **all four** equal `c7ce58a19494024c219e9970deeb3ece878232d6`; tree clean.

The cycle-1 evaluator `c6950ed9` was retired with `claude stop` before launch — it was `idle` with
its artifact committed and verdict posted, so this is clean shutdown of finished work, not the
killing of a live agent. Sessions attached to the leaf worktree afterwards: **0**. That makes the
one-evaluator-per-topic invariant crisp and guarantees cycle 2 cannot reuse the cycle-1 session.

### Evaluator identity

| Field              | Value                                                                                                                                         |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Role               | formal IMPL-EVAL **cycle 2**, evaluated source `c7ce58a19494024c219e9970deeb3ece878232d6`                                                     |
| Requested route    | native Claude · Opus 5 · effort **medium** · Remote Control · `bypassPermissions`                                                             |
| Observed route     | `respawnFlags`: `--model claude-opus-5 --effort medium --remote-control --permission-mode bypassPermissions`                                  |
| Route verdict      | **matched**                                                                                                                                   |
| Claude session id  | `4ed649d5-9d62-4e24-a50a-081477607cee`                                                                                                        |
| Background job id  | `4ed649d5`                                                                                                                                    |
| PID                | `145190`                                                                                                                                      |
| Exact cwd          | `/home/codex/repos/netscript-007-docs-comparison`                                                                                             |
| `bridgeSessionId`  | `session_013RN66nBipHogdecXX4uZ9G`                                                                                                            |
| Remote Control URL | `https://claude.ai/code/session_013RN66nBipHogdecXX4uZ9G`                                                                                     |
| Family separation  | fresh session, opposite family to Codex author `019ffcc9-16c2-7573-b7f6-d627172408e8`, and distinct from retired cycle-1 evaluator `c6950ed9` |

Brief delivery verified rather than assumed: `respawnFlags` contains no swallowed long string, and
the transcript's first `type:"user"` record is 8,595 characters opening
`use harness  # Formal
IMPL-EVAL cycle 2` and containing the exact evaluated source.

### Brief emphasis

The evaluator is told this is cycle 2 of a two-failure limit, so a further `FAIL_*` escalates rather
than loops — raising the cost of both a false pass and a false fail. It must re-check F1–F5 itself
rather than inherit any account, and it is told explicitly that **this orchestrator's own cycle-1
Tier-A missed F1 and F2**, so the repair review's conclusions are claims to test rather than
findings to adopt.

It is additionally pointed at the sequencing/provenance risk in concrete terms: verify that the SHA
cited by the comments and by `nextjs-session.md` still contains the current manifest, via
`git diff <cited-sha> c7ce58a19 -- docs/site/comparisons/evidence/`, and treat a non-empty diff as a
finding. Provenance is generalized beyond F2 — every published claim must cite something immutable
and reachable.

Gates are the five cheap docs rows plus the three structured wrappers for the tool and its test. No
Aspire, Docker, E2E, scaffold, lease, or write of any kind to the read-only external input.

## 2026-08-15 — formal IMPL-EVAL cycle 2 verdict: PASS

Terminal at evaluated source `c7ce58a19494024c219e9970deeb3ece878232d6`. Artifact commit `71cc5a02c`
(`evaluate.md` only); verdict comment `issuecomment-5300916189` (`2026-08-15T06:21:28Z`). Local,
remote, and PR head all `71cc5a02c`; tree clean. PR remains draft at `status:impl`, milestone
`0.0.7`, labels unchanged.

All eight gates green in the evaluator's own run: `verify`, `docs:links`, `docs:accuracy`,
`git diff --check`, lockfile guard, and the three structured wrappers for the measurement tool and
its test — every raw exit `0`.

### F1–F5 independently re-checked, all repaired

The evaluator confirms it did not consult the cycle-1 evaluator, the generator, or this
orchestrator, and it marked all five findings repaired on its own evidence.

Its F2 work went beyond the brief. It did not stop at HTTP `200`: it compared blob SHAs served by
`gh api contents?ref=43c702b97` against local `git hash-object` for both evidence files and found
them identical, proving the permalinks serve the manifest **as it now stands** rather than a
superseded version. It then verified the ordering with timestamps — the F3 amendment at `43c702b97`
precedes the comment edits by 36 and 37 seconds — confirming the sequencing constraint this lane
identified before dispatch actually held in execution rather than only in intent.

### Three non-blocking findings

**N1 — the published normalized SHA-256 does not reproduce from the stated procedure.** The digest
`3d9d2eef…` appears in the PR body and four run artifacts. The evaluator applied **21** distinct
normalizations, including the tool's own `serializeMeasurement` form, and none yields it; the
predecessor digest `b9e96ed2…` likewise does not reproduce. Weight is limited because the property
the digest stands for is independently true — fixed-`--observed-at` regeneration is byte-identical,
which the evaluator proved directly and this orchestrator proved twice — and because the digest
appears on no docs page and in neither canonical comment. It is nonetheless an unreproducible number
offered as evidence inside a changeset about reproducible evidence, and it should be corrected
before `status:ready-merge`: publish the exact normalization command, or replace the digest with the
`cmp`/`diff` result that is actually reproducible.

Note this digest originated in the leaf's own reporting and was **relayed by this orchestrator** in
the S2 sign-off without independent reproduction. That is the same class of miss as cycle 1's F1 —
accepting a stated number because the property behind it was true.

**N2** — `plan.md`'s Status line is stale at this head. **N3** — two internal-record inaccuracies in
`worklog.md`. Both non-blocking and confined to run artifacts.

### Boundaries

The evaluator authored no product file, left #1551, both canonical comments, the pin, labels, draft
state, milestone, and all coordinator artifacts untouched, read the external input without writing,
fetching, checking out, or re-pinning, wrote its reproduction to a scratch path outside both
repositories, launched no agent, took no lease, and ran no expensive or shared gate.

### Position

The two-failure eval limit is not reached: cycle 1 `FAIL_FIX`, cycle 2 `PASS`. The lane holds for
coordinator direction on N1–N3 and on any merge-readiness sequence. Nothing was readied, merged, or
published from this lane.

## 2026-08-15 — terminal lease reconciled; N1–N3 cleanup complete; Tier-A PASS

### Terminal gate independently verified

Evaluator commit `71cc5a02cde091f862c9892464ea77cc962b3675` is **artifact-only** — exactly one file,
`evaluate.md`. Evaluated immutable source `c7ce58a19494024c219e9970deeb3ece878232d6`; verdict
comment `5300916189`. No further formal evaluator was launched; all five cycle-1 blockers are
closed.

### Cleanup — `0251b281c` then `c8e3f26d8`

**N1.** The orchestrator computed the normalization itself rather than relaying it: deleting
`observedAt` and serializing as `JSON.stringify(o, null, 2) + "\n"` yields
`0be43e058bd8fdce8f4076fce9e94101fd43c643eadfef88475576245899c014`, matching both the leaf and the
evaluator, while `3d9d2eef…` does not reproduce. The alternate forms `75edd56a…` (no trailing
newline) and `baf8c1dc…` (compact) also match the evaluator's reported values — three independent
confirmations. The live F3 gate row now carries the exact measurement command and `cmp` raw exit `0`
in place of a digest, and the PR body carries the same reproducible evidence with the bad digest
removed.

`drift.md` shows **zero deletions**: the correction is appended at `:209` and the historical entries
are preserved, which is the right handling for an append-only log.

**N2.** `plan.md` Status refreshed to the actual state; locked decisions, slice definitions, and
gate lists untouched.

**N3.** `worklog.md` citation corrected to `## 7. Complete every matrix row`. Both Tier-A repair
checkboxes ticked — correct, because the finding named the Slices and Definition-of-Done locations
of one fact.

### Residual found by Tier-A and repaired

Two standing claims of the non-reproducing predecessor digest survived the first cleanup at
`worklog.md:58` and `:147` — the latter a gate row marked `PASS` whose cited evidence was
`b9e96ed2…`, which is exactly what N1 objected to. Fixed at `c8e3f26d8` by annotating those two rows
in place with a superseded pointer rather than rewriting them: the standing claim is neutralised
where it appears while the dated record of what was originally reported survives. Rewriting them
would have been revisionism of the kind the append-only rule exists to prevent. A scan now returns
**zero** un-annotated digest mentions.

Raising this rather than signing off around it was deliberate. This lane had already missed the same
class twice — cycle-1's F1, and relaying this very digest at S2 sign-off without reproducing it.

### Tier-A verdict: PASS on precisely these fixes

| Check                    | Result                                                                       |
| ------------------------ | ---------------------------------------------------------------------------- |
| Heads                    | local = remote = `c8e3f26d85c201827812e8292adb668d88b9c19d`                  |
| Working tree             | clean                                                                        |
| `git diff --check`       | raw exit `0`                                                                 |
| Lockfile guard vs `main` | raw exit `0`, both unchanged                                                 |
| External input           | clean at `5191de83…`, never written                                          |
| Canonical #1551 comments | untouched by both commits                                                    |
| Product/docs content     | untouched — cleanup commits contain run artifacts only                       |
| PR state                 | draft, `status:impl`, milestone `0.0.7`, `Part of #1551`, no closing keyword |

No `docs/site/**` path changed in either commit, so the site verifier was not applicable and was not
claimed.

### Observation left for the coordinator's readiness disposition

Two boxes remain unchecked — "Fresh opposite-family IMPL-EVAL cycle 2 PASS" and "Separate
opposite-family IMPL-EVAL passes" — although cycle 2 returned `PASS` and both are now truthfully
checkable. They were left unchecked on the explicit instruction to tick only the already-proven
Tier-A repair checkbox. Understating completion is the safe direction, but the coordinator may want
them ticked as part of the readiness disposition rather than carried as a false negative.

The lane stops here for that disposition. No ready flip, merge, publish, PLAN-EVAL, IMPL-EVAL cycle
3, or next leaf.

## 2026-08-15 — derived-asset amendment complete; CI green; Tier-A PASS

Leaf head `d24c3fa03197cfcf0adcc91eca08847d6a26bd8c`, pushed, tree clean. Review artifact:
`tier-a-assets-barrel-review.md`.

`pr-checks PASS` at that head — 20 checks, **0 current failures**. Both freshness steps now pass and
the `quality` job is green, closing the cascade that began with the stale agent-docs corpus.

Determinism proved by re-running `gen:assets-barrel` at the committed head: exit `0` with a
completely clean tree, so the committed bytes are exactly the deterministic output. Delta matched
the pre-dispatch prediction of 11 insertions / 6 deletions in one file, and no other barrel target
moved.

The author's first `assets-barrel` receipt went exit `1` unstaged → `0` after staging. Tier-A
rejected that as a weak proof — `check:assets-barrel` ends in `git diff --exit-code`, which compares
the working tree to the index, so staging passes while the file still differs from `HEAD`, a state
CI never sees. Required a post-commit re-run instead: `run-gate.ts --gate assets-barrel` exit `0` at
`gitHead d24c3fa031`.

Reviewer-run gates: determinism `0`, post-commit receipt `0`, `quality:gate` `0` with no
`quality:scan` finding in the generated file, scoped structured check `0`, `git diff --check` `0`,
lockfile guard `0`. Scoped `fmt`/`lint` on `packages/cli/**` recorded **N/A — not applicable** on
root-config evidence.

### Two prescribing errors by this orchestrator in one slice

The leaf blocked twice, correctly, on defects in briefs this lane wrote:

1. The first brief required amending `plan.md` and then omitted `plan.md` from its "allowed changes,
   and nothing else" list. The leaf ran nothing and asked.
2. The second prescribed a scoped `fmt` gate on `packages/cli/**`, a path root `deno.json` excludes
   from `fmt` — a config this orchestrator had already read earlier in the same run when ruling the
   S2 lint row N/A.

Neither cost any wrong action, because the leaf refused to guess both times. Three of this run's
stops now trace to prescribed gates the repository's own configuration excludes; two of the three
were this lane's. The generalizable rule: before prescribing a scoped wrapper, check the target path
against the relevant `exclude` list in `deno.json` rather than inferring the gate from artifact
type.

### Preservation

Against the cycle-2 evaluated source `c7ce58a19`, `docs/site`, `.llm/tools/docs`, and both lockfiles
are byte-unchanged. The full change set since that source is eight files — two agent-docs assets,
five run artifacts, and one generated CLI asset. `plan.md`'s delta is a pure addition scoped to the
amendment and its `PLAN-EVAL: N/A` record, with zero deletions. No canonical #1551 comment, pin,
label, milestone, or issue state changed.

Cycle-2 `PASS` remains the content verdict; no IMPL-EVAL cycle 3 was launched. Lane stops for
coordinator readiness disposition.

## 2026-08-15 — Tier-A closure on the generated cascade: PASS; readiness withheld

Final head `a465836b4cc1c40262a473de07b5744e70b20ead`; local, remote, and PR head agree; tree clean.
Review artifact: `tier-a-generated-cascade-review.md`.

One stale input propagated through three generators, each fix exposing the next consumer:
`build-agent-docs-bundle.ts` → the two agent-docs assets (`c8e3f26d85`);
`generate-cli-assets-barrel.ts:382,389` → `packages/cli/.../agent-docs.generated.ts` (`d4a0a8340`);
`generate-publish-assets.ts:34-43` → `packages/mcp/src/publish-assets.generated.ts` (`d24c3fa03`).
Layers 2 and 3 are the two causal CI failures in the `d4a0` → final window and both are closed.

All four freshness gates re-executed by the reviewer at the final head — `check:agent-docs-prose`,
`check:assets-barrel`, `check:publish-assets`, `check:mcp-export-corpus` — every one raw exit `0`,
tree clean afterwards. They were run only after confirming the author's turn was idle, so no
concurrent process could contaminate a receipt or a build directory. `mcp-export-corpus` was checked
to prove it was never implicated, not because it was suspected.

Determinism proved at both generated heads: `gen:assets-barrel` at `d24c3fa03` and
`gen:publish-assets` at `a465836b4` each exit `0` with a clean tree, so the committed bytes are the
generators' deterministic output.

Structured receipt validated: `publish-assets.json` carries `exitCode 0` and
`gitHead a465836b4cc1c40262a473de07b5744e70b20ead` — the full committed head, so a genuine
post-commit receipt rather than the staged-state artifact Tier-A rejected at layer 2.

Preservation: against the cycle-2 source `c7ce58a19`, `docs/site`, `.llm/tools`, and both lockfiles
are byte-unchanged. Nine files total since that source — two agent-docs assets, five run artifacts,
two generated package assets. No canonical comment, pin, label, milestone, or issue state changed.

### The reviewable failure was process, not code

Layers 2 and 3 were each discovered by a CI run rather than predicted, and a repo memory already
recorded the layer-1→2 coupling. The closure only became systematic at layer 3, when this lane
enumerated and ran every freshness check in the repository before dispatching instead of fixing the
reported symptom. That enumeration is the practice worth keeping: when a generated asset is stale,
find the full consumer closure first.

### Readiness withheld

Actions at the final head: `Code quality` success, `Deploy docs site to Pages` success, three runs
skipped, and **`ci` run `31871283408` still `in_progress`**. Not terminal, therefore not green, and
not reported as green. Readiness will be reconciled only from the terminal state of `quality` and
`check-test` at the exact head, and published as a **new authoritative PR comment** rather than by
editing the stale one — the earlier `pr-checks`-snapshot error is corrected append-only in
`drift.md`, not rewritten.

No Definition-of-Done box ticked, no ready flip, merge, publish, relabel, or next docs leaf. This
topic remains independent of the internals, fixes, and features lanes.

## 2026-08-15 — exact-head Actions terminal green; readiness reconciled

Run `31871283408` at `a465836b4cc1c40262a473de07b5744e70b20ead` reached `status=completed`,
`conclusion=success`, **0 job failures**. `quality` completed/success and `check-test`
completed/success — the two the coordinator required. `close-gate`, `classify changes`, and
`core CI lane visibility` also success; `deps-report` skipped. Sibling runs at the same head:
`Code quality` success, `Deploy docs site to Pages` success, three skipped.

This is the terminal state of the specific run at the exact head, read from Actions — not an
`agentic:pr-checks` snapshot. That distinction is the whole content of the earlier correction.

Authoritative reconciliation posted as a **new** comment `issuecomment-5301124116`, superseding the
CI status in `5301061539`. The stale comment was left intact deliberately: the record is corrected
forward rather than rewritten, matching how the leaf handled its own superseded digest claims.

### PR state observed, not set by this lane

Head `a465836b4`, draft `false`, **21/21 checkboxes checked**, `Part of #1551` with no closing
keyword, labels `area:docs` · `type:docs` · `priority:p2` · `ci:skip-e2e` · `ci:skip-scaffold` ·
`status:impl-eval` · `impl-eval:skip`.

The final checkbox ticks, the draft flip, and the `impl-eval:skip` label were all applied outside
this lane. Nothing was ticked, flipped, or relabelled here — the two Definition-of-Done boxes this
lane had twice flagged as a false negative were resolved by the coordinator before the condition to
tick them was reached, so no action was needed or taken.

### Lane position

Content verdict remains IMPL-EVAL cycle 2 `PASS` at `c7ce58a19`; no cycle 3 launched. The generated
cascade is closed with all four freshness gates green at the final head, both generators proved
no-op, and a post-commit receipt bound to the full committed `gitHead`.

Merge disposition belongs to the coordinator. This lane has not merged, published, relabelled, or
started the next docs leaf, and holds there until this leaf reaches a terminal merge disposition.
This topic remained independent of the internals, fixes, and features lanes throughout.

## 2026-08-15 — #1652 merged; docs lane 0.0.7 scope complete; no next leaf exists

### Merge reconciled and independently verified

| Fact                   | Value                                                                 |
| ---------------------- | --------------------------------------------------------------------- |
| Merge commit on `main` | `e090f894ff3682405a36e4f896ffd2cc16f9a1f8`                            |
| `origin/main` subject  | `docs(positioning): seed the Next.js comparison programme (#1652)`    |
| Merged from            | `a465836b4cc1c40262a473de07b5744e70b20ead`                            |
| Merged at              | `2026-08-15T07:21:13Z`                                                |
| PR #1652               | `merged: true`, state `closed`, labels normalized to `status:shipped` |
| `impl-eval:skip`       | **removed** post-merge, as the coordinator committed to doing         |
| Issue #1551            | `closed` / `completed`, `status:shipped`                              |

The `impl-eval:skip` removal matters to the record: the label had been redispatch suppression, and
leaving it on a shipped PR whose IMPL-EVAL genuinely passed at cycle 2 would have read as a waived
evaluation. The terminal record now shows the evaluation as earned.

### No next eligible docs leaf — the lane's committed scope is exhausted

The coordinator's instruction was to select and dispatch the next eligible docs leaf. **There is
none**, established from the central control plane rather than assumed:

- `milestone-cluster-state.json` → docs lane `issueNumbers: [1551]` — one issue, now closed.
- Docs leaves in cluster state and `milestone-leaf-plan.json`: exactly one,
  `comparison-docs-programme` (issues `[1551]`, wave 0) — merged.

Seven open 0.0.7 issues carry `area:docs` or `type:docs`, so a label-based read would wrongly
suggest remaining docs work. Checked against allocation instead: **every one belongs to another
lane** — internals `#1533`; fixes `#1112`, `#1350`, `#1461`, `#1623`; features `#1360`, `#1502`.
None is allocated to docs. Taking one would breach the coordinator's exclusive issue allocation and
the lane independence this topic has held throughout.

The six residual issues this run filed — `#1645`–`#1650` — are all open in **Backlog / Triage**, not
0.0.7. They were deliberately deferred so the comparison programme could ship a bounded slice, and
they are not eligible 0.0.7 work.

### Position

Nothing was dispatched, because dispatching would have required either inventing scope or taking
another lane's issue. The docs lane has delivered its entire committed 0.0.7 allocation: one issue,
one leaf, merged and shipped at `e090f894f`.

This is returned to the coordinator as a scope decision: either allocate further 0.0.7 docs scope to
this lane, promote one or more of `#1645`–`#1650` out of Backlog, or mark the docs lane terminal for
0.0.7. The supervisor session and the original Codex author thread
`019ffcc9-16c2-7573-b7f6-d627172408e8` are preserved and idle, ready for either outcome. No formal
cycle was relaunched for #1652.

Immutable base for any next docs leaf: `e090f894ff3682405a36e4f896ffd2cc16f9a1f8`.

## 2026-08-15 — #1660 terminal green at 615786c1a; merge withheld, coordinator is sole authority

### Terminal CI, read from Actions at the exact head

Head `615786c1a93c39e7f6b9a1b40b5cee39b163ff8a`. Run `31876605723` (`ci`) `completed/success` with
**zero job failures**: `quality` success, `check-test` success, `close-gate` success,
`classify changes` success, `core CI lane visibility` success, `deps-report` skipped. Sibling runs
at the same head: `Code quality` success, `Deploy docs site to Pages` success;
`public-surface-diff`, `e2e-cli`, and the OpenHands runner skipped. **Zero non-success terminal
runs.**

`check-test` is the job that failed the previous readiness run, and `close-gate` passing confirms
the eight #1659 acceptance boxes were accepted with their evidence.

PR #1660 observed as `state: open`, `draft: false`, `mergeable: true`, `mergeable_state: clean`,
base `main`.

### Tier-A made durable at the exact content head

The census repair had gates run but no recorded review until `issuecomment-5301575337`. That comment
now carries the invariant table establishing the failure as a test defect, the repaired assertion,
the four gate exit codes, and the decisive check that `git diff e35824d41..615786c1a -- docs/site`
is empty — the comparison pages were never edited to satisfy a test.

### Merge withheld, and an authority conflict surfaced rather than resolved

The owner instructed this lane directly to merge once finished so the pages could be reviewed on the
published site. The coordinator subsequently stated it remains sole merge authority. Those
instructions conflict.

This lane followed the coordinator's restriction, on the reasoning that not merging is reversible
while merging against an explicit prohibition is not — and surfaced the conflict to both rather than
resolving it by following whichever instruction arrived most recently. Choosing silently between two
authorities is not a call a topic orchestrator should make.

### Lifecycle state disclosed, not reverted

`draft: false`, `status:ready-merge`, and `impl-eval:skip` were set by this lane earlier, acting on
the owner's merge instruction and before the coordinator's correction. They are left as-is:
reverting is itself a lifecycle mutation, which the correction forbids. Disclosed on the PR so the
state is not discovered later and mistaken for someone else's action.

Also disclosed on the PR: **no formal IMPL-EVAL ran on #1660.** Tier-A is the only independent
review this changeset has had, unlike #1652 which earned a cycle-2 `PASS`. `impl-eval:skip`
suppresses the automatic ready-transition dispatch; it does not represent a waived evaluation.

### Publication paths

`/netscript/comparisons/frontend/` and `/netscript/comparisons/backend/`, plus the rewritten
`/netscript/comparisons/` chooser. The site deploys from `main`, so these resolve only after a merge
performed by the coordinator; until then they are paths rather than live links.

## 2026-08-15 — #1660 merged; docs lane recorded EXHAUSTED / PARKED

### Merge reconciled, verified independently

| Fact                  | Value                                                                  |
| --------------------- | ---------------------------------------------------------------------- |
| Merge commit          | `729386c567bfbd0b8c7f86a4ed09348f0a8a4ad8`                             |
| `origin/main` subject | `docs(comparisons): replace the protocol with an argument (#1660)`     |
| Merged from / at      | `615786c1a` at `2026-08-15T09:25:56Z`                                  |
| PR #1660              | `merged: true`, closed, `status:shipped`, `impl-eval:skip` **removed** |
| Issue #1659           | closed/completed, **8/8** boxes, `status:shipped`                      |

Removing `impl-eval:skip` post-merge matters to the record: it had been redispatch suppression, and
leaving it on a shipped PR would have implied a waived evaluation.

### Published surface verified by this lane, not taken on report

| URL                                   | Status  | Title                                                     |
| ------------------------------------- | ------- | --------------------------------------------------------- |
| `/netscript/comparisons/`             | **200** | Comparisons · NetScript Docs                              |
| `/netscript/comparisons/frontend/`    | **200** | NetScript vs Next.js, Nuxt, SvelteKit, and TanStack Start |
| `/netscript/comparisons/backend/`     | **200** | NetScript vs Nest.js, Hono, and Encore.dev                |
| `/netscript/comparisons/methodology/` | **404** | protocol page gone from the live site                     |
| `/netscript/migration/`               | **404** | gone                                                      |

The selector markup is present on both comparison pages. The 404s matter as much as the 200s: they
prove the protocol surface was actually removed from publication, not merely superseded.

### No next eligible docs leaf — lane exhausted

Established from the control plane rather than from labels. `milestone-cluster-state.json` allocates
the docs lane exactly `[1551]`, which is closed; **zero** docs-lane issues remain open. Six open
0.0.7 issues still carry `area:docs`/`type:docs`, so a label-based read would wrongly suggest
remaining docs work — but every one belongs to another lane: fixes `#1112`, `#1350`, `#1461`,
`#1623`; internals `#1533`; features `#1360`. Taking any would breach exclusive issue allocation.

Nothing was dispatched. The lane is recorded **EXHAUSTED / PARKED** for 0.0.7 in `supervisor.md` and
`context-pack.md`, both of which had been stale since the opening reconciliation and are now current
as a resumable record.

### Lane summary

Two leaves shipped. The second deleted most of the first — a 151-line methodology page, a 171-line
case study, 372 lines of private-repository evidence JSON, a 718-line measurement tool and its
276-line test, and both migration pages — and replaced them with two opinionated comparison pages
carrying a competitor selector.

The reviewable failure of this lane was the category error behind the first attempt: applying
evidence-integrity rigor to a **positioning** artifact. It produced a protocol nobody needed and
deleted the most communicative content in the run because it was not script-reproducible. The
estimates were recovered from GitHub `userContentEdits` and restored as labelled architectural
estimates. Five operating rules earned along the way are recorded in `context-pack.md`.

Preserved and idle for any reactivation: Codex threads `019ffcc9-16c2-7573-b7f6-d627172408e8` and
`01a0047a-aceb-7b53-9ba1-9191eedaaf1a`. Immutable base `729386c567bfbd0b8c7f86a4ed09348f0a8a4ad8`.
No coordinator-owned merge state was mutated by this lane.

## Resumed reconciliation — 2026-08-15, main at `baf1cdf67`

The lane was resumed after a context break and reconciled against the coordinator's own control
plane rather than against this run's cached record. Nothing was dispatched, because nothing is
allocated.

**Identity re-proved.** PID `2429469` is dead; this session is a respawn at PID `11850` on the
unchanged Claude session `fcf04b0f-3c2f-4844-9508-84c52ce8298c`, argv
`--model claude-opus-5 --effort high --remote-control --name netscript-007-docs`, cwd
`/home/codex/repos/netscript-007-docs`. The bridge id rotated to
`session_01SBHRTmr6ddueUYzCbcXrRV`; the URL previously published in `supervisor.md` is dead and has
been corrected. A respawn rotates the bridge id while preserving the session id — a published
Remote Control URL is therefore not durable across a respawn and must be re-read, not carried
forward.

**Coordinator state read at source.** `chore/release-0.0.7-orchestration` commit `353bd087a`
(14:38 local, `updatedAt` `2026-08-15T11:51:00Z`) carries `currentMainSha`
`baf1cdf67a4e931af17b4772ddf6101f36152184`, matching `origin/main`. It allocates the docs lane
exactly `[1551]` — unchanged — and records both docs leaves as `phase: merged`
(`comparison-docs-programme` → #1652, `comparison-vs-pages` → #1660,
`implementationState: merged_and_published`). No docs leaf sits in `planned` or `impl`. No new
docs allocation, no dependency release, no re-intake directed at this lane.

**Allocation exclusivity re-checked against every open 0.0.7 issue.** All 46 are claimed by another
lane: internals `[1296, 1378, 1429, 1533, 1542, 1545, 1557, 1561, 1563, 1601, 1604, 1611, 1613,
1618, 1621, 1622]`, fixes `[1093, 1112, 1243, 1249, 1262, 1263, 1350, 1351, 1353, 1357, 1358, 1448,
1461, 1462, 1481, 1543, 1544, 1588, 1598, 1609, 1610, 1616, 1619, 1620, 1623, 1637]`, features
`[1293, 1348, 1349, 1352, 1354, 1355, 1360, 1451, 1452, 1455, 1458, 1466, 1467, 1502, 1590, 1591,
1592]`. The one open docs-titled issue outside those sets, `#1642`
(`docs(aspire): expose detached non-TTY start state…`), is milestoned **Backlog / Triage**, not
0.0.7, so it is not this milestone's work to take. Re-intake is coordinator-owned
(`milestone-run.md` §"the coordinator owns scheduling, dependency release, merge authority,
re-intake") — a topic orchestrator that self-allocates from the backlog breaks exclusivity, so this
lane reports idle capacity instead.

**Published surface re-verified after three later merges** (`05fc3132b`, `3fc0f2f92`, `baf1cdf67`
landed on top of `729386c56`). `/netscript/comparisons/` 200 "Comparisons", `/comparisons/frontend/`
200 "NetScript vs Next.js, Nuxt, SvelteKit, and TanStack Start", `/comparisons/backend/` 200
"NetScript vs Nest.js, Hono, and Encore.dev"; `/comparisons/methodology/` and `/migration/` still
404. The deleted protocol surface has stayed deleted through later deploys.

**Lane hygiene.** All three docs worktrees clean at their recorded heads —
`netscript-007-docs` `0ca4c489f`, `netscript-007-docs-vs` `615786c1a`,
`netscript-007-docs-comparison` `a465836b4`. No live Codex author process for either preserved
thread. Topic branch matches `origin` at `0ca4c489f` by `git ls-remote`.

Lane remains **EXHAUSTED / PARKED**, now against a verified-current control plane. It is available
for immediate dispatch on coordinator allocation.

## 2026-08-30 — NAS resume, first reconciliation against main `13878a80`

- Resumed on the NAS agent plane at worktree `projects/netscript/worktrees/007-docs`. Verified clean
  tree, local `16325036f` == remote topic branch, `origin/main` == `13878a80` via `git ls-remote`.
  No runtime lease requested or held; migration/handoff artifacts left outside the repository.
- Reconciled the 8 commits `c73d361ee..13878a80`. Docs fallout from #1696 is complete in-slice
  (reference/ai + README + all four derived layers). #1711 was self-contained.
- **D-1 (new, unclaimed):** #1729 shipped #1675 — canonical `.agents/skills/` for every host,
  `.claude/skills/` demoted to a mirror — and `docs/site` never mentions `.agents/skills/` at all.
  `ai/agent-tooling.md:68`, `reference/cli/commands.md:57`, `reference/ai/skills.md:26,43` still teach
  the superseded Claude-only contract. #1737 covers the skill bodies, not these pages.
- **D-2:** #1728's new fatal unresolved-reference error is undocumented (no page falsified).
- **D-3:** no hand-written 0.0.7 release intro exists (required by `release:publish`);
  `packages/cli/CHANGELOG.md` stops at 0.0.6; the user-facing payload is in no canary yet.
- Nothing filed, nothing merged, no labels or milestones touched. D-1 proposed to the coordinator;
  lane stays event-driven at exhausted allocation `[1551]`.

## 2026-08-30 — restart recovery: two live leaves reconciled, #1746 driven to ready-merge

Resumed after a context break. Git and live GitHub were treated as authoritative; the context pack
was stale (it predates both leaves and still described the lane as EXHAUSTED / PARKED).

**Supervisor identity re-proved.** The recorded session `fcf04b0f-3c2f-4844-9508-84c52ce8298c` is
gone. This is a **new** session, not a resume: PID `5519`, Claude session
`1d06dd31-be07-405a-9762-e641197e285f`, bridge `session_016g86jW5sMJE9z9EHHGPByH`, Remote Control
URL `https://claude.ai/code/session_016g86jW5sMJE9z9EHHGPByH`, tmux `netscript-007-docs-r2:@16.%16`,
registry `~/.claude/sessions/5519.json`. Attachment proved by the non-empty `bridgeSessionId` in the
registry entry whose `pid`/`cwd` match the live process, plus `--remote-control` in argv. Launched by
`hybrid-launcher.ts`, so argv carries **no** `--model`/`--effort` — the route identity is not
independently observable from argv on this host, unlike the previously recorded session. Recorded as
such rather than claimed.

### Exact heads at reconciliation

| Ref | SHA |
| --- | --- |
| `origin/main` | `13878a80a50c55b9662099fed64555f2310ae4a3` |
| PR #1746 `docs/agentic-cross-host-skills` | `84a5fd1164b2ee9cb564d10fb3854ee015a7ab17` |
| PR #1748 `docs/aspire-terminology-sweep` (on arrival) | `6b91eb2597d924a176b3d883aa7c34e556cde4e4` |

### #1746 — the stale evaluator, and what actually remained

`impl-eval-delta-2.md` stood at the exact head with `FAIL_FIX`, **PR-surface only** (B-1: the body
denied a file that was in the diff, DoD box 3 was false, Validation was dated to a superseded head
and omitted `check:publish-assets`). All five of B-1's required actions had since been applied to
the live PR, but **no evaluator had read the corrected surface** — a `FAIL_FIX` was the standing
exact-head verdict against a PR that had already been fixed.

One fresh separate-session IMPL-EVAL was obtained on the canonical route for Codex-authored work
(`formal_impl_evaluation` → native opposite-family, Claude · Fable 5). Verdict **`PASS` at
`84a5fd11`**, B-1 discharged on all five items. The evaluator declined to accept cycle 2's own
"re-evaluation is a body read" shortcut: it re-derived the gate set from generator inputs and re-ran
ten gates itself, all exit 0. Report: `impl-eval-exact-head.md` in the leaf run dir (untracked).
Observed identity `claude-fable-5`; the evaluator explicitly reported that effort is not observable
from inside the session and confirmed **model but not effort** — recorded as stated, not upgraded.

Review-thread gate `PASS threads=1 unanswered=0`. CI terminal and green at the exact head.

### #1748 — an exact-head `FAIL_FIX` that was real, not stale

Unlike #1746, this leaf's exact-head evaluator verdict was a genuine `FAIL_FIX` with two blocking
findings, both re-verified live before acting:

- **B-1** `docs/site/explanation/aspire.md:100-101` — the terminology sweep dropped ".NET" and left
  "assumptions people carry from Aspire". The two facts that follow (isolated TypeScript/Node
  runtime; derived graph) are precisely the contrast with a C#/.NET AppHost, so the edit turned a
  contrast into a near-tautology. Exactly the "scar" the run's brief forbade.
- **B-2** the run dir had no `supervisor.md` — `lane-policy.md:250` classes such a run as **not
  activated**.

The OpenHands cloud evaluator returned `PASS` on the same head and raised neither. Recorded because
it is the reusable lesson: a cloud `PASS` does not clear a native opposite-family `FAIL_FIX`, and
concurring verdicts are not additive evidence when one of them never looked.

### Author work — new Codex thread, and the lease that nearly forced the wrong call

Repair dispatched through the agentic tooling, not ad hoc. Three NAS-host obstacles, all recorded:

1. `launch-codex-slice` stages the brief with `cat <src> > <dest>`; passing `--brief` equal to
   `--dest` **truncated the source to 0 bytes**. Author the brief at a distinct path and stage to
   `/home/agent/`.
2. `/home/codex` no longer exists (it was a symlink to `/home/agent` before the restart), so the
   launcher's default staging path dies at the `stage` step. Explicit `--dest` rather than
   recreating the symlink.
3. The launcher refused with `duplicate_sender_risk`, directing a resume of thread `01a05185`. That
   block is computed as `Boolean(existing.sessionId)` from a durable record and **never consults the
   daemon** — it is not evidence the thread is alive. Liveness was proved independently: owner PID
   `524013` dead, and `01a05185` absent from the daemon's session list. The stale lease was then
   released through `LocalSenderOwnershipAdapter.release()` using the record's own `leaseToken`
   (`279b009f-…`), never `rm`, after a guard confirmed the owner was dead.

| Field | Value |
| --- | --- |
| Repair thread | `01a051d4-6d87-77c3-bdd7-e4a54401f2f4` (new; original impl was `01a05185-5b95-7ba1-aedc-04a69014f50e`) |
| Worktree | `/home/agent/projects/netscript/worktrees/007-leaf-1723a` |
| Requested route | Codex · OpenAI · `gpt-5.6-sol` · medium (`normal_implementation`) |
| Observed route | matched |
| Runtime | `approval=never`, `sandbox=dangerFullAccess`, app-server `0.151.0` with `--remote-control` |
| Steering | `codex exec resume 01a051d4-6d87-77c3-bdd7-e4a54401f2f4 -- "<follow-up>"` |
| Brief | `/home/agent/docs-1723a-repair-brief.md` |

Result: **S3 `3301f593b76a2878fd9a5a2978ad6c7a53861134`** (prose repair + `supervisor.md` + drift
D-7/D-8 + worklog) and **S4 `22e79dccf5f7cc8bb766d9eb1bd11d5bd8c9e525`** (four derived assets only),
pushed by explicit refspec.

**Tier-A performed by this lane at the pushed head, not taken from the author's report.** Product
diff is exactly one line — "carry from Aspire" → "carry from Aspire's .NET AppHost".
`git grep '\.NET Aspire'` outside `_plan`/`.llm` returns exactly the three pre-existing hits, so the
repair did not smuggle the product name back into the surface #1000 exists to clean. Both `13.4.6`
literals unchanged. `provenance.json` `sourceCommit` is `3301f593b` — the S3 prose commit that
immediately precedes the regeneration, so no orphan regeneration. `deno.lock` untouched. Product
tree clean; the only dirt is the two untracked evaluator evidence files.

A fresh separate-session IMPL-EVAL was then dispatched at `22e79dcc` on the same canonical route.

### #1746 readiness — performed truthfully, and stopped short of merging

- Filed **#1749** for the bounded `quickstart.vto` follow-up (advisory 7 on both the Tier-A and
  IMPL-EVAL passes): `type:docs`, `area:docs`, `priority:p3`, `status:triage`, milestone
  **`Backlog / Triage`**. Not 0.0.7 — the docs allocation is frozen at `[1551]` and closed, and a
  parked lane must not self-admit new scope into a frozen milestone. Re-milestoning is the
  coordinator's call.
- Issue #1745 `status:plan` → `status:ready-merge`; PR #1746 `status:impl-eval` →
  `status:ready-merge`. Exactly one `status:` label on each.
- CI re-triggered **by the supported label transition, without moving the head**: `close-gate`'s
  acceptance-evidence step reads labels **live at execution time** and skips itself when
  `status:ready-merge` is absent (`ci.yml:74-78`), so `gh run rerun 33298857537` re-executes it with
  the label now present. A push would have moved the head and voided the exact-head `PASS`.
  Note `gh pr edit` fails on this token (`read:org` not granted); PR labels go through the REST
  issues endpoint.

**Not merged.** Merge authority rests with the coordinator, and the standing instruction is a
hand-off to the human merge queue.

### Both leaves closed out to ready-merge — final state

| | PR #1746 | PR #1748 |
| --- | --- | --- |
| Exact head | `84a5fd1164b2ee9cb564d10fb3854ee015a7ab17` | `22e79dccf5f7cc8bb766d9eb1bd11d5bd8c9e525` |
| Exact-head IMPL-EVAL | **`PASS`**, separate session, Claude · Fable 5 | **`PASS`**, separate session, Claude · Fable 5 |
| Tier-A | prior passes carried; body re-verified | performed here at the pushed head |
| Review threads | `PASS threads=1 unanswered=0` | `PASS threads=0 unanswered=0` |
| CI | terminal green, attempt 2 | terminal green, attempt 3 |
| Closes | #1745 | #1000 (epic #1723 referenced, **no** keyword) |
| Label | `status:ready-merge` | `status:ready-merge` |
| Merged | **no** — handed to the human merge queue | **no** — handed to the human merge queue |

Both evaluators reported `claude-fable-5` as observed model and both stated that **effort is not
introspectable from inside the session**. Recorded as model-confirmed / effort-unconfirmed rather
than written up as a full route match. The same limitation applies to this supervisor session:
launched by `hybrid-launcher.ts`, its argv carries no `--model`/`--effort`, so route identity here is
asserted by configuration, not proved by process inspection — unlike the previously recorded docs
session whose argv did carry both.

**Issue hygiene, on explicit owner direction.** #1000 was normalized in place before hand-off:
legacy `documentation` label removed, colon taxonomy applied (`type:docs`, `area:docs`,
`area:aspire`, `priority:p3`), milestone moved `Backlog / Triage` → **0.0.7**, exactly one `status:`
retained (`status:ready-merge`). The earlier #1748 phase comment had said this lane would leave the
milestone to the coordinator; the owner then ruled directly. The correction is stated on the PR
rather than left for someone to notice the contradiction between two comments. Epic **#1723 remains
OPEN** and is referenced without a closing keyword.

#1749 filed to `Backlog / Triage` for the `quickstart.vto` follow-up — deliberately **not** 0.0.7,
since that is new scope rather than the normalization of an issue a 0.0.7 PR already closes.

**Lessons this recovery paid for**

1. **A stale `FAIL_FIX` is not a failing PR, and a `PASS` is not transferable across a head.** #1746
   carried an exact-head `FAIL_FIX` whose every required action had already been applied; #1748
   carried an exact-head `FAIL_FIX` that was entirely real. The verdicts looked identical from the
   label. Only reading both reports against the live surface separated them.
2. **Concurring verdicts are not additive when one did not look.** OpenHands returned `PASS` on the
   #1748 head where the native evaluator found two blocking defects. Counting it as agreement would
   have shipped a broken sentence and an unactivated run.
3. **The gate list is the attack surface, not the gate run.** Both evaluators were told explicitly to
   derive gates from generator inputs and to distrust the brief's own list. Both did, and the #1746
   omission was not repeated on #1748.
4. **`duplicate_sender_risk` is a lease record, not a liveness probe.** It is computed as
   `Boolean(existing.sessionId)` and never consults the daemon. Prove liveness independently and
   release through the adapter with the record's own token.
5. **Re-run, never re-push, to refresh CI on a verified head.** `close-gate` reads labels live, so a
   label transition plus `gh run rerun` re-executes the acceptance mirror while the head — and the
   exact-head verdict attached to it — survives.

## 2026-08-30 — ledger pushed; queue advanced to #1723 and found dependency-blocked

**Push.** `5188cbe8` pushed by explicit refspec after proving the remote was a strict ancestor
(fast-forward, no force) and that the seven-commit range touched **only**
`.llm/runs/orchestrator-release-0.0.7-docs--topic/` — no product path. `git ls-remote` confirms
local == remote at `5188cbe861c46f110589f7601252a725bdb71d11`; tree clean.

**Allocation re-read from the coordinator's control plane, not from labels.**
`chore/release-0.0.7-orchestration` @ `117e23f9` (`updatedAt` 2026-08-30T09:00:07Z, `currentMainSha`
`13878a80`) now allocates the docs lane **`[1551, 1723, 1745]`** — widened from the frozen `[1551]`
this lane had recorded. #1551 closed, #1745 → PR #1746 at ready-merge. **#1723 is the active
issue**, and #1748 was only its version-independent slice A.

The coordinator's `queueState` for this lane reads
`1746_exact_head_impl_eval_and_review_thread_gate; 1748_exact_head_evidence_reconciliation;
later_docs_serially` — the first two are now complete. Its `topicHeadSha` still records `5160a46c`
and is stale after this push; that field is coordinator-owned and was **not** mutated by this lane.
Reported rather than corrected.

**#1723 is blocked at the source, verified live rather than inferred.** The issue's own Related
section states "Depends on S1–S10 (prose must match shipped behaviour)". At `origin/main`
`13878a80`, `.github/toolchain.env` still pins `NETSCRIPT_ASPIRE_CLI_VERSION=13.4.6` /
`NETSCRIPT_ASPIRE_SDK_VERSION=13.4.6`, and every named dependency is **OPEN**: S1 #1727, S6 #1718
(PR #1743 still draft), S8 #1720, S3 #1741, S10 #1722, S5 #1740, and #1642 (which declares itself
outside 0.0.7). Nothing 13.5 has merged.

Both public version literals therefore read `13.4.6` and are **correct today**; writing 13.5.3 now
would publish documentation that is false against main. That is the reason S11 was sliced, and it is
why #1748 preserves both literals deliberately.

**No work was invented to look busy.** The one unblocked adjacent item —
`packages/aspire/README.md:11`, still ".NET Aspire" on a JSR-published README, so #1000's intent is
incomplete across every published surface — belongs to **S13 #1724**, which is not in this lane's
allocation. Taking it would breach exclusive issue allocation, so it was handed over on the PR and
on #1723 instead.

**Action taken:** a full status comment posted on #1723 enumerating every remaining row against the
dependency that releases it, plus two findings about the issue's own text — its acceptance lists
`deno task doc:lint`, which requires `--root` and lints TypeScript entrypoints, so it is inapplicable
to a prose slice (the PR that finally closes #1723 still owes a green run, which today means fixing a
pre-existing `packages/mcp` `private-type-ref`); and its scope header's 113-row manifest count needs
regenerating per its own instruction. `status:triage` → `status:plan`, since research and
decomposition are recorded and only implementation is waiting.

**Posture: event-driven on #1723.** Dependency release and re-intake are the coordinator's call. The
moment S1 **#1727** lands, the version-snippet bucket becomes actionable as a single slice and is the
natural next dispatch.

## 2026-08-30 — environment authority update applied; one published claim retracted

Owner environment-authority update received and **re-verified on the host rather than taken on
report**, per this lane's standing rule:

| Claim | Verification |
| --- | --- |
| PID 1 is `tini`, zombies 0 | `/proc/1` → `tini -- ttyd …`; `ps -eo stat` → 0 zombies |
| `netscript-dind` resolves | `/etc/hosts` → `10.4.12.16 netscript-dind` |
| Docker responds | `DOCKER_HOST=tcp://netscript-dind:2375 docker version` → **27.5.1** |
| Below-28 doctor result | warning only, not a failure or dispatch blocker |
| inotify ceiling | `max_user_instances` = **128**, 17 in use — the standing Phase-B quota blocker |

**A published claim was retracted.** PR #1748's Drift section asserted "this host's PID 1 is not
reaping processes, so any gate asserting no surviving child process is a false red at present." That
was honest when written and is now false. It is struck through and dated on the PR rather than
deleted, so the earlier classification stays auditable. A refusal reason that has expired must not
ride into a merge as though it were current — the PR was already at `status:ready-merge`, which is
exactly when a stale infrastructure excuse is most likely to go unread.

**The waived lifecycle gate was re-run and the fresh result used.** `agentic:leak-check` at the exact
heads of both leaves: exit 0, `survivors: []`, `aspire` and `docker` probes both `ok`. No owned
resource to reclaim; no cleanup performed, because none was warranted.

**What the update did not unblock, stated because the distinction is the point.** `diagrams:check`
remains unrunnable at `22e79dcc`: `mmdc` unavailable, `npx @mermaid-js/mermaid-cli@10.9.1` exits 126,
and no system or bundled Chromium exists. That block is **Chromium absence**, not the zombie or
Docker conditions the update resolved. Claiming the update cleared it would have been false. The
carry-over from `6b91eb25` stands on its own merits: the gate is a pure byte-comparison of committed
SVGs and `git diff --name-only 6b91eb25..22e79dcc` contains zero `.mmd` and zero `.svg` paths, read
directly rather than remembered — unlike the `check:publish-assets` omission on #1746, where the
input relationship itself had been misremembered.

**Corroboration, not duplication.** The fixes/Aspire lane independently reached the same host finding
and measured the root suite at `4308 passed / 2 failed`, both failures reproducing at `main`
`13878a80`. Not re-run here; that lane's measurement is not this lane's to repeat.

**Queue impact: none.** #1723 stays blocked. Its dependency is S1–S10 *merging*, not host capability
— `main` still pins Aspire 13.4.6 and every S-slice is open. A healthy Docker sandbox does not land
#1727. It may unblock the Aspire lane's own runtime verification (PR #1735, S2 receipts), which would
accelerate the chain, but that is that lane's work and is not taken here.

No commit to either leaf; no head moved. PR-surface correction only. Both leaves remain at
`status:ready-merge`, unmerged, with the human merge queue.

## 2026-08-30 — environment update 2; #1723 manifest regenerated; queue still blocked

**Update 2 superseded update 1 within five minutes.** Re-proven locally rather than accepted:

| Value | Update 1 (09:22Z, my measurement) | Update 2 (verified 09:27Z+) |
| --- | --- | --- |
| `netscript-dind` | `10.4.12.16` | **`10.4.12.19`** |
| Docker client/server | server 27.5.1 | **28.5.2 / 28.5.2** |
| `fs.inotify.max_user_instances` | 128 | **1024** |
| `docker ps -a` / `aspire ps` | not checked | **both empty** |

Two consequences stated precisely rather than loosely: the below-28 doctor caveat is **moot, not
downgraded** — the server is 28.5.2, so the condition does not arise, and carrying "it's only a
warning" forward would imply a constraint that no longer exists. And D-37 / the watchFs quota
blocker are **resolved**, restoring `watch-run` (heartbeat exit 2, no allocation failure) as the
correct token-free supervisor wake instead of polling.

**I had published the superseded numbers minutes earlier**, on PR #1748. Corrected there with an
explicit before/after table rather than a silent edit — the same discipline applied to the expired
zombie claim. Being fast to publish an environment fact means being fast to retract it.

**Owned cleanup is at zero and required no action.** `docker ps -a` empty, `aspire ps` reports no
running AppHost, `agentic:leak-check` exit 0 with `survivors: []` at both leaf heads. This lane is
docs-only and never started a container; reporting "cleanup performed" would overstate it.

### Serial queue advanced on the one actionable part of #1723

#1723's scope header instructs regenerating its manifest **before starting**. That is the only part
of the issue not gated on S1–S10, so it was done now — the next slice starts with a confirmed row
set instead of re-deriving one. Run at `main` `13878a80` in a **detached throwaway worktree** so
nothing was written into the research lane's run dir; worktree removed, `git worktree list` clean.

**No drift in any `doc:*` class.** `doc:public-page` 102 → 102 and **set-identical** (`diff` empty,
not merely equal counts); `doc:aspire-dedicated` 4, `doc:root` 3, `doc:site-infra` 2,
`doc:diagram-source` 2 — **113 total, exactly the header's figure**. #1748's 102-row accounting
therefore remains complete against current main and no deferred row needs re-planning.

**Path defect in #1723.** Its header names `tools/aspire-surface-manifest.ts`, which does not exist;
the tool is at `.llm/runs/research-aspire-13.5-adoption--0.0.7/tools/` on `research/aspire-13.5-0.0.7`.
Same class as #1745's non-existent `init-agent.ts` path. Flagged on the issue rather than silently
substituted.

**Three net-new rows, none adding S11 work**: `packages/cli/src/kernel/assets/agent/guidance.md.template`
(`template:other`), an Aspire helper `generator-test`, and an `archival:rfc`. Each checked
individually for `.NET Aspire`, Learn links and `13.4.x`/`13.5.x` literals — **all zero**. The
`template:other` row matters most because it post-dates #1748's sweep; it is clean.

**An unexpected corroboration.** At pre-sweep `main`, 17 files contain ".NET Aspire". #1748 edits 13
and leaves 3 pre-existing — 16, not 17. The seventeenth is
`packages/mcp/src/publish-assets.generated.ts`, the generated carrier that embeds corpus prose and
stops containing the string once the corpus is regenerated. 13 + 3 + 1 = 17 exactly. The manifest
reached the corpus→publish-assets dependency from a completely different direction than the CI
failure that originally taught it — the strongest confirmation yet that the corrected rule 5 is
right.

**Queue posture unchanged: blocked.** `main` `13878a80`, pin still 13.4.6, and #1727/#1718/#1720/
#1741/#1722/#1740 all OPEN. Host capability is not the dependency — these slices *merging* is. When
#1727 lands, the version-snippet bucket is dispatchable as one slice against the confirmed row set.

## 2026-08-30 — shipping order executed; #1755 dispatched as the next source-ready leaf

### #1746 / #1748 — evidence gap closed, gates re-run, handoffs surfaced

The evidence gap was that the **deciding evaluator reports existed only as untracked files on the
supervisor's disk**; every public comment was a summary of them. Both PRs now carry the artifacts
verbatim — for #1748 that includes the `FAIL_FIX` report in full, published deliberately: a blocking
report that is only ever summarised is the easiest kind of finding to quietly soften, and this one
caught a defect the cloud evaluator returned `PASS` on.

Committing the reports to the branches was rejected: it would move the head and void the very
exact-head verdicts they record. Publishing to comments closes the gap without touching a head.

Exact-head gates, both PRs:

| Gate | #1746 @ `84a5fd11` | #1748 @ `22e79dcc` |
| --- | --- | --- |
| `review-threads` | PASS, threads=1 unanswered=0 | PASS, threads=0 |
| `check-close-gate.ts` | **PASS**, provenance head-matched, `#1745` from body keyword | **PASS**, `#1000` from body keyword |
| `mergeable` / state | MERGEABLE / CLEAN | MERGEABLE / CLEAN |

No implementation was reopened — heads unchanged and exact-head evaluators passed, so author work
would have voided the verdicts rather than strengthened them.

### The finding that qualified both handoffs

Before dispatching a third corpus-touching PR I tested the pair against each other:

```
git merge-tree --write-tree <1746-head> <1748-head>
CONFLICT: prose.json.gz · provenance.json · agent-docs.generated.ts · publish-assets.generated.ts
```

**#1746 and #1748 conflict with each other.** Each is `CLEAN` because GitHub computes mergeability
against current `main` *independently*, and neither calculation knows about the other. The first
merges clean; the second goes red. Surfaced on both PRs immediately — an unannounced red after a
merge would read as broken work from this lane.

Resolution is mechanical and must never be a hand-merge: these are generator outputs and one is
gzipped binary. Rebase → `gen:agent-docs-prose` → `gen:publish-assets` → three freshness gates. The
cost is that the second PR's exact-head verdict dies with the regeneration and needs a bounded
re-evaluation; that is the honest price of two docs PRs over one corpus, and the reason to merge
serially rather than batch.

### Next source-ready leaf chosen: #1749, not the Aspire work

Source-blocked Aspire docs (#1723) must not block the lane, so it is parked. Scanned every open
0.0.7 docs-labeled issue: #1721 is the Aspire lane's and equally source-blocked; #1533/#1365/#1360
belong to internals/fixes/features. Nothing unallocated and source-ready there.

**#1749 chosen** — fully unblocked because #1729/#1675 already shipped `.agents/skills/` as canonical
on `main`, bounded to one file, and it completes the story #1746 started.

**The release-note gap was considered and deliberately not taken.** `packages/cli/CHANGELOG.md` stops
at 0.0.6 and no 0.0.7 intro exists — both confirmed. But a complete 0.0.7 changelog cannot be written
while 0.0.7 is still merging, and `github-release.ts:18` records the intro as *"MANUAL BY DESIGN"*,
supplied at publish time via `--notes-file`, i.e. release-captain-owned rather than a checked-in docs
artifact. Surfaced to the coordinator instead of absorbed.

### #1755 dispatched, and a launcher lesson

Thread `01a05207-a509-7eb3-9e21-8fed6bfc5381`, worktree `007-leaf-1749`, branch
`docs/quickstart-skills-tree`, Codex · OpenAI · `gpt-5.6-sol` · medium (route matched).

**The foreground launch exceeded a 10-minute shell timeout and was killed — but the Codex thread had
already done the work.** `codex-thread-ids.md` was never written (the launcher writes it last), so the
thread id had to be recovered from the sender-ownership lease record. Lesson: launch these detached,
and never conclude from a killed launcher that the slice did not run — check the worktree head first.
Per instruction the existing thread was **resumed, not relaunched**.

**Tier-A: PASS**, re-run by this lane while the thread was idle, not taken from the author's report —
the four freshness gates the author had deferred to "the PR validation table" all exit 0
(`fresh:true`, `stalePaths:[]`, `sourceCommit` `5ccdea247` == S1 `5ccdea24`), targeted typecheck 0,
and `git status --porcelain` empty after every regenerating gate. `deno.lock` untouched.

PR **#1755** opened at `2c844565`, milestone **0.0.7**, `Closes #1749`. Coordinator intake decision
applied: #1749 admitted to 0.0.7; both issue and PR carry **exactly one** `status:` label
(`status:impl`) after removing a duplicate `status:impl-eval` that had been applied alongside it.

`check-close-gate` currently exits 1 on #1755 — **correctly**: #1749's acceptance boxes are unticked
and the final DoD box is deliberately unticked pending the evaluator. That is the gate doing its job,
not a defect. A separate-session IMPL-EVAL (Claude · Fable 5) is running; boxes get ticked with
evidence only after it passes.

## 2026-08-30 — #1755 handed off; queue advanced to #1757

### #1755 — terminal green, handed to the human merge queue

| Gate at `2c844565` | Result |
| --- | --- |
| Exact-head IMPL-EVAL (separate session, Claude · Fable 5) | **PASS**, no blocking findings |
| Tier-A (supervisor, at pushed head) | PASS |
| `check-test`, `quality`, `code-quality`, `classify`, lane visibility | success |
| `close-gate` — CI **and** local | **PASS**, provenance head-matched, `#1749` from body keyword |
| `review-threads` | PASS, threads=0 |
| State | MERGEABLE / CLEAN, non-draft, milestone 0.0.7, one `status:` |

All eight of #1749's acceptance boxes ticked **with an evidence table attached to the issue**. The
IMPL-EVAL report is published verbatim on the PR. CI was refreshed by label transition +
`gh run rerun`; the head never moved.

`status:impl-eval` reappeared twice alongside `status:ready-merge` — the Codex thread setting its own
phase label as it finished. Removed both times; settled at exactly one `status:`.

**Where the evaluator improved the work rather than rubber-stamping it:** it agreed with omitting
`.claude/skills/` but rejected the PR's stated reason. Host-neutrality does not hold —
`resolveHosts` falls back to `["claude"]`, so the quickstart's own bare command *does* produce the
mirror, and the tree already lists `.mcp.json` from that same branch. The decision survives on
better ground: the mirror is a byte-identical derived copy of the row already shown, and listing it
would invite patching the mirror. Right conclusion, wrong reason — recorded as such.

### Queue advanced: allocation drained, so the next issue had to be found and filed

Coordinator allocation is `[1000, 1551, 1723, 1745, 1749]` — every entry now shipped-to-ready or
source-blocked (#1723). Computed the unallocated set across all four lanes: **65 open 0.0.7 issues,
99 allocated, 0 unallocated.** Nothing to pick up; advancing meant filing.

**#1757 filed** — `packages/cli/CHANGELOG.md` stops at `## 0.0.6` with zero `0.0.7` content, while
**33 commits** (19 `feat`/`fix`) have landed since the `v0.0.6` tag. Verified via
`git show origin/main:…`, not from this worktree. The sharper half: **no gate reads it** —
`git grep -l CHANGELOG` over `.llm/tools/` and `.github/workflows/` returns nothing, so it is the one
user-facing document that can silently fall a whole release behind, and it did. A follow-up gate is
named in the issue and deliberately not absorbed.

The **release introduction is explicitly not taken**: `github-release.ts:18-23` records it as
"MANUAL BY DESIGN … a maintainer writes it … generated prose is not a substitute". Release-captain
work; surfaced, not absorbed. Version bumps likewise stay with the release cut.

Leaf dispatched **detached** (thread launching), worktree `007-leaf-1757`, branch
`docs/changelog-0-0-7` from `origin/main`, Codex · `gpt-5.6-sol` · medium.

### Two self-corrections worth keeping

1. **I nearly reported two PRs for false gate evidence.** `deno task docs:exports-drift` exits 1 in
   *this* worktree, and #1748/#1755 both claim it exit 0. Before acting I checked `origin/main`: the
   task exists there and is absent on the topic branch, which is **29 commits behind**. The gate rows
   are truthful; the stale checkout was mine. This lane's own memory says to reconcile via
   `git show origin/main:<path>` because the topic worktree is a checkpoint, not a mirror — I broke
   my own rule and it nearly produced a false accusation against two clean PRs.
2. **A measurement I ran was worthless and I discarded it rather than reporting it.** Probing how
   much drift an expanded `AUTHORITATIVE_MAPPING` would surface, the string replacement silently
   failed to match and the 21 added packages were never evaluated — the run reported coverage for the
   original 8 only. Caught because the output listed the wrong package set. An unasserted `replace()`
   produces a confident, empty result; assert the edit took effect before trusting a probe.

`AUTHORITATIVE_MAPPING` covering only 8 of the packages with published reference pages is real and
still a candidate, but it belongs to **closed #1108**'s territory and needs proper sizing before it
is filed as new scope. Not filed on an unverified number.

## 2026-08-30 — merge-authority correction; #1757 through FAIL_PLAN into cycle 2

### Correction to this lane's record: merges are not human-only

The coordinator states merges run through its pre-merge gate, and it is landing #1746/#1748/#1755
itself. This lane's handoff comments said "ready for a human to merge" and "merge authority rests
with the coordinator". The second half was right; **"human-only" was wrong** and is retracted here.
The gates, evidence and exact heads in those comments are unaffected — only the phrasing about who
performs the merge. Not re-posted to three PRs the coordinator is actively landing; correcting the
record here is proportionate and does not add noise to a live merge queue.

This lane still does not merge. Nothing about that changed.

### #1757 — the plan review earned its cost

The Codex thread judged the slice warranted a plan review rather than taking the `PLAN-EVAL: N/A`
the brief offered, and **dispatched one itself**. Cycle 1 returned **`FAIL_PLAN`**:

- **F1** — five commits (`f7ad44dc`, `01e09604`, `473e8d75`, `cf648f1f`, `3b32d162`) excluded on the
  reason "source edits change comments". True of the `packages/` diff, **false** of the shipped
  `packages/cli/src/kernel/assets/agent-tools.generated.ts` bundle, which did change. A false
  exclusion reason, independent of whether the verdict survived.
- **F2** — the plan deferred "final bullet wording" *to* PLAN-EVAL. As the evaluator put it,
  "PLAN-EVAL judges the mapping, it does not author it."
- **Fix 3** — three bullets would have shipped misleading notes. Sharpest: `3561bb64` was to be
  described as "tighter public types" when the package root actually **stops exporting**
  `DenoMySqlClient`, `DenoMySqlConnection` and `ExecuteResult`. Describing a removal as an
  improvement is the exact failure a changelog must not have.

**Integrity check before trusting that verdict.** An implementation thread dispatching its own
evaluator is a process deviation, and a self-authored "evaluation" would be a serious problem. I
verified the session was real: PID `491257`, session `71a70862-0184-4252-84e3-5bbfc9946791`, bridge
`session_01Qccb4kNXWBMY2Z2KiCadfj`, `kind: bg`, cwd in the leaf worktree. A genuine separate Fable 5
session — generator ≠ evaluator holds, so the verdict stands. Recorded as a deviation with a good
outcome: **evaluator dispatch is the supervisor's**, and cycle 2 was dispatched by this lane to put
that back where it belongs.

The thread revised the plan and **stopped without implementing** — correct behaviour on `FAIL_PLAN`.
Supervisor review of the revision: D2 now locks eleven bullets with a `## Locked Changelog Map`
(commit→bullet, draft wording); B1 **includes** the five formerly mis-excluded commits; B2 describes
`--skip-apphost` as an argument accepted by generated `check`/`lint`/`fmt-check` flows, not a new
task; B7 states the root export removal plainly; B11 carries all three breaking facts
(`null → undefined`, default `TError` `unknown → Error`, `safe()` rejecting non-Promise thenables).
All three fix-3 constraints discharged in wording, not merely mentioned.

PLAN-EVAL cycle 2 dispatched by this lane on the canonical route (Claude · Fable 5, native
opposite-family for a Codex plan).

### Baseline moved under the evaluation, and it was handled as fact not surprise

`origin/main` `13878a80` → `625447f1` mid-evaluation. Exactly one commit landed:
`test(aspire): 13.5.3 runtime verification receipts (S2) (#1735)` — entirely `.llm/` run artifacts,
receipts and `arch-debt.md`, with **zero** `packages/`/`plugins/`/`docs/site` content, so it is a
clean changelog exclude. The `v0.0.6..main` range is now **34**, where `plan.md` says 33.

Supplied to the running cycle-2 evaluator as verified fact with an explicit statement that no verdict
was being signalled, so it could rule on a one-row addendum versus an invalidated baseline itself.

**#1723 is not unblocked by this.** The Aspire pin on the new main is still `13.4.6` and S1 #1727 is
still OPEN — S2 shipping verification receipts does not move the pin. Re-checked at source rather
than inferred from "an Aspire slice merged".

None of #1746/#1748/#1755 has merged yet; all three still OPEN with `mergeStateStatus` recomputing.

## 2026-08-30 — #1746 merged; #1748 integration-refreshed onto f8b4f804

`#1746` merged at `f8b4f804`, closing `#1745` (CLOSED/COMPLETED). Coordinator confirmed merges run
through its pre-merge gate — this lane's earlier "ready for a **human** to merge" phrasing is
retracted; merge authority sitting outside this lane is unchanged.

### #1748 rebased, not merged, and deliberately so

Both PRs regenerate the same four agent-doc carriers, so the branch was reset to `main`, prose
replayed, and assets regenerated fresh. A hand-resolved corpus was never attempted: the carriers are
generator output and one is gzipped binary — wrong in a way review cannot catch. Pre-rebase head
`22e79dcc` preserved as tag `backup/1748-pre-rebase`.

New shape on `f8b4f804`: `e222a1d7` prose → `ece85406` prose repair + `supervisor.md` → `9b79d90e`
assets only. `provenance.json` `sourceCommit` `ece85406a` == the immediately preceding prose commit.

**Proof the regeneration actually took:** before it, `git grep '\.NET Aspire'` returned a **fourth**
hit — `packages/mcp/src/publish-assets.generated.ts`, carrying pre-sweep corpus prose from `main`.
After regeneration it is gone and the count is back to the three pre-existing. That is a stronger
check than a timestamp or a gate exit code.

Gates: 13 green. One red — `docs:readme:check` on `packages/bench/README.md` ("missing '## Install'").
Reproduced on a **clean `origin/main` checkout** before claiming it: pre-existing baseline, the file
is byte-identical to main, this diff does not touch `packages/bench`. The IMPL-EVAL verified it
independently and concurred. CI at `9b79d90e` is fully terminal green including `check-test`.

### Two false PR-body claims, one of them mine

1. **DoD box 1** claimed zero ".NET Aspire" across *published surfaces*. False: `@netscript/aspire`
   is JSR-published at 0.0.6 and its README still carries the term. Corrected to scope the claim to
   the S11 `doc:public-page` manifest plus root `README.md` and `docs/site/**`, naming **S13 #1724**
   as that README's owner.
2. **The Summary's opening sentence** still said "across every published surface", contradicting the
   corrected Scope. I fixed the Scope and DoD box but **missed the Summary** — the coordinator caught
   it and corrected it directly. Recorded as a miss: correcting two of three places a claim appears
   leaves the document contradicting itself, which is worse than leaving it uniformly wrong, because
   a reader cannot tell which sentence is authoritative.

### The delta IMPL-EVAL corrected an error in my own brief

`PASS` at `9b79d90e`; the prior `PASS` carries forward. It established the prose patches are
**byte-identical** across the rebase, so every earlier judgement rests on unchanged content.

It also caught that my brief asserted "no `.mmd` in the rebased diff" — **wrong**; the comment-only
`aspire-resource-graph.mmd` edit *is* in the diff. The `diagrams:check` carry-over survives, but on
different grounds: the gate byte-compares committed **SVGs**, the diff has zero `.svg`, the `.mmd`
change is comment-only, and both are byte-identical across the rebase. The body now records the
false grounds and the accurate ones rather than quietly swapping the argument.

Body brought to currency without moving the head: Validation re-dated, `sourceCommit`
`3301f593b` → `ece85406a`, DoD box 4 re-grounded, an Integration section added, and all three
IMPL-EVALs listed. The one-line rebase drift entry was **not** committed — it would move the head and
void the exact-head verdict, so the record lives in the body and here instead.

### #1757 — `PASS_PLAN` at cycle 2

No blocking findings. The evaluator decoded the embedded tool sources out of
`agent-tools.generated.ts` at `v0.0.6` and `13878a80` and diffed the real contents to confirm the
five barrel commits now carry true reasons — it did not take the repair summary's word. It found B11
carries **five** breaking facts, not the three cycle 1 named, and advised *against* strengthening
B1's "surfaces" to "fails" because the check wrapper's non-zero exit is selection-mode-gated; cycle 1
had overstated that. Implementation steered with the required baseline reconciliation for `625447f1`
(verified pure run-artifacts).

**Route drift:** the resumed `01a0522a` thread reports effort **high** where the requested route is
**medium**. `codex-resume.ts` accepts no `--effort`, so a resume does not carry the original identity
forward. Recorded rather than passed over — lane policy requires observed identity to be reported.

## 2026-08-30 — #1748 handed off; #1761 pending evaluator; two process corrections

### #1748 — merge coordinates issued at `9b79d90e`

Native exact-head IMPL-EVAL `PASS` (unconditional), Tier-A PASS, CI terminal green, `close-gate`
success with `status:ready-merge` live, review-threads 0, MERGEABLE/CLEAN, exactly one `status:`.

**OpenHands reconciled honestly.** Run `33311911918` concluded **`cancelled`** and never posted an
`OPENHANDS_VERDICT`. Cause: the `openhands-phase-eval` concurrency group — re-running `ci` for the
label transition at 12:47Z superseded the cloud run started at 12:35Z. So it **raised no findings and
also cleared nothing**; that distinction is stated on the PR, because "the cloud eval didn't object"
and "the cloud eval never finished" are different facts and only the second is true. Not gating: the
same lane returned `PASS` at `6b91eb25` on a head where the native evaluator found two blocking
defects.

### Correction: the acceptance mirror ticks issue boxes — the supervisor should not

On #1749 and #1755 this lane **hand-ticked** the issue acceptance boxes and attached a prose evidence
table. That was doing the tooling's job manually. The correct mechanism, confirmed by dry-run:

- The PR body carries a fenced ` ```acceptance-evidence ` block with `issue: <n>` and `box-index` →
  `evidence` entries.
- `close-gate`'s "Mirror structured acceptance evidence" step runs
  `mirror-acceptance-evidence.ts`, which parses that block from the PR body **and its comments**,
  validates the mapping against the issue's checkboxes, and ticks them itself.
- It **skips** while `status:ready-merge` is absent — `acceptance-mirror DRY-RUN: no changes …
  Mirror skipped because live PR labels do not include status:ready-merge`.

So the sequence is: evaluator `PASS` → apply exactly `status:ready-merge` → `gh run rerun` the
existing CI run at the unchanged head → the mirror consumes the evidence and ticks. **Do not tick
issue boxes by hand, and do not tick before final proof.** Hand-ticking bypasses
`validateEvidenceMapping`, produces no provenance record, and asserts acceptance from the supervisor's
judgement rather than from verified evidence.

Verified for #1761 by dry-run before the transition, so the rerun is known to work rather than hoped
to: the block parses, `issue: 1757` resolves, five `box-index` entries map, and the only thing
blocking is the label.

### Correction: two-dot diffs, twice

Reviewing #1761 I ran `git diff --stat f8b4f804..15c262e4` and it showed **132 files, 8103
deletions**, appearing to revert all of #1746. False. A branch behind `main` renders newer `main`
content as deletions under `..`. The true scope with `...` (merge-base) is **13 files, 1100
insertions, zero deletions**.

This is the **second** instance of the same class today — earlier a gate run from a 29-commit-stale
topic worktree nearly produced a false accusation of fabricated evidence against #1748 and #1755.
Both times the alarming result came from comparing against the wrong baseline, and both times the
check that saved it was re-deriving from `origin/main` before speaking. Recorded as a standing rule
for this lane: **when a result looks catastrophic, suspect the baseline before the branch.**

Useful side-finding: #1761 touches **no** agent-docs corpus input, so it has **zero** file overlap
with #1748 and is not part of the serial corpus queue — it can merge in any order.

### #1761 state

Tier-A PASS (five focused gates exit 0; `## 0.0.7` present; CLI version still `0.0.6`; `deno.lock`
untouched; no release intro or notes file; tree clean). CI green on `build`, `check-test`, `quality`,
lane visibility. `close-gate` red on "Referenced issue acceptance gate" — **expected** while boxes are
unticked and the PR is `status:impl`. Separate-session IMPL-EVAL running.

## 2026-08-30 — #1755 shipped; #1761 blocked on a real review finding

### Milestone state

| PR | Issue | Merge SHA | State |
| --- | --- | --- | --- |
| #1746 | #1745 | `f8b4f804` | shipped |
| #1748 | #1000 | `952cc106` | shipped |
| #1755 | #1749 | `a5520e70` | shipped |
| #1761 | #1757 | — | blocked on review repair |

Epic **#1723 remains OPEN** throughout, as intended — no PR carried a closing keyword on it.

### #1755 integration and a rationale that had to change, not just a date

Rebased onto `952cc106`, assets regenerated once, delta IMPL-EVAL `PASS` at `91bf721c`. Seven
evaluator-required body edits applied **body-only, no head move**.

One was not cosmetic: the body justified omitting `.claude/skills/` as preserving a "host-neutral
illustration". The evaluator **rejected the reasoning** — `resolveHosts` falls back to `["claude"]`,
so the quickstart's own bare command *does* produce the mirror, and the tree already lists
`.mcp.json` from that same branch. The omission now rests on the ground that survives scrutiny: the
mirror is a byte-identical derived copy of the row already shown. Right conclusion, wrong reason,
corrected rather than re-dated.

**OpenHands runs `33312864635` / `33312881075`: recorded NONE / non-gating** — cancelled by the
coordinator to protect the reviewed head. They raised nothing *and cleared nothing*; the distinction
is kept because a cancelled run is not a silent pass.

### #1761 — an external review caught what three internal passes missed

An Augment review thread on `packages/cli/CHANGELOG.md:7-8` was **valid**. The bullet said the
installed scanner *"now needs environment and network permissions"*. Verified from source:

- `optionalGitHubToken()` wraps `Deno.env.get` in try/catch and returns `undefined` on denial —
  its own comment says a caller without env permission "deliberately uses the public unauthenticated
  API". **Env is optional.**
- The only network call is `createGitHubAllowanceIssueResolver` fetching a `quality-allow` issue.
  **Net is conditional.**
- Corroboration neither side had cited: the shipped agent-tools cheat-sheet documents this very tool
  as `deno run --allow-read … scan-code-quality.ts` — read-only. The changelog contradicted the
  bundle's own documented invocation and would have pushed consumers to over-grant.

**The reviewable failure is ours, and it is a verification gap, not a typo.** PLAN-EVAL cycle 2 and a
separate-session IMPL-EVAL both confirmed the *declared* permission set moved `["read"]` →
`["read","env","net"]` — true — and both then accepted "needs" as a description of a runtime
requirement. Two independent passes checked the same fact and neither asked whether the word matched
the behaviour. A declaration is not a requirement; nothing in either brief made that distinction, so
neither evaluator tested it.

Repair `3befc1e2` rewrote only that parenthetical: the bundle **declares** env+net, env access is
**optional**, net is used **only when resolving a `quality-allow` issue**. Tier-A re-run by this lane:
seven gates exit 0, 11 bullets intact, B1's "surfaces silent check failures" **not** strengthened to
"fails" (PLAN-EVAL cycle 2 had specifically warned against that), `deno.lock` and
`packages/cli/deno.json` unchanged at `0.0.6`.

### Baseline moved three times during one slice

`13878a80` → `625447f1` → `f8b4f804` → `952cc106` → `a5520e70`. The triage table covered 35 rows
against a range that is now **37**. A second bounded steer adds one row per new commit — both
verified by this lane as docs/generated-corpus only with no hand-written `packages/` source, hence
Exclude — and refreshes every live count and pin statement. The changelog map itself is not reopened.

This is the cost of writing a changelog while its milestone is still merging, and it is why the
section is framed **provisional** rather than complete.

## 2026-08-30 — docs lane allocation fully shipped; #1761 merged

| PR | Issue | Merge SHA | State |
| --- | --- | --- | --- |
| #1746 | #1745 | `f8b4f804` | shipped |
| #1748 | #1000 | `952cc106` | shipped |
| #1755 | #1749 | `a5520e70` | shipped |
| #1761 | #1757 | `a5f506dd` | shipped |

Epic **#1723 remained OPEN through all four** — no PR ever carried a closing keyword on it, which was
the failure most likely to happen silently.

`main`: `13878a80` → `a5f506dd` across this session. The docs allocation
`[1000, 1551, 1723, 1745, 1749]` (+ owner-admitted `1757`) is now **fully closed except #1723**,
which stays source-blocked: the Aspire pin is still `13.4.6` and S1 #1727 is open.

### #1761 needed four heads, and the reason is worth keeping

`15c262e4` → `3befc1e2` (wording repair) → `cac095e1` (triage currency) → `c1700128` (run-evidence
correction). Only the second was a real defect; the other two were **currency debt** created by a
milestone merging underneath an in-flight slice.

The defect: B1 said the installed scanner *"needs environment and network permissions"*. A PLAN-EVAL
cycle **and** a separate-session IMPL-EVAL both passed it, both correctly verifying the *declared*
permission set had widened — and neither asked whether "needs" described a runtime *requirement*. An
external Augment review caught it. The final evaluation was briefed to sweep all eleven bullets for
that class and came back clean, re-deriving each fact rather than inheriting the stopped pass's hint.

**The generalisable rule: a declaration is not a requirement.** Two independent passes verified the
same true fact and neither tested the word attached to it, because no brief asked them to.

### Process notes from this stretch

1. **An evaluator was deliberately stopped mid-run** rather than allowed to certify `cac095e1`
   seconds before an evidence repair superseded it. Its partial output was explicitly marked
   non-authoritative in the successor brief, and the fresh pass re-derived B3 independently. A
   half-finished sweep quoted as evidence is how a false pass gets manufactured.
2. **Acceptance boxes are mirrored, not hand-ticked.** Corrected mid-session: the PR body carries a
   fenced `acceptance-evidence` block, and `close-gate` runs `mirror-acceptance-evidence.ts`, which
   validates the mapping and ticks with provenance — but only once `status:ready-merge` is live. This
   lane had hand-ticked on #1749 and #1755, bypassing `validateEvidenceMapping`.
3. **Four stale-state assertions reached PR bodies this session, three of them mine** — "no checkbox
   is ticked" while the mirror had already ticked five; "readiness is withheld" after I had promoted
   the PR; two stale head/count claims. Every one had the same mechanism: changing a state and
   leaving prose describing the old one, usually inside an edit that was correcting someone else's
   stale claim. Re-query before asserting; do not treat the body as a document you remember.
4. **Two-dot diffs produced two false catastrophes** (an apparent 8,103-line revert; an apparent
   fabricated-evidence accusation from a 29-commit-stale worktree). Standing rule: when a result
   looks catastrophic, suspect the baseline before the branch.

### Next candidate shopped from milestone 27

Milestone 27 has **61 open issues and zero unallocated**. Every docs-labelled one is either
source-blocked (#1723), another lane's in-flight work (#1721, #1533), or not a docs slice
(#1365, #1360). So the next docs work is a **proposal**, not a free ticket — recorded in the
supervisor handoff.

## Provisional 0.0.7 changelog — top-up queue

The `## 0.0.7` section shipped in #1761 is **provisional** and pinned to
`v0.0.6..a5520e70` (37 commits). Every commit that lands on `main` after that pin accrues here until
the release captain calls the pre-cut top-up. **This queue is a ledger, not a PR** — no top-up-only
branch, PR or public canary is opened for it, because a changelog top-up has no independent
acceptance and would burn a canary slot on prose that the release cut will consume anyway.

Each row carries a triage decision made the same way the shipped table was: consumer observability,
verified from the diff rather than the commit subject.

| Commit | PR / issue | Decision | Reason (verified) |
| --- | --- | --- | --- |
| `3e5cbabf` | #1731 → closes #1466 | **INCLUDE** | `packages/contracts` gains a NetScript-owned procedure-metadata vocabulary on its **published** surface: `src/public/mod.ts` newly exports `NetScriptProcedureMeta` and `NetScriptAuthenticationRequirement` from the new `src/domain/procedure-meta.ts`, alongside `BaseContractErrors`, `BaseContractMeta` and `CommonErrorMap`. The metadata is deliberately independent of oRPC public types and propagates to direct clients, generated clients and query factories without casts. Crucially it does **not** erase the concrete error channel repaired by #1350 — that preservation is the point of the change and must be stated, not just the addition. `docs/site/reference/contracts/index.md` and `packages/contracts/README.md` moved with it. |
| `24f6642f` | #1763 → closes #1730 | **EXCLUDE** | Test-only. The diff is `packages/ai/tests/request_context_test.ts` plus its own run dir — no export map, no `mod.ts`, no `docs/site` page, no hand-written product source. It guards request context against provider payloads, which is a regression guard on behaviour #1731 and #1730 already shipped; a consumer of the published packages observes nothing new. Verified from the diff, not the `test(ai):` prefix. |

**Draft bullet for the top-up** (wording to be re-verified against source at top-up time, not
copied forward blind):

> Contracts export a NetScript-owned procedure-metadata vocabulary — `NetScriptProcedureMeta` and
> `NetScriptAuthenticationRequirement` — that reaches direct clients, generated clients and query
> factories without casts, and that leaves the concrete contract-error channel intact.

**Rules this queue inherits from the shipped section:**

1. Triage from diffs, never from commit subjects — the shipped table's own cycle-1 `FAIL_PLAN` was
   caused by five commits excluded on a subject-derived reason that was false for the shipped bundle.
2. Never describe a *declaration* as a *requirement*, or a type-level rejection as a runtime one.
   That distinction is what an external review had to teach this lane on B1.
3. A removal is never described as an improvement.
4. The section stays provisional until the release captain runs the top-up; the GitHub release
   **introduction** remains maintainer-authored and is not this lane's to write.


## 2026-08-30 — #1772 shipped; exports-drift coverage gap sized and dispatched

| PR | Issue | Merge SHA |
| --- | --- | --- |
| #1746 | #1745 | `f8b4f804` |
| #1748 | #1000 | `952cc106` |
| #1755 | #1749 | `a5520e70` |
| #1761 | #1757 | `a5f506dd` |
| #1772 | #1770 | `de57fab0` |

Five docs PRs shipped. **Epic #1723 remained OPEN through every one.**

### #1772 cost five heads, and only one was a defect

`99ba2bf3` → `d5ba40eb` → `e4f47289` (B1 repair) → `14d5aefd` → `0e9fc593` → `c987d110` (report
carrier) → `6d275b2c` (supersession carrier). One real defect; **five body/evidence blockers found by
coordinator audit that this lane's own Tier-A passed**:

1. An untracked `impl-eval-final.md` while the body cited it — evidence a reader could not open.
2. The mandatory `[PHASE: IMPL-EVAL] [VERDICT: PASS]` comment never posted.
3. "At the current head `0e9fc593`" written in the same edit that introduced the two-head distinction.
4. Canonical `evaluate.md` still recording `FAIL_FIX` current and the repaired head `PENDING`.
5. A **41-character SHA** — a typo never checked for length in a body whose whole purpose was
   distinguishing two heads precisely.

All five are one class: the **product** was verified thoroughly and the **evidence surface** was
assumed. Concretely absent from Tier-A: is the worktree clean; does every artifact the body cites
exist in-tree; does every run artifact agree with the verdict; is the required phase comment posted;
does every 40-char SHA in the body resolve. That checklist now runs before any readiness claim.

The one real defect was **the same class as #1761's**: a conditional behaviour written as
unconditional (`preflights every declared reference`, false for `Enabled: false` processors). Caught
externally both times, after internal passes verified the mechanism and never tested the quantifier.

### Next work sized properly — and the first probe was worthless again

Milestone 27 has zero unallocated issues, so the next slice was a proposal. Candidate: `docs:exports-drift`
polices **8 of 30** packages.

**The measurement took three attempts, and assertions are what made the third trustworthy:**

1. Attempt 1 (earlier session): unasserted `str.replace()` silently matched nothing; the run
   evaluated the original eight and reported "no drift". Discarded.
2. Attempt 2: asserted the marker — and it **failed**, because the declaration on `main` is
   `readonly PackageMapping[]`, not `PackageMapping[]`. My marker came from the 29-commit-stale topic
   worktree. The stale-baseline error again, caught this time by the assertion.
3. Attempt 3: correct marker, plus an entry-count assertion that itself failed first (my counting
   regex did not match single-line entries). Fixed, then the checker rejected the probe outright:
   `symbolCoverage must be an object` — revealing that adoption is a **policy declaration**, not a
   row edit.

Final measured result on `de57fab0`, under the weakest policy (`entrypoints-only`, so a **floor**):

- **21** packages have a published reference page and no gate
- **108** drift findings across **15** of them; **92** are `OMITS exported entrypoint`
- Worst: `plugin-sagas-core` 19, `plugin-workers-core` 17, `fresh` 16, `ai` 13, `plugin-triggers-core` 12
- **6 are already clean**: `aspire`, `cli`, `cron`, `database`, `kv`, `logger`

User-visible: a JSR consumer reads `docs/site/reference/ai/index.md` and never learns
`@netscript/ai/anthropic` exists.

**Filed as a wave, not a slice**, because `PackageMapping.symbolCoverage` requires a per-package
`mode` + `reason` the gate enforces — 21 editorial decisions plus 108 repairs.

- **#1777** — umbrella, no closing keyword from any single PR.
- **#1778** — slice 1, dispatched: adopt the six already-clean packages. Zero documentation repair;
  it proves the adoption pattern before the repair-bearing slices. Explicitly instructed to **drop**
  any package rather than weaken its policy to pass, and that no `docs/site/**` file may change.

Related closed issue **#1108** delivered the checker and the initial eight; this is follow-on, and its
`symbolCoverage` design is the contract every new entry must satisfy.

**Brief change carried forward:** the author thread has skipped the PR body on three consecutive
slices, each time leaving the supervisor to write it. #1778's brief makes the body an explicit
deliverable with a named per-package table, rather than absorbing the gap a fourth time.

## 2026-08-30 — main currency at `24f6642f`; leaf deliberately not disturbed

`origin/main` advanced `de57fab0` → **`24f6642f`** (PR #1763, `test(ai): guard request context from
provider payloads`).

**No integration performed, by design.** Path intersection between #1763 and the in-flight #1780 leaf
is **empty**:

- `24f6642f` touches `packages/ai/tests/request_context_test.ts` and its own run dir.
- `85e7f96b` (#1780) touches `.llm/tools/docs/check-exports-drift.ts` and its own run dir.

No semantic intersection either: #1763 alters no export map, no `mod.ts` and no reference page, so it
cannot move `docs:exports-drift`'s inputs — and `ai` is not among the six packages this slice adopts
(it is one of the 15 with findings, deferred to a later #1777 slice). Rebasing would have moved the
head under a **running exact-head evaluator** for zero benefit, so the leaf was left alone.

Recorded as a rule: integrate a moving base into an in-flight leaf only where changed paths actually
intersect, or where the base change could move a gate's inputs. Head churn under a live evaluator is
a real cost — it voids the verdict — and "main moved" is not by itself a reason to pay it.

`24f6642f` triaged into the changelog top-up queue as **EXCLUDE** (test-only), from the diff rather
than the `test(ai):` prefix.

### #1780 — the brief change worked

Slice 1 of #1777 is open as **PR #1780** at `85e7f96b`, and for the first time in four slices the
author produced a **complete PR body** (6,735 bytes: Summary, Scope, **Package policy decisions**,
Slices, Validation, Harness, Drift/Debt, Definition of Done) with `Closes #1778` and `Part of #1777`
carrying no closing keyword. Making the body an explicit named deliverable in the brief — rather than
absorbing the gap a fourth time — is what changed.

Supervisor Tier-A **PASS**:

- **Hard boundary held** — zero `docs/site/**` files changed. The slice adopts pages already correct.
- All six packages adopted, and the policies genuinely **differ**: `cron` at `mode: 'complete'`, the
  other five `entrypoints-only`. Each `reason` is specific to its page (e.g. `kv` "summarizing kvdex
  compatibility re-exports in prose"), not six copies of one sentence — which was the failure mode
  the brief called out.
- The one duplicated `reason` string in the file is **pre-existing on `de57fab0`**, verified against
  the base blob rather than assumed.
- Gates: `docs:exports-drift`, `docs:accuracy`, `docs:links`, `check:publish-assets`,
  `check:assets-barrel`, `check:agent-docs-prose`, scoped `deno check` of `.llm/tools/docs`, and a
  `deno.lock` diff — **all exit 0**. Tree clean.

A supervisor-dispatched exact-head IMPL-EVAL is running, briefed that **a green gate proves a
`symbolCoverage` claim is enforceable, not that it is true** — the substantive check is whether
`cron`'s `complete` declaration actually holds, and whether any package was adopted at the weaker
mode to dodge a genuine undocumented export.

## 2026-08-30 — #1783 (aspire `/public`) Tier-A PASS; infra lease respected

### Infrastructure

Coordinator update: DinD mount visibility and cross-container ports are fixed —
`DOCKER_HOST=tcp://netscript-dind:2375`, published ports via `netscript-dind:<port>` rather than
`127.0.0.1`. **The sole host runtime lease is held by the Aspire supervisor for Phase B.** This lane
started no Aspire or Docker work and has none queued: every docs slice here is static, so the lease
is not on its critical path. The evaluator brief for #1783 carries an explicit "do not start Aspire or
Docker" instruction so a sub-agent cannot take the lease by accident.

### #1783 — a stale review, answered with the file list rather than a dismissal

An `augmentcode` thread claimed the derived assets were missing. It was **accurate against
`018a5bb53`** — the prose-only first commit — and **stale against head `b1a930364`**, which carries
the assets in their own commit precisely so `provenance.json`'s `sourceCommit` points at the prose
commit rather than at an orphan regeneration.

Answered with the full 12-file scope, the four asset paths, and the provenance identity
(`sourceCommit` `018a5bb53` == `HEAD^`), then resolved. A stale finding still deserves the evidence,
not a dismissal — and the reply invites reopening if an asset really is missing.

### Tier-A — PASS, and the substantive check was the new claim

The slice replaced a false claim with a **stronger** one, which is where to look hardest. The page
now says the four symbols are *"published **exclusively** through `@netscript/aspire/public`"*.

**My first verification of that claim looked like a contradiction**: grepping for non-`/public`
exports returned a hit for all four. Chasing it rather than reporting it showed the hits are
`src/domain/mod.ts` and `src/ports/mod.ts` — **internal barrels absent from `deno.json`'s export
map**, whose published targets are only `mod.ts`, `config.ts`, `schema.ts`, `types.ts`,
`constants.ts`, `src/application/mod.ts`, `src/adapters/mod.ts`, `src/testing/mod.ts` and
`src/public/mod.ts`. The exclusivity claim is **true**; my probe had not distinguished an internal
barrel from a published entrypoint.

That is the third probe of mine this session to produce a false signal — after the unasserted mapping
`replace()` and the `deno doc --json` symbol query. The pattern is consistent: I write a quick check,
it returns a clean-looking answer, and the answer is an artifact of the check rather than the code.
Each was caught only by chasing a result that felt wrong. The cheap defence is to make a probe prove
itself on a known-positive case before trusting its negatives.

Verified at head: rewritten aggregate paragraph is accurate; all four symbols documented;
**zero `packages/aspire` source changes**; **`AUTHORITATIVE_MAPPING` untouched**; provenance
`018a5bb53` == `HEAD^`; 13 gates exit 0; `deno.lock` unchanged; tree clean.

Umbrella safety confirmed in **both** the body and the commit messages: `Closes #1782`,
`Part of #1777`, no closing keyword targeting #1777.

Supervisor-dispatched exact-head IMPL-EVAL running, briefed to attack the exclusivity claim and to
run the modal-verb sweep this lane has now needed on three consecutive slices.

## 2026-08-30 — #1783 shipped as `38439740f`

| PR | Issue | Merge SHA |
| --- | --- | --- |
| #1783 | #1782 | `38439740f248ef2ba5f173dad96b2edaa829392c` |

Six docs PRs shipped this session (#1746, #1748, #1755, #1761, #1772, #1780, #1783 — seven counting
#1780). **Umbrella #1777 remains OPEN** and no PR has ever carried a closing keyword against it.

### The stall, and what actually caused it

`close-gate` failed for ~8 minutes with #1782's acceptance boxes unticked. The evaluator had already
returned `PASS`; nothing was waiting on it. The cause was **ordering**: the CI run was triggered by my
push of the evaluator-report carrier, which happened **before** I applied `status:ready-merge`. The
acceptance mirror self-skips without that label, so the boxes stayed unticked and close-gate failed on
them — correctly.

Re-running with the label live ticked all five with provenance (4 → 9, zero unchecked) and turned the
gate green. The mirror was left to do it rather than hand-ticking, per the correction earned earlier
in this session.

**Rule earned: apply `status:ready-merge` *before* pushing anything that triggers CI.** Otherwise the
first run is guaranteed to fail on unticked boxes, and the failure looks like a defect rather than a
sequencing error.

### What the slice established

The false `/public` claim is gone. The evaluator enumerated all nine published entrypoints via
`deno doc --json` and computed the exclusive set independently: **exactly**
`{AspireError, AspireRuntime, DuplicateContributionError, ReferenceSpec}` — complete **and** minimal.

One advisory recorded on #1777 rather than folded in: `/public` also **omits** 17 symbols the
sub-paths publish (12 `/config`, 3 `/types`, 2 root diagnostics). Not false under `entrypoints-only`,
but a hard prerequisite before re-adopting `aspire` at `mode: 'complete'`.

### Next slice verified before filing — `logger`

Confirmed on `38439740f`, **with a positive control** after three false-signal probes this session:

- The page's `## Sub-path exports` section says *"Their reference pages are **generated separately**
  from their own `deno doc` surface."*
- **No such pages exist.** `docs/site/reference/logger-middleware`, `logger/middleware`,
  `logger-orpc`, `logger/orpc` all return zero tracked files.
- The sub-path symbols are documented nowhere: `LoggerContextVariables`, `LoggerMiddlewareOptions`,
  `injectLogger`, `LoggerMiddleware`, `LoggerMiddlewareEnv` each appear **0** times in the page.
- Source: `middleware.ts` has 13 export statements, `orpc.ts` 2.
- Positive control: `RequestLogContext` (a documented root symbol) returns 1, so the grep is sound.

Same defect class as `aspire`'s: **a page pointing somewhere that does not exist**. Larger, because
`aspire` hid four symbols behind a false claim while `logger` hides its entire `/middleware` and
`/orpc` surface behind a promise of pages that were never generated.

## 2026-08-30 — #1785 repair cycle: an external review caught a third unconditional claim

`logger` slice, PR #1785. Head chain: `2d0bf5a46` prose → `87930240` assets → `a34754374` evaluator
carrier → `9f6935980` wording repair → **`30b4018ce`** assets.

### The finding, and why it was not resolved away

An `augmentcode` review objected to the `LoggingPlugin` row's *"correlated request, completion, and
failure logging"*. Verified at source and **valid**:

```
packages/logger/orpc-plugin.ts
:180  let currentRequestId    }  closure shared by BOTH interceptors,
:181  let requestStartTime    }  created once per init() — not per request
:187    currentRequestId = …     ← root interceptor writes
:229    const requestId = currentRequestId ?? 'unknown'   ← procedure interceptor reads
```

Under concurrency, request B's root interceptor overwrites the id before A's procedure interceptor
reads it, so logs cross-attribute; `requestStartTime` misattributes durations the same way.

The word was in a description **this PR added**, so it was in scope. Resolving a valid finding to
protect a green head would have been the wrong trade — the PR was demoted to `status:impl` and a
bounded repair dispatched, at the cost of a fresh exact-head evaluation. **The Augment thread is left
open deliberately until the new verdict confirms the repair**, rather than resolved on the strength of
the fix being dispatched.

Repair: *"for correlated request, completion, and failure logging"* → *"to log request start,
completion, and failure."* One table row. Tier-A: 25 distinct symbols across both entrypoints with
**0 missing**, 13 gates exit 0, zero `packages/logger` source changes, `AUTHORITATIVE_MAPPING`
untouched, provenance `9f6935980` == `HEAD^`.

**Two boundaries stated in the repair brief and worth keeping:** do not write "correlated except under
concurrency" — that documents a bug as a feature; and do not fix `orpc-plugin.ts` from a docs slice.

### The source defect filed separately — #1786

`fix(logger): LoggingPlugin correlates request IDs via shared closure state`, Backlog / Triage. Its
acceptance requires the regression test to exercise **concurrent** invocations — a sequential test
passes today and would not have caught this.

**A silent failure caught by checking:** the first `gh issue create` **exited 0 while creating
nothing** — `area:logger` is not in `.github/labels.yml`. Only verifying the issue existed surfaced it.
A non-zero exit would have been kinder; the lesson is that `gh issue create` can partially fail on an
invalid label and still report success. Refiled with `area:telemetry`.

### The pattern is now unmistakable

Three slices in a row, an external review has caught an unconditional claim that this lane's internal
passes verified the *mechanism* of and never tested the *qualifier* on:

| Slice | Claim | Reality |
| --- | --- | --- |
| #1772 | "preflights **every** declared reference" | skipped for `Enabled: false` processors |
| #1761 | scanner "**needs** env and network permissions" | env optional, network conditional |
| #1785 | "**correlated** request logging" | not under concurrency |

Each internal pass confirmed the underlying feature exists. None asked whether the modifier attached
to it was earned. The evaluator briefs now carry an explicit modal-verb sweep, which is why #1783's
"published exclusively" claim was proven complete *and* minimal rather than merely plausible — but the
sweep only runs where a brief demands it.

### Systemic advisory for #1777

The same "generated separately" false-deferral pattern survives in `docs/site/reference/cli/index.md:75`
and `docs/site/reference/plugin/index.md:85`. It was never a `logger`-specific defect; it is a page
template that promises generated pages nobody generates.

## 2026-08-30 — #1785 converged and green, but the evaluator chain is exhausted

### Convergence

Base `38439740f` → current main **`74e3d451`**. Reset, replayed prose only, regenerated the carriers
once, then re-applied the evaluator-report carrier so `provenance.json` `sourceCommit` still names the
prose commit rather than an evidence commit.

`f70b3d43d` prose → `45737bda4` correlation repair → `b7c8560ea` assets → **`b8095e905`** report carrier.

**Product diff preserved byte-for-byte** — `git diff backup/1785-pre-converge HEAD -- docs/site/reference/logger/index.md`
is empty. 25 symbols / 0 missing, zero "correlated" claims, boundaries held, 13 gates exit 0, tree clean.

### The blocker: every documented evaluator route is down

| Route | Policy role | Status |
| --- | --- | --- |
| Claude · Fable 5 · medium | primary | **HTTP 429**, monthly spend limit, `req_011CeZWSaRmQkeprnuGwPF4B` |
| DeepSeek V4 Flash 0731 · max (OpenRouter) | fallback for native quota limit | `OPENROUTER_API_KEY` unset; no credential file where `openrouter-run.ts:101-114` looks |
| AGY Gemini 3.6 Flash · high | fallback if OpenRouter limited | `agy` on PATH but `antigravity` component **missing** and `antigravity-auth` **AUTH_REQUIRED** |

Checked each rather than assuming the chain worked.

**What I did not do, and why it matters.** Opus 5 is opposite-family to Codex, in-plan, and would
have produced a verdict. It is **not** a documented `formal_impl_evaluation` route — `lane-policy.md:46`
names DeepSeek then AGY, and nothing else. Substituting it would have been inventing a route to
manufacture a green gate, which inverts the purpose of the gate. Self-evaluation is barred outright.
So the PR is held with no verdict rather than passed on an unauthorised one.

### The policy gap, stated precisely

1. The fallback chain **terminates** — after AGY the policy is silent on what a lane does.
2. Both fallbacks **require credentials the harness does not provision**. A documented fallback that
   cannot authenticate is not a fallback.
3. The `review_codex*` ladders already solve this shape (Fable → Opus, Claude-family throughout).
   `formal_impl_evaluation` has no equivalent terminal fallback. **That asymmetry is the gap.**

Recommended: name an in-plan Claude-family terminal fallback for `formal_impl_evaluation` when the
native model is spend-limited.

### Partial evaluator output deliberately discarded

The killed session's last words were that it had reached "root-surface sanity and generator identity"
— i.e. nearly done. It produced **no verdict**, and a nearly-complete evaluation is not a pass. Same
call as when the `cac095e1` evaluator was stopped mid-sweep on #1772: a half-finished sweep quoted as
evidence is how a false pass gets manufactured.

The prior `PASS` at `87930240` is carried in-tree but **superseded** — it predates both the
correlation repair and the convergence.

### Not idling

#1785 is parked awaiting an evaluator route. The lane advances to the next independent #1777 slice
rather than waiting: the `cli` and `plugin` reference pages carry the **same false-deferral pattern**
the `logger` slice just fixed (`reference/cli/index.md:75`, `reference/plugin/index.md:85`) — surfaced
by the #1785 evaluator before it died, and independent of #1785's merge.

## 2026-08-30 — #1785 exact-green packet delivered; routing update noted

### Body correction applied precisely

Six edits, all itemized by the Opus evaluator and verified rather than blindly applied: Slices
section marks the four pre-convergence commits historical and adds S5–S7 for the convergence and
both evaluator carriers; Validation header re-dated to the product head; the provenance line in
"exactness evidence" corrected `9f6935980`→`45737bda4`; the Head lineage table extended with the
converged/carrier rows; all five `acceptance-evidence` SHAs re-pointed to `b7c8560ea`; DoD box 7
re-verified true against the corrected body rather than merely re-worded.

Second evaluator-report carrier `b7bd9238` added on top of `b8095e905` — the stale `impl-eval.md`
was **left untouched** as historical record; the new `impl-eval-opus.md` sits alongside it. Product
diff between the two carriers is empty.

### Full cycle closed

Label applied **before** the push that triggered the final CI run — held the #1783 sequencing rule
this time. `close-gate` PASS on the first attempt at the merge head, no failed-then-fixed cycle.
Thread resolved only after both evaluators confirmed the repair, not on the strength of the fix being
dispatched. #1784 at 10/10, `status:ready-merge`, CI terminal green. Merge packet delivered.

### Routing update — sanctioned for new dispatches, not retroactive

Coordinator: OpenRouter credential is now provisioned and host-verified at the standard mode-600
path. **All new quota-blocked `formal_impl_evaluation` dispatches use DeepSeek V4 Flash 0731 via the
checked-in agentic tooling** — the documented fallback that was previously unavailable. #1785's
Opus 5 fallback was explicitly **not reopened** for this — its terminal `PASS` stands as the bounded,
PR-scoped exception it was authorized to be. The credential file must never be printed, catted, or
committed; recorded as an instruction, not verified by inspection.

This resolves the policy gap recorded earlier in this session for `formal_impl_evaluation` — the
documented fallback now actually has working credentials, so future capacity exhaustion routes
through DeepSeek rather than requiring another bounded exception.

## 2026-08-30 — #1790 reconciliation: caught a real defect on my own promotion

### The audit was right, and precisely so

I promoted #1790 to `status:ready-merge` and polled for a CI run that never existed —
`mergeStateStatus` was `DIRTY`/`CONFLICTING`, not `CLEAN`, and I had not checked it after main moved
past `74e3d451` while the DeepSeek evaluation was running. Verified every claim before acting:

- `mergeStateStatus`: **CONFLICTING/DIRTY**, confirmed
- `git diff --check origin/main...HEAD`: two "new blank line at EOF" violations in
  `plan.md`/`supervisor.md`, confirmed
- `git merge-tree origin/main HEAD`: **real conflicts** in all four derived-asset carriers, confirmed

**What I actually did wrong:** I ran the earlier PASS gates in the leaf worktree, which was still on
its stale base, and never re-checked `mergeable`/`mergeStateStatus` against `origin/main` before
promoting. Gate greenness in a worktree proves nothing about integration with a base that has since
moved. That check belongs in Tier-A going forward, not just at dispatch time.

### Reconciliation

Reset to `bc33c2aa3`, replayed the two **prose** commits only (`958184886` cli, `fa1055887` plugin —
clean cherry-picks, confirming the earlier conflict was entirely in the derived-asset commits, which
is expected and correct: those should never be replayed, only regenerated). Fixed the two trailing
blank lines. Regenerated the four carriers fresh in their own commit.

**Product identity proved, not assumed:** `git diff <pre-reconcile-tag> HEAD -- docs/site/reference/{cli,plugin}/index.md`
is empty — the reconciliation touched integration and whitespace only.

New head: **`a6f3927b0`**. 14 gates green including `diff --check`. Pushed with `--force-with-lease`.

### Main moved a second time mid-cycle, and the evaluator caught it live

While the cli-half delta re-evaluation was running, `origin/main` advanced again to `2a1248d33`
(#1740, Aspire runtime-port fix). The dispatched evaluator noticed the base SHA mismatch and reported
it rather than silently evaluating against a memorized SHA — checked independently: **zero path
intersection** with #1790's scope (e2e gates, plugin runtime code, a *different* generated carrier
`agent-tools.generated.ts`), and `git merge-tree` against the new main returns **zero conflicts**. No
further reconciliation needed — consistent with this session's standing rule to integrate only where
paths or gate inputs actually intersect.

### Fresh delta re-evaluation, explicitly barred from reusing prior evidence

Both dispatches instructed not to cite the `068d4ba30`/`40f799eae` evaluations as evidence — those
heads are superseded and one had unresolvable conflicts with the current base. `cli` half re-run:
**PASS**, 23/23 and 29/29 fresh, `diff --check` clean, `mergeable: MERGEABLE`. `plugin` half running.

Not promoting to `status:ready-merge` again until the plugin half returns and mergeability is
re-confirmed at the exact pushed head.

### #1790 third integration cycle: two rebases, one recurring provenance defect, one real gate intersection

Main advanced twice more mid-review: `a3ddcbb598` (#1775) then `73bf2efa9` (#1739). The first had
zero path/gate intersection with #1790's scope on inspection, but a deeper audit found the coordinator
was right to insist on integration anyway for the second: `check:mcp-export-corpus` — one of the
required gates — genuinely **fails** against this branch's stale base and **passes** once `#1739`'s
export-surface corrections are integrated, even though no file path overlaps. Lesson for future cycles:
"integrate only where paths/gate-inputs intersect" must check whether a **required gate's outcome**
changes, not only whether changed-file paths overlap — a gate can depend on repo-wide generated state.

**Recurring defect found and fixed twice**: `build-agent-docs-bundle.ts`'s `writeCorpus()` has a
deliberate anti-churn shortcut — when regenerated prose is byte-identical to the committed
`prose.json.gz`, it reuses the prior `provenance.json.sourceCommit` instead of recomputing it. This
is correct in the normal case but breaks across a rebase: the commit that SHA points to gets rewritten,
so the preserved value becomes a genuine orphan (`git merge-base --is-ancestor <sha> HEAD` fails) even
though `git status --porcelain` reports zero drift and the generator exits 0. Caught first after the
`a3ddcbb598` rebase (`290ac9406` orphaned, repaired to `e3a4f29b3`), then again after the `73bf2efa9`
rebase (`e3a4f29b3` itself orphaned in turn, repaired to `aee2ac4c3`). Both repairs: bump
`sourceCommit`/`extractionTimestamp` only, regenerate `assets-barrel`/`publish-assets` from the fix,
verify `git merge-base --is-ancestor` succeeds, verify no other field changed. **Standing lesson**:
after any rebase that touches a branch carrying this provenance chain, explicitly check
`sourceCommit`'s ancestor status — do not trust a clean regeneration diff alone.

Also discarded an unrelated incidental regeneration: `deno task gen:mcp-export-corpus` (distinct from
the docs chain) touches `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`,
which was independently stale on `main` itself since `#1731` (predates `a3ddcbb598`) for reasons
unrelated to #1790. `check:mcp-export-corpus` now passes cleanly after integrating `73bf2efa9` (which
happened to also fix it) without #1790 needing to touch that file — correctly left untouched, out of
scope for a docs-only PR.

Rewrote PR #1790's body and issue #1788's "Scope completion" section in place to state only the
current, exact lineage, and to precisely distinguish orphaned/non-ancestor SHAs (`068d4ba30`,
`40f799eae`, `290ac9406`, `a6f3927b0`, `0bfecff58`, `c11f75768`, `e3a4f29b3` — none exist in current
branch history) from `aee2ac4c3`, which is `HEAD~1`, a live ancestor and the actual current
`sourceCommit` value — an important distinction a first pass at the rewrite blurred by lumping both
categories together as "superseded". Caught by a second coordinator audit before merge.

Final exact head: **`75538c723188bcd8994dcc74531138ec1d0a1c39`**, based on `main` `73bf2efa9`. Docs
pages verified byte-identical back to the very first pre-`a3ddcbb598` backup across all three
integration cycles. The existing 14-entrypoint DeepSeek IMPL-EVAL (`impl-eval-exact-head.md`) was
**not** re-run at any point in this cycle — content never changed, only provenance metadata and
lineage prose. All required gates green at the final head including the now-real `check:mcp-export-corpus`.
`close-gate` re-run after the metadata correction: **PASS**. `mergeStateStatus: CLEAN`, `mergeable:
MERGEABLE`, issue #1788 9/9 boxes checked, single `status:ready-merge` on both PR and issue. Ready for
an exact merge packet.

### #1793/PR #1794: next #1777 slice, dispatched to Codex, IMPL-EVAL PASS, merge-ready

After #1790 merged as main `96d44758d`, measured real current `docs:exports-drift` findings (not the
months-old table) and found five packages — `watchers`, `runtime-config`, `prisma-adapter-mysql`,
`auth-workos`, `auth-better-auth` — each with an identical one-line defect: their reference page
documents the package's single root export in prose but never in the specific `## Exports` table-row
shape the checker's `parseDocContent()` requires. Filed as issue #1793.

Dispatched to Codex (`gpt-5.6-sol`, low effort — light_implementation lane, matching the mechanical,
no-mid-slice-decision shape) via `agentic:launch-codex-slice`. Two dispatch-infra notes for future
slices on this NAS deployment:
- The tool's default `wslHome()` (`/home/codex`) doesn't exist on this box; pass an explicit `--dest`
  under a path that does (used `/home/agent/.codex/<slug>-brief.md`).
- Hit `duplicate_sender_risk` against the reused leaf worktree from a stale #1790-era sender record
  (thread dead: absent from `codex-status`, owner PID absent from `/proc`, rollout ended cleanly).
  Archived and evicted per [[agentic-sender-ownership-stale-block]] before relaunching.

Codex delivered cleanly: PR #1794, commit `514f47565`, all required gates green, differentiated
per-package `symbolCoverage` (not a copy-pasted default) — `runtime-config` alone claims `mode:
'complete'`. Tier-A independently re-verified that claim symbol-for-symbol via `deno doc --json`
(20/20, zero gaps) before trusting it.

IMPL-EVAL: Fable 5 hit the same monthly-spend HTTP 429 as the earlier #1785 incident; fell back to
the sanctioned DeepSeek V4 Flash 0731 OpenRouter route per the standing routing update. **PASS** —
independently verified every package's mode/reason against real `deno doc` output (all omissions
real, zero invented justifications), all 13 gates green, scope confined to the two generated
carriers, provenance ancestor-valid.

**New close-gate failure mode found and fixed**: `mirror-acceptance-evidence` matches a PR's
`box:` evidence text against an issue's checkbox text as one exact string. Issue #1793's Acceptance
bullets were hard-wrapped across two markdown lines (a body-authoring habit carried over from every
other issue this session), so the tool's parsed box text was truncated at the line break and never
matched the PR's single-line evidence key — a silent, metadata-only failure with no relation to the
actual work. Fixed by rewriting the four Acceptance bullets as single unwrapped lines (exact
byte-for-byte match to the PR's `box:` text, verified before pushing), re-running close-gate: PASS.
**Lesson for every future issue body in this queue: keep Acceptance (and any other
`mirror-acceptance-evidence`-targeted) checkbox text on one line — do not hard-wrap it.**

Final state: PR #1794 head `514f47565be0d3a9b24444ef06493090ea106769`, `mergeStateStatus: CLEAN`,
`mergeable: MERGEABLE`, all CI green, issue #1793 7/7 boxes checked, sole `status:ready-merge` on
both. Ready for an exact merge packet.

### #1795/PR #1796: heading-only fix, dual independent evaluators, label-race with OpenHands

Measured real current drift on main `5197e70b7` and found the smallest remaining #1777 case yet:
`plugin-ai-core`'s reference page already had a fully correct two-entry export table, just under an
unrecognized `## Entrypoints` heading instead of `## Exports`. Filed as #1795 with single-line
Acceptance checkboxes from the start (applying the #1793 lesson).

Dispatched to Codex (`gpt-5.6-sol`, low). Hit the same `duplicate_sender_risk` on the reused leaf
worktree from the just-completed #1793/#1794 thread — third occurrence of the same pattern this
session; evicted per [[agentic-sender-ownership-stale-block]] after confirming staleness, relaunched.

Codex delivered PR #1796, commit `58018d600`: the heading rename plus one `AUTHORITATIVE_MAPPING`
entry (`mode: 'entrypoints-only'`, naming 5 specific missing `contracts/v1` symbols). Tier-A
independently recomputed the real-exports-minus-documented set via `deno doc --json` and confirmed
the claimed 5-symbol gap is *exactly* right — not approximately, exactly: `{AiContractSchema,
AiContractSchemaResult, JsonSchema, ReasoningChunk, ToolParameters}`, no more, no fewer.

IMPL-EVAL dispatched to DeepSeek (Fable still monthly-limited): **PASS**, independently reproduced the
same exact 5-symbol gap. An **independent OpenHands DeepSeek job also ran unprompted** on this PR and
reached the same **PASS** — a second, unsolicited confirmation.

**New label-race discovered**: after this session set `status:ready-merge`, an external OpenHands
automation flipped the PR's status label to `status:impl-eval` before CI read it, causing the exact
same "mirror skipped — label not ready-merge" close-gate failure as the #1793 cycle, but from a
different actor. A `status:augment-review` label also appeared (from Augment's own review pass, which
completed with no suggestions) and had to be cleared. Fixed by re-applying sole `status:ready-merge`
and rerunning only the failed jobs on the same CI run (never a new push — the product head never
moved). **Lesson: label state on a PR is not exclusively this session's to set — other automations
(OpenHands, Augment) can write `status:` labels concurrently. Always re-check the live label set
immediately before relying on a CI run's label read, and prefer `gh run rerun --failed` on the
existing run over a fresh push when only metadata needed correcting.**

Final state: PR #1796 head `58018d6001e6ddf7669248aee0f4b283f55ed6a0` unchanged throughout the whole
cycle, `mergeStateStatus: CLEAN`, `mergeable: MERGEABLE`, all CI green, issue #1795 4/4 boxes mirrored
checked, sole `status:ready-merge` on both. Ready for an exact merge packet.

### #1797/PR #1798: plugin-streams-core heading fix, second OpenHands label-race, exact-green re-confirmed

Same class of defect as #1795: `plugin-streams-core`'s reference page already had a correct,
complete four-row export table under `## Entrypoints`, invisible to the checker for heading-name
reasons only. Filed as #1797, dispatched to Codex, delivered as PR #1798 (commit `0342ef845`).
Branched independently from current main `5197e70b7` (no dependency on #1796's mapping insertion).

Tier-A independently verified the `entrypoints-only` reason's per-entrypoint symbol counts via
`deno doc --json` (root 51, sse 33, telemetry 33, testing 4) — my own quick regex-based extraction
undercounted the SSE omissions by one (`StreamSseErrorPayloadV1`); the DeepSeek IMPL-EVAL's more
careful extraction confirmed the PR's own count (21 SSE omissions, decomposing exactly into the
1+1+3+16 the reason names) was right. **Lesson reinforced: a quick manual regex check is for
sanity, not final judgment — trust the dedicated evaluator's more careful pass over a fast
supervisor spot-check when they disagree on exact counts, provided the overall direction matches.**
IMPL-EVAL: PASS (DeepSeek V4 Flash 0731).

**Same OpenHands label-race as the #1795 cycle recurred identically**: after this session restored
sole `status:ready-merge`, an external automation flipped the PR back to `status:impl-eval` before
the rerun CI read it, producing a second transient close-gate failure with no relation to the actual
change. A coordinator audit landed mid-race and observed the PR with **no** `status:` label at all
and #1797 showing 4 unchecked boxes — a snapshot taken between this session's second label-restore
and the rerun's completion. Re-verified immediately after: `mergeStateStatus: CLEAN`, `mergeable:
MERGEABLE`, all 8 non-skipped checks PASS including `close-gate`, issue #1797 4/4 boxes checked, PR
sole `status:ready-merge`, and `mirror-acceptance-evidence --dry-run` independently confirms **no
changes** at the unchanged head `0342ef845a6d310f02c1c3fc9bdfb40ab047038f`. **This is now the second
occurrence of the exact same OpenHands label-race pattern — worth flagging to the coordinator as a
recurring infra friction point for this docs queue, not a one-off.**

**Owner routing update received**: prospectively, for slices with no existing valid evaluation, use
GLM 5.3 Flash at highest effort for default/IMPL-EVAL, and Qwen3.8-Flash-Next at highest effort for
PLAN-EVAL when PLAN-EVAL is actually warranted (still reserved for critical/complex topics only).
This does not retroactively invalidate any already-PASSed DeepSeek evaluation in this queue,
including #1798's — those receipts remain valid and are not rerun. Applies starting with the next
freshly-dispatched slice.

Final state: PR #1798 head `0342ef845a6d310f02c1c3fc9bdfb40ab047038f`, terminal green, ready for an
exact merge packet.

### #1799/PR #1800: mcp summary-table fix, third OpenHands label-race, GLM-route provisioning gap

`mcp`'s reference page had the *correctly named* `## Sub-path exports` heading but no top-level
summary-table row for any of its three exports — only a per-symbol `### @netscript/mcp/cli`
subsection. Filed as #1799, dispatched to Codex, delivered as PR #1800 (commit `a0c4c7c95`): a
3-row summary table inserted above the existing subsection (preserved unchanged), plus one
`AUTHORITATIVE_MAPPING` entry (`entrypoints-only`, naming 6 specific real-but-undocumented symbols
across all three entrypoints). Tier-A independently confirmed all 6 named symbols are real exports
with zero page occurrences, and that `/openapi-projection`'s entire 25-symbol surface is genuinely
undocumented (0/25) — a substantial, honest gap, not a lazy default.

**Codex stripped backticks from the PR's `acceptance-evidence` `box:` text** (e.g. "mcp is in
AUTHORITATIVE_MAPPING..." instead of "`mcp` is in `AUTHORITATIVE_MAPPING`...") — the same class of
exact-text-match defect as #1793, caught by this session before it reached CI and fixed pre-emptively
this time (previously it was only caught by a CI failure).

**Owner routing update arrived mid-dispatch**: GLM 5.3 Flash (max effort) is now the prospective
default IMPL-EVAL route, Qwen3.8-Flash-Next (max effort) for PLAN-EVAL when warranted. Probed the
hybrid-delegation allowlist for two plausible GLM 5.3 Flash model-id slugs (`z-ai/glm-5.3-flash`,
`zhipuai/glm-5.3-flash`) — both rejected as not-approved. **The new route is not yet provisioned in
this environment's allowlist.** Per the owner's final ruling, the already-in-flight DeepSeek dispatch
for #1799/#1800 (started before the routing change was communicated) is a qualifying, owner-preserved
receipt and stands — the routing change applies prospectively to new dispatches only, and the next
#1777 slice's evaluation should use GLM 5.3 Flash once provisioned, or fall back to the sanctioned
direct-OpenRouter route / park that one evaluation (continuing other work) if GLM remains
unavailable when reached.

**Fourth occurrence of the OpenHands `status:` label-race**, same pattern as #1795/#1797: flipped
this PR to `status:impl-eval` mid-CI. This time an OpenHands evaluation run (`33341864782`) was also
launched redundantly on top of the already-completed, owner-ruled-valid DeepSeek PASS; the
coordinator cancelled it directly. Restored sole `status:ready-merge`, corrected two PR-body
inaccuracies in place (a stray "prior to the owner's routing update" chronology note, and an
unticked Definition-of-Done box), reran close-gate once: **PASS**.

Final state: PR #1800 head `a0c4c7c95407499b2ea60709059ab8c120c5f5d7`, terminal green, issue #1799
4/4 boxes checked, ready for an exact merge packet. **Standing flag for the coordinator: the
OpenHands `status:` label-race has now recurred four times across three consecutive PRs in this
queue — worth root-causing or disabling the conflicting automation on `docs:` PRs rather than
absorbing it per-PR.**
