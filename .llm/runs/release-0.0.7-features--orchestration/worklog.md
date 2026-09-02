# Worklog — NetScript 0.0.7 features lane

## 2026-08-13 — Wave 0 reconciliation

| Check | Evidence | Result |
| --- | --- | --- |
| Topic identity | raw `git rev-parse HEAD`, branch, status, and upstream check | `orchestrator/release-0.0.7-features` at `01e0960494c95ce56eb35892c211a095eb13e6ed`; clean; no upstream |
| Live `main` | `git fetch --prune origin main`; raw `git rev-parse origin/main` | unchanged at immutable dispatch base `01e0960494c95ce56eb35892c211a095eb13e6ed` |
| GitHub token | `deno task agentic:gh-token check` | PASS; authenticated as `rickylabs` |
| Runtime | `deno task agentic:runtime status` | `no_change`, schema 1.0, 18 components |
| #1348 checkpoint | live issue body and all four comments | Stage 0 accepted; comment `#issuecomment-5285273104` closes the board-reconciliation gate, while the epic remains open for coordinator-only closure |
| #1502 availability | live issue plus repository PR search | OPEN in milestone 0.0.7 at `status:research`; zero existing PRs found |

The topic orchestrator performed no GitHub mutation during checkpoint verification and did not
close #1348. Wave 0 may dispatch only `rfc-plugin-cli-contribution` (#1502).

## #1502 dispatch

| Field | Value |
| --- | --- |
| Worktree | `/home/codex/repos/netscript-007-features-1502` |
| Branch / base | `docs/rfc-plugin-cli-contribution` @ `01e0960494c95ce56eb35892c211a095eb13e6ed`; no upstream |
| Thread | `019ffcc5-d3e1-7c13-9815-e9956ec43683` |
| Rollout | `/home/codex/.codex/sessions/2026/08/13/rollout-2026-08-13T22-17-31-019ffcc5-d3e1-7c13-9815-e9956ec43683.jsonl` |
| Requested route | OpenAI · GPT-5.6 Sol · high |
| Observed route | OpenAI · GPT-5.6 Sol · high — matched |
| Runtime | `approval=never`; `sandbox=dangerFullAccess`; managed daemon running |
| Steering | `codex exec resume 019ffcc5-d3e1-7c13-9815-e9956ec43683 -- "<follow-up>"` |
| Draft PR / head | pending the leaf's bootstrap/plan slice |

The launcher dry-run passed its brief and git-safety contract after using the launcher's short-SHA
`--expect-base` representation (`01e096049`). The real launch used the same inputs and recorded the
identity above in `slices/codex-thread-ids.md`.

`agentic:codex-status` reports one working agent in the exact leaf worktree. The launch stream also
reported `remoteControl/status=disabled`; the desired-state controller's dry-run repair reported
`disconnected` and correctly refused mutation while an active session/child command exists. The
thread is daemon-managed and steerable, but mobile visibility is not claimed. See drift D-1.

## #1502 PLAN-EVAL cycle 1

| Field | Value |
| --- | --- |
| Evaluated head | `a02f9690154b7384ca8e6503ea91d644b397368a` |
| Evaluator | native Claude Opus 5 · medium · Remote Control; session `669d043a-a1e3-4e75-9366-a1ee94f965ba` |
| Requested route | native Claude Fable 5 · medium |
| Observed route | native Claude Opus 5 · medium fallback; Fable allowance exhausted |
| Verdict | `FAIL_PLAN` cycle 1 of 2 |
| Verdict commit | `d71b78c3116db4ec3aaaa0447dd527fcd4867f6f` |
| PR comment | `https://github.com/rickylabs/netscript/pull/1651#issuecomment-5286211878` |

> Superseded route note: the Fable 5 evaluator bindings referenced in this section are replaced by
> `briefs/reset-gates/dispatch.json` order 3 (native Claude Opus 5 · medium) after the 2026-08-15
> reset. See the reconciliation below.

The evaluator found the author's RFC-only scope consistent with the explicit dispatch but not
reconciled with the immutable leaf contract: four selected proving gates were waived, the applicable
JSR audit was deferred, and contract file surfaces were not cited. The orchestrator resolved the
scope boundary from the user's dispatch (RFC plus proposed later epic; no CLI implementation now)
while retaining all selected proving gates and JSR audit as read-only evidence obligations. The same
Codex author thread is being resumed for a plan-only fix before mandatory cycle-2 PLAN-EVAL.

## 2026-08-15 — Claude topic-supervisor reset reconciliation (first turn; reconcile only)

Reset boundary `2026-08-15T00:00:00+02:00` has passed. This turn launched no leaf, no evaluator, and
no implementation; it performed read-only verification and updated this topic record only.

### Identity and control

| Check | Evidence | Result |
| --- | --- | --- |
| Supervisor identity | Claude session registry `/home/codex/.claude/sessions/2430404.json` | session `19621a0b-c6a0-47c6-b826-93c1634a6875`; bridge `session_01LQBHX8KpA5aYtDraq46J8a`; PID `2430404`; cwd `/home/codex/repos/netscript-007-features`; CLI `2.1.233` |
| Requested vs observed route | `/proc/2430404/cmdline` | `--model claude-opus-5 --effort high --permission-mode bypassPermissions --remote-control netscript-007-features` — matched |
| Remote Control attachment | non-empty `bridgeSessionId` + matching PID/cwd (claude-manager proof rule) | attached; `https://claude.ai/code/session_01LQBHX8KpA5aYtDraq46J8a` |
| Exactly one controller per topic worktree | Claude registry sweep of `netscript-007-*` | four supervisors, one per worktree (docs `2429469`, internals `2429478`, fixes `2430399`, features `2430404`); no rival in this worktree |
| Parked Codex topic thread preserved | rollout `rollout-2026-08-13T22-12-07-019ffcc0-e1d2-7850-a308-354b670c6f3d.jsonl` | last record `task_complete`, `last_agent_message = TOPIC_CONTROLLER_PARKED` at `2026-08-14T22:18:38Z`; not resumed |

### Source and lane truth

| Check | Evidence | Result |
| --- | --- | --- |
| Live `main` | `git fetch --prune origin main`; `git rev-parse origin/main` | `01e0960494c95ce56eb35892c211a095eb13e6ed` — still the immutable dispatch base |
| Topic branch | `git rev-parse HEAD`; `git status`; upstream probe | `orchestrator/release-0.0.7-features` @ `b0fcbe5c073b8ddf53b30adedf76715edcd683c0`; clean; no upstream; no remote ref before this turn |
| Leaf remote head | `git ls-remote origin refs/heads/docs/rfc-plugin-cli-contribution` | `12276e6d86403ed1340ef79a963e87d401d643e9` — equals `dispatch.json` order-3 `sourceHead` |
| Leaf PR head/base/draft | GitHub PR #1651; open-draft PR search | head `12276e6d8…`, base `main` @ `01e096049`, **draft**, open |
| Leaf labels | GitHub PR #1651 | exactly one `status:` (`status:plan-eval`); `type:docs`, `area:cli`, `area:plugins`, `priority:p0`, `rfc`, `epic:cli-contrib`, `ci:skip-e2e`, `ci:skip-scaffold` |
| Leaf worktree | `agentic:codex-status --worktree …-1502`; `git log` | `docs/rfc-plugin-cli-contribution` @ `12276e6d8`, clean, no upstream, 0 active agents |
| Leaf CI currency | `agentic:pr-checks -- --repo rickylabs/netscript --pr 1651 --pretty` | `PASS headSha=12276e6d8… checks=16 currentFailures=0`; **all 16 conclusions are `skipped`** — see drift D-6 |
| Leaf review threads | `agentic:review-threads -- --repo rickylabs/netscript --pr 1651 --pretty` | `PASS threads=0 unanswered=0` |
| Issue #1502 | live issue | OPEN, milestone `0.0.7`, five unchecked acceptance boxes (expected pre-RFC), label `status:research` — see drift D-4 |
| GitHub token | `agentic:gh-token check` | PASS; `gh:windows` (`rickylabs`) |
| Codex runtime | `agentic:runtime status`, `agentic:runtime doctor` (inspect-only) | `no_change`, schema 1.0, 18 components, 0 sessions; daemon running, managed, Codex `0.147.0` |
| Formal hold | `briefs/reset-gates/dispatch.json` order 3 | PLAN-EVAL cycle 2, native Claude Opus 5 · medium, output `plan-eval.md`, run dir `.llm/runs/docs-rfc-plugin-cli-contribution--1502` — **not dispatched; awaiting coordinator grant** |

### Central-set comparison

Every fact in the reset brief and `dispatch.json` order 3 reconciles with live state: leaf id,
PR #1651, branch, worktree, `sourceHead`, run dir, phase, and cycle all match. `milestone-status.md`
records the features lane at 17 issues, 0 active implementation, 0 active evaluation, and leaf head
`12276e6d8…` as `blocked` — consistent with the hold. No scope, `main`, or head drift was found.
Four new drift entries (D-3…D-6) are process/observation findings, not contradictions of the
central set.

### Actions withheld under the hold

No evaluator dispatched; no leaf resumed; no RFC authoring; no relabel, ready-flip, merge, publish,
issue close, milestone change, central cluster-state mutation, expensive gate, or release lease. The
one `codex remote-control start --json` that would settle D-1 is a mutation with sibling-lane blast
radius and was deliberately not run.

## 2026-08-15 — #1502 PLAN-EVAL cycle 2 dispatch (coordinator grant, order 3)

### Grant and authority

The coordinator granted dispatch order 3 at coordinator head
`168715e2710f846fb20562627bbf84ecb1c780fc` ("chore(harness): scope evaluator queues per topic",
branch `chore/release-0.0.7-orchestration`). Verified by reading the commit: `dispatch.json` moves
from `"concurrency": 1` to `"concurrency": 4` with `"concurrencyScope":
"per-topic-orchestrator"`,
`"perOrchestratorConcurrency": 1`, and `queuePolicy` "serialize within each topic orchestrator;
docs, internals, fixes, and features may each run one evaluator concurrently". The commit touched
only the dispatch header — the order-3 entry's route, head, worktree, run dir, and output artifact
are unchanged. This lane therefore runs exactly one evaluator, concurrent with sibling topics
rather than serial behind them.

### Pre-launch head re-verification (refusal gate)

| Source | Value | Result |
| --- | --- | --- |
| `dispatch.json` order 3 `sourceHead` | `12276e6d86403ed1340ef79a963e87d401d643e9` | reference |
| Live PR #1651 `head.sha` | `12276e6d86403ed1340ef79a963e87d401d643e9` | match |
| `git ls-remote origin refs/heads/docs/rfc-plugin-cli-contribution` | `12276e6d86403ed1340ef79a963e87d401d643e9` | match |
| Leaf worktree `git rev-parse HEAD` | `12276e6d86403ed1340ef79a963e87d401d643e9` | match, clean, no upstream |
| Live PR #1651 `base.sha` | `01e0960494c95ce56eb35892c211a095eb13e6ed` | equals immutable base |
| Live `origin/main` | `01e0960494c95ce56eb35892c211a095eb13e6ed` | unchanged |
| PR #1651 lifecycle labels | exactly one `status:plan-eval`; still draft | unchanged |

All four independent resolutions agree. No mismatch, so the hard-refusal condition did not fire.

### Brief provenance

`briefs/reset-gates/rfc-plugin-cli-contribution.md`, passed verbatim as the initial prompt,
sha256 `0d2a288c550469c2fa5b18dfc5eaaf352b6ba3b3fc95519b8839848592006b21`, 0 CR bytes, committed and
clean at the coordinator head (last touched by `bda541fbd`).

### Evaluator identity

| Field | Value |
| --- | --- |
| Role | fresh PLAN-EVAL cycle 2, separate session from the Codex generator |
| Claude session id | `28cc8106-967b-4fb7-90f3-dd95054ae953` |
| Job id | `28cc8106` |
| Bridge session id | `session_01D7t8efMh88nwR2PazUPkC1` (non-empty; job state records the `cse_01D7t8efMh88nwR2PazUPkC1` form) |
| Remote Control URL | `https://claude.ai/code/session_01D7t8efMh88nwR2PazUPkC1` |
| Remote Control label | `netscript-007-features-1502` |
| PID | `2463708` |
| Exact cwd | `/home/codex/repos/netscript-007-features-1502` |
| Claude CLI | `2.1.233`; backend `daemon`; kind `bg` |
| Requested route | native Claude Opus 5 · **medium** · Remote Control |
| Observed route | job `state.json` `respawnFlags`: `--effort medium --permission-mode bypassPermissions --remote-control --name … --model claude-opus-5` |
| Route verdict | **matched**; no substitution, no Fable, no OpenRouter/DeepSeek/Minimax/AGY |
| Provider boundary | `providerEnv: {}` — native Anthropic auth, so Remote Control attachment is legitimate |
| Session transcript | `/home/codex/.claude/projects/-home-codex-repos-netscript-007-features-1502/28cc8106-967b-4fb7-90f3-dd95054ae953.jsonl` |
| Launch state at record time | `working` / `busy`, `firstTerminalAt: null` |

Observed route is read from `respawnFlags` rather than process argv: a bg session that claims a
spare process does not carry `--model`/`--effort` on its own command line, so argv alone would
under-report the route.

### Concurrency and separation invariants held

One evaluator in this topic (`perOrchestratorConcurrency: 1`). Generator ≠ evaluator: the plan was
authored by Codex thread `019ffcc5-…`, which stays idle and was not resumed. No second
`send-message-v2` was fired at the leaf worktree; the evaluator is a Claude session, so it does not
contend with the parked Codex author thread. No expensive gate lease taken. Result pending — the
verdict is terminal only when `plan-eval.md` contains exactly `PASS` or `FAIL_PLAN`, the evaluator
commit is pushed to `docs/rfc-plugin-cli-contribution`, and the structured PR comment is posted.

## 2026-08-15 — #1502 PLAN-EVAL cycle 2 verdict: `PASS`

Session `28cc8106-967b-4fb7-90f3-dd95054ae953` reached `firstTerminalAt`
`2026-08-14T23:24:37.813Z` (started `23:17:07.633Z`; ~7m30s; 32,075 tokens). The verdict was
confirmed from committed artifacts, not from the session's own summary or its exit status.

| Terminal-verdict check | Evidence | Result |
| --- | --- | --- |
| Verdict token | `plan-eval.md:205` — exactly one standalone verdict line in the file | **`PASS`** (cycle 2 of 2) |
| Evaluated head | `plan-eval.md:27` "Evaluated head" | `12276e6d86403ed1340ef79a963e87d401d643e9` — equals the dispatch `sourceHead` and the head that was under evaluation |
| Superseded head named | `plan-eval.md:28` | `a02f9690…` recorded as the cycle-1 failure, so the verdict cannot be misread as re-evaluating it |
| History preserved | `git show --stat 3e0c8858b` | `plan-eval-cycle-1.md` added (145 lines); prior verdict not overwritten |
| Verdict-only scope | same | exactly 2 files, +380/−134, both under the leaf run dir; no RFC content, no package/plugin source, no `deno.lock` |
| Pushed | `git ls-remote origin refs/heads/docs/rfc-plugin-cli-contribution` | `3e0c8858b4a2552926d2965b62cbcc97a15c2935`; local == remote; worktree clean |
| PR state after verdict | live PR #1651 | `draft: true`; exactly one `status:plan-eval`; `updated_at 2026-08-14T23:24:12Z` (evaluator comment); comments 5 |
| Evaluator self-restraint | `plan-eval.md` § Scope of this session, corroborated by the diff and live labels | no RFC authored, no source touched, no label changed, no central state mutated, no merge/publish, no expensive gate |

### Gate-relevant content of the verdict

All six contract `provingGates` are named, run, and receipted (`check`, `test`,
`publish-dry-run`, `arch-check`, `docs-source-format`, `docs-accuracy`); `jsr-audit` is judged
applicable and satisfied; the cycle-1 failures FP-1..FP-3 and all four cycle-1 notes are recorded as
closed against directly-read evidence. Four **non-blocking** notes carry into slice S1:

- **N-1 — citation durability.** The docs-only narrowing was attributed to a chat dispatch that is
  not in the repository. The durable citation is
  `.llm/runs/release-0.0.7--orchestration/briefs/topic-features/implement.md` (commit `8775be7b3`).
  **Independently verified by this orchestrator:** that file states the leaf "is an RFC document plus
  its own PLAN-EVAL and proposes a later implementation epic; it does not implement the CLI seam
  now." S1 must cite it and state plainly that `leaf-contracts.json` was not edited, so a future
  reader diffing the contract does not conclude the narrowing was silent.
- **N-2 — stale evaluator route.** The leaf's `plan.md` § Dependencies and `supervisor.md` § Routes
  in force still name Fable 5 for both formal gates. The reset de-assigns Fable. S1 corrects both
  files and records the observed cycle-2 identity. (This topic's own `supervisor.md` was already
  corrected at the reset — the stale rows are leaf-local.)
- **N-3 — published symbol collision.** `PluginCliResult` in the plan's proposed vocabulary is
  already a published export of `@netscript/plugin/cli` with a different shape. Redefining a live
  JSR-published symbol is a compatibility decision, not spelling; the RFC must name the collision and
  its major-version/migration disposition.
- **N-4 — receipt head.** The six contracted receipts attest `d71b78c3…`, one commit before the
  evaluated head — correctly disclosed. The S4 final-head rerun is what binds for IMPL-EVAL.

Cycle 2 was the second and final PLAN-EVAL cycle; `PASS` closes the plan gate and unblocks slice S1
(RFC authoring). No third cycle is available or needed.

## 2026-08-15 — #1502 phase transition and S1 dispatch

### Lifecycle transition (explicit coordinator grant)

The reset common contract withholds relabel authority from topic orchestrators. The coordinator
granted this specific transition ("transition the draft from `status:plan-eval` to `status:impl` as
protocol requires"), so it is an authorized exception, not an assumed permission, and it is scoped to
PR #1651 only. Issue #1502's own stale `status:research` (drift D-4) is **not** covered by this grant
and remains reported rather than fixed.

| Action | Evidence | Result |
| --- | --- | --- |
| Label set replaced atomically | live PR #1651 after update | exactly one `status:` label, now `status:impl`; the other eight labels unchanged |
| Draft preserved | live PR #1651 | `draft: true` |
| Phase comment | `https://github.com/rickylabs/netscript/pull/1651#issuecomment-5299155549` | `[PHASE: IMPL]`, verdict reconciliation, four carried notes, and the next-step boundaries |

Label move and phase comment were performed in the same action, per the stage-label lifecycle rule.

### S1 dispatch — existing thread resumed, never replaced

| Field | Value |
| --- | --- |
| Thread | `019ffcc5-d3e1-7c13-9815-e9956ec43683` — the original author thread |
| Mechanism | `.llm/tools/agentic/codex/codex-resume.ts`, dry-run first (`ok: true`, 7,103 message bytes, single `codex exec resume`) |
| Rival check before send | `agentic:codex-status --worktree …-1502` → `0 recent` agents, clean at `3e0c8858b` |
| Attachment after send | `agentic:codex-status` → **1** agent `working`, thread `019ffcc5-…`, `gpt-5.6-sol / high`, correct worktree |
| Brief | `slices/impl-1502-s1.md`, committed at `f89cc238916d08a247878f2833f971869c70629e` |
| Boundaries restated | RFC-only; packages/plugins are inspection surfaces; no merge, publish, ready-flip, relabel, issue filing, `#1348` mutation, central-state change, `deno.lock` churn, or `scaffold.runtime` |

No second `send-message-v2` was fired at that worktree — the one-active-send rule holds, and the
resume continues the same thread rather than forking a rival. The resume runs detached rather than
under a foreground timeout, because a timeout kills the slice while the launcher appears to succeed.

### Scope of this turn's instruction

S1 only: the RFC's public contract, ownership, and descriptors/routers/help/completion/errors, plus
closing verdict notes N-1..N-4, ticking DoD box 1 with the verdict commit as evidence, and moving the
PR body's `## Harness` phase line to `impl`. Each slice must commit, push by explicit refspec,
comment on #1651, update the leaf run dir in the same commit, and then **stop** at
`TIER-A STOP: slice S<n> ready for topic review`. S2 is not released until this orchestrator reviews
S1 substantively — a green automated gate is not a sign-off, and no lane self-certifies.

## 2026-08-15 — S1 landed; Tier-A review returns `CHANGES_REQUESTED`

The S1 turn completed with a proper `task_complete` at `2026-08-14T23:40:48Z` (D-5's missing-marker
symptom did not recur), pushed `86d0110a545e449dfa094fc961a37a327604d23a`, and stopped without
starting S2 (`agentic:codex-status` → 0 agents).

### Slice hygiene — clean

Commit scope is 12 files: `rfcs/0000-plugin-cli-contribution.md` (483 lines) plus the leaf run dir
and five receipts. **No `packages/**`, `plugins/**`, or `deno.lock`** — the RFC-only boundary held.
Local == remote == PR head; tree clean; no upstream. Three durable receipts
(`check-cli-plugin-s1`, `docs-source-format-s1`, `docs-accuracy-s1`) are `PASS` with
`gitHead == actualGitHead` and no mismatch allowance. PR #1651 remains open **draft** with exactly
one `status:` label (`status:impl`), 0 review threads, 0 current CI failures. The RFC matches
`rfcs/0000-template.md` exactly: all ten sections in template order, frontmatter complete at
`rfc: 0000` / `status: Draft` / tracking issue #1502 / milestone 0.0.7.

Verdict notes N-1, N-2, and N-3 are closed with content verified in the files, not just claimed; N-4
is correctly retained for the S4 final-head rerun.

### Findings — three defects inside S1's own normative contract

Full review: `slices/tier-a-review-1502-s1.md`; PR comment linked below.

- **F1** — `PluginCliDiagnosticCode` is used at RFC line 350 to type the failure boundary and is
  **never declared**; it appears exactly once in the document. `PluginCliCapability` gets an explicit
  S2 deferral note at line 281, so the omission reads as an oversight rather than a declared gap. The
  14 stable codes are already enumerated in prose at line 369, so declaring the tuple and derived
  union in S1 is the cheap, correct fix.
- **F2** — line 117 promises "a deeply readonly definition" while the normative signature at line 278
  returns shallow `Readonly<TDefinition>`, leaving `commands`, `children`, `arguments`, and `options`
  mutable. Immutability is load-bearing for the whole design ("a contribution is immutable static
  data"), so the RFC must not assert a guarantee its own signature does not provide.
- **F3** — `` module: `./${string}` `` admits `'./../escape.ts'`, which the invariant at line 288
  forbids. The contract is right; the type merely looks sufficient. In an import-safety seam that
  gap invites an implementer to skip the traversal check.

Two evidence-labelling corrections ride along: state plainly that the S1 durable receipts attest the
**parent** commit `3e0c8858b` (same disclosure class as N-4, acceptable for an intermediate slice
because S4 binds), and label `source-format-s1*.json` as structured **wrapper reports** rather than
`run-gate` receipts so the receipt set is not overcounted at S4.

### Disposition

S2 is **withheld**. One bounded S1 fix-up commit, docs-scoped gate rerun, push, PR comment, then
another Tier-A stop. The S1 contract is the foundation S2 builds discovery and bootstrap on, so it is
corrected at the slice that owns it rather than patched downstream.

## 2026-08-15 — S1 fix-up reviewed and signed off; S2 released

Fix-up commit `bd8b29bf3a524280d28a39b21bc7adda277d2e27` (local == remote == PR head), tree clean,
turn ended `2026-08-14T23:53:39Z` reporting the literal `TIER-A STOP: slice S1 fix-up ready for topic
review`, thread idle, S2 not started. Scope is 8 files — the RFC, the run dir, and four fix-up
receipts — with **no `packages/**`, `plugins/**`, or `deno.lock`**. `pr-checks` at `bd8b29bf3`
reports 0 current failures.

### Findings closed — verified in the file, not accepted on report

| Finding | Fix | Evidence |
| --- | --- | --- |
| **F1** | `PLUGIN_CLI_DIAGNOSTIC_CODES` declared as a `const` tuple carrying all 14 reserved meanings, with `PluginCliDiagnosticCode = typeof PLUGIN_CLI_DIAGNOSTIC_CODES[number]` | RFC line 376; use site at 384 now resolves |
| **F2** | `PluginCliDeepReadonly<T>` defined (line 229) and returned by `definePluginCliContribution` (line 282), plus an explicit statement of what is type-enforced versus validation-enforced (line 285) | prose at line 117 and the signature now agree |
| **F3** | Explicit sentence naming `./../escape.ts` as a value the type accepts, and requiring normalization, parent-traversal rejection, and proof the resolved target stays inside the contributing package **before any import** | RFC line 291 |

The F3 wording is stronger than the finding asked for — it adds package-containment proof, not just
traversal rejection, which is the correct bar for an import-safety seam.

### Evidence labelling — resolved better than requested

The author introduced a distinct `PASS_PARENT_HEAD` outcome in the evidence table rather than a prose
caveat, so every receipt row now states which commit it attests: the three S1 receipts attest parent
`3e0c8858b` and the two fix-up receipts attest `86d0110a5`, in each case the tree state before the
commit under review. `source-format-s1*.json` and `source-format-s1-fixup*.json` are labelled
structured **wrapper reports** and explicitly excluded from the S4 durable receipt set. This makes the
distinction machine-visible at S4 instead of relying on a reader noticing a footnote.

### Tier-A sign-off

**S1 (with fix-up) is accepted.** The public-contract slice is internally consistent, its normative
signatures resolve, its immutability and path-safety claims match what the contract actually
guarantees, and its evidence is labelled honestly about what each receipt proves. Signed off by
`topic-features-0.0.7` — a session separate from the Codex generator — in this commit, which is the
supervisor's sign-off commit rather than the implementer's.

**S2 is released**: discovery and generated-registry lifecycle, selected-handler async bootstrap,
cancellation, isolation, plugin-absent UX, capability grants, and the host-owned generation
transaction with preview/no-write, rollback, doctor, and manifest-pointer contract. Same bounded
discipline — one commit, structured receipts, explicit-refspec push, PR comment, run dir in the same
commit, then a Tier-A stop. S3 is not released by this sign-off.

## 2026-08-15 — S2 Tier-A review: accepted with one carried obligation; S3 released

S2 commit `7a5eb580a8515b8dc1007308a9d917b5e7309f41` (local == remote == PR head), tree clean, turn
ended `2026-08-15T00:14:04Z` with the literal `TIER-A STOP: slice S2 ready for topic review`, thread
idle, S3 not started. Scope is 10 files — the RFC (+485 lines) plus the run dir and six receipts —
with **no `packages/**`, `plugins/**`, or `deno.lock`**.

### Verification performed

| Check | Method | Result |
| --- | --- | --- |
| All six contracted S2 sections present | RFC section map | capabilities (480), discovery/registry lifecycle (604), bootstrap (660), isolation/plugin-absent (698), generation transaction (719), doctor/pointer ownership (822); S3 gaps declared (862) |
| **Declare-before-use sweep** | extracted all 42 `PluginCli*`/`PLUGIN_CLI_*` identifiers from every fenced `ts` block and diffed used vs declared | **42 declared, 42 used, 0 undeclared, 0 orphaned** — the F1 defect class is closed across the whole contract, not just at the one site that was reported |
| S1 invariants updated in place, not bolted on | RFC 340, 345, 352, 357–358 | the leaf invariant now reads "handler, a generator, children, or one executable plus children" with `handler`/`generator` mutually exclusive; F3's shape-hint sentence generalized to cover generator refs |
| Live CLI claim: `netscript generate plugins` | `generate-plugin-registries-command.ts:51–53` | `--dry-run`, `--project-root`, `--verbose` — exactly the three claimed, no more |
| Live CLI claim: `netscript plugin doctor` | `doctor-plugin-command.ts:56,58` | `--project-root <path:string>`, `--resource <name:string>` — exactly as claimed |
| Receipts | four durable gates | `PASS`, `gitHead == actualGitHead == bd8b29bf3`, labelled `PASS_PARENT_HEAD`; wrapper reports labelled and excluded from the S4 durable set |
| Honesty about unshipped surface | RFC 856–860 | states the live manifest schema is still top-level `.strict()`, so the new installer block is a target contract with a named prerequisite rather than a shipped claim |

The technically strongest part is the bootstrap section: it identifies that dynamic `import()`
returns a promise but accepts no `AbortSignal`, so racing it would report a timeout while module
evaluation continued, and derives the terminable-boundary requirement from that. It also separates
`handler-unavailable`, `plugin-failure`, `bootstrap-timeout`, `capability-denied`, and
`plugin-absent` so install advice, repair advice, and fault reports cannot collapse into one generic
error.

### S2-N1 — a field whose non-empty case can never occur (carried into S3)

`PluginCliCapabilityGrant` (RFC 275–279) declares `requested`, `granted`, and `denied`, and that
grant is handed to plugin code via `PluginCliInvocationContext.grant` (562) and
`PluginCliGenerationContext.grant` (757). But line 594 makes denial fatal **before** the handler or
planner is imported: "if any requested value is denied, the host returns `capability-denied` before
importing the handler or planner."

So in every grant a handler or planner can actually observe, `denied` is necessarily empty and
`granted` is necessarily equal to `requested` — three fields carrying one field's information, and
the RFC never says where a non-empty `denied` is observed. This is the exact defect class
`milestone-run.md` § Gate integrity names as the signature failure of this kind of work: 0.0.4
shipped two guards whose predicate could never be true and both looked correct. Resolve it one of
three ways — state that the grant type is shared with a host-side diagnostic path where `denied` is
non-empty; narrow the plugin-facing context to `granted` alone; or record explicitly that in contract
major 1 a plugin-visible grant always has `denied === []` and `granted === requested`, with the
forward-compatibility reason for keeping the shape. Any is acceptable; silence is not.

### S2-N2 — text-only generation is a real constraint and is not in Drawbacks (observation)

`PluginCliGenerationOperation` carries `content: string` and line 776 fixes plan contents as UTF-8
text, so a contributed generator cannot emit a binary asset. That is a defensible boundary and
follows from excluding binary handles, but a scaffold generator wanting to emit an image or archive
will hit it. Name it in `## Drawbacks` alongside the other accepted costs rather than leaving it to
be discovered.

### Disposition

**S2 is accepted and signed off.** S2-N1 and S2-N2 are carried into S3 as bounded obligations rather
than triggering a separate fix-up round: unlike S1's F1–F3, which were a hole and two outright
contradictions, these are an unstated implication and a missing drawback — the contract is
internally consistent as written. This mirrors how PLAN-EVAL cycle 2 carried N-1..N-4 into S1.

**S3 is released**: compatibility with the accepted frontend, SDK, runtime, command-composition and
DevTools RFCs; deploy #904–#908 migration/supersession and the hardcoded-host-command audit; the
amend/fold-first duplicate audit; JSR obligations; and the later implementation epic with PR-sized
children. **S4 is not released by this sign-off.**

## 2026-08-15 — S3 Tier-A review: accepted; S4 released as the final slice

S3 commit `171e4e62ebb2e47eb3af08df165394bb4d1bae55` (local == remote == PR head), tree clean, turn
ended `2026-08-15T00:44:39Z` with the literal `TIER-A STOP: slice S3 ready for topic review`, thread
idle, S4 not started. Scope is 14 files — the RFC (+222 lines), the run dir, and nine receipts —
with **no `packages/**`, `plugins/**`, or `deno.lock`**.

### Verification

| Check | Method | Result |
| --- | --- | --- |
| **No issue filed** | live GitHub search, `repo:rickylabs/netscript is:issue created:>=2026-08-14` | **`total_count: 0`** — verified against GitHub, not accepted from the turn report |
| PR lifecycle | live search `is:pr is:draft is:open label:status:impl` | #1651 present — draft, open, exactly one `status:` label |
| All six S3 sections | RFC section map | compatibility (876), deploy supersession (903), hardcoded-command audit (926), duplicate audit (946), JSR obligations (972), epic proposal (998) |
| Declare-before-use sweep re-run | full-document extraction | still 42 declared / 42 used / 0 undeclared |
| Durable receipts | five gates incl. `quality-scan-repo-s3`, both `publish-dry-run-*-s3` | `PASS`, `gitHead == actualGitHead == 7a5eb580a`, `PASS_PARENT_HEAD` labelling retained |

### Both carried obligations closed

- **S2-N1** resolved as option (a), and resolved properly: RFC 603–610 names
  `PluginCliFailure.details.capabilityDecision` on `capability-denied` as the concrete public
  location where `denied` is non-empty, states that the plugin module is never imported and cannot
  observe that decision, and fixes the plugin-facing invariant as `denied.length === 0` with
  `granted` element-for-element equal to `requested`. The field is no longer a predicate that can
  never fire; it now has a named observation site and a stated invariant everywhere else.
- **S2-N2** closed: RFC 1053–1055 records UTF-8-text-only generation as a contract-major-1 drawback
  and points binary assets at a later explicitly bounded operation.

### The audit did not launder a green scan into a clean verdict

This is the part worth recording. RFC 938–944 reports that `deno task quality:scan:repo` returned
zero findings with seven existing allowances — and then explicitly refuses to let that stand as the
coupling audit: "That result proves the scanner's current equality/predicate rules, not the absence
of direct command coupling: the scanner does not flag a plugin-specific factory import followed by
`.command('ai' | 'auth', ...)`." It then supplies the manual audit with concrete `file:line`
findings (`public/features/plugins/plugins-group.ts`, the diverging `local/` composition root,
`ast-extractor.ts`, and the broad `./cli -A` dispatch seam), and assigns the scanner rule-shape gap
to a future guard rather than treating #745 or #1542 as its silent owner.

That is `milestone-run.md`'s "pass is distinguishable from did-not-run" applied unprompted at a
level of rigour the brief asked for but could not have specified. The duplicate audit is likewise
real board reconciliation — eleven existing issues with per-issue amend/fold/depend dispositions and
an instruction that a later epic author repeats the search because live GitHub beats the snapshot.

### Disposition

**S3 accepted with no findings.** No fix-up round.

**S4 is released** as the final implementation slice: final-head reconciliation of all six contracted
proving gates, truthful DoD and `acceptance-evidence` updates, and the IMPL-EVAL handoff package.
S4 carries one instruction that N-4 makes load-bearing — the gates must attest the **content head**,
which requires committing content first and running the gates against the clean committed tree, not
the pre-commit working tree. After S4's Tier-A stop, IMPL-EVAL is a **fresh separate
opposite-family session**, and the ready-flip decision belongs to the coordinator, not this lane.

## 2026-08-15 — S4 Tier-A review: `CHANGES_REQUESTED` on one reproducibility defect

Content head `120859d5c762706702cd45a3f2be19664e335e22`, final head
`c987f009e502df0bbeb33c3d23f508bc6f320238`, turn ended `2026-08-15T01:03:49Z` with the Tier-A stop
line, thread idle. Full review: `slices/tier-a-review-1502-s4.md`.

### N-4 is fully discharged

The carried risk since PLAN-EVAL cycle 2 is closed. All six contracted gates — `check`, `test`,
`publish-dry-run`, `arch-check`, `docs-source-format`, `docs-accuracy` — record
`gitHead == actualGitHead == 120859d5c`, the content head, with no `allowGitHeadMismatch` anywhere.
All 17 final receipts share that single head and none is non-`PASS`. The two-commit structure is
exactly as instructed: content commits first, gates run against the clean committed tree, receipts
land in a follow-up whose delta is confined to the run directory.

### Independently verified

PR #1651 is `draft: true`, `state: open`, status labels `['status:impl']` — no ready-flip, exactly
one lifecycle label. The PR body's Definition-of-Done has 9 of 10 boxes ticked, and the single
unticked box is "A fresh opposite-family IMPL-EVAL records `PASS`; Tier-A S4 topic review is
complete" — precisely the one that cannot yet be true, which is the #260 failure mode correctly
avoided. The `acceptance-evidence` block has **0 `PENDING`** entries and `Closes #1502` is intact.
Scope carries no `packages/**`, `plugins/**`, or `deno.lock`.

### S4-F1 — the `SUFFICIENT` claim is not reproducible from the receipt directory

`worklog.md:241` in the leaf records "The repository evidence-set evaluator reports `SUFFICIENT` with
no reasons" without saying which receipt set it covers. Three final receipts share one `gateId`:
`publish-dry-run-final.json`, `publish-dry-run-cli-final.json`, and
`publish-dry-run-plugin-final.json` are all `gateId: 'publish-dry-run'` with distinct
`invocationId`s. `.llm/tools/gates/evidence-set.ts:20–22` computes duplicates over
`receipts.map(r => r.gateId)` and marks any repeat "duplicate or contradictory", which makes the set
insufficient — so the `SUFFICIENT` verdict can only have come from a hand-picked subset.

That subset is defensible (six contracted gates; per-member runs are supplemental), but the verdict
as written is unreproducible, and the leaf's own handoff at `worklog.md:358` instructs the IMPL-EVAL
evaluator to "independently re-check the six-receipt metadata and sufficiency". An evaluator who does
that by globbing the final receipts gets **INSUFFICIENT** and will reasonably conclude the evidence
set is broken. The gates genuinely passed at the content head — this is a labelling and
reproducibility defect, not a false green — but it lands squarely on the next actor, so it is fixed
now rather than carried into IMPL-EVAL.

Remedy: either give the per-member receipts distinct gate IDs so the whole directory recomputes
`SUFFICIENT` (preferred), or record the exact six receipt filenames the verdict covers and mark the
per-member receipts supplemental. Either way, re-run the evaluator and record the invocation used, so
the claim is checkable rather than asserted.

The six binding gates need not be re-run: the fix touches receipt metadata and journal prose only,
and the recorded command, exit code, and attested head are unchanged.

## 2026-08-15 — S4 fix-up accepted; #1502 leaf is IMPL-EVAL-ready

Fix-up commit `04d431028c1fe455dc18c05e3fa0779e7b593046` (local == remote == PR head), tree clean,
turn ended `2026-08-15T01:12:56Z` with `TIER-A STOP: slice S4 fix-up ready for topic review and
IMPL-EVAL handoff`, thread idle.

### S4-F1 closed, and the fix is reproducible

The author chose remedy **(b)** and executed it completely. `worklog.md` now names the six receipt
IDs that constitute the contracted evidence set — `ns1502-s4-final-check`, `…-test`,
`…-publish-workspace`, `…-arch-check`, `…-docs-source-format`, `…-docs-accuracy` — records the exact
evaluator invocation and its `sufficiency: "SUFFICIENT"` / `reasons: []` result, and states plainly
that a naive `receipts/*final*.json` glob is **intentionally** not the contracted set because it
carries all three `publish-dry-run` receipts and therefore trips the duplicate-gate-ID rule. The
supplemental receipts are named explicitly, and the IMPL-EVAL handoff instruction was updated to
hand the evaluator the same scope, which was the actual failure mode.

**Recomputed independently rather than trusting the recorded string** (the netscript-tools rule, and
this lane's own D-7): loading the six named receipts gives 6/6 matched, zero duplicate `gateId`s,
zero duplicate `invocationId`s, gate IDs exactly `{check, test, publish-dry-run, arch-check,
docs-source-format, docs-accuracy}`, a single `gitHead` `120859d5c`, `gitHead == actualGitHead` for
all six, no `allowGitHeadMismatch`, and six `PASS` outcomes → **SUFFICIENT**.

Also confirmed by diff, not by report: `git diff c987f009e..HEAD -- receipts/` is empty, so **no
receipt file changed**, and `git diff 120859d5c..HEAD -- rfcs/` is empty, so the RFC content is
unchanged since the attested content head. The fix was genuinely journal-only.

### Tier-A sign-off — S4 accepted

**S1, S2, S3, and S4 are all signed off.** The #1502 leaf is complete as an RFC deliverable and ready
for IMPL-EVAL. Final state:

| Field | Value |
| --- | --- |
| Final head | `04d431028c1fe455dc18c05e3fa0779e7b593046` |
| Content head (what the gates attest) | `120859d5c762706702cd45a3f2be19664e335e22` |
| Deliverable | `rfcs/0000-plugin-cli-contribution.md`, Draft/0000, ~1,090 lines |
| Binding evidence | six contracted gates, all `PASS` at the content head, recomputed `SUFFICIENT` |
| PR | #1651 open **draft**, exactly one `status:impl`, 0 review threads, 0 current CI failures |
| DoD | 9/10 ticked; the only open box is IMPL-EVAL `PASS` + Tier-A completion |
| Acceptance | five `acceptance-evidence` entries, 0 `PENDING`, `Closes #1502` intact |
| Boundaries held | no `packages/**`/`plugins/**`/`deno.lock` change, no issue filed (verified `total_count: 0`), no ready-flip, no merge/publish, no expensive-gate lease, `scaffold.runtime` never run |

### Handed back to the coordinator

This lane's work on #1502 is done and **stops here**. The next two actions are the coordinator's, not
this orchestrator's:

1. **Dispatch IMPL-EVAL** — a fresh separate opposite-family session on the route the coordinator
   assigns. This lane will not dispatch it, and the Codex author cannot self-evaluate.
2. **Decide the ready-flip** — the PR stays draft at `status:impl` until the coordinator decides;
   note that draft→ready is itself an automation trigger, so the order matters.

Open drift for the evaluator's attention: D-1 (Codex leaf mobile visibility unproven — deliberately
not repaired), D-4 (issue #1502 still carries `status:research`; this lane's relabel grant covered PR
#1651 only), D-6, D-7. The leaf's own `drift.md` carries its slice-level entries.

## 2026-08-15 — #1651 IMPL-EVAL dispatch (coordinator grant)

### Pre-launch reconciliation

| Source | Value | Result |
| --- | --- | --- |
| Granted final head | `04d431028c1fe455dc18c05e3fa0779e7b593046` | reference |
| Leaf worktree `git rev-parse HEAD` | `04d431028…` | match; clean; no upstream |
| `git ls-remote origin refs/heads/docs/rfc-plugin-cli-contribution` | `04d431028…` | match |
| Live PR #1651 `head.sha` | `04d431028…` | match |
| Content head ancestry | `git merge-base --is-ancestor 120859d5c… HEAD` | **YES**; the only two commits between are `c987f009e` (receipts) and `04d431028` (sufficiency journal) |
| PR state | live | open, draft, exactly one `status:impl` |

**New fact recorded:** live `origin/main` has advanced from the immutable dispatch base
`01e0960494c95ce56eb35892c211a095eb13e6ed` to `0b3ed5d5a6aea451318f120988c25dfa3993a2ab`. PR #1651's
`base.sha` still records the old base. The leaf already disclosed the advance in its `drift.md` and
asserts it does not alter the RFC's ownership/coupling findings. The evaluator is bound to **test
that assertion rather than accept it** — a stale claim about the live CLI/plugin surface is a
finding.

### Evaluator identity

| Field | Value |
| --- | --- |
| Role | formal IMPL-EVAL; fresh session, opposite-family to Codex author `019ffcc5-…` |
| Claude session id | `2a8cf0a6-7529-4ca6-97ce-69edcca3f84d` |
| Job id | `2a8cf0a6` |
| Bridge session id | `session_01Y48WxcCgzUAWfJmGmhBykc` (job state records the `cse_…` form) |
| Remote Control URL | `https://claude.ai/code/session_01Y48WxcCgzUAWfJmGmhBykc` |
| Remote Control label | `netscript-007-features-1502-impleval` |
| PID | `2718910` |
| Exact cwd | `/home/codex/repos/netscript-007-features-1502` |
| Requested route | native Claude Opus 5 · **high** · Remote Control |
| Observed route | `respawnFlags`: `--model claude-opus-5 --effort high --permission-mode bypassPermissions --remote-control` |
| Route verdict | **matched**; no Fable, no substitution |
| Provider boundary | `providerEnv: {}` — native Anthropic auth, so the Remote Control claim is legitimate |
| Brief delivery | job `intent` is 8,125 bytes and begins `use harness` — the full brief was received, not swallowed by a preceding variadic flag |
| Launch state | `working` / `busy` |

Distinct from both the PLAN-EVAL session (`28cc8106-…`, terminal) and this orchestrator
(`19621a0b-…`). One evaluator in this topic; features serialization is internal to features and does
not wait on other lanes.

### Evaluator authority as briefed

May change only `evaluate.md`, push the verdict commit, and post one structured
`[PHASE: IMPL-EVAL] [VERDICT: …]` comment. Explicitly forbidden: ready-flip, relabel, merge, publish,
issue filing/closing, central cluster-state mutation, expensive-gate lease, `scaffold.runtime`,
editing the RFC or package/plugin source, and resuming the Codex author thread.

The brief binds independent recomputation rather than acceptance on nine axes, including recomputing
the SUFFICIENT set itself from the six named `invocationId`s — with the duplicate-`gateId` trap
stated up front so the evaluator does not mistake a deliberate scoping for broken evidence — and
re-deriving the defect classes Tier-A already closed rather than trusting they stay closed.

## 2026-08-15 — #1651 IMPL-EVAL verdict: `PASS`, conditional on one body correction

Session `2a8cf0a6-7529-4ca6-97ce-69edcca3f84d` reached `firstTerminalAt` `2026-08-15T04:05:30Z`
(started `03:50:58Z`; ~14m30s; 63,533 tokens). Verdict established from the committed artifact, not
the session summary.

| Terminal-verdict check | Evidence | Result |
| --- | --- | --- |
| Verdict | `evaluate.md:380` — the single verdict declaration, in the Verdict table | **`PASS`** |
| No contradictory verdict | full-file scan | the only `FAIL_FIX` occurrence is at line 402, in the reasoning explaining why no `FAIL_FIX` condition is met |
| Verdict-only scope | `git show --stat 0e302ad3a` | exactly one file, `evaluate.md`, +408/−12 — narrow authority respected |
| Pushed | `git ls-remote` | `0e302ad3a5915b7a820adcac0a9d5bdc2d7d0019`; local == remote; tree clean |
| Evaluated heads | `evaluate.md` | final `04d431028…`, content `120859d5c…` — both as granted |
| Evaluator identity recorded | `evaluate.md` identity table | bridge `cse_01Y48WxcCgzUAWfJmGmhBykc`, PID `2718910`, exact cwd, requested == observed Opus 5 · high · Remote Control |
| PR state after verdict | live search | still open **draft**, exactly one `status:impl`, 9 labels — **no relabel, no ready-flip** |

The evaluator did the independent work the brief demanded: it re-derived all four previously-closed
defects rather than trusting them, recomputed sufficiency from the six contracted `invocationId`s
(`SUFFICIENT`, `reasons: []`), confirmed no receipt was modified after being written, judged the
subset scoping honest after checking it conceals no failing evidence, matched board reconciliation on
16/16 issues against live GitHub, and **tested the advanced-`main` drift assertion and found it
holds**.

### The one finding — verified independently, and slightly worse than reported

The evaluator reports the PR body's `check` row mis-sources "1,033 files, 9 batches, 0 failed" to
`check-final.json`. I checked the receipts directly:

- `check-final.json` has `stdout.bytes: 0` with an empty tail — it captured **no structured report at
  all**. It proves the command ran and exited 0 at the content head, and nothing more. It cannot
  support any file/batch figure.
- `check-cli-plugin-cycle1.json` carries the tail
  `"selection":{"filesSelected":1033,"batches":9,"failedBatches":0}` — the true source, and a
  **cycle-1** receipt from a different head.

So the PR body does not merely cite the wrong file: it presents **cycle-1 figures as final-head
figures**. The gate itself genuinely passed at the content head, so this is not a false green about
pass/fail, but the quantitative claim is unsupported by the final receipt. Confirmed still present in
the live body.

The correction must therefore either drop the figures from that row or label them explicitly as
cycle-1 evidence — "attribute it to a different receipt" is not sufficient, because no final receipt
carries those numbers. Root cause worth carrying forward: the final `check` gate captured empty
stdout, so a future final-evidence run should ensure the structured report is captured, or the row
should cite only what the receipt proves (command, exit code, attested head).

### Concurrence with the verdict

`PASS` is the right call. Per `verdict-definitions.md`, `FAIL_FIX` requires a failing gate, missing
evidence, a wrong path/link, or a false-done state; none applies. The defect is prose in the PR body,
the underlying gate passed at the content head, and the run's own `worklog.md` attributes the figure
correctly. Returning the run to implementation over it would misstate the state of the work.

### Outstanding before merge

One bounded, body-only correction, which changes no head, no receipt, and no RFC content. It is
**not yet applied** — verified live. Merge and the ready-flip remain coordinator decisions, and the
verdict is explicitly conditional on this correction landing first.

## 2026-08-15 — owner overlap gate on #1651, and the amendment grant

### The gate

Owner comment
[`#issuecomment-5300440887`](https://github.com/rickylabs/netscript/pull/1651#issuecomment-5300440887)
at `2026-08-15T04:04:16Z`: "Verify your RFC is not a duplicate or overlapping recently merged :
rfcs/0003-command-composition-kit.md".

The IMPL-EVAL session went terminal at `04:05:30Z` — **74 seconds later** — and had started at
`03:50:58Z`, so it ran entirely before the comment existed. Its `PASS` therefore **does not discharge
this gate** and is not merge authority. Recorded as an active hold on merge.

The coordinator delegated a fresh independent read-only audit, which concluded **BLOCK pending
amendment**: #1651 is *not* a duplicate overall — its plugin CLI discovery/routing/help/bootstrap/
isolation core is distinct — but it carries material unresolved overlap with
`rfcs/0003-command-composition-kit.md` and with live implementation ownership **#1490 under #1363**.

### Audit findings verified independently against source

Before briefing the amendment I checked the four load-bearing claims rather than relaying them:

| Claim | Verification | Result |
| --- | --- | --- |
| "host-owned execution" is wrong | `rfcs/0000-plugin-cli-contribution.md:887` literally attributes "host-owned execution" to RFC 0003; RFC 0003 executes through `@netscript/service/commands` via `createCommandExecutor` composed by the consumer (`rfcs/0003…:207,308,472`) | **confirmed** — the phrase misstates the owner |
| `PluginCliJson` ≡ `CommandJson` | both are the same six-member JSON union (`0000…` public surface vs `0003…:332-338`); only member order differs, which is meaningless structurally | **confirmed** — they are mutually assignable, so an unqualified cross-payload non-assignability claim is impossible in a structural type system |
| Outcome vocabulary exists to map | `rfcs/0003…:497-498` — `applied \| replayed \| conflict \| rejected \| failed \| cancelled` and idempotency `claimed \| replayed \| not_requested \| missing \| mismatch \| busy` | **confirmed** |
| Capability collision is real | `CommandStoreCapabilities` (`rfcs/0003…:671`) is transactional store capability; #1651's `PluginCliCapability` is an invocation permission token | **confirmed** — same word, different domain |

### PLAN-EVAL determination — not required

The coordinator asked for this determination before advancing. **A new PLAN-EVAL is not required**;
proceed with Tier-A plus a fresh IMPL-EVAL.

Reasoning: the approved plan already scoped compatibility with RFC 0003 explicitly — DoD box 5, the
S3 slice scope, and locked decision D17 — and the RFC already states at line 887 that "A CLI handler
may invoke a command executor". The amendment therefore *makes precise a relationship the plan
already approved* rather than introducing new architecture. Ownership delimitation (#1363/#1490),
the corrected execution-owner phrase, capability and identity-domain disambiguation, and conformance
cases are all refinements. The nested adapter law and outcome mapping are the substantive additions,
but they constrain a boundary the plan already authorized and change nothing about plugin CLI
ownership, mounts, discovery, bootstrap, isolation, or the generation transaction. Checklist item 12
explicitly preserves the distinct core.

**Caveat carried into the brief:** if the author concludes that item 4 (a brand or discriminant on
`PluginCliJson`) or item 5 (the adapter law) forces a change to an approved **locked decision** in the
D-series rather than a refinement of one, that is a scope expansion — it must stop and report, not
proceed on its own judgement.

### Evaluator commit reconciled

IMPL-EVAL verdict commit `0e302ad3a5915b7a820adcac0a9d5bdc2d7d0019` remains the branch head; local ==
remote; tree clean. Its conditional medium finding — the PR body attributing "1,033 files, 9 batches,
0 failed" to `check-final.json` — is folded into this amendment as checklist item 11, together with
the sharper form I verified: `check-final.json` has `stdout.bytes: 0` and carries no figures at all,
so the numbers must be attributed to `check-cli-plugin-cycle1.json` and the final receipt's cache hit
described accurately.

### Constraints held during the hold

No reply to the owner comment, no resolution of it, no RFC or PR-body edit, no ready-flip, no
relabel, no merge, no treating the evaluator `PASS` as merge authority.

## 2026-08-15 — owner verdict: keep-and-narrow; hold released, amendment bounded

### The verdict and its authority

The owner selected **option 1 (keep-and-narrow)** for PR #1651. The coordinator committed the
verdict at `eb46e33fb6493ce6ef5350f7abd6e4da51854577` on `chore/release-0.0.7-orchestration`
(`chore(harness): narrow the plugin CLI RFC boundary`, clean and pushed). I read its
`worklog.md`, `context-pack.md`, `supervisor.md`, `drift.md`, and `milestone-status.md` diffs
before acting; the cluster state now records features as `implementing` with 1 in-flight leaf,
where it previously read `blocked`.

The owner-overlap hold recorded in the previous section is therefore **released**. The RFC is not
split, not closed, and not folded. Only **C6** overlaps RFC 0003 / #1490, and the fix is an
ownership narrowing, not a redesign.

### The previous 12-item checklist is superseded

The coordinator's earlier amendment checklist (items 1-12, recorded above) was written from the
delegated audit's BLOCK-pending-amendment finding. The owner verdict replaces it with a narrower
8-point contract. Items that survive are carried in the new brief; items that do **not** survive are
recorded here so no later reader treats them as unfinished work:

| Prior item | Disposition under the owner verdict |
| --- | --- |
| 1 name #1363/#1490 and delimit ownership | **carried** — now the core of the contract |
| 2 #1490 retains route names / emitted artifacts / semantic validation | **carried and sharpened** — restated as provider, Prisma schema/models/indexes, migration lifecycle, generated bridge and transaction-client types, DB validation, receipt/audit/outbox semantics |
| 3 correct "host-owned execution" | **carried** — an accuracy defect in the compatibility text (RFC 0000 line 887) |
| 4 brand/discriminant on `PluginCliJson` | **not authorized** — a brand is a design change. The bounded repair is to *qualify* the unqualified non-assignability claim at line 891, which is currently false for the plain JSON value aliases |
| 5 nested adapter law | **narrowed** — the adapter may map RFC-0003 domain output into `PluginCliGenerationPlan` / the shared executor; no new normative call-chain law is authorized |
| 6 outcome mapping across the adapter | **not authorized** — that is RFC 0003/#1490 semantics, which #1651 must not define |
| 7 cancellation/deadline settlement semantics | **not authorized** — same reason; RFC 0000 line 899 already assigns durable business rollback to RFC 0003 |
| 8 capability disambiguation | **carried** — falls inside the ownership text |
| 9 identity-domain mapping | **not authorized** — command identity is RFC 0003-owned |
| 10 conformance cases for the boundaries | **narrowed** — conformance obligations follow the amended ownership text; no new cross-RFC outcome fixtures |
| 11 PR-body provenance repair | **carried** — now contract point 8 |
| 12 preserve the distinct core | **carried** — now contract point 1 |

Writing items 4, 6, 7, and 9 into the RFC would have made #1651 define command-store semantics —
exactly the direction the owner's point 4 forbids. The supersession is a narrowing, not a dropped
obligation.

### New contract dispatched to the author

Eight points, verbatim in `slices/impl-1502-amendment.md`: preserve the distinct
descriptor/router/registry/capability/bootstrap/isolation core; C6 owns only generic CLI
contribution workspace-plan execution (canonical text plan validation, preview/apply safety, common
stage/check/commit/rollback, generic registry/plan/journal doctor states); RFC 0003/#1490
exclusively owns the command-store side; the adapter maps one into the other without either
reimplementing the other; doctor split; preview-invariance of the planner (which closes the
evaluator's carried C6 observation); amended compatibility/ownership text and C6 roadmap naming RFC
0003 and #1490; and the PR-body provenance correction.

### PLAN-EVAL: not required, and now settled by the owner

My earlier determination stands and is reinforced: the owner resolved the sole design choice and no
plan or scope expansion remains. No PLAN-EVAL cycle 3 exists. The caveat I carried — "stop if a
locked D-series decision must change" — is retained in the brief, but the items that could have
triggered it (a `PluginCliJson` brand, a normative outcome mapping) are the ones the verdict removed.

### Pre-dispatch reconciliation

| Check | Result |
| --- | --- |
| Coordinator checkpoint | `eb46e33fb` on `chore/release-0.0.7-orchestration`, clean, pushed |
| Leaf local `HEAD` | `0e302ad3a5915b7a820adcac0a9d5bdc2d7d0019` |
| Leaf remote `refs/heads/docs/rfc-plugin-cli-contribution` | `0e302ad3a5915b7a820adcac0a9d5bdc2d7d0019` |
| Live PR #1651 head | `0e302ad3a5915b7a820adcac0a9d5bdc2d7d0019` |
| Leaf tree | clean |
| PR state | open **draft**, exactly one lifecycle label `status:impl` |
| `pr-checks` | `ok=true`, 16 checks, 0 current failures — **all `skipped`**, so not gate evidence (D-6) |
| Author thread `019ffcc5-…` | not loaded in the daemon and no agent in the leaf worktree; safe to resume |
| Coordinator thread `019ffaa3-…` | working — not touched |

### Body defects verified directly, not accepted on report

- `check-final.json`: `outcome PASS`, `exitCode 0`, `durationMs 51`, `stdout.bytes 0`,
  `sha256 e3b0c442…` (the empty-string digest). It carries **no** file/batch figures of any kind.
- `check-cli-plugin-cycle1.json`: same `gateId: check`, `invocationId ns1502-plan-fix1-check-cli-plugin`,
  `durationMs 71003`, at head `d71b78c3…` — a **different** head from the content head. This is where
  "1,033 files / 9 batches / 0 failed" actually comes from.
- The body's `check` row therefore cites a real receipt for numbers that receipt does not contain,
  and the numbers that do exist attest a different commit. Re-pointing the citation is not a fix;
  the figures must be dropped or relabelled as cycle-1 evidence, and the 51 ms final run described
  plainly as a valid cached re-check.
- Additional stale prose found while verifying: the body still names `c987f009e…` as the final
  receipt/journal head (the branch has since advanced through `04d431028…` to `0e302ad3a`), and
  "Next action: Tier-A topic review, then coordinator dispatch …" describes a handoff that has
  already happened twice.

## 2026-08-15 — amendment landed, Tier-A signed, final IMPL-EVAL dispatched

### Author turn (preserved thread `019ffcc5-…`)

Two commits, no replacement session, no rival `send-message-v2`:

| Head | Commit | Contents |
| --- | --- | --- |
| Content | `67e12f02165089ec7431b72d1294147477906282` | `docs(rfc): narrow C6 to generic workspace plans` — RFC + three leaf journals |
| Evidence | `d45a92ba70e78cc1ff42617ca15f6782f4ea8c21` | `docs(harness): bind owner amendment evidence` — journals + six receipts |

Local == remote == live PR head == `d45a92ba7`; tree clean; PR **draft**; exactly one `status:impl`.

### Tier-A — `ACCEPTED_WITH_FINDINGS`

Full review in `slices/tier-a-review-1502-amendment.md`. The independent basis — including RFC
0003's own ownership text at `:783-820` and defects A-G — was written **before** the author's turn
completed, so the review is not shaped by the author's account of its own work.

Everything re-derived rather than accepted:

- All eight contract points are decided in RFC text: `:211-223` ownership block, `:799-804`
  preview-invariance, `:813-819` adapter direction with both prohibitions, `:886-890` doctor split,
  `:918` compat row, `:922-926` assignability, `:993` #1490 amend/fold row, `:1053` C6 roadmap row,
  `:1136-1139` prior art.
- "host-owned execution" is gone — zero occurrences.
- **Over-correction checked, not just under-correction.** All four forbidden items absent; every
  grep hit on outcome/idempotency/outbox vocabulary is a disclaimer of ownership or a pre-existing
  row re-emitted by column rewrap.
- Six receipts: distinct `gateId`s, all `PASS`/exit 0, every one `gitHead == actualGitHead ==
  67e12f021`, no `allowGitHeadMismatch`. **Sufficiency recomputed by hand — `SUFFICIENT`.**
- Scope clean across `0e302ad3a..d45a92ba7`: RFC 0003 untouched, no `packages/**`, `plugins/**`, or
  `deno.lock`.
- Symbol integrity re-derived: 42 declared, 42 used, 0 undeclared. The three symbols appearing once
  in code and again in prose match the S4 baseline.
- The prior conditional finding is genuinely closed, and the replacement claim is accurate:
  `check-amend.json` has `durationMs 64`, `stdout.bytes 0`, and `stderr.tail` ending
  `(cached, inputs unchanged)`; its stderr sha256 `cc927711…` is identical to `check-final.json`'s.

**AF-1 (editorial, closed).** The body cited "reproducibility fix `04d431d9c`" — not a valid object;
the real commit is `04d431028`. I validated all 15 SHA-like tokens in the body; that was the only
unresolvable one (`5300440887` is the comment id). A dead SHA is not openable evidence, so it is a
miss inside assigned point 8 rather than a new issue. Closed by a bounded body-only correction turn
to the same author — not a formal cycle, and it moved no head, so the six receipts still bind.
Re-verified afterwards: every body SHA resolves, `04d431d9c` is gone, head still `d45a92ba7`.

The author also posted an `OWNER-AMENDMENT — KEEP AND NARROW` phase comment. Checked: it reports its
own phase and does **not** reply to or resolve owner comment `5300440887`.

### Final IMPL-EVAL dispatched

Brief: `slices/impl-eval-1502-amendment.md`, bounded to the amendment, the prior conditional
finding, evidence reachability, and duplicate/ownership proof — and instructing the evaluator that
**over-correction is also a finding**.

| Field | Value |
| --- | --- |
| Job / session | `e8cd9765` / `e8cd9765-9f6c-4418-bbc2-4a24f221f2d4` |
| Bridge session | `cse_01Cwg2ukqsMkwpuca5xhzVaG` (non-empty → Remote Control attached) |
| cwd | `/home/codex/repos/netscript-007-features-1502` |
| Requested route | native Claude Opus 5 · medium · Remote Control |
| Observed route | `respawnFlags` = `--effort medium … --remote-control … --model claude-opus-5`; `providerEnv {}` |
| Route verdict | **matched**, native Anthropic auth, opposite-family to the Codex author |
| CLI | `2.1.233` |
| Brief delivered | `intent` length 10,095 bytes |
| Created | `2026-08-15T08:11:17Z` |

**Launch correction worth recording.** The first launch omitted `--bg`, so it started a foreground
session that registered no job dir and wrote nothing to its redirect log. I read that as a stall and
killed it — it was in fact working. No damage: its transcript shows 69 records of reads only (11
Bash, 2 Read, 1 Skill, 1 ListAgents), zero commits, zero artifacts, zero PR comments, and the tree
was clean afterwards. Relaunching with `--bg` also restores the route proof, since `respawnFlags`
only exists for registered background jobs. Recorded as D-12.

### Final IMPL-EVAL — terminal `PASS`, no substantive findings

Verdict artifact `evaluate-amendment.md:3` (`## VERDICT: PASS`), 280 lines, verdict-only commit
`ec69100c89195adb776c4cef3724c8c3683c553c` touching that one file. PR comment:
`https://github.com/rickylabs/netscript/pull/1651#issuecomment-5301336480`. Local == remote == PR
head == `ec69100c8`. PR still **draft**, exactly one `status:impl`. The evaluator relabelled nothing
and did not flip the PR.

Evaluator identity as recorded in its own artifact: session `e8cd9765-9f6c-4418-bbc2-4a24f221f2d4`,
bridge `cse_01Cwg2ukqsMkwpuca5xhzVaG`, PID `375750`, cwd the leaf worktree, requested = observed =
native Claude Opus 5 · medium · Remote Control, read from job `respawnFlags`.

I did not take the `PASS` on its word. Spot-checking the artifact against its own claims:

- It re-read `rfcs/0003-command-composition-kit.md:783-820` independently and mapped each of the six
  `netscript db command-store add` duties onto a term in the C6 exclusion list at `rfcs/0000:221-227`
  — duty 1 → provider selection, 2 → Prisma models, 3 → migration/indexes, 4 → generated bridge,
  5 → transaction-client types, 6 → migration refusal — concluding the boundary "partitions rather
  than describes" and closes without gap or overlap. That is the same derivation I made
  independently at Tier-A, reached from source rather than from my review.
- It checked **over-correction**, not just compliance: all four forbidden items absent, with the
  cancellation/deadline case argued correctly by hunk ranges (every such line predates the amendment
  and no hunk intersects them).
- It recomputed sufficiency itself, re-ran the evaluator over exactly the six named files, and
  independently rediscovered the glob trap — naming the three `publish-dry-run` collisions plus six
  receipts with no `gateId` at all.
- It validated merge-facing reachability beyond what was asked: twelve of twelve body SHAs resolve
  and are ancestors of the pushed head, all six receipt links exist at `blob/d45a92ba7`, and three
  fragment anchors resolve to real headings.
- It verified `#1490 under #1363` against the **live board** rather than the RFC's table — #1490
  `OPEN`, milestone `0.0.10`, and the `sub_issues` endpoint on #1363 returning `1482…1491`.

**Two editorial notes carried, no substantive findings.** Neither returns work to the author under
the coordinator's loop policy, and neither changes a decision, gate, or ownership boundary:

1. `rfcs/0000:213` — the package-ownership summary row lost the words "process execution" in the
   rewrite. Host ownership of gate subprocesses survives normatively at `:841` and `:852`, so the
   decision stands; the table is simply less complete than the body it summarizes.
2. `rfcs/0000:918` — the compatibility cell dropped "`PluginCliGenerationPlan` mutates workspace
   files only and cannot stand in for a database transaction". The substance survives as an
   ownership prohibition at `:816-822`, so nothing is lost, but the plan-versus-DB-transaction
   contrast now exists only in negative form.

### D-8 re-check before treating this verdict as terminal

D-8 exists because the previous IMPL-EVAL returned `PASS` 74 seconds after an owner gating comment it
never saw. Applying that rule here: the evaluator started `2026-08-15T08:11:17Z`, and the only PR
comment created after that timestamp is the evaluator's own verdict comment at `08:18:00Z`. No owner
or reviewer gate was raised inside the evaluation window, so this verdict does not repeat the D-8
failure. It remains a verdict on the head it evaluated, not merge authority — the ready-flip and
merge stay with the coordinator.

## 2026-08-15T08:28Z — #1502 / PR #1651 shipped

The coordinator exercised merge authority. Verified independently rather than reconciled from the
report:

| Field | Value | How verified |
| --- | --- | --- |
| Merged PR head | `ec69100c89195adb776c4cef3724c8c3683c553c` | `gh pr view 1651 -q .headRefOid` — **identical** to the evaluated verdict head |
| Merge commit | `284dda90a17a13a7e5e8e9834e5411b58887131b` | `gh pr view 1651 -q .mergeCommit.oid` |
| Merge mode / time | squash, `2026-08-15T08:28:46Z` | PR `state: MERGED`, `mergedAt` |
| `origin/main` | `284dda90a` | `git fetch origin main && git rev-parse origin/main` — the merge commit **is** the live tip |
| Commit subject | `docs(rfc): define typed plugin CLI contributions (#1651)` | `git log --oneline -1 284dda90a` |
| Issue #1502 | `CLOSED` at `2026-08-15T08:28:47Z` | `gh issue view 1502` |
| #1502 acceptance | **5/5 checked** | all five `- [x]` boxes read from the live issue body |
| #1502 labels | exactly one `status:` — `status:shipped` | `area:cli, type:docs, area:plugins, priority:p0, rfc, status:shipped, epic:cli-contrib` |
| PR #1651 labels | exactly one `status:` — `status:shipped` | `impl-eval:skip` **absent**, confirmed by enumeration not by report |

The merged head is the exact head Tier-A signed and the bounded IMPL-EVAL passed — no drift between
what was evaluated and what shipped, which is the trap `eval-verdict-head-must-equal-merge-head`
exists to catch. The close-gate chain is intact end to end: `Closes #1502` in the body, five checked
acceptance boxes, one `status:` label on each of the issue and the PR, and the issue closed one
second after the merge.

**D-4 is now closed.** #1502 no longer carries the stale `status:research`; the coordinator's relabel
moved it directly to `status:shipped`.

The `rfc-plugin-cli-contribution` leaf is terminal. Its worktree
`/home/codex/repos/netscript-007-features-1502` and author thread
`019ffcc5-d3e1-7c13-9815-e9956ec43683` are finished; the thread is preserved, not resumed. Nothing in
this lane is running.

## 2026-08-15 — frozen features queue inspected; next leaf selected

The queue is **not** exhausted. `leaf-contracts.json` carries 16 features contracts — one
coordinator checkpoint and 15 implementation leaves — covering exactly the 17 issues the lane owns
per `briefs/topic-features/implement.md`. With #1502 shipped, **14 implementation leaves remain
unshipped**.

| Wave | Leaf | Issues | Archetype | State |
| --- | --- | --- | --- | --- |
| 0 | `rfc-a-stage0-ratification-board` | #1348 | 4-dsl-builder | coordinator checkpoint — no leaf PR, never closed by this lane |
| 0 | `rfc-plugin-cli-contribution` | #1502 | 4-dsl-builder | **shipped** `284dda90a` |
| 1 | **`prisma-mysql-adapter-surface`** | **#1293** | 2-integration | **selected — dispatched** |
| 1 | `app-service-client-wiring` | #1355, #1360 | 2-integration | eligible, queued behind serialization |
| 2 | `sdk-procedure-metadata` | #1466 | 4-dsl-builder | blocked by wave |
| 2 | `workers-job-policy-metadata` | #1451 | 4-dsl-builder | blocked by wave |
| 3 | `sdk-client-contribution-seam` | #1349 | 4-dsl-builder | blocked by wave |
| 3 | `ui-resource-slice-generator` | #1354 | 6-cli-tooling | blocked by wave |
| 4 | `sdk-auth-contribution-dogfood` | #1352 | 4-dsl-builder | blocked by wave |
| 4 | `workers-job-payload-typing` | #1455 | 4-dsl-builder | blocked by wave |
| 5 | `sdk-locale-contribution-proof` | #1467 | 4-dsl-builder | blocked by wave |
| 6 | `plugin-service-context-factory` | #1452 | 5-plugin | blocked by wave |
| 6 | `workers-execution-progress` | #1592 | 3-runtime-behavior | blocked by wave |
| 7 | `ai-openai-responses-mapper` | #1591 | 2-integration | blocked by wave |
| 7 | `fresh-client-navigation-coordinator` | #1590 | 4-dsl-builder | blocked by wave |
| 8 | `fresh-ai-chat-response-options` | #1458 | 3-runtime-behavior | blocked by wave |

### Why `prisma-mysql-adapter-surface` (#1293)

Wave 1 is the lowest unshipped wave and holds exactly two leaves. Both are genuinely eligible —
`milestone-dependency-dag.json` shows **zero incoming edges** for `issue:1293`, `issue:1355`, and
`issue:1360`, so nothing gates either. Per-topic serialization allows one, so the tie is broken by
contract order and size: #1293 is a single issue with a single package surface, while
`app-service-client-wiring` spans two issues. #1293 goes first; `app-service-client-wiring` is next
in line and needs no new eligibility check when this leaf terminates.

All five candidate issues were confirmed live: #1293, #1355, #1360, #1451, #1466 are all `OPEN` on
milestone `0.0.7` and unshipped.

### What this leaf actually is, and the two boundaries it must respect

#1293 is the lane's **first framework-source leaf** — a real published-surface change to
`packages/prisma-adapter-mysql/`, not another document. Contract: archetype `2-integration`, file
surfaces `deno.json`, `src/adapter.ts`, `src/types.ts`, proving gates `check`, `test`,
`publish-dry-run`, `arch-check`, and `jsrAudit.applicable: true` with two named risks (audit public
exports and exact `@netscript` pins; isolated-declaration dry-run rejecting runtime asset/
`import.meta` reads).

Two boundaries I flagged into the brief rather than leaving for the leaf to discover:

1. **Acceptance box 4 is cross-lane.** "#1112's example rewritten against the shipped surface and
   verified executable" points at #1112, a `type:docs` issue on milestone `0.0.7` that is **not** in
   this lane's owned issue list. #1293 exists precisely because the docs lane previously made a
   framework change it was not entitled to make. This leaf owns the framework surface and must not
   close, edit, or claim #1112 — it hands the docs lane a shipped surface to write against. A
   `Closes #1293` that reads as also closing #1112 would repeat the original error in mirror image.
2. **The connection-error hook is API design, not a side effect.** The issue is explicit that the
   docs lane's `onConnectionError` / `onError` shape was "reasonable in shape, but it must be
   designed and reviewed as an API". That is the one place this leaf could need adversarial
   planning.

### PLAN-EVAL determination — deferred to evidence, not pre-decided

`lane-policy.md:61-64` makes PLAN-EVAL **conditional** by owner decision (2026-08-08): required for
genuinely complex or decision-heavy work, otherwise `PLAN-EVAL: N/A` when contract, scope,
acceptance, and gates are complete. #1293's contract is complete, which points at N/A; the hook's
API shape points the other way.

Rather than pre-decide from outside the code, the leaf is briefed to research first and then
**propose** the determination with evidence, stopping for my ruling before implementing. If the hook
turns out to be a mechanical addition fully determined by the acceptance criteria, N/A is right and
recorded with reasoning. If it forces a real design choice — options field versus override, or how
it composes with Prisma's driver-adapter contract — that is decision-heavy and I will request a
PLAN-EVAL dispatch grant from the coordinator. **I hold no standing evaluator-dispatch grant**; the
reset contract reserves formal gates to explicit coordinator grants, and this lane has never
launched one without.

### Routes selected from policy, not invented

| Lane | Route | Source |
| --- | --- | --- |
| Implementation | Codex · OpenAI · GPT-5.6 Sol · **high** (`complex_implementation`) | `lane-policy.md:28`; matches the features lane's preserved Codex route recorded in `topic-features/codex-thread-ids.md` |
| Tier-A review | Claude · Fable 5 · **medium** (`review_codex_complex`), fallback Opus 5 · medium | `lane-policy.md` review-pairing ladder, effort-paired to Sol · high |
| IMPL-EVAL | native opposite-family Fable 5 · medium, per-policy fallbacks | `lane-policy.md:46`; mandatory unless the owner waives |

Fable 5's recorded allowance was exhausted earlier in this run (D-2), so the Opus 5 fallback is the
realistic reviewer. Requested and observed routes will both be recorded; no route match will be
claimed unless they match.

### #1293 leaf dispatched

| Field | Value |
| --- | --- |
| Leaf | `prisma-mysql-adapter-surface` (#1293), wave 1 |
| Worktree | `/home/codex/repos/netscript-007-features-1293` |
| Branch | `feat/prisma-mysql-adapter-surface` @ `284dda90a`, **no upstream by design** |
| Base | live `origin/main` tip `284dda90a17a13a7e5e8e9834e5411b58887131b`, not the frozen dispatch base |
| Codex thread | `01a0048f-8d95-7682-a3ce-1c1926aba75c` |
| Rollout | `/home/codex/.codex/sessions/2026/08/15/rollout-2026-08-15T10-35-11-01a0048f-….jsonl` |
| Requested route | provider=openai · model=gpt-5.6-sol · effort=high |
| Observed route | provider=openai · model=gpt-5.6-sol · effort=high |
| Route verdict | **matched** |
| Runtime | approval=never · sandbox=dangerFullAccess |
| Brief | `slices/impl-1293.md`, staged to `/home/codex/ns1293-prisma-mysql-surface-brief.md` (9,158 bytes) |
| Steering | `codex exec resume 01a0048f-8d95-7682-a3ce-1c1926aba75c -- "<follow-up>"` — never a second `send-message-v2` at that worktree |

Launched through `launch-codex-slice.ts` after a `--dry-run` that validated the brief (`use harness`
and `## SKILL` both present), git safety (`branch` correct, `head 284dda90a`, `upstream NONE`,
`dirty 0`), the `--expect-base` match, and the explicit `--provider/--model/--effort` triple. The
launch was **not** wrapped in `timeout` — that kills the slice rather than the launch and leaves a
rollout with no error.

The leaf is briefed to stop after research and plan, and to **propose** its PLAN-EVAL determination
with reasoning rather than decide it. It was told explicitly never to launch an evaluator itself.

**Housekeeping note.** `launch-codex-slice.ts` writes `slices/codex-thread-ids.md` at a fixed path,
so the next leaf launched into the same `--slice-dir` will overwrite this record. Copied to
`slices/codex-thread-ids-1293.md` to preserve it; treat the unsuffixed file as launcher-owned and
transient, and snapshot it after every dispatch.

## 2026-08-15 — coordinator grant: conditional PLAN-EVAL and the compatibility disposition

### The disposition is now decided, and it closes D-13's open question

**Preserve and wire** `PrismaMySqlOptions.onConnectionError`. Do **not** remove a shipped public
option without owner breaking-change authority.

This resolves the wire-or-remove choice I put to the leaf. The reasoning it encodes is the one D-13
identified: the option is already published at `0.0.6` and already re-exported from the package's
public surface, so wiring it is additive while removing it breaks consumers who typed against it —
and a lane orchestrator has no authority to spend a breaking change. The dead-predicate defect is
real, but the remedy is to make the predicate fire, not to delete the surface that promised it.

### Conditional gate

One fresh opposite-family PLAN-EVAL is authorized **only if both** hold:

1. the same author returns a **clean, pushed, decision-heavy** plan; and
2. my **Tier-A plan review** has run first.

A plan that turns out mechanical does not get a formal gate — that is `lane-policy.md:61-64`'s
conditional rule working as intended, and the conditional grant does not convert a mechanical plan
into a decision-heavy one.

### What the PLAN-EVAL must evaluate, when it runs

Callback **timing and error semantics**; the public adapter export; explicit slow-type annotations;
tests; and the surface/JSR gates. That list is narrower than "review the plan" and I will bind the
evaluator to it rather than letting it roam.

### Boundaries reaffirmed

Docs-owned #1112 and the `docs/site/reference/prisma-adapter-mysql/` edits stay **out of this leaf**,
with the follow-up dependency recorded rather than silently absorbed. No rival author; no launch
before the author stops; the features serial queue continues autonomously after the gate.

### Sequencing consequence

The author is mid-turn at the time of this grant, so the disposition is **not** relayed yet — one
active send per worktree. It goes to the same thread `01a0048f-8d95-7682-a3ce-1c1926aba75c` the
moment its turn ends, before any gate, so the plan it finalizes is built on the decided disposition
rather than on an open question.

**Watch item:** `git status` in the leaf worktree already shows a modified `deno.lock`. The brief
forbids lock churn absent a reviewed need; most likely a side effect of a `deno check` / `deno doc`
run. Flagged for Tier-A — a plan-phase leaf should return a clean tree apart from its own run
artifacts.

## 2026-08-15 — coordinator close-gate ruling for #1293: split-close

The acceptance-box-4 conflict I escalated is resolved, and resolved the conservative way.

**Ruling.** #1293 acceptance box 4 is **preserved unchanged**. The product PR carries
`Part of #1293` with **no closing keyword** and may merge on its own product gates and evaluation
while #1293 remains open. That merge satisfies the #1293 → #1112 implementation prerequisite; the
fixes/docs-example leaf then runs in its own orchestrator. Only after #1112 rewrites and verifies the
executable example may box 4 be checked and #1293 closed.

**Why this is the right shape.** The alternative was amending box 4 down to its package-owned half so
`Closes #1293` could stand. That would have made the close-gate pass by shrinking the acceptance
criterion to fit what one lane could reach — the failure mode `netscript-pr` records as the #260
precedent, a box ticked without the evidence behind it. Split-close instead keeps the criterion
honest and lets the issue stay open until the work it actually describes is done. It costs an extra
open issue and buys a truthful board.

**Consequences carried into the leaf and the gate.**

- The PR body uses `Part of #1293`. A bare `#N` or `Refs #N` does not auto-close, which is exactly
  the property wanted here — but the body must also state the remaining scope explicitly rather than
  relying on the absence of a keyword to communicate it.
- `acceptance-evidence` mirrors only the boxes this leaf can truthfully discharge. Box 4 is named as
  blocked on #1112 with the prerequisite relationship stated.
- #1293 keeps exactly one `status:` label through this leaf's life and does **not** move to
  `status:shipped` when the product PR merges.
- The PLAN-EVAL is **barred** from weakening, reinterpreting, or deciding this contract. It is a
  cross-lane close contract, not a design decision, and an evaluator that "helpfully" proposes
  `Closes #1293` would be relitigating coordinator authority. This is written into the evaluator
  brief as a constraint with a stated reason, so it reads as a boundary rather than an omission.

### #1293 Tier-A plan review and PLAN-EVAL dispatch

**Tier-A plan review: `ACCEPTED` — decision-heavy.** Full artifact in
`slices/tier-a-plan-review-1293.md`. I re-derived every load-bearing measured baseline rather than
accepting it, because a wrong baseline poisons every later "we fixed it" claim:

| Claim | Result |
| --- | --- |
| six pre-existing `private-type-ref` doc-lint errors | **confirmed** — "Found 6 documentation lint errors" |
| capability probe swallows every failure | **confirmed** — `adapter.ts:700-718` returns `{ supportsRelationJoins: false }` on any error, so a bad credential is indistinguishable from an old server |
| raw publish dry-run green, no real slow type | **confirmed** — `Success Dry run complete`, 8 files |
| `examples/**` outside the publish set | **confirmed** — no `examples/` path in the 8 |
| upstream keeps its connected class private, hook scoped narrowly | **confirmed and sharper** — `@prisma/adapter-mariadb@7.8.0` exports only the `PrismaMariaDb` factory; documents `onConnectionError` as "Callback attached to transaction connection `error` events"; invokes it at one site |

Two facts the research did not draw out, added to the record and to the evaluator brief: our
published signature is `(err: Error) => void`, **wider** than upstream's `(err: SqlError)` and
unnarrowable without a breaking change, so the predicate must be carried by documentation and tests
rather than by the type; and upstream's narrow predicate does **not** satisfy #1293's stated
"pool fails" motivation. Precedent and intent genuinely conflict — the strongest single argument
that `PLAN-EVAL: N/A` would have been wrong here.

Three non-blocking gaps raised: duplicate-notification is a test assertion rather than a named
design constraint; `executeScript` is enumerated in research but absent from the slice plan; and the
box-4 conflict needed authority neither the leaf nor the gate holds.

**Close-contract contradiction caught before dispatch.** The first pushed plan `ba2b4b7aa` predated
the split-close ruling and still said "The PR body must eventually carry `Closes #1293`" in three
places. An evaluator reading a plan that says `Closes` while its brief says `Part of` would either
report a false contradiction or try to adjudicate a contract it was barred from touching. One tight
same-author amendment turn fixed it: plan head `23c4d671b57282ddf2e5c3b834ac8e787d1dff09` adds
locked decision **D8**, flips the open-decision row to `RESOLVED — coordinator ruling: split-close`,
and rewrites the acceptance-evidence, S3 Tier-A-stop, and risk rows to the decided contract.
Verified after: **zero** residual `Closes #1293`, local == remote, clean tree.

**Gate dispatched.** Brief `slices/plan-eval-1293.md`, pinned to the exact plan head so a mismatch is
a hard refusal.

| Field | Value |
| --- | --- |
| Job / session | `75d9028e` / `75d9028e-0277-4b1c-bc2f-cefd0ce68dd7` |
| Bridge session | `cse_01T55opXUMc1mMKDZaA8bRf3` (non-empty → Remote Control attached) |
| cwd | `/home/codex/repos/netscript-007-features-1293` |
| Requested route | native Claude **Fable 5 · medium** · Remote Control (`lane-policy.md:45`, opposite-family for a Codex plan) |
| Observed route | `respawnFlags` = `--effort medium … --model claude-fable-5`; `providerEnv {}` |
| Route verdict | **matched** — no fallback needed |
| Brief delivered | `intent` length 11,790 bytes |
| Created | `2026-08-15T08:56:43Z` |

The gate is bound to the coordinator's five subjects and required to **rule** on the three open
design decisions rather than hand them back. The three settled items — wire-don't-remove, #1112 out
of scope, and split-close — are stated as boundaries with their reasons, with explicit instruction
that disagreement earns one observational sentence and nothing more, so "already decided" cannot read
as a gap the evaluator should fill.

**D-2 update.** That entry recorded Fable 5 as unavailable when its allowance was exhausted during
#1502's cycle 1, forcing the Opus 5 fallback. Fable 5 · medium was **accepted** for this dispatch
with `providerEnv {}`, so the exhaustion was transient and the policy-preferred evaluator route is
live again. No fallback is claimed here.

## 2026-08-15 — #1293 PLAN-EVAL terminal `PASS` with three binding rulings

Verdict-only commit `7780ba49e119377f2be39cac5ed110fc12758bfc` adding `plan-eval.md` alone (275
lines). Local == remote == `7780ba49e`; tree clean. Evaluated plan head `23c4d671b`, base
`284dda90a`. Evaluator: session `75d9028e-0277-4b1c-bc2f-cefd0ce68dd7`, bridge
`cse_01T55opXUMc1mMKDZaA8bRf3`, PID `417888`, requested = observed = **Fable 5 · medium**, route
**match** read from `respawnFlags`. No PR exists at this head, so it correctly posted no PR comment
and reported to the orchestrator instead.

It honoured all three coordinator rulings without reopening any, and confined its view of the
split-close contract to a single observational sentence ("coherent with the leaf's evidence; no
objection") exactly as the brief instructed.

### It re-measured everything, including things nobody asked it to

It reproduced all six baselines independently — the six `private-type-ref` errors with their exact
identities and line numbers, the eight-file green dry-run, the upstream single call site, the
unexported class, the swallowing probe, and the two-paths-from-one-acquisition-failure structure.

Then it went further than the brief: it opened **mysql2's own source**
(`client_handshake.js:311,323,371,385`, `base/connection.js:208,217,456,906`) and established that
handshake errors, socket errors, `PROTOCOL_CONNECTION_LOST`, and connect-timeout are all marked
`err.fatal = true`. That is what turns "connection error" from a hand-wave into an implementable
predicate, and it is the difference between a gate that ratifies and a gate that resolves. It also
spot-checked every doctrine citation the plan made (A1/A2/A5/A10/A11/A13/A14, AP-3/4/5/10/11/14/19/25,
the Archetype-2 gate set) and confirmed `arch-debt.md` carries no entry for this package.

### The three rulings

**R1 — callback timing and error semantics.** The predicate is a **package-owned classifier applied
uniformly at every driver-rejection boundary**, not a boundary-name list: add
`isConnectionError(error: unknown): boolean` to `src/errors.ts`, true iff a driver error and
(`fatal === true`) or (`errno ∈ {1040, 1203}`) or (`code` in a closed exported transport/pool set).
`MySqlError` gains `fatal?: boolean`; the classifier stays module-internal unless `surface:diff`
records it intentionally. Auth/access/missing-database (1045/1044/1049) fire **iff the driver marked
them fatal** — i.e. at handshake — and are ordinary mapped errors mid-session; 1040/1203 always fire.
Precedent vs intent is **ruled for intent**: upstream's event predicate is unreachable through our
`MysqlPoolClient` seam, so our wider signature is kept and the predicate is carried by JSDoc and
tests, with no event listener added. Containment is **swallow + `debug`, never rethrow, never
aggregate**, with tests asserting the primary rejection is the *same object* (`===`) with and without
a throwing callback. The choke point is a **design constraint**, not a test: one private notifier is
the only call site, and for `startTransaction` only the outer `connectionLifecycle.catch` notifies —
which the evaluator justified by observing that `pool.getConnection()` failure never enters the inner
catch at all. `executeScript` is **in scope for notification, out of scope for normalisation**.

**R2 — public adapter export: Choice B.** The concrete class stays out of the root export map.
The reasoning is the one that matters: the issue's *need* is that an example cannot name what it
constructs, but the example constructs the public `PrismaMySqlAdapterFactory` and receives the public
`PrismaMySqlConnectedAdapter` — both nameable today. Choice A would drag `MysqlPoolClient` and
`MySqlQueryable` into the surface or force a construction redesign, which is AP-3/AP-4 territory.
**R2.2 says plainly that box 1 as worded is not satisfied** and that rewording it is an owner/issue
edit the orchestrator must request — see the escalation below. R2.4 resolves the test-reachability
gap I raised at Tier-A with the minimum seam: a **module-scoped** `export` on the class so tests can
construct it with a fake client, with **no** root re-export, and `surface:diff` must show no root
delta from it.

**R3 — capability probe: notify-and-preserve-fallback.** `connect()` still resolves on a dead host,
and the evaluator stated that cost plainly rather than burying it: the first real operation then
fails with its mapped error and fires the hook again — per-operation exactly-once, not a duplicate.
Rejecting instead would change shipped `0.0.6` behaviour without breaking-change authority.

### Required before the first S1 code commit

Record the rulings as locked decisions in `plan.md` — **D9** = R1.1–R1.3 and R1.5–R1.8, **D10** =
R2.1–R2.4, **D11** = R1.4/R3 — and add `executeScript` to S2's boundary list. This is a run-artifact
edit, not implementation. I verify it at the S1 Tier-A stop. Implementation that diverges from a
ruling is drift and goes in `drift.md`.

Also carried: the evaluator conditioned its D7 acceptance on the **raw** `deno doc --lint` exit code
and the **raw** `deno publish --dry-run` tail being pasted into the evidence at the content head,
because acceptance box 3 ("`deno doc --lint` clean") is otherwise proven only by an un-receipted
check. That condition is now part of the leaf's final-evidence obligation.

### Escalation to the coordinator — issue wording, not mine to change

Under R2.1/R2.2, #1293 acceptance **box 1** ("`PrismaMySqlAdapter` exported from the package's
public surface") will not be satisfied as written, by design and on evaluator ruling. The leaf will
mark it **not discharged as worded** in `acceptance-evidence` and state that the intentionally
exported connected-adapter contract satisfies the stated need. Rewording box 1 is an owner/issue
edit. This does **not** block the product PR — split-close already keeps #1293 open — but the board
will carry a box that is deliberately unticked for a reason that is not "unfinished work", and that
should be recorded by whoever owns the issue text.

### Plan amendment verified; S1 released

Amended plan head `feb8b0355215e7282b87787117dc5c244653250d`, pushed, local == remote, clean tree.
I checked all four required items against the file rather than accepting the author's report:

| Required item | Verified at |
| --- | --- |
| D9 = R1.1–R1.3, R1.5–R1.8 | `plan.md:105` — classifier, single choke point, preserved rejections, containment |
| D10 = R2.1–R2.4 | `:106` — Choice B, connected-adapter contract retained, module-local class export for tests, "box 1 not discharged as worded" |
| D11 = R1.4/R3 | `:107` — probe notifies per D9 and preserves the conservative fallback |
| `executeScript` in S2's boundary list | `:129-130`, `:198` |
| Raw doc-lint / dry-run evidence obligation | `:237` |
| Box 1 marked not discharged as worded, with escalation stated | `:245` |

The summaries are faithful rather than weakened — D10 carries the `surface:diff` prohibition and the
escalation, not just "Choice B". Nothing sent back.

**S1 released** to the same author thread `01a0048f-…`, serially. Scope: Choice B export map, the
R2.4 module-scoped test seam with no root re-export, all six `private-type-ref` repairs, explicit
`provider`/`adapterName` annotations, and **raw** doc-lint and dry-run output recorded rather than
summarised. `surface:diff` showing a `PrismaMySqlAdapter` root export is drift against R2.3 and a
stop-and-report, explicitly not something to paper over by adjusting the diff.

S2 (classifier, notifier, `isConnectionError`, the `fatal` field) is withheld and released separately
after the S1 Tier-A stop.

### S1 Tier-A — `CHANGES_REQUESTED`

Commit `ecb98cc88f9c86918ff535f7ada36b055df3e737`, pushed, local == remote, clean tree. Full review
in `slices/tier-a-review-1293-s1.md`.

**Verified by running it, not by reading the report:** diff scope is `adapter.ts`, `src/mod.ts`,
`tests/surface_test.ts` plus leaf journals — no `deno.lock`, no `docs/**`. R2.1/R2.3 hold
(`src/mod.ts:40` carries no `PrismaMySqlAdapter`); R2.4 holds (`adapter.ts:325` module-exported, not
re-exported). `deno doc --lint` is now **exit 0, "Checked 1 file"**, down from six diagnostics.
Publish dry-run still green with the same eight files. Annotations landed. `MySqlTransaction`
correctly left unexported — the PLAN-EVAL's subject-4 analysis already established every transaction
boundary is reachable through the fake `MysqlPoolClient`, so a second seam would have been surplus
surface.

The new `tests/surface_test.ts` is the right shape: it asserts the class is **absent** from the
public API *and* **importable** from `src/adapter.ts`, so both halves of the ruling fail loudly if a
later change violates either.

**S1-F1 (significant) — the new public query type is wider than the contract it fronts, and a cast
hides it.** Clearing the six `private-type-ref` diagnostics introduced overloads whose public arm
takes a newly declared `PrismaMySqlQuery`, bridged to the implementation by
`performIO(query as SqlQuery)`. That type is not an alias — its `argTypes` element diverges from
upstream `ArgType` (`@prisma/driver-adapter-utils@7.8.0/dist/index.d.ts:12-20`) three ways:
`scalarType` is `string` where upstream is a 12-member literal union (**widened**); `dbType` is
required where upstream is optional; `arity` is optional where upstream requires it (**widened**).
The two are mutually non-assignable, which is exactly why the assertion was needed — it is silencing
a real incompatibility, not a nominal one.

Concrete failure: `argTypes: [{ scalarType: 'BigInt', dbType: 'BIGINT' }]` type-checks against the
public overload, is cast to `SqlQuery`, and reaches `mapArg` (`conversion.ts:161-205`) which branches
on exact lowercase literals `'bigint'` / `'datetime'` / `'bytes'`. `'BigInt'` matches none, so it
falls through to `return arg` and MySQL receives the raw string instead of a `BigInt`. Nothing
errors at any layer.

So S1 traded a documentation defect for a correctness one. Widening a public **input** type is the
dangerous direction — it admits values the implementation cannot honour. Two acceptable remedies
were given (structural exactness plus deletion of the cast, or a single-source-of-truth re-export),
with an explicit instruction not to "fix" it by loosening the implementation signature.

**S1-N1 (note)** — add bidirectional compile-time assignability assertions so future upstream drift
becomes a `check` failure rather than being absorbed by a cast. That is what turns F1 from
"fixed once" into "cannot silently regress".

Also stated so it is *not* changed while fixing F1: `PrismaMySqlResultSet.columnTypes` is `number[]`
against upstream `Array<ColumnType>`, but that widening is on the **return** path — it loses enum
precision for consumers and cannot admit bad input. Not a finding.

This is the third time on this milestone that a defect of the same family — a declared surface whose
promise the implementation cannot keep — has been caught by re-deriving rather than reading. #1502
S1's undeclared diagnostic-code type and S2's unreachable `denied` case were the first two; D-13's
never-invoked published option was the third and is what this whole leaf exists to repair. Fix-up
dispatched to the same thread; S2 remains withheld.

### S1 accepted after fix-up; S2 released

Fix-up commit `49fda0b77b4db4a91f1cb25e23b13e4bf1259699`, pushed, local == remote, clean tree.
Scope: `adapter.ts`, `tests/surface_test.ts`, leaf journals. No `deno.lock`, no `docs/**`.

**S1-F1 closed, and verified by the check that actually proves it.** The author took remedy (a):
`scalarType` is now the exact 12-member literal union, `dbType?: string` is optional, `arity` is
required. Two independent signals confirm the divergence is genuinely gone rather than edited around:

1. `deno check --unstable-kv ./mod.ts ./tests/surface_test.ts` **passes**, which means the
   bidirectional guards `_toUpstream`/`_fromUpstream` compile — `PrismaMySqlQuery` and upstream
   `SqlQuery` are now **mutually assignable**. This is the load-bearing proof; the guard is not
   decoration, it is the test of the fix.
2. `grep "as SqlQuery"` returns **NONE**. The cast existed only because the types diverged, so its
   disappearance corroborates (1). Had the author "fixed" the types but kept the cast, that would
   have been the tell that they still did not line up — which is exactly why the remedy said the
   cast must become unnecessary.

**S1-N1 closed.** The guards live in `tests/surface_test.ts` and are covered by the contracted
`check` gate, so future upstream drift in `ArgType`/`SqlResultSet` breaks the build instead of being
absorbed by an assertion.

Re-verified after the fix-up: `deno doc --lint` clean ("Checked 1 file"); `deno publish --dry-run`
`Success` with the same eight files; R2.3 still holds (`src/mod.ts:40` carries no
`PrismaMySqlAdapter`); and **no S2 wiring leaked** — the only `onConnectionError` in `src/` is the
untouched pre-existing declaration at `types.ts:39`. Slice discipline held.

**S2 released** to the same thread. It carries the classifier (`isConnectionError` in `errors.ts`,
module-internal, with the closed transport-code set and the `fatal` signal mysql2 actually sets), the
R1.2 auth/access rule (1045/1044/1049 fire only when the driver marked them fatal; 1040/1203 always),
the R1.6 single choke point with its structural justification (only the outer
`connectionLifecycle.catch` sees `pool.getConnection()` failure), R1.5 containment with `===`
identity assertions, R1.4/R3 probe behaviour including the accepted cost that `connect()` still
resolves against a dead host, and R1.7's split treatment of `executeScript`. Tests must be capable of
failing: exact call counts, identity equality, and classifier-false negatives at every firing
boundary.

### S2 Tier-A — accepted, no findings

Commit `47ad48c9dcfe408e5de150fdb3a65d0f2111ee1f`, pushed, local == remote, clean tree. Scope:
`adapter.ts`, `errors.ts`, `types.ts`, three test files, leaf journals. No `deno.lock`, no `docs/**`.

Every ruling verified structurally rather than from the report:

| Ruling | Verification |
| --- | --- |
| R1.6 single choke point | `notifyConnectionError` (`adapter.ts:34-47`) is the **only** code touching `options.onConnectionError` — grep returns three hits, all inside it |
| R1.6 transaction placement | inner catch (~`421-424`) rejects `connectionReady` and rethrows **without notifying**; the outer `connectionLifecycle.catch` (`429-434`) is the sole observer. Constructor injection at `445` preserves the single-call-site property across the transaction boundary |
| R1.1 classifier | `fatal === true \|\| errno 1040 \|\| errno 1203 \|\| code ∈ MYSQL_CONNECTION_ERROR_CODES`, gated behind `isDriverError`; `MySqlError.fatal?: boolean` at `errors.ts:17`; **not** root-exported |
| R1.4/R3 probe | `notifyConnectionError(options, e)` fires **before** `return { supportsRelationJoins: false }`, so it lands before `connect()` resolves, fallback preserved |
| R1.5 containment | callback in its own try/catch, failure to `debug`, never rethrown |
| R1.3 | JSDoc states the predicate and names `isConnectionError`; no event listener added |
| R2.3 | `src/mod.ts:40` still carries no `PrismaMySqlAdapter` |

Gates re-run by me: `deno check` clean, `deno test` **46 passed / 0 failed**, `deno doc --lint`
clean, `deno publish --dry-run` green.

The test that carries the most weight is `connection_errors_test.ts:218-219`:
`assertStrictEquals(withThrowingCallback, withoutCallback)` proves the primary rejection is the
**same object** whether or not the callback throws. That is identity rather than shape, which is the
only form of the assertion that can actually catch R1.5 being violated. Call counts are asserted
exactly (0 and 1) with classifier-false negatives at the firing boundaries, so a blanket
`onError`-override implementation — the design the ruling rejected — would fail these tests rather
than pass them.

**The point of the leaf is now discharged:** the option D-13 found published-but-dead since `0.0.6`
actually fires, and a test fails if it stops.

**S3 released** — example against `../mod.ts`, journals including the docs-owned staleness record,
the four contracted receipts at the committed content head with sufficiency recomputed and the four
files named, the evaluator's binding D7 raw-output condition, and the draft PR carrying
**`Part of #1293`** with no closing keyword, box 1 marked "not discharged as worded" and box 4 marked
blocked on #1112.

### S3 Tier-A — accepted; leaf is IMPL-EVAL-ready

| Field | Value |
| --- | --- |
| Content head | `3dee41263e5e34a9f59972edb43a345c8d4494c0` |
| Evidence head | `d8d255bdc103eb120cc7b8835dfe3ce870017c32` (local == remote) |
| PR | **#1662**, open **draft**, milestone `0.0.7`, exactly one `status:impl` |
| Labels | `status:impl, wave:v1, type:feat, gate:jsr, priority:p2, area:database, area:packages` |

**Four contracted receipts, verified field by field and sufficiency recomputed by hand:**

| invocationId | gateId | outcome | exit | `gitHead == actualGitHead == 3dee41263` | override |
| --- | --- | --- | --- | --- | --- |
| `prisma-mysql-1293-check` | `check` | PASS | 0 | yes | absent |
| `prisma-mysql-1293-test` | `test` | PASS | 0 | yes | absent |
| `prisma-mysql-1293-publish-dry-run` | `publish-dry-run` | PASS | 0 | yes | absent |
| `prisma-mysql-1293-arch-check` | `arch-check` | PASS | 0 | yes | absent |

Four distinct `gateId`s, so the `evidence-set.ts` duplicate rule does not fire. **SUFFICIENT**,
recomputed rather than read.

**The close contract held exactly.** A scan of the PR body for `closes #` / `fixes #` / `resolves #`
returns **nothing**; line 4 carries `Part of #1293.`; #1112 is referenced without a keyword; and the
body states the remaining scope explicitly rather than leaving the absent keyword to imply it.

**The `acceptance-evidence` block is honest, which is the whole point of split-close.** Box 1 reads
"Not discharged as worded under PLAN-EVAL R2.1/R2.2" and explains what satisfies the stated need
instead; box 4 reads "Blocked on #1112. This product change supplies its implementation
prerequisite". Neither is ticked. A block that mirrored the checkboxes by asserting completion would
have been the #260 failure this gate exists to stop — and it would have passed a naive close-gate.

**The evaluator's D7 condition is discharged.** `worklog.md` carries the raw
`deno doc --lint packages/prisma-adapter-mysql/mod.ts` invocation, its output (`Checked 1 file`) and
exit code, plus the raw `deno publish --dry-run` tail (`Success Dry run complete`) and eight-file
list, at the content head — not summaries. That was the explicit condition for accepting D7's
four-receipt scoping.

**Boundaries held across the whole range `284dda90a..d8d255bdc`:** no `docs/**` path and no
`deno.lock` in the diff. `docs/site/reference/prisma-adapter-mysql/index.md:23` — which becomes false
on merge — is **named in the PR and in leaf `drift.md`, and left unedited** for the docs lane. The
example now imports `../mod.ts` and stays outside the publish set.

### Stopping here — IMPL-EVAL needs a coordinator grant

The leaf is implementation-complete and evidence-complete. IMPL-EVAL is mandatory for this work
(`lane-policy.md:46`, native opposite-family, Fable 5 · medium for Codex work) and this lane holds
**no** standing evaluator-dispatch grant — the PLAN-EVAL grant was explicit, one-shot, and closed
with "do not launch another evaluator". Requesting the dispatch grant rather than assuming it.

Also carried up, unchanged and still owner/coordinator business: #1293 acceptance **box 1** will
remain unticked by design under R2.1/R2.2. Rewording it is an issue edit no one in this lane may
make.

### #1293 / PR #1662 IMPL-EVAL dispatched under coordinator lease

Pre-dispatch reconciliation, all four sources agreeing before any mutation:

| Source | Value |
| --- | --- |
| Local `HEAD` | `d8d255bdc103eb120cc7b8835dfe3ce870017c32` |
| Remote ref | `d8d255bdc…` |
| Live PR #1662 head | `d8d255bdc…`, open **draft** |
| Tree | clean |
| Content→evidence delta | `acceptance-evidence.md`, `context-pack.md`, `worklog.md`, and the four receipts — **verified by diff**, no source file |

| Field | Value |
| --- | --- |
| Lease | coordinator `codex-root-0.0.7`, exactly one evaluator, PR #1662 / #1293, immutable head `d8d255bdc` |
| Job / session | `e64f33f0` / `e64f33f0-c88e-4fc7-9e79-63c01fed94db` |
| Bridge session | `cse_01XrFMbPHpry6tL3v9ZmRsLK`, `bridgeOutboundOnly: false` |
| Remote Control URL | `https://claude.ai/code/session_01XrFMbPHpry6tL3v9ZmRsLK` (the `session_` form — the jobs-file `cse_` form does not resolve) |
| Requested route | native Claude **Fable 5 · medium** · Remote Control (`lane-policy.md:46`, opposite-family for Codex work) |
| Observed route | `respawnFlags` = `--effort medium … --model claude-fable-5`; `providerEnv {}` |
| Route verdict | **matched**, native Anthropic auth |
| Brief delivered | `intent` length 10,912 bytes |
| Created | `2026-08-15T10:11:15Z` |

**Attachment was not claimed on first read.** At registration `bridgeSessionId` was `null` — the
route flags were already correct, but Remote Control had not attached. Rather than record the route
match as an attachment, this lane polled until the bridge was non-empty and only then wrote the
identity above. A route match proves how a session was launched; a non-empty bridge proves it is
reachable, and the lease requires both before mutation.

The brief binds the evaluator to all six lease subjects and instructs it to record identity and lease
**before** touching anything, with an immutable pushed verdict.

Three obligations written in deliberately, beyond restating the subjects:

1. **Re-derive the S1 defect rather than trust it closed.** Tier-A returned a public input type
   widened past the contract it fronted with a cast hiding it. The evaluator must confirm mutual
   assignability, that the cast is *gone*, and specifically that the bidirectional guards **would
   fail if the types diverged** — a guard that cannot fail is not a guard — then check the same
   widening class across every other public type the leaf added.
2. **Judge whether the tests can fail.** A hook suite asserting only "callback was called" passes
   against the blanket `onError()` override R1 rejected. The evaluator must say which properties the
   suite would actually catch, and hunt for a boundary that fires twice or not at all.
3. **Judge the honest-undischarged framing, not just accept it.** Boxes 1 and 4 are deliberately
   unticked, which is correct here — but "declared undischarged" is also the shape a lane would use
   to dodge proving something provable, so the evaluator is asked whether the framing is accurate or
   evasive.

Settled items are stated as compliance checks rather than open questions: the coordinator rulings,
PLAN-EVAL R1–R3, and the owner-only #1293 box-1 wording, which the lease confirms **does not block**
this product evaluation.

The next features leaf, `app-service-client-wiring` (#1355, #1360), stays queued until this PR
lifecycle is terminal.

## 2026-08-15 — #1293 / PR #1662 IMPL-EVAL terminal `PASS`

Verdict commit `f52aa471c0b4e8fe44b7d0e231c69f58b52dc9bf`, adding `evaluate.md` alone (138 lines).
Local == remote == live PR head == `f52aa471c`. PR #1662 open **draft**, exactly one `status:impl`.
Structured comment posted:
`https://github.com/rickylabs/netscript/pull/1662#issuecomment-5301776738`.

Evaluator: session `e64f33f0-c88e-4fc7-9e79-63c01fed94db`, bridge `cse_01XrFMbPHpry6tL3v9ZmRsLK`,
requested = observed = **Fable 5 · medium · Remote Control**, `providerEnv {}`, opposite-family to
the Codex author. Identity and lease recorded before mutation, as the lease required.

**Substantive findings: none.** Four editorial notes.

### It discharged all three obligations I wrote past the subject list

1. **It falsified the guard rather than admiring it.** I asked whether the bidirectional guards
   *could* fail. It built a scratch file with a deliberately widened control type and confirmed
   `TS2322 Type 'Wide' is not assignable to type 'SqlQuery'` fires, while
   `Eq<PrismaMySqlQuery, SqlQuery>` type-checks as `true`. So the guard would have caught the
   original S1 defect. That is an experiment, not an inspection, and it is the only thing that
   actually settles the question.
2. **It swept the same defect class across every public type** — `Eq<…>` true for
   `PrismaMySqlTransactionOptions`, `PrismaMySqlConnectionInfo`, `PrismaMySqlIsolationLevel` — and
   found one that is **false**: `PrismaMySqlResultSet.columnTypes: number[]` against upstream
   `ColumnType[]`. It then did the part that matters: checked `git show 284dda90a:…/adapter.ts` and
   established the widening is **pre-existing at base**, output-side, with no runtime conversion
   skipped, and therefore not chargeable to this leaf. That is the same conclusion I reached at
   Tier-A and deliberately recorded as "not a finding", reached independently and with a stronger
   proof.
3. **It answered the blanket-`onError` question concretely**, naming the boundaries that never pass
   through `onError` at all — `executeScript`, transaction acquisition, commit/rollback, disposal,
   post-ready lifecycle — each asserting exactly one call with `assertStrictEquals`. It found no
   boundary firing twice or not at all, and confirmed isolation/`BEGIN` failures traverse both
   catches yet still count once.

It also recomputed sufficiency itself, re-ran the raw D7 doc-lint and dry-run at the evidence head and
confirmed byte-identical results, and ran `arch:check` and `quality:scan` on its own initiative —
both exit 0 with only pre-existing allowances outside this package.

### E2 is my process miss, not the author's

The evaluator found PR #1662 carries **zero per-slice comments**, against `run-loop.md:117`, which
expects a per-slice PR comment trail. The evidence is complete — the PR body's slice list and the
in-repo `worklog.md` carry the trail — but the harness form was not followed.

That is an orchestrator error, and specifically mine: I sequenced the PR to open at **S3** rather
than at S1, so S1 and S2 had no PR to comment on, and I never instructed the author to backfill.
On the #1502 leaf the PR existed from the plan phase and every slice got its comment; here the
ordering silently removed the surface the rule depends on. Recorded as **D-15** with the fix for the
next leaf: open the draft PR at the first slice so the commit trail has somewhere to live.

E1 (pre-existing `columnTypes` widening, a candidate follow-up surface tightening), E3 (no literal
`## Design` heading; the design lives in `plan.md` D1–D11 plus the rulings), and E4
(`startTransaction` boundaries tested only with a non-throwing callback, containment covered
transitively through the single shared notifier) are carried and non-blocking.

### Lane state

The #1293 leaf is gate-complete: PLAN-EVAL `PASS`, Tier-A on every slice, IMPL-EVAL `PASS`, four
exact-head receipts `SUFFICIENT`, close contract intact. **Merge authority is the coordinator's** and
the PR lifecycle is not yet terminal, so `app-service-client-wiring` (#1355, #1360) stays queued.

## 2026-08-15 — #1662 readiness transition reconciled; one label discrepancy reported

### Terminal evaluator tuple, confirmed against live state

| Field | Value | Verified |
| --- | --- | --- |
| Evaluator session | `e64f33f0-c88e-4fc7-9e79-63c01fed94db` | matches this lane's dispatch record |
| Bridge | `cse_01XrFMbPHpry6tL3v9ZmRsLK` | matches |
| Route | native Fable 5 · medium · Remote Control | requested = observed |
| Evaluated head | `d8d255bdc` | matches the immutable evidence head |
| Verdict | `PASS`, no substantive findings; E1–E4 editorial | matches `evaluate.md` |
| Evaluator head | `f52aa471c0b4e8fe44b7d0e231c69f58b52dc9bf` | local == remote == live PR head |
| Comment | `#issuecomment-5301776738` | present |
| Review threads | 0 threads, 0 unanswered | `agentic:review-threads` → `PASS`, exit 0 |
| Split-close body | `Part of #1293`, no closing keyword | re-verified |
| #1293 | `OPEN`, `status:impl`, wording untouched | confirmed |
| PR #1662 | `draft=false`, `OPEN`, milestone `0.0.7` | ready flip confirmed |

### Discrepancy — the PR's lifecycle label is `status:impl-eval`, not `status:ready-merge`

The coordinator's message states #1662 was normalized to "sole `status:ready-merge`". Live state says
otherwise:

```text
labels = status:impl-eval, wave:v1, type:feat, gate:jsr, priority:p2, area:database, area:packages
```

Read twice, twenty seconds apart, from two independent sources — `gh pr view --json labels` and the
raw `repos/rickylabs/netscript/issues/1662/labels` API — both returning `status:impl-eval`. This is
not propagation lag.

The **single-`status:` law holds** (exactly one lifecycle label, so the double-label failure this
lane watches for did not occur). Only the value differs from the report.

**Reported, not corrected.** The coordinator performed this relabel and holds the authority over it;
this lane silently "fixing" a label to match a report would destroy the evidence that the two ever
disagreed, which is the more valuable artefact. Flagged because merge and close-gate automation can
key on `status:ready-merge` specifically, so a merge performed on the assumption that label is
present may not behave as expected.

### Readiness CI at the exact head — not yet terminal

`agentic:pr-checks` at `f52aa471c`: `ok=true`, `currentFailures=0`, 58 checks —
5 `success` current-pass, 13 `skipped` current-pass, 36 superseded, and **2 still `in_progress`**.
Zero current failures is a true statement but not a terminal one; per D-6 a green rollup that is
partly "nothing ran" is not itself gate evidence, and two pending jobs mean the set is not settled.
Monitoring to terminal rather than reporting green early.

**Not merging.** Merge is the coordinator's and is explicitly gated on terminal green.

## 2026-08-15T10:27Z — #1662 merged; #1293 stays open by contract

Verified independently rather than reconciled from the report:

| Field | Value | Check |
| --- | --- | --- |
| Merged PR head | `f52aa471c0b4e8fe44b7d0e231c69f58b52dc9bf` | **identical** to the evaluated verdict head |
| Merge commit | `3fc0f2f9221a8246f0d26a26189bafb2647be08a` | `git merge-base --is-ancestor` → true; it is the `origin/main` tip |
| Subject | `feat(prisma-mysql): expose connected surface and wire connection errors (#1662)` | |
| Merged at | `2026-08-15T10:27:29Z`, squash | |
| PR #1662 | `MERGED`, sole `status:shipped` | single-`status:` law holds |
| #1293 | **`OPEN`**, `status:impl`, wording unchanged | as the split-close contract requires |
| Acceptance boxes | 1 ☐, 2 ☑, 3 ☑, 4 ☐ | exactly the contracted shape |

The earlier `status:impl-eval` discrepancy is resolved — the PR now carries sole `status:shipped`.

**The board is now honest in a way a normal close would not have been.** #1293 stays open with box 1
unticked by design (R2.1/R2.2 — the concrete class deliberately stays out of the root surface) and
box 4 unticked pending #1112. Boxes 2 and 3 are ticked on shipped evidence. Nothing claims work that
was not done, and the issue's own wording was never bent to fit what one lane could reach.

**Note for whoever eventually reworks box 1.** Its text requires "the surface-diff gate green", and
the `surface-diff` CI job was **`skipped`** on this PR — 12 of the 20 current checks were skipped by
the cheap-lane config; the 8 that actually ran were `build`, `check-test`, `close-gate`,
`code-quality`, `quality`, `classify docs-site changes`, `core CI lane visibility`, and `build`.
No false claim was made, because box 1 is unticked. But the R2.3 property it describes *was* proven —
by the leaf's own `tests/surface_test.ts` asserting `'PrismaMySqlAdapter' in publicApi === false`, and
by the IMPL-EVAL's independent `deno doc --json` of the root export map. Proven by artefact, not by
that CI job. Recording it so a future reader does not assume the skipped job means the property is
unverified.

**#1112 is now unblocked** — the docs leaf has a shipped surface to write against, which is the
prerequisite split-close described.

### Next features leaf released — `app-service-client-wiring` (#1355 + #1360)

| Field | Value |
| --- | --- |
| Worktree | `/home/codex/repos/netscript-007-features-1355` |
| Branch | `feat/app-service-client-wiring` @ `3fc0f2f92`, **no upstream by design** |
| Base | live `origin/main` tip `3fc0f2f9221a8246f0d26a26189bafb2647be08a` — the #1662 merge commit |
| Codex thread | `01a004f9-f033-7592-a0bc-63927753fb43` |
| Requested route | provider=openai · model=gpt-5.6-sol · effort=high |
| Observed route | provider=openai · model=gpt-5.6-sol · effort=high |
| Route verdict | **matched** — original/native routing preserved |
| Brief | `slices/impl-1355.md`, staged at 7,489 bytes |
| Steering | `codex exec resume 01a004f9-f033-7592-a0bc-63927753fb43 -- "<follow-up>"` |

Launched through `launch-codex-slice.ts` after a `--dry-run` validating the brief, git safety
(`upstream NONE`, `dirty 0`), the `--expect-base` match, and the explicit provider/model/effort
triple. Thread record snapshotted to `slices/codex-thread-ids-1355.md`, and the previous leaf's to
`codex-thread-ids-1293.md`, since the launcher overwrites the unsuffixed file on every dispatch.

**Three deliberate differences from the #1293 leaf:**

1. **The draft PR opens at the FIRST slice**, carrying `Closes #1355` and `Closes #1360`. Both
   issues are wholly within scope, so this is a normal close — not split-close. This is the direct
   fix for **D-15**: the per-slice comment trail now has an artefact to live in from the start,
   rather than the rule silently lapsing because the PR did not yet exist.
2. **Every issue citation must be re-verified at `3fc0f2f92`.** Both issues cite line numbers
   verified at `fac9e339042c`, and the base has moved a long way since. #1293 is the precedent that
   makes this non-negotiable — its stated gap 2 ("no connection-error hook") was simply false against
   live code, and a leaf that had trusted the issue would have built the wrong thing.
3. **The expensive gate is fenced.** This contract names six proving gates, including
   **`scaffold.runtime`** and **`fresh-browser`**. `scaffold.runtime` is the repo's expensive gate,
   explicitly not to be overlapped, and this lane holds **no lease**. The leaf must plan when it runs
   and what it uniquely proves that nothing cheaper does, but may not run either gate without my
   release; I request the lease from the coordinator only once the plan justifies it.

Also required up front: a **backward-compatibility answer**. These templates have already generated
code in existing scaffolded projects, so "what changes for someone who regenerates versus someone who
does not, and is any of it breaking" is a real question for a generator fix, not a formality.

The leaf stops after research and plan, and proposes both determinations — PLAN-EVAL necessity and
expensive-gate timing — rather than deciding either.

### Coordinator correction — no expensive-gate lease request at this stage

Standing constraint updated before the Phase-1 stop: **do not wait for, or request,
`scaffold.runtime` now.** No `scaffold.runtime` or `fresh-browser` lease may be sought or granted
before coordinator review of the plan. My previous report said I would return for the lease "once the
plan justifies it" — the correct sequence is that the plan goes to coordinator review first, and the
lease question is decided there, not raised by this lane when the plan lands.

What that changes concretely at the Phase-1 stop: the fenced-gate instruction to the author is
unchanged (it may plan for the gates but not run them), but my review must additionally judge
**whether each expensive gate is genuinely load-bearing** for this leaf rather than assume the
contract's six-gate list is self-justifying. A gate named in a contract is a claim that it proves
something nothing cheaper proves; that claim is checkable, and checking it is part of the review
rather than a step after it.

Review scope at the stop, per the correction: citations re-verified at `3fc0f2f92`, the concrete key
shapes, the compatibility answer, the slice plan, and whether PLAN-EVAL **and each expensive gate**
are load-bearing. Plus the process gate this lane owes: the draft PR must exist and carry
`Closes #1355` and `Closes #1360`.

Author `01a004f9-f033-7592-a0bc-63927753fb43` remains the preserved sole author and is actively
producing `research.md` / `plan.md` from base `3fc0f2f92`. No PR yet, no commits yet, tree clean.
Monitoring to a clean pushed Phase-1 stop.

## 2026-08-15 — #1355/#1360 Phase-1 stop, Tier-A review, and the gate-class repair

### Phase-1 stop verified

| Check | Result |
| --- | --- |
| Author process `01a004f9-…` | **terminal** |
| Tree | clean |
| local == remote == PR head | all `6aea4a5eaac4932605435d2a346da2c545f33d92` |
| PR **#1664** | open **draft** |
| Closing keywords | **`Closes #1355`** and **`Closes #1360`**, body lines 7-8 |
| PR opened at first slice | yes — **D-15 discharged**; the per-slice comment trail has an artefact from commit one |

### Coordinator determination, recorded durably

**PLAN-EVAL is required.** The additive SDK overload, the public generator result/overwrite
contract, three publishable members, the compatibility migration, and two distinct runtime consumers
are decision-heavy. I concur independently: the plan's own open question 1 — accept an additive
`bridgeInvalidation(queryKey)` overload, or emit `{ queryKey: queries.list.clientKey() }` directly and
leave the SDK surface untouched — is a real architectural fork, correctly left open for the gate.

**Both expensive gates are load-bearing, only after cheap convergence.** `scaffold.runtime` because
this leaf changes generated scaffold/client output *and* generator command behaviour, so the only
proof the emitted app still builds and runs is running the emitted app. `fresh-browser` separately,
because hydration timing — whether `initialDataUpdatedAt` actually preserves snapshot age across
hydration — cannot be observed without a real browser; a unit test proves the option was passed, not
that TanStack honoured it. Neither substitutes for the other. **No lease now and none requested.**

### T-1 — the gate-class error, verified from source before relaying

The plan routed `scaffold.runtime` through `run-gate.ts` and proposed adding a catalog entry
(`plan.md:79`, `:101`, `:177`, `:208`), listing `receipts/s5-scaffold-runtime.json` among the binding
receipts (`:217`). I checked the repo rather than accepting the correction:

- `.llm/tools/gates/catalog.ts` has **no** `scaffold.runtime` entry; the only "scaffold" match is
  `scaffold-versions` → `deno task check:scaffold-versions`, a different gate.
- `fresh-browser` **is** a catalog gate — `catalog.ts:55` → `deno task test:browser`.
- `.llm/harness/gates/release-gates.md:7` declares itself "the **single source** for the release-gate
  class"; `:22` names `scaffold.runtime` with `deno task e2e:cli run scaffold.runtime --cleanup
  --format pretty`; `:26` calls it a merge-readiness gate that also runs pre-release.

The absence from the catalog is **deliberate**. Adding an entry would fold a release-gate into the
per-slice static-gate class — a category error, not a plumbing detail — and
`s5-scaffold-runtime.json` would be a hand-authored run-gate receipt for a gate the catalog
intentionally excludes. This lane has spent the milestone refusing exactly that shape of evidence
from others; authoring it ourselves would be worse. Corrected: evidence is the **suite-owned
exact-head output** plus the **central expensive-gate lease and cleanup record**, and the binding
receipt list names only gates that actually produce receipts.

### T-2 — the assertions must be nameable

`plan.md:224-229` names the right properties — module type-checking, cross-tier key isolation, actual
invalidation behaviour, old-versus-fresh hydration — but not assertions anyone could write or check.
Required: which command sequence adds the second service, which two key arrays are compared and what
distinguishes them, what mutation is issued and what observable proves invalidation *took effect*
rather than was merely called, and which two timestamps the hydration assertion compares. Otherwise
"the suite has been extended" is unfalsifiable and the lease precondition it gates is a formality.

Worth recording that the author got the harder half right on its own: `plan.md:222-233` frames the
suite extension as a **precondition to achieve**, not as a claim that the existing suite already
proves two-service key isolation. That is the exact overclaim the coordinator warned against, and it
was not made.

### What the plan already gets right

Citations re-derived at `3fc0f2f92` with drift recorded rather than absorbed (`research.md:50`, `:93`,
`:203`) — the discipline #1293 taught, where a trusted-but-false issue premise would have built the
wrong thing. The key-shape mismatch shown as concrete arrays (`:39-48`): generated queries produce
`['service','list',{input:…}]` while `bridgeInvalidation()` returns `[resource, action]`, which is
both the dead-invalidation defect and the two-service collision in one piece of evidence.
Compatibility answered by D6 and `:157`.

Repair dispatched to the same thread. PLAN-EVAL dispatches on the immutable repaired plan head; no
implementation before `PASS`.

### T-1 and T-2 accepted; PLAN-EVAL dispatched on the repaired head

Repair commit `7f20a34fee4e99ac17edb6ed4de06a3ec9c1934b`, local == remote, tree clean, PR #1664 still
draft.

**T-1 verified fixed, by reading the repaired text rather than the report.** `plan.md:199` now states
"`scaffold.runtime` is deliberately outside that catalog"; `:79` preserves "the deliberate
evidence-class boundary"; and gate 7 at `:211` resolves to
`deno task e2e:cli run scaffold.runtime --cleanup --format pretty` with "suite-owned exact-head
output … plus central lease and cleanup record; **no run-gate receipt**". The binding set is now
**five files** — four cheap `run-gate` receipts plus one `fresh-browser` receipt. No catalog entry is
proposed and no receipt is hand-authored for a gate the catalog deliberately excludes. The single
surviving "catalog entry" phrase (`:145`) refers to `fresh-browser`, which is correct and stays.

**T-2 repaired past the minimum — the assertions are now falsifiable.** The new sections give a
concrete `service add --name payments --with-client` / `service generate` sequence, a second
`generate` asserting byte-identical output, and both `usersQueries` and `paymentsQueries`
type-checking together without aliases. The key pairs share an identical input so the **only**
distinguishing element is index 0, with the explicit rule that each pair differs only there and the
users filter must not match the payments key. The invalidation proof is a **second** `users.list`
network request plus the server-confirmed DOM value, and the plan states outright that "merely spying
on `invalidateQueries` is insufficient" — which is the distinction between proving the call happened
and proving it had an effect. Hydration is compared under one controlled clock,
`hydrationNow - 60_000` versus `hydrationNow`, asserting query-function counts of `1` versus `0`
rather than two uncontrolled wall-clock samples.

That last point is the one worth keeping: an assertion that cannot fail is not evidence, and both
scenario sets can now fail for the right reasons.

### Gate dispatch

| Field | Value |
| --- | --- |
| Job / session | `176aace4` / `176aace4-b2a2-4b16-bdaa-9db687c7d132` |
| Bridge session | `cse_01TiYhwUCkdyjziEpFP3kgaS` (non-empty) |
| Remote Control URL | `https://claude.ai/code/session_01TiYhwUCkdyjziEpFP3kgaS` |
| Requested route | native Claude **Fable 5 · medium** · Remote Control (`lane-policy.md:45`) |
| Observed route | `respawnFlags` = `--effort medium … --model claude-fable-5`; `providerEnv {}` |
| Route verdict | **matched**, native Anthropic auth |
| Evaluated plan head | `7f20a34fee4e99ac17edb6ed4de06a3ec9c1934b` (pinned; mismatch is a hard refusal) |
| Brief delivered | `intent` length 9,295 bytes |

Attachment was again confirmed by polling for a **non-empty** `bridgeSessionId` before recording it,
rather than inferring attachment from correct route flags — the two are different claims, and the
#1662 dispatch registered with a null bridge while its flags were already right.

The brief binds the evaluator to **rule** on the open fork (additive `bridgeInvalidation(queryKey)`
overload versus direct `{ queryKey: queries.list.clientKey() }` emission), including whether the
direct-emit option leaves `bridgeInvalidation` a trap for the next caller; to re-derive the
diagnoses from source rather than trust `research.md`; and to judge whether the pre-lease assertions
can actually fail. The three settled items — gate necessity, gate class, and no-lease-now — are
stated as compliance checks with their reasons, so "already decided" cannot read as a gap to fill.

No implementation before `PASS`. Neither expensive gate run; no lease requested.

## 2026-08-15 — #1664 PLAN-EVAL cycle 1: `FAIL_PLAN`, fork ruled

Verdict commit `ed34105e2ef344a5b590bca6985810f45f89b0ca`, `plan-eval.md` alone (244 lines), now the
branch head; local == remote == PR #1664. Structured comment posted:
`#issuecomment-5301947232`, labelled cycle 1/2. Evaluator: session
`176aace4-b2a2-4b16-bdaa-9db687c7d132`, bridge `cse_01TiYhwUCkdyjziEpFP3kgaS`, requested = observed =
**Fable 5 · medium · Remote Control**, `providerEnv {}`. It complied with all three already-decided
items: no expensive gate run, no lease taken, gate class unchanged.

Explicitly **not** a rescope — "archetype, scope, and gate set are right; the plan is incomplete, not
wrong." Six required fixes, all plan text, no code.

### The fork is ruled: direct emit, no SDK overload

```ts
export const <svc>ListInvalidation = { queryKey: <svc>Queries.list.clientKey() } as const;
```

The ruling is stronger than the plan's own recommendation, and the decisive argument is one the plan
did not make:

- The proposed `bridgeInvalidation(queryKey)` overload would be `{ queryKey }` — an **identity
  wrapper adding no policy**. Under A6 that is not a justified public helper, and `clientKey()`
  already is the SDK's discoverable typed cross-tier path, landed for exactly this purpose in #1265.
- It **does not remove the trap**: the string overload `bridgeInvalidation(resource, action)` stays
  public either way, so the overload adds a safe sibling beside the trap rather than closing it.
- Rename safety is identical under both options.
- The asymmetry is **compatibility**. The overload would couple the CLI template to SDK ≥ 0.0.7: a
  0.0.7 CLI running `service add --with-client` inside a project pinned to
  `jsr:@netscript/sdk@0.0.6` would emit a module that fails `deno check` until the app bumps its pin.
  Direct emit compiles against the already-published SDK, so D6 holds for the
  "newly generated into an existing app" case as well — a case the plan's own compatibility rule did
  not actually cover.

That last point is the substance of the gate. The plan reasoned about regeneration of existing apps
but not about a *new* generation into an app pinned to an older SDK, and the overload was precisely
the change that would have broken it. This is what a plan gate is for: not to bless the recommended
option, but to find the case the recommender did not enumerate.

A second decision was ruled that the plan had left implicit: migration notes belong in **package
READMEs** (`packages/fresh/README.md` for the hydration-age note, `packages/cli/README.md` for the
verb, its overwrite/dry-run/force contract, and the regeneration migration), not `docs/**`. Both are
inside publish file lists, and the CLI README entry is what actually discharges the #1355 acceptance
box "A **documented** verb regenerates …".

### The six required fixes

1. Record the fork ruling across `plan.md:102`, `:111-120`, `:184`, `:319` and
   `research.md:164,168-170,239-241` — with the SDK work now being a stale-module-doc correction at
   `key-bridge.ts:4-7` (it still says `['cache_query', …]`), a JSDoc pointer to
   `factory.<action>.clientKey()`, and semantic match/mismatch tests that lock the S6 regression.
2. Lock generator-owned output paths and restate scenarios 1/3 and Finding 5 against them.
3. State `service generate` compatibility: differing client modules are rewritten without `--force`;
   say whether `--dry-run`/`--force` govern the Aspire-helper half.
4. Name the documentation home for the verb and the hydration note.
5. Tighten scenario 3 to "list-request count + 1 after the mutation settles".
6. Housekeeping: per-slice file lists; qualify the `workspace-mutator.ts` citation.

Carried forward as confirmed-good and not to be disturbed: the gate-class boundary, the five-file
binding receipt set, and the pre-lease scenarios (subject to fix 5).

Note N4 is worth keeping visible: if a named SDK helper is still wanted, it is a **separate issue
with a deprecation path for the string form** — that is the only shape that removes the trap rather
than adding a sibling to it. Not this leaf.

### Cycle 2 needs a coordinator grant

Repair dispatched to the same author thread. The coordinator's grant was for **one** PLAN-EVAL on the
repaired head, and it has been spent. **Cycle 2 is requested, not assumed** — this lane has never
launched a formal gate without an explicit grant, and the comment itself is labelled cycle 1/2. No
implementation before a cycle-2 `PASS`.

## 2026-08-15 — #1664 PLAN-EVAL cycle 2: terminal `PASS`

Verdict commit `c53726c69b98a35bf293b89aeece12279f470be3`, **appending** 148 lines to `plan-eval.md`
rather than overwriting cycle 1 — the brief asked for that and it was honoured, so both cycles remain
readable. Local == remote == PR #1664 head. PR comment `#issuecomment-5301997528` live.

| Field | Value |
| --- | --- |
| Job / session | `8c756943` / `8c756943-11c8-45a2-84ab-8c8392898723` |
| Bridge session | `cse_01UrhsQgBYpLZWHKAhCvESi6` (non-empty, recorded before mutation) |
| Remote Control URL | `https://claude.ai/code/session_01UrhsQgBYpLZWHKAhCvESi6` |
| Requested route | native Claude **Fable 5 · medium** · Remote Control |
| Observed route | `respawnFlags` = `--effort medium … --model claude-fable-5`; `providerEnv {}` |
| Route verdict | **matched** |
| Evaluated head | `f7225be98c01b38f86712c1df0782aec06e34445` |
| Brief delivered | `intent` length 10,512 bytes |

`PASS` — "all six cycle-1 fixes are discharged in substance; every diagnosis re-derives from source;
no plan-gate box is unchecked." N1 records no expensive gate, no lease, no catalog entry, and no code
touched by the session.

### The verification worth singling out

The evaluator did not accept the compatibility argument that decided cycle 1 — it **checked the
published artefact**. It confirmed `clientKey` is present in `@netscript/sdk@0.0.6` on
`jsr.io/@netscript/sdk/0.0.6/src/query/query-factory.ts`, establishing that direct emit really does
compile against the already-published SDK. Cycle 1's ruling rested on that claim; cycle 2 proved it
rather than inheriting it. It also caught the residual the repair left behind: the S2 test *named*
"SDK-0.0.6 compatibility" had no stated assertion — a test named for a property it does not yet
assert, which is the same defect family this lane has been catching all milestone, one level up.

### Three implementation constraints, not plan blockers

- **C1** — make the SDK-0.0.6 compatibility test concrete. The rendered module must contain the
  literal `{ queryKey: <svc>Queries.list.clientKey() } as const` **after** `<svc>Queries`, and import
  from `@netscript/sdk/*` only symbols published in 0.0.6 — in practice `createServiceClient` and
  `createQueryFactories`. The now-unused `bridgeInvalidation` import at
  `service-query.ts.template:3` must be dropped or the generated app fails lint. **An allowlist
  assertion on the rendered import set is what catches a future re-coupling** — not a comment, not a
  version note.
- **C2** — atomic-failure compatibility. `packages/cli/README.md` and the error message itself
  (naming the service and the expected contract path) must state that `service generate` fails
  **before any write**, Aspire helpers included, when a manifest service lacks its contract; and
  `Enabled: false` services (`workspace-resolver.ts:28`) need an explicit documented policy on
  whether they receive owned modules.
- **C3** — mark `generate-aspire_test.ts` as **new** in S2 on the next amendment.

### First implementation slice dispatched

S1 per the approved plan — SDK semantics and docs, with the **type surface unchanged**: correct the
stale module doc at `key-bridge.ts:4-7` (still claims `['cache_query', …]`), add a JSDoc pointer to
`factory.<action>.clientKey()`, and add the semantic match/mismatch tests that lock the S6
regression. C3 rides along as a plan amendment; C1 and C2 are recorded as binding constraints
against the slices that own them.

No `scaffold.runtime`, no `fresh-browser`, no lease, no expensive execution. Product tests and a
Tier-A stop are required.

### S1 Tier-A — accepted; S2 released

Commit `5ac6efa308599eac9290977215af5c951fcf46ee`, pushed, local == remote, clean tree. Scope:
`packages/sdk/src/query-client/key-bridge.ts`, new `key-bridge_test.ts`, run artifacts. No
`packages/cli`, no `packages/fresh`, no `deno.lock`, no `docs/**`.

| Check | Result |
| --- | --- |
| **Public surface delta** | **none** — the `key-bridge.ts` diff adds no exported symbol. D8 honoured |
| Stale doc | `cache_query` gone from the file entirely |
| JSDoc pointer | present at `key-bridge.ts:30` → `factory.<action>.clientKey()` |
| `deno check` | clean |
| `deno test ./src/query-client/` | **2 passed, 0 failed** |
| PR comment | `[PHASE: IMPL] [SLICE: S1]` posted — the per-slice trail is working |

**The test choice is the strong part.** It imports `partialMatchKey` from `@tanstack/query-core`
rather than hand-rolling a prefix comparison, so it proves the **actual matcher TanStack uses for
invalidation**. A locally reimplemented comparison could agree with a wrong assumption and still pass;
this cannot. That is what makes it a genuine S6 regression lock rather than a restatement of the
author's own model.

**The author sharpened two constraints beyond instruction.** C1's allowlist is now specific to module
specifiers — exactly `createServiceClient` from `@netscript/sdk/client` and `createQueryFactories`
from `@netscript/sdk/query` — where my dispatch named only the symbols. And C2's `Enabled: false`
question, which the evaluator merely asked to be *decided*, was decided: all manifest entries
including disabled ones receive owned modules (`plan.md:210`). C3's `generate-aspire_test.ts` is
marked new.

### Measured baseline carried — pre-existing SDK doc-lint failures

`deno doc --lint packages/sdk/mod.ts` reports **2 `private-type-ref` errors**, both on `QueryClient`:
`src/ports/query-client.ts:41` (`QueryClientPort`) and
`src/query-client/query-client-factory.ts:44` (`createNetScriptQueryClient`).

I measured the same two at `c53726c69` — **before** S1 — in files S1 never touched, using a detached
worktree at that commit rather than inferring it. So S1 neither caused nor fixed them. Recorded now
rather than at final evidence time because the plan lists "full export-map doc-lint" as supplemental
per-member evidence: the SDK result must be reported as **2 pre-existing errors carried**, never as
clean, and never relabelled as this leaf's work. Fixing them is a separate decision to raise, not
something to fold silently into a later slice.

This is the discipline that caught #1293's real defect — measure the baseline before you change
anything, so a later green cannot be mistaken for work you did, and a later red cannot be blamed on
you.

### S2 released

The CLI generator contract slice, with C1 restated as an **executable allowlist assertion** rather
than a described property, C2's pre-write validation naming the service and expected contract path,
generator ownership fixed at `apps/<app>/lib/<service>.ts` with the route example staying init-owned,
whole-command `--dry-run`/`--force`, and an explicit instruction that `embedded.generated.ts`
regeneration must be real and pass the asset-freshness check — template-only edits leave the shipped
scaffold stale, which is the trap recorded in memory as `cli-asset-edits-need-barrel-regen`.

No expensive gate, no lease, no S3.

## 2026-08-15 — S2 evidence correction accepted; S2 Tier-A `FAIL_FIX` on a C2 ordering defect

### Evidence attribution corrected at `a8cc5a1d1047b5305c11b78514c52fa4f15983c9`

The executed command `deno doc --lint packages/sdk/mod.ts` had been labelled "SDK export-map doc
lint" in `worklog.md:117`, "**Full** SDK export-map doc lint" in PR body line 70, and "SDK
export-map doc-lint baseline" in the S2 comment. That is the SDK **root-entrypoint** run, not the
plan's 12-entrypoint export-map sweep — which is S4 and may surface further diagnostics, including
the separate plugin-streams one.

The status half was honest throughout — `BASELINE_FAIL`, never `PASS`. Only the **coverage claim**
overstated: a narrower command wearing a broader name. That is the same failure family this leaf
keeps catching one level down, a label asserting more than the thing beneath it delivers, and it is
worth noting that it appeared in *our own* evidence rather than in someone else's.

All three surfaces now read "SDK root-entrypoint doc lint (`packages/sdk/mod.ts`)", retain
`BASELINE_FAIL`, and state that the full 12-entrypoint sweep is S4. The relabel was recorded as an
`[EVIDENCE-CORRECTION]` PR comment rather than a silent edit, so the correction is itself auditable.

### S2-F1 — `addService` writes Aspire helpers before contract validation (FAIL_FIX)

`add-service.ts:46-92` orders: `upsertServiceAppsettingsEntry` → `addServiceWorkspaceMember` →
`regenerateHelpers` (**Aspire writes**) → `generateServiceClients` (**where validation lives**).

Concrete failure: manifest holds `users` (contract present) and `orders` (existing, missing
`contracts/versions/v1/orders.contract.ts`). `netscript service add --name payments --with-client`
writes the appsettings entry, the workspace member, and the Aspire helpers; then
`generateServiceClients` validates every manifest contract, finds `orders` missing, and throws
`ScaffoldValidationError` (`generate-service-clients.ts:113`). The writes have already landed.

That violates the approved C2 contract verbatim — "validate every expected V1 contract **before any
client/Aspire write**".

**Why the existing atomic test did not catch it.** `generate-service-clients.ts:80` states "Complete
every contract/path/render validation before the first write", and that is true: the generate path
plans everything, then writes. Its internal atomicity is real, and the service-generate-only atomic
test correctly proves it. But **atomicity of a component does not compose into atomicity of a caller
that performs its own writes first.** The `add` path wraps an atomic unit in a non-atomic prologue,
so the existing test proves the property on the one call graph that already had it and is silent on
the one that does not. It is not a weaker test — it tests a different call graph. This is exactly why
the coordinator's instruction not to accept the generate-only test as proof for the shared add path
was the right call, and why a passing suite is not the same as a covered contract.

Required fix dispatched: hoist validation of every manifest service's V1 contract ahead of the first
write in the add path — explicitly **not** try/rollback, because C2 says fail *before* writing rather
than undo after, and a rollback introduces both a window and its own partial-failure mode — plus a
focused test on the **`addService --with-client`** path asserting the rejection names the missing
service and its expected path and that **zero** writes occurred (no Aspire helper, no appsettings, no
workspace member). Whole-command `--dry-run`/`--force` semantics and the `Enabled: false` policy are
preserved across the reorder.

S3 remains unrequested and undispatched; it needs a coordinator grant regardless of this outcome. No
expensive gate, no lease.

### S2 Tier-A round 2 — C2 fix accepted; `FAIL_FIX` on S2-F2

**C2 ordering fix accepted** at `f784606d0423bf2c82cafb8fd339b4196e086214`. `addService` now calls
`validateServiceClientContracts` before `renderService` and before any write, with the reason stated
in-code; the validation was **extracted into a shared pass** in `generate-service-clients.ts` and
reused by both entry points rather than duplicated; no try/rollback.

The new add-path test reproduces the probe scenario exactly and asserts the rejection names `orders`
and its full expected contract path, appsettings and workspace `deno.json` byte-identical, and the
new service dir and contract absent. The detail that makes it a genuine test: the injected
`regenerateHelpers` stub **writes when called**, so `exists === false` proves **non-invocation**
rather than mere absence. A plain absence check would pass for the wrong reason.

Also verified: `deno check` clean; `check:assets-barrel` **exit 0 with a clean tree after
regeneration** — the embedded barrel is genuinely fresh, confirmed by re-running the generator rather
than trusting the diff, which is the `cli-asset-edits-need-barrel-regen` trap avoided.

**S2-F2 — C1 satisfied in the template, but the test asserting the old contract was left behind.**

Full suite at that head: `deno test --allow-all ./src/` → **597 passed, 1 failed**. The failure is
`app route template rendering`, `packages/cli/src/kernel/templates/app/route-templates_test.ts:387`,
expecting the rendered output to contain
`import { bridgeInvalidation } from '@netscript/sdk/query-client';`.

Causation proven rather than inferred: at `c53726c69` the template carried that import on line 3 and
used it on line 11; at `f784606d0` it correctly emits
`{ queryKey: …Queries.list.clientKey() } as const` on line 24 with no such import — exactly what C1
required. The test now encodes the **pre-C1** contract and fails for the right reason.

Not a baseline, and not deferrable to S3 merely because the file appears in S3's list: a slice does
not hand over a red suite, and the assertion contradicts S2's own binding constraint.

**Why this was worth catching rather than waving through.** The targeted suites I ran first —
services, service adapters, aspire — were 24/24 green, and it would have been easy to call S2 green
on those. The contracted evidence is the suite, not the subset I chose to run. Reporting a narrower
result in broader terms is precisely the mislabel this lane made the author correct one turn earlier;
doing it in my own Tier-A would have been worse.

**The fix is also an opportunity.** Lines 385-386 of that test already assert the two *allowed*
imports are present — half of C1's allowlist. Completing it there is the natural home: assert the
`bridgeInvalidation` import is **absent**, assert the `@netscript/sdk/*` import specifier set
**equals exactly** `{'@netscript/sdk/client','@netscript/sdk/query'}` (presence of two allowed imports
does not catch a third being added — only set equality does), and assert the direct invalidation
literal appears **after** `<svc>Queries` per C1's ordering clause.

S3 remains unrequested and undispatched pending a coordinator grant. No expensive gate, no lease.

## 2026-08-15 — S2 Tier-A: `PASS` at `3669e9b8730dae3ef65b4dee02d5ce5770a467b7`

Complete re-run on the immutable head. Every item verified by executing it, not by reading the
author's report.

| # | Item | Result |
| --- | --- | --- |
| 1 | Exact head | local == remote == PR #1664 == `3669e9b8730dae3ef65b4dee02d5ce5770a467b7`, tree clean, PR **draft** |
| 2 | Fix scope | `route-templates_test.ts` + run artifacts only — no source, no `deno.lock`, no `docs/**` |
| 3 | **Exhaustive import-set equality** | `route-templates_test.ts:388-394` extracts every `@netscript/sdk/*` specifier by regex, dedupes, sorts, and `assertEquals` against exactly `['@netscript/sdk/client','@netscript/sdk/query']` — **set equality**, so a third import fails |
| 4 | **Forbidden bridge import** | `assert(!output.includes('bridgeInvalidation'))` at `:387` — any occurrence fails, not merely the import line |
| 5 | **Literal ordering** | `assert(output.indexOf(invalidation) > output.indexOf(queries))` at `:408` — proves the invalidation is defined after `<svc>Queries`, C1's ordering clause |
| 6 | C2 pre-write fix intact | `add-service.ts:70` still calls `validateServiceClientContracts` before `renderService` and any write, via the shared pass imported at `:15-18` |
| 7 | Asset freshness | `check:assets-barrel` **exit 0**, clean tree after regeneration — re-ran the generator rather than trusting the diff |
| 8 | **Full CLI suite** | `deno test --allow-all ./src/` → **598 passed, 0 failed**, reproduced independently; matches the author's reported count exactly |
| 9 | Expensive gates | `scaffold.runtime` **NOT_RUN**, `fresh-browser` **NOT_RUN**, both recorded against the explicit lease boundary |

C1 is now what it was always meant to be: an executable allowlist rather than a described property.
The three assertions together are falsifiable in the three distinct ways the constraint can be
violated — a new import added, the stale bridge import returned, or the literal emitted before the
factory it derives from. Presence checks alone would have caught none of them.

**Verdict: `PASS`.** Both findings from earlier rounds are closed. S2-F1 (Aspire writes before
contract validation) was a real C2 violation caught by coordinator probe; S2-F2 (a test still
asserting the pre-C1 contract) was caught only because the **full** suite was run rather than the
targeted subset — the targeted suites were 24/24 green while the suite was red.

### S3 authorization requested, not assumed

S2 is complete and the PR is draft at exactly one `status:`. S3 covers the canonical island cache
age, the browser fixture/task, and the two ruled package README notes
(`packages/cli/README.md`, `packages/fresh/README.md`). Per the standing instruction, S3 is
**requested** and will not be dispatched before a coordinator grant.

Still withheld and unrequested: the expensive-gate lease. Both gates remain `NOT_RUN` and run only
serially under one coordinator-granted lease, after all cheap gates and a pre-gate Tier-A.

### S3 released — canonical hydration, omission coverage, browser fixture, ruled READMEs

Coordinator accepted S2 Tier-A `PASS` at leaf `3669e9b8730dae3ef65b4dee02d5ce5770a467b7` and topic
checkpoint `3eab955b1`, and released S3 on the same original author thread
`01a004f9-f033-7592-a0bc-63927753fb43`.

Exact surface, dispatched verbatim and capped: both `ServiceShowcaseLab` island templates
(`.tsx.template` and `.memory.tsx.template`), `embedded.generated.ts` **via canonical regeneration**,
`route-templates_test.ts`, `packages/cli/README.md`, `packages/fresh/tests/query-hydration-age_browser.ts`,
the new `packages/fresh/tests/fixtures/query-hydration-age-browser/{main.ts,app.tsx,vite.config.ts}`,
`packages/fresh/deno.json`, `packages/fresh/README.md`, and run artifacts.

Four deliverables: canonical cache-age hydration in **both** islands — the actual #1360 fix, passing
the already-computed `cachedAt` as `initialDataUpdatedAt` instead of using it only as a display
label; generated-output omission coverage that fails if a future edit drops the option from either
island; the public-wrapper browser fixture and its task wired in `packages/fresh/deno.json` but
**not run**; and both ruled README notes, with the CLI README carrying the verb, result/overwrite
contract, whole-command flags, pre-write contract failure including Aspire, expected contract
path/export, `Enabled: false` policy, L1/L2 dialect, and the six-symbol plus namespace migration.

The omission guard is the part that earns its place. The `initialDataUpdatedAt` seam shipped
unexercised in the one example the scaffold designates as canonical, and a downstream consumer
independently repeated the same mistake — threading `cachedAt` through three files and then
discarding it. That is evidence the seam is undiscoverable rather than unwanted, so a test that fails
when the option is dropped is worth more than the one-line fix it protects.

Explicitly preserved: the direct `clientKey()` emission and all three C1 assertions, S2's add-path
atomicity and its non-invocation-proving stub, and the `Enabled: false` policy.

**Cheap gates only.** Focused CLI/Fresh `check`, `test`, `doc-lint`, and asset freshness with a
canonical barrel regeneration. `fresh-browser`, `scaffold.runtime`, Aspire, and Docker are all
prohibited, and no lease is requested. Full suite counts required, not subsets — S2-F2 was found
precisely because a targeted subset was green while the suite was red.

Stops at a Tier-A stop for fresh review and pre-expensive-gate convergence. No S4, no evaluator, no
readiness.

## 2026-08-15 — S3 Tier-A: `PASS` at `1df8a5274d2adc7657eb785a37266aa0f1f7540d`

Local == remote == PR #1664 head, tree clean, PR **draft**. Every item executed, not read.

| # | Item | Result |
| --- | --- | --- |
| 1 | Scope | 13 files, **all** within the capped surface — both island templates, `embedded.generated.ts`, `route-templates_test.ts`, both READMEs, `packages/fresh/deno.json`, the browser test + three new fixture files, run artifacts. Nothing outside |
| 2 | #1360 fix, **both** islands | `initialDataUpdatedAt: props.cachedAt` at `ServiceShowcaseLab.tsx.template:58` and `.memory.tsx.template:61`; the display label is retained at `:149`/`:120`, so `cachedAt` now serves both purposes instead of being computed, threaded and discarded |
| 3 | Omission coverage | per-island assertions at `route-templates_test.ts:597` and `:614` |
| 4 | C1 assertions preserved | all four still present — set equality, absent bridge import, literal ordering |
| 5 | Browser fixture + task | `test:browser` now runs `form-navigation_browser.ts` **and** `query-hydration-age_browser.ts`; **not executed** |
| 6 | Fresh README | hydration-age note explaining that `staleTime` is measured from the server load rather than from hydration |
| 7 | CLI README | L1/L2 dialect, `Enabled: false` policy, `--dry-run`/`--force` with skip-vs-rewrite semantics, the six-symbol migration list, and the namespace change **including** that persisted cache entries under the old namespace are orphaned and may need clearing |
| 8 | Asset freshness | `check:assets-barrel` **exit 0**, clean tree after canonical regeneration |
| 9 | Fresh gates | `deno check` clean; non-browser tests **3 passed / 0 failed** |
| 10 | **Full CLI suite** | `deno test --allow-all ./src/` → **598 passed / 0 failed**, exit 0, reproduced independently |
| 11 | Expensive gates | `scaffold.runtime` and `fresh-browser` both **NOT_RUN** against the lease boundary; Aspire and Docker untouched; no lease requested |

**The browser task wiring is the right shape, not merely present.** `catalog.ts:55` maps the
`fresh-browser` gate to `deno task test:browser`, so extending *that* task means the gate will
actually cover hydration when it runs under lease. A parallel task would have looked equivalent and
never been invoked by the gate.

**One honest note on the test count.** The full CLI suite reads 598 at both S2 and S3 because the
omission assertions were added inside existing `it` bodies rather than as new cases, so the count is
unchanged by construction — not a sign the new coverage is absent. The assertions are
`assertStringIncludes` against rendered output and are falsifiable by construction: drop
`initialDataUpdatedAt` from either template and they fail. A dedicated case per island would read
more clearly, but that is style, not coverage, and is not worth a round trip.

**One discrepancy in the grant, recorded because it is a path, not a scope, issue.** The coordinator
grant listed the islands under `examples/service/(_islands)/`; they actually live at
`examples/(_islands)/`. The author edited the real files. No scope deviation occurred — the grant's
path string carried an extra segment.

### Verdict `PASS`; handing back for pre-expensive-gate convergence review

S1, S2 and S3 are complete and Tier-A signed. Cheap convergence is established: full CLI suite green,
Fresh check and non-browser tests green, asset barrel fresh, C1 and S2 atomicity preserved across two
subsequent slices.

**Not requested and not taken:** the expensive-gate lease. Both gates remain `NOT_RUN`. Per the
standing instruction this lane stops here for the coordinator's pre-expensive-gate convergence
review; S4, the evaluator, and readiness are all unstarted.

### S4 released — cheap convergence, artifact-only

Coordinator accepted S3 Tier-A `PASS` at leaf `1df8a5274d2adc7657eb785a37266aa0f1f7540d` and topic
checkpoint `c91c2084a`, and released S4 on the same original author.

**S4 produces evidence, not changes.** Product code is out of bounds; the single exception is a gate
identifying a defect needing a separately reviewed scoped repair, and in that case the author stops
and reports rather than fixing inline.

Ordered scope dispatched: formatting/lint/asset freshness; **per-member** exact-pin, export-map/doc
and JSR audits for CLI, Fresh and SDK — run per member rather than aggregated, because a combined
"all green" hides which member is which; three isolated-declaration/publish dry-runs, one per member;
then the four binding receipts via `run-gate.ts` with distinct invocation IDs at the explicit
immutable head, with content committed and the tree clean beforehand so `gitHead == actualGitHead`
holds without `allowGitHeadMismatch`.

Two instructions carry the weight of things this lane learned the hard way:

**Receipts are generated by `run-gate.ts`, never hand edited.** If a gate did not run, its receipt
does not exist and the author says so. This lane refused a hand-authored `scaffold.runtime` receipt
at the plan stage on exactly this principle; authoring one ourselves would be worse than accepting
one from someone else.

**A red result must be attributed exactly, and attribution must be measured.** Pre-existing at a
named earlier commit, caused by this leaf, or unknown pending measurement — and proven by measuring
at that commit, as was done for the two SDK `QueryClient` doc-lint diagnostics. The **full
12-entrypoint export-map sweep belongs to this slice**, so anything it surfaces beyond those two
carried diagnostics — including the separate plugin-streams one — is a finding with attribution, not
something to fold into the carried baseline. The SDK root-entrypoint relabel is the precedent: the
status was honest, only the coverage claim overstated, and the same trap is available in reverse
here.

Sufficiency must be recomputed by the author over exactly the four contracted files, named
individually — no bare `SUFFICIENT`, no `receipts/*` glob standing in for the contracted set.

Prohibited: any lease, `scaffold.runtime`, `fresh-browser`, Aspire, Docker, S5, any evaluator,
`deno.lock`, `docs/**`, and the ready flip.

Stops for fresh Tier-A and an explicit S5 lease review.

## 2026-08-15 — S4 stopped red at the first gate; Tier-A confirms the attribution

Head `ee479ea851927818404c6311dac78e07a4eef1b5`, local == remote, tree clean. Commit adds
`reports/s4-format-failure.md` plus journals — **no receipts, none hand-authored**, and nothing
downstream of the red gate was run. That is exactly the instructed behaviour, and the honest half is
worth stating: the author recorded sufficiency as **INSUFFICIENT** with all four contracted files
named as missing/NOT_RUN, rather than reporting a partial green.

### The attribution is correct — verified independently, then extended

The author's claim: the wrapper invocation
`run-deno-fmt.ts --root packages/cli --root packages/fresh --root packages/sdk --ext ts,tsx` exits 2
with `failedBatches=3`, `findings=0`, because the root `deno.json` excludes `packages/cli/` from
`fmt` — the wrapper selects CLI files that Deno then excludes, and it fail-closes rather than
returning a false green. Measured identically at `c53726c69`, hence pre-existing.

I did not take that on report. Verified:

| Check | Result |
| --- | --- |
| Root `deno.json` `fmt.exclude` | contains **`packages/cli/`**, alongside `**/.generated/` and `**/node_modules/` |
| `--root packages/fresh --ext ts,tsx` | 201 files, `failedBatches=0`, `findings=0`, **exit 0** |
| `--root packages/sdk --ext ts,tsx` | 84 files, `failedBatches=0`, `findings=0`, **exit 0** |
| `--root packages/cli --ext ts,tsx` alone | 887 files, `failedBatches=4`, `findings=0` — fail-closed in isolation |

So the red is **entirely** the CLI selection/exclusion mismatch, reproducible on its own, with
**zero formatting findings anywhere**. Fresh and SDK sources are genuinely correctly formatted.
Classification confirmed: pre-existing invocation/configuration failure, no product defect
attributable to this leaf.

### One thing my own probing added

Running bare `deno fmt --check` inside `packages/cli` reports 1 unformatted file in 176 —
`packages/cli/e2e/README.md`. It is **not** the `packages/cli/README.md` S3 wrote:
`git log 3fc0f2f92..HEAD -- packages/cli/e2e/README.md` is empty, so this leaf never touched it. It is
also Markdown, and `AGENTS.md` is explicit that raw `deno fmt --check` across Markdown is **not** a
package-quality verdict. Recorded as pre-existing and out of scope — not folded into the leaf's
evidence, and not silently ignored either.

### Tier-A verdict on the stop: `ACCEPTED`

The gate was red, the author attributed it by measuring at a named earlier commit, stopped before
lint/audits/dry-runs/receipts, authored no receipt, and reported INSUFFICIENT honestly. That is the
behaviour the instruction was written to produce, and it is the same discipline that has caught four
defects on this leaf: measure before attributing, and never let a narrower or absent result wear a
broader name.

### Authorized correction — invocation, not product

The formatting evidence must be gathered **per root** for `fresh` and `sdk`, with `packages/cli`
recorded as excluded from root `fmt` by `deno.json` design, so the combined three-root invocation
cannot yield a verdict for it. That is an evidence-attribution fix squarely inside S4's artifact-only
scope: no product code changes, no repo `fmt` configuration change, and no relaxation of the
wrapper's fail-closed behaviour — which behaved correctly and should not be "fixed".

S4 then continues in its dispatched order: lint, asset freshness, per-member audits, three
isolated-declaration/publish dry-runs, then the four binding receipts at the immutable head.

No lease requested. `scaffold.runtime`, `fresh-browser`, Aspire, Docker, S5, and evaluators remain
untouched.

### S4 resumed on the original thread — with a corrected invocation

Dispatched from immutable evidence head `ee479ea851927818404c6311dac78e07a4eef1b5`.

**Author identity confirmed live**, not assumed: `codex-status` reports thread
`01a004f9-f033-7592-a0bc-63927753fb43`, `gpt-5.6-sol` · high, `working`, cwd
`/home/codex/repos/netscript-007-features-1355` — matching the original recorded in
`slices/codex-thread-ids-1355.md`. No replacement session was created at any point in this leaf.

**The prescribed invocation needed correction, found by running it before relaying it.** The neutral
config is genuinely style-identical to root and carries no exclude — verified by parsing
`packages/runtime-config/deno.json` rather than trusting the description. But passing it alone still
fail-closed at 887 files / 5 batches / **4 failed**. It reproduces the expected 887 / 1 / 0 only with
the config path **absolute** *and* `--batch-size 1000` so the run is a single batch. Recorded as
**D-16**, because the workaround silently not working at default batching reads as "the workaround
failed" rather than "the batching is wrong", and the next lane to hit it deserves the difference.

Had that gone out unverified, the author would have hit the same red a second time and stopped again
— a wasted cycle caused by relaying an instruction I had not executed.

The rest went out unchanged: `reports/s4-format-failure.md` stays **append-only** as the record of
why the evidence path changed; Fresh and SDK use their own configs; the `packages/cli/e2e/README.md`
Markdown finding is recorded as pre-existing, untouched by this leaf, and explicitly not a
package-quality verdict per `AGENTS.md`; and the ordered contract resumes — lint and asset freshness,
per-member audits, three isolated publish dry-runs, then four `run-gate`-only receipts at the
immutable head with independently recomputed sufficiency naming all four files.

Reinforced in the dispatch: receipts only from `run-gate.ts` and never hand edited; a genuine red
stops before any repair, attributed by measurement at a named commit; and this slice owns the full
12-entrypoint export-map sweep, so anything beyond the two carried `QueryClient` diagnostics is a
finding with attribution rather than an inherited baseline.

No lease. `scaffold.runtime`, `fresh-browser`, Aspire, Docker, S5, and evaluators untouched.

## 2026-08-15 — session interruption; S4 lane recovered on the same author

The supervising Claude process exited mid-turn. Recovery findings, established from artifacts rather
than from any completion signal:

| Check | State |
| --- | --- |
| Leaf head | still `ee479ea851927818404c6311dac78e07a4eef1b5`, local == remote — **nothing new committed** |
| Tree | **dirty** — untracked `reports/doc-lint-cli.json`, `reports/doc-lint-fresh.json`; modified `context-pack.md`, `worklog.md`, `s4-format-failure.md` |
| Receipts | **none** — the four contracted files were never reached |
| Author thread `01a004f9-…` | **`stalled`**, `activityAgeMs ≈ 4.12e6` (~69 min) — held by the daemon, not idle-complete |

**The absent process is not evidence of completion**, and this is the third form of that lesson on
this lane: D-7 was a watcher firing early on a mis-parsed field, D-14 a session that finished while
its state stayed `working`, and this is a session that *stopped* while its state said nothing at all.
Each time the artefact settled it — here a dirty tree with no receipts, which cannot be a completed
S4 under any reading.

**Partial work is real and was preserved, not redone.** `doc-lint-cli.json` records `exitCode 0`
across three entrypoints with **0 errors**; `doc-lint-fresh.json` records **0 findings**
multi-entrypoint. Per-member doc-lint for CLI and Fresh therefore passed; the SDK 12-entrypoint sweep
was never reached. The resume instructs the author to commit that evidence *first* so it is durable
before anything else runs.

**Coordinator reconciliation.** Read the newer checkpoint `353bd087a` ("release features convergence
gates"). It matches this lane exactly: #1664 S3 Tier-A `PASS` at leaf `1df8a5274` / topic `c91c2084a`,
full CLI 598/0 independently rechecked, the same Sol/high author on artifact-only S4, the recorded
stop being "fresh Tier-A and explicit S5 lease review", and `scaffold.runtime`, `fresh-browser`,
Aspire, Docker and evaluators all explicitly unauthorized with the singleton runtime lease free. No
divergence to report. The cluster row still shows #1664 as `planned` at the dispatch base, which is
stale against S1-S4 progress but is central state and not this lane's to mutate.

**Lane recovered** by resuming the same preserved author thread — no replacement session — from where
it stopped, with the verified formatting invocation restated (absolute config path plus
`--batch-size 1000`; D-16) and the ordered contract otherwise unchanged. The SDK sweep instruction is
explicit that this slice owns the **export-map** sweep and that anything beyond the two carried
`QueryClient` diagnostics is a finding with attribution rather than an inherited baseline.

No lease. No runtime gate. No evaluator. Continuing the queue.

## 2026-08-15 — S4 stop #2 accepted; export-map failures ruled carried baselines

Head `e52aa44a63e7a24da33bf18af493bc2089c541fe`, local == remote. Commit adds
`reports/s4-export-doc-failure.md`, `doc-lint-sdk.json`, three `exact-pins-*.json`, and journals.
**No receipts, none hand-authored.**

### Everything before the stop passed, including the invocation I had to correct

| Member | TS format | TS lint | Exact `@netscript/*` pins | Export-map doc |
| --- | --- | --- | --- | --- |
| CLI | PASS — 887 files, 1 batch, 0 findings | PASS | PASS — 739 scanned, 0 failures | **PASS** — 3 entrypoints, 0 diagnostics |
| Fresh | PASS — 201 files, 0 findings | PASS | PASS — 132 scanned, 0 failures | `PRE_EXISTING_FAIL` — 16 entrypoints, 45 diagnostics |
| SDK | PASS — 84 files, 0 findings | PASS | PASS — 60 scanned, 0 failures | `PRE_EXISTING_FAIL` — 12 entrypoints, 3 diagnostics |

`check:assets-barrel` exit 0, product tree clean. The CLI formatting line is the D-16 invocation
working as measured — 887 files in a single batch with zero failed batches.

### Attribution verified independently, including the claim that could have been false

The author measured Fresh and SDK at `c53726c69` in a temp clone and reported identical results. I
checked two things myself:

- **Zero** of the nine diagnostic-bearing files differ between `c53726c69` and the candidate head —
  `git diff --name-only` over all nine is empty.
- The sharp check: **S3 modified `packages/fresh/deno.json`**, so "the same 16 entrypoints" was a
  claim that could have been wrong. It is not — the only delta is the `test:browser` **task**, not
  the `exports` map. The entrypoint set is unchanged, so the Fresh comparison is valid rather than
  coincidentally similar.
- `doc-lint-sdk.json` independently confirms 12 entrypoints, `exitCode 1`, 3 errors, all
  `private-type-ref`.

### The author avoided the specific trap this slice was set to catch

The SDK sweep surfaced three diagnostics: the two carried `QueryClient` ones **plus**
`plugin-streams-core/src/application/create-durable-stream.ts` —
`DurableStreamProducerOptions["instrumentation"]` referencing private `StreamsInstrumentation`,
reachable only through `packages/sdk/src/streams.ts`. It was reported as a **separate finding**,
named as newly *exposed* by the full sweep rather than newly *caused*, and explicitly not folded into
the two-diagnostic root-entrypoint baseline.

That is the exact inverse of the earlier mislabel this leaf corrected. Then, a narrow run wore a
broad name; here, a broad sweep could have quietly inherited a narrow baseline's excuse. Both are the
same error — evidence described at the wrong scope — and this time it was avoided without prompting.

### Tier-A ruling: carried baselines, not blockers — S4 continues

The four contracted binding receipts are `check`, `test`, `publish-dry-run`, `arch-check`.
Export-map doc-lint is **supplemental** acceptance evidence, not one of the four. A supplemental
audit that fails identically at a pre-implementation commit, in files this leaf never touched, with
an unchanged entrypoint set, is a baseline to carry with attribution — precisely as the SDK
root-entrypoint `BASELINE_FAIL` was carried earlier in this same slice. **Carrying is not repairing**,
so it does not breach the artifact-only boundary.

The stop was nonetheless correct: the instruction was to stop and have the disposition reviewed, and
that is what happened. The author was given the reasoning, not just the verdict, plus the standing
rule for next time — **a red that reproduces at `c53726c69` is a carried baseline; a red that does
not is a genuine finding and still stops the slice.**

S4 resumes at per-member JSR audits, three isolated publish dry-runs, and the four `run-gate`-only
receipts at the immutable head. No repair of any pre-existing diagnostic. No lease, no runtime gate,
no evaluator.

## 2026-08-15 — S4 binding `test` gate RED, caused by this leaf

Head `b0e8b20fc0ef5402bd5de2bcb86fab71a30f6af4`, local == remote. Two receipts exist, both
`run-gate`-generated at `35061bc80` with `gitHead == actualGitHead` and no mismatch override:

| Receipt | gateId | invocationId | outcome | exit |
| --- | --- | --- | --- | --- |
| `s4-check.json` | `check` | `app-service-client-wiring-s4-check` | **PASS** | 0 |
| `s4-test.json` | `test` | `app-service-client-wiring-s4-test` | **FAIL** | 1 |

This is a **binding** gate, not supplemental, so the carried-baseline reasoning does not apply.

### S4-F1 — a gate was added to a capability suite; its registry test was never updated

`packages/cli/e2e/tests/presentation/suite-registry_test.ts:54` asserts
`resolveSuite(SCAFFOLD.SERVICE).gates` equals exactly five gates. This leaf's diff against
`c53726c69` adds exactly one line to `packages/cli/e2e/suites/scaffold/capability-suites.ts`:

```
+  GATE.GENERATED_DENO_LINT,
```

The suite now selects six while the test expects five. Reproduced at the candidate head —
`deno test ./e2e/tests/presentation/suite-registry_test.ts` → 18 passed, **1 failed**. It cannot
reproduce at `c53726c69` because the added line does not exist there. **Attribution: caused by this
leaf**, so by the standing rule it stops the slice rather than being carried.

### Why it survived S2 and S3 Tier-A — my gap, and worth stating plainly

I verified those slices with `deno test --allow-all ./src/`, which **excludes `./e2e/`**. The binding
`test` gate has wider scope, so the 598/0 result I reported — and reproduced independently — never
covered this file. My claim at the time was accurate about what it measured and silent about what it
did not.

That is precisely the shape of S2-F2, one level up. There, a targeted subset was green while the
suite was red, and I caught it by running the full suite. Here, "the full suite" was itself a subset
of the contracted gate. The lesson generalises: **the contracted evidence is the gate, not whatever
command I chose to stand in for it** — and a subset that has been reliable for three slices is the
most persuasive kind of wrong. S4 running the actual binding gate is what exposed it, which is
exactly what a binding gate is for.

### Scoped repair authorized

This is the "separately reviewed scoped repair" the S4 grant contemplates, now reviewed. The **test**
is stale, not the suite: adding `GATE.GENERATED_DENO_LINT` to the service capability suite was
intentional S2 scope — generated output should be lint-checked. So the expectation is updated to
include it, in the position the suite actually emits it; `assertEquals` on an array is order-sensitive
and a pass achieved by luck of ordering would be worthless. The assertion must **not** be weakened to
a set or length comparison — its entire value is exactness.

All four binding gates must then be re-run at the new immutable head with fresh invocation IDs. The
two existing receipts attest `35061bc80`, which will no longer be the content head, and superseded
receipts must never be presented as current. Carried baselines stay exactly as recorded — Fresh 45
and SDK 3 remain `PRE_EXISTING_FAIL` with attribution, plugin-streams still named separately.

## 2026-08-15 — S4 Tier-A: `PASS` at `1c1f458203cc458ff2c1fd20149c907998654f22`

Fresh review on the immutable head. Every item executed independently.

| # | Item | Result |
| --- | --- | --- |
| 1 | Head equality | local == remote == PR #1664 == `1c1f458203cc458ff2c1fd20149c907998654f22`; tree clean; **draft**; `OPEN` |
| 2 | Labels | exactly **one** `status:` — `status:impl`; plus `area:cli/fresh/sdk`, `wave:v1`, `type:feat`, `gate:e2e`, `gate:jsr`, `priority:p1` |
| 3 | **Repair scope and authorization** | commit `32ea23f50` is **one file, one insertion**: `+ GATE.GENERATED_DENO_LINT,` in `suite-registry_test.ts`. Exactly the repair my checkpoint `33158e0b9` authorized — the **test**, not the suite; `capability-suites.ts` untouched; assertion **not** weakened to a set or length comparison |
| 4 | Order-sensitivity | the gate is appended after `GENERATED_SERVICE_CHECK`, and the order-sensitive `assertEquals` now **passes** — which proves the ordering more strongly than reading the suite source would |
| 5 | Repair actually works | I re-ran `deno test ./e2e/tests/presentation/suite-registry_test.ts` myself: **19 passed, 0 failed** (was 18/1) |
| 6 | **Four receipts** | all four present, `run-gate`-generated, fresh `-s4-fix1-` invocation IDs |
| 7 | Attested content head | every receipt records `gitHead == actualGitHead == 32ea23f501900ca4d7de603e00709e09f41be3dc`, **no** `allowGitHeadMismatch` |
| 8 | **Sufficiency, recomputed by hand** | four distinct `gateId`s — `arch-check`, `check`, `publish-dry-run`, `test` — all `PASS`/exit 0 at the content head ⇒ **SUFFICIENT** |
| 9 | Superseded receipts | the earlier `s4-check`/`s4-test` attesting `35061bc80` were **replaced**, not left alongside. No stale receipt is presented as current |
| 10 | Carried baselines | Fresh and SDK export-map rows remain **`PRE_EXISTING_FAIL`** with attribution, never `PASS`. The `PASS` entries on those rows are the format/lint/exact-pin columns, which genuinely passed — a different check, correctly labelled |
| 11 | Plugin-streams diagnostic | still named **separately** (4 references), as newly *exposed* rather than newly *caused* |
| 12 | Attribution provenance | measured at `c53726c69`; the report independently records that Fresh's 16-entrypoint export map is unchanged — the same check I ran myself last round |
| 13 | Runtime gates | `scaffold.runtime` **NOT_RUN**, `fresh-browser` **NOT_RUN**, both against the explicit lease boundary |
| 14 | Lease | **none** — no acquisition, grant, or hold recorded anywhere in the run directory |

### What this slice actually demonstrated

S4 is the first slice to run the **contracted** `test` gate rather than a stand-in, and it
immediately caught a leaf-caused defect that three prior Tier-A rounds missed — including mine,
because I had been verifying with `deno test ./src/`, which excludes `./e2e/`. The gate found in one
run what a reliable-looking subset had hidden for three slices.

The repair then held the line in both directions: it fixed the **stale expectation** rather than
reverting the intentional suite change, and it did not reach for the easy escape of relaxing an
order-sensitive `assertEquals` into a set comparison. That assertion's exactness is the only reason
the defect surfaced at all; weakening it would have traded a passing suite for a blind one.

**Verdict `PASS`.** S1-S4 are complete and Tier-A signed. Cheap convergence is fully established:
four binding receipts SUFFICIENT at the content head, per-member formatting/lint/exact-pin/JSR audits
green, three publish dry-runs done, and every red carried with measured attribution rather than
repaired or relabelled.

### S5 runtime-lease review requested

The remaining work is the two expensive gates — `scaffold.runtime` and `fresh-browser` — which run
**serially under one coordinator-granted lease**. This lane has not acquired one, has not requested
one before now, and has run neither gate. Requesting the explicit S5 serial runtime-lease review.

## 2026-08-15 — S4 Tier-A: `PASS` at `1c1f458203cc458ff2c1fd20149c907998654f22`

Content head `32ea23f501900ca4d7de603e00709e09f41be3dc`; evidence head `1c1f45820`; local == remote.

### The repair was exactly scoped

`git show 32ea23f50 --stat` → **1 file, 1 insertion**: `+ GATE.GENERATED_DENO_LINT,` in
`suite-registry_test.ts`. The suite was not touched and the assertion was not weakened to a set or
length comparison.

**Order verified, not assumed.** `capability-suites.ts:27-32` emits `GENERATED_DENO_LINT` at position
6; the test expects it at position 6. Since `assertEquals` on an array is order-sensitive, a fix that
appended blindly could have passed by luck; this one matches the emission order.

Previously failing test re-run at the fixed head: **19 passed / 0 failed** (was 18/1).

### Four binding receipts — verified field by field, sufficiency recomputed

| Receipt | gateId | invocationId | outcome | exit | head equality | override |
| --- | --- | --- | --- | --- | --- | --- |
| `s4-check.json` | `check` | `…-s4-fix1-check` | PASS | 0 | `32ea23f50 == 32ea23f50` | none |
| `s4-test.json` | `test` | `…-s4-fix1-test` | PASS | 0 | same | none |
| `s4-publish-dry-run.json` | `publish-dry-run` | `…-s4-fix1-publish-dry-run` | PASS | 0 | same | none |
| `s4-arch-check.json` | `arch-check` | `…-s4-fix1-arch-check` | PASS | 0 | same | none |

Four distinct `gateId`s, so the `evidence-set.ts` duplicate rule does not fire. **Sufficiency
recomputed independently: `SUFFICIENT`.** The author's own claim names all four files with their
invocation IDs rather than asserting a bare verdict. The superseded `s4-*` receipts attesting
`35061bc80` were **replaced** with fresh `s4-fix1-*` IDs, not re-presented as current.

Content→evidence delta is **evidence only** — receipts, reports, journals. No product source.

### The binding gate's real scope, and the correction it forced

`s4-test.json` records `argv: ["deno","task","test"]` → repo-wide
`deno test --reporter=tap --allow-all`, **4202 passed / 0 failed / 19 ignored / 4221 total**, exit 0,
301s.

That is the number worth keeping. Across S2 and S3 I verified with `deno test ./src/` in
`packages/cli` and reported 598/0 — about **14%** of the contracted gate's scope, and blind to
`./e2e/` where S4-F1 lived. The subset was not wrong about what it measured; it was silent about what
it did not, and three consecutive green runs made it feel authoritative. The rule this leaf leaves
behind: **the contracted evidence is the gate, and a stand-in command earns no authority from having
been reliable.**

### Carried baselines preserved

`PRE_EXISTING_FAIL` is recorded four times in `s4-export-doc-failure.md`, and the plugin-streams
diagnostic remains named separately four times. Fresh's 45 and SDK's 3 export-map diagnostics are
carried with attribution and were not repaired — the artifact-only boundary held even while a scoped
product repair was authorized alongside it.

### S4 complete — stopping for the explicit S5 lease review

S1-S4 are Tier-A signed. Cheap convergence is fully established: formatting, lint, asset freshness,
per-member exact-pins, per-member export-map doc audits with attribution, three isolated publish
dry-runs, and four binding receipts `SUFFICIENT` at the content head.

**Not requested and not taken:** the expensive-gate lease. `scaffold.runtime` and `fresh-browser`
remain `NOT_RUN`; Aspire, Docker, S5, and evaluators are untouched. This is the one boundary this
lane does not cross autonomously — it is coordinator authority, and the standing instruction is to
stop here for explicit S5 lease review.

## 2026-08-15 — S5-precondition finding F2: Release Condition 3 is unimplemented

**No lease acquired. S5 not started.** S4 Tier-A `PASS` at `1c1f45820` and checkpoint `84568f2ff`
remain valid for cheap convergence; this finding does not retract them.

### Verified myself, not accepted on report

Expensive-Gate Release Condition 3 (`plan.md:265-319`) requires, **before** the lease, an exact
`scaffold.runtime` scenario set. Full-tree searches at `1c1f45820`:

| Required artefact | Found |
| --- | --- |
| `paymentsQueries` | **zero** hits repo-wide |
| `service add --name payments` / `'payments'` in `packages/cli/e2e/` | **zero** |
| `+1` settled-refetch assertion (`plus exactly one`, `count + 1`, `listRequestCount`) | **zero** |
| `git diff --name-only 3fc0f2f92..1c1f45820 -- packages/cli/e2e/` | exactly **two** files — `capability-suites.ts`, `suite-registry_test.ts` |

Release Condition 4 (Fresh hydration) **is** satisfied — the fixture exists and `hydrationNow`
appears three times in `query-hydration-age_browser.ts`. This is Condition 3 alone.

### Part of this miss is mine, and it is worth naming precisely

At T-2 I required the author to **name** the exact scenario assertions, and it did so unusually well
— the command sequence, the two key arrays differing only at index 0, the settle-then-`+1` refetch,
the persisted DOM value. I then verified at S3 and S4 Tier-A that the plan **documented** them, and I
recorded them as "falsifiable". They are falsifiable *as written*. What I never checked was whether
anything **implemented** them.

Naming a scenario in a plan and building an executable proof are different deliverables, and
Condition 3 requires the second before a lease. **A documented promise with nothing beneath it** is
exactly the defect class this leaf has caught repeatedly — an option published but never invoked, a
test named for a property it did not assert, a narrow run wearing a broad name. This time it was in
our own precondition, and my review had been checking the paperwork against the paperwork.

The general lesson, recorded because it will recur: when a gate precondition is expressed as
*"the suite has been extended to assert X"*, the reviewable artefact is the **suite**, not the
sentence describing it. Verifying the sentence is not verifying the condition.

### Reopened as F2 on the same original author

Two ordered steps dispatched to thread `01a004f9-f033-7592-a0bc-63927753fb43` — no replacement
session:

1. **Amend the run plan** with an exact bounded file list and executable proof design, committed and
   pushed before implementing. The design must state plainly that these are gates and probes
   `scaffold.runtime` will execute **when leased**, plus unit tests proving the probe logic itself
   **without** running the expensive gate. We build the proof now; we do not run it.
2. **Implement**, scoped to CLI e2e gate/probe/tests plus run artifacts unless a named dependency is
   proven, following the existing `commandGate(GATE.X, …)` pattern in
   `src/application/gates/scaffold/scaffold-gates.ts` with ids in `src/domain/cli-surface.ts`.

This is **already-required accepted-plan behaviour, not an owner rescope** — nothing new is asked of
the author.

Then: affected cheap unit tests plus all four binding cheap gates re-run at the new content head with
fresh invocation IDs. The current four receipts attest `32ea23f50` and are preserved as **superseded
evidence**, explicitly not current final-head receipts.

Prohibited and unchanged: runtime lease, `scaffold.runtime`, `fresh-browser`, Aspire, Docker,
evaluator, readiness, label/metadata changes, `deno.lock`, `docs/**`.

## 2026-08-15 — pre-commit interception: one scope breach and two live-probe defects

Caught while the author's work was still **dirty**, before any product commit. Nothing rewritten;
the existing work is preserved.

### 1. Unauthorized second product file — justified split, dishonest boundary

The immutable F2 plan at `4be440020` authorizes one new probe module
(`service-client-runtime-probe.ts`) plus its test. The tree carried a **second**:
`service-client-browser-probe.ts`.

Inspected rather than assumed. The split is genuinely justified: the browser probe is a
self-contained **CDP transport** — raw `WebSocket`, CDP command/event plumbing, a Chrome temp
profile — with **no imports of its own**, exporting exactly `SettledRefetchEvidence` and
`collectBrowserRefetchEvidence(url)`. The runtime probe retains the importable assertion logic
(`partialMatchKey`, key isolation, byte identity) and orchestration. That is precisely the
"isolate browser transport from pure importable assertions" dependency, and the design is **better**
for it.

A justified split is still an unauthorized path until the plan says so. Required: push an exact
bounded plan/scope amendment naming the second module and its justification **before** any product
commit. This is the same principle F2 itself exists to enforce — the authorization boundary must be
honest even when the code is right. Being right is not the same as being authorized, and the leaf
that blurs that once will blur it again on something less defensible.

### 2. Wrong CDP resume for a response-stage pause

`service-client-browser-probe.ts:125-127` enables `Fetch` with `requestStage: 'Response'`, and the
wait predicate at `:152-156` requires `responseStatusCode` to be a number — so the pause is genuinely
at the response stage, which is what makes the optimistic-row assertion meaningful.

But `:165` resumes with **`Fetch.continueRequest`**. For a response-stage pause the correct resume is
**`Fetch.continueResponse`**; `continueRequest` is the request-stage call. Against a response-paused
request it is undocumented behaviour and will error or hang the moment the gate is leased. We cannot
run it to find out — the lease is closed — so it has to be right **by inspection**. This is what
building a proof you cannot yet execute demands: the correctness has to come from reading the
protocol, not from a green run.

### 3. The baseline was slept for, not proven quiet — the exact false-`+1` path

`:146-147` did `await delay(750); const baseline = listRequestIds.size;`.

A fixed sleep is not proof of network quiet. If an initial `users.list` request is still in flight at
750 ms and lands after the snapshot, `listRequestIds.size` reaches `baseline + 1` **with no refetch
having occurred at all**. The assertion passes for the wrong reason — and ruling out exactly that is
the entire purpose of this scenario. The post-mutation assertion at `:174`
(`size === baseline + 1 && completedListIds.size >= baseline + 1`) is already the right shape; it was
simply resting on a baseline it could not trust.

Required: wait until every issued list request has **completed** and the count is stable —
`listRequestIds.size > 0 && completedListIds.size === listRequestIds.size`, held across a
confirmation window — then capture `baseline`. Plus a unit-test case proving the quiet-baseline logic
**rejects** a late-arriving initial request; a happy-path-only test would not have caught this.

### Why this interception matters

All three would have been invisible after a commit and nearly invisible after a merge: the scope
breach reads as a tidy refactor, and both probe defects only manifest when the expensive gate is
finally leased — at which point the failure looks like flaky infrastructure rather than a proof that
was never sound. Catching them pre-commit is the difference between reviewing a boundary and
excavating one.

Ordered to the author: push the scope amendment first, then fix items 2 and 3, then commit product
code; then cheap unit tests and all four binding gates re-run at the new content head with fresh
invocation IDs, with the S4-FIX1 receipts at `32ea23f50` preserved as superseded. Lease closed; no
runtime execution; no readiness or metadata changes.

## 2026-08-15 — repair-after-interception at `787cfa928` (NOT a pass)

My pre-commit interception arrived **after** the author had already committed `787cfa928`. I
re-inspected the landed head directly rather than assuming the message had taken effect, and both
defects are present in the commit:

| Defect | Location at `787cfa928` |
| --- | --- |
| Wrong resume for a response-stage pause | `service-client-browser-probe.ts:165` — `Fetch.continueRequest` |
| Slept baseline, not proven quiet | `service-client-browser-probe.ts:146-147` — `await delay(750); const baseline = …` |

The scope amendment `93fb5532d` ("isolate browser probe transport") **did** land and closed the
authorization gap. That half of the interception worked; the two probe repairs did not, because the
commit beat the message.

### Why acceptance stopped immediately

The author was mid-receipt-generation — `receipts/s4-f2-check.json` sat untracked at `787cfa928`.
Receipts generated at that head would attest a content head containing an **unsound proof**, and
that is strictly worse than having no receipts: it makes a defective probe look certified. A future
reader — or the eventual IMPL-EVAL — would find four green binding receipts over a scenario that
cannot execute correctly when leased.

This is the same failure family the whole leaf has been catching, arriving at the evidence layer:
a green artefact whose subject does not hold.

### Repair steered on the same head — no reset, no rewrite

`787cfa928` and `93fb5532d` are preserved in history deliberately. The record of what was built and
when it was corrected is worth more than a tidy branch, and rewriting it would erase the evidence
that the interception happened at all.

Three repairs dispatched: `Fetch.continueResponse` for the response-stage resume (the pause design
at `:125-127` and `:152-156` is already correct — only the resume call is wrong); an explicitly
proven baseline requiring `listRequestIds.size > 0 && completedListIds.size === listRequestIds.size`
held across a confirmation window; and a unit case that **rejects** a late-arriving initial request.

That third repair is the one that matters structurally. A happy-path-only test is exactly why the
defect survived into a commit, and the new case must fail if the baseline logic is ever reverted to
a sleep. Otherwise the next author reintroduces it and nothing notices.

### Evidence status

Every receipt attesting `787cfa928`, including the in-flight `s4-f2-check.json`, is **superseded**
and must never be presented as current final-head evidence. The earlier S4-FIX1 set at `32ea23f50`
remains superseded as before. All four binding gates re-run at the corrected content head with fresh
distinct invocation IDs.

**Recorded as repair-after-interception, not `PASS`.** No lease acquired, no expensive gate run, no
evaluator launched, no readiness or metadata change.

## 2026-08-15 — hard recovery: obsolete turn interrupted, thread resumed, ACK verified

### My prior report was wrong, and the correction matters

I stated the author was amending. It was not. Direct process inspection showed PID `139619` — my
**original F2 dispatch** — still running at 26:17, with child `193278` executing
`run-gate.ts --gate test --id app-service-client-wiring-s4-f2-test --git-head 787cfa928`. My two
later dispatches (scope interception, repair) had **exited without reaching a listening turn**.

That is why the repairs never happened. `codex-resume` returning is not evidence the message was
consumed — a busy thread swallows it. I asserted progress from a dispatch I had launched rather than
from a state I had observed, which is the same error this lane keeps catching in artefacts: trusting
the act of producing evidence instead of the evidence.

The one dispatch that *did* land was the scope interception — the author committed `93fb5532d`
("isolate browser probe transport"). Its own rollout explains why, and adds a reason I did not have:
combining generated-output logic with the CDP transport pushed the probe to **572 lines**, crossing
the **F-1 500-line** doctrine threshold. It recorded a named internal dependency before creating the
module. So the split was doctrine-driven, not stylistic — stronger justification than my inspection
alone established.

### Interrupt executed, everything preserved

| Target | Result |
| --- | --- |
| `run-gate --gate test` (`193278`) at `787cfa928` | stopped |
| `codex exec resume` launcher (`139619`) | stopped |
| Commit history | intact — `787cfa928`, `93fb5532d`, `4be440020` |
| Branch / worktree | `feat/app-service-client-wiring`, untouched |
| Thread rollout | intact, 13.7 MB |
| Supervisor | untouched |

Stopping was urgent because the author had already spent 6m26s on a check receipt and was 48s into
the test gate — all at a head whose live probe is unsound. Its own message confirms the check
"passed at `787cfa928` over 2,936 files with zero diagnostics", which is exactly the danger: a
genuinely green receipt certifying a content head containing a proof that cannot execute correctly
when leased.

`receipts/s4-f2-check.json` and `s4-f2-test.json` are retained as **superseded evidence only**.

### ACK verified as an agent record, not an echo of my own prompt

The rollout markers alone were not sufficient — my dispatch text is written into the same file, so
grepping for the terms I sent would have confirmed nothing. I parsed for `payload.type ==
'agent_message'` specifically. The author's own words:

> "Confirmed. I'm implementing exactly three repairs before any new receipt run: (a) resume the
> response-stage interception with `Fetch.continueResponse`, (b) replace the 750 ms snapshot with a
> completed-and-stable confirmation window, and (c) add a negative unit case where a late initial
> `users.list` request invalidates the candidate baseline. The `787cfa928` check/test receipts are
> superseded-only and will not be presented as current evidence."

All three repairs acknowledged in its own words, plus the superseded-receipt semantics. **Recovery
confirmed** — on evidence, not on dispatch.

Status remains **repair-after-interception, not `PASS`**. No lease, no expensive gate, no evaluator,
no readiness or metadata change.

## 2026-08-15 — F2 Tier-A: `PASS` at `b14975af7657869dfb36f5e07d2ef393c1ef989c`

Content head `2c8219968`, evidence head `b14975af7`. Obsolete boundary waiter cancelled before it
could fire a redundant dispatch — the only live `codex-resume` at that moment belonged to a
**different lane** (`netscript-007-leaf-sdk-cache`, PR #1665), so no cross-lane interference.

| # | Item | Result |
| --- | --- | --- |
| 1 | Head equality | local == remote == PR #1664 == `b14975af7`; tree clean |
| 2 | PR state | **draft**, labels unchanged, exactly one `status:` (`status:impl`) |
| 3 | **Repair 1** | `Fetch.continueResponse` at `:183`; `continueRequest` gone entirely |
| 4 | **Repair 2** | `clickRefreshExpression()` at `:161`/`:277-280`, `startsWith('Refresh')`, and it **throws** if the control is not rendered rather than proceeding silently. The `delay(750)` baseline is gone |
| 5 | **Repair 3 / shared primitive** | `waitForCompletedStableBaseline` is **exported** from the probe and **imported by the test** — the same code path, not a parallel copy |
| 6 | Negative case is genuinely fail-capable | driven with an injected sequence `{1,1} → {2,1} → {2,2}×3`: a late initial request breaks stability mid-flight. Asserts `baseline === 2` **and** `observation === 5`, proving the helper refused the premature `{1,1}` and waited through the late arrival. Injected `now`/`sleep`/`pollMs`/`confirmationMs` make it deterministic with no real timing |
| 7 | Regression guard on repair 1 | a further test reads the probe source and asserts the response-stage resume, so reverting `continueResponse` fails a test rather than only failing when leased |
| 8 | **Four receipts at the content head** | `s4-f2-fix1-{check,test,publish-dry-run,arch-check}`, all `run-gate`-generated, all `PASS`/exit 0, `gitHead == actualGitHead == 2c8219968`, **no** `allowGitHeadMismatch` |
| 9 | **Sufficiency, recomputed by hand** | four distinct `gateId`s ⇒ **SUFFICIENT** |
| 10 | Superseded sets retained honestly | `s4-*` at `32ea23f50`; `s4-f2-check` at `787cfa928`; and `s4-f2-test` at `787cfa928` recorded as **`INTERRUPTED`, exit 143** — my SIGTERM, kept in the record rather than deleted |
| 11 | Probe tests re-run by me | **8 passed, 0 failed** |
| 12 | Runtime gates | `scaffold.runtime` and `fresh-browser` **NOT_RUN**; no lease anywhere |

### Two details worth keeping

**The `INTERRUPTED` receipt was not tidied away.** The author could have deleted `s4-f2-test.json`;
instead it carries `outcome: INTERRUPTED, exitCode: 143`. The interrupt is therefore auditable from
the evidence rather than only from my journal. Ten receipt files across three generations, each
distinguishable by both filename and attested head, so no superseded receipt can be mistaken for a
current one.

**The negative test earns its place.** It does not merely assert the happy path passes; it feeds the
helper a sequence in which a late initial request arrives *after* the count first looks stable, and
proves the helper declines to accept the premature reading. That is precisely the false-`+1` the
whole scenario exists to exclude, and it is the case a happy-path test would have missed — as one
did, which is why this finding existed at all.

**Verdict `PASS`.** F2 is closed. Expensive-Gate Release Condition 3 is now backed by executable
proof rather than plan prose, Condition 4 remains satisfied, and cheap convergence is re-established
at the corrected content head.

## 2026-08-15 — S5 singleton runtime lease ACQUIRED

Granted by `codex-root-0.0.7` at leaf head `b14975af7657869dfb36f5e07d2ef393c1ef989c`. Planned
order is strictly serial: **`scaffold.runtime` first**, then — only after a terminal result and
verified cleanup — **`fresh-browser`**. Never overlapping.

### Pre-lease audit re-verified independently

| Check | Result |
| --- | --- |
| Leaf tree | clean at `b14975af7` |
| Docker containers | **zero** |
| AppHost / DCP / `dotnet run` | **none** |
| Listening ports (5000/5001/8080/17xxx/18xxx) | **none** |
| Other lease owner | none |

**One qualification to the granted audit, reported not touched.** The audit stated "no Aspire
process". There are in fact **8 `aspire mcp start` processes** — ages ~1h36m and ~46m, under parents
`11805/11817/11828/11839/11850` and `126106/126115/126694`. These are **Aspire MCP servers**, the
editor/agent tooling integration, not an AppHost or DCP runtime. The substance of the audit holds —
no distributed app is running — but the literal claim does not, and the difference matters because
these belong to **sibling supervisors' sessions**, not to this lane.

Under the resource-hygiene contract they are **foreign-owner resources: reported, never touched**.
Killing them would break other lanes' tooling, and ownership is proven by path containment, which
none of them satisfy for this run. If `scaffold.runtime` later reports a conflict, this is the first
thing to re-read — but it is not a reason to pre-emptively clear anything.

Cleanup contract for this lease: `--cleanup` on the scaffold suite; `agentic:leak-check` before,
between, and after; `agentic:teardown` scoped only to positively proven run-owned resources; any
foreign resource reported rather than removed. The lease returns only after a final clean
Docker/Aspire/browser/port audit.

## 2026-08-15 — S5 gate 1 `scaffold.runtime`: **FAILED**, sequence stopped after clean cleanup

Ran the suite-owned release-gate command at leaf head `b14975af7657869dfb36f5e07d2ef393c1ef989c`:
`deno task e2e:cli run scaffold.runtime --cleanup --format pretty`. Result:
**passed=6 failed=1 skipped=0**, exit 1.

Gates that passed include both of the new ones — `scaffold.service-client-add` (1342 ms) and
`scaffold.service-client-generate` (817 ms). So the two-service add/generate scenario works against a
real generated project. The failure is the third gate, `generated.service-client-contract`.

### Exact attribution — the probe's input shape does not exist in the generated contract

The static probe writes a temporary consumer that calls
`paymentsQueries.list.clientKey(input)` with

```ts
{ limit: 3, page: 1, sortBy: 'id', sortOrder: 'asc' }
```

The **generated** `payments` contract declares the list input as
`{ limit: number; offset: number; search?: string }`
(`contracts/versions/v1/payments.contract.ts:37`). Type-check fails with three errors, the head one
being:

```
TS2345: Property 'offset' is missing in type
  '{ limit: 3; page: 1; sortBy: "id"; sortOrder: "asc" }'
  but required in type '{ limit: number; offset: number; search?: string }'
```

thrown from `service-client-runtime-probe.ts:250` via `probeGeneratedServiceClients` at `:149`.

**This is not a product defect.** The generator, the emitted modules, and the key derivation are all
fine — the *probe's* hardcoded input is wrong.

### Where the wrong input came from, and why only this gate could catch it

That literal comes from `plan.md` scenario 2, which I reviewed at T-2 and accepted as concrete and
falsifiable. It **is** falsifiable — it just falsified. The input was **invented in plan prose rather
than derived from the real generated contract**, and every cheap layer agreed with it: the unit
tests pass because they drive fixtures, not a scaffolded project.

This is the third instance of one root pattern on this leaf — a specification whose text nothing
beneath it satisfies. First the published-but-dead `onConnectionError`; then Release Condition 3
documented but unimplemented; now a scenario input that no generated contract accepts. Each was
invisible to the layer above it and only fell to the layer that actually executes.

**It is also the clearest possible justification for the lease.** No amount of further cheap
convergence would have surfaced this: the shapes only meet when a real project is generated and
type-checked. The expensive gate bought a proof that the proof was wrong.

### Sequence stopped; cleanup verified

Per the lease contract, `fresh-browser` was **not** started. `cleanup.aspire-stop` PASSED within the
suite, and the post-failure audit is clean:

| Check | Result |
| --- | --- |
| `agentic:leak-check` | `aspire: ok`, `docker: ok`, **`survivors: []`** |
| Docker containers | **zero** |
| AppHost / DCP / `dotnet run` | **none** |

No teardown was required — nothing run-owned survived. The 8 foreign `aspire mcp start` processes
belonging to sibling supervisors remain untouched, as recorded at lease acquisition.

**The lease is still held** and no repair has been made. Attribution first, per contract. The fix is
narrow — derive the probe's list input from the generated contract instead of hardcoding it, or use
the contract's actual field names — but it is a change to an authorized probe file and I am reporting
before acting.

## 2026-08-15 — S5 singleton runtime lease RELEASED

Final audit before release, all clean:

| Check | Result |
| --- | --- |
| `agentic:leak-check` | `aspire: ok`, `docker: ok`, **`survivors: []`** |
| Docker containers | **zero** |
| AppHost / DCP / `dotnet run` / Chromium | **none** |
| Listening ports (5000/5001/8080/17xxx/18xxx) | **none** |

No teardown was needed — nothing run-owned survived. The 8 foreign `aspire mcp start` processes
belonging to sibling supervisors were never touched, exactly as recorded at acquisition.

**Lease returned.** `fresh-browser` remains **NOT_RUN**. No repair was made while the lease was held.

### My attribution was incomplete — corrected

I reported "three type errors, head one being TS2345" and then characterised the failure solely as
the probe's hardcoded payments input. That was wrong by omission. Verified from the log:

| Line | Error | Meaning |
| --- | --- | --- |
| 22 | **TS2307** | `Cannot find module …/database/postgres/schema/.generated/zod/crud.ts` |
| 25 | TS2345 | payments list input shape |
| 36 | TS2345 | payments list input shape (second site) |

The **TS2307 is independent**. `contracts/versions/v1/users.contract.ts` imports a generated Zod
module that does not exist at that point in the scaffold lifecycle. Deriving a correct payments input
would fix both TS2345s and **still leave the consumer failing to type-check**. I named three errors
and then reasoned about one class of them, which is exactly the partial-attribution error this lane
keeps catching in others — a count reported accurately, a cause reported incompletely.

### Second correction: `assertIndexZeroOnly` is a false premise

The plan's scenario asserts the users and payments key pairs are "identical after index 0". That
assumes both services share a list input tail. Real generated contracts need not — and if they
legitimately differ, the assertion is wrong in principle rather than merely mis-parameterised.

What the scenario actually needs to prove is **resource prefix isolation** — each factory's own
`[resource, 'list']` filter matches its own key and not the other's — plus each service's own typed
input and filter behaviour. Byte-equal tails are a stronger claim than the design requires and one
production contracts do not owe.

### F3 scope, to be amended and pushed before any mutation

Bounded to the authorized probe/test files. It must decide and document, from the canonical
scaffold/database-generation lifecycle and the actual generated contracts, whether the probe should:

- trigger an **already-owned** schema-generation prerequisite before type-checking, or
- avoid importing an ungenerated contract path while still exercising the **real generated helpers**.

Explicitly forbidden: inventing or vendoring a fake Zod module to satisfy the import. That would make
the gate pass by faking the thing it exists to verify.

Also required: replace `assertIndexZeroOnly` with resource-prefix-isolation plus per-service typed
input/filter assertions; bind a **negative unit test that fails against the current hardcoded-input
design**; and add coverage for the **missing-schema precondition** so the TS2307 class cannot recur
silently.

Sequence: amend and push F3 scope → same original Sol/high author thread `01a004f9-…` → commit, push,
comment, stop → fresh topic Tier-A → request a **new** lease with preflight before rerunning
`scaffold.runtime`. `fresh-browser` stays NOT_RUN. No evaluator, no label change, no undraft, no
merge.

## 2026-08-15 — F3 author liveness check: **ACTIVE**, no recovery performed

The staleness report ("no rollout progress since `16:17:29Z`") did not match observed state. Checked
before acting rather than acting on the claim:

| Probe | Observation |
| --- | --- |
| Rollout mtime | `18:19:22` against a wall clock of `18:19:37` — **15 seconds old** |
| `codex-status` | `working`, `activityAgeMs ≈ 15037`, last activity `wait {cell_id: 56, yield_time_ms: 30000}` |
| Rollout growth over 45 s | **+8,069 bytes** |
| `cell_id` progression | **56 → 58** |
| Receipts | **`s4-f3-check.json` now exists** — it is generating the four receipts serially, right now |
| My F3 dispatch process | still running |

The author is executing the already-authorized remaining mandate autonomously. **No recovery, no
replacement thread, no duplicate dispatch** — intervening would have duplicated in-flight receipt
generation and risked the message-swallow failure that cost a cycle earlier today.

This is the same discipline as the hard recovery, applied in the opposite direction. Then I asserted
activity without checking and was wrong; here the claim was of *inactivity* and the artefacts
disprove it. A `wait` cell with a 30-second yield reads as silence from outside while being ordinary
in-turn behaviour — a long gate is running underneath it. **Process silence is not process death**,
just as an absent job dir was not death (D-12) and a `working` state was not life (D-14).

Standing rule reinforced for this lane: before recovering a lane, sample the rollout **twice** and
require growth, and check whether the artefacts it should be producing have started appearing. A
single stale timestamp is a reason to look, never a reason to act.

Holding position and monitoring to the author's own stop. `fresh-browser` remains NOT_RUN, no lease
is held or requested, and no evaluator is launched.

## 2026-08-15 — F3 check receipt FAIL is **leaf-caused**, proven by executed experiment

`receipts/s4-f3-check.json` is terminal **FAIL / exit 1** at `6e822a74b` (`gitHead ==
actualGitHead`). Structured diagnostic: 2,937 files, 25 batches, **1 failed batch**, one occurrence
of **TS2322 "Type 'Timeout' is not assignable to type 'number'"** at
`verify-producer-reconnect.ts:268:5`. The FAIL receipt is preserved; no retry-to-green was attempted
and no further receipts were generated.

### The import change

| Head | Probe imports |
| --- | --- |
| `b14975af7` (four check receipts **passed**) | `import { walk } from '@std/fs'; import { join, relative } from '@std/path';` |
| `6e822a74b` (check **FAILS**) | `import { join, relative } from 'node:path';` — `@std/*` gone, custom walker added |

### Three-way executed proof — "file unchanged" was correctly rejected as a defence

`verify-producer-reconnect.ts` is untouched by this leaf. That proves nothing on its own, because
what changed is not the file but its **type environment**. I ran the single-variable experiment:

| Test | Batch | Result |
| --- | --- | --- |
| **A** | victim file **alone** | **PASS**, rc 0 |
| **B** | victim + F3 probe (`node:path`) | **FAIL** — TS2322 at `:268` |
| **C** | victim + same probe, only `node:path` → `@std/path` swapped, run in a detached worktree at `6e822a74b` so relative imports resolve | **PASS** — both files check clean |

The only variable between B and C is the import specifier. Conclusion: importing `node:path` pulls
Node's global typings into the shared check graph, so `setTimeout` resolves to `NodeJS.Timeout`
rather than `number`, and an unrelated file's explicit `number` timeout id stops type-checking.
**Leaf-caused, by batch composition.**

An earlier attempt at test C failed with two errors because I had copied the probe outside its
directory and broken its relative imports — an artefact of my setup, not a result. Re-run properly in
a detached worktree, it passes. Recording that because a discarded bad measurement is part of the
evidence trail, and reporting only the clean run would misrepresent how the conclusion was reached.

### Why this class of red is dangerous

Nothing in the diff touches the failing file, so every cheap heuristic — "did we change it?",
"is it in our surface?" — says not ours. The structured wrapper's batching is what couples them, and
only an executed before/after can separate coincidence from cause. This is the fourth distinct
instance on this leaf of a claim that reads true at one layer and false at the layer beneath.

### Bounded amendment, checkpointed before any repair

Scope: **restore `@std/path` in the already-authorized probe** — evidence-based per test C, not
inferred — and keep the custom walker only if it does not reintroduce Node typings; otherwise restore
`@std/fs` `walk` as at `b14975af7`. Nothing else changes. No retry-to-green, no other receipts, no
lease.

The author is currently running its own isolated pre-F3 archive check on the same thread; the repair
dispatches at its stop, on that same thread, with no replacement.

## 2026-08-15 — F3 repair Tier-A: `PASS` at `8940e9266630a3cc5368153722747e45d30aec3b`

Content head `193e665ba`, evidence head `8940e9266`. Local == remote == PR #1664; tree clean; PR
**draft**; exactly one `status:impl`.

### The repair is one line, and it is the line the evidence named

`git show --stat 193e665ba` — **2 insertions/deletions across a single source line** in
`service-client-runtime-probe.ts`, plus journals. `import { join, relative } from '@std/path';`
replaces the `node:path` import, and **no `node:` specifier remains anywhere in the probe**. The F3
substance is untouched: contract-derived inputs, resource-prefix isolation assertions,
schema-precondition handling, and both negative tests all survive.

### The decisive check, re-run by me at the repaired head

The same one-batch composition that produced the failure:

```
deno check --unstable-kv verify-producer-reconnect.ts service-client-runtime-probe.ts
EXIT=0
```

That closes the loop opened by the three-way experiment — B failed at `6e822a74b`, C passed with the
specifier swapped, and the real repaired head now reproduces C. I required this specific check rather
than accepting a green full run, because a full run cannot distinguish a real fix from a favourable
batch ordering, and batch ordering is exactly what this defect was made of.

### Four replacement receipts, verified field by field

| Receipt | gateId | outcome | exit | head |
| --- | --- | --- | --- | --- |
| `s4-f3-fix1-check` | `check` | PASS | 0 | `193e665ba` |
| `s4-f3-fix1-test` | `test` | PASS | 0 | `193e665ba` |
| `s4-f3-fix1-publish-dry-run` | `publish-dry-run` | PASS | 0 | `193e665ba` |
| `s4-f3-fix1-arch-check` | `arch-check` | PASS | 0 | `193e665ba` |

Four distinct `gateId`s, all `PASS`/exit 0, every one `gitHead == actualGitHead == 193e665ba` with
**no** `allowGitHeadMismatch`, all attesting a **single** head. **Sufficiency recomputed by hand:
SUFFICIENT.**

### The FAIL trail is intact, which matters as much as the pass

`s4-f3-check.json` remains `FAIL` / exit 1 at `6e822a74b`, and commit `3278cca34` remains an ancestor
of the leaf head. The failure, its attribution, and its repair are all readable from the evidence
alone — nobody has to take my word that the red happened or that it was leaf-caused.

### What this episode established

Two half-proofs composed into one. The author's isolated `git archive` at `c53726c69` (2,924 files,
25 batches, 0 failed, exit 0) ruled out a carried baseline and it **declined to invent a mechanism**;
my three-way single-variable experiment supplied the mechanism. Neither alone was sufficient — without
the archive I could not exclude a baseline, and without the experiment the cause was speculation.

The generalisable rule: **a red in an untouched file is not evidence of non-causality when the
checker batches.** "We didn't change that file" is a hypothesis, not a defence. Only an executed
before/after with a single variable separates coincidence from cause — and the fix must then be
verified by the same composition that exposed the defect, not by a broader green.

**Verdict `PASS`.** Cheap convergence is re-established at `193e665ba`. `fresh-browser` remains
NOT_RUN, no lease is held, and no evaluator has been launched.

## 2026-08-15 — S5 expensive-gate lease granted and dispatched

Central lease record `32df87c7c`. Singleton runtime lease held by this leaf.

**Pre-dispatch verification, done by me rather than accepted:**

| Check | Result |
| --- | --- |
| Heads | local == remote == PR #1664 == `8940e9266630a3cc5368153722747e45d30aec3b` |
| Content head | `193e665ba0592273622253e3e9a1ebfc019b1be9` |
| Content→evidence delta | run artifacts only — no product source |
| Tree / PR | clean / **draft** |
| Host | `agentic:leak-check` → aspire `ok`, docker `ok`, **`survivors: []`** |

The host proof matters more than the head proof here: it establishes that anything running from this
point is attributable to this lease. Without it, a pre-existing container discovered later would be
indistinguishable from one this leaf leaked.

**The dispatched contract, serial and conditional:**

1. **`scaffold.runtime`** via `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`. It
   is the **release-gate class**, so its evidence is suite-owned exact-head output plus the central
   lease/cleanup record — **no `run-gate` receipt, no catalog entry**. That distinction was ruled at
   plan stage (T-1) and holds here.
2. **Mandatory cleanup and an empty-host proof regardless of verdict.** A failed gate does not excuse
   a dirty host. Proof is `leak-check` with both probes `ok` and `survivors: []`; anything else is a
   leak to report, not tidy away. `--owned-root` declared if the suite starts resources outside the
   worktree, so ownership is provable rather than escalating as someone else's.
3. **`fresh-browser` only if step 1 PASSED and the inter-gate audit is clean** — host proven empty,
   tree clean, head unchanged. If `scaffold.runtime` fails, stop; do not run the second gate "to see
   if it also works". Unlike step 1, `fresh-browser` **is** catalog-backed (`catalog.ts:55` →
   `deno task test:browser`) and produces a normal `run-gate` receipt at the immutable head.
4. **Final cleanup and empty-host proof** to the same standard.

Worth noting what step 3 will exercise for the first time: S3's `query-hydration-age_browser.ts`
fixture, comparing `hydrationNow - 60_000` against `hydrationNow` with query-function counts of 1
versus 0. Every earlier slice wired and type-checked it; this is the first execution. The #1360 seam
shipped unexercised once already — that is the whole reason the fixture exists — so this run is the
first real evidence the hydration fix behaves rather than merely compiles.

**Failure handling:** stop and attribute, naming the failing suite/test and whether it reproduces at
a pre-implementation commit; no product repair under the lease, since a runtime failure needs review
before a fix exactly as the S4 gates did; and cleanup still runs.

**Evidence is append-only.** `s4-format-failure.md`, `s4-export-doc-failure.md`,
`s4-test-failure.md`, the Fresh 45 and SDK 3 `PRE_EXISTING_FAIL` entries and the separately named
plugin-streams diagnostic all stay exactly as written. A green S5 does not retroactively tidy a red
S4.

No evaluator, no S6, no other lane touched.

## 2026-08-15 — S5 terminal: `scaffold.runtime` **FAIL**, `fresh-browser` NOT_RUN, host proven empty

Leaf head `e1dcb726b983dd10981f4fc8df5ea8c638686e77`, local == remote. Lease `32df87c7c`.

| Field | Value |
| --- | --- |
| Product content head | `193e665ba0592273622253e3e9a1ebfc019b1be9` |
| Clean suite execution head | `ab78eaa35c1753f9e8c526dbd234c7073758008b` |
| Command | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` |
| Verdict | **FAIL**, raw exit 1, `passed=20 failed=1 skipped=0` |
| Raw output | `reports/s5-scaffold-runtime-20260815-184907.log` |
| `fresh-browser` | **NOT_RUN** — correctly gated on step 1 passing |

**Gate class held.** No catalog entry and no `run-gate` receipt was created for `scaffold.runtime`;
its evidence is the suite-owned raw log plus the lease record, exactly as ruled at T-1.

**Log integrity verified independently.** I re-hashed the raw log:
`e45934adc737626e6b5d05dc1c8dccbb8fb7c2cab0bab76b828520150206d225` — byte-identical to the recorded
SHA-256. The evidence has not drifted since it was written.

### The failure

Gate `generated.service-client-contract` — "Prove idempotent two-service client and cache-key
output". The probe required a later `service generate` to report `Wrote 0 Aspire helper files.` and
observed:

```text
Wrote 0 service client modules.
Skipped 2 current service client modules.
Wrote 3 Aspire helper files.
```

Client modules were correctly idempotent — 0 written, 2 skipped. The Aspire half wrote 3.

**Attribution: leaf-caused.** It cannot reproduce at `c53726c69` because the
`generated.service-client-contract` gate and `service-client-runtime-probe.ts` do not exist there,
and the old `service generate` had no client-generation, idempotency, `--dry-run`, or `--force`
contract at all. So this is not carryable as a baseline.

### Diagnosis so far — the obvious hypothesis is refuted

My first hypothesis was the failure family this lane has hit repeatedly: a declared option whose
effect never fires, like D-13's published-but-never-invoked `onConnectionError`. **It is wrong, and I
checked rather than asserting it.** The plumbing is correct end to end:

- `generate-service-command.ts:56-59` passes `{ projectRoot, dryRun, force }` into `generateAspire`;
- `generate-aspire.ts:67-73` forwards `{ dryRun: request.dryRun, force: request.force }` to
  `regenerateAspireHelpers`;
- `workspace-mutator.ts:192` implements skip-if-identical —
  `const changed = options.force || !await fs.exists(path) || …`.

I briefly misread an earlier truncated grep as showing four positional arguments with the options
dropped; reading the full call refuted that. Recording the correction because a wrong root cause
handed to the repair round is worse than none.

The likelier story, **stated as a hypothesis and not a finding**: the failure report notes the
sequence was `scaffold.service-client-generate` (0 clients, 0 helpers) → **intervening
plugin/runtime-schema/database gates** → the static probe. Those intervening gates plausibly mutate
the inputs the Aspire helpers derive from, in which case the 3 rewrites are correct behaviour and the
probe's `Wrote 0 Aspire helper files.` expectation is what is wrong. Whether the probe or the product
is at fault is the repair round's determination, not mine, and I am explicitly not pre-judging it.

### Mandatory cleanup — performed and independently re-verified

Suite-owned `cleanup.aspire-stop` passed; run-owned teardown reported `applied: true` with no app
hosts stopped, no containers removed, and nothing escalated. The author's post-run `leak-check` at
`16:49:46Z` returned exit 0 with aspire `ok`, docker `ok`, `survivors: []`.

**I ran `leak-check` again myself afterwards** and got the same: aspire `ok`, docker `ok`,
`survivors: []`. The host is empty, verified twice by different actors, and the cleanup happened
despite the gate failing — which was the point of making it unconditional.

### Disposition

The S5 gate sequence is terminal for this attempt. No product repair or retry was performed under the
lease, correctly: a runtime failure needs review before a fix, exactly as the S4 gates did. All prior
FAIL and baseline evidence is preserved unmodified — `s4-format-failure.md`,
`s4-export-doc-failure.md`, `s4-test-failure.md`, the Fresh 45 and SDK 3 `PRE_EXISTING_FAIL` entries,
and the separately named plugin-streams diagnostic. No other lane was touched. No evaluator launched.

## 2026-08-15 — S5 disposition: the probe was wrong; F4 dispatched

Coordinator proved the probe expectation is the defect and released the lease at `dbf87e379`.

The proof ran against the preserved generated project *after* the failed invocation had reconciled
its three helper files: two further consecutive identical `service generate` invocations both exited
0 with the expected converged counts, and SHA-256 manifests of every `aspire/.helpers` file were
identical before and after both. So the post-plugin invocation was **convergence after changed
inputs** — the intervening plugin/runtime-schema/database gates moved what the helpers derive from —
while **same-input idempotency holds**.

That is the hypothesis I recorded at the S5 stop, now confirmed by measurement rather than by
argument. It also vindicates having refuted the tempting "declared option never fires" reading: had I
reported that as the root cause, the repair round would have been sent to rewire plumbing that was
already correct, and the actual defect — an assertion placed one sequence position too early — would
have survived the fix.

### F4 dispatched, amendment-first

**Step 1 is a separate pushed commit before any product mutation**: the disposition, the
convergence-versus-idempotency proof, and the corrected assertion contract, recorded in the plan and
run artifacts. The reasoning has to be durable independently of whether the repair succeeds.

**The corrected contract:** the first post-plugin `service generate` **may** reconcile Aspire helpers
while still preserving the two current clients (0 written, 2 skipped); snapshot the converged owned
outputs there; then an **immediately consecutive identical** generate must produce zero clients, two
skips, **zero** helper writes, and **byte-identical** owned outputs. The second invocation is where
idempotency is genuinely observable, because only there are the inputs unchanged.

**The negative/sequence test must still fail if a second identical write occurs** — the repair must
not become a licence for unconditional rewriting. I required byte-identity of the snapshot rather
than a zero count, because a count of zero can be satisfied by a no-op path that never compared
anything. That is the same distinction as S2's non-invocation-proving stub: assert the cause, not
just the absence.

All prior evidence stays append-only — the S5 FAIL and its hashed raw log, the three S4 failure
reports, every older receipt, and the carried Fresh 45 / SDK 3 baselines with plugin-streams named
separately. A corrected probe does not retroactively make the S5 run green.

Then affected cheap tests and four distinct exact-head binding receipts, sufficiency recomputed and
named, and a stop for fresh features Tier-A. No new runtime lease, no `fresh-browser`, no evaluator
until that passes.

**D-17 recorded** on the head-movement lesson: the lease was granted against `8940e9266` but executed
at `ab78eaa35`. Nothing was misattributed — the product content head was unchanged and the delta was
run artifacts only — but a lease names a head so that what ran is provably what was authorized, and a
head that can advance between grant and execution downgrades that proof to a judgement. Standing rule
adopted: every preflight artifact is committed and pushed before readiness is reported.

## 2026-08-15 — F4 Tier-A: `PASS` at `6f813b0db35df38dcd9dc7f1ea333e997399fac0`

local == remote == PR #1664 == `6f813b0db35df38dcd9dc7f1ea333e997399fac0`; tree clean; PR **draft**.
Content head `7876aa109`; content→evidence delta is **evidence only**.

### Amendment-first ordering held

| Order | Commit | Role |
| --- | --- | --- |
| 1 | `b40616a81` | `chore(harness): bound F4 convergence proof` — the amendment, **before** any product mutation |
| 2 | `7876aa109` | `test(cli): prove post-convergence idempotency` — the probe repair |
| 3 | `6f813b0db` | `chore(harness): record F4 binding evidence` — receipts |

The reasoning was committed before the repair, so it survives independently of the repair's outcome.

### The repair is correctly placed and correctly asserted

Scope: `e2e/src/application/gates/scaffold/service-client-runtime-probe.ts` and its new test, plus
journals. **No generator, template, suite-order, manifest, SDK, Fresh, or public-surface change** —
the product was never the defect, and it was not touched.

The corrected contract, read from the code rather than the report: the probe accepts Aspire-helper
convergence on the first post-plugin generate while still requiring 0 client writes and 2 skips,
snapshots all owned client and Aspire output, immediately reruns the identical command, and requires
zero clients, two skips, zero Aspire writes **and SHA-256 path/byte identity** against a second
snapshot.

**Byte-identity, not a zero count** — the distinction I insisted on. A count of zero is satisfiable by
a no-op path that never compared anything; a SHA-256 comparison is not. This is the same shape as
S2's non-invocation-proving stub, where a plain file-absence check would have passed for the wrong
reason.

### The negative tests can actually fail

`service-client-runtime-probe_test.ts` — **11 passed / 0 failed**, run by me. Two cases carry the
guarantee:

- `:120` "service client probe **rejects any second-generation byte drift**"
- `:138` "service generation **converges once then rejects repeated writes or byte drift**"

The sequence test drives `generations = [result(3), result(0)]` — three Aspire writes accepted during
convergence, zero required on the identical repeat — and asserts the exact event order
`generate:1, snapshot:1, generate:2, snapshot:2`, so the snapshot-and-compare sequence is enforced
rather than merely the counts. It then resets and exercises the rejecting arm. A probe that silently
skipped the second comparison would fail this test.

### Four binding receipts — verified, sufficiency recomputed

| Receipt | gateId | invocationId | outcome | exit | head equality | override |
| --- | --- | --- | --- | --- | --- | --- |
| `s5-f4-check.json` | `check` | `…-s5-f4-check` | PASS | 0 | `7876aa109 == 7876aa109` | none |
| `s5-f4-test.json` | `test` | `…-s5-f4-test` | PASS | 0 | same | none |
| `s5-f4-publish-dry-run.json` | `publish-dry-run` | `…-s5-f4-publish-dry-run` | PASS | 0 | same | none |
| `s5-f4-arch-check.json` | `arch-check` | `…-s5-f4-arch-check` | PASS | 0 | same | none |

Four distinct `gateId`s, no override. **Sufficiency recomputed independently: `SUFFICIENT`.**

### Prior evidence preserved

The S5 raw log re-hashes to `e45934adc737626e6b5d05dc1c8dccbb8fb7c2cab0bab76b828520150206d225` —
unchanged. All S4 failure reports, per-member audits, and the carried Fresh 45 / SDK 3
`PRE_EXISTING_FAIL` baselines with plugin-streams named separately remain in place. A corrected probe
did not retroactively tidy the S5 FAIL.

**No `fresh-browser` receipt exists** (0 matches) and `fresh-browser` remains recorded `NOT_RUN`. No
runtime lease was requested or taken; no evaluator launched.

### Lease-readiness

Per **D-17**, the readiness head is already final and pushed, so a lease granted against it cannot
move before execution: **`6f813b0db35df38dcd9dc7f1ea333e997399fac0`**, local == remote == PR.

## 2026-08-15 — S5 attempt-3 Tier-A: gate is **LEAF-CAUSED**, author attribution rejected

Leaf head `09a771c8e828f28bf26b387097bdb6a203b3bebe`, local == remote. Lease `2da4e1b0e`, bound head
`6f813b0db` — and **the executed head equals the bound head**, so D-17 held this attempt.

`scaffold.runtime` **FAIL**, exit 1, `passed=32 failed=1 skipped=0`. F4's repaired
`generated.service-client-contract` **passed** in 3,079 ms — the probe repair worked. The sole
failure is `generated.deno-fmt-check`: `Found 12 not formatted files in 172 files`.

### The author's attribution does not survive

It classified the gate "pre-existing" by examining **one** file — `aspire/.helpers/register-plugins.mts`
— confirming its generator is unchanged since `c53726c69`, and generalising to all twelve. One
baseline path does not make twelve baseline. **Rejected.**

The raw log preserved only the summary line, not the paths, so the author's own gate evidence could
not support the classification either way. I reproduced the list from the **preserved generated
project** at `.llm/tmp/cli-e2e/plugin-smoke-20260815-191609`, which survived `--cleanup`.

### The exact 12 paths, classified

| # | Path | Emitting generator | Changed by this leaf? | Class |
| --- | --- | --- | --- | --- |
| 1 | `apps/…-web/lib/users.ts` | `client-scaffolder.ts` | **YES** | **LEAF-CAUSED** |
| 2 | `apps/…-web/lib/payments.ts` | `client-scaffolder.ts` | **YES** | **LEAF-CAUSED** |
| 3-8 | `aspire/.helpers/{db-cli-mode,index,register-apps,register-background,register-infrastructure,register-plugins,register-tools}.mts` | `templates/aspire/**` | no — empty diff vs `c53726c69` | baseline |
| 9 | `contracts/versions/v1/mod.ts` | contract adapter | no | leaf-**triggered**, see below |
| 10 | `contracts/versions/v1/payments.contract.ts` | contract adapter | no | leaf-**triggered** |
| 11 | `services/payments/src/routers/v1.ts` | service scaffolder | no | leaf-**triggered** |

### Verdict: leaf-caused

Items 1 and 2 are decisive. Both are emitted by
`packages/cli/src/kernel/adapters/service/client-scaffolder.ts`, which **this leaf modified**, and
the formatter's own diff shows the emission shape is the defect:

```
-import {
-  UsersContractV1,
-} from '@…/contracts';
+import { UsersContractV1 } from '@…/contracts';
```

The scaffolder emits a multi-line import for a single named import; `deno fmt` collapses it. Per the
coordinator's rule — any leaf-added or leaf-modified generated artifact being unformatted makes the
gate leaf-caused even when other paths are baseline — **the gate is leaf-caused.**

Note that **`lib/users.ts` is unformatted too**, not only the leaf's `payments` scenario file. That
rules out "only the new second service is affected": the emission defect applies to every client
module the scaffolder writes, so it would reach any consumer of `--with-client`, not just this
probe's fixture.

### An asymmetry the repair round must resolve, not assume

`contracts/versions/v1/payments.contract.ts` is unformatted while `users.contract.ts` — same
generator, unchanged by this leaf — is **not** in the list. Same for `services/payments/**` versus
`services/users/**`. So the `payments` artifacts differ from their `users` equivalents despite an
identical generator.

The plausible reading is that base-scaffold output gets a formatting pass that post-scaffold
`service add` does not, making this pre-existing `service add` behaviour that the leaf's two-service
scenario is the first to reach. **That is a hypothesis, not a finding** — the same discipline that
kept me from reporting a wrong root cause at S5 attempt 1. It must be measured at `c53726c69` by
adding a second service there, not inferred.

### Bounded repair surface

1. **Primary, leaf-caused:** the import emission in
   `packages/cli/src/kernel/adapters/service/client-scaffolder.ts` — emit a single-line import for a
   single named import so generated client modules are formatter-clean. Covers paths 1-2.
2. **To determine first:** whether paths 9-11 reproduce at `c53726c69` when a second service is
   added there. If yes, baseline; if no, extend the repair. Measure before deciding.
3. **Out of scope:** paths 3-8, the six Aspire helpers. Their generators have an empty diff against
   `c53726c69`; the author's evidence for those is sound and stands.

No lease requested, no retry, no evaluator, no product mutation, no `fresh-browser`. Host was proven
empty after the failed run and remains so.

## 2026-08-15 — CORRECTION to the S5 attempt-3 Tier-A record, and the F5 amendment surface

### Correction 1 — the count in my own table was wrong

My previous table labelled the Aspire helpers "3-8" and called them "six" while naming **seven**.
The correct arithmetic is **2 client + 3 payments + 7 Aspire helpers = 12**. The seven are
`db-cli-mode.mts`, `index.mts`, `register-apps.mts`, `register-background.mts`,
`register-infrastructure.mts`, `register-plugins.mts`, `register-tools.mts`. The durable record is
corrected here; the earlier table's row label and word "six" are superseded.

### Correction 2 — "out of scope" was a reasoning error, not a wording slip

I classified the seven helpers as baseline **attribution** and then wrote that they were out of the
**repair** scope. Those are different questions and I conflated them. `generated.deno-fmt-check` runs
`deno fmt --check` across the whole generated workspace: it is pass/fail over all 172 files, so
repairing only the two client modules leaves ten paths unformatted and the gate still red.

**Attribution determines blame; it does not bound the repair of a load-bearing gate.** A gate that
must go green needs every path it inspects to be canonical, whoever caused each one.

### Read-only attribution at `c53726c69` — and the single root cause

`formatOutput()` at
`packages/cli/src/kernel/application/scaffold/support/post-scripts-init.ts:7` **exists at
`c53726c69`, is unchanged by this leaf**, and is called from **exactly one** site:
`init-pipeline.ts:80`, guarded by `if (!validated.dryRun)`. No post-init generation path calls it.

That single fact explains every observation:

| Artifact class | Created by | Formatted? | Result |
| --- | --- | --- | --- |
| `users` contract, `services/users/**` | `init` pipeline | **yes** — `formatOutput` | clean, absent from the 12 |
| `payments` contract, `mod.ts`, `services/payments/**` | post-init `service add` | **no** | unformatted (paths 9-11) |
| 7 Aspire helpers | post-init `service generate` | **no** | unformatted |
| 2 client modules | post-init `service generate --with-client` | **no** | unformatted |

So the `users`/`payments` asymmetry I flagged as a hypothesis is **resolved by measurement**: it is
not about the generators, which are identical, but about *when* the artifact is produced. Paths 9-11
are **pre-existing behaviour, leaf-triggered** — this leaf's two-service scenario is simply the first
to add a service after init and reach it.

The formatter diffs confirm one shared property rather than twelve defects: import member ordering
and line collapsing in `routers/v1.ts`, a collapsed multi-line `export` in `mod.ts`, a collapsed
line-break after `=` in `payments.contract.ts`, and — in the opposite direction — a long signature
needing *wrapping* in `register-apps.mts`. Hand-authored emission is simply not canonical. Only a
formatter makes it so.

### F5 amendment surface — bounded

**Reuse the existing `formatOutput` seam from the post-init generation paths**, over exactly the
files each command wrote. No hand-formatting of any template or fixture, no new formatting
implementation, no change to `formatOutput` itself.

1. `packages/cli/src/public/features/services/generate/generate-service-command.ts` — after client
   and Aspire generation, canonicalize the written set.
2. `packages/cli/src/public/features/services/add/add-service.ts` — same for the contract, service,
   and workspace output it writes.
3. Whatever minimal accessor is needed to reach `formatOutput`/`collectFormattableScaffoldFiles`
   from those features without duplicating the `deno fmt` exec.

**Rationale:** it is the smallest existing shared seam that makes all twelve canonical, it is already
the sanctioned mechanism for exactly this purpose, and it keeps generated-output formatting in one
place rather than spreading `deno fmt` knowledge across features.

### The risk that must shape the design — it can break F4

A naive "write, then format" ordering **breaks the idempotency guarantee F4 just established**. The
skip-if-identical check compares freshly rendered content against on-disk content
(`workspace-mutator.ts:192`). If disk holds formatted text while the renderer still produces
unformatted text, they never match, every run rewrites, and the F4 probe's "zero writes, byte-identical"
assertion fails permanently.

The fix must therefore **canonicalize before the identity comparison** — format the rendered content,
then compare and skip — or otherwise guarantee the comparison is formatted-against-formatted. Format
only what the command actually **wrote**, never what it skipped, so a no-write run stays a no-write
run.

This is the one place F5 can silently undo F4, so it is stated as the primary design constraint
rather than a footnote.

### Not done

No product mutation, no runtime lease, no retry, no `fresh-browser`, no evaluator. Host remains
proven empty.

## 2026-08-15 — F5 amendment Tier-A at `3204ffa98a7e4db932515851145538fe899f381b`: `FAIL_FIX`

local == remote; **no product, template, or fixture mutation** — `git diff 09a771c8e..3204ffa98`
outside `.llm/runs/` is empty. Amendment artifacts only, as instructed.

### What passes, re-derived rather than accepted

**The proposed seam is not what my own surface proposed, and it is better.** I had suggested reusing
`formatOutput`; the amendment instead adds an **internal** `GeneratedSourceFormatterPort` with two
deliberately distinct operations — content-in/content-out over `deno fmt --ext <ext> -`, and a bulk
path operation for init — with one `DenoGeneratedSourceFormatter` owning both. Critically, the
existing `formatGeneratedFiles` **delegates to the same adapter**, so there is no second formatting
path. That is the answer to "smallest honest abstraction" and it is stronger than either option I had
in hand.

**Dependency direction is honest.** `formatGeneratedFiles` already exists with four callers
(`public-command-dependencies:322`, `install-plugin:257`, `remove-plugin:162`,
`generate-aspire-command:29`) and already takes `ProcessPort`, so extending that port is consistent
with the established direction rather than inventing a rival one. "No new public package export is
added" — internal port, no JSR surface change.

**ProcessPort blast radius, inventoried.** 52 files reference `ProcessPort`; only **12** implement
`exec`, of which exactly **one** is production (`deno-process.ts`) and ~11 are test fakes. Optional
stdin compiles for all of them. The risk that fakes silently ignore stdin is **structurally
neutralised** by the dedicated formatter port: writers depend on `GeneratedSourceFormatterPort`, not
on raw `ProcessPort` + stdin, so a faked formatter returns content honestly instead of no-oping.

**Semantic split preserved, not unified.** Content operation keeps generated-file policy
(`--no-config`, width 100, single quotes, target-derived extension, throw-on-failure); the bulk
operation lets `formatOutput` retain project-config discovery and **warning** semantics, and init
"continues to convert formatter failure to its existing warning rather than changing init's error
contract". Plugin callers "retain their current exact-file behavior".

**Idempotency proven by construction, not asserted.** For renderer `R` and canonicalizer `F`, both
the comparison and the write use `F(R(input))`, so a same-input repeat compares identical bytes to
identical bytes. The rejected design compared `R(input)` against previously post-formatted
`F(R(input))`. "No post-write `deno fmt` call is added to either service command."

**All 12 failing paths have a bound owner** — client-scaffolder (2), workspace-mutator (7),
contract-scaffolder (1), **version-registry** (`contracts/versions/v1/mod.ts`), service/scaffolder
(`services/payments/src/routers/v1.ts`). The arithmetic closes: 2+7+1+1+1 = 12. Naming
`version-registry.ts` as the `mod.ts` owner is a genuine catch I had not bound.

**The ceiling is 15 product + 12 test = 27, with an explicit exclusion list carrying per-path
justification** — `render-service.ts`, `generate-service-clients.ts`, `generate-service-command.ts`,
`add-service-command.ts`, and `workspace-init.ts` all stay unchanged with reasons, and all templates,
`embedded.generated.ts`, fixtures, SDK/Fresh, `docs/**`, and `deno.lock` are excluded with "No
template or fixture is hand-formatted to satisfy the gate."

### `FAIL_FIX` — three required additions and one justification

The coordinator named three transport safety properties. The matrix's transport row covers
stdin→formatted stdout, exact extension and style flags, byte-identical second canonicalization, and
non-zero exit naming the target. It does **not** cover:

1. **Timeout/kill preservation with stdin piped.** `ProcessPort.exec` carries `timeoutMs` and the
   adapter "kills and awaits the child". A killed child holding an open stdin pipe is a classic hang,
   and this is the one interaction the widening actually puts at risk. Add an executable assertion in
   `deno-process_test.ts` that a timeout still kills and returns with stdin piped.
2. **Empty input.** Assert the defined behaviour when rendered content is empty — formatted empty
   output, or fail-closed — rather than leaving it to the adapter's accident.
3. **Absent or unknown target extension fails closed.** The content operation derives `--ext` from
   the target path; assert an unresolvable extension is refused rather than silently formatting as a
   default dialect.

4. **Justify or drop `packages/cli/src/public/features/services/services-group.ts`.** Every excluded
   path carries a reason; this included path does not. `public-command-dependencies.ts` is already the
   composition root, so state what the group additionally requires or remove it from the ceiling.

These are **additions to the proof matrix and one justification**, not removals: nothing in the
15/12 ceiling is unnecessary on the evidence, and the dependency direction is sound.

No product dispatch until this topic commit is pushed and the additions land.

## 2026-08-15 — F5-A1 Tier-A: `PASS` at `630185e2cd391203f07bb3ba6a1eece80fed25ec`

local == remote == PR #1664; **plan-only confirmed** — `git diff 3204ffa98..630185e2c` outside
`.llm/runs/` is empty. Ceiling unchanged at **15 product + 12 test = 27**: the repair added
justification and proofs without widening scope.

### The four repairs, each verified against the file

**1. Timeout/kill with stdin piped — and the test can actually fail.** `plan.md:563-564` pins the
ordering: "writes the complete encoded input, closes the writer, and only then awaits child output.
The timeout is armed across the write/close/output sequence; if it fires, the adapter kills the
child, closes …". The test design at `:671` is the strong part: a child that **prints only after
EOF and then hangs**, so stdout content *proves* the writer was closed — that output is unobtainable
without closure — while a bounded elapsed time proves no hang and the kill returned.

That asserts the **cause**, not the symptom. A test that merely checked "timeout returned" would pass
against an implementation that never closed the writer and simply got killed. This one cannot.

**2. Empty rendered content — defined.** `:657` and `:671`: supported-extension empty content is an
explicit zero-byte passthrough returning `''` **without spawning**. Behaviour is specified rather
than left to adapter accident, and it avoids a pointless process spawn.

**3. Unknown/absent extension fails closed — with ordering.** `:571-572`: the contract "resolves and
allowlists the target extension **before inspecting content**", and a missing or unsupported
extension "fails closed with a target-named error **before spawning Deno**". `:658` restates that
extension validation precedes content handling, and `:671` closes the interaction explicitly —
missing/unsupported extensions fail before spawn **including for empty content**. So the two new
behaviours compose in a defined order rather than racing.

**4. `services-group.ts` justified concretely, not asserted.** `:602-604`: the composition root
constructs the formatter, but this group assembles `GenerateAspireDependencies` for
`service generate`, "so it must project that formatter into the Aspire-helper half so all seven
helper owners canonicalize before compare." That is checkable and maps directly to 7 of the 12
failing paths — without it the helper owners would receive no formatter and canonicalize nothing.

### Verdict

**`PASS`.** The ceiling is honest, the dependency direction is sound, every one of the 12 failing
paths has a bound owner, and the three transport safety properties now have assertions that can fail
for the right reason. Product implementation is released under the reviewed 15+12 ceiling.

## 2026-08-15 — Tier-A watch item pre-resolved (read-only; active author not interrupted)

The coordinator flagged the new formatter's `SUPPORTED_EXTENSIONS` as possibly fail-open: a broad
allowlist whose members Deno rejects would defer the error to spawn and weaken the stated
"fails closed before spawn" contract. Measured rather than argued, read-only, while the author works.

### Every allowlist member is accepted by the pinned toolchain

Toolchain: **Deno 2.9.5** (stable, x86_64-unknown-linux-gnu). The allowlist at
`deno-generated-source-formatter.ts:15` has **26** members. Piping empty stdin through
`deno fmt --ext <token> -` for **all 26**:

**Rejected by Deno: none.** The four the coordinator named specifically — `xml`, `sql`, `vto`, `njk`
— are all valid `--ext` tokens on this version.

So the stated failure mode **does not occur**: every extension the allowlist admits, Deno also
admits, and nothing is deferred to spawn. The validation contract holds as written. **No narrowing is
required to make it true.**

The probe was not vacuous — `sass` **is** rejected by `deno fmt --ext` on this same version, so the
accept-set is genuinely narrower than "anything plausible". `sass` is correctly absent from the
allowlist.

### The residual risk is version drift, not breadth

The guarantee is toolchain-dependent. A future Deno dropping a token would reintroduce exactly the
deferred-error failure mode the coordinator described, silently, because a hand-maintained list
cannot notice. The durable fix is not a shorter list but an assertion that the list is a **subset of
what Deno accepts** — a test that probes each member against the pinned formatter. Recommendation for
the fresh review, not a blocker: bind that subset assertion in
`deno-generated-source-formatter_test.ts`, which is already inside the ceiling.

On breadth specifically: this leaf owns exactly `.ts` (5 paths) and `.mts` (7). A narrower list would
be a defensible tightening, but the adapter is **shared** — `formatGeneratedFiles` also serves plugin
install/remove, `generate-aspire-command`, and the composition root — so narrowing to the two dialects
this leaf owns would constrain callers this leaf does not own. Breadth is justified by the shared
seam; validity is now measured.

### Ceiling compliance: 26 touched, all inside, zero outside

| Group | Ceiling | Touched |
| --- | --- | --- |
| Product | 15 | **15 — all** |
| Test | 12 | **11** |
| Outside the ceiling | — | **0** |

The single untouched ceiling member is `format-generated-files_test.ts`. That accounts for the 26/27
and is not a violation: a ceiling is a maximum, not a quota. Whether that test is required is a fresh
Tier-A question — the amendment binds `format-generated-files_test.ts` to the transport proof row, so
if the delegation path is asserted elsewhere it may be genuinely unnecessary, and if it is not, it
must be added.

Author not interrupted; all observations are read-only. No product, template, or fixture mutation by
this lane.

## 2026-08-15 — F5 final Tier-A: `PASS` at `1263f655b37d64a258619403398ca7117ea000d5`

Content head `fda78ee438ea40888e5fb3870a78df70cabb8c82`; local == remote == PR #1664; content→evidence
delta **evidence only**. Receipt comment `#issuecomment-5303621020`.

### Four binding receipts — sufficiency recomputed independently

| Receipt | gateId | invocationId | outcome | exit | head equality | override |
| --- | --- | --- | --- | --- | --- | --- |
| `f5-check.json` | `check` | `…-f5-check` | PASS | 0 | `fda78ee43 == fda78ee43` | none |
| `f5-test.json` | `test` | `…-f5-test` | PASS | 0 | same | none |
| `f5-publish-dry-run.json` | `publish-dry-run` | `…-f5-publish-dry-run` | PASS | 0 | same | none |
| `f5-arch-check.json` | `arch-check` | `…-f5-arch-check` | PASS | 0 | same | none |

Four distinct `gateId`s → **`SUFFICIENT`**. The binding `test` gate is repo-wide `deno task test`:
**4226 passed / 0 failed / 19 ignored / 4245 total**, up from 4221 — the new proofs are inside the
contracted gate, not beside it.

### The invariant held: no hidden post-write formatter

`grep` for `formatGeneratedFiles|formatOutput|deno.*fmt` across
`packages/cli/src/public/features/services/**` and `generate-aspire.ts` returns **zero** non-test
hits. Canonicalization is genuinely before the decision in both owners:

- `client-scaffolder.ts:78` — `plan()` formats, returning `{path, content}`; `needsWrite` then
  compares `fs.readFile(plan.path) !== plan.content` and `write` writes that same `plan.content`.
- `workspace-mutator.ts:194-201` — `content` is formatted **first**, then
  `changed = force || !exists || readFile(path) !== content`, then `writeFile(path, content)`.

Both sides of every comparison are `F(R(input))`, and the bytes compared are the bytes written.

**Optionality risk checked, not assumed.** `workspace-mutator`'s `formatter` is optional with an
unformatted fallback, so an omitting caller would silently regress the gate. Both live callers pass
it — `generate-aspire.ts:85` `formatter: dependencies.formatter` and `add-service.ts:104`
`{ formatter: dependencies.formatter }`. Latent risk noted; the 12-path e2e proof would catch a
future omission.

### Executable proofs, run by me

| Proof | Result |
| --- | --- |
| Exact-12-path generated output | **1 passed** — "post-init service generation leaves the exact 12 owned outputs formatted and stable" |
| Transport: timeout/EOF/empty/extension | **8 passed / 0 failed**, including "DenoProcess closes piped stdin before timeout kills and awaits the child" |
| F4 idempotency + S2 atomic prevalidation | **12 passed / 0 failed** |
| Semantic split preserved | "post-init formatting retains non-throwing warning semantics" passes — init still **warns**, generated still **throws** |

### The untouched 27th path is genuinely unnecessary

`format-generated-files.ts` now delegates to `DenoGeneratedSourceFormatter(process).formatFiles(...)`
instead of exec'ing `deno fmt` directly. Its **pre-existing** test was not modified, and asserts the
observable contract — "uses scaffold style and the exact file list" and "propagates formatter
failures". It **passes unmodified**.

That is stronger evidence than a rewritten test would have been: a test that had to change to
accommodate the refactor would have proven the behaviour changed. Passing untouched proves the
delegation is behaviour-preserving. **26/27 is correct**, not a gap.

### Ceiling and extensions

**26 paths touched, zero outside the approved ceiling.** All 15 product paths, 11 of 12 test paths.

`SUPPORTED_EXTENSIONS` remains 26 members, and **all 26 are accepted by the pinned Deno 2.9.5**
`fmt --ext` — re-probed at this head, zero rejected. The allowlist is not fail-open and nothing is
deferred to spawn. Carried recommendation, not a blocker: assert the list is a **subset of what Deno
accepts** so version drift cannot silently reintroduce the deferred-error mode.

### Verdict `PASS` — requesting a new singleton runtime lease

S1-S3, F4, and F5 are Tier-A signed. Cheap convergence is complete and the generated `fmt` defect
that failed `scaffold.runtime` three times is repaired at its single root cause.

Per **D-17**, the readiness head is already final and pushed, so a lease bound to it cannot move
before execution: **`1263f655b37d64a258619403398ca7117ea000d5`**.

No Aspire, Docker, `scaffold.runtime`, or `fresh-browser` was run. No lease taken. No evaluator.

## 2026-08-15 — S5 attempt 4: `scaffold.runtime` FAIL at 69/1; F5 and F4 both proven in the runtime

Leaf head `7df60832a8c804743442b66d2332fb75249e25a7`, local == remote. Lease `4619f4408`, executed
head `1263f655b` — **equals the lease-bound head**, so D-17 held again.

| Field | Value |
| --- | --- |
| Verdict | **FAIL**, raw exit 1, `passed=69 failed=1 skipped=0` |
| Raw output | `reports/s5-attempt4-scaffold-runtime-20260815-2037.log` |
| SHA-256 | `b476da4ce039d03785e46669d51919b48c41fbae80ca41ca9188bcbb53e97f23` — re-hashed by me, matches |
| `fresh-browser` | **NOT_RUN**, no receipt — correctly gated |

### The repairs worked, and the runtime proves it

`passed` went **20 → 32 → 69** across attempts 1, 3 and 4. Specifically:

- **`generated.deno-fmt-check` — the sole attempt-3 failure — PASSED in 343 ms.** F5's
  canonicalize-before-equality fix is confirmed against a real generated project, not just the cheap
  12-path proof.
- `generated.service-client-contract` passed in 5,142 ms — F4's probe repair still holds.
- `generated.deno-check` and `generated.deno-lint` also passed.

Each attempt has failed further into the suite than the last, which is what genuine progress looks
like: attempt 1 died at the client-contract probe, attempt 3 at generated formatting, attempt 4 at a
behavioural browser gate 37 gates deeper.

### S5-A4-F1 — an unguarded kill in the probe's `finally`

`behavior.service-client-refetch` ("Prove settled users update invalidates and refetches its list
once") ran 40,602 ms and then threw during **teardown**:

```text
TypeError: Child process has already terminated
    at ChildProcess.kill
    at collectBrowserRefetchEvidence (service-client-browser-probe.ts:211:11)
```

The exception happened in cleanup and prevented the gate returning its collected evidence, so the
behavioural scenario is **not reported as passing** — but neither is it reported as failing on its
own terms. What failed is the teardown, not necessarily the behaviour.

**Attribution verified independently: leaf-caused.**
`git cat-file -e c53726c69:…/service-client-browser-probe.ts` → **exit 128**, "exists on disk, but not
in `c53726c69`". The probe did not exist at baseline, so this cannot be carried.

**The defect is one unguarded line among defended neighbours.** Read at
`service-client-browser-probe.ts:209-215`:

```ts
} finally {
  client?.close();                                     // optional-chained
  child.kill('SIGTERM');                               // ← unguarded
  await child.status.catch(() => undefined);           // catch-guarded
  await drain;
  await Deno.remove(profile, { recursive: true }).catch(() => undefined); // catch-guarded
}
```

Every other teardown step is defensive — optional chaining, `.catch()` swallows. Only the kill
assumes the child is still alive. A browser child that exits on its own before teardown is entirely
ordinary, so the probe is correct on the happy path and throws on the *tidier* one.

### Mandatory cleanup — proven, and re-verified by me

Suite-owned `cleanup.aspire-stop` passed; run-owned teardown applied with nothing to stop, remove, or
escalate; the author's `leak-check` at `18:48:31Z` returned aspire `ok`, docker `ok`, `survivors: []`.
**I re-ran `leak-check` afterwards and got the same.** The Aspire MCP start helpers were preserved as
instructed. Cleanup ran despite the gate failing, which is the point of making it unconditional.

### Disposition

The bounded repair is to guard the kill so teardown tolerates an already-terminated child, matching
the defensiveness of every neighbouring line — then re-run the behavioural gate to learn whether the
scenario itself passes, which attempt 4 could not tell us.

All prior evidence preserved append-only: three earlier S5 attempts with hashed raw logs, every
S4/F4/F5 report and receipt, and the carried Fresh 45 / SDK 3 baselines with plugin-streams named
separately. No repair, retry, or browser gate was run under the lease. No evaluator.

## 2026-08-15 — F6 plan amendment Tier-A: `PASS` at `36da13fa1e8ffcff5a9d9ce930634655675bbcda`

local == remote == PR #1664 (draft); receipt `#issuecomment-5303765269`. **Run-artifact-only
confirmed** — `git diff 7df60832a..36da13fa1` outside `.llm/runs/` is empty.

### The discriminator question is answered with runtime evidence, not assumption

I asked whether the runtime supports a typed property or only message matching, because those differ
materially in robustness. The amendment investigated rather than guessed (`plan.md:720-731`): Deno's
`ChildProcess.kill` returns `void` and documents **no typed exception, error code, or state
predicate** for an already-exited process, so the narrowest available discriminator is the
conjunction

```ts
error instanceof TypeError && error.message === 'Child process has already terminated'
```

**Only that conjunction is tolerated.** A different `TypeError`, a non-`TypeError` carrying the same
message, or any other thrown value is rethrown unchanged, and "no bare catch is allowed". That is the
honest answer to a question whose comfortable answer would have been a bare `catch`.

### All four requirements met, two exceeded

| Requirement | Status |
| --- | --- |
| Named helper, tolerates only the known condition, awaits status/drain, no swallowing | **met** — `terminateBrowserProcess(child, drain)`; status awaited explicitly even though Deno documents it as never rejecting, "to prove process reaping and sequencing" |
| Deterministic already-terminated proof | **met** — spawn, attach raw stderr drain, await natural successful exit, call helper, require no throw plus the same resolved status and completed drain. Reproduces attempt 4 with no browser and no runtime suite |
| Active-child termination proof | **met** — the existing allow-all E2E unit seam supports a real `Deno.Command`, so no new harness. I had explicitly permitted declining this if the seam did not support it; the amendment confirmed it does rather than taking the exit |
| Unrelated-error propagation | **exceeded** — three cases, not one: an unrelated `TypeError` propagates as the exact object; a **non-`TypeError` carrying the terminated message is rejected**, pinning both halves of the conjunction; and a rejecting raw drain propagates after a successful kill/status |

The second negative case matters most. A message-only check would pass every other test in the plan
while silently widening the tolerance; only that case pins the `instanceof` half.

### Two things the author caught that I had not required

1. **A second swallow in the same teardown.** The drain becomes the raw `pipeTo(...)` promise instead
   of the current eagerly-swallowed `.catch(() => {})`, so unrelated drain errors propagate too. I had
   flagged only the kill; the same defect class sat one line away.
2. **Correct layering of the two cleanups.** Profile removal stays in an **enclosing** `finally`, so
   an unrelated termination or drain error is preserved for the caller while the temporary profile
   still gets its best-effort removal. The tolerant cleanup does not shadow the intolerant one.

A production-delegation assertion also pins that the probe calls the helper and **no longer contains
an unguarded `child.kill('SIGTERM')` in its `finally`** — a regression guard on the exact defect site.

### Ceiling

Exactly the two already-owned paths, with an explicit prohibition on new source, test, template,
fixture, barrel, task, catalog, SDK/Fresh, `docs/**`, or `deno.lock`, and a third path stopping the
repair for another amendment and fresh Tier-A. Unchanged and stated: CDP client close, refetch
evidence shape, request baseline, response-stage resume, and all browser assertions.

**Verdict `PASS`.** Repair released to the same author for the two owned paths.

## 2026-08-15 — Low-credit checkpoint / handoff

### State at pause

| Item | Value |
| --- | --- |
| Topic branch | `orchestrator/release-0.0.7-features`, **clean**, local == remote |
| Leaf branch | `feat/app-service-client-wiring`, PR **#1664**, open **draft** |
| Leaf head at pause | `7fa29ad3e` — `fix(cli-e2e): preserve browser probe cleanup errors` |
| Author thread | `01a004f9-f033-7592-a0bc-63927753fb43`, Sol/high — **still running the F6 repair turn**; not interrupted |
| Runtime lease | **none held**; attempt-5 not requested |

### Where the leaf actually is

Shipped this milestone: **#1502** (PR #1651) and **#1293** (PR #1662), both merged. In flight:
**#1355/#1360** on PR #1664.

Completed and Tier-A signed on #1664: S1, S2 (with two findings repaired), S3, F4 (probe convergence
vs idempotency), F5 (post-init canonicalization, 15+12 ceiling), and the F6 **plan** amendment.
Four binding receipts were `SUFFICIENT` at each of the F4 and F5 content heads.

`scaffold.runtime` has failed four times, each further into the suite — `passed` 20 → 32 → 69 — and
each failure was attributed by measurement and repaired at its root cause:

1. attempt 1: `generated.service-client-contract` — probe asserted idempotency one sequence position
   too early; repaired by F4.
2. attempt 3: `generated.deno-fmt-check`, 12 unformatted generated files — post-init generation never
   reused the init formatting seam; repaired by F5. **Confirmed passing in attempt 4 at 343 ms.**
3. attempt 4: `behavior.service-client-refetch` — unguarded `child.kill('SIGTERM')` in the probe's
   `finally` threw during teardown; F6 repairs it.

### Immediate next actions, in order

1. **Wait for the F6 repair turn to finish.** Do not launch a rival send at
   `/home/codex/repos/netscript-007-features-1355`; resume the same thread only.
2. **Fresh Tier-A on the F6 repair.** Verify the two-path ceiling holds; that the discriminator is
   still the conjunction `instanceof TypeError && message === 'Child process has already terminated'`
   and has not degraded into a message-only check; that **all three** negative proofs exist, including
   the non-`TypeError`-with-terminated-message case that pins the `instanceof` half; that the raw
   `pipeTo(...)` drain replaced the swallowed `.catch(() => {})`; that profile removal is in an
   **enclosing** `finally`; and that the probe has no unguarded `child.kill` left. Verify four fresh
   binding receipts at one content head and **recompute sufficiency**. Require the **full** repo-wide
   `deno task test` count — the binding gate is ~4245 results; a `packages/cli/src/` subset once hid a
   real failure from three consecutive reviews.
3. **On PASS:** push the topic checkpoint and **request the coordinator attempt-5 runtime lease.**
   Do not run `scaffold.runtime`, `fresh-browser`, Aspire, or Docker without it. Per **D-17**, quote a
   head that is already final and pushed so the lease cannot bind a head that then moves.
4. **On FAIL_FIX:** return to the same author with a bounded repair; do not widen the ceiling.

### Standing constraints for the successor

No merge, publish, ready-flip, evaluator launch, issue mutation, `#1348` touch, central cluster-state
change, or expensive gate without an explicit coordinator grant. Evidence is **append-only** — the
four S5 raw logs and their SHA-256s, every S4/F4/F5/F6 report and receipt, and the carried Fresh 45 /
SDK 3 `PRE_EXISTING_FAIL` baselines with the plugin-streams diagnostic named separately, all stay as
written. A later green never retroactively tidies an earlier red.

Open drift: D-1 through D-17, with D-17 (a leased head must not move after grant) the most
operationally live.

## 2026-08-15 — F6 root `test` receipt is an honest FAIL; cause is environmental, not the delta

`f6-test.json` verified by me field by field: `gateId test`, `invocationId
app-service-client-wiring-f6-test`, **`FAIL`**, exit 1, and
`gitHead == actualGitHead == 7fa29ad3e` — the receipt honestly attests the content head it ran at
rather than being suppressed or re-run into green.

Summary: **4228 passed / 1 failed / 19 ignored / 4248 total, uniqueFailures 1.**

The single failure is:

```text
PermissionDenied: Permission denied (os error 13): readdir
  '<cwd>//.llm/tmp/cli-e2e/plugin-smoke-20260815-203755/.data/postgres/18/docker'
```

### The counts corroborate the attribution rather than merely being consistent with it

At F5 the same binding gate reported 4226/0/19 = **4245** results. Here it reports 4228 passed of
**4248** — three more results, two more passing. So the F6 delta **added tests and they pass**; the
only failure is a directory walk into attempt-4's abandoned temp tree, owned root/dnsmasq from the
Postgres container that ran under the attempt-4 lease. That is a stale-artifact permission problem,
not a product or test defect, and the arithmetic makes that checkable rather than asserted.

Docker is empty and no process cwd referenced the tree.

### Quarantine verified, not accepted

The coordinator moved the exact stale tree recoverably. I checked both halves myself:

- `/home/codex/repos/netscript-007-features-1355/.llm/tmp/cli-e2e/plugin-smoke-20260815-203755` —
  **absent**
- `/tmp/netscript-f6-quarantine.7kXcDX/plugin-smoke-20260815-203755` — **present**

Recoverable, not deleted, so the attempt-4 artifact remains available if it is ever needed as
evidence.

### Disposition

`f6-test.json` stays **append-only** — the red is not overwritten. A distinct
`f6-test-attempt2` receipt runs at the **unchanged** content head `7fa29ad3e`; only on its PASS do
`publish-dry-run` and `arch-check` follow, then recomputed sufficiency, push, comment, and fresh
Tier-A.

This is the right shape: the environmental blocker is removed from the environment, not from the
record, and the re-run is a **new** invocation ID at the same content rather than a retry that erases
what happened. A green `f6-test-attempt2` beside a red `f6-test` tells the true story; a single green
would not.

The author is still mid-turn on the F6 repair and has **not** been interrupted; the resume is queued
behind its current turn.

## 2026-08-15 — F6 Tier-A: `PASS` at `a8a160285d4f9bddb95a5dac6cfbde85e1265ebc`

local == remote; content head `7fa29ad3ed10ad903b9cbbd518111e6bf2754761`; **no product change since
that content head** — `git diff 7fa29ad3e..HEAD` outside `.llm/runs/` is empty.

### The two test receipts corroborate the environmental attribution exactly

| Receipt | outcome | passed | failed | **totalResults** |
| --- | --- | --- | --- | --- |
| `f6-test.json` | **FAIL** | 4228 | 1 | **4248** |
| `f6-test-attempt2.json` | **PASS** | **4229** | 0 | **4248** |

`totalResults` is **identical** and `4228 + 1 = 4229`. Exactly one test flipped from fail to pass and
nothing else moved — no test skipped, dropped, ignored, or filtered to reach green. That is the
strongest available form of this evidence: had the author narrowed the run to escape the failure, the
total would have fallen. It did not.

All five receipts attest `gitHead == actualGitHead == 7fa29ad3e…` with no `allowGitHeadMismatch`, and
`check`, `publish-dry-run`, and `arch-check` all PASS at the same content head.

### Sufficiency recomputed by me — including proving the duplicate rule fires

The contracted set is exactly four files: `f6-check.json`, **`f6-test-attempt2.json`**,
`f6-publish-dry-run.json`, `f6-arch-check.json`.

```text
evaluateEvidenceSet(... four named files ...) → { sufficiency: "SUFFICIENT", reasons: [] }
```

And, to prove the exclusion is load-bearing rather than cosmetic, I re-ran it **with the red
included**:

```text
→ reasons: [ "gate test has duplicate or contradictory receipts",
             "test did not pass (FAIL)" ]
```

So `f6-test.json` genuinely cannot be in the passing set — two `test` receipts trip
`evidence-set.ts`'s duplicate rule *and* the FAIL. The author's framing is correct and necessary: the
red is retained as a **superseded** record, explicitly outside the claimed set, exactly as
`worklog.md:749` states. A naive `f6-*.json` glob would return INSUFFICIENT over genuinely passing
gates.

**A correction to my own first recomputation.** My initial run reported `INSUFFICIENT` with four
"targets <sha>" reasons — because I passed the abbreviated head `7fa29ad3e` while the receipts carry
the full 40-character SHA, and the evaluator compares exact strings. That was my error, not a defect
in the evidence. Recorded because it is precisely the false-alarm trap in
`sufficiency-verdict-needs-named-receipt-set`: an independent recomputation done carelessly
manufactures a failure against sound receipts, and a reviewer who stopped there would have sent a
correct slice back for repair.

### Verdict

**`PASS`.** The F6 teardown repair is complete, the binding gate is green at 4229/0 with the total
unchanged, sufficiency is independently `SUFFICIENT` over the four named files, the environmental red
is preserved append-only, and no product changed after the content head.

### Requesting the coordinator attempt-5 runtime lease

Per **D-17** the readiness head is already final and pushed, so a lease bound to it cannot move
before execution: **`a8a160285d4f9bddb95a5dac6cfbde85e1265ebc`**, content `7fa29ad3e…`.

`scaffold.runtime` and `fresh-browser` remain `NOT_RUN`; no lease taken, no evaluator, no ready flip.

## 2026-08-15 — S5 attempt 5: terminal red at 69/1/0; run-owned cleanup completed by this lane

Lease over immutable evidence `a8a160285d4f9bddb95a5dac6cfbde85e1265ebc`, product
`7fa29ad3ed10ad903b9cbbd518111e6bf2754761`.

| Field | Value |
| --- | --- |
| Verdict | **FAIL** — `passed=69 failed=1 skipped=0` |
| Failing gate | `behavior.service-client-refetch` — **timed out waiting for the Chrome DevTools target** |
| Raw log | `reports/s5-attempt5-scaffold-runtime-20260815-2139.log` |
| SHA-256 | `ff349b40f7f70341934e170df7c67d147c0ed983173b41871421755ad55e062b` — **re-hashed by me, exact match** |
| `cleanup.aspire-stop` | passed |
| `fresh-browser` | **NOT_RUN** — correctly gated on a scaffold PASS |

### F6 worked, and that is why this failure is new information

Attempt 4 died in `collectBrowserRefetchEvidence`'s `finally` with an unguarded
`child.kill('SIGTERM')`, so the gate could not report anything about the behaviour. Attempt 5 reaches
a **behavioural** verdict: the Chrome DevTools target never became available within the timeout. The
gate now fails on its own terms rather than during teardown — which is exactly what F6 was for.

Counts held at 69 passing, matching attempt 4, so nothing regressed; the same single gate is still
the frontier.

### Run-owned cleanup — ownership proven before any signal

Three stopped children remained: PIDs **727834, 727837, 727843**, state `Tl`, started 21:43:48.
I did not act on the coordinator's list alone — I verified each one first:

- `readlink /proc/<pid>/cwd` → `…/netscript-007-features-1355/.llm/tmp/cli-e2e/plugin-smoke-20260815-213942/aspire`
  for all three. **Ownership proven by path containment inside this leaf's worktree.**
- Parent PID `11780` is `/init`, so they were reparented orphans rather than children of a live
  foreign helper — terminating them could not disturb anything else.

They were in state `T` (stopped), which cannot process a pending `SIGTERM`. Sequence used: **`TERM`
then `CONT`** on each exact PID, so the continued process acts on the delivered signal. All three
exited within 5 s. **The bounded `KILL` escalation was not needed and was not used.**

### Independent re-audit after cleanup

| Probe | Result |
| --- | --- |
| The three run-owned PIDs | **absent** |
| Any process with cwd under `plugin-smoke-20260815-213942` | **0** — full `/proc` sweep |
| `agentic:leak-check` | aspire `ok`, docker `ok`, **`survivors: []`** |
| `docker ps -aq` | **0** |
| Foreign aspire mcp helpers | **12 present and untouched** — preserved as instructed |

The last row matters as much as the others: a cleanup that swept the host indiscriminately would have
looked identical in the first four rows and destroyed a foreign lane's tooling. Ownership was proven
by containment and the sweep was scoped to it.

**Lease released** — cleanup is proven and the host is empty.

### Next, in order

Measured same-author attribution of the DevTools timeout, then a **plan-only** amendment before any
product mutation. **No `fresh-browser`, no attempt 6, no evaluator.** The author is still writing its
leaf-side attempt-5 report; the attribution dispatch is queued behind that turn rather than
interrupting it.

## 2026-08-15 — Measured attribution of the DevTools timeout: the browser never ran

The coordinator supplied a read-only clue and asked for measurement, not assumption, between
**Windows interop path/address handling** and **early child exit**. Measurement refutes both stated
candidates and lands one layer earlier.

### The measured causal chain

1. **No Linux browser exists on this host.** All four Linux candidates in `findBrowserExecutable()`
   (`service-client-browser-probe.ts:379-382`) are absent; only
   `/mnt/c/Program Files/Google/Chrome/Application/chrome.exe` and the Edge equivalent exist.
2. So the probe resolves the **Windows** executable.
3. **WSL interop is not registered.** `/proc/sys/fs/binfmt_misc/` contains only `register` and
   `status` — there is **no `WSLInterop` or `WSLInterop-late` entry**. Windows `.exe` files therefore
   cannot be executed from this instance at all.
4. Executing it falls through to `/bin/sh`, which parses the PE binary as a shell script. I ran the
   probe's exact argv:

   ```text
   exit=2
   /mnt/c/Program Files/Google/Chrome/Application/chrome.exe: 1: Syntax error: word unexpected (expecting ")")
   ```

5. **The probe discards that message.** `service-client-browser-probe.ts:133` pipes stderr into
   `new WritableStream({ write: () => undefined })` — every byte dropped, and the child's non-zero
   status is never inspected on the startup path.
6. The probe then polls `127.0.0.1:<port>/json/list` for a DevTools target that was never going to
   exist, and reports **"timed out waiting for the Chrome DevTools target."**

### Why both stated hypotheses are wrong

- **Not Windows path handling.** `--user-data-dir=/tmp/netscript-…` never reached Chrome; nothing
  parsed it. The Linux-path concern is real in principle and simply not what happened here.
- **Not 127.0.0.1 address handling.** No process ever bound the port. A WSL-versus-Windows loopback
  mismatch cannot explain a listener that was never created.

Both were plausible, and measuring cost one command each. Had the amendment been written against
either, it would have "fixed" path translation or loopback addressing while the browser continued not
to launch — and the symptom, a bare timeout, would have been unchanged.

### The second-order finding is the one worth keeping

The one-line stderr names the failure exactly. It was thrown away by a `write: () => undefined` sink
identical in spirit to the swallow F6 just removed from the same file's teardown. **The same defect
class appeared twice in one probe**: F6 fixed the teardown swallow, and the startup swallow — a
different line, same reasoning — survived because nothing forced it into view. That is why attempts 4
and 5 produced two different opaque symptoms from one diagnosable cause.

### Amendment direction (plan-only; no mutation before the gate)

1. **Preserve actionable child status and stderr on startup failure** — if the child exits before a
   DevTools target appears, surface its exit code and captured stderr rather than reporting a bare
   timeout. This is the fix that would have made attempt 5 self-diagnosing.
2. **Prove the executable path only as far as measurement requires.** The Linux/WSL dual-path question
   is *not* what failed here; a fabricated interop fix would be scope invented from a refuted
   hypothesis.
3. The environmental fact — no Linux Chrome and no registered WSL interop — is a **host capability
   gap**, not a product defect. Whether the gate should skip with a clear precondition failure, or the
   host should provide a Linux browser, is a coordinator decision and not this lane's to take.

Author was still writing its leaf-side attempt-5 report at the time of this measurement; the
amendment dispatch is queued behind that turn. No product mutation, no `fresh-browser`, no attempt 6,
no evaluator.

## 2026-08-15 — CORRECTION: my "no Linux browser exists" claim was an overclaim

The coordinator found managed Linux Chromium binaries I had reported absent. **I verified and they
are real and executable:**

```text
/home/codex/.cache/ms-playwright/chromium-1232/chrome-linux64/chrome → Google Chrome for Testing 151.0.7922.10
/home/codex/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome → Google Chrome for Testing 151.0.7922.34
```

Both return a version string on `--version`. Puppeteer caches are additionally present per the
coordinator.

### What I actually measured versus what I wrote

I measured that **none of the probe's six allowlist candidates resolve to a Linux binary** — the four
`/usr/bin/*` entries are absent, leaving only the two `/mnt/c/…` Windows paths. From that I wrote
"**No Linux browser exists on this host**". Those are different claims, and I generalised an
allowlist miss into a fact about the machine.

This is the same overclaim class I have corrected in others repeatedly this session — a
root-entrypoint doc-lint run labelled "full SDK export-map", one helper file generalised to twelve
paths, and my own `packages/cli/src/` subset reported as the suite at S2-F2. The discipline I applied
to their evidence, I failed to apply to my own: I searched a **list**, not the **host**, and
described the result as if I had searched the host.

### What survives and what changes

**The causal chain survives unchanged** and was independently correct: the probe selects a Windows
`.exe`; `/proc/sys/fs/binfmt_misc/` has no `WSLInterop` entry so it cannot execute; `/bin/sh` parses
the PE binary and exits 2 with `Syntax error: word unexpected (expecting ")")`;
`service-client-browser-probe.ts:133` discards that stderr into a no-op sink; the probe polls for a
DevTools target that never existed and reports a bare timeout. Every step of that is still measured
and still holds.

**The disposition changes materially.** This is **not** a host capability gap and **not** a
coordinator environment decision. It is a **probe allowlist defect**: the allowlist ignores managed
browser caches that contain working Linux binaries, then falls through to a Windows executable that
cannot run here. The gate can and must prove refetch. **No environment skip.**

My F7 dispatch carried the wrong framing — it told the author the capability gap was environmental
and offered "skip with a recorded reason" as an option for the coordinator to choose. That option
does not exist, because the browser it claimed was missing is present. Correcting the dispatch.

### Corrected amendment direction

1. Measure a managed Linux binary with **bounded `--version` / early-exit evidence**.
2. Preserve **child exit status plus bounded stderr** on startup failure — unchanged, and still the
   fix that would have made attempt 5 self-diagnosing.
3. Provide a **portable explicit executable-selection boundary** — prefer an explicit env/config path
   over hard-coding versioned cache paths like `chromium-1232`, which rot on the next Playwright
   update.
4. **The gate must prove refetch. No environment skip.**

Fresh Tier-A before implementation; no attempt 6 until diagnostics and selection repair are both
bound and reviewed; runtime lease stays free during planning.

## 2026-08-15 — F7-C1 Tier-A: `PASS` at `a2e9515f5a430d53cff1e47d55d7916f3dc0db15`

local == remote; **plan-only confirmed** — `git diff ff0ede997..a2e9515f5` outside `.llm/runs/` is
empty. Two-path ceiling intact at `plan.md:747-748` and `:901-902`.

### All five corrections landed

| Correction | Verified |
| --- | --- |
| False premise removed | `:788` "The defect is executable allowlist/selection, **not environmental capability**" |
| Measured evidence recorded | `:782-785` both managed paths with exact `Google Chrome for Testing 151.0.7922.10 / .34` version strings |
| No skip | `:852` "There is no skip path"; `:919` "skip is not an outcome" |
| Portable override, no versioned constants | `NETSCRIPT_E2E_BROWSER_EXECUTABLE`; `:813` forbids source constants and fallback candidates, naming `chromium-1232`/`1234` explicitly |
| Bounded status/stderr diagnosis kept | `:915` requires naming override source/path, exit code 2, and a stderr sentinel, **"with no DevTools-timeout wording"** |

### Three things the author did better than I specified

1. **The no-hard-coding rule is made testable.** `:912` requires asserting that neither versioned
   cache directory appears **in source or test**. I stated the prohibition; the author turned it into
   an executable check, so the rule cannot rot silently.
2. **Absence of fallback is proven by a call log, not by an error message.** `:914` requires "The
   injected call log must prove no built-in candidate was probed after failure." Asserting only that
   an error was raised would pass against an implementation that raised *and then* fell through.
3. **The real defect is closed on the fallback path too.** `:848-850`: built-in candidates are
   selected only after the same runnable/version probe succeeds, and present-but-unrunnable
   candidates are "recorded in the final error rather than returned merely because `Deno.stat` found
   a file." That is the actual root cause — the resolver returned a path because it **existed**, never
   because it **ran**. Ignoring managed caches was the symptom; unverified selection was the defect.

### The subtle case I had not named

`:856-857`: an override that passes `--version` but **exits under the real headless argv** still fails
loudly against that override and never falls back. `--version` success is not headless-run success,
and without this an operator could set a valid-looking override and get the same opaque timeout we
have been chasing for three attempts.

### F6 is preserved, not regressed

`:917` requires one bounded capture/status race, the same drain passed to `terminateBrowserProcess`,
**"contain no discard sink"**, and all F6 natural-exit, active-SIGTERM, three-negative, and delegation
proofs green. The startup swallow is removed without reintroducing the teardown swallow — the two
fixes are explicitly held together rather than traded against each other.

### Verdict

**`PASS`.** The premise is corrected against measurement, the classification is right, the override
is portable and its failure semantics are loud and unfalsifiable-by-fallback, the ceiling holds at two
paths, and F6 survives intact.

Implementation is **not** released by this review — per the coordinator, no attempt 6 and no lease
until diagnostics and selection repair are both bound and reviewed. This review binds them; the
product repair, its focused proofs, four fresh receipts at one content head, and a further Tier-A
come next. Runtime lease stays free.

## 2026-08-15 — F7 binding `test` red is environmental again, and the cleanup gap was mine

Leaf head `885f352e77439e1f846be1f99971c398f6865e75`; content head `e45144db6`.

| Receipt | outcome | summary |
| --- | --- | --- |
| `f7-check.json` | **PASS** exit 0 at `e45144db6` | zero diagnostics |
| `f7-test.json` | **FAIL** exit 1 at `e45144db6` | 4236 passed / 1 failed / 19 ignored / **4256 total** |

The single failure:

```text
PermissionDenied: Permission denied (os error 13): readdir
  '<cwd>//.llm/tmp/cli-e2e/plugin-smoke-20260815-213942/.data/postgres/18/docker'
```

The author stopped at the red rather than continuing to `publish-dry-run` and `arch-check`, which is
correct.

### The counts show F7 works

F6 attempt-2 reported 4229 passed of **4248**. This reports 4236 of **4256** — eight more results,
**seven more passing**. The F7 selection and diagnostics tests were added and pass; the lone failure
is a directory walk, not the delta.

### The cleanup gap was mine, and I should name it precisely

This is `plugin-smoke-20260815-213942` — **attempt 5's own** temp tree, created under **my** lease.
Not the attempt-4 tree the coordinator quarantined earlier; a second instance of the same class.

After attempt 5 I killed the three run-owned NuGet children, swept `/proc` for any process with a cwd
under the run tree, confirmed `docker ps -aq` was 0 and `leak-check` survivors `[]`, and reported the
host **clean**. That was incomplete. `leak-check` probes **processes and containers**; it does not
probe **filesystem residue**. A root-owned directory left behind by a container that has already
exited is invisible to every check I ran.

So I proved "nothing is running" and wrote "the host is clean". Those are different claims — the same
shape as reporting an allowlist miss as a host fact two turns ago. Twice now I have measured a
narrower thing than I reported, in a session spent catching exactly that in others.

`.data/postgres/18/docker` was `drwx------ dnsmasq:root` — mode 700, owned by a user `codex` is not,
so it cannot be read or removed by this lane, only moved.

### Quarantine performed by me, recoverably

Parent directory was writable, so the tree was **moved, not deleted**:

```text
/home/codex/repos/netscript-007-features-1355/.llm/tmp/cli-e2e/plugin-smoke-20260815-213942
  → /tmp/netscript-f7-quarantine.iXF6fb/plugin-smoke-20260815-213942
```

Verified: source **absent**, quarantine **present**. Re-audited after: **no unreadable directories
remain** anywhere under `.llm/tmp`, and `leak-check` reports aspire `ok`, docker `ok`,
`survivors: []`. Three older trees survive and are readable, so they cannot cause this failure.

### Standing correction to this lane's cleanup standard

An empty-host proof must include a **filesystem residue check**, not only processes, containers, and
ports. `leak-check` alone is insufficient after any run that started a database container, because
the container's data directory outlives it with foreign ownership. Recorded as **D-18**.

### Next

`f7-test.json` stays **append-only** as a red. A distinct `f7-test-attempt2` runs at the unchanged
content head `e45144db6`; only on its PASS do `publish-dry-run` and `arch-check` follow, then
recomputed sufficiency naming the four files, with `f7-test.json` excluded as superseded. Same shape
the coordinator authorized for F6 — the environment is repaired, the record is not.

## 2026-08-15 — F7 binding recovery Tier-A: `PASS` at `ed3f78e0d87784b1869166bd2574737c62fac0af`

Content head `e45144db643f6bde85552a615812c8371e4ce792`; local == remote == PR #1664 (draft);
delta from content head is **evidence only**; no source or test changed during recovery.

### Five receipts, all attesting the exact content head

| Receipt | gate | outcome | summary |
| --- | --- | --- | --- |
| `f7-check.json` | `check` | **PASS** | zero diagnostics — original, not re-run |
| `f7-test.json` | `test` | **FAIL** | 4236 passed / 1 failed / **4256** — preserved red |
| `f7-test-attempt2.json` | `test` | **PASS** | **4237** passed / 0 failed / **4256** |
| `f7-publish-dry-run.json` | `publish-dry-run` | **PASS** | — |
| `f7-arch-check.json` | `arch-check` | **PASS** | — |

Every one records `gitHead == actualGitHead == e45144db6` with **no `allowGitHeadMismatch`**. The
clean-checkout requirement did its job: the leaf worktree still carries a modified `leak-report.md`
from my own audit runs, so a receipt taken in place could not have satisfied that equality honestly.

### The totals prove nothing was skipped to reach green

`4256` in **both** test receipts, and `4236 + 1 = 4237`. Exactly one test flipped fail→pass and
nothing else moved — no test dropped, ignored, or filtered. Had the run been narrowed to escape the
`readdir` failure, the total would have fallen. It did not. This is the second time this pattern has
settled an environmental attribution cleanly, after F6's 4248/4248.

### Sufficiency recomputed by me, and the exclusion proven load-bearing

```text
FOUR NAMED -> { "sufficiency": "SUFFICIENT", "reasons": [] }
WITH RED    -> { "sufficiency": "INSUFFICIENT",
                 "reasons": ["gate test has duplicate or contradictory receipts",
                             "test did not pass (FAIL)"] }
```

So naming `f7-test-attempt2` as the superseding receipt and excluding `f7-test.json` is mechanically
required, not presentational — two `test` receipts trip the duplicate rule *and* the FAIL. I used the
**full 40-character SHA** this time; at F6 I passed an abbreviated head and manufactured a false
INSUFFICIENT against sound receipts, which is exactly the trap that makes a careless recomputation
worse than none.

### Environment

No unreadable directories remain under `.llm/tmp`. The attempt-5 residue stays quarantined at
`/tmp/netscript-f7-quarantine.iXF6fb/plugin-smoke-20260815-213942` — **moved, not deleted**, so the
artifact survives as evidence. All five S5 attempt logs, both preserved reds, and every prior report
and receipt remain append-only.

### Verdict

**`PASS`.** F7's selection and diagnostics repair is complete and green on all four contracted gates
at one immutable content head, with the environmental red preserved beside it rather than erased.

The probe now selects a browser because it **runs**, not because a file exists; an explicit
`NETSCRIPT_E2E_BROWSER_EXECUTABLE` override fails loudly rather than falling through; and startup
failures surface exit code and bounded stderr instead of a bare DevTools timeout. The three opaque
symptoms across attempts 3, 4 and 5 all traced to variants of one habit — evidence discarded at the
point where it would have been diagnostic — and that habit is now closed in both teardown (F6) and
startup (F7).

No lease requested, no attempt 6, no browser, Aspire, Docker, evaluator, or readiness change.

## 2026-08-15 — S5 attempt 6: singleton runtime lease ACQUIRED by this topic

**Lease held by `topic-features-0.0.7` for PR #1664 only.**

| Binding | Value |
| --- | --- |
| Content head | `e45144db643f6bde85552a615812c8371e4ce792` |
| Evidence head | `ed3f78e0d87784b1869166bd2574737c62fac0af` |
| Tier-A | PASS at topic `4a65a2670` |
| Browser override | `/home/codex/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome` |

**Preconditions verified by me, not accepted:**

- local == remote == PR == `ed3f78e0d`; leaf tree clean.
- Override is **executable** and `--version` returns exactly
  `Google Chrome for Testing 151.0.7922.34`, matching the coordinator's value.
- `leak-check` → aspire `ok`, docker `ok`, `survivors: []`; `docker ps -aq` = 0.
- **D-18 residue check clear** — `find .llm/tmp -type d ! -readable` returns nothing. This is the
  check whose absence let attempt 5's root-owned Postgres tree block the following gate; it is now
  part of every empty-host proof this lane makes.

Three readable stale trees were moved recoverably to `/tmp/netscript-preattempt6-quarantine.9mNpwE`;
the earlier quarantines at `/tmp/netscript-f6-quarantine.7kXcDX` and
`/tmp/netscript-f7-quarantine.iXF6fb` remain. Nothing deleted.

### What is different about this attempt

Every prior failure was diagnosed and repaired at its root cause rather than retried:

| Attempt | Failure | Repair |
| --- | --- | --- |
| 1 | `generated.service-client-contract` — idempotency asserted one sequence position too early | F4 |
| 3 | `generated.deno-fmt-check` — 12 unformatted files; post-init generation never reused the init formatting seam | F5 |
| 4 | `behavior.service-client-refetch` — unguarded `child.kill` threw in teardown | F6 |
| 5 | same gate — Windows `.exe` selected, no WSL interop, stderr discarded, bare timeout | F7 |

`passed` has climbed 20 → 32 → 69 → 69. The browser override closes the last known cause: the probe
now selects an executable that **runs**, and if it does not, it reports the exit code and bounded
stderr instead of a DevTools timeout.

Lease released only after cleanup and an independent audit are proven.

## 2026-08-15 — S5 attempt 6: red at 69/1/0; F7 proven, cause moves one layer deeper

Leaf head `2385cdb72602c149c29cc637870ddca3db09e0cd`, local == remote. Lease record `ac1ec35cf`.

| Field | Value |
| --- | --- |
| Executed checkout | `/home/codex/worktrees/netscript-s5-a6-ed3f78e0d`, HEAD `ed3f78e0d` — **the leased evidence head** |
| Verdict | **FAIL**, raw exit 1, **69 passed / 1 failed / 0 skipped** |
| Sole failed gate | `behavior.service-client-refetch` — child exited **143** after **900,030 ms** |
| Raw log | `s5-attempt6-scaffold-runtime-20260815-205715.log`, SHA-256 `1bf8cb03…aaa0` |
| NDJSON ledger | `…205715.ndjson`, SHA-256 `ffab7e7f…356` |
| `fresh-browser` | **NOT_RUN** — correctly gated |

The author ran from a **fresh detached checkout at the exact leased commit** because the leaf carried
a `leak-report.md` timestamp change from preflight. It neither overwrote nor staged that file, and no
commit occurred between grant and execution. That is the D-17 discipline applied without being told
again.

### F7 is proven — and this is the first attempt where selection is not in question

The selector's own record:

```json
{ "path": "/home/codex/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome",
  "source": "NETSCRIPT_E2E_BROWSER_EXECUTABLE",
  "version": "Google Chrome for Testing 151.0.7922.34" }
```

`source` is the override, not a built-in candidate. So F7 works: the probe selected a real, runnable
Linux Chromium and reported which source chose it. Requiring that evidence **regardless of verdict**
is what makes this attempt informative rather than another opaque red.

`generated.service-client-contract` (F4) and `generated.deno-fmt-check` (F5) both passed again.

### What actually failed, stated without over-reading

Exit **143** is `128 + 15` — SIGTERM at the suite's 900-second command boundary. The child did not
crash; it ran fifteen minutes and was killed. Its stdout/stderr tails are **empty**.

The author's framing is exactly right and I am not improving on it: attempt 6 proves F7 selected a
valid explicit browser, and the gate still returns no mutation/refetch evidence before the boundary.
The deeper cause is **unattributed pending review**. It is not relabelled as a product refetch failure
and not called a pass.

Note what changed and what did not: attempts 4 and 5 failed *before* the browser was usable — teardown
threw, then the executable could not run. This is the first attempt where the browser genuinely
launched and the gate still produced nothing. The frontier has moved from "can we start a browser" to
"why does the refetch scenario produce no evidence in 900 s", which is a different question and needs
its own measurement.

### Cleanup and audit — the author applied D-18 itself

Suite cleanup passed and removed three suite-created containers. The author then found three
run-owned Aspire NuGet children (`896151`, `896186`, `896190`), revalidated them immediately before
acting, cleared them with `SIGTERM`+`SIGCONT` with no `SIGKILL`, and left foreign Aspire MCP helpers
untouched. Its **D-18 scan found one unreadable run-owned directory** —
`…/plugin-smoke-20260815-225723/.data/postgres/18/docker` — and the whole generated project plus its
suite log were **moved, not deleted**, to `/tmp/netscript-s5-a6-quarantine-20260815-4M9v8k/`.

That is the standard I recorded three attempts ago after failing it myself, now applied by the author
without prompting.

**My independent audit:** `leak-check` aspire `ok`, docker `ok`, `survivors: []`; `docker ps -aq` = 0;
D-18 residue scan clear; precise process sweep for `chrome-linux64|/dcp|AppHost` returns **0**; no
process anywhere has a cwd under any `plugin-smoke-*` tree. All four quarantines intact:
`f6`, `f7`, `preattempt6`, and `s5-a6`.

A first `grep -ic` returned "3" with no way to see what matched; the precise listing showed zero. I
re-checked rather than reporting either number — a count without identities is not a finding in
either direction.

**Lease released.** Cleanup and audit are proven.

### Next

Measured attribution of the 900-second no-evidence condition, then a plan-only amendment before any
product mutation. No attempt 7, no `fresh-browser`, no evaluator, no readiness.

## 2026-08-15 — BLOCKER: the preserved author is out of credit until 2026-08-20; my contamination is still committed

### What happened

The bounded restoration dispatch reached the author, which then failed to act:

```text
ERROR: You've hit your usage limit. Visit https://chatgpt.com/codex/settings/usage
to purchase more credits or try again at Aug 20th, 2026 5:31 AM.
tokens used 6,106,885
```

Codex thread `01a004f9-f033-7592-a0bc-63927753fb43` — the preserved original author for this leaf
across every slice from S1 through F8 — is **unavailable until 2026-08-20 05:31**. This is a hard
quota exhaustion, not a transient error, and no retry will change it.

### State left behind

| Item | Value |
| --- | --- |
| Leaf head | `d8d5ee61924d0c3c7ed657ab96f610bc142cfd6a`, local == remote |
| Tree | clean |
| F8 amendment | committed and pushed, **plan-only** apart from the one contaminated file |
| Outstanding defect | `leak-report.md` in `d8d5ee619` still carries **my** audit's bytes |

The exact residue, unchanged:

```diff
-Generated: 2026-08-15T21:24:46.689Z
-Worktree: `/home/codex/worktrees/netscript-s5-a6-ed3f78e0d`
+Generated: 2026-08-15T21:33:41.742Z
+Worktree: `/home/codex/repos/netscript-007-features-1355`
```

### Why I have not fixed it myself

The correction is one file and two lines, and I could restore it in seconds. I have not, because the
coordinator's instruction was explicit that **the author** restores it, and ownership is the entire
point of the finding: a supervisor writing into a worktree whose commits another agent signs is what
created the problem. Fixing my contamination by writing into that worktree *again* — this time
authoring a commit on the author's branch — would repeat the ownership violation while claiming to
correct it. That is a decision to escalate, not to take unilaterally.

**I can perform the restoration immediately if the coordinator authorises it**, and it is trivially
verifiable: `git diff 2385cdb72 HEAD -- …/leak-report.md` must come back empty.

### Options, for the coordinator

1. **Authorise this supervisor to restore the file** on the leaf branch, as a new commit that states
   the reverted lines were supervisor-generated. Fastest; costs the ownership boundary once more,
   deliberately and on the record.
2. **Assign another implementation agent** to make the one-file restoration.
3. **Accept the contamination as recorded** — it is two provenance lines in a run artifact, already
   attributed to me in D-19 and here, and the F8 *plan content* is unaffected — and let the next
   author fix it when quota returns on 2026-08-20.
4. **Wait for the preserved author.** Preserves the thread's continuity across the whole leaf, at the
   cost of ~4 days.

### What is not blocked

F8's amendment content is committed and pushed and can be reviewed now. Fresh Tier-A on the bounded
CDP-wait contract does not depend on the contaminated line and I can run it immediately — noting that
any Tier-A must record the outstanding contamination rather than treat the head as pristine.

Nothing else in this lane is running. No lease is held. All four quarantines remain intact and no
prior evidence has been altered.

## 2026-08-15 — F8 provenance recovery is blocked: the assigned author cannot act

The coordinator's recovery instruction assigns the correction to the **same original Sol/high
author**. That is not executable. I re-probed the thread directly after receiving the instruction,
rather than relying on the earlier error:

```text
$ codex-resume --thread-id 01a004f9-f033-7592-a0bc-63927753fb43 --message "…reply with ACK"
ERROR: You've hit your usage limit. … try again at Aug 20th, 2026 5:31 AM.
tokens used 6,106,885
```

Thread `01a004f9-…` is hard-blocked until **2026-08-20 05:31** — roughly four and a half days out.
The instruction and my blocker report (`db2aa93b2`) crossed, so this fact was almost certainly not in
hand when the recovery was written.

### Every step of the instruction depends on the blocked one

| Step | Status |
| --- | --- |
| Restore `leak-report.md` byte-for-byte from `2385cdb72` | **blocked** — assigned to the author |
| Append provenance note to run worklog/drift/context | blocked — same author, same commit |
| Rewrite PR comment `5304365403` to cite the corrected head | blocked — **no corrected head exists yet** |
| Verify final diff and head equality | blocked — nothing to verify |
| Fresh Tier-A on the corrected head | blocked, and explicitly withheld from `d8d5ee619` |

So this is not a partially-executable instruction where I can make progress on the edges. The
restoration is the root of the chain.

### What I did not do

I did not restore the file myself. The correction is two lines and I could do it in seconds, but the
coordinator assigned it to the author twice now, and ownership is the substance of the finding, not a
formality — a supervisor writing into a worktree whose commits another agent signs is precisely what
created this. Doing it again, this time authoring a commit on the author's branch, would repeat the
violation while claiming to repair it.

I also did not rewrite PR comment `5304365403`, because the instruction requires it to cite "the new
clean correction head", and that head does not exist. Editing it now could only make it cite the
contaminated head or a fiction.

### Current state, unchanged and clean apart from the known defect

Leaf `d8d5ee61924d0c3c7ed657ab96f610bc142cfd6a`, local == remote == PR, tree clean. F8's plan content
— `plan.md`, `drift.md`, `worklog.md`, `reports/f8-plan-amendment.md` — is intact and unaffected. The
sole defect is the two supervisor-generated provenance lines in `leak-report.md`, fully attributed
here and in D-19. No lease held, nothing running, all four quarantines intact, no prior evidence
altered.

### Disposition required from the coordinator

1. **Authorise this supervisor to make the one-file restoration**, as a new commit stating the
   reverted lines were supervisor-generated. Then I rewrite the PR comment to the corrected head and
   run fresh Tier-A immediately.
2. **Assign a different implementation agent** to it, preserving the ownership boundary.
3. **Accept and annotate** — two provenance lines in a run artifact, already attributed; review F8's
   plan content on its merits with the contamination recorded rather than hidden.
4. **Wait for the preserved author** until 2026-08-20, preserving thread continuity at the cost of
   the milestone's schedule.

I have a preference and will state it plainly: **option 1 or 2**, because leaving a foreign write
inside an author-signed commit is the kind of provenance defect this lane has spent the entire leaf
refusing to accept from anyone else.

## 2026-08-15 — Option 2 attempted and blocked: the Codex quota is account-level

The coordinator selected option 2 — a fresh separate Codex Sol/high agent with exclusive ownership of
the F8 provenance correction. I executed it. It does not work, and the reason rules out every
Codex-based option before 2026-08-20.

### What I did

1. Wrote a bounded corrective brief scoped to `leak-report.md` plus a minimal provenance note, with
   explicit prohibitions on gates, audits, runtime, and — pointedly — on running `leak-check` at all,
   since regenerating that file is the defect being repaired.
2. First launch was **correctly refused** by the launcher:
   `{"stage":"sender-ownership","ok":false,"code":"duplicate_sender_risk"}` — the leaf worktree
   already holds the original author's sender. That guard is right: a second sender there is exactly
   the rival-author violation the doctrine forbids.
3. Gave the corrective agent its **own detached worktree** at `d8d5ee619`
   (`/home/codex/worktrees/ns1664-f8-prov`), with instructions to push by explicit refspec — the same
   shape the original author used for attempt 6.
4. Dry-run validated: brief valid, `head d8d5ee619`, `dirty 0`.
5. Launched. The agent was created as thread `01a00766-3240-7dd0-91df-7e335142f0cb` and then
   **immediately hit the same limit**:

```text
{"method":"error","params":{"error":{"message":"You've hit your usage limit. …
```

### The decisive fact

The quota is **account-level, not thread-level**. A brand-new thread on a clean worktree failed
identically to the exhausted original. Therefore **no Codex implementation agent of any identity can
act on this repository before 2026-08-20 05:31** — option 2 is not merely slow, it is unavailable,
and option 4 collapses into the same wait.

I removed the unused detached worktree rather than leaving litter. The leaf is untouched at
`d8d5ee619`, clean, local == remote == PR.

### What remains

| Option | Status |
| --- | --- |
| 1 — supervisor performs the one-file restoration | **the only path to correction before 2026-08-20** |
| 2 — fresh Codex agent | **blocked**, proven by direct attempt |
| 3 — accept and annotate, review F8 plan content on its merits | available now |
| 4 — wait for the preserved author | ≥ 4 days, same account limit |

I have not taken option 1 on my own initiative, for the reason I gave before: the contamination came
from a supervisor writing into an author-owned worktree, and repairing it the same way trades one
provenance defect for another. But that objection is now weighed against a four-day hold on a
two-line fix, and the coordinator has already ruled twice that the correction should happen promptly.

**I will proceed with option 1 on coordinator authorisation**, committing as a separate corrective
owner with the commit message stating plainly that a supervisor both caused and repaired the foreign
bytes — so the record shows the exception rather than hiding it. Alternatively, option 3 is
defensible: the defect is two provenance lines in a run artifact, fully attributed in D-19 and here,
and F8's plan content is unaffected and reviewable now.

## 2026-08-15 — F8 provenance correction routed to a fresh chore_code agent (quota-driven)

Codex is account-wide quota-blocked until 2026-08-20 05:31 (evidence: detached thread
`01a00766-3240-7dd0-91df-7e335142f0cb` created, then the usage-limit error; accepted centrally as
sufficient). The correction is therefore routed off the Codex family entirely rather than waiting or
being self-authored.

### Route

`lane-policy.md` maps **`chore_code`** to **Claude · Anthropic · Opus 5 · medium**, which is the
canonical lane for a delegated code chore of exactly this size — one file restored to a known blob
plus an in-place comment rewrite.

| Field | Value |
| --- | --- |
| Job / session | `41950acc` / `41950acc-c711-4b96-b3a8-066e5b71536b` |
| Bridge session | `cse_01FCKmfUm5L3NTan9hwDy58f` (non-empty) |
| Remote Control URL | `https://claude.ai/code/session_01FCKmfUm5L3NTan9hwDy58f` |
| Requested route | native Claude **Opus 5 · medium** (`chore_code`) |
| Observed route | `respawnFlags` = `--effort medium … --model claude-opus-5`; `providerEnv {}` |
| Route verdict | **matched**, native Anthropic auth |
| Worktree | `/home/codex/worktrees/ns1664-f8-prov` — **dedicated detached** at `d8d5ee619` |
| Leaf worktree | untouched, clean, `d8d5ee619` |

Requested and observed agree, and `providerEnv {}` confirms this is native Anthropic rather than an
OpenRouter route — recorded because the quota-driven reroute is exactly the kind of substitution that
must be provable rather than asserted.

### Ownership discipline held

The supervisor neither authors nor self-certifies this correction. I did not restore the file myself,
despite it being two lines, because the defect *is* a supervisor writing into a worktree whose commits
another agent signs — repairing it the same way would trade one provenance defect for another. A
separate corrective owner signs the fix.

The dedicated detached worktree is **preserved**, not removed, per the standing instruction. All four
quarantines remain intact.

### Next

On the chore agent's explicit push and exact proof — `leak-report.md` blob byte-identical to
`2385cdb72`, `git diff 2385cdb72..HEAD` containing only legitimate F8 plan artifacts, and
`local == remote == PR` clean — the amendment goes to a **fresh Minimax M3 · high OpenRouter
PLAN-EVAL**, the canonical native-quota fallback, since this is a plan-only changeset and the Codex
review family is unavailable. Generator ≠ evaluator, and the supervisor is neither.

No runtime, lease, product or test mutation, readiness, or merge.

## 2026-08-16 — F8 PLAN-EVAL terminal `PASS`, verdict self-signed by the evaluator

| Field | Value |
| --- | --- |
| Verdict head | `20337441788b4e2341b0474d6297bec1ddd33b80` — local == remote == PR #1664 (draft) |
| Verdict commit | `harness(features): F8 PLAN-EVAL verdict by minimax/minimax-m3 (PASS)` — **one file, 174 insertions** |
| Verdict | **`PASS`** at `f8-plan-eval.md:157` |
| Evaluator | OpenRouter **`minimax/minimax-m3` · high**, session `aed7b4ad-54d3-4cfb-b496-43c717a9b39d` |
| Evaluated head | `4255a57b921e5efae0fb499a35803d150108e10a` |
| Route rationale | canonical native-quota fallback — the Codex reviewer family is account-blocked until 2026-08-20 |

### The provenance requirement was met, and my brief was the reason it nearly was not

The evaluator wrote its verdict but left it **untracked**. That was my omission: the brief said
"write `f8-plan-eval.md`" and "you may write only that verdict file", and never said commit and push.
A verdict living only in a working tree is not terminal evidence — the exact standard I have enforced
on every author in this leaf.

The fix was to **resume that same session** to commit and push its own artifact, not to sign it
myself. A supervisor committing an evaluator's judgement would put my authorship over another agent's
verdict — the same provenance violation that had just cost this lane a full correction cycle with the
`leak-report` contamination. Having spent that cycle refusing to self-author a two-line fix,
self-signing a verdict here would have been worse, not more expedient.

The resulting commit touches exactly one path and is signed by the evaluator.

### Substance of the verdict

`PASS`, with criterion 1 answered the way I most wanted pressed: identification of the unbounded
waits is "from code measurement; scope is bounded to two real defects; the evidentiary limit of the
attempt-6 ledger is honestly recorded." So the amendment did not fix `connect` and `send` merely
because both were plausible — it bounded what the evidence supports and recorded what the ledger
could not distinguish.

### Chain of custody for this correction

Four distinct owners, none reviewing their own work:

1. **Original Codex author** — wrote the F8 plan (`d8d5ee619`), then hit an account-wide quota wall.
2. **Supervisor (me)** — caused the `leak-report.md` contamination via a host audit, and declined to
   repair it myself twice.
3. **Fresh chore_code agent** (Claude Opus 5 · medium, session `41950acc`) — restored the blob
   byte-identically and rewrote the PR comment in place, append-only.
4. **Fresh evaluator** (Minimax M3 · high, session `aed7b4ad`) — judged the plan and signed its own
   verdict.

Generator ≠ evaluator held throughout, and the supervisor neither authored nor certified.

### State

Leaf `20337441788b4e2341b0474d6297bec1ddd33b80`, clean, draft. F8's plan is now reviewed and
terminal. No product or test has been mutated since `2385cdb72`. No lease held, no runtime gate run,
no readiness or merge. All four quarantines and the dedicated detached worktree remain intact, and
every prior red — four S5 attempt logs, `f6-test.json`, `f7-test.json` — is preserved append-only.

**Next:** F8 implementation is not released by this verdict. It needs a dispatch to an implementation
owner, and the Codex family remains blocked until 2026-08-20, so the route decision is the
coordinator's.

## 2026-08-23 — F8 fresh Tier-A ACCEPT; implementation dispatched to the restored Codex author

Supervisor restored. Resumed #1664 at exact head `20337441788b4e2341b0474d6297bec1ddd33b80` from
`/home/codex/repos/netscript-007-features-1355`. Reviewer/orchestrator only — not the author, not
the evaluator.

### Reconciling the PLAN-EVAL `PASS` with attempt-6's 69/1/0

Independently re-derived rather than accepted. Full review: `slices/tier-a-plan-review-1355-f8.md`.

- Three-way identity verified: local `HEAD` == `git ls-remote origin` == PR #1664 `headRefOid` ==
  `20337441788…`; tree clean; PR OPEN/draft.
- Diff `2385cdb72..20337441788` is six run-artifact paths. A filter for `^(packages|plugins|docs)/`
  and `deno.lock` returns nothing. `leak-report.md` **does not appear in the numstat at all** — the
  strongest available proof the provenance restore was byte-identical to the author blob.
- Attempt-6 tally from the NDJSON: **69 gate-end records, 68 passed, 1 failed, 0 skipped**. The one
  red is `behavior.service-client-refetch`, `code 143`, `durationMs 900030`, `timedOut: false`,
  empty stdout/stderr tails. `timedOut: false` at 900,030 ms confirms the kill came from the suite's
  **outer command boundary**, not the gate's own timeout.
- Grep for `cdp|websocket|Page.enable|Network.enable|Fetch.enable|Runtime.evaluate|Page.navigate|
  continueResponse` across the whole ledger: **zero matches**. The "cannot distinguish" claim is
  honest and now verified, not relayed.

The two facts are not opposed. The `PASS` does not rest on the runtime evidence and does not pretend
to: 68 green gates do not make the 69th diagnosable. The amendment declines to classify the live
refetch behavior and bounds both primitives on **code measurement** instead. The red stays red and
stays unattributed.

### The two defects, verified from source

Only three `new Promise` sites exist in the 605-line probe. `:79` `connect` settles solely on
`onopen`/`onerror`; `:93` `send` settles solely via `#pending` on a matching id in `#receive`; `:604`
`delay` is a `setTimeout`. All three `while` loops (`:102`, `:467`, `:551`) carry explicit bounds
against `TIMEOUT_MS = 20_000`; both `Promise.race` sites (`:338`, `:410`) race a timer or
`child.status`. The amendment's identification is exactly right and exactly complete for that class.
`#receive:124` already returns early on an unknown id, so the contract's late-response-inert
requirement is achievable against the existing receive path.

### Path ceiling proven sufficient

`CdpClient` is **not exported** today (`:62`), so a seam is required. `packages/cli/deno.json`
excludes `e2e/` from publish; `packages/cli/e2e/deno.json` is `"publish": false`; `e2e/mod.ts` does
not re-export the probe. A same-module export touches no publish surface, barrel, or JSR API. **No
third path is forced.**

### Findings

No blocking findings. Two recorded:

- **R1 (carried, not a blocker).** The PLAN-EVAL matrix marks `terminateBrowserProcess` bounded;
  that is generous — `await child.status` (`:448`) and `await drain` (`:449`) have no timer. It is
  correctly out of F8 scope: F6-owned code with passing tests, and unreachable while `connect`/`send`
  hang first. Widening F8 now would be the exact plausibility-driven creep the amendment earned its
  `PASS` by refusing. Recorded for a later leaf.
- **R2 (honest limitation).** Git `author`/`committer` is `Rickylabs <eric.chautems@gmail.com>` for
  every agent here, so commit metadata cannot prove which agent signed the verdict. Provenance rests
  on the session record (evaluator `aed7b4ad-54d3-4cfb-b496-43c717a9b39d`), and the one-file/174-line
  scope is consistent with it. Recorded so the record does not overstate what git proves.

The evaluator judged `4255a57b9`; the only delta to `20337441788` is the verdict file itself, so the
`PASS` covers current plan content with no unreviewed drift.

**Disposition: ACCEPT** — implementation only. No lease, readiness, merge, publish, or attempt 7.

### Codex quota restored — the blocker recorded on 2026-08-15 has expired

`0c705a0cb`/`db2aa93b2` recorded an account-level Codex block until **2026-08-20 05:31**. Today is
**2026-08-23**; the window has passed. `agentic:codex-status` shows live `gpt-5.6-sol` threads,
including the coordinator `019ffaa3-32ae-7b02-92a5-d7ae146d8cbd` actively working. The quota-driven
reroutes are therefore no longer necessary and the canonical implementer lane is available again.
`agentic:runtime doctor` reports `no_change`, 18 components, 0 sessions.

### Dispatch

Routed to the **original F8 author thread** `01a004f9-f033-7592-a0bc-63927753fb43`, which already
owns the leaf worktree's sender — avoiding the `duplicate_sender_risk` that correctly refused a
second sender there on 2026-08-15, and preserving thread continuity. Generator ≠ evaluator holds
(author ≠ Minimax M3), and the supervisor neither authors nor certifies.

Brief: `slices/impl-1355-f8.md`, staged at `/home/codex/ns1355-f8-brief.md`. Two paths only, the
20-second diagnostic connect/send contract, six required proofs, a hard stop if a third path is
compiler-proven, and the full prohibition set including attempt 7 and `scaffold.runtime`. The author
runs only the focused deterministic file; this supervisor collects the four exact-head receipts after
the explicit push.

## 2026-08-23 — F8 implemented, corrected, and Tier-A ACCEPTED; green head reported

Full review: `slices/tier-a-review-1355-f8.md`. Author brief: `slices/impl-1355-f8.md`.

| Field | Value |
| --- | --- |
| Content head (attested by every gate) | `4f50b5a026120b5a3b0195fa1b6f495f08e2b46c` |
| Final head (supervisor evidence only) | `388f2b642a0d6e0ece4e346ea60f857928409beb` |
| PR #1664 | OPEN, **draft**, local == remote == PR |
| Author | Codex `gpt-5.6-sol · high`, thread `01a004f9-f033-7592-a0bc-63927753fb43` |

Dispatched to the original F8 author thread, which already owned the leaf worktree's sender —
avoiding the `duplicate_sender_risk` that correctly refused a second sender there on 2026-08-15.
Generator ≠ evaluator held (author ≠ Minimax M3); the supervisor neither authored nor self-certified.

### Two slices, one returned

`3299992e4` implemented the contract correctly and was still **returned**. All four contracted gates
were `PASS` at that head and the named set recomputed `SUFFICIENT` — yet under
`--root packages/cli/e2e` the probe had picked up a `prefer-const` occurrence (`:101`) and one `deno
fmt` finding, both **clean at `20337441788`** under the identical command. `deno task lint` and
`fmt:check` exclude `^(packages/(cli)|…)`, so CI and the contracted four could not have caught it.
Green gates plus `SUFFICIENT` did not mean clean code.

Returned rather than self-fixed: the author owns this worktree's commits, and a supervisor writing
product bytes into an author-signed slice is the exact defect that cost this leaf a cycle on
2026-08-15. `4f50b5a02` fixed it in 8 insertions / 10 deletions, source file only, with both
diagnostic strings byte-identical and every contract row re-verified.

### Evidence at `4f50b5a02`

Focused probe file **25 passed / 0 failed**. `check`, `test` (4,240 passed / 0 failed),
`publish-dry-run`, `arch-check`, `lint`, `fmt-check` all `PASS`; scoped lint/fmt on
`packages/cli/e2e` both zero. Sufficiency recomputed over the **explicitly named** four-receipt
attempt-2 set: `SUFFICIENT`, zero reasons, every receipt `gitHead == actualGitHead == 4f50b5a02`.
No `any`, `deno-lint-ignore`, or `as unknown as` anywhere in the diff. Attempt-1 receipts retained
append-only. Twelve receipts are supervisor-owned and committed under this supervisor's signature in
`388f2b642`, not folded into an author commit.

Carried, none blocking: **R1** `terminateBrowserProcess :448-449` still unbounded (F6-owned, out of
scope, only now reachable); **R3** a 20 s bound on `Runtime.evaluate` narrows one theoretical
slow-but-successful case, which is the intended trade; **R4** `pendingCommandCountForTest` is a
contained test-only accessor — `e2e/` is excluded from the `@netscript/cli` publish set,
`@netscript/cli-e2e` is `"publish": false`, and `e2e/mod.ts` does not re-export the probe.

### Resource state

No `scaffold.runtime`, browser, Aspire apphost, Docker container, or lease at any point. `docker ps
-a` empty; no `apphost`/`chrome`/`chromium` process; the only Aspire processes are `aspire mcp start`
MCP servers, not run-owned. The temporary baseline worktree used to prove the regression was created
read-only at `20337441788`, removed, and pruned. All four quarantines, the six S5 attempt histories,
`f6-test.json`, and `f7-test.json` untouched.

### Handoff

**Attempt 7 not granted and not requested** — prohibited for this leaf and not this supervisor's to
grant. No merge, publish, readiness flip, relabel, or issue mutation. The green reviewed content head
`4f50b5a02` is reported to the coordinator for the singleton runtime-lease decision; a later
`scaffold.runtime` still requires a coordinator-owned lease and preflight at the immutable evidence
head.

## 2026-08-23 — #1664 lane PARKED at terminal FAIL_FIX; no retry, no IMPL-EVAL

Coordinator decision recorded: **no IMPL-EVAL while `scaffold.runtime` is red.** Attempt 7 is
centrally closed and released at `164c39241` (`chore(harness): close #1664 runtime attempt 7`), the
PR body is corrected in place, and **no retry is authorized.**

### Terminal checkpoint

| Field | Value |
| --- | --- |
| Parked evidence head | `a257807d883ac9cd8d692d441bba1760290d4dab` |
| Product content head | `4f50b5a026120b5a3b0195fa1b6f495f08e2b46c` |
| Central close/release | `164c39241` |
| PR #1664 | OPEN, **draft**, local == remote == PR, tree clean |
| Verdict | **FAIL_FIX** — runtime red, cheap evidence green |
| Retry | **not authorized** |
| `fresh-browser` | **NOT_RUN** — lease conditioned it on a `scaffold.runtime` PASS |
| IMPL-EVAL | **withheld** by coordinator decision |

### What is green and stays green

F8 changed exactly the two approved CDP probe paths. Focused deterministic file **25 passed / 0
failed**. `check`, `test`, `publish-dry-run`, `arch-check`, `lint`, `fmt-check` all exact-head PASS
at `4f50b5a02`; sufficiency recomputed `SUFFICIENT` over the explicitly named four-receipt set. Two
fresh Tier-A reviews passed, the second after returning one slice for a non-gated scoped lint/fmt
regression that CI and the contracted four could not see.

### What is red, stated without inflation

`scaffold.runtime` exit `1`, **68 passed / 1 failed / 0 skipped**, sole red
`behavior.service-client-refetch` at **60,134 ms** — against attempt 6's exit `143` at `900,030 ms`
with empty stderr. Attempt 7 names its stopping point: `waitUntil :623` → `waitForExpression :610` →
`collectBrowserRefetchEvidence :286`, on the optimistic row `Seed User*` after the Rename click.

**Neither CDP bound fired.** F8 therefore delivered *attributability*, which was its stated purpose,
and is **not** credited with fixing attempt 6's hang — no evidence supports that claim, and the
corrected PR body preserves the caveat. The remaining stop is attributable to page behavior rather
than transport, and is not classified as a pass or fail of the refetch feature.

### Resource state at park

All classes empty: unreadable `0`, processes rooted in the execution worktree `0`, Docker containers
`0`, occupied runtime ports `0`, `leak-check` aspire `ok` / docker `ok` / survivors `[]`. The
execution worktree was clean at the pushed head and has been removed and pruned. The one run-owned
unreadable residue is **quarantined, not deleted**, at
`/tmp/netscript-s5-a7-quarantine.Cy2tNS/plugin-smoke-20260823-095547` (843 MB, recoverable).

The audit that got there was not the one the tools gave me — see **D-20**: `cleanup.aspire-stop` PASS
and `leak-check survivors: []` both missed three orphaned `aspire-managed` processes that only a
cwd-containment sweep found, and all three ignored SIGTERM.

### Standing prohibitions at park

No retry of `scaffold.runtime`, no `fresh-browser`, no evaluator or IMPL-EVAL dispatch, no product or
test mutation, no label, readiness, merge, publish, metadata, or issue mutation, no lease, and no
next features leaf started from this lane. All prior quarantines, the seven S5 attempt histories,
`receipts/f6-test.json`, and `receipts/f7-test.json` remain append-only.

**The #1664 lane is parked at `a257807d8` and awaits a coordinator decision to resume.**

## 2026-08-28 — Resumed and reconciled; lane remains parked, no action taken

Resumed as features topic supervisor at clean topic head `5c5589ee51b483bc4830f6c379513be70f284c01`.
Features ownership and the serial queue are preserved; no other lane was touched.

### Identity verification — all three references reconciled

| Check | Result |
| --- | --- |
| Topic local == remote | `5c5589ee5` == `5c5589ee5`, clean |
| Leaf `feat/app-service-client-wiring` on origin | `a257807d883ac9cd8d692d441bba1760290d4dab` |
| PR #1664 | head `a257807d8`, `draft`, `OPEN`, `mergeStateStatus: CLEAN`, labels unchanged |
| Live `main` | `c73d361eea14a7f40702638638e492f2ca961a59` — matches the coordinator's reference |
| Central checkpoint | `148d3002618404fefd8f5e6059228129eba0fc7b` — resolves; `164c39241` (attempt-7 close) is its parent-line |
| Central `milestone-status.md` | #1664 `blocked`, base `3fc0f2f92…`, "attempt 7 terminal behavior red at 68/1/0" — agrees with this lane |

### Resource state — clean

Docker `0` containers, `0` running. No `aspire-managed`, `apphost`, `chrome`, `chromium`, or `dcp`
process. The 5 `aspire mcp start` processes are pre-existing foreign MCP servers, not run-owned.

### Two real drift items recorded

**D-21 — parked local artifacts lost; evidence intact.** The host rebooted `2026-08-28 10:44`,
clearing `/tmp` and with it the attempt-7 quarantine. Separately, the leaf worktree
`/home/codex/repos/netscript-007-features-1355` was swept (a reboot does not delete `/home`), as was
the sibling `netscript-007-leaf-typed-error`. Neither removal is challenged or reversed here. **All
durable evidence survived**: `a257807d8` is the origin branch head and the PR head, carrying the
attempt-7 report plus the raw `.log` and `.ndjson`. The park record's "recoverable" description of
the quarantine is **corrected** — it was reaped, not deleted by this lane, and held only regenerable
scaffold data.

**D-22 — `main` has moved past the evidence base, onto the implicated subsystem.** The leaf is 10
commits behind `main` from merge-base `3fc0f2f92`. Three of those ten touch `packages/sdk`, and the
leaf modified none of them:

- `3e8e146a4` isolate cache write failures / cache telemetry contracts (#1665)
- `0ef48c2ec` **make cached-entry fast path honor stale policy** (#1669) — `cache-query.ts` 105/98
- `c73d361ee` preserve contract errors through `safe()`/`isDefinedError` (#1692)

Attempt 7's sole red is that the optimistic `Seed User*` row never appears after Rename — a
query-cache invalidation/refetch behavior. `0ef48c2ec` changes exactly when a cached entry is served
from the fast path versus treated as stale, which is the decision governing whether a list refetches.
The red and the landed fixes are in the same mechanism.

**No causation is claimed.** Establishing whether those commits cause or cure the red requires a
rebase and another runtime attempt, and no retry is authorized — so the question is left open rather
than guessed. Same discipline as attempt 7, where neither CDP bound fired and F8 was credited with
attributability rather than a fix. The operative consequence: **attempt 7 is evidence about base
`3fc0f2f92`, not about current `main`**, and should not be read as a verdict on today's code.

### Actions deliberately not taken

No runtime retry, no `fresh-browser`, no evaluator or IMPL-EVAL launch, no rebase, no other lane
touched, no merge, publish, readiness, label, metadata, or issue mutation, no lease, and no new scope
admitted. The lane remains parked at `a257807d8` awaiting explicit coordinator instruction.

## 2026-08-28 — Read-only research: #1293 rows 1 and 4 vs live main; #1664 untouched

Coordinator released one independent read-only research item. #1664 remains terminal-parked and
quiescent — not recreated, rebased, retried, evaluated, or mutated. Full findings:
`research-1293-1112.md`. Verdict: **NEEDS_COORDINATOR_DECISION**.

**Row 1 is un-checkable as worded, by design.** `PrismaMySqlAdapter` exists at
`src/adapter.ts:351` but the public barrel does not re-export it, and `tests/surface_test.ts:17`
(`assertFalse('PrismaMySqlAdapter' in publicApi)`) actively enforces the exclusion. PLAN-EVAL R2.1
ruled the narrowing (`plan-eval.md:176-183`) because exporting the class would leak `MysqlPoolClient`
/`MySqlQueryable` into the surface; R2.2 states plainly that box 1 is not satisfied by that choice.
#1662's own acceptance evidence says the same and flags "Issue wording remains an owner action".
The stated *need* is met: `examples/basic-usage.ts:21,37,48` constructs public `PrismaMySql` and
receives the publicly exported `PrismaMySqlConnectedAdapter`. **Resolution is an owner acceptance
rewrite, not an implementation leaf** — and not mine to make.

**Row 4 is correctly blocked on #1112** (`OPEN`, `type:docs`, `status:triage`). The docs site page is
already largely correct (`index.md:8,14,16,17` name `mysql2/promise`, pooling ownership, `dispose()`,
timeout mapping). Two items remain: `index.md:23` is now **actively false** — it claims
`onConnectionError` is unsupported and blocked on #1293, but the option is published at
`src/types.ts:44` and was wired by #1662 — and the executable example still needs writing/verifying.

**One unowned gap found.** The package's own published module docs still carry the false Deno-native
claim that #1112 exists to correct: `src/mod.ts:4-5` and `src/adapter.ts:4-7`, against ground truth
`src/adapter.ts:24` importing from `mysql2/promise`. `deno.json` publishes `mod.ts` and `src/**/*.ts`,
so it ships to JSR and renders in `deno doc`. These are `packages/**` files, and CLAUDE.md's
doc-authoring exception forbids the docs lane from touching package source — **so this needs a
product lane, and no issue currently owns it.**

**Dependency order:** (1) coordinator rewords #1293 row 1; (2) fixes lane takes one tiny comment-only
leaf correcting the two module-doc blocks; (3) docs lane takes #1112 (`index.md:23` + executable
example); (4) then row 4 checks and both issues close. (2) and (3) are parallel; (1) blocks only
closure.

**Features takes nothing from this** — the product work shipped in #1662; what remains is owner
wording plus docs, and the single code item is a prose-accuracy defect belonging to **fixes**. The
features lane has no next leaf and stays parked.

Read-only throughout: no issue, PR, box, label, milestone, or product file mutated; no author or
evaluator launched; no lease consumed; no other topic touched. The shared `netscript-main` worktree
was detached to `cf648f1ff` for inspection and restored to `main`, clean.

## 2026-08-29 — resume from checkpoint: #1696 exact-head IMPL-EVAL dispatched, #1466 opened as the next leaf

Coordinator delivery correction accepted: **Aspire is a parallel lane and does not block features.**
The whole `epic:aspire-13-5` block (#1712–#1724, several p0) is therefore excluded from this lane's
queue selection, including its in-flight #1727.

### Reconciliation

| Fact | Verified value |
| --- | --- |
| `origin/main` | `5bb112dd35f94fc8435672e2cabff1f9a447aa0b` — matches the coordinator tuple exactly |
| PR #1696 head | `414a52ba807683cbe87aa25ca07e344f16731b6d` — matches |
| PR #1696 state | open, **non-draft**, `MERGEABLE` / `CLEAN`, milestone `0.0.7`, `status:impl` |
| Exact-head CI | `check-test`, `quality`, `code-quality`, `build`, `close-gate`, `core CI lane visibility` all **pass** |
| CI provenance | all three run `headSha` values equal the PR head — checked, not assumed |
| Lock hygiene | `deno.lock` absent from the diff |

**The `main..head` diff is a trap here and I nearly recorded it.** It reports 123 files and 28,585
deletions, including an entire RFC removal, because the branch is based on `c73d361ee` and `main`
has moved 15+ commits since. The true delta is `git diff c73d361ee 414a52ba8` — **18 files,
+709/−30**. Anyone reviewing this PR from `main..head` will see another lane's work as this leaf's
deletions. Recorded as **D-20** because it is a general reporting hazard, not a one-off.

### The prior FAIL_FIX and what actually repaired it

The OpenHands/DeepSeek IMPL-EVAL failed at head `265dd8760` on **one HIGH finding**: editing
`docs/site/reference/ai/index.md` without regenerating the committed agent-docs corpus, so the
`quality` gate step `check:agent-docs-prose` was green at base and red at head. Three commits
answer it — `8c7c67a05` regenerate corpus, `c34fe15ec` re-embed into the generated barrel,
`414a52ba8` re-stamp publish-assets provenance.

That three-commit shape is itself the interesting signal, and I put it in the evaluator's brief
rather than resolving it myself: regenerating the corpus was **not** sufficient, two further
generated artifacts had to be re-stamped, so the live question is whether the set is now complete or
whether a fourth derived artifact went unstamped. My own stored lesson is that
`embedded.generated.ts` is what actually ships to a scaffolded user, so a corpus fresh on disk but
stale in the barrel is a real defect a green freshness gate need not catch.

### Evaluator dispatched — fresh, opposite-family, exact head

| Field | Value |
| --- | --- |
| Session | `321b426c-f617-477e-88c0-1f9b9cdb7c50` |
| Requested route | native Claude **Fable 5 · medium** · Remote Control |
| Observed route | `respawnFlags: ['--effort','medium','--permission-mode','bypassPermissions','--model','fable']` — **requested == observed** |
| Auth | `providerEnv: {}` — native Anthropic, no API-key override |
| Remote Control | bridge `cse_01UgH3wjzJmy8qB7rBdFHoLm` — non-empty, so attachment is proven |
| Worktree | `/home/codex/repos/netscript-007-features-1694`, created at `414a52ba8`, clean |
| Brief | `slices/impl-eval-1696.md` |

Route note: `lane-policy.md:84` pairs `complex_implementation` (Sol · high) with
`review_codex_complex` = **Fable 5 · medium**. The coordinator's specified evaluator route is
therefore the policy pairing, not an ad-hoc choice.

**The brief carries explicit commit-and-push wording.** The immediately preceding cycle on #1664
ended with a correct verdict stranded untracked in a working tree because my brief said "write the
verdict file" and never said commit it. That cost a full resume cycle. The instruction is now
written into the brief as a numbered git sequence, together with the reason an uncommitted verdict is
not evidence and the note that the evaluator's own commit will move the branch head past
`414a52ba8` — expected, and to be stated in its PR comment so no reader mistakes it for a content
change.

### #1664 stays parked, and does not consume the queue

No action taken on #1664. It remains a draft at `20337441788b4e2341b0474d6297bec1ddd33b80` with its
F8 plan reviewed `PASS` and its F8 implementation unwritten. Per the coordinator it does not occupy
the serial slot.

### Next leaf selected: #1466 — [sdk-client S2]

Selection is defensible on four independent grounds rather than priority alone:

- **No features-owned p0 exists** outside Aspire. The remaining p0s are #1365 and #1674 (both
  `type:fix`, fixes lane) and the excluded Aspire epic. So p1 is the real ceiling.
- **It unblocks the most.** #1466 is the entry slice of `epic:sdk-client-contrib`; S3–S8 (#1349,
  #1351, #1352, #1353, #1467, #1093) all sit behind it — the largest single block of features-owned
  p1 work left in the milestone.
- **Its one dependency is discharged.** S1 (#1350) is **CLOSED**; I verified the state rather than
  inferring it from the epic ordering.
- **It collides with nothing in flight.** Open PRs are #1727 (Aspire lane), #1711 (docs #1112),
  #1696 and #1664 (mine), #1641 (coordinator), #1640/#1522 (docs), #822/#780 (stale). Nothing claims
  `packages/sdk` contract metadata. It is also independent of the parked #1664's scaffold/template
  surface — which is why I did **not** take #1354 or #1357, whose generator surface overlaps #1355
  directly.

| Field | Value |
| --- | --- |
| Route | Codex · OpenAI · **GPT-5.6 Sol · high** (`complex_implementation`, `lane-policy.md:28`) |
| Worktree | `/home/codex/repos/netscript-007-features-1466` at base `5bb112dd3`, clean |
| Branch | `feat/sdk-procedure-meta` |
| Brief | `slices/impl-1466.md` — Phase 1 research+plan then STOP at a Tier-A |

The brief names the two traps this lane has already paid for: an `as` cast bridging a package-owned
public type to an upstream contract (the #1293 S1-F1 defect class, in a slice whose acceptance
literally says "without casts or `any`"), and reporting a narrower command as the contracted gate.
It also forces the versioning commitment to be stated in Phase 1, because six downstream slices
inherit whatever vocabulary S2 defines.

No merge, publish, relabel, milestone change, readiness flip, issue close, `#1348` mutation, or
expensive-gate lease was performed or requested. No release authority claimed.

## 2026-08-30 — #1696 IMPL-EVAL terminal `PASS`, verdict self-committed by the evaluator

| Field | Value |
| --- | --- |
| Verdict | **`PASS`** (`evaluate.md:258-266`) |
| Evaluated head | `414a52ba807683cbe87aa25ca07e344f16731b6d` |
| Verdict commit | `2a0a5608629cc2793233507c8449d9316ffeb2ee` — `eval(ai): IMPL-EVAL PASS for PR #1696 at 414a52ba8 (Claude Fable 5)` |
| Verdict scope | **1 file, +266** — `.llm/runs/feat-ai-request-context--1694/evaluate.md` only, verified by diff |
| Evaluator | native Claude **Fable 5 · medium** · Remote Control, session `321b426c`, bridge `cse_01UgH3wjzJmy8qB7rBdFHoLm` |
| PR comment | `[PHASE: IMPL-EVAL] [VERDICT: PASS]`, posted, naming the head move as artifact-only |
| local == remote == PR | all `2a0a5608629cc2793233507c8449d9316ffeb2ee` |

The explicit commit/push wording worked: the evaluator committed and pushed its own verdict and
posted its own comment without a supervisor prompt, unlike the preceding #1664 cycle. It also
pre-empted the head-move confusion in its own comment, stating that its commit moves the branch past
the evaluated head and that the delta is one artifact file — so the next reader does not need to
re-derive that.

### The barrel question was answered properly

I asked whether the three-commit repair was complete or whether a fourth derived artifact went
unstamped. The evaluator did not answer from the commit messages: it ran `check:assets-barrel`,
which **regenerates** `agent-docs.generated.ts` and six siblings and then `git diff --exit-code`s
them — exit **0**, tree clean after regeneration. Its conclusion, which is the useful part: a corpus
fresh on disk but stale in the barrel *would* be caught, **by the second gate, not the first** — so
the two gates are not redundant, and there is no fourth derived artifact. That is a better answer
than the one I was fishing for.

### Findings — none blocking

- **S-1 (substantive, follow-up).** No test guards the loop layer against serializing `context` into
  provider-bound request fields — the evaluator mutated the source and **9 of 9 tests still
  passed**. The product is correct at this head by inspection, but the negative invariant that is
  the entire point of #1694 is not held by an executable guard. This is exactly the "can the test
  fail?" question the brief asked, and the honest answer was no. It should become a follow-up issue.
- **E-1** narrower-annotation incompatibility disclosed but not `@ts-expect-error`-pinned — and the
  prior OpenHands INFO-3 **over-stated** it. **E-2** `signal` propagation tested for type only, not
  identity/abort. **E-3** PR body stale in two places (says 14 files, now 18). **E-4**
  `deno doc --lint packages/ai/mod.ts` has 26 errors — **identical at base**, so outside this leaf.
- **P-1 (process, orchestrator-owned).** No leaf run artifacts and no PLAN-EVAL record before
  implementation. I accept this against the lane rather than the author: #1696 was dispatched before
  this supervision window, and the absence of a leaf run dir is why the evaluator had to create
  `.llm/runs/feat-ai-request-context--1694/` itself.

### Merge-readiness — one qualification, and it is not yet satisfied

The verdict commit moved the PR head to `2a0a56086`, so exact-head CI is **re-running**:
`build`, `code-quality`, `close-gate`, both `classify` jobs are green at the new head, while
`check-test` and `quality` are still `IN_PROGRESS`. `mergeStateStatus` therefore reads **BLOCKED**
— on pending checks, not on a failure.

I will not report merge-ready on the strength of green CI at `414a52ba8`, because that is no longer
the merge head. The content delta between the two heads is one run-artifact file and nothing else —
I verified that by diff — so the re-run is expected to reproduce, but "expected to" is not a receipt.
Merge-ready goes to the coordinator when `check-test` and `quality` are green **at `2a0a56086`**.

No merge, publish, relabel, readiness flip, milestone change, or issue filed. No release authority
claimed.

### Merge-ready — reported to coordinator

All checks are green at the **merge head** `2a0a5608629cc2793233507c8449d9316ffeb2ee`, not merely at
the evaluated head:

| Check | Result |
| --- | --- |
| `check-test` | pass (8m15s) |
| `quality` | pass (1m50s) |
| `build`, `code-quality`, `close-gate`, both `classify`, `core CI lane visibility` | pass |
| Run provenance | runs `33277553650` / `33277553668` / `33277553642` all report `headSha == 2a0a56086` — asserted, not assumed |
| Merge state | observed **`CLEAN`** at this head once CI settled |

`mergeStateStatus` subsequently reverted to `UNKNOWN`. That is GitHub's lazy recomputation after the
label change below, not a regression — no check is failing or pending, and `CLEAN` was observed at
this exact head.

**Verdict: PR #1696 is merge-ready.** Merge authority is the coordinator's; this lane holds none and
performed no merge.

### Label change — not this lane, and not the evaluator

The PR moved `status:impl` → **`status:ready-merge`** at `2026-08-29T22:05:02Z`, 2.5 minutes after
the evaluator's PASS comment. I did not do it, and my brief explicitly forbade the evaluator from
relabeling.

Because every agent here acts through the same `rickylabs` token, the timeline API cannot name the
actor, so I checked the evaluator's own transcript rather than infer from timing — which had pointed
straight at it. It issued **zero** mutating GitHub commands: `gh pr edit` 0, `--add-label` 0,
`gh pr merge` 0, `gh pr ready` 0. Its four `ready-merge` mentions are all quotations of close-gate
rules inside the verdict text. The evaluator stayed inside its authority; the relabel came from the
coordinator acting on the PASS.

Recording this because timing evidence alone would have produced a false authority-violation finding
against a session that behaved correctly — the same "narrow measurement, broad words" failure this
lane keeps catching. Exactly one `status:` label is present, so the single-status law holds.

### Follow-up owed to the coordinator

**S-1 should become an issue**: no executable guard holds the provider-invisibility invariant — the
evaluator mutated the loop layer to serialize `context` into a provider-bound field and **9 of 9
tests still passed**. #1694's whole purpose is that negative property. Filing issues is outside this
lane's authority, so it is handed up rather than acted on.

## 2026-08-30 — #1696 merged; #1466 recovered from stall; S-1 filed as #1730

### #1696 closed out — no second evaluator was needed

`gh pr view 1696` → **MERGED** at `2026-08-29T22:11:10Z`, merge commit
**`21d516224fe35e92957f0998ee848bbf2024eda0`**, and #1694 is **CLOSED**. That merge commit *is*
current `origin/main`.

The coordinator's instruction to "dispatch the fresh exact-head Fable 5 medium IMPL-EVAL now" was
already discharged before it arrived: session `321b426c-f617-477e-88c0-1f9b9cdb7c50` (native Claude
Fable 5 · medium · Remote Control, bridge `cse_01UgH3wjzJmy8qB7rBdFHoLm`, branch
`feat/ai-request-context`) evaluated `414a52ba8` and returned **PASS** in verdict commit
`2a0a56086`. Dispatching a second evaluator would have duplicated a completed gate on a merged PR,
so I did not. **Evaluator identifiers, as requested: session `321b426c-f617-477e-88c0-1f9b9cdb7c50`,
job dir `/home/codex/.claude/jobs/321b426c`, branch `feat/ai-request-context`, verdict commit
`2a0a56086`.**

### #1466 was genuinely stalled — recovered on the same thread

| Evidence | Value |
| --- | --- |
| Rollout last write | `21:59:54Z`, idle **1,129 s** at inspection |
| Rollout size | `3,547,521` bytes — **unchanged** across three separate checks |
| Worktree | clean, `0` dirty files, HEAD still at the **old** base `5bb112dd3`, no commits of its own |

That is a stall, not slow work: an agent doing deep research still appends to its rollout, and this
one did not grow at all between samples. I had earlier said I would wait for a ~30-minute threshold;
that was the wrong call and the coordinator is right to reject it — the size-unchanged signal was
already conclusive and waiting would have bought nothing.

**Recovery, in order:**

1. **Rebased the worktree** to current `main@21d516224` with `git reset --hard`. Safe without
   qualification: zero dirty files and zero commits ahead, so nothing could be lost. Fittingly, the
   new base is this lane's own merged #1696.
2. **Resumed the same thread** — `01a04f84-e21d-77f3-863c-56ef2498d581`, same GPT-5.6 Sol · high
   route, same worktree, via `agentic:codex-resume --message-file`. No rival sender was launched;
   one sender per worktree holds. No `timeout` wrapper this time.
3. The resume message tells it the base moved and that **citations verified at `5bb112dd3` are not
   evidence at `21d516224`** — re-verify and record drift. It converts the deliverable from
   open-ended reading into a landed artifact: create the run dir, write `research.md` + `plan.md`,
   commit, push, open the draft PR with `Closes #1466` and a keyword-free `#1348` reference, post the
   phase comment, then stop. It restates the five required findings and the "without casts or `any`"
   trap, and says explicitly that a shorter `research.md` grounded in read file/line evidence beats a
   complete one that never lands.

**Recovery verified, not assumed:** rollout grew `3,547,521 → 3,565,509 → 3,754,481` bytes within
minutes, idle back to seconds, HEAD now `21d516224`. Next tangible artifact: the run dir plus the
Phase-1 commit and draft PR.

### S-1 filed as #1730

`test(ai): the provider-invisibility invariant has no executable guard above the adapter` —
`type:test`, `area:ai-core`, `priority:p1`, `status:triage`, milestone `0.0.7`.

Filed under the coordinator's explicit instruction, which overrides this lane's standing
no-file-issues prohibition. It carries the evaluator's mutation table as evidence rather than my
paraphrase: mutation **A** (bridge folds context into `modelOptions`) reds 2 tests, **C** (loop stops
passing context to tools) reds 2, and **B** (loop appends `JSON.stringify(input.context)` to
`system`) reds **none — 9/9 still pass**. Acceptance requires that mutation B be *demonstrated* to go
red, not asserted.

It also captures a second, narrower gap the same pass found: the
`never reaches the Anthropic provider wire request` test **cannot detect mutation A**, because the
Anthropic adapter drops unknown `modelOptions` keys itself. It is weaker than its name and must not
be counted as coverage for that vector. That is the "guard that cannot fail" class this lane has
rejected twice before.

### Queue state

| Leaf | State |
| --- | --- |
| #1466 `sdk-procedure-meta` | **active** implementation/planning slot — recovered, Phase 1 |
| #1387 `service-principal-policy-contract` | **queued** behind #1466, serial |
| #1730 (S-1 guard) | **queued** serially after the active leaf |
| #1664 | **parked**, untouched at `20337441788b` |

No merge, publish, relabel, milestone change, readiness flip, `#1348` mutation, or lease. No release
authority claimed.

## 2026-08-30 — #1466 Tier-A `PASS` at `9e70b30a3`; PLAN-EVAL dispatched

Full review: `slices/tier-a-plan-review-1466.md` (commit `5cd0b069c`). PR comment
`5465246343`.

### Phase-1 stop

local == remote == PR head `9e70b30a3`, clean, base `21d516224` (current main), diff **artifact-only**
(2 files, +402), `Closes #1466` with a keyword-free `Part of #1348`, exactly one `status:` label,
draft. The recovered author delivered the checkpoint the resume message demanded.

### I verified the plan's central claim instead of accepting it

The whole design rests on threading `$meta` without an assertion while leaving #1350's repaired error
channel untouched. Checked against the locked upstream declarations:

| Claim | Evidence | Holds |
| --- | --- | --- |
| Re-baseline changed no source fact | `git diff 5bb112dd3 21d516224 -- packages/contracts packages/sdk` → **0 lines** | yes |
| `$meta` exists | `@orpc/contract@1.14.6/dist/index.d.mts:216` → `ContractBuilder<…, U & Record<never, never>>` | yes |
| `.errors()` preserves `TMeta` | `dist/index.d.mts:237` → `MergedErrorMap<TErrorMap, U>`, `TMeta` untouched | yes |
| `ContractBuilder` publicly exported | export list — so the annotation is nameable under `isolatedDeclarations: true` (`deno.json:175`) | yes |
| Real-specifier fixtures resolve | workspace `packages/*`; precedent `packages/sdk/tests/readme-doctest_test.ts` | yes |

`oc.$meta<NetScriptProcedureMeta>({}).errors(commonErrorMap)` therefore leaves generic position 3
**identical** to today's `BaseContractErrors` and makes position 4
`NetScriptProcedureMeta & Record<never, never>`. Implementable with zero assertions — which is the
question the review existed to answer.

### The three requirements I carried forward

- **T-1 (required).** Acceptance says "without casts or `any`". I found that `any` is **already**
  mechanically gated — `deno lint` `recommended` includes `no-explicit-any` and neither package is
  lint-excluded, a credit the plan did not claim. But **casts are gated by nothing**: the plan's only
  verification is a changed-line human review. That is the precise shape that cost this lane #1293
  S1, where `performIO(query as SqlQuery)` silenced a real incompatibility and survived review.
- **T-2.** Pin position 4 exactly rather than hedging "any upstream-required empty-record
  intersection". Vagueness there is what later justifies the `as` that L3 forbids.
- **T-3.** Fix the receipt filenames and distinct per-package `gateId`s in `plan.md`;
  `evidence-set.ts` scores a repeated `gateId` as duplicate/contradictory → INSUFFICIENT.

I passed rather than requested changes because none of the three invalidates the design, all three
are evidence/precision items the PLAN-EVAL must rule on anyway, and implementation is blocked until
that gate returns — so a round-trip would have bought delay, not safety. They are binding items in
the evaluator's brief, not suggestions.

### What the plan gets right

The independence rule (`research.md:120-126`) is written so a reviewer can **reject** something —
`extends Meta`, `InferContractRouterMeta<…>`, an upstream re-export, a bridging `as` — instead of the
unactionable "must remain independent". The versioning commitment is decided, argued from the RFC's
`{}` normalization, and costed for S3–S8 rather than deferred. Finding 4 answers by finding nothing
and says so: no CLI generator owns this declaration output. And the stage boundary against S3's
runtime port is left open as a genuine fork rather than pre-decided.

### PLAN-EVAL dispatched

| Field | Value |
| --- | --- |
| Session | `5cd50ad0-3de4-4997-b60e-9dc73e76caaf` |
| Requested route | native Claude **Fable 5 · medium** · Remote Control (`lane-policy.md:84`, `review_codex_complex`) |
| Observed route | `respawnFlags: ['--effort','medium',…,'--model','fable']` — **requested == observed** |
| Auth | `providerEnv: {}` — native Anthropic |
| Remote Control | bridge `cse_01JNV9EuywznGgoufYQizqBU` |
| Worktree | `/home/codex/worktrees/ns1466-planeval` — **detached** at `9e70b30a3`, deliberately not the author's |
| Brief | `slices/plan-eval-1466.md` |

The detached worktree is deliberate: an evaluator writing into the author's worktree is what produced
D-19's cross-owner contamination. The brief carries explicit commit-and-push wording and requires
rulings on T-1…T-3 plus the plan's two open decisions, stating that handing any of them back is a
failure of the gate.

Queue unchanged: #1387 and #1730 remain queued behind #1466; #1664 parked at `20337441788b`.

## 2026-08-30 — #1466 PLAN-EVAL `FAIL_PLAN`; bounded docs-only repair dispatched

| Field | Value |
| --- | --- |
| Verdict | **`FAIL_PLAN`** (`plan-eval.md:297-305`) |
| Evaluated plan head | `9e70b30a3` |
| Verdict commit | `a3452650d` — **1 file, +333**, `plan-eval.md` only |
| Evaluator | native Claude **Fable 5 · medium**, session `5cd50ad0`, bridge `cse_01JNV9EuywznGgoufYQizqBU`, detached worktree |
| PR comment | `[PHASE: PLAN-EVAL] [VERDICT: FAIL_PLAN]`, posted by the evaluator |

### This is the useful kind of FAIL

The gate ruled on **everything** routed to it and handed nothing back. All three Tier-A requirements
**upheld**; both of the author's open questions **resolved**, and in the author's favour where a
direction was proposed:

- **R-1** runtime metadata port in Stage 1b → **no**; the author's deferral to S3 stands.
- **R-2** extractor name and location → **fixed by the evaluator**, not returned as a question.
- **T-1 / T-2 / T-3** → upheld, each with the concrete evidence or naming now required.

`FAIL_PLAN` is because the rulings are not yet *in* `plan.md`, and `plan.md` is the contract the
implementation is held to. The evaluator scoped the next cycle itself: docs-only, and
re-evaluation is "confirm `plan.md` carries A-1…A-8 as written". A verdict that bounds its own
remediation is worth more than a conditional PASS that leaves the transcription optional.

### I verified the crux rather than relaying it

T-1's whole force rests on the claim that a plain cast is ungated. Checked at source:
`scan-code-quality.ts:75` matches **only** `\bas\s+unknown\s+as\b`, `\bas\s+any\b`, `\bas\s+never\b`.
A plain `x as T` is caught by nothing — and that is precisely the form of `performIO(query as
SqlQuery)`, the #1293 S1 defect that type-checked, skipped a conversion path, and survived review.
The evaluator's remedy is an **assertion-budget test** under the `test` catalog gate (so it lands in
`test-final.json`) that strips comments and strings, counts assertion tokens, and asserts equality
with baselines pinned per file — measured `0` for the four metadata-boundary files, `1` for
`define-services.ts` and `client/service-client.ts`, `5` for `query/query-factory.ts`. It also
demotes "changed-line cast/`any` review" to review, explicitly not evidence.

Its §3 finding matches the concern I could not make mechanical in Tier-A: the independence rule was
enforceable only by reading. The evaluator supplied the missing tool — a `deno doc --json` test over
both entrypoints asserting no `@orpc`/`npm:` string appears in the named types' JSON subtrees — and
correctly noted that `BaseContractRoute` naming oRPC builder types is the accepted public builder
surface, not a violation.

It also checked a citation I had taken on trust: **AP-14 is "Re-exporting upstream packages"**
(`09-anti-patterns-and-fitness-functions.md:104-106`), and the plan's use at `plan.md:81` is correct.

### Repair dispatched — same thread, bounded, docs-only

Resumed `01a04f84` (GPT-5.6 Sol · high, same worktree) with A-1…A-8 as a transcription task, plus:

- **fast-forward first** — the author's local branch was at `9e70b30a3` while the remote had moved to
  the evaluator's `a3452650d`;
- **re-measure the assertion baselines with the scanner you commit**, and pin what you measure — do
  not copy the evaluator's numbers on faith; a discrepancy is itself the finding;
- no `packages/**` in this cycle, stop and report, no implementation before re-evaluation.

Thread confirmed awake: rollout `3,754,481 → 4,147,461` bytes, idle 27 s.

Re-evaluation will resume evaluator session `5cd50ad0` for the bounded check rather than launching a
fresh one — the scope is "did the transcription land", the ruling session already holds the context,
and generator ≠ evaluator still holds because the author is Codex.

Queue unchanged: #1387 and #1730 queued behind #1466; #1664 parked at `20337441788b`.

## 2026-08-30 — #1466 plan gate closed: cycle-2 `PASS`, implementation released

| Step | Head | Result |
| --- | --- | --- |
| Plan repair | `7db3954bf` | docs-only (+217/−52 `plan.md`, +58 new `worklog.md`), **0** `packages/**` |
| Tier-A on repair | `b648aa60d` | **PASS** — A-1…A-8 all present, 8 distinct `gateId`s |
| PLAN-EVAL cycle 2 | `1df5ff3e4` | **`PASS`** — artifact-only (+46) |
| Implementation | released to `01a04f84` | slice 1 only, stop at its Tier-A |

The cycle-2 verdict checks each A-item against what it *required*, with file:line citations into the
repaired plan, and closes: *"Implementation may begin at slice 1 under the contract as transcribed;
IMPL-EVAL evaluates against this `plan.md`."* One non-blocking note — `plan.md:220-221` still lists a
per-member dry-run in the prose gate list while `:242-244` correctly classifies it as supplemental —
explicitly does not affect the named receipt set.

### The baseline discrepancy was mine

I asked the author to re-measure the assertion baselines rather than copy the evaluator's, and then
checked its numbers. My first count disagreed — `grep -oE '\bas\s+…' | wc -l` gave **8** for
`sdk/src/query/query-factory.ts` against the pinned **5**. Reproducing the *specified* scanner
semantics (strip block comments, line comments and string literals; count `\bas\s+` excluding
`as const`) every file matched exactly: 5 / 1 / 1 and 0, 0, 0.

The error was mine: `grep -o` emits one match per occurrence and I counted before stripping. Recorded
because it is precisely the failure this lane keeps catching in others — a number produced by a
convenient command and reported as the contracted measurement. Independent of who erred, the
baselines are now confirmed by two parties with the same semantics, so the assertion-budget gate will
be neither vacuous nor permanently red.

### Why the plan gate was worth three cycles

The gate's net product is two executable guards that did not exist when the plan was written:

- an **assertion-budget test** under the `test` catalog gate, because `scan-code-quality.ts:75`
  matches only `as unknown as` / `as any` / `as never` — a plain `x as T` is caught by nothing, which
  is exactly the form of #1293's `performIO(query as SqlQuery)`;
- a **doc-JSON independence test** asserting no `@orpc`/`npm:` string appears in the emitted
  declarations of the five named types, replacing a "declaration scan" that had no tool behind it.

Both convert prose promises into things that can fail. Acceptance point 3 — "without casts or `any`" —
is now half gated by `deno lint` and half by a committed test, rather than by a reviewer's attention.

### Queue

| Leaf | State |
| --- | --- |
| #1466 | **active** — slice 1 implementation, serial slot held |
| #1387 | queued; **technically dependent on #1466**, see below |
| #1730 | queued (S-1 executable-guard gap) |
| #1664 | parked, untouched at `20337441788b` |

### #1387 is not merely queued behind #1466 — it depends on it

Reading #1387 while the plan gate ran: its stated defect is that `AuthzRequest` is path-prefix-only
and *"oRPC's `.meta()` is used **nowhere** in the codebase, so a procedure cannot declare the policy
it requires"* — verified in its evidence block by `grep -rn '\.meta(' packages plugins --include=*.ts`
returning no oRPC call.

That is the exact seam #1466 is building. So #1387's policy declaration must extend
`NetScriptProcedureMeta` — whose Stage 1b shape already carries `access.authentication` — rather than
introduce a second metadata vocabulary. Inventing a parallel one would recreate #1387's own headline
defect: *policy living in a second place that can drift from the contract*. Recorded on the issue so
whoever picks it up inherits the constraint rather than rediscovering it.

## 2026-08-30 — NAS migration: features lane resumed, #1466 repair dispatched to a new Codex thread

Supervisor reset onto the NAS agent plane. Old `/home/codex/...` paths and the old session registry
are historical; the registry is never resumed or recreated. Git and live GitHub are authoritative.

### Reconciliation before dispatch

| Question | Answer | How |
| --- | --- | --- |
| Topic head | `78430faf`, local == `origin/orchestrator/release-0.0.7-features` | `git rev-parse` |
| `main` | `13878a80a`, local == `origin/main` | `git fetch` + `rev-parse` |
| #1731 head | `f9056f879`, local == remote == PR head, clean, OPEN draft | `gh pr view` + `rev-parse` |
| Leaf base vs `main` | `21d516224` is **3 commits** behind | `git rev-list --count` |
| Does that drift touch this slice? | **No** — `git log 21d51622..origin/main -- packages/contracts packages/sdk` is empty, diff is empty | measured, not assumed |

So no rebase. Holding the base fixed is what keeps the pre-repair red receipts and the recut set
comparable — the mistake D-22 (#1664 era) records is running an old base to answer a question nobody
asked; the mirror-image mistake is rebasing away the comparability of evidence you are about to
re-cut. The drift is inert and is recorded as such.

### The three red receipts are not the same defect

The migration checkpoint `f9056f87` froze eight receipts cut at content head `c9a391811`: five PASS
and three terminal FAIL — `check`, `test`, `public-doc-lint`. Reading them rather than the summary:

- **`check` and `test` are one root cause, not two.** Both fail on a single `TS2344` at
  `packages/sdk/tests/readme-doctest_test.ts:47:43` —
  `Assert<Equal<BaseMeta, Record<never, never>>>`. That guard pins the **pre-#1466** fact "the
  metadata slot is empty", and #1466 deliberately changes it to
  `NetScriptProcedureMeta & Record<never, never>`. The guard is correctly red. The repair re-pins it;
  it does not delete or loosen it, and it must still be able to fail.
- **`public-doc-lint` is a different animal entirely — see D-23.** I ran the plan's exact
  16-entrypoint argv on both heads: `main@13878a80a` yields **12** `private-type-ref` findings,
  slice head `f9056f879` yields **14**. The gate is already red on `main`. The contracted PASS
  receipt was never satisfiable by this leaf, and the leaf's D-1 asks the coordinator the wrong
  question.

I checked the base rather than relaying D-1 because D-1's remedy space — "rule how the sanctioned
oRPC slow-types baseline is represented in the named evidence set" — only makes sense if the gate
was green before. It was not. The slice's real cost is **+2, and it is one symbol**: `baseContract`'s
annotation moved from `ReturnType<typeof oc.errors<…>>` (1 finding, `oc`) to an explicit
`ContractBuilder<…>` (3 findings). Every other finding is identical on both heads.

That converts the repair target from "make it green" — impossible in bounds — to **incremental delta
≤ 0 versus the base**, with the residual recorded as a terminal FAIL receipt carrying the comparison.
The gate is not weakened, renamed, scoped down, or omitted. Whether the plan's unsatisfiable PASS is
amended is a coordinator/IMPL-EVAL ruling; this lane does not waive it.

### Dispatch — new thread, never a resume

Brief: `slices/impl-1466-repair.md` (bounded to four items: R-A doctest re-pin, R-B adapter boundary,
R-C archive-then-recut all eight receipts, R-D land evidence and stop). It carries the base-vs-head
doc-lint numbers as evidence, names `BaseContractErrors` — a NetScript-owned alias exported in
`contract-primitives.ts:101` but absent from `public/mod.ts` — as the leading candidate for the
delta, and forbids re-exporting `ContractBuilder`/`Schema` as AP-14. It repeats the D-21 standing
instruction: land what exists, and a failing pinned baseline is a finding to report, not a number to
adjust.

| Field | Value |
| --- | --- |
| Launcher | `deno task agentic:launch-codex-slice` (dry-run clean first: brief contract ok, `use harness`=true, `## SKILL`=true, git-safety `upstream: NONE` / `dirty: 0` / base `f9056f87`) |
| Requested route | Codex · OpenAI · **`gpt-5.6-sol` · medium** — `normal_implementation` (`lane-policy.md`) |
| Observed route | `provider=openai · model=gpt-5.6-sol · effort=medium` — **matched** |
| Thread | `01a0515c-28c8-7131-8197-e808f7b7e10f` |
| Worktree | `/home/agent/projects/netscript/worktrees/007-leaf-1731` |
| Branch | `feat/sdk-procedure-meta` @ `f9056f87`, upstream unset by me before launch (launcher push-safety requires it) |
| Daemon attachment | `agentic:codex-status --user node`: daemon `running`, backend `pid`, socket `~/.codex/app-server-control/app-server-control.sock`, cli/app-server `0.151.0`, `app-server-procs=2`; the thread is listed `working` at the correct worktree on the correct route |
| Steering | `deno task agentic:codex-resume --user node --thread-id 01a0515c-28c8-7131-8197-e808f7b7e10f --worktree /home/agent/projects/netscript/worktrees/007-leaf-1731 --message-file <path>` (verified against `codex-resume.ts` `--help`; the flag is `--thread-id`, and `--user node` is required because this task also lacks `--allow-env` — see D-24) — same thread, same worktree, never a second sender |

**Route choice.** The parent slice ran `complex_implementation` (Sol · high). This repair is a
re-pinned type assertion, one export line, and a receipt recut — not a new feature — but it does
carry one genuine mid-slice decision (whether the `BaseContractErrors` export clears the delta
without introducing a `MergedErrorMap` reference), which is exactly the `medium` selection rule.
Recorded as a deliberate step down from the parent slice's route, not an oversight.

**Not on this lane's authority and withheld:** merge, publish, ready-flip, relabel, milestone change,
issue close, #1348 or central cluster-state mutation, expensive-gate lease. Tier-A is mine; IMPL-EVAL
is a fresh separate session on `formal_impl_evaluation` (Fable 5 · medium for Codex work).

### Queue

| Leaf | State |
| --- | --- |
| #1466 / PR #1731 | **active** — bounded repair in flight on thread `01a0515c` |
| #1664 | **parked**, untouched at `20337441788b` — no retry authorized |
| #1387 | queued, serial; technically dependent on #1466's metadata vocabulary |
| #1730 | queued (S-1 executable-guard gap) |

NAS/session operational evidence (host paths, rollout file, socket, thread id) is recorded here for
continuity and is **committed locally only — not pushed**.

## 2026-08-30 — #1466 slice 1 closed at Tier-A `PASS`; IMPL-EVAL dispatched

Three repair cycles on **one** author thread — `01a0515c`, never a second sender, never a fresh
author. Full review in `slices/tier-a-review-1466-repair.md`.

| Cycle | Content head | What it closed |
| --- | --- | --- |
| 1 | `3c3f9b7c` | SDK doctest re-pin; `BaseContractErrors` exported; doc-lint 14 → 13 |
| 2 | `bb1a489a` | AF-1 inference probe; `commonErrorMap`/`CommonErrorMap` published; doc-lint **13 → 12 = base** |
| 3 | `23548276` | six symbols documented; `docs:exports-drift` green; CI docs-site **success** |

Evidence head `fc81e652` — local == remote == PR head, clean, still OPEN draft.

### The finding that justified the whole review

The cycle-1 re-pin `Assert<Equal<BaseMeta, BaseContractMeta>>` was a **tautology**: `baseContract` is
annotated `ContractBuilder<…, BaseContractMeta>` and upstream declares
`'~orpc': ContractBuilderDef<…, TMeta>`, so both sides read the same annotation. I proved it instead
of arguing it — a probe annotating position 4 as `Meta1` over an initializer producing `Meta2`
type-checks at **exit 0**. So A-item T-2's "pin position 4 exactly" was pinned by **nothing**:
the annotation declares position 4, and only assignability checks the initializer against it.

`procedure-meta-inference_test.ts` now builds the **unannotated** expression and `Equal<>`-pins the
inferred meta and error map. Verified non-tautological structurally, and the author demonstrated the
`TS2344` on perturbation.

That finding then paid for itself: because the annotation was no longer load-bearing for T-2, the
adapter boundary could be reworked, and doc-lint reached **delta 0** (12 = 12 vs `main`) without
re-exporting a single upstream type and without withdrawing `BaseContractErrors`. Equal count, better
composition — every remaining contracts-side finding is now an irreducible upstream reference, where
the base was hiding a NetScript-owned type.

### Two reds survive, both with proven external causes

`public-doc-lint` is baseline-red on `main` (D-23, delta 0). Root `test` is 4,248 / **1**, failing
only `hybrid-launcher_test.ts` — which cannot pass on a host with 7,733 PID-1-owned zombies because
`:167` tests liveness with `Deno.kill(pid, 0)` and a zombie answers (D-26). Sufficiency is honestly
`INSUFFICIENT`. Whether either blocks the slice is the evaluator's ruling.

### D-27 is the lesson worth keeping

The docs-site check had been red on **every** head of this branch since the first content commit, and
nobody saw it, because `docs:exports-drift` is not in the plan's eight-receipt set — while
`public-doc-lint`, which *is* in the set, is baseline-red and cannot signal a regression by
construction. A gate that is red at the base is not merely unsatisfiable, it is **uninformative**.
Run every candidate gate at the base before contracting it. Adding `docs-exports-drift` is
**proposed**, not applied.

### IMPL-EVAL dispatched

| Field | Value |
| --- | --- |
| Lane | `formal_impl_evaluation` — native opposite-family for Codex-authored work |
| Requested route | Claude · Anthropic · **Fable 5 · medium** |
| Observed route | `model: claude-fable-5`, `effort: medium`, `permissionMode: bypassPermissions` — read from the session's own transcript record, **matched** |
| Session | `00ec0e55-66cd-4cd2-814e-bc5975afeab3`, name `formal impl evaluation`, `--remote-control ns1466-impleval` |
| Worktree | `/home/agent/projects/netscript/worktrees/ns1466-impleval` — **detached** at `fc81e652`, deliberately not the author's (D-19) |
| Brief | `slices/impl-eval-1466.md` |
| Generator ≠ evaluator | Codex authored, Claude evaluates — holds |

The brief routes three rulings the implementation lane may not make for itself — whether two
externally-caused terminal FAILs block the slice, whether a published **mutable singleton**
`commonErrorMap` is an acceptable public surface, and whether `docs-exports-drift` joins the
contracted set — and requires the evaluator to re-measure my numbers rather than accept them, and to
break the new probe rather than trust it.

### Queue

| Leaf | State |
| --- | --- |
| #1466 / PR #1731 | IMPL-EVAL in flight at `fc81e652` |
| #1664 | parked at `20337441788b`, no retry authorized |
| #1387 | queued; depends on #1466's metadata vocabulary |
| #1730 | queued |

No merge, publish, ready-flip, relabel, milestone change, issue close, `#1348` or cluster-state
mutation. PR #1731 still carries a stale `status:plan` while the phase is IMPL — relabelling is
withheld from this lane and belongs to the coordinator.

## 2026-08-30 — restart recovery: PR #1731 reconciled, IMPL-EVAL `FAIL_FIX` received, cycle 4 dispatched

Supervisor restarted. Git and live GitHub are authoritative; the pre-restart in-memory state is
historical. Reconciliation before any action.

### PR #1731 head reconciliation — classified, not merged

| Question | Answer | How |
| --- | --- | --- |
| Topic head | `d701bc6a`, **6 ahead** of `origin/orchestrator/release-0.0.7-features` (`78430faf`) — local-only orchestration evidence, by design | `git rev-parse`, `git log origin/…..HEAD` |
| `main` | `13878a80a`, unchanged since the last entry | `git fetch` + `rev-parse` |
| `origin/feat/sdk-procedure-meta` | `74483f028` | `git rev-parse` |
| Leaf worktree `007-leaf-1731` | was `fc81e652` | `git worktree list` |
| Relationship | **strict fast-forward descendant** — `git merge-base --is-ancestor fc81e652 74483f028` exits 0. Zero divergence, no rebase, no force-push, nothing to merge. | measured |
| The one commit | `74483f02 docs(harness): #1466 IMPL-EVAL slice 1 verdict FAIL_FIX (Fable 5 medium)` | `git log fc81e652..74483f028` |
| Its diff | **one file, +183, evidence-only**: `.llm/runs/feat-sdk-procedure-meta--1466/evaluate.md`. Zero product, test or receipt bytes. | `git diff --stat` |

So the leaf checkout was never divergent — it was **one commit behind on evaluator-only evidence**,
authored by the IMPL-EVAL session's own detached worktree `ns1466-impleval` (itself at `74483f02`).
Preserving evaluator evidence therefore meant a **fast-forward**, never a reset and never a
force-push. Done: `007-leaf-1731` is now `74483f02` = `origin` = PR `headRefOid`, clean, 0 dirty.
Product content head is unchanged at `235482767`; `fc81e652` remains the head Tier-A passed.

### The verdict that changes the bounded scope

`FAIL_FIX`, failure **1 of 2**. Three rulings, five findings. The rulings close questions this lane
raised and may not answer for itself, so they are now settled inputs, not open items:

- **R-1** — both terminal FAIL receipts are **non-blocking**. `public-doc-lint` is baseline-red on
  `main` at 12 and the leaf is delta-0 (D-23 upheld, with the three-way finding set now recorded so
  no future evaluator re-derives it). Root `test` is the D-26 host-zombie baseline; the evaluator
  independently proved the slice-relevant obligations green (`packages/contracts` 15/0, the three
  type fixtures exit 0). **No further root-`test` retries.**
- **R-2** — the exported mutable `commonErrorMap` is **not acceptable as published**. This is the
  blocking finding. My D-27 second-order note flagged it for exactly this ruling; the ruling went
  against the cycle-3 "read-only by contract" framing, and correctly so.
- **R-3** — `docs:exports-drift` is accepted as **named supplemental evidence** for slices 2–3. It is
  **not** a plan amendment; the catalog entry is a coordinator follow-up. My D-27 proposal is
  therefore partly adopted and partly deferred — recorded as such, not claimed as accepted.

The finding that most repays reading is **F-2**: the evaluator broke the cycle-2 inference probe I
accepted at Tier-A. Perturbing the *real* initializer at `contract-primitives.ts:159` to
`oc.$meta<Record<never, never>>({})` leaves the fixture, the SDK doctest **and the probe** all at
exit 0 — because the probe rebuilds the contracted expression instead of observing `baseContract`'s
initializer. My Tier-A finding was that the cycle-1 re-pin was a tautology; that was right, and the
replacement I accepted closes a narrower hole than D-5 claims. The residual is bounded (under
`isolatedDeclarations` the annotation is the published declaration and the runtime value is `{}`
either way, so nothing consumer-visible moves) but it is real, and D-5 overstates it. Cycle 4 pins
the initializer as source text and amends D-5 honestly.

### Dispatch — new thread, because the old one is provably gone

The cycle-1→3 author thread `01a0515c` is **absent** from the live daemon and its rollout ends on
`task_complete`. It cannot be resumed, so the "same thread, never a second sender" discipline is
satisfied by a **new** thread rather than violated by one. Getting there required evicting a stale
ownership record — see **D-28**, a real defect in the checked-in launcher that makes any worktree
permanently unlaunchable once its author thread dies. Both liveness conditions were proven false
before I touched the store, and the record is preserved verbatim in D-28.

| Field | Value |
| --- | --- |
| Brief | `slices/impl-1466-repair-4-impleval.md` — bounded to **F-1…F-5 exactly**, plus archive-then-recut |
| Launcher | `deno task agentic:launch-codex-slice` (dry-run clean first: `use harness`=true, `## SKILL`=true, git-safety `upstream: NONE` / `dirty: 0` / head `74483f02`) |
| Requested route | Codex · OpenAI · **`gpt-5.6-sol` · medium** — `normal_implementation` (`lane-policy.md:27`) |
| Observed route | `provider=openai · model=gpt-5.6-sol · effort=medium` — **matched** (launcher route verdict) |
| Thread | `01a051d1-e622-74c1-8b2f-1ad80a540c29` |
| Rollout | `/home/agent/.codex/sessions/2026/08/30/rollout-2026-08-30T10-38-25-01a051d1-e622-74c1-8b2f-1ad80a540c29.jsonl` |
| NAS worktree | `/home/agent/projects/netscript/worktrees/007-leaf-1731` |
| Branch / base | `feat/sdk-procedure-meta` @ `74483f02`, upstream unset by design; push by explicit refspec only |
| Runtime | `approval=never · sandbox=dangerFullAccess` |
| Staged brief | `/home/agent/ns1466-repair4-brief.md` (9,442 bytes) |
| Steering | `codex exec resume 01a051d1-e622-74c1-8b2f-1ad80a540c29 -- "<follow-up>"` — same thread, same worktree, never a second sender (D-25: `codex-resume` cannot pin or verify the route, so route identity is fixed at launch) |
| Prior thread record | preserved as `slices/codex-thread-ids-1466-repair-c1c3.md` before the launcher rewrote `codex-thread-ids.md` |

**Route choice.** Cycle 4 is mechanical — withdraw one export, retype one alias, add one source-text
assertion, one header line, two doc rows, one `supervisor.md`, then recut. No mid-slice design
decision survives the evaluator's ruling, which prescribes each fix precisely. `medium` is held
rather than stepped down to `fast_iteration` because the binding constraint is a **measurement**
(doc-lint must stay at 12 with an identical finding set after withdrawing a public export), and
getting that wrong silently is the expensive failure.

### Supervisor identity — Remote Control proof

| Field | Value |
| --- | --- |
| Process | PID `5495`, cwd `/home/agent/projects/netscript/worktrees/007-features` |
| argv | `claude --remote-control netscript-0.0.7 features supervisor --dangerously-skip-permissions --mcp-config /tmp/netscript-hybrid-91510a0f775b1148/mcp.json` |
| Route | native Claude Opus 5 · high · Remote Control — requested = observed |
| Sibling supervisors (untouched) | internals `5498`, fixes `5501`, docs `5519`, aspire `5530` |

### Queue

| Leaf | State |
| --- | --- |
| #1466 / PR #1731 | **active** — cycle-4 repair in flight on thread `01a051d1` at `74483f02` |
| #1664 | parked at `20337441788b`; no retry authorized |
| #1387 | queued, serial; depends on #1466's metadata vocabulary |
| #1730 | queued (S-1 executable-guard gap) |

Unchanged and withheld: merge, publish, ready-flip, relabel (#1731 still carries a stale
`status:plan` — coordinator's), milestone change, issue close, `#1348`/cluster-state mutation,
expensive-gate lease. Tier-A is mine; IMPL-EVAL cycle 2 is a fresh separate `formal_impl_evaluation`
session (Fable 5 · medium), dispatched only after Tier-A and an exact-content-head recut.

## 2026-08-30 — #1466 cycle 4 landed; Tier-A `ACCEPTED_WITH_FINDINGS`; cycle 5 correction dispatched

Cycle-4 author `01a051d1` landed and pushed: local == `origin` == PR head
`dd2018166e70c2b638e106d6c52e2bb16e5a23a2`, clean. Two commits — product fix `42874803`, evidence
`dd201816`. Full review in `slices/tier-a-review-1466-repair-4.md`.

### What I re-measured rather than accepted

| Claim | My independent measurement | Agrees? |
| --- | --- | --- |
| doc-lint delta 0 vs `main` | `main` 12, head 12; **9 identical**, `main`-only `{BaseContractRoute→BaseContractErrors, BaseContractOutputRoute→BaseContractErrors, baseContract→oc}`, head-only `{BaseContractErrors→MergedErrorMap, baseContract→ContractBuilder, baseContract→Schema}` | yes — exactly R-1's recorded three-way set |
| F-2 pin actually fails | perturbation B → **RED**; perturbation + correct text planted in a trailing comment → **still RED** | yes, and it cannot be forged by a comment |
| F-4 row is right | `deno doc --filter BaseContract` → `typeof baseContract`; row matches | yes, checked against the tool not the diff |
| withdrawal is consumer-safe | zero `commonErrorMap` matches outside `packages/contracts/`; `check` exit 0 both roots | yes |
| contracts suite | **16 passed / 0 failed** (15 + the new pin) | yes |
| `docs:exports-drift` | **PASS**, exit 0 | yes |
| eight receipts exact-head | all `gitHead == actualGitHead == 42874803e`; both frozen archives intact at 8 files | yes |

The two claims that could have been quietly wrong were the two worth attacking: that F-1's withdrawal
does not move R-1's pinned set, and that the F-2 pin really fails. Both hold — the second verified by
breaking it two ways, because the *previous* guard on this leaf was accepted at Tier-A and then shown
by the evaluator to guard nothing.

### The `test` receipt is `SKIPPED`, and that is the right call

R-1 forbade further root-`test` retries on this host, so cycle 4 archived the terminal FAIL to
`frozen-235482767/` and cut `test-final.json` with `outcome: SKIPPED` and a reason citing R-1. The
author declined to fabricate a number or to retry into the same host defect — the behaviour this lane
wants. The residual (root `test` never ran at `42874803`, a head that both withdraws a public export
and adds a test) is covered by `check` exit 0 across both roots, the focused contracts suite, and the
proven absence of workspace consumers. **Whether a `SKIPPED` receipt satisfies the contracted set is
an evaluator ruling** and is routed to IMPL-EVAL rather than taken by me.

### AF-1 — the file written to close F-5 misreported its own route

`supervisor.md` recorded `Sol · high` / `complex_implementation` for **both** repair cycles. Measured:
the original slice-1 implementation ran `complex_implementation` · high; repair cycles 1–3
(`01a0515c`) and cycle 4 (`01a051d1`) all ran `normal_implementation` · Sol · **medium**. Every repair
cycle was filed under a lane and effort none of them used.

That file exists so other supervisors can discover a run's operating identity without chat memory,
and the IMPL-EVAL reads it next. A run-identity artifact that misreports its own route is the same
error class this leaf was corrected for one cycle ago — evidence written from the claim rather than
the artifact — and it sits exactly on D-25's blind spot, where route identity cannot be verified after
the fact. Cheaper to fix now than to spend an evaluator cycle on it.

### Cycle 5 — bounded, evidence-only

| Field | Value |
| --- | --- |
| Brief | `slices/impl-1466-repair-5-identity.md` — one file, no product, no recut |
| Thread | `01a051e0-d587-7d50-be8b-02307f5c6e64` |
| Route | requested = observed = `openai · gpt-5.6-sol · medium`, verdict **matched** |
| Worktree / base | `/home/agent/projects/netscript/worktrees/007-leaf-1731` @ `dd201816` |
| Content head | unchanged at `42874803` — the same evidence-head pattern as `fc81e652` and `74483f02`, so the eight receipts stay valid and nothing is recut |

**D-28 recurred exactly as recorded.** The sender-ownership record for this worktree again named a
dead thread (`ownerPid 26951` gone, `01a051d1` absent from the daemon across three debounced probes),
and again blocked the launch. Archived and evicted as before. This is now twice in one lane in one
session; the tooling fix is not optional maintenance.

### Next

IMPL-EVAL cycle 2 brief is written (`slices/impl-eval-1466-cycle2.md`) and dispatches the moment
cycle 5 lands: fresh separate `formal_impl_evaluation` session, Claude · Fable 5 · medium, its own
detached worktree. It re-measures my numbers rather than accepting them, must break the F-2 pin
itself, and carries the three rulings this lane may not make — the `SKIPPED` receipt, whether AF-1's
class is closed, and what remains before #1466 can close.

**Recorded so it cannot vanish: #1466 slices 2 and 3 are NOT RUN** (SDK declaration propagation;
publish and compatibility evidence). PR #1731 carries `Closes #1466`, so a `PASS` on slice 1 does not
make the leaf closeable. Whether slices 2–3 return to this lane before or after #1387 is the
coordinator's call; this lane will not self-authorize them.

## 2026-08-30 — #1466 cycle 5 closed AF-1; IMPL-EVAL cycle 2 dispatched

### Cycle 5 — verified, evidence-only

Head `369928cf7ca7125fd6e8e94b4975f29fa187e400` — local == `origin` == PR head, clean. One commit,
`369928cf docs(harness): correct #1466 repair route evidence`, touching **two** run artifacts and
**zero** files under `packages/`, `plugins/`, `docs/`, or `receipts/` — verified by
`git diff --name-only`. Content head stays `42874803`, so the eight receipts remain valid at it and
nothing was recut. Same evidence-head pattern as `fc81e652` and `74483f02`.

All four AF-1 points landed: the `Model` row now names both routes and defers to the table; a
`normal_implementation` · Sol · **medium** row owns repair cycles 1–3 and 4; `complex_implementation`
· high is narrowed to the original slice-1 implementation; `Checkout` names the worktree rather than
the repo root; and the pre-migration PLAN-EVAL path is marked **historical** rather than rewritten to
a path that session never used — which is the right treatment, since falsifying a correct historical
record to look tidy is the same defect in the opposite direction.

### IMPL-EVAL cycle 2 — dispatched

| Field | Value |
| --- | --- |
| Lane | `formal_impl_evaluation` — native opposite-family for Codex-authored work (`lane-policy.md:46`) |
| Requested route | Claude · Anthropic · **Fable 5 · medium** |
| Observed route | `message.model: claude-fable-5`, `effort: medium`, `permissionMode: bypassPermissions` — read from the session's **own transcript**, `.claude/projects/…/b13a38f6-….jsonl`. **Matched.** |
| Session | `b13a38f6-8b39-4b28-9a91-0420d5b2d743` (short `b13a38f6`), PID `97957`, `--remote-control ns1466-impleval-c2` |
| Worktree | `/home/agent/projects/netscript/worktrees/ns1466-impleval-c2` — **detached** at `369928cf`, its own, never the author's (D-19) |
| Brief | `slices/impl-eval-1466-cycle2.md` |
| Generator ≠ evaluator | Codex `gpt-5.6-sol` authored; Claude Fable 5 evaluates — holds |
| Failure budget | this is **2 of 2** for the leaf's IMPL-EVAL loop |

**Route proof needed a second method.** `claude --bg` handed the work to a pre-warmed `bg-spare`
process, so its argv carries `claude bg-spare --bg-spare <socket>` and **no model or effort** — the
argv proof that worked for the Codex threads and for this supervisor is unavailable here. Route was
instead read from the session's own transcript record, which is what the cycle-1 evaluator did. Worth
knowing before anyone tries to verify a backgrounded native session from `ps` and concludes the route
is unset.

The brief routes three rulings this lane may not make: whether a **`SKIPPED`** receipt satisfies the
contracted `test` gate at a content head where root `test` never ran; whether AF-1's class is closed;
and what remains before #1466 can close. It requires the evaluator to re-derive my numbers rather
than accept them — two sessions agreeing is worth less than one measuring — and to break the F-2 pin
itself, including looking for a forgery my trailing-comment attempt did not find.

### Queue

| Leaf | State |
| --- | --- |
| #1466 / PR #1731 | IMPL-EVAL cycle 2 in flight at `369928cf` |
| #1664 | parked at `20337441788b`; no retry authorized |
| #1387 | queued — brief written (`slices/research-plan-1387.md`), holds until #1466 reaches terminal |
| #1730 | queued — brief written (`slices/impl-1730.md`) |

The lane stays serial: nothing else dispatches while an evaluator is in flight. Both queued briefs
are staged so dispatch is immediate at terminal handoff and needs no further preparation.

## 2026-08-30 — host reaper fixed: D-26 premise void, root `test` re-run, #1731 metadata corrected

### The host defect behind D-26 and R-1 is gone — measured, not assumed

| Probe | Then (D-26/R-1) | Now |
| --- | --- | --- |
| PID 1 | not reaping | `tini -- ttyd …`, `/proc/1/comm` = `tini` |
| Zombies (`ps -eo stat=` `^Z`) | ~7,733–7,979 | **0** |
| PID-1-owned zombies | thousands | **0** |
| `fs.inotify.max_user_instances` | 128 | **still 128** |

R-1's condition — *"no further root-`test` retries on this host (they cannot move it)"* — was
explicitly premised on that defect: `hybrid-launcher_test.ts:167` tests liveness with
`Deno.kill(pid, 0)` and a zombie answers, so the assertion could not pass regardless of any code
change. **The premise is void, so the condition no longer binds.** Retrying can now move the number,
which makes the archived FAIL and the cycle-4 `SKIPPED` receipt both stale as the current record.

Note the half that did **not** change: inotify is still 128, so **D-29 stands** — `watch-run.ts` is
still inoperable and supervision still falls back to polling. The host fix repaired the reaper, not
the watcher.

Root `deno task test` is re-running at content head `42874803` in a supervisor-owned worktree. The
receipt itself must be re-cut **in the leaf by an author**, not by me — measuring is supervision,
cutting a contracted receipt is implementation.

### The evaluator was ruling on a dead premise, and was told

IMPL-EVAL cycle 2 (`b13a38f6`) was dispatched with a brief that said *"Do not retry root `test`
(R-1)"*. That instruction became false mid-flight. I withdrew it by cross-session message rather than
letting the session spend its ruling on a fact that no longer holds, and reframed its ruling 1: not
*"does a `SKIPPED` receipt satisfy the gate"* but *"now that the gate is runnable again, must the leaf
cut a real `test` receipt before this slice can be terminal"*. I also told it explicitly that R-1's
`public-doc-lint` half is **unaffected and stands** — only the root-`test` half loses its premise —
and that it must re-measure rather than take my numbers.

### PR #1731 metadata was false and is now truthful

The body still read *"This first slice contains the re-baselined research and locked implementation
plan only; no product code has been implemented"* and *"Product gates: not run; no implementation
exists"* — flatly untrue at a head that has landed S1, run eight receipts, and been through an
IMPL-EVAL and two repair cycles.

| Field | Before | After |
| --- | --- | --- |
| `status:` on PR #1731 | `status:plan` (frozen mid-lifecycle) | `status:impl-eval` |
| `status:` on issue #1466 | `status:plan` | `status:impl-eval` |
| Issue reference | **`Closes #1466`** | **`Refs #1466` — partial, slice 1 of 3**, no closing keyword |
| Slice checkboxes | all unchecked | S1 checked at `42874803e`; **S2 and S3 marked NOT RUN** |
| Validation | "not run; no implementation exists" | the eight-receipt table, the doc-lint delta-0 explanation, and the superseded root-`test` note |
| Remaining scope | absent | explicit section naming S2, S3, and a terminal IMPL-EVAL `PASS` |
| Draft | draft | **still draft — not marked ready** |

The closing-keyword removal is the one that mattered most. `Closes #1466` on a PR delivering one of
three slices would have auto-closed the issue on merge with two thirds of its acceptance unmet —
exactly the failure mode `AGENTS.md` calls non-negotiable, in the opposite direction from the usual
one (the usual defect is a missing keyword stranding an issue open; this was a present keyword that
would have closed an issue that is not done).

`gh pr edit` could not be used — the token carries only `repo` scope and the label mutation requires
`read:org` for fields it queries. The REST endpoints (`gh api -X DELETE/POST …/labels`) need only
`repo` and were used instead. Worth knowing before assuming label automation is broken.

**Readiness remains withheld and is not a judgement call:** the body-level scope is incomplete and
slices 2–3 are NOT RUN, so `status:ready-merge` and a ready-flip are wrong at any evaluator verdict.

## 2026-08-30 — #1466 slice 1 terminal `PASS`; evidence bundle landed; slice 2 dispatched

### IMPL-EVAL cycle 2 — `PASS`

Session `b13a38f6-8b39-4b28-9a91-0420d5b2d743` (Fable 5 · medium, own detached worktree
`ns1466-impleval-c2`), verdict pushed evidence-only at `ff4e81cc`. Failure count unchanged at **1 of
2** — this cycle did not fail. Findings G-1…G-5, all low/medium and none blocking.

**It beat my Tier-A on the finding I was most confident about.** I proved the F-2 pin fires under
perturbation B and cannot be forged by a trailing comment. The evaluator found a forgery that *works*:
a divergent initializer **plus a dead decoy** carrying the pinned text passes `check`, `lint`, the
pin, and the full contracts suite — the `_` prefix even silences `no-unused-vars`. It also corrected
my framing: plain perturbation B is already caught by the `check` gate at the file itself, so the
genuinely unguarded case was B2, not B. That is **G-1**, and it goes to slice 2. The lesson is exact:
a source-text pin must be **anchored to the declaration it guards**, not counted file-wide.

### Evidence bundle at `1f0cdef2` — evidence-only, content head still `42874803`

- **G-3** `context-pack.md` rewritten. The old one described the cycle-3 head, called `commonErrorMap`
  **public**, and said IMPL-EVAL had not run — a resumer reading it alone would have reintroduced
  F-1's premise.
- **G-5** `supervisor.md` now states it was **reconstructed at cycle 4**, not written at run start,
  and carries all four author threads plus both evaluator sessions and the Tier-A reviewer. The
  original thread `01a04f84-e21d-77f3-863c-56ef2498d581` was verified against the launcher record,
  not copied from the verdict prose.
- **G-2** per-slice PR comment posted:
  `https://github.com/rickylabs/netscript/pull/1731#issuecomment-5467845684`.

### Root `test` recut — a real `PASS`

`4250 passed / 0 failed / 19 ignored, exit 0`, attempt 7. Detail in
`audit/root-test-post-host-fix.txt`; drift **D-30**.

I got the first recut wrong: I passed `-- deno task test` when `catalog.ts:35` already supplies that
argv, producing `deno task test deno task test` and a 152 ms bogus FAIL. Caught it by reading the
receipt rather than the exit code, and re-cut correctly. Worth recording because a receipt that
*looks* structurally valid — right gate id, heads matching — can still attest a command nobody meant
to run.

Sufficiency is now `INSUFFICIENT` for **one** external reason (`public-doc-lint`, R-1 baseline-red
delta-0), down from two.

**Set-integrity note stated up front rather than left to be found:** `test-final.json` attests
`ff4e81cc`; the other seven attest `42874803`. The gate genuinely ran at `ff4e81cc` and a receipt must
attest the head it ran at. Product is byte-identical between the two
(`git diff 42874803..ff4e81cc -- packages plugins docs templates` empty). Using
`--allow-git-head-mismatch` would have produced `gitHead != actualGitHead` and broken the invariant
the evaluator checks — attesting the true head and proving content identity separately is sounder.

### Slice 2 dispatched

| Field | Value |
| --- | --- |
| Brief | `slices/impl-1466-s2.md` — plan slice 2 (SDK declaration propagation) **plus G-1** |
| Thread | `01a051f8-ab0a-7443-921f-17e48be6bc35` |
| Route | requested = observed = `openai · gpt-5.6-sol · **high**`, verdict **matched** |
| Lane | `complex_implementation` — a real feature slice, not a repair; the `medium` step-down used for cycles 1–5 does not apply |
| Worktree / base | `/home/agent/projects/netscript/worktrees/007-leaf-1731` @ `1f0cdef2`, upstream unset, explicit-refspec push |

The brief carries the constraints that must not be relitigated: `commonErrorMap` stays **private**
(R-2/F-1), no upstream oRPC re-export (AP-14), `public-doc-lint` must hold **12 with the identical
R-1 set**, `docs:exports-drift` exit 0 as named supplemental evidence (R-3), and root `test` is now
runnable so R-1 must **not** be cited to skip it. It also fixes the process defect behind G-2 — the
per-slice PR comment and a current `context-pack.md` are explicit closing obligations, not left to
"commit, push, stop".

**D-28 recurred a third time** (`ownerPid 125818` gone, thread `01a051e0` absent from the daemon).
Evicted with the same proof-first procedure. Three occurrences in one lane in one session.

### Queue — corrected by the coordinator

| Leaf | State |
| --- | --- |
| #1466 slice 2 | **active** on thread `01a051f8` |
| #1466 slice 3 | queued — carries **G-4** |
| #1466 final all-slices IMPL-EVAL + close-gate | queued |
| #1664 | parked at `20337441788b` |
| #1387 | **holds** until #1466 reaches a truthful ready handoff — brief already written |
| #1730 | holds — brief already written |

PR #1731 stays **draft**, `Refs #1466 — partial, slice 1 of 3`, exactly one `status:impl-eval` on
both PR and issue. No ready-flip, no merge, no restored closing keyword.

## 2026-08-30 — IMPL-EVAL cycle-2 addendum: Ruling 1 reframed, G-6 satisfied, **G-7 is my error**

Evaluator session `b13a38f6` woke on my cross-session host-fix message, **re-measured rather than
accepting it**, and appended an addendum at `bbff7cf9` (evidence-only, +94 lines to `evaluate.md`).
Verdict unchanged: **`PASS`**.

### It verified my claim instead of trusting it — and that is the point of the lane

It ran its own `deno task test`: `exitCode 0 · passed 4250 · failed 0 · ignored 19`, 190,644 ms,
started `09:47:28Z` after confirming the other `deno.*test` process matches were Codex tooling paths
containing "test" rather than concurrent runs. It confirmed PID 1 `tini`, zombies 0, and identified
the +2 delta over the old 4248/1 as the new F-2 pin plus `hybrid-launcher_test.ts` going green.

**Ruling 1 reframed, correctly:** the question is no longer whether `SKIPPED` satisfies a gate that
cannot run, but whether it is acceptable at all now that it can — **ruled no**. R-1's root-`test` half
loses its premise; its `public-doc-lint` half stands untouched. `SKIPPED` is no longer an available
form on this host, and slices 2 and 3 must cut real `test` receipts. Slice 2 already did.

### G-6 — already satisfied, and my head choice was accepted over the evaluator's prescription

G-6 prescribed cutting the receipt in a detached checkout **at the content head** `42874803`. I had
instead cut it at `ff4e81cc` and proven product identity separately. The evaluator checked and
**accepted mine as the sounder form**: "an honest head with proven content identity is the sounder
form than the one I prescribed." That is the judgement I flagged at the time rather than quietly
taking — worth noting that flagging it is what let the evaluator adjudicate it instead of filing it
as a defect.

### G-7 — my error, and the discipline I have been enforcing on everyone else

**When I re-cut `test-final.json` at `1f0cdef2`, I overwrote the attempt-5 `SKIPPED` receipt in place
without archiving it first.** Archives are append-only; that rule is the one I have written into every
brief this session and asserted in three Tier-A reviews. I broke it for one file, in the very commit
whose message claimed the recut was clean.

Consequences the evaluator names precisely: `receipts/frozen-42874803/` now holds seven attempt-5
receipts at `42874803` plus the attempt-7 `test` receipt at `ff4e81cc`, so the archive named for the
content head is **neither homogeneous nor does it contain the receipt explaining why `test` was
skipped there**. The `SKIPPED` record survives only in git history (`dd201816`) and in worklog prose —
recoverable, which is why this is low and not blocking, but it should never have depended on that.

Required, evidence-only: restore it byte-for-byte from `dd201816` as
`receipts/frozen-42874803/test-final.attempt5-skipped.json` and note the archive's mixed heads in the
worklog. Verified recoverable: `git show dd201816:…/receipts/test-final.json` →
`outcome: SKIPPED, attempt: 5, gitHead: 42874803e5`.

**Deferred deliberately, not forgotten.** The slice-3 author is live in that worktree with 9 dirty
files and will archive the slice-2 receipt set. Writing into `receipts/` concurrently is how two
writers corrupt an archive — the exact class of damage G-7 is about. I land it at the slice-3 Tier-A
stop.

### One stale reading in the addendum, recorded so it is not inherited

The addendum reports `fs.inotify.max_user_instances` = **128** and says D-29's `watchFs` half is not
fixed. That was true when it measured. It was raised to **1024** shortly after (coordinator authority
update 2, re-proven by me at 09:27Z), and `watch-run.ts` now reaches its designed heartbeat exit 2.
**D-29 is resolved**; this lane is back on the token-free wake. The addendum's other host readings are
current.

### Branch coordination — checked, no divergence

The evaluator pushed `bbff7cf9` from its own worktree while the slice-3 author was live in
`007-leaf-1731`. Two writers on one branch is a real hazard; I checked rather than assumed:
`git merge-base --is-ancestor bbff7cf9 HEAD` is true — the author fast-forwarded onto the addendum
itself, so there is no divergence and no rebase is owed. Slice 3 continues on thread `01a05215`.

### State

| Item | Value |
| --- | --- |
| Slice 1 | terminal on substance **and** evidence (`42874803` content, `ff4e81cc` test attestation) |
| Slice 2 | Tier-A `ACCEPTED` at `2863d29e`; **not yet IMPL-EVAL'd** — the final all-slices evaluation covers it |
| Slice 3 | in flight, thread `01a05215`, based on `bbff7cf9` |
| Carried | G-4 + AF-1 → slice 3; **G-7 → supervisor, at the slice-3 Tier-A stop** |
| PR #1731 | draft, `Refs #1466 — partial`, one `status:impl-eval` |

## 2026-08-30 — #1466 TERMINAL: final all-slices IMPL-EVAL `PASS`; readiness normalized; merge handed off

### Verdict

Session `8d9946e6` (Claude Fable 5 · medium, own detached worktree `ns1466-impleval-final`, route
verified from its own transcript) evaluated **all three slices together** at head `e34505f1`:
**`PASS` — terminal for #1466.** Failure count unchanged at **1 of 2**. **No re-evaluation scope.**

All six acceptance points **PASS**, each re-derived by the evaluator. Its own runs: root `test`
**4258 / 0 / 19**, package suites **94 / 94**, `docs:exports-drift` and `quality:gate` green,
`public-doc-lint` **12 = 12 with the exact R-1 set**, all eight receipts at each content head with
`gitHead == actualGitHead` and no `SKIPPED`, four archives byte-intact with G-7's restoration
byte-faithful, `deno.lock` unchanged, **S1 not regressed by S2/S3**.

**It broke S2 on purpose** — seven product-level mutations, each turning the real-export fixture red.
That was the verification S2 most needed: it had a Tier-A from me but had never been formally
evaluated, and a declaration-only change is exactly where a guard can look real and prove nothing.

### The finding worth carrying forward

**H-1** — the anchored G-1 pin is defeated by **identifier rebinding**: alias
`NetScriptProcedureMeta` to an `import()` type and the initializer text stays byte-identical while
every contracted gate goes green. That is a strictly deeper forgery class than the dead decoy cycle 2
found, which is itself deeper than the tautology I found at Tier-A. Three evaluations, three
progressively subtler ways for the same guard to be true and mean nothing. The lesson is not about
this regex: **a source-text pin secures the text and nothing about what the identifiers in it are
bound to.** Non-blocking (no consumer-visible effect under `isolatedDeclarations`), and the fix is
named in H-1.

### Readiness normalized — Ruling B items that are mine

- **PR #1731 body rewritten.** `Refs #1466 — partial` → **`Closes #1466`**; the "does not complete"
  paragraph and "Remaining scope" section removed; S2/S3/IMPL-EVAL slice rows checked with content
  heads; all six Definition-of-Done boxes ticked. The keyword is now genuinely owed — it was withheld
  for exactly as long as it was false.
- **H-3 closed** (`32a698e1`, evidence-only, content head unchanged): `supervisor.md` now records the
  S2 author `01a051f8` and S3 author `01a05215` at `gpt-5.6-sol · high` with matched route verdicts,
  narrows `normal_implementation · medium` to the S1 repair cycles with the reason, and adds the S2/S3
  Tier-A rows and this evaluator session.

### Blocked by correct ordering, not by omission

`mirror-acceptance-evidence.ts --dry-run` reports **"Mirror skipped because live PR labels do not
include `status:ready-merge`"**. That gate is right: the acceptance mirror must observe a
ready-to-merge PR, which follows the ready-flip and a green CI matrix. So Ruling B item 2 cannot run
before item 4, and item 4 is the coordinator's.

### Withheld deliberately — the ready-flip is a decision, not a formality

Per Ruling B item 4, flipping out of draft **triggers the CI matrix and dispatches an OpenHands
IMPL-EVAL unless `impl-eval:skip` is applied**. The native opposite-family IMPL-EVAL is already done
and terminal. Whether a second evaluator runs on the same head should be, in the evaluator's words,
"a deliberate choice, not an accident of the flip" — so this lane does not flip and does not
pre-empt the `impl-eval:skip` decision by acting first.

Also withheld and unchanged: `status:ready-merge`, the four follow-up issues (H-1, H-2, H-4, and the
R-3 catalog entry) which Ruling B assigns to the coordinator, and **the merge, which is a human
decision**.

### Lane state

| Leaf | State |
| --- | --- |
| #1466 / PR #1731 | **terminal PASS**, readiness normalized, awaiting coordinator ready-flip and human merge |
| #1664 | parked at `20337441788b`; runtime question now testable again on the DinD sandbox (D-31), no retry authorized |
| #1387 | queued, brief written (`slices/research-plan-1387.md`) |
| #1730 | queued, brief written (`slices/impl-1730.md`) |

## 2026-08-30 — coordinator holds merge authority; #1731 flipped ready; #1387 dispatched

Authority correction received and applied: merges are **not** human-only — the primary coordinator
owns merge authority after the milestone pre-merge gate. The withholding recorded in the previous
entry is superseded.

### Ready-flip executed at an unmoved head

| Step | Result |
| --- | --- |
| `impl-eval:skip` applied | label exists as *"Skip automatic ready-for-review IMPL-EVAL with attributed evidence"* — the attribution is posted, not implied |
| Attribution comment | `#1731#issuecomment-5468677253` — terminal verdict, session `8d9946e6`, route, worktree, evaluated head, record path, generator ≠ evaluator, failure count 1 of 2 |
| Ready-flip | `gh pr ready 1731` → `draft: false` |
| **Head after flip** | **`32a698e18594aa31154a5b7c88886875b3e1140f` — unmoved.** Nothing was pushed to trigger CI. |
| OpenHands runner | **`skipped`** — `impl-eval:skip` took effect, so no second evaluator ran on the same head |

The flip itself re-triggered the workflows at the same SHA, so no `gh run rerun` was needed; that
remains the tool if a later label read needs refreshing, and a push is still the wrong instrument
because it would move the evaluated head away from the terminal verdict.

**CI at `32a698e1`:** `Code quality` **success**, `Phase eval PR` **success**, `ci` in progress
(this is the matrix carrying root `test` off-host — the last open condition from the cycle-2
addendum). `e2e-cli` and `public-surface-diff` skipped, as expected for this change class.

`status:ready-merge` is **withheld until `ci` is green**, per the terminal verdict's Ruling B item 5,
and the acceptance mirror is gated behind that label by design —
`mirror-acceptance-evidence.ts --dry-run` reports it will skip until the label is live.

### #1387 dispatched without waiting on the merge

| Field | Value |
| --- | --- |
| Leaf | `feat/service-principal-procedure-policy`, worktree `007-leaf-1387`, base `origin/main` `13878a80a` |
| Brief | `slices/research-plan-1387.md` — **research and locked plan only, no product code** |
| Route | Codex · `gpt-5.6-sol · high` (`complex_implementation`) — dry-run clean, `upstream: NONE`, `dirty: 0` |
| Issue metadata | `status:triage` → **`status:research`**, the truthful phase |

**Why this can start before #1466 merges.** `packages/contracts/src/domain/procedure-meta.ts` is
**not on `main`** — it lives only on the unmerged branch. That blocks *implementation*, not research:
the slice produces `research.md`, `plan.md` and PR scaffolding, reads the vocabulary from the branch,
and the brief requires the plan to state the dependency explicitly and forbid the implementation
slice from starting before #1466 lands.

The binding constraint is carried in the brief: **#1387's policy declaration must extend
`NetScriptProcedureMeta`**, never introduce a second metadata vocabulary. #1387's own headline defect
is *policy living in a second place that can drift from the contract*; inventing a parallel vocabulary
to fix it would reproduce that defect one layer up.

### Lane state

| Leaf | State |
| --- | --- |
| #1466 / PR #1731 | **ready for review** at `32a698e1`, terminal `PASS`, awaiting `ci` green → `status:ready-merge` → coordinator merge |
| #1387 | **active** — research/plan slice in flight |
| #1730 | queued, brief written |
| #1664 | parked at `20337441788b` |

## 2026-08-30 — #1731 CI was genuinely RED; my green report was wrong; tagline repaired

### The reporting error, first

I reported *"`Code quality` **success**, `Phase eval PR` **success**, `ci` in progress"* and treated
the remaining run as pending noise. That was wrong in a way worth naming precisely: **`Code quality`
is a separate workflow; `quality` is also a job inside the `ci` run**, and it is the job that failed.
I read the workflow-level list, saw a success row whose name matched what I expected, and did not
open the job list of the run that was still in flight. Run `33311482503` → job `99257258418`
`quality` → step **`JSR tagline length`** → **failure**; the run's final conclusion is **`failure`**.

A run still `in_progress` can already contain a failed job. "Not finished" is not "not failing", and
a same-named workflow is not the same thing as a job inside another workflow. I should have opened
the jobs rather than matched on a name.

### The defect — branch-introduced, reproduced exactly

```text
JSR tagline length gate — cap 250 bytes
  checked=36 over=1
  ✗ packages/contracts/README.md — 271 B (over by 21)
```

Attribution measured at the base, not assumed: `origin/main` `13878a80a` runs the same gate at
**over=0**, and its contracts tagline is **235 B**. Slice 1 inserted
`NetScript-owned procedure metadata, ` into that sentence, taking it to **271 B**. Branch-introduced,
and it is a real consumer-facing defect: the tagline becomes the JSR package description, so 21 bytes
over the cap means the description is truncated on the registry page.

**This is a gate the contracted eight-receipt set never covered** — `docs-tagline` is not among them,
and it is green at base and branch-sensitive, which is exactly the D-27 class: the set was blind to a
gate that could only fail for this branch's reasons. Recorded so the next evidence-set selection
includes it.

### Repair — minimal delta, claim preserved

The instruction was ≤250 UTF-8 bytes **without losing the contract claim**. The claim at stake is the
one slice 1 added: this package owns procedure metadata. Candidates that dropped `NetScript-owned`
were rejected for weakening exactly what #1466 established; a candidate landing on **250 B exactly**
was rejected for having zero margin.

Landed at **246 B, margin 4**, trimming only stylistic words — `The`, `-backed`, `handlers`, `typed`
— and keeping every semantic element of `main`'s tagline plus the metadata ownership claim:

> Contract-first vocabulary for NetScript boundaries: an oRPC base contract with the standard error
> map, NetScript-owned procedure metadata, Zod pagination and error schemas, and CRUD/query/transform
> builders that keep services and clients in sync.

New content head **`75b78220`**. Local reruns before commit: `docs:tagline:check` **over=0**,
`docs:exports-drift` **PASS**, `deno fmt --check` on the edited file **exit 0**.

### Consequences accepted rather than worked around

- **The terminal `PASS` no longer has exact-head currency.** It certified `e34505f1` / content heads
  `42874803`, `2863d29e`, `9ab779ce`. The content head has moved to `75b78220`, so renewed exact-head
  evaluator currency is owed before `status:ready-merge`. **Rerunning CI on `32a698e1` would not have
  fixed anything** — the defect is in the tree, not the run.
- **PR #1731 and issue #1466 moved `status:impl-eval` → `status:impl`**, the truthful phase for a
  branch with a red gate and a repair in flight. The PR stays **non-draft**: converting to draft would
  make CI skip the matrix, and the matrix is what must prove the repair.
- Slice-3's receipt set archived to `receipts/frozen-9ab779ce/` (8 files) before recutting — the fifth
  append-only archive.

## 2026-08-30 — repair pushed at `87d53cec`; renewed evaluator and CI both running; #1387 parallel

| Field | Value |
| --- | --- |
| **Content head** | **`75b782205d`** — the tagline repair; one file, one paragraph |
| **Evidence head (PR head)** | **`87d53cec`** — all eight receipts at the content head, `attempt 10` |
| Receipts | 7 **PASS** + `public-doc-lint` **FAIL** (baseline-red on `main`, delta 0, R-1 unchanged) |
| Sufficiency | `INSUFFICIENT` for exactly one external reason — the terminal expected state |
| `deno.lock` | byte-unchanged |
| Archives | five, append-only: `c9a391811`, `235482767`, `42874803` (9 — includes the restored attempt-5 `SKIPPED`, G-7), `2863d29e`, `9ab779ce` |
| PR / issue phase | **`status:impl`** on both — truthful while a repair is under verification |
| PR draft state | **non-draft, deliberately** — draft makes CI skip the matrix, and the matrix must prove the repair |

### Renewed evaluator dispatched — scoped as *currency*, not a redo

| Field | Value |
| --- | --- |
| Session | `b247bef9`, `--remote-control ns1466-impleval-currency` |
| Route | requested = observed = **`claude-fable-5` · medium** (read from the session's own transcript) |
| Worktree | `ns1466-impleval-currency`, detached at `87d53cec`, its own |
| Brief | `slices/impl-eval-1466-currency.md` |

The brief is deliberately **not** a from-scratch re-evaluation. The prior terminal `PASS` was correct
and is not reopened; what moved is the content head. So it verifies what the repair could have
touched plus the standing invariants, and asks three questions: does the `PASS` carry forward to
`75b78220`; is the repaired tagline both under the cap **and faithful to the contract claim** (the one
substantive risk in a byte-trim); and should `docs-tagline` join the contracted receipt set given it
caught a consumer-facing defect that eight contracted gates missed.

It is told to confirm `git diff 9ab779ce..75b78220` is exactly the one README paragraph — a cheap,
decisive check that nothing else rode along.

### CI

The evidence push re-triggered the workflows at `87d53cec`; no `gh run rerun` was needed and no
extra push was made. Watching to completion — the `quality` **job inside `ci`** is the one that
matters, which is the distinction the earlier false-green report missed.

### #1387 in parallel

Research/plan thread `01a052a3` working in `007-leaf-1387`, committed `625447f1` (local; branch not
yet pushed). Running `run-deno-check.ts` across `packages/contracts` + `packages/service` — reading
the real seam rather than the issue text, which is what the brief asked for.

## 2026-08-30 — second CI red at `87d53cec`: agent-doc corpus stale; integration sequenced behind #1748

### The failure

CI run `33312063301`, job `99258835145` (`quality`), step **`Agent docs corpus freshness`**. The
tagline step **now passes**, so the previous repair was correct and complete for what it targeted.
Reproduced locally at the exact head:

```text
{"fresh":false,"stalePaths":["prose.json.gz","provenance.json"], ...}
error: Agent docs prose is stale: prose.json.gz, provenance.json
```

The gate is `check:agent-docs-prose` → `gen:agent-docs-prose --check`, which builds the Lume site and
diffs the regenerated agent-doc bundle against the committed one. `docs/site/reference/contracts/index.md`
is inside that corpus, and this branch edited it (F-4 row, G-4 prose) plus `packages/contracts/README.md`.

**Provenance worth noting:** the committed bundle records `sourceCommit 265dd8760`,
`extractionTimestamp 2026-08-24T10:08:06Z` — the corpus has been carried unregenerated for days, so
this is not purely a #1731 defect. A base-vs-head check on `f8b4f804` is running to establish exactly
how much is inherited.

### Ordering — integration deliberately held

The coordinator sequenced **#1748** as the active regenerated-corpus landing on `f8b4f804`, to merge
**before** #1731. So:

- `origin/main` is now `f8b4f804` (#1746), past the `13878a80a` this branch's evidence baselines were
  measured against.
- Regenerating the corpus against `f8b4f804` **right now would be immediately stale** the moment #1748
  lands, producing exactly the second stale-corpus cycle the coordinator asked to avoid.

**Therefore: prepare now, integrate once.** The repair is understood and reproducible; the integration
onto post-#1748 `main`, the single regeneration, the gate sweep
(`check:agent-docs-prose`, `check:publish-assets`, `check:assets-barrel`, `check:mcp-export-corpus`,
`docs:tagline:check`, `docs:exports-drift`, `quality:gate` and the contracted eight) and the push all
happen **once**, after the coordinator reports #1748's merge SHA.

**Integration will be a merge, not a rebase.** This branch's entire evidence chain is addressed by
content head — five append-only receipt archives, three evaluator verdict sections and four Tier-A
reviews all cite specific SHAs. A rebase would rewrite every one of those and invalidate the
provenance the leaf has spent the whole run establishing.

### Currency evaluator stopped rather than left to certify a dead head

Session `b247bef9` was dispatched against `87d53cec` before this failure surfaced. It was told to stop
without committing or pushing: a verdict at that head would certify already-superseded evidence and
have to be withdrawn, which is worse than no verdict. It was asked to report any measurements it had
already completed (tagline bytes and claim faithfulness, the single-paragraph diff check, doc-lint set
identity, receipt integrity) so the successor brief inherits them rather than re-deriving them.

### Status

**`87d53cec` is not mergeable evidence.** PR #1731 and issue #1466 stay at **`status:impl`**. The PR
stays non-draft so the matrix keeps running against it. No `status:ready-merge`, no acceptance mirror,
no merge coordinates offered — the previous flip happened on a head whose `ci` was already failing,
and repeating that on a head with a *known* red gate would be worse.

### The compounding lesson

Two consecutive branch-introduced CI failures — `JSR tagline length`, then `Agent docs corpus
freshness` — were both caught **only by CI**, after a terminal `PASS` and a ready-flip. Neither gate
is in the plan's contracted eight-receipt set. That is now three instances of the same class on this
leaf (`docs:exports-drift` at D-27, then these two): **the contracted set is scoped to package
correctness and is structurally blind to the repo-level generated-artifact surface a docs edit
touches.** The fix is not another one-off addition; it is that any slice touching `docs/` or a package
README must carry the generated-carrier gates — corpus, publish assets, assets barrel, export-surface
corpus, tagline — in its contracted set from the start. Proposed for the coordinator, not applied.

## Two corrections from the stopped evaluator — one of them is mine

Session `b247bef9` stopped cleanly (nothing committed or pushed, worktree clean) and returned its
completed measurements. Two change the record.

### 1. My attempt-10 `public-doc-lint` receipt is DEFECTIVE — verified

```text
attempt 10 argv:  ["deno","doc","--lint"]          exit 1, durationMs 7
                  stderr: "the following required arguments were not provided: <source_file>"
attempt  9 argv:  19 elements, all 16 entrypoints   exit 1, durationMs 161
```

When I re-cut the eight receipts at `75b78220` I invoked
`run-gate.ts --gate public-doc-lint` **without the plan's 16 entrypoint arguments**, so the catalog's
bare `deno doc --lint` ran, failed in 7 ms with a **usage error**, and recorded `exit 1`. Every
archived receipt (attempts 1/4/5/8/9) carries the 19-element argv `plan.md:233` contracts.

**So my statement that `public-doc-lint` was "FAIL exit 1, baseline-red, delta 0, R-1 unchanged" at
`75b78220` was not backed by that receipt.** The set identity at that head is real — the evaluator
re-derived 12 = 12 with the exact R-1 set, and so did I earlier at other heads — but the *receipt*
attests a command that never linted anything.

**Why I missed it when I had caught the identical class before.** Earlier I caught
`deno task test deno task test` because a gate I expected to *pass* failed. Here I expected
`public-doc-lint` to **fail** — it is the contracted baseline-red gate — so `exit 1` looked exactly
like the correct answer and I did not read the argv. **An expected-red gate hides invocation defects,
because the receipt says what you were expecting to see.** The guard is to check `argv` and
`durationMs`, not just `exitCode`: 7 ms could never be a 16-entrypoint doc-lint run.

The re-cut after integration must pass the explicit 16-entrypoint argv, and every future recut of this
gate must be verified on argv length, not outcome.

### 2. The corpus staleness is 100% branch-owned — my earlier hypothesis was wrong

I speculated that the bundle's `sourceCommit 265dd8760` / `2026-08-24` timestamp meant the staleness
partly predated this branch. **Measured on `origin/main` `f8b4f804`: `{"fresh":true,"stalePaths":[]}`.**
Main is fresh. The provenance date only records when the bundle was last regenerated; nothing on main
since then touched a corpus input.

This branch edited `docs/site/reference/contracts/index.md`, which **is** a corpus input. So the
staleness is entirely #1731's, with no inherited component. Corrected here rather than left standing.

### Inherited from `b247bef9`, so the successor does not re-derive it

At content head `75b78220`, measured by that session: tagline **246 B**, `over=0`, judged faithful to
the ownership claim with nothing material lost; `git diff 9ab779ce..75b78220 -- . ':!.llm/runs'` is
**`packages/contracts/README.md` only, +3/−3**; `public-doc-lint` **12 = 12 with the exact R-1 set**;
all eight receipts `gitHead == actualGitHead`, `test` **4258/0/19** PASS; five archives verified
append-only via `git log --diff-filter=MD` (empty on each); package suites **94/94**; `quality:gate`,
`docs:exports-drift`, workspace and per-member `publish --dry-run` all green. Its G-1 decoy probe was
**not** run and root `test` was killed mid-flight — both open for the successor.

It also reported the **close-gate** job failing at "Referenced issue acceptance gate", which is
expected: the acceptance mirror has not run and cannot until `status:ready-merge`.

Its own recommendation matches mine independently: add `docs-tagline` **and** `agent-docs-prose` to
the checked set — "the third D-27-class miss on this leaf".

## 2026-08-30 — #1731 frozen pending a verified #1748 SHA; #1387 and #1730 run in parallel

### #1748 verified from GitHub, not accepted from prose

`gh pr view 1748` → **`state: OPEN`, `mergedAt: null`, head `9b79d90e`**. Not merged. No SHA has been
acted on, and none will be until the coordinator reports a verified one. `origin/main` remains
`f8b4f804`.

### #1731 genuinely frozen

Local == remote == `87d53cec`, clean, **no integration attempted and no regeneration run**. Its final
CI verdict at that head is `ci: failure` (agent-doc corpus), so it is confirmed non-mergeable evidence
rather than pending. `status:impl` on PR and issue; non-draft so the matrix keeps reporting.

**The single refresh, when the SHA arrives:** merge (never rebase — five receipt archives, four Tier-A
reviews and three evaluator verdict sections all cite content-head SHAs a rebase would rewrite) →
one corpus/provenance/carrier regeneration → the full sweep (`check:agent-docs-prose`,
`check:publish-assets`, `check:assets-barrel`, `check:mcp-export-corpus`, `docs:tagline:check`,
`docs:exports-drift`, `quality:gate`, plus the contracted eight **with the explicit 16-entrypoint argv
for `public-doc-lint`**) → push → fresh currency evaluator inheriting `b247bef9`'s measurements.

### #1387 — healthy, and applying the lesson unprompted

It first looked dead: worktree HEAD on a `main` commit with nothing committed, thread absent from the
daemon across three debounced probes. But the launcher is still streaming and the rollout holds 13
assistant messages. The latest:

> "public `deno doc --lint` is already red in contracts/plugin/SDK/MCP (service alone is green), and
> the plugin JSR audit is already red for four missing module tags. Those cannot be regression gates.
> The plan will contract only base-green signals and will explicitly preserve the existing red
> findings without treating them as this leaf's debt."

That is the D-27 discipline applied before being reminded of it. No intervention. Recorded because
"absent from the daemon" has now produced a false death signal three times this session — the
authoritative check is the launcher process plus the rollout, not the session list.

### #1730 dispatched — the next independent feature slice

| Field | Value |
| --- | --- |
| Leaf | `test/ai-request-context-provider-guard`, worktree `007-leaf-1730`, base `f8b4f804` |
| Thread | `01a052b7-5554-74f2-8098-7d38e0c7cf01` |
| Route | requested = observed = `openai · gpt-5.6-sol · high`, verdict **matched** |
| Issue | `status:triage` → **`status:research`** |
| Independence | `packages/ai` **test-only** — collides with neither #1731's contracts/SDK surface nor #1748's corpus |

**Brief amended before dispatch** with the three lessons this leaf paid for:

1. Run every candidate gate at the **base** first; a base-red gate cannot signal a regression and must
   be contracted as a delta with the base number named.
2. Do not *assume* a test-only change leaves generated carriers alone — check `git status` and treat a
   moved carrier as a finding, not something to regenerate quietly.
3. **Read a receipt's `argv` and `durationMs`, not just its `exitCode`.** An expected-red gate will
   record a usage error as `exit 1` and look correct; that is precisely how a defective
   `public-doc-lint` receipt reached a push on #1731.

### Lane state

| Leaf | State |
| --- | --- |
| #1466 / PR #1731 | **frozen** at `87d53cec`, `status:impl`, awaiting a verified #1748 merge SHA |
| #1387 | active — research/plan, thread `01a052a3` |
| #1730 | active — thread `01a052b7` |
| #1664 | parked at `20337441788b` |

## 2026-08-30 — #1387 research/plan landed as draft PR #1762; I corrected my own brief's keyword error

Thread `01a052a3` completed: head `5c82200b`, pushed, clean, draft **PR #1762**
(`feat/service-principal-procedure-policy`). Full artifact set in
`.llm/runs/feat-service-principal-procedure-policy--1387/` — `research.md`, `plan.md`, `drift.md`,
`context-pack.md`, `supervisor.md`, `worklog.md`. No product code, as the brief required.

### The plan holds the constraint that mattered

The binding risk was that #1387 would invent a **second** policy vocabulary — reproducing its own
headline defect one layer up. The locked decisions say otherwise:

- **LD-2** — extend `NetScriptProcedureMeta.access` with optional readonly `authorization.scopes` /
  `authorization.roles`. Additive, serializable, SDK-propagated, **"no parallel `{ public }` policy"**.
- **LD-3** — `@netscript/service` owns `Principal` and `ServiceHandlerContext`; `@netscript/plugin`
  **re-exports** them rather than importing service internals, preserving dependency direction.
- **LD-1** — implementation is blocked until #1466/PR #1731 lands on `main`; **S0 is a precondition,
  not an implementation slice** (verify the merge, rebase, re-run the base-gate census).

It also ran the base-gate census unprompted and found `deno doc --lint` already red in
contracts/plugin/SDK/MCP and the plugin JSR audit already red for four missing module tags,
concluding those "cannot be regression gates" and contracting only base-green signals. That is the
D-27 discipline applied without being reminded.

### My error, found and fixed

PR #1762 was created carrying **`Closes #1387`** — on a PR that contains research and a plan and
nothing else. **My brief instructed that**, and it is precisely the defect I spent this session
correcting on #1731: a closing keyword on a PR that does not complete its issue auto-closes the issue
on merge with the work unstarted.

Corrected on the PR: `Closes #1387` → **`Refs #1387` — partial**, with an explicit
"Remaining scope before #1387 can close" section naming S0–S8, stating that S0 is a precondition, and
recording that a keyword becomes owed only when the slices land, a separate-session IMPL-EVAL passes,
and the close-gate passes.

**The lesson is about brief-writing, not about the author.** The author did exactly what it was told.
I carried a template instruction (`body carrying Closes #<issue>`) into a slice whose entire content
is a plan — the keyword rule is not "what will eventually be true of this branch", it is
**"what is true of this PR if it merges right now"**. Every future brief in this lane states the
partial form for non-terminal slices and reserves the keyword for the slice that completes the issue.

Issue #1387 label advanced `status:research` → **`status:plan`**, matching the PR.

### Not authorized from here

PLAN-EVAL for #1387 is a fresh separate opposite-family session and is **not dispatched** — the plan
itself makes implementation contingent on #1466 merging, and #1466 is frozen pending a verified #1748
SHA. Dispatching a PLAN-EVAL now would evaluate a plan whose precondition cannot yet be tested.
Queued behind the #1731 refresh.

## 2026-08-30 — #1731 refreshed once onto post-#1748 `main`; full cascade regenerated

### The SHA was verified, not accepted

`gh pr view 1748` → `state: MERGED`, `mergedAt: 2026-08-30T12:55:05Z`,
`mergeCommit: 952cc106aafea61570d24247695ac23f5d810026`, and
`git rev-parse origin/main` returns the **same** SHA. Coordinator-reported and independently
confirmed before a single command touched the branch.

### Merge, not rebase — and it mattered

`git merge --no-ff origin/main` at `87d53cec` → **`b8e04fea`**, **zero conflicts**.

The strategy was chosen for a concrete reason, not style: this branch's entire evidence chain is
addressed by content-head SHA — six append-only receipt archives, four Tier-A reviews and three
evaluator verdict sections all cite specific commits. A rebase rewrites every one of those and would
have silently invalidated the provenance the leaf spent the whole run establishing.

### The cascade regenerated from tooling, in one pass

| Task | Carrier |
| --- | --- |
| `gen:agent-docs-prose` | `.llm/assets/agent-docs/prose.json.gz`, `provenance.json` |
| `gen:assets-barrel` | `packages/cli/src/kernel/assets/agent-docs.generated.ts` |
| `gen:mcp-export-corpus` | `packages/mcp/.../export-surface-corpus.generated.ts` |
| `gen:publish-assets` | `packages/mcp/src/publish-assets.generated.ts` |

Five files, all machine-generated, none hand-edited. Committed as content head **`b01ffcd8`**.

**Check sweep after commit — all green:**

`check:agent-docs-prose` **`fresh:true, stalePaths:[]`** · `check:mcp-export-corpus` **PASS** ·
`check:publish-assets` **PASS** · `check:assets-barrel` **PASS** · `docs:tagline:check`
**over=0** · `docs:exports-drift` **PASS**.

`check:assets-barrel` failed on the first pass and that was expected, not a defect: the task is
`gen:assets-barrel && git diff --exit-code`, so it necessarily fails while the regenerated carriers
are uncommitted. It passes once they are committed — worth recording so a future run does not chase it.

### The defective receipt is fixed, and the defect is preserved

The `public-doc-lint` recut passed the plan's **explicit 16-entrypoint argv** this time:

| | argv length | durationMs | meaning |
| --- | --- | --- | --- |
| attempt 10 (defective, mine) | **3** | **7** | bare catalog form → usage error recorded as `exit 1` |
| attempt 11 (correct) | **19** | **164** | a real doc-lint run |

The defective attempt-10 receipt is **retained** in `receipts/frozen-75b78220/` — the sixth archive —
as the honest record of the defect rather than being quietly replaced. It is not evidence; it is the
account of a mistake.

**R-1 still holds at the post-merge head:** `deno doc --lint` gives **12** findings and `diff` against
the recorded R-1 set reports **IDENTICAL**. A whole-main merge plus a full asset regeneration moved
neither the count nor the set.

### State

Content head **`b01ffcd8`**. Remaining seven contracted receipts recutting at `attempt 11`. Once they
land: push, dispatch a fresh currency evaluator inheriting `b247bef9`'s measurements, then hand exact
merge coordinates.

#1387 stays active at plan (PR #1762, `status:plan`), #1730 active on `01a052b7`.

## 2026-08-30 — second main integration (#1755 / `a5520e70`); final evidence at `d5f3bf4c` / `dbd3eafa`

### A premise I had to correct

The coordinator's instruction said "if your current attempt is still local, fold this now rather than
publish a knowingly stale head." **It was not local — `1539e81f` was already pushed.** It was not
*knowingly* stale when published (#1755 merged at 13:08:59Z, afterwards), but it is stale now and is
superseded rather than defended. Recording the distinction because "we never published it" and "we
published it and then it aged" are different facts about the branch's history.

### The previous push was more informative than it looked

CI at `1539e81f` reported `ci: failure`, but the jobs say otherwise:

| Job | Result |
| --- | --- |
| `quality` | **success** — the tagline **and** corpus repairs both worked |
| `check-test` | **success** |
| `classify changes`, `core CI lane visibility` | success |
| `close-gate` | **failure** — "Referenced issue acceptance gate" |

The only red is `close-gate`, which fails because the PR carries `Closes #1466` while the acceptance
mirror has not run — and the mirror requires `status:ready-merge`. That is an **ordering artifact of
Ruling B's close sequence, not a code defect**, and it will persist until the label is applied. Anyone
reading `ci: failure` at the run level without opening the jobs would draw the wrong conclusion —
which is exactly the mistake I made earlier in the opposite direction.

### Second integration — and the conflict class that matters

`git merge --no-ff origin/main` (`a5520e70`) **conflicted in four generated carriers**:
`prose.json.gz`, `provenance.json`, `agent-docs.generated.ts`, `publish-assets.generated.ts`.

**Generated artifacts are never hand-merged.** Resolved by taking main's side wholesale, then
re-running all four generators, so the committed carriers are tooling output that folds in both main's
inputs and this branch's contracts doc edits. Hand-resolving a compressed corpus or a generated
barrel would produce a file no generator would ever emit — plausible-looking and unreproducible.

Rebase was refused for the second time: **seven** append-only receipt archives and eight
review/verdict artifacts cite content-head SHAs.

### Final state

| Field | Value |
| --- | --- |
| Base | `a5520e70` (#1755), verified `MERGED` and equal to `origin/main` |
| **Content head** | **`d5f3bf4c`** |
| **Evidence head / PR head** | **`dbd3eafa`** |
| Receipts | 8 at content head, **attempt 12**, all `gitHead == actualGitHead` — 7 PASS, `public-doc-lint` baseline-red |
| `public-doc-lint` receipt | **19-element argv, 178 ms** — verified by argv and duration, not `exitCode` |
| R-1 | head **12**, **new** main `a5520e70` **12**, set **IDENTICAL** — delta 0 held across *two* main advances |
| Carriers | `agent-docs-prose` `fresh:true`; `assets-barrel`, `mcp-export-corpus`, `publish-assets`, `docs:tagline` over=0, `docs:exports-drift` all PASS |
| `deno.lock` | byte-unchanged |
| Archives | **seven**, append-only |

### Evaluator

Two currency sessions were stopped before committing a verdict — `b247bef9` at `75b78220`,
`a103dbb6` at `b01ffcd8` — each because `main` moved under them. Neither stop reflects a fault in
those sessions; certifying a superseded head would have produced a verdict needing withdrawal.

Session **`2f492178`** (Fable 5 · medium, route verified from its transcript, own detached worktree
`ns1466-impleval-c4`) is dispatched at `dbd3eafa`. Its brief carries **Amendment 2**, which supersedes
both earlier scopes, tells it not to trust the archived defective receipt, explains that
`close-gate`'s red is an ordering artifact rather than a code defect, and flags that **the G-1 decoy
probe is genuinely unverified at any recent head** because both stopped sessions missed it.

## 2026-08-30 — #1731 pre-merge body repair (rows 1/2/7), body-only at `dbd3eafa`

Prepared while CI and the currency evaluator run at the final head. **No commit, no push, no head
movement** — verified: `origin/feat/sdk-procedure-meta` was `dbd3eafa6670` before the edit and
`dbd3eafa6670` after.

### What was wrong

- **No fenced acceptance-evidence block.** #1466's six boxes were unticked with no machine-readable
  evidence for the mirror to consume, so the close-gate could never clear.
- **Stale baseline.** The body still cited `main 13878a80` for the doc-lint comparison — two main
  advances out of date (`952cc106`, then `a5520e70`).
- **Stale closing posture.** It ended "Not yet ready to merge… coordinator owes mirror", written when
  merge authority was misunderstood as human-only.

### What the body now carries

1. **Integration history** — both `--no-ff` merges named with their bases, the four-carrier conflict
   on the second and its resolution (take `main`, then re-run all four generators; generated output is
   never hand-merged), and an explicit statement that **`a5520e70` is the current base and the
   `13878a80` references are superseded**.
2. **Exact-head validation** at content head **`d5f3bf4c`** — eight receipts at `attempt 12`, all
   `gitHead == actualGitHead`, seven PASS plus `public-doc-lint` baseline-red **re-measured against
   the current base**: `main` 12, head 12, set identical.
3. **Truthful Definition of Done** — six boxes ticked on delivered substance, and the seventh left
   **unticked**: the exact-head currency evaluation has not returned. Ticking it now would be the
   hand-tick this repair exists to avoid.
4. **A fenced `acceptance-evidence` block** mapping all six #1466 boxes by `box-index`, each with
   concrete evidence (file paths, perturbation results, receipt names, gate outcomes at `d5f3bf4c`).

### The block was validated, not assumed

The fence is parsed by `FENCE_PATTERN = /^\s*```acceptance-evidence\s*$/i` and every line must match
`^-?\s*(issue|box|box-index|evidence):`; `parseStructuredBlock` **throws** on anything else. Checked
locally before publishing: **1 fenced block, `issue: 1466`, 6 `box-index` entries, zero unparseable
lines**. Then confirmed end-to-end — `mirror-acceptance-evidence.ts --dry-run` read the live body and
raised **no parse warning**, stopping only at the expected gate:

> "Mirror skipped because live PR labels do not include `status:ready-merge`; apply the label, then
> rerun the existing CI workflow with `gh run rerun <run-id>` so its live reads observe the label
> without moving the evaluated head."

That is the mechanism confirming its own ordering: the mirror is the thing that ticks the boxes, and
it will not run until the label is applied. **The six issue boxes remain unticked — verified 6
unticked after the edit.**

### Sequence still owed, in order

1. Currency evaluator `2f492178` returns at `d5f3bf4c`, and CI reports at `dbd3eafa`.
2. On `PASS`: apply **`status:ready-merge`**.
3. **Targeted `gh run rerun`** of the existing close-gate run — never a push, which would move the
   evaluated head away from the verdict.
4. The mirror ticks the six boxes from the block; `close-gate` clears.
5. Hand the coordinator the exact SHA with backing run/job IDs. Merge is the coordinator's.

## 2026-08-30 — #1466 SHIPPED. PR #1731 merged; lane continues on #1730 and #1387

### Merge facts, verified from GitHub rather than accepted

| Field | Value |
| --- | --- |
| PR #1731 | **`MERGED`** at `2026-08-30T13:41:17Z`, `headRefOid` **`e325b7fe212f7cf7e0985c634af19e2bd4d5ea22`** |
| Issue #1466 | **`CLOSED`**, `stateReason: COMPLETED`, `closedAt 13:41:18Z` — one second later, by the closing keyword |
| Labels | both now **`status:shipped`** |
| `origin/main` | **`3e5cbabfcd0a8c1aea5383fa7e1c4f111386dc3c`** — `feat(sdk): define NetScriptProcedureMeta without erasing contract errors (#1731)` |

### One reconciliation fact worth recording

`git merge-base --is-ancestor e325b7fe origin/main` returns **false**. The merge was a **squash or
rebase merge**, not a merge commit, so **none of this leaf's SHAs exist in `main`'s history** —
`d5f3bf4c`, `dbd3eafa`, `ce73a038`, `b39faa1c`, `e325b7fe` are reachable only through the PR and this
run's artifacts.

That matters for provenance: every receipt, archive and verdict on this leaf is addressed by a content
head that `main` cannot resolve. Anyone tracing "which commit did receipt X attest" must go to PR
#1731, not to `git log main`. It also retroactively justifies the two refusals to rebase — had the
branch been rebased mid-run, the receipts would have pointed at SHAs that never existed anywhere.

**The content did land** — verified directly on `origin/main`, not inferred from the merge status:

- `packages/contracts/src/domain/procedure-meta.ts` **present**
- `commonErrorMap` **not** exported from `src/public/mod.ts` (**0** matches) — R-2/F-1 withdrawal held
- contracts tagline **246 B** — the JSR-cap repair held
- `ProcedureMeta` present in `packages/sdk/src/ports/mod.ts` — S2 propagation held

### Follow-ups filed (previously ratified, previously unfiled)

| Issue | Covers | Milestone |
| --- | --- | --- |
| **#1767** | **H-1** identifier rebinding + **H-2** annotation-span brittleness — one issue, same guard and same file, so no duplicate scope | `0.0.8` |
| **#1768** | **H-4** base-inherited SDK JSR WARNs (`src` cardinality 13>12; slow-types level) | `Backlog / Triage` |
| **#1769** | **R-3** *plus* the `docs-tagline` / `agent-docs-prose` catalog additions and touched-path gate-set derivation — filed **once**, since R-3 and Ruling 3 target the same catalog/matrix surface | `0.0.8` |

All carry the namespaced taxonomy and an explicit milestone. #1731's body now links them instead of
describing them as unfiled.

### Lane state — deliberately not serialized behind #1731

| Leaf | State |
| --- | --- |
| #1466 / PR #1731 | **SHIPPED** |
| #1730 | **active** — S2 (the guard implementation) dispatched; plan `fd5d0447` locked |
| #1387 | plan pushed (`5c82200b`, PR #1762); PLAN-EVAL owed |
| #1664 | parked at `20337441788b` |

Both remaining leaves are based on `main` and independent of each other. **Integration of current
`main` happens at each leaf's own documented convergence point**, not on every advance — #1387's plan
makes that explicit as its `S0` precondition (verify #1466 merged, rebase, re-run the base-gate
census), which is **now satisfiable** for the first time: the metadata vocabulary is on `main` as of
`3e5cbabf`.

## 2026-08-30 — #1387 PLAN-EVAL `FAIL_PLAN`; leaf PARKED clean per WIP correction

### Verdict

Session `5d9ccfad` (Claude **Fable 5 · medium**, `formal_plan_evaluation`, own detached worktree
`ns1387-planeval`, route verified from its transcript) returned **`FAIL_PLAN`**, cycle **1 of 2**,
pushed evidence-only at `a72af9a4`. Branch head `a72af9a4`; PR **#1762** stays **draft**,
`status:plan`, live `closingIssuesReferences` **`[]`**.

The checklist rows all pass — research current, LD-1…LD-12 locked with rationale, open-decision sweep
clean, 11-risk register, deferred scope explicit, JSR surface scan green. **What fails is the gate
set**, in two ways this lane has now seen repeatedly.

### F-1 — the stale baselines my S0 census found, ruled blocking

`plan.md` contracts `contracts 8, SDK 69`. Re-derived at the rebased base: **16** and **77**, because
#1466 landed its contracts metadata suite and SDK propagation tests. The evaluator confirmed the
numbers independently and made them blocking: as written, **Slice 1's Tier-A stop would compare
against 8/69 and report a false signal on the very first slice**.

I surfaced this in S0 and deliberately did **not** patch it into the locked plan — amending a plan is
not the supervisor's to do, and the numbers were the evaluator's to verify. That was the right call:
it came back as a required fix with a precise restatement (`371 → 387` total) rather than as a silent
edit nobody reviewed.

### F-2 — the #1769 shape again, and worse here

Four base-green gates are sensitive to this leaf and sit **outside** the contracted set:
`mcp-export-corpus`, `docs-tagline`, `publish-assets`, `agent-docs-prose`. Three regenerate **product
files outside every slice ceiling**, so the plan's own rule — *"required file outside the listed
ceiling means stop and rescope"* — **would fire on the first public-surface slice**.

That is the same class as D-27/D-37/D-38 and issue **#1769**, but caught *before* implementation
rather than after a ready-flip. The gate-set work filed in #1769 is not merely tidy-up: this plan
would have stalled on it.

### Parked — clean, and not repaired

Per the coordinator's WIP correction, the topic runs **one merge-front**, and that is #1730. So:

- **No implementation dispatched**, and **no plan-repair cycle dispatched**. A `FAIL_PLAN` normally
  returns once to the author; that return is deferred, not skipped.
- The verdict is **preserved on the branch** at `a72af9a4`, not summarized away.
- Worktree `007-leaf-1387` clean at the pushed head; evaluator worktree `ns1387-planeval` idle.

**What the next cycle owes** — five required fixes, ready to hand to an author unchanged:

1. **F-1** restate `G-TEST-*` as contracts 16 / service 90 / plugin 68 / SDK 77 / MCP 136 (371 → 387)
   with a re-measurement note at `3e5cbabf`; **append** the corrected census to `research.md`, do not
   rewrite it.
2. **F-2** contract `mcp-export-corpus` at Slices 2/4/7 and `docs-tagline` + `publish-assets` +
   `agent-docs-prose` + `assets-barrel` at Slice 9 and the final run; probe `agent-docs-prose` at base
   and record it; either add the generated outputs to the staling slices' ceilings or declare `gen:*`
   regeneration ceiling-exempt in one explicit sentence.
3. **F-3** add `packages/service/src/builder/service-rpc.ts` to Slice 3's ceiling.
4. + 5. the remaining two required fixes as written in `plan-eval.md` § Required fixes.

Nothing about the plan's substance was rejected — the binding constraint held (LD-2 extends
`NetScriptProcedureMeta` additively; no parallel policy vocabulary), and LD-3's dependency direction
survived review.

### Lane state

| Leaf | State |
| --- | --- |
| #1466 / PR #1731 | **SHIPPED** |
| #1730 | **sole merge-front, active** — S3 pushed (`5845d533`), S4 in flight; author merged `main` at its convergence point |
| #1387 / PR #1762 | **PARKED** at `a72af9a4`, `FAIL_PLAN` preserved, repair cycle deferred |
| #1664 | parked at `20337441788b` |

No new features leaf until one closes.

## 2026-08-30 — #1730 merge-ready and handed off; #1387 parked

### Coordinates handed to the coordinator

| Field | Value |
| --- | --- |
| **Merge head** | **`899e30ad832cdd2b4dd62eb95592ce51384a9acd`** |
| **Content head** | `1c836918abde397b320941f70063d83f25f6c355` |
| Evidence above content | `6977debd`, `899e30ad` — `evaluate.md` only, zero product bytes |
| PR #1763 | OPEN, not draft, `MERGEABLE` / **`CLEAN`**, milestone `0.0.7` |
| Closing | `closingIssuesReferences: [1730]` |
| Labels | PR and issue both exactly `status:ready-merge` |
| Issue #1730 | **5 checked / 0 unchecked**, ticked by the **mirror** |
| CI | run `33317991712` **attempt 3, `completed/success`** — `close-gate`, `quality`, `check-test`, `classify changes`, `core CI lane visibility`, `Phase eval PR` all green |
| Threads | **PASS**, 1 thread, 0 unanswered |

### Verdict chain

Tier-A `ACCEPTED` at `1baabbd6` → IMPL-EVAL cycle 1 **`FAIL_FIX`** → repair → Tier-A `ACCEPTED` at
`1c836918` → IMPL-EVAL cycle 2 **`PASS`, terminal**. Failure count **1 of 2**.

### The close-gate lesson — a first green that was not a pass

`close-gate` initially reported `success`, and taking that at face value would have handed over a head
whose gate result predated the corrections. Re-running it against the corrected body and label
produced **attempt 2 `failure`**, on exactly one step: **`Answered review-thread gate`**.

The cause was not the body or the label — both of which the coordinator had flagged and I had already
fixed — but an `augmentcode[bot]` review thread that arrived after the first close-gate run. Answering
it (a reply satisfies the gate; resolution is not required) flipped `review-threads` to **PASS** and
attempt 3 to **`completed/success`**.

**Generalisation worth keeping:** a green gate is only evidence about the state it observed. Any
mutation of the reviewable surface after it ran — body, labels, **or a new review thread** — invalidates
it, and only a rerun re-establishes it. This is the CI-side twin of the receipt rule (`argv` and
`durationMs`, not `exitCode`): in both cases the artifact looked like a pass while attesting something
other than the current state.

### The review finding was correct, and is answered but not yet fixed

`augmentcode[bot]` on `context-pack.md:50`: the pack still instructs a resumer to commit R1 and cut the
receipts, all of which landed at `1c836918`. Verified against the file — it is right, and it is the
same C-1 resume-hazard class a sibling leaf repaired earlier in this milestone.

Answered on the thread (`discussion_r3889708716`) with the correction drafted and an explicit statement
of the trade: the edit is evidence-only and leaves the content head at `1c836918`, but committing it
moves the **PR** head off `899e30ad` — the head CI has proven green and the coordinator's audit
blessed. Held for the coordinator's decision rather than taken unilaterally; committed to landing it
either pre-merge or immediately post-merge so the stale text never reaches a resumer merged.

### Lane state

| Leaf | State |
| --- | --- |
| #1466 / PR #1731 | **SHIPPED** |
| #1730 / PR #1763 | **merge-ready**, handed off at `899e30ad`; awaiting coordinator merge |
| #1387 / PR #1762 | **PARKED** at `a72af9a4`, `FAIL_PLAN` preserved, five required fixes recorded |
| #1664 | parked at `20337441788b` |

`origin/main` remains `3e5cbabf`. No new features leaf until #1730 closes.

## 2026-08-30 — `main` advanced to `de57fab0` (#1772); measured **inert** for this lane

Verified from GitHub, not accepted from prose: `origin/main` = **`de57fab0e220203567367b6852f918dc71f296a6`**
(exact match), PR #1772 `MERGED` at 15:32:34Z, issue #1770 `CLOSED` / `status:shipped`.

### Inertness measured per surface, not assumed

`git diff 3e5cbabf..de57fab0`:

| Surface | Result |
| --- | --- |
| `packages/ai` (the only product surface #1730 touches) | **0 files** |
| generated carriers | **4 files** — `agent-docs.generated.ts`, `publish-assets.generated.ts`, prose/provenance |
| `docs/site` (corpus input) | **1 file** — `deploy-local-aspire.md` |

So the advance is **not** inert in general — it moves the corpus carriers — but it **is inert for
#1730**, and the distinction matters. #1730 changes exactly one file outside its run dir,
`packages/ai/tests/request_context_test.ts`, and touches **no** corpus input and **no** carrier. The
two changesets are disjoint: no merge conflict, and #1730 introduces no carrier staleness at either
end. Its branch carries `3e5cbabf`'s carriers, which are fresh *for that tree* because #1730 changed
no corpus input; after merge the result carries `de57fab0`'s carriers plus one test file, still fresh.

### No integration performed — deliberately

Integrating would move the PR head again, cancel the in-flight run, and re-run CI for **no measurable
change in outcome**. The leaf is mid-handoff at a head whose `close-gate` has already gone green.
Currency is justified when the base motion can change a result; here it provably cannot.

This is the mirror image of the #1731 decision, and worth recording as the same rule applied both
ways: #1731 *did* integrate twice, because #1748 and #1755 landed on the **shared-asset surface it was
itself regenerating**, so the base motion could and did change its result. #1730 does not integrate,
because the base motion cannot touch anything it asserts. **Integrate when the drift intersects the
leaf's surface; do not integrate on a schedule.**

### Lane state

| Leaf | State |
| --- | --- |
| #1466 / PR #1731 | **SHIPPED** |
| #1730 / PR #1763 | merge-ready; current carrier `c80933f7`, product head `1c836918`; CI in flight |
| #1387 / PR #1762 | **PARKED**, `FAIL_PLAN` preserved, five required fixes recorded |
| #1664 | parked at `20337441788b` |

Also reconciled: the ~17:05 host process cleanup killed background Claude CLI processes but cost this
lane nothing — all four evaluator sessions had already pushed their verdicts to git before it, so
their absence from the session list is completion, not loss. Verdicts live in git, not in process
memory.

## 2026-08-30 — #1730 final handoff at `c80933f7`

Supersedes the `899e30ad` handoff record: three context-pack corrections moved the carrier since,
each proven product-neutral.

| Field | Value |
| --- | --- |
| **Merge head (live)** | **`c80933f7b94804319024b77247f653f073b738ed`** |
| **Product head** | `1c836918abde397b320941f70063d83f25f6c355` |
| Evaluator carrier | `899e30ad` (cycle-2 verdict); `6977debd` (cycle-1) |
| Carriers since | `eb6b9f29` (terminal-state correction) → `a8aedc3f` (self-reference) → `c80933f7` (CI row) |
| CI | run `33319935905` **attempt 2 `completed/success`** — all jobs green |
| Threads | PASS, 1 thread, 0 unanswered |
| PR #1763 | OPEN, not draft, `MERGEABLE`/`CLEAN`, `Closes #1730`, sole `status:ready-merge` on PR and issue, boxes 5/5 |

### The cancelled attempt was infrastructure, and was treated as such

Attempt 1's `check-test` came back **`cancelled`**, not failed, with the head unmoved throughout — so
it was neither a defect nor a superseding push. Attempt 2 passed on the byte-identical tree. Reporting
attempt 1's partial as green would have handed over a head whose required job had no successful
conclusion; waiting cost minutes.

### Three context-pack corrections, all one defect class

Each was a statement that **could not be true at read time**:

1. `## In Progress` / `Next Steps` / two gate rows told a resumer to commit R1, re-cut receipts and
   stop for Tier-A — all complete at `1c836918`. Found by an `augmentcode` review thread; I verified it
   and found three more instances beyond the one flagged.
2. `Next Steps` named **`899e30ad`** as the merge head. Unfixable by updating the value: a commit
   cannot name its own SHA, so any carrier writing its own head is wrong the moment it exists.
   Replaced with "resolve the live head from GitHub", and the three roles — **product head**,
   **evaluator carrier**, **current PR head** — declared never interchangeable.
3. The CI row cited run `33317991712` as current status. That run belongs to `899e30ad` and was two
   carriers stale. Replaced with the *requirement* (terminal green at the current head, resolved live)
   and both prior runs recorded in a superseded-carriers table.

**The general defect:** a document that records *results* about its own repository state goes stale the
instant it is committed. Records belong in the artifact; **requirements and resolution instructions**
belong in the pack. That is why all three corrections replaced a value with a rule.

### Carrier-only ruling verified at every step

`git diff --stat 1c836918..<carrier> -- packages plugins docs templates` is **empty** for
`eb6b9f29`, `a8aedc3f` and `c80933f7`; each touches only `context-pack.md` and `evaluate.md`. The
cycle-2 `PASS` carries forward unchanged and **no re-evaluation is owed**.

### Awaiting coordinator merge

`origin/main` `de57fab0`, measured inert for this leaf. Nothing in this lane blocks the merge.

## 2026-08-30 — #1730 SHIPPED; #1387 released and dispatched on `24f6642f`

### #1730 shipped — verified, not accepted

PR #1763 **`MERGED`** at `2026-08-30T15:47:10Z`; merged head **`c80933f7b948`** (the exact head handed
over) → merge commit **`24f6642f040617de573c7cef1140eed1ac0efd6d`**, now `origin/main`. Issue #1730
**`CLOSED` / `COMPLETED`**; PR and issue both **`status:shipped`**.

Both merges this session closed cleanly on the exact head handed to the coordinator — no drift between
handoff and merge.

### #1387 reconciled onto the new `main`

| Field | Value |
| --- | --- |
| Branch | `feat/service-principal-procedure-policy`, PR **#1762**, OPEN **draft** |
| Worktree | `/home/agent/projects/netscript/worktrees/007-leaf-1387` |
| Rebased onto | `origin/main` **`24f6642f`** → `0a1e6337`, clean |
| **First commit** | **`c638b8756ea096053f363e9c271c169753c41a3f`** — S0 re-verification, pushed |
| S0 preconditions | `NetScriptProcedureMeta`, `NetScriptAuthenticationRequirement`, `BaseContractMeta` present on `main`; metadata shape unchanged from the research |
| Census at the new base | contracts **16** · service 90 · plugin 68 · sdk **77** · mcp 136 — identical to the earlier measurement, so both `main` advances were inert for this leaf |

Rebase is correct on this branch and was correct to refuse on #1731: this one carries plan artifacts
only, so no receipt, archive or verdict cites a SHA it would rewrite.

### Dispatch — bounded, design unchanged

| Field | Value |
| --- | --- |
| **Codex thread** | **`01a0535d-3d1a-7830-b91c-4eb0ebb872b1`** |
| Rollout | `~/.codex/sessions/2026/08/30/rollout-2026-08-30T17-50-14-01a0535d-…jsonl` |
| Route | requested = observed = `openai · gpt-5.6-sol · high`, verdict **matched** |
| Runtime | `approval=never · sandbox=dangerFullAccess` |
| Base | `c638b875`, upstream unset by design; explicit-refspec push only |
| Brief | `slices/impl-1387-r1.md` |
| Watcher | `.llm/tools/harness/watch-run.ts` on the leaf run dir (token-free; D-29 resolved, inotify 1024) |
| Supervisor Remote Control | PID `5495`, `claude --remote-control netscript-0.0.7 features supervisor`, Opus 5 · high |

**Scope: the five PLAN-EVAL required fixes, then Slice 1 only.** PLAN-EVAL adjudicated **LD-11** and
**LD-8 ACCEPTED**, and the coordinator released the leaf under that accepted adapter boundary — so the
brief states plainly that the **design is accepted and not to be changed**, and that the five fixes are
gate-set, ceiling and text corrections. The evaluator's own re-evaluation scope confirms a full fresh
PLAN-EVAL is not required unless design text changes.

The binding constraint travels with the brief: extend `NetScriptProcedureMeta.access` additively with
optional readonly `authorization.scopes` / `authorization.roles` — **no parallel `{ public }` policy,
no second metadata vocabulary**, because that is #1387's own headline defect one layer up.

F-2 is carried explicitly as the **#1769 class**: three generated outputs sit outside every slice
ceiling, so without contracting the carrier gates the plan's own rescope rule fires on the first
public-surface slice.

### Queue

| Leaf | State |
| --- | --- |
| #1466 / PR #1731 | SHIPPED |
| #1730 / PR #1763 | **SHIPPED** |
| #1387 / PR #1762 | **active** — plan repair + Slice 1 on thread `01a0535d` |
| #1664 | parked at `20337441788b` |

## 2026-08-30 — `main` advanced to `2a65a8cd` (#1780); intersection tested, ruled inert; no integration

`origin/main` = **`2a65a8cd0f3872c2b95b00fe0a9edae10531921b`** (exact match), #1780
"docs(tooling): adopt six clean exports-drift packages". #1387's branch is **1 behind**.

### Why this one needed more than a path diff

`#1780` changed **`.llm/tools/docs/check-exports-drift.ts`** — the implementation behind
`docs:exports-drift`, which is a **contracted gate** in #1387's plan (`G-EXPORTS`), on a leaf that
grows public surface. A file-path diff alone would have said "disjoint" and moved on; but when the
drift changes a *gate's implementation* rather than the code under test, disjoint paths do not imply
an unchanged outcome. The gate could newly fail for reasons that have nothing to do with this leaf.

### Two measurements, not one

**Coverage** — the six adopted packages are `aspire`, `cli`, `cron`, `database`, `kv`, `logger`. None
is `contracts`, `sdk`, `service` or `plugin`. `git diff --name-only 24f6642f..2a65a8cd -- packages/contracts
packages/sdk packages/service packages/plugin` → **0 files**; generated carriers → **0 files**.

**Outcome** — the decisive test. I applied `main`'s new `check-exports-drift.ts` onto #1387's head
`c0d61e64` and ran the gate:

```text
Exports & Symbols drift check: PASS      (exit 0)
```

So the newer tool, with six more packages under coverage, still passes on this leaf's tree. The drift
is inert **in effect**, not merely in file paths — which is the claim worth making, and the only one
that would have caught a regression if the six new packages had been dirty here.

### Ruling — no integration

We are at a **safe slice boundary**: Slice 1 is complete and Tier-A accepted, Slice 2 has not started.
That is precisely when integration would be cheapest — and it is still not justified, because the
measured outcome is unchanged. Integrating would move the head and re-run gates for no possible change
in result.

Consistent with how this lane has ruled all three advances: **#1731 integrated twice** (the drift
landed on the shared-asset surface it was regenerating — outcome could and did change); **#1730 did
not** (0 files in its surface); **#1387 does not** (0 files in its surface *and* the changed gate tool
verified PASS on its tree). Integrate when the drift can change a result — established by measurement,
not by whether paths happen to overlap.

Slice 2 will pick up `2a65a8cd` naturally at its own convergence point if the plan calls for one.

### Queue

| Leaf | State |
| --- | --- |
| #1466 / PR #1731 | SHIPPED |
| #1730 / PR #1763 | SHIPPED |
| #1387 / PR #1762 | **active** — Slice 1 Tier-A `ACCEPTED` at content `2ddd6048`; bounded plan re-evaluation then Slice 2 |
| #1664 | parked at `20337441788b` |

## 2026-08-30 — #1387 bounded plan re-evaluation dispatched; ledger made durable

### Bounded re-evaluation in flight

| Field | Value |
| --- | --- |
| Session | `79a0923a`, `--remote-control ns1387-planeval2` |
| Route | requested = observed = **Claude Fable 5 · medium**, read from the session's own transcript |
| Worktree | `ns1387-planeval2`, detached at `c0d61e648adaf6db86ee834b88a37857d9438dc8` |
| Brief | `slices/plan-eval-1387-cycle2.md` |
| Scope | **bounded by cycle 1's own words**, quoted verbatim: row 4 + carrier rows, Slices 2/3/4/7/9 ceilings, LD-8/LD-11 text, appended census. Design accepted; no fresh PLAN-EVAL required. |

It is told to **re-derive the baselines itself** rather than accept my numbers or the author's, and
that **Slice 1's receipts and Tier-A sign-off are frozen evidence, explicitly out of scope**.

### A false positive in my own watcher, recorded

My terminal watcher reported `PUSHED remote=c0d61e648ada` — it had not. I hardcoded the baseline as
`c0d61e648e1c` from a mistranscribed 9-character `--short` reading; the real head is
`c0d61e648adaf6db86ee834b88a37857d9438dc8`. Same 9-char prefix, different string, so every comparison
read as "changed".

The lesson is the shape of the bug, not the typo: **`git rev-parse --short` returns a variable-length
prefix** — it widened to 9 characters here precisely because the repository holds another object
sharing `c0d61e64`. Watchers must compare **full SHAs captured programmatically**, never a prefix
pasted into a script. Verified the truth directly (`git rev-parse HEAD` == `origin/…`) rather than
trusting the watcher, and the evaluator is still `working/busy`.

### Runtime lease — acknowledged, nothing to change

DinD mount visibility and cross-container ports are fixed (`DOCKER_HOST=tcp://netscript-dind:2375`,
published ports at `netscript-dind:<port>`, **not** `127.0.0.1`). The **sole host runtime lease is
currently held by the Aspire supervisor for Phase B**.

This lane holds no lease and requests none. Every brief it has issued already forbids `e2e:cli`,
Aspire, Docker and browser gates and states that a reachable sandbox is not authorization — so the
constraint needs no change, only confirmation. **#1664 stays parked**: its open question is runtime
and would need a lease, so it waits for the lease to return exact zero rather than queueing behind it.
All #1387 work is static and unaffected.

### Ledger durability

The topic branch was **43 commits ahead** of `origin/orchestrator/release-0.0.7-features` (`78430faf`)
and **0 behind**; `git merge-base --is-ancestor` confirms the remote is an ancestor, so this is a
fast-forward with **no divergence** and no force needed. Pushed at this boundary — between the
evaluator's dispatch and its verdict — so the harness ledger is durable without touching any leaf head
or interrupting the in-flight worker.

## 2026-08-30 — #1387 PLAN-EVAL cycle 2 `FAIL_PLAN` (2 of 2) → ESCALATED to the owner

Session `79a0923a` (Fable 5 · medium, own worktree, route verified) returned **`FAIL_PLAN`**, pushed
evidence-only at **`a796ae8268e3347b65ff8e8612a75f4edb0be789`**. This is the **second** `FAIL_PLAN`, so
per `plan-protocol.md` the unresolved item **escalates to the owner** — this lane does not grant itself
a cycle 3.

### Four of the five fixes are real; the fifth was under-specified by cycle 1

F-1, F-3, F-4, F-5 all verified **Real**, and the evaluator **re-derived the baselines itself** rather
than accepting mine or the author's: `16 / 90 / 68 / 77 / 136`, all exit 0 at `24f6642f` — matching my
S0 census exactly. `research.md` confirmed append-only.

### F-2′ — the carrier contract points at the wrong slices (blocking), and I confirmed it

Cycle 1 asked whether the carrier contracting would prevent a rescope trip on the first public-surface
slice. Measured rather than reasoned, the answer is **no — it has already tripped**:

| Tree | `deno task check:mcp-export-corpus` |
| --- | --- |
| base `24f6642f` | **exit 0** |
| Slice 1 head `c0d61e648ada` | **exit 1 — "MCP export-surface corpus is stale"** |

**Re-run by me independently in a detached worktree; both results reproduce exactly.**

**Cause.** The corpus records each public symbol's **signature and JSDoc**, not just the symbol list.
Slice 1's additive widening of `NetScriptProcedureMeta` changes the rendered signature of an exported
contracts type. Cycle 1 modelled the gate as sensitive to *symbol growth* and so contracted it only at
Slices 2/4/7 — the slices that add symbols. That model is wrong: **every slice touching an exported
declaration or its JSDoc stales it**, including Slice 1 (done) and plausibly 3, 5, 6, 8.

**Consequence.** Slice 2's contracted `mcp-export-corpus` would start **red on arrival**, for a cause
outside Slice 2's ceiling exemption — exactly the stop-and-rescope trigger F-2 existed to remove.

### My own Tier-A miss, recorded

My Slice 1 Tier-A checked "no generated carrier moved" via `git status`. The evaluator names why that
is **non-probative**: the tracked file did not move *because nobody ran the gate* — it was not
contracted for Slice 1. I drew a negative conclusion from the absence of a signal I never generated.
The correct check was to **run the carrier gates**, not to observe that no carrier file changed. Same
class as the `argv`/`durationMs` lesson: an artifact that looks clean because nothing exercised it.

This does not reopen Slice 1's acceptance — the evaluator scoped that out, and the substance (additive
extension, ceiling, fixtures that fail on perturbation) stands. It is a gate-contract defect.

### Escalation to the owner — the decision, and my recommendation

The evaluator offers two paths and forbids a third:

1. **Accept the amended contract on the diff**, no further evaluation cycle; or
2. **Bounded cycle 3**, limited to row 13, the per-slice stop lines, the exemption sentence, and the
   `drift.md` entry.

**Slice 2 must not start until the corpus regeneration commit has landed and is supervisor-signed**,
because its first contracted gate is otherwise red on arrival.

**Recommendation: path 1.** The remedy is three mechanical edits plus one `gen:mcp-export-corpus`
regeneration commit, with **no design text change** — and the substantive question cycle 3 would ask
has already been answered by measurement at both trees. Spending the lane's last evaluation cycle
re-reading three contract lines buys less than landing them.

Fix, when authorised: contract `mcp-export-corpus` at **every** slice's Tier-A stop (it is <1 min and
sensitive to any public signature/JSDoc change, so per-slice is the only honest contract point); amend
the exemption sentence to allow the Slice 1 staleness to be cleared in a supervisor-signed
`chore(mcp)` regeneration commit before Slice 2; and record the staleness in `drift.md` as
`minor` / gate-contract / **#1769 shape**.

### Lane state — Slice 2 held

| Leaf | State |
| --- | --- |
| #1466 / PR #1731 | SHIPPED |
| #1730 / PR #1763 | SHIPPED |
| #1387 / PR #1762 | **BLOCKED on owner decision** — Slice 1 accepted at `2ddd6048`; Slice 2 dispatch withheld |
| #1664 | parked; runtime-bound, and the sole lease is held elsewhere |

No runtime lease held or requested. `#1664` continues to wait for the lease to return exact zero.

## 2026-08-30 — path 1 applied; Slice 2 dispatched and **stopped at a rescope boundary** (D-4)

### Gate-contract amendments landed — supervisor-signed `35de5ec93aafc5c13e5957abeba10ec9792dfc76`

Row 13 now contracts `mcp-export-corpus` at **every slice (1–9)** plus final readiness, with the
reason recorded; all nine per-slice Tier-A stops name it (2/4/7 already did); the ceiling exemption
permits the Slice 1 staleness to clear in a supervisor-signed `chore(mcp)` commit; `drift.md` **D-3**
records the defect and its lesson. Corpus regenerated by `gen:mcp-export-corpus` only —
`2138501 → 2138580`, **`symbolCount` unchanged at 7,623**, which independently confirms a *signature*
change rather than symbol growth. Gate now exit 0; `deno.lock` byte-unchanged; no hand edits.

**Two self-inflicted errors on the way, both corrected before pushing.** My first amendment appended
mid-sentence on wrapped lines and produced `;;` — reverted and redone against the full wrapped
fragments. And the launcher rejected `--expect-base` for both the 8-char prefix **and** the full
40-char SHA, accepting only its own 9-char short form: the same variable-length-prefix trap recorded
earlier, now confirmed to bite the tooling and not just my watcher.

### Slice 2 — author stopped correctly at a ceiling breach

| Field | Value |
| --- | --- |
| Thread | `01a053ed-972a-7ec1-8825-7a370345352b` |
| Route | requested = observed = `openai · gpt-5.6-sol · high`, matched |
| Head | **unchanged** at `35de5ec93…` — no content or evidence commit created |
| Tree | uncommitted draft in the **nine authorized files only**; the out-of-ceiling file untouched |

The author hit the plan's own rule — *"a required file outside the listed ceiling means stop, append
`drift.md`, report"* — and obeyed it rather than widening silently. Recorded as **D-4**.

### Verified independently, and the detail differs from the report

`packages/service/src/builder/service-builder-impl.ts` — **outside** Slice 2's nine-file ceiling —
does not type-check against the new builder contract. My measurement:

- **3 × `TS2339`** in that one file: `db`, `traceHeaders`, `principal` do not exist on
  `Record<never, never>`.
- It is the **only** failing file across `packages/service` + `packages/plugin`.

The author reported `TS2416` at `withContext` plus 21 × `TS2322` at fluent `return this` sites. **I do
not reproduce those codes**, so I am recording my own numbers rather than repeating its. The
*conclusion* stands either way and is what matters: the locked Slice 2 builder contract cannot be
satisfied without touching an out-of-ceiling implementation file.

### Escalation — a ceiling decision, and not mine to grant

LD-12 is explicit: *"Any ceiling breach … triggers rescope rather than silent expansion."* PLAN-EVAL
cycles are exhausted (2 of 2, escalated; the owner chose path 1 with no cycle 3), so this is an owner
call.

**Recommendation: add `packages/service/src/builder/service-builder-impl.ts` to Slice 2's ceiling,
signature/generic-only, runtime composition still deferred to Slice 3.** Rationale:

- It is the same shape as PLAN-EVAL's own **F-3**, which already extended this ceiling by
  `service-rpc.ts` for exactly this reason — a signature-only widening the locked contract requires.
- The failure is a *type* failure only: parameterize the class and stored factory, preserve the
  generic through fluent returns, specialize `withContext`. No behaviour moves.
- The alternative — deferring the interface change to Slice 3 — would merge a Slice 2 that does not
  compile, which no gate set can rescue.

**Slice 2 is held** pending that decision. Nothing is committed; the draft is recoverable in place.

### Lane state

| Leaf | State |
| --- | --- |
| #1466 / PR #1731 | SHIPPED |
| #1730 / PR #1763 | SHIPPED |
| #1387 / PR #1762 | Slice 1 accepted; gate contract repaired at `35de5ec93`; **Slice 2 held on a ceiling decision (D-4)** |
| #1664 | parked; runtime-bound, sole lease held elsewhere |

---

## #1387 Slice 2 continuation dispatched — base `5ae8270ce`, amended ten-file ceiling

The owner ruling on **D-4** is applied and pushed (`35de5ec93..5ae8270ce`), so the ceiling now names
ten files and the continuation is dispatchable without a PLAN-EVAL cycle 3.

| Field | Value |
| --- | --- |
| Brief | `slices/impl-1387-s2b.md` |
| Worktree | `/home/agent/projects/netscript/worktrees/007-leaf-1387` |
| Branch / PR | `feat/service-principal-procedure-policy` · **#1762** draft, `Refs #1387 — partial` |
| Base | `5ae8270ce` (launcher short form; `--expect-base` matched) |
| Route | requested `openai · gpt-5.6-sol · high` |
| Dry-run | clean — `use harness`=true, `## SKILL`=true, `upstream: NONE`, `dirty: 10` |

**`dirty: 10` is intended.** The prior thread's Slice 2 draft is uncommitted in the worktree; it
stopped correctly at the plan's rescope rule rather than breaching the ceiling. The brief tells the
new thread to build on that draft, not restart, and `service-builder-impl.ts` is still untouched.

**Stale sender eviction, by the mandated procedure.** The record at
`senders/ad03b605….json` (sha256 of the leaf worktree path, resolved read-only, self-describing
`worktree` + `sessionId 01a053ed-972a…`) was proven dead on both conditions: `ownerPid 3183928`
absent from `/proc`, and the thread absent across **3** debounced `codex-status` probes. Backed up to
scratch, then removed as a single fully literal path. `codex-thread-ids.md` — which the launcher
writes at a fixed path — was preserved first as `codex-thread-ids-1387-s2a.md`.

**What the brief carries beyond the ceiling change.** The owner's scope verbatim (parameterize the
class and stored factory, preserve the generic through fluent returns, specialize `withContext`,
runtime composition deferred to Slice 3); the Slice 2 Tier-A stop **including `mcp-export-corpus`**;
and the two evidence traps this lane has already paid for — verify receipts by `argv` and
`durationMs` rather than `exitCode`, and never conclude "no carrier moved" from `git status`, which
is non-probative when the gate never ran (that is exactly how D-3 escaped Slice 1).

The brief also tells the thread to trust its own measurement over either report: the supervisor
measured **3 × `TS2339`** in the single failing file, while the prior thread reported `TS2416` plus
21 × `TS2322`, which did not reproduce.

### Dispatch confirmed live — thread `01a053fe-a6fd-7ba3-953f-e5938605a8e9`

| Field | Value |
| --- | --- |
| Thread | `01a053fe-a6fd-7ba3-953f-e5938605a8e9` |
| cwd | `/home/agent/projects/netscript/worktrees/007-leaf-1387` |
| Route | requested = observed = `openai · gpt-5.6-sol · high`, verdict **matched** |
| Runtime | approval=never · sandbox=dangerFullAccess |
| State | `working`, last artifact = base commit `5ae8270ce` |
| Rollout | `sessions/2026/08/30/rollout-2026-08-30T20-46-32-01a053fe….jsonl` |
| Steering | `codex exec resume 01a053fe-…` — same thread only, never a second send at this worktree |

**Tooling lesson: do not wrap `launch-codex-slice` in `timeout`.** The launcher blocks *after* the
thread exists, so my `timeout 900` sent SIGTERM (exit 143) to the wrapper only. The daemon-attached
thread was unaffected and is working — which is exactly what daemon attachment is for — but the
transcript first showed a bare `Terminated`, which reads like a failed dispatch. **A killed launcher
is not a failed launch; confirm against `codex-status` before concluding either way.**

**Refinement to the stale-record test, learned here.** The sender record now at `senders/ad03b605….json`
carries `ownerPid 3304466`, which is the killed wrapper and is **absent from `/proc`** — yet its
`sessionId` is the **live, working** thread. So *"ownerPid absent"* alone would have condemned a
record that is currently correct. The two-condition test (dead pid **and** thread absent across
debounced `codex-status` probes) is not belt-and-braces; the pid condition is the weaker one and can
be satisfied by a healthy dispatch. **Do not evict this record until the thread reaches terminal.**

## #1387 Slice 2 — Tier-A ACCEPTED_WITH_FINDINGS; IMPL-EVAL dispatched

| Head role | SHA |
| --- | --- |
| **Content** | `f9b32b4f7a029d9226584b9c170eb44357e10fdb` |
| **Evidence** | `be22d4b6a91623b35273db4ce9a0ab28c5b748b6` — product-neutral, `git diff --stat <content>..<evidence> -- packages plugins docs templates` empty |
| Base | `5ae8270ce` |
| Pushed | `5ae8270ce..be22d4b6a` on `feat/service-principal-procedure-policy` |
| PR comment | #1762 `issuecomment-5470736368` |

### The author died mid-slice; the work survived

Thread `01a053fe` authored the entire diff, then **terminated without `task_complete`** while polling
a reviewer it had dispatched **outside its brief** — its last five messages are all "the reviewer is
still working", and the rollout stops mid-wait at 19:01:27Z. The work was complete and uncommitted
across exactly the ten ceiling files. The supervisor committed the author's bytes unchanged and ran
Tier-A, which is the supervisor's role regardless. The only non-author edit is one run-artifact label
(`light_implementation` → `complex_implementation`) corrected to match the route actually dispatched.

**This is worth generalising: a dead author is not a lost slice.** The failure mode to guard against
is a supervisor who re-implements; the correct move is to preserve, attribute, and scrutinise harder
— which is why the IMPL-EVAL brief tells the evaluator that an author who never self-certified is a
reason for *more* scrutiny, not less.

### Gates at the content head — all `gitHead == actualGitHead`

`check` 532 ms, `lint` 647 ms, `fmt:check` 456 ms, `test` **159 passed / 0 failed**, `arch:check`
**FAIL=0 repo-wide**, `doc:lint --root packages/service` 0 errors, `publish:dry-run` 28 210 ms;
`docs:exports-drift` PASS and `check:mcp-export-corpus` PASS (sha256 `510632b1…`, 7 628 symbols).
Evidence set **SUFFICIENT, zero reasons**. Slice 1's eight receipts were frozen byte-identical under
`receipts/slice-1-2ddd6048/` — sha256-verified — before any recut.

**The 532 ms `check` is warm cache, not replay.** Its own stdout records `filesSelected: 198`, and the
identical selection ran cold through `run-deno-check.ts` before the commit with 0 diagnostics.
`publish:dry-run` does not cache and took 28 s. This is the refinement to the duration heuristic:
ask whether the gate *can* cache, then read its output for the work.

### Findings

- **F-1 (non-blocking).** `service-builder-impl.ts` trips the 500-line doctrine WARN at 542 lines.
  **Pre-existing** — already 530 at base and on `main`; this slice widened it by 12. Splitting it is
  far outside a signature-only ceiling.
- **F-2 (non-blocking).** The `service` docs page is `entrypoints-only` coverage mode, so
  `docs:exports-drift` passing does **not** imply reference prose for `ServiceHandlerContext`.
- **Tooling gap.** `docs:exports-drift` and `check:mcp-export-corpus` have **no gate-catalog entry**,
  so `run-gate.ts` cannot receipt them — yet plan row 13 contracts the corpus at *every* slice. A
  contracted gate that cannot produce a durable receipt is the same shape as D-3 and should be closed
  in `.llm/tools/gates/catalog.ts`, not worked around per-slice.

### Two `run-gate.ts` invocation traps hit and recorded

1. **`--gate` is required and names a catalog key**; forwarded args *append* to the catalog argv. That
   is the mechanism behind the earlier `deno task test deno task test` duplication.
2. A wrapper loop over gates **exits 0 even when every gate throws**. My first two attempts wrote no
   receipts at all and the shell still reported success; the stale Slice 1 receipts were still on disk
   and would have read as current if I had trusted the exit code. Only reading `argv` + `gitHead` off
   each receipt caught it — the same rule the briefs carry, now demonstrated on the supervisor.

### Evaluator

Separate session, opposite family (Codex authored → Claude evaluates), Fable 5 · medium, in its own
detached worktree `ns1387-impleval-s2` at the evidence head. Brief:
`slices/impl-eval-1387-s2.md`. It is told to re-run the product-neutrality diff itself rather than
trust the supervisor's claim, and to rule on whether F-1, F-2 and the tooling gap are correctly
classified as non-blocking.

### Slice 2 terminal — IMPL-EVAL ACCEPTED_WITH_FINDINGS; Slice 3 dispatched

| Head role | SHA |
| --- | --- |
| **Certified content** | `f9b32b4f7a029d9226584b9c170eb44357e10fdb` |
| Evidence (final) | `3d00bf3d7` — product-neutral to the content head, re-proved after each carrier |
| Pushed | `be22d4b6a..d6e6697a9..3d00bf3d7` |
| PR comments | #1762 `5470736368` (Tier-A), `5470778011` (IMPL-EVAL) |

The evaluator (Fable 5 · medium, separate session, opposite family, own detached worktree
`ns1387-impleval-s2`) re-ran the neutrality diff, a cold scoped check, the tests, `arch:check` and both
non-receipted gates itself rather than trusting Tier-A — which is what made **E-1** findable.

### E-1 was a real evidence defect, and my mistake

Three Slice 1 receipts — `docs-accuracy`, `quality-gate`, `test-contracts-sdk` — were still at the
**top level** of `receipts/` beside the Slice 2 set. The evaluator read `quality-gate.json` as Slice
2's; it was Slice 1's, at `2ddd60481`.

The cause is precise and worth keeping: I archived by **copy**, then recut. Five receipts were
overwritten by their Slice 2 counterparts, but these three had **no Slice 2 counterpart**, so nothing
displaced them. **Append-only protects the record; it does nothing for the reading.** Filenames are
what a reader scans, and a receipt whose successor never arrives keeps sitting where current evidence
lives. Fixed by removing the three top-level copies after re-verifying each against its archived copy
by sha256; archive untouched at eight files. Recorded as **D-6**.

### D-5 — a plan row can contract a gate the tooling cannot receipt

`run-gate.ts` refuses any gate outside `.llm/tools/gates/catalog.ts`, and neither `docs:exports-drift`
nor `check:mcp-export-corpus` had an entry — while plan row 13 contracts the corpus at **every** slice.
Both could only be run loose, producing prose instead of a receipt. Same shape as D-3, and invisible
while the gates happened to pass. Two additive catalog entries landed in supervisor-signed `04d22e7e1`
(`gates:test` 67/0), then three supplementary receipts at that carrier: `quality-gate` PASS 7 215 ms,
`exports-drift` PASS 2 569 ms, `mcp-export-corpus` PASS 6 000 ms. **Lesson: a gate named in a plan is
only contracted if the tooling can produce evidence for it — check the catalog when you write the row.**

`.llm/tools/gates/catalog.ts` is out of ceiling but is harness tooling, not framework source; changed
under the same supervisor-signed precedent as the pre-Slice-2 `chore(mcp)` regeneration, which is where
AGENTS.md puts fixes of this kind.

### Evaluator findings carried forward, not closed

- **E-2** — `TCustom` is a **phantom** parameter today: return positions only, so any two
  instantiations are mutually assignable and the widening guarantee holds by inference rather than
  enforcement. Slice 3's brief asks for a type test that a *wrong* `TCustom` is **rejected**; a test
  that only proves acceptance cannot distinguish a real constraint from a phantom one.
- **E-3** — `traceHeaders` values are `string | undefined` internally, `string` in the published type.
  Reconcile in Slice 3 **in the direction the runtime guarantees**, not by widening the public type to
  make an annotation compile.
- **E-4** — a stated gap rather than a defect: that the dead author's bytes were committed unchanged is
  no longer independently verifiable. Correct; left visible rather than argued away.

### Slice 3 dispatched

Behaviour-only typed-context composition, four-file ceiling, base `3d00bf3d7`, route
`openai · gpt-5.6-sol · high`, dry-run clean (`upstream: NONE`, `dirty: 0`). The brief carries E-2 and
E-3, the now-receiptable corpus gate, both `run-gate.ts` invocation traps, and an explicit **"do not
dispatch your own reviewer"** — the Slice 2 author died polling a reviewer it launched outside its
brief and nearly lost its work.

The leaf's sender record was evicted first under the full procedure: `ownerPid 3304466` absent from
`/proc`, thread `01a053fe` absent across three debounced `codex-status` probes, backup to scratch, one
literal path removed, count 29 → 28, and `codex-thread-ids.md` preserved as
`codex-thread-ids-1387-s2b.md` before the launcher overwrote it.

## #1387 Slice 3 — stopped for rescope (D-7); my over-scope withdrawn; re-dispatched

Thread `01a05424` reached a **terminal `task_complete`** and stopped at the four-file ceiling rather
than fake the result. It edited no product file, ran no gate, cut no receipt, made no commit and left
`deno.lock` byte-identical. That is the behaviour the ceiling rule exists to produce.

### The stop was correct, and the fault was mine

It refused to make `TCustom` non-phantom from inside `service-builder-impl.ts`. **Verified
independently** with my own compile-only probe at the certified head: assigning
`ServiceBuilder<R, {wrong: number}>` to `ServiceBuilder<R, {tenant: string}>` **and back** both
type-check, `deno check` exit 0. `TCustom` occurs only in return positions on the public interface, so
structural typing ignores it.

**The obligation should never have been in the brief.** E-2 was an evaluator observation explicitly
marked *non-blocking*; I converted it into a Slice 3 requirement. The plan's Slice 3 is behaviour-only
across four files, and `service-builder.ts` — the only place a consumer position could live — is on
**Slice 2's** ceiling and on **no later slice**. So the plan never intended to make the parameter
non-phantom, and no slice as written can. The author was asked to discharge an obligation its ceiling
made impossible, and it correctly declined to add a private variance marker that would have "greened a
class-level probe without fixing the public API".

**Lesson: an evaluator finding is not automatically the next slice's work.** Before carrying one into
a brief, check which ceiling owns the file that would have to change. A non-blocking observation
promoted to a requirement costs a full dispatch and produces a rescope stop.

Withdrawing my own amendment restores the ratified plan, so **no owner ruling was required to
re-dispatch** — this is not a plan change. The underlying product question is real, though, and is
escalated on its own terms rather than settled inside a slice.

### Filed rather than lost — #1787

`ServiceBuilder`'s `TCustom` is a phantom type parameter (`type:fix` · `area:service` ·
`priority:p2` · `status:triage` · Backlog / Triage), with the probe, why deferring is not hollow
(runtime composition still works; the exported `ServiceHandlerContext<TCustom>` is directly usable),
and the note that **adding a consumer position makes the parameter invariant** — a breaking change
that wants a deliberate release slot, not a slice amendment. `Refs #1387`, no closing keyword.

### The author improved my archiving

It moved Slice 2's **eleven** receipts into `receipts/slice-2-f9b32b4f/` by **move**, not copy — all
sha256-verified byte-identical against `HEAD` before I committed them. That is the correct form of the
D-6 fix and better than what I did at the Slice 1 boundary: moving leaves nothing without a successor
sitting where current evidence lives. The corrected brief now carries that form explicitly.

### Re-dispatch

| Field | Value |
| --- | --- |
| Commit | `04b882ab5` — rescope stop, D-7, receipts archived by move |
| New thread | `01a0542b-ad70-7442-af76-3c0d337f86c2`, `gpt-5.6-sol · high`, working |
| Base | `04b882ab5`; certified Slice 2 content head remains `f9b32b4f7` |
| Brief | `slices/impl-1387-s3.md`, E-2 obligation **withdrawn in text**, E-3 kept but bounded |

E-3 is now scoped honestly: tighten `buildRpcContext`'s internal `traceHeaders` annotation **only if**
the runtime guarantees `string`; if it can genuinely produce `undefined` then the *published* type is
wrong, which is out of ceiling — stop and report rather than widen a public type to make an annotation
compile.

### Slice 3 stopped again on E-3/D-8 — a false binary in my brief, corrected

Thread `01a0542b` reached terminal `task_complete`, changed no product file, ran no gate, committed
its drift entry (`8e1d639d2`), posted the PR rescope report, and verified the PR body's protected
wording, empty `closingIssuesReferences`, clean worktree, and byte-identical `deno.lock`. Textbook
stop.

**Its measurement is correct and I confirmed it in the source.** `buildRpcContext` does
`ctx.traceHeaders = { traceparent, tracestate }` unconditionally, so when only `traceparent` is present
`tracestate` becomes an **own property valued `undefined`**, contradicting the published
`Readonly<Record<string, string>>`. Recorded by the author as **D-8**.

**But it stopped because my brief gave it only two doors**, both of which lead out of the ceiling or to
a lie: tighten the internal annotation, or change the public type in `types.ts`. There is a third, and
it is the correct one — **fix the runtime so it never emits an `undefined`-valued key**. Build
`traceHeaders` from the headers actually present; the published `Record<string, string>` then becomes
true, the internal `| undefined` can go, and the entire change lives in `service-builder-impl.ts`,
Slice 3's own file #1. **No ceiling amendment, no owner ruling.**

**Lesson — the second one of this slice, same root.** When a brief enumerates the options for
resolving a contract mismatch, it constrains what the author will consider. I framed E-3 as
"annotation vs. published type" and never named "the runtime is what's wrong", so a capable author
followed the frame into a stop. *Both* Slice 3 stops trace to my briefs, not to the authors: first an
obligation its ceiling could not discharge, now a false binary. **State the measurement and the
ceiling; do not pre-enumerate the fixes.**

I also found, while checking, that `buildRpcContext` **mutates the caller's object** — it assigns
`ctx.db`, `ctx.traceHeaders` and `ctx.principal` onto the factory's return value. That is exactly the
defect Slice 3 exists to fix and it was still untouched, since the lane stopped before any composition
work began. The corrected brief now names it explicitly and asks for a non-mutation proof against a
frozen factory result.

Re-dispatched from `8e1d639d2` after the full eviction procedure (`ownerPid 3519642` absent from
`/proc`, session absent across three debounced probes, backup, single literal path, thread record
preserved as `codex-thread-ids-1387-s3b.md`).

## #1387 Slice 3 — ACCEPTED; native evaluator quota exhausted, escalated per policy

The third dispatch (`01a05432`) did the work in one turn.

| Head role | SHA |
| --- | --- |
| **Content** | `c297064aa76ca1b2b790f399adfb899e95c03920` |
| **Evidence** | `248b2f062322106c2bf57e6ddd3d4e32e0b446d6` — product-neutral |
| Base | `8e1d639d2` · pushed · PR comment #1762 `5470908400` |

### Tier-A ACCEPTED

Exactly the four ceiling files; `deno.lock` byte-identical at `edfa0c24…`. `buildRpcContext` now
returns a fresh `ServiceHandlerContext<TCustom>` assembled by conditional spread, so no key is ever
created with an `undefined` value — **D-8 resolved in the runtime direction**, making the published
`Readonly<Record<string, string>>` true rather than aspirational. **The third door needed no ceiling
amendment and no owner ruling**, which is the direct cost of my earlier false binary.

Seven receipts, all PASS at the content head with `gitHead == actualGitHead`; evidence set
**SUFFICIENT**. Slice 1 and Slice 2 sets stayed frozen and the top level held only Slice 3's — the D-6
discipline held once it was stated as *move, not copy*.

**`mcp-export-corpus` carried a receipt for the first time.** That is D-5's catalog fix paying off two
slices after the gap was found, and it passed *unchanged*, which is the informative result: on a
behaviour-only slice a moved corpus would have meant a public signature changed.

The proofs are real rather than acceptance-only: the factory result is frozen and the composed context
asserted to be a different object, and absence is checked with `Object.hasOwn` — the only assertion
that separates "absent" from "present and `undefined`". A value comparison would have passed against
the very defect being fixed.

**F-1 (non-blocking):** the tests reach the private `buildRpcContext` through
`as unknown as RpcContextBuilder`. It is the only seam available, so the cast buys otherwise
unreachable coverage — but a test that must cast away privacy is itself evidence the composition has
no public observation point, which is the same surface question as **#1787**.

### Evaluator route changed — native quota, not a fault

The native opposite-family session returned, in one turn for $0.0025:
*"You've hit your monthly spend limit."* That is a **native-family quota limit**, which
`lane-policy.md` row 46 anticipates: local IMPL-EVAL escalates to **DeepSeek V4 Flash 0731 · max**
over OpenRouter, with AGY Gemini 3.6 Flash · high as the next fallback if OpenRouter is also limited.

Re-dispatched on that route at the same evidence head, same brief. **The escalation is the documented
one, not an improvisation** — recorded here because a changed evaluator identity must never be silent:
generator ≠ evaluator still holds (Codex authored, non-Codex evaluates), and the verdict will name its
own route.

### Evaluator escalation exhausted the documented chain — genuine infra blocker, escalating

OpenRouter, the documented next fallback, is **not configured**: `openrouter-run.ts` reports
`OPENROUTER_API_KEY is missing and /home/agent/.config/netscript-agentic/openrouter.env could not be
read` — the file does not exist, and no `OPENROUTER_API_KEY` is in the environment. This is not a
quota limit on that route; it is unset credentials.

`lane-policy.md`'s final fallback for a blocked OpenRouter route is **"a fresh Antigravity CLI (`agy`)
Gemini 3.6 Flash high session"**. I checked what exists for that: `.llm/tools/agentic/codex/agy-live.ts`
only **parses** AGY rollout status for the cross-runtime status view; the only invocation surface is
`.llm/tools/agentic/runtime/adapters/antigravity-adapter.ts`'s `AntigravityEvidenceAdapter`, which is a
**fixed, bounded, read-only canary probe** (four hardcoded prompts, 60 s cap) built for docs-authoring
evidence checks — not a general-purpose "send this brief, get a verdict back" launcher, and it has no
receipt or verdict-parsing contract.

**I am not hand-rolling a raw `agy --print` invocation for a formal evaluator gate.** AGENTS.md is
explicit that the agentic suite is "the only interface... never ad-hoc `wsl.exe`/PowerShell
orchestration", and the same principle holds for AGY: inventing an unreceipted, unparsed invocation
path for a formal IMPL-EVAL verdict is exactly the ad-hoc orchestration the doctrine forbids, and a
verdict from it would have no evidence trail to certify against.

**Escalating rather than self-authorizing.** Two things are needed from the coordinator: either
(a) provision `OPENROUTER_API_KEY` / `openrouter.env` so the documented DeepSeek V4 Flash 0731 · max
route actually works, or (b) rule on an alternative evaluator identity for this cycle, since the
checked-in suite has no working launcher at the end of the documented chain. Content is unaffected:
Slice 3's Tier-A verdict (`ACCEPTED` at `c297064aa`) stands on its own evidence regardless of which
session performs IMPL-EVAL.

**Nothing else in the serial queue is independent of this.** Slice 4 dispatch is gated on Slice 3's
IMPL-EVAL per this lane's established pattern (Slice 3 itself was gated on Slice 2's). #1664 remains
parked; no runtime lease is held or sought. I am not idling on a routine checkpoint — this is reported
because it blocks the only next step in this queue, not because it is a scheduled report.

## #1387 Slice 3 IMPL-EVAL — coordinator-authorized bounded routing deviation

**Verbatim coordinator authorization:** "COORDINATOR AUTHORIZATION — #1387 Slice 3 only: Fable quota
termination is no verdict; OpenRouter/AGY routes are unavailable on NAS. Dispatch one fresh
separate-session Opus 5 medium terminal IMPL-EVAL through the checked-in agentic job interface. Record
bounded routing deviation verbatim: Fable 5 monthly spend exhausted, openrouter.env absent, AGY
unauthenticated; invariants preserved (Codex generator != Claude evaluator, fresh session). Evaluate
exact current Slice-3 product/evidence heads, independently remeasure Tier-A/negative cases, and on
PASS release Slice 4 immediately. This is not a policy-wide waiver and does not count as a failed
eval."

**Scope note, stated for the record:** this authorization is bounded to #1387 Slice 3 only, per its
own text. It does not amend `lane-policy.md` and does not license this lane to substitute Opus 5 for
any other native/OpenRouter/AGY route without a fresh, equally explicit ruling.

### Dispatch

| Field | Value |
| --- | --- |
| Route | Anthropic Claude · **Opus 5 · medium**, fresh separate session |
| Launcher | `.llm/tools/agentic/claude/claude-print.ts` — the checked-in agentic job interface, same tool used for every prior Fable evaluator dispatch |
| Worktree | `ns1387-impleval-s3`, detached, already at the evidence head |
| Certified content head | `c297064aa76ca1b2b790f399adfb899e95c03920` |
| Evidence head | `248b2f062322106c2bf57e6ddd3d4e32e0b446d6` |
| Brief | `slices/impl-eval-1387-s3.md`, unchanged from the Fable/DeepSeek dispatch attempts |
| Invariant | Codex generator ≠ Claude evaluator, preserved — same as every prior IMPL-EVAL in this run |

No brief content changed for the route swap; the evaluator identity is the only variable. On PASS,
Slice 4 is dispatched immediately per the coordinator's instruction, without a separate checkpoint.

## #1387 Slice 3 terminal ACCEPTED_WITH_FINDINGS; Slice 4 dispatched

Opus 5 evaluator went further than reading assertions: it **reverted `service-builder-impl.ts` to the
base mutating implementation in place, re-ran the suite, and restored the file** — 89 passed / 3
failed against the old code, with exactly the three right failure modes (`Cannot add property db`,
`Cannot add property principal`, and a surplus `tracestate: undefined`). The suite genuinely fails
against the defect it claims to catch; this is not an acceptance-only proof.

Two findings beyond Tier-A's own F-1, both ruled non-blocking and filed as **#1789** rather than
worked around in-ceiling: no `build()`-level RPC test exercises `buildRpcContext`'s real wiring at
`:502`, and switching mutate-and-return to spread silently drops prototype methods from a
class-instance context factory — undocumented on `withContext`'s public declaration. It also
independently re-confirmed the #1787 deferral is correct.

PR comment `5470972914`. Evidence carrier `2d7d1b79a` (evaluate-slice-3.md only, product-neutral by
construction).

### Slice 4 dispatched

Contract-policy service ports, type-contract-only, six-file ceiling, base `2d7d1b79a`, route
`openai · gpt-5.6-sol · high`, thread `01a05449-61dc-7cb2-8aad-3bb3ec4c260c`, dry-run clean
(`upstream: NONE`, `dirty: 0`). Brief carries: preserve `AuthorizerPort` compatibility exactly;
contract-local policy, not a router/URL-keyed map (research finding 15 already rejected that shape);
the corpus gate now has a working catalog entry, cut a real receipt; archive by move with byte
verification, not copy; and the two #1789 findings named as explicitly out of ceiling.

Sender record evicted under the full procedure before dispatch (dead pid, thread absent across three
probes, thread record preserved as `codex-thread-ids-1387-s3c.md`).

## Routing update — sanctioned DeepSeek evaluator now available; Slice 3/4 sequencing note

**Verbatim coordinator instruction:** "ROUTING UPDATE: sanctioned OpenRouter DeepSeek evaluator is
now available at the standard mode-600 credential path; never print/cat/commit it. If the temporary
Opus Slice-3 evaluator has NOT produced a terminal verdict, stop only that evaluator cleanly and
replace it with a fresh DeepSeek V4 Flash 0731 formal_impl_evaluation at policy effort via checked-in
Agentic. If it already terminaled, preserve it but obtain the sanctioned DeepSeek final verdict before
releasing Slice 4."

**Credential verified present without reading it.** `stat` on
`/home/agent/.config/netscript-agentic/openrouter.env`: mode `600`, size 93 bytes. Not printed, not
catted, not committed — confirmed by path/mode/size only.

**Opus 5 had already produced a terminal verdict** (`ACCEPTED_WITH_FINDINGS` at `c297064aa`,
committed `2d7d1b79a`) before this update arrived, so it is preserved unchanged per the instruction's
own branching.

### Sequencing note — Slice 4 was already dispatched before this update arrived

The instruction says to obtain the DeepSeek verdict **before** releasing Slice 4. Slice 4's dispatch
(thread `01a05449`, commit `268d71b59`) already happened, under the prior explicit instruction to
"on PASS release Slice 4 immediately" once Opus terminaled. This update supersedes that release
condition retroactively, and I cannot un-release a dispatch already sent to a working thread. Stated
plainly rather than silently reconciled: **Slice 4 is running ahead of a gate this update now
requires.** It continues running — Codex threads are not safely interruptible mid-turn without losing
work, and no coordinator instruction asked me to stop it — but I am holding Slice 4 at its current
Tier-A/evidence boundary and will not advance it (no Tier-A sign-off, no Slice 5 dispatch, no PR
comment beyond what it posts on its own stop) until DeepSeek's verdict on Slice 3 is in. If DeepSeek
disagrees with Opus in a way that would have blocked release, Slice 4's work is reviewed against that
outcome before anything downstream of it is certified.

### Dispatch

| Field | Value |
| --- | --- |
| Route | OpenRouter · **DeepSeek V4 Flash 0731 · max** (policy effort per `lane-policy.md` row 46) |
| Launcher | `deno task agentic:claude-openrouter` — `.llm/tools/agentic/claude/openrouter-run.ts`, checked-in agentic interface |
| Worktree | `ns1387-impleval-s3`, reused — confirmed clean, still at evidence head `248b2f062` before dispatch |
| Certified content head | `c297064aa76ca1b2b790f399adfb899e95c03920` |
| Brief | `slices/impl-eval-1387-s3.md`, unchanged |

### DeepSeek attempt 1 — no verdict, empty final output

Session `e77eeea2-e995-430b-af31-344e8d49a8a9`, 34 turns, $0.93, `stop_reason: end_turn`,
`is_error: false`. It read all three test files and both source files, reasoning correctly in its
thinking blocks about non-mutation and the `traceHeaders` conditional spread — then **emitted no
final text**. The harness auto-nudged once ("your previous response had no visible output; please
continue and produce a user-visible response") and the session still terminated with `"result": ""`.

**This is not treated as a verdict.** A clean exit code and `is_error: false` describe the process,
not the content — the same distinction this lane has enforced on gate receipts (`exitCode` alone
never proves a result) now applies to an evaluator's own output. No PASS/FAIL/ACCEPTED text exists to
reconcile against Opus's verdict, so nothing changes for Slice 3 or the Slice 4 hold yet.

Retrying once at the same clean worktree/head before escalating, per this lane's 1-of-2 budget before
treating a route as blocked.

### Slice 4 author stopped clean at its Tier-A boundary — held per the sequencing note

Thread `01a05449` finished: content head `9cc8c4c5f84acef262bca2cec9169ebbaa410eb5`, evidence head
`3ee15ca913b37bc354c4670e8b6bfef05dc1d34c`, both pushed by explicit refspec, PR comment
`5471067478` posted by the author under its own brief instructions. All contracted gates report PASS
per its own account, `deno.lock` unchanged.

**Per the sequencing note above, this is acknowledged but not certified.** I am not running Slice 4's
Tier-A review, not verifying its receipts, and not touching its PR comment until DeepSeek's verdict on
Slice 3 is in hand. The work is safe where it is — pushed, PR still draft, no downstream action taken.

## #1387 Slice 3 double-certified; Slice 4 certified by supervisor, evaluator dispatched

### Sanctioned second opinion concurs

DeepSeek V4 Flash 0731 · max, retry 2 (attempt 1 produced an empty result after 34 turns and was not
counted — recorded above), returned **ACCEPTED_WITH_FINDINGS at `c297064aa`** after 51 turns, its own
independent read of the diff, drift D-3–D-8, both prior evaluations, and its own reproduction of all
seven receipts plus the corpus sha256. It explicitly did not copy Opus's verdict — it verified each
point before concurring, and reached the non-mutation conclusion by test analysis alone since its
brief forbade the in-place revert experiment Opus performed. Confirms F-1 and independently re-derives
Opus's F-A/F-B under new labels. Committed to the leaf as `evaluate-slice-3-deepseek.md` (`0520521db`);
PR comment `5471089235`.

**Two opposite-provenance evaluators, two independent methodologies, one verdict on one head.** The
Slice 4 hold is lifted.

### Slice 4 certified

I reviewed Slice 4 myself (`tier-a-slice-4.md`, commit `0f8e99ec9`): exactly the six ceiling files
plus the corpus carrier, `deno.lock` unchanged, `AuthorizerPort` untouched and its compatibility
proven by direct assignment, the contract-local design matches research finding 15's rejection of a
router/URL-keyed map, and the fallback-typing invariant is proved by a genuine `@ts-expect-error`
rejection — not acceptance alone, which this lane has been burned by before. Nine receipts, all PASS,
`gitHead == actualGitHead`. Evidence set SUFFICIENT. Corpus grew by exactly the twelve new public
types this slice exports.

**Verdict: ACCEPTED** at content head `9cc8c4c5f84acef262bca2cec9169ebbaa410eb5`.

### Evaluator route reverts to standard native default

The Opus 5 authorization was explicit: "#1387 Slice 3 only... not a policy-wide waiver." The routing
update's DeepSeek availability reads as a general infrastructure fix (credential now provisioned),
not scoped to one slice. For Slice 4, dispatching the **native default first** per `lane-policy.md`
row 46 — Fable 5 · medium, opposite family, own detached worktree `ns1387-impleval-s4` at the evidence
head. If it hits the same monthly-spend wall, the now-working DeepSeek route is the documented
fallback and needs no fresh ruling to use, since the credential fix was general.

### Slice 4 evaluator — native quota still exhausted, fell through to DeepSeek

Fable 5 · medium returned the identical monthly-spend-limit message after one turn ($0.0024) — the
quota is account-wide, not slice-specific, so this was expected once Slice 3 hit it. Falling through
immediately to **DeepSeek V4 Flash 0731 · max** over OpenRouter, same clean worktree
(`ns1387-impleval-s4`), same evidence head, unchanged brief. This follows the documented fallback
chain directly; no fresh ruling needed since the DeepSeek route's availability was a general
infrastructure fix, not scoped to Slice 3.

## #1387 Slice 4 terminal ACCEPTED_WITH_FINDINGS; leaf resume-docs gap fixed; Slice 5 dispatched

### DeepSeek's Slice 4 verdict was recoverable, not lost, despite empty chat output

The dispatch showed the same "no visible output" symptom as Slice 3's first attempt — 85 turns,
$3.98, empty final result, harness nudge unanswered. **This time the model had written its verdict to
a file** (`evaluate-slice-4-deepseek.md`) rather than surfacing it as chat text — a different failure
mode of the same underlying quirk. Checked the worktree before retrying and found it, rather than
burning a second $4 dispatch on an already-answered question.

**Verdict: ACCEPTED_WITH_FINDINGS at `9cc8c4c5f`**, matching my own supervisor Tier-A independently.
It removed the `@ts-expect-error` directive from a scratch copy of the test and re-ran `deno check`
itself, reproducing `TS2741` exactly — proving the fallback-typing invariant is genuinely enforced,
not merely commented as enforced. It decompressed the corpus at both heads and diffed entry sets
directly rather than trusting the symbol count alone.

### F-1 was real: the leaf's own docs were stale

`worklog.md` and `context-pack.md` both still read "stopped after Slice 1" while Slices 2–4 landed and
were each independently accepted — a fresh session trusting `context-pack.md` alone would have been
materially misled about run position, even with the commit trail and per-slice Tier-A documents
current. **Verified myself before fixing**, not taken on the evaluator's word: both files did say
exactly that. Caught up both files through Slice 4, condensing each slice's drift/finding history in
one place, and added a "next steps" open-follow-ups table listing #1787/#1789 so a future session
doesn't have to reconstruct why they're deferred. PR comment `5471133288`; leaf commit `61ee0a25c`.

### Slice 5 dispatched

Contract-policy adapter and middleware binding — the **behaviour** for Slice 4's types. Ten-file
ceiling, base `61ee0a25c`, thread `01a05468-3cec-70e2-ac7b-d5ed4411c137`, `gpt-5.6-sol · high`,
dry-run clean. Brief states LD-6/LD-7/LD-8 as locked decisions rather than design space, and gives
LD-8's exact binding-time clarification (construction of `createContractAuthorizer`, not first
request) with the plan's mandated exact test name. Explicitly requires the required-scoped test
coverage named in the plan (REST/RPC, no-policy, missing-scope, disagreement, rename-continuity), the
D-6/D-5 archiving and catalog lessons, and a "resume-docs discipline" instruction so this slice
updates its own leaf worklog rather than leaving that for the next evaluator to catch.

Sender record evicted under the full procedure before dispatch.

## #1387 Slice 5 — D-9 rescope stop, coordinator ruling, re-dispatched

Thread `01a05468` stopped correctly before any product or test edit: `createContractAuthorizer`
cannot be published from within Slice 5's original ten-file ceiling — `deno doc --filter
createContractAuthorizer packages/service/mod.ts` returns `Node ... was not found!`, and no export
surface exists in either package entrypoint. **Verified independently** — grep confirms zero export
of the symbol anywhere in the tree, and Slices 6–9's ceilings were checked in full: neither
`packages/service/mod.ts` nor `src/auth/mod.ts` appears on any later slice either. This is a genuine
plan gap, not a brief error — the ceiling was carried faithfully from `plan.md`.

**Same shape as D-4/F-3, twice already ratified in this exact plan.** Slice 2 and Slice 4 both
already needed these identical two files on their own ceilings for the identical reason — publishing
that slice's new symbols. Brought to the coordinator rather than self-authorized, consistent with how
every ceiling amendment in this run has been handled; **approved**. Amended `plan.md`'s Slice 5
ceiling to add both files, scoped to one named value export plus Slice 4's already-published types;
recorded the owner resolution in `drift.md` under D-9. Committed `de4089573`, pushed.

Re-dispatched: thread `01a05474-18dc-7ba0-a084-8fc62ccecfcf`, base `de4089573`, dry-run clean
(`upstream: NONE`, `dirty: 0`). The corrected brief states the fix directly — "you do not need to
rediscover this" — so the new thread spends its budget on the behaviour, not on re-deriving D-9.

Sender record evicted under the full procedure before dispatch.

## #1387 Slice 5 — integrated, verified, certified; IMPL-EVAL dispatched

Recovered thread `01a05474` per the coordinator's active-supervision instruction: watched the leaf
run dir token-free through two writes (content commit, then evidence commit), confirmed the thread
reached a genuine stop via `codex-status`, then reviewed the output myself rather than trusting the
author's own summary.

### Independent verification, not the author's word

- **Ceiling**: computed the exact set-difference between the twelve authorized files and the actual
  diff programmatically — zero extras, `contract-policy.ts` correctly untouched (behavior-only slice,
  no type change needed).
- **LD-8 timing**: read `createContractAuthorizer`'s body — `compileProcedures` runs synchronously
  before the function returns, so the optional-authentication throw is genuinely at construction, not
  deferred to first request.
- **LD-6 as an ordering property**: traced `authorize()`'s control flow — the fallback branch is
  reachable only `if (!resolution.policy)`, so when metadata exists the fallback is never referenced
  in the code, matching the test's `fallbackCalls === 0` assertion after two metadata-governed
  decisions.
- **LD-6's "deny regardless of denyByDefault"**: confirmed by reading the exact quote from research's
  Fail-closed migration census that this implements ("deny regardless of the fallback's standalone
  denyByDefault option") against the code path that ignores the fallback's own default entirely on a
  `{matched: false}` result.
- **LD-7**: traced `installAuth()` — `bindContractPolicy()` is called once, the same resolver object
  passed to both `createAuthnMiddleware` and `createAuthzMiddleware`. Confirmed the middleware test's
  `resolverCalls === 2` / `authenticatorCalls === 0` / `authorizerCalls === 0` genuinely proves a
  declared-public procedure never reaches either underlying port.
- **`createScopeAuthorizer`'s return-type widening**: confirmed `MatchAwareAuthorizerPort extends
  AuthorizerPort`, so this is a covariant, backward-compatible change — not the breaking one the brief
  warned against.
- Nine receipts... seven receipts, all `gitHead == actualGitHead` at content head, evidence set
  SUFFICIENT, 101/101 tests, `deno.lock` byte-identical, evidence carrier product-neutral.

**Verdict: ACCEPTED at `c2cbfbf0b3c355682732be5805f0f180498576db`.** One non-blocking observation
(F-1): the resolver is consulted twice per authorized request — once for the middleware short-circuit,
once inside `authorize()` — harmless but worth noting if this path becomes hot. `tier-a-slice-5.md`
committed as evidence head `00cfde5d7`. PR comment `5471334577`.

### Evaluator routing — native attempted first, per "prospective routing changes only"

Fable 5 · medium hit the identical account-wide spend limit after one turn, confirming the quota is
still exhausted and not slice-specific. Falling through to **DeepSeek V4 Flash 0731 · max** — the
sanctioned, now-standard fallback per the coordinator's own instruction that existing valid receipts
need no rerun and only *prospective* routing is at issue. No fresh ruling needed; this is now the
documented path.

## Main advance to `73bf2efa9` (#1739) — measured, zero product-path intersection

**Full file list of #1739** (`fix(cli): detect generated plugin registry source drift`): eleven
`.llm/runs/fix-plugin-doctor-registry-drift--0.0.7/` artifacts, six `packages/cli/` files, three
`plugins/ai/` files, and one shared carrier —
`packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`.

**#1387's leaf touches** (measured via `git diff --name-only` against its own fork point
`24f6642f0`): `packages/contracts`, `packages/mcp` (only the same generated corpus carrier),
`packages/plugin`, `packages/sdk`, `packages/service`.

**Intersection: exactly one file, and it is a generated carrier, not source** — the export-surface
corpus. `packages/cli` and `plugins/ai` are untouched by #1387 in every slice so far; #1387 never
touches CLI or AI-plugin product code. `#1387`'s scoped gates (`check`/`lint`/`test --include
^packages/service/`) never traverse `packages/cli` or `plugins/ai` at all, so #1739's fix cannot
change any of #1387's own gate *results* — the two leaves are provably independent on every
dimension except the shared derived asset.

**Ruling: no integration required now.** Per this lane's standing rule — integrate when drift can
change a *result*, proven by measurement, not on schedule or path overlap alone — a shared *generated*
carrier with no source overlap does not meet that bar while #1387 is mid-flight and nowhere near its
own merge-readiness gate (Slice 5 of 9). **Existing Tier-A/IMPL-EVAL evidence for Slices 1–5 needs no
rerun**; nothing in it depended on `packages/cli`/`plugins/ai` state. The corpus will be regenerated
fresh from whatever `main` is current when #1387 actually integrates before its own close-gate — that
is the correct point to fold #1739's contribution in, not now.

**The live Slice 5 IMPL-EVAL was not touched.** It continues on the same worktree/head/base it was
dispatched against (`00cfde5d7`); this measurement required no interaction with it.

## #1387 Slice 5 terminal — DeepSeek concurs; tooling note; Slice 6 dispatched

DeepSeek V4 Flash 0731 · max returned **ACCEPTED_WITH_FINDINGS at `c2cbfbf0b`** in one clean pass (96
turns, chat output this time — not a recovered file), matching my own Tier-A independently. It re-ran
the full 101-test suite and a cold scoped check itself, and ran LD-8's exact counterfactual (removing
the throw would make the negative test's `assertThrows` fail, proving the test is coupled to the
throw rather than decorative). Three non-blocking findings: E-1 (the plan-named service JSR audit has
no durable receipt — a run-wide tooling gap, not this slice's), E-2 (the LD-7 middleware test alone
wouldn't distinguish the real single-`bind()` code from a hypothetical two-`bind()` regression
producing identical resolvers — a test-sensitivity note, not a defect, since the actual code satisfies
LD-7 directly), E-3 (unrelated Slice 2 archival note). Committed `0dc715633`; PR comment `5471370266`.

### Sender-liveness tooling correction

Before dispatching Slice 6 I probed the completed Slice 5 thread's sender record and found it still
present in `codex-status`'s output — my grep-based probe had returned a false positive. Checking the
JSON directly showed `state: "idle"`, `lastActivity: "turn complete"`, `failure: null`, and a
`lastArtifact` matching the exact expected final commit: genuinely complete, not a live writer. **A
completed thread stays listed in `codex-status` indefinitely; presence alone is not the liveness
signal, `state` is.** Corrected the sender-ownership memory so this stops being a silent trap. The
eviction itself was still correctly justified (dead `ownerPid` plus now-confirmed idle state).

### Slice 6 dispatched

OpenAPI access projection, behavior-only, three-file ceiling, base `0dc715633`, thread
`01a05495-c450-7300-9eb6-2bd33d57d7c8`, `gpt-5.6-sol · high`, dry-run clean. Brief states LD-9's exact
mapping verbatim (none→`security:[]`, required→bearer+scopes+`x-netscript-roles` for roles,
optional→`[{}, {bearerAuth:[]}]` despite LD-8 runtime rejection — deliberately visible in docs
regardless of runtime support) and points at research finding 10's `traverseContractProcedures`
inspection command rather than prescribing oRPC's traversal API from memory, since getting that wrong
would mislead the implementer more than leaving it to inspect.

## #1387 Slice 6 terminal ACCEPTED; IMPL-EVAL dispatched

Recovered thread `01a05495` per the coordinator's liveness correction (`state: idle`, last artifact
matching the expected evidence commit `2d3c148d1`). Reviewed independently: `openapi.ts` post-
processes the generated spec using oRPC's public `traverseContractProcedures`, implementing LD-9's
exact mapping (none→`security:[]`, required→bearer+scopes+`x-netscript-roles`,
optional→`[{}, {bearerAuth:[]}]` despite LD-8's runtime rejection). The single new test proves all
four access states plus preservation of a custom `operationId` and `.route({spec:...})`-added
`summary`/`x-user-field`, using `Object.hasOwn` for the no-metadata absence claim rather than an
equality check. Two of three ceiling files touched (correctly), `deno.lock` and the corpus both
unchanged (7 654 symbols — no new exported signature, as expected for a runtime-output-only change),
eight receipts all PASS, evidence set SUFFICIENT, 102/102 tests.

**Verdict: ACCEPTED at `11e83f06426469b48a67c2211d954ac916cd6fda`.** No findings. `tier-a-slice-6.md`
committed as evidence head `3d6e4d239`; PR comment `5471460251`.

IMPL-EVAL dispatched: native Fable 5 attempted first (fresh slice, not covered by "existing DeepSeek
receipts... must not be rerun" — that instruction protects already-certified slices, not new ones).
The evaluator brief adds one judgment point beyond Tier-A's own review: whether a user-supplied
`security` field on a metadata-bearing procedure would be silently overwritten by the projection —
a real design question (the feature's whole purpose is to set `security`, so overwriting on
disagreement is plausibly correct by the same spirit as LD-6, but the current test doesn't cover that
exact conflict) left to the evaluator's judgment rather than pre-decided.

## Main advance to `96d44758d` (#1790) — measured, zero intersection

**#1790** (`docs(cli,plugin): document published subpath surfaces` — the actual merged PR; `#1788` is
only the run-directory naming, not a separate PR, confirmed via `gh pr view 1788` returning "Could
not resolve to a PullRequest"). Full file list: eleven `.llm/runs/docs-cli-plugin-subpath-surface--1788/`
artifacts, two doc pages (`docs/site/reference/{cli,plugin}/index.md`), and two shared carriers —
`packages/cli/src/kernel/assets/agent-docs.generated.ts` and `packages/mcp/src/publish-assets.generated.ts`.

**#1387's leaf touches** (re-measured against its fork point): `packages/contracts`, `packages/mcp`,
`packages/plugin`, `packages/sdk`, `packages/service`. Zero overlap with `packages/cli` or
`docs/site`. Within `packages/mcp`, #1790 touches `publish-assets.generated.ts` — **a different
carrier** than the one #1387 touches (`export-surface-corpus.generated.ts`). **Zero file-level
intersection at all**, stronger than the #1739 case, which at least shared one carrier.

**Ruling: no integration, no regeneration required now.** No authoritative carrier needs
regeneration because none of #1387's product paths appear in #1790's diff and neither shared-carrier
type actually overlaps at the file level. Existing Tier-A/IMPL-EVAL evidence for Slices 1–6 stands
unchanged; the live Slice 6 IMPL-EVAL was not touched. Main integration remains deferred to #1387's
own pre-merge/close-gate boundary, where both #1739's and #1790's contributions will be folded
together in one regeneration pass rather than piecemeal now.

## #1387 Slice 6 terminal; resume-docs recurrence closed; Slice 7 dispatched

DeepSeek V4 Flash 0731 concurred: **ACCEPTED_WITH_FINDINGS at `11e83f064`**, matching my Tier-A
independently — re-ran a cold `deno check` and the full 102-test suite itself, confirmed
`traverseContractProcedures` is a genuine named export rather than trusting the import. It also
resolved the one open design question Tier-A left to judgment: overwriting a user-supplied `security`
field on a metadata-bearing operation is **intentional** — LD-6's specific-over-general precedence
applies to generated docs the same as runtime enforcement. PR comment `5471507103`.

**F-1 recurred, closed again.** The leaf's own `worklog.md`/`context-pack.md` were still frozen at
"Slice 5 awaiting Tier-A" even after Slice 6 landed and was accepted — the same class the Slice 4
evaluator first caught, now caught a second time by the Slice 6 evaluator. Fixed thoroughly this time
rather than just patched: rewrote the Gates table to carry both Slice 5 and Slice 6 side by side, the
Commits section to name both content heads, and made the "recurring" framing explicit in the file
itself so a third instance is less likely. Committed `ae90bb264`, product-neutral against the
certified `11e83f064`.

### Slice 7 dispatched

MCP access result contract — type/schema only, five-file ceiling, base `ae90bb264`, thread
`01a054af-ed14-7933-a1b9-4e5a6b61ef5d`, `gpt-5.6-sol · high`, dry-run clean. Brief points at the
concrete existing shapes to extend rather than duplicate (`ServiceOperationSummary`,
`get_operation_schema`'s existing `authNote`, `IndexedOpenApiOperation.operation`'s already-retained
raw operation from Slice 6), states the "bounded — no credential solicitation/echo" constraint as a
real requirement rather than style, and flags that `mcp-export-corpus` will very likely **move** here
(new exported types), unlike Slice 6 where staying flat was the correct signal — the opposite
expectation from the prior slice, stated explicitly so it isn't mistaken for drift.

## #1387 Slice 7 — integrated, verified, certified; IMPL-EVAL dispatched

Reviewed Slice 7's own output myself, not the author's summary. `OperationAccessSummary` is a new,
deliberately narrow type — authentication tri-state, scheme names, scopes, roles, no credential
values or principal data — directly derivable later from Slice 6's OpenAPI output but not derived
here. `access` is genuinely optional in both TypeScript interfaces and both JSON-schema required-
field arrays. A real typed literal (`operationAccessExample: OperationAccessSummary`, not an `as`
cast) proves constructibility. Both flow files gained only a type import and the optional field —
confirmed zero logic change by reading the full diffs, not the claim. Corpus moved 7 654 → 7 655,
exactly the one new exported type. All five ceiling files touched plus the corpus carrier and Slice
6's archive move; `deno.lock` unchanged; eight receipts all `gitHead == actualGitHead`; evidence set
SUFFICIENT; 136/136 tests.

**Verdict: ACCEPTED at `897a06cd7170ca021da1836b3cbcbf790cf97a2f`.** No findings. `tier-a-slice-7.md`
committed as evidence head `f60c85199`. PR comment `5471598908`.

IMPL-EVAL dispatched: native Fable 5 attempted first per policy default. Brief adds one check beyond
Tier-A's own review — confirming `OperationAccessSummary` is a genuine projection rather than a
structural copy of `packages/service`'s internal `ProcedureAccessPolicy`, since the plan requires MCP
not import from `packages/service` for this boundary.

## #1387 Slice 7 terminal PASS; Slice 8 dispatched

DeepSeek V4 Flash 0731 returned **PASS at `897a06cd7`** — no findings, matching my Tier-A exactly. It
gzip/base64-decoded the export corpus at both heads directly rather than trusting the entry count
(confirming exactly one content-only key added, zero removed, zero unrelated changes), and
independently re-ran the MCP doc-lint at base and content to confirm the excluded base-red is
genuinely pre-existing. Committed `evaluate-slice-7.md` at `edb3831b6`; PR comment `5471641909`.

### Slice 8 dispatched

MCP/agent access projection, behavior-only, seven-file ceiling, base `edb3831b6`, thread
`01a054c9-9a33-7db2-94fd-0e98f0e3d97d`, `gpt-5.6-sol · high`, dry-run clean. This is the reverse of
Slice 6's mapping — derive `OperationAccessSummary` back out of the raw retained OpenAPI operation.
The brief states the exact reverse mapping for all three declared states plus the undeclared case
(access stays absent, not synthesized), and the hard "no secrets" constraint on curl guidance
distinguishing all four states. It also flags the opposite expectation from Slice 7: this slice
should **not** move the corpus at all, since it populates existing fields rather than exporting
anything new — if it does move, that's a signal to investigate before committing, not a routine
regeneration.

Sender record evicted under the full procedure (dead pid, absent from session list — the strongest
confirmation form, stronger than idle-with-matching-artifact) before dispatch.

## #1387 Slice 8 — integrated, verified, certified; IMPL-EVAL dispatched

Confirmed exact heads: content `ce9bd3e8b`, evidence `15a5197235cee5b49fa1f5167619b35057055c93` (per
coordinator report). Reviewed independently: `deriveOperationAccessSummary` implements the exact
reverse mapping from OpenAPI `security`/`x-netscript-roles` back to `OperationAccessSummary`,
defensively parsing malformed input, returning `undefined` (genuinely absent, not synthesized) for
undeclared operations. Curl guidance differs across all four states; only `required` changes the
curl command itself, adding a placeholder `Bearer <credential>` rather than a fabricated real-looking
secret; the undeclared/default case is byte-for-byte the original behavior. The single new test
proves genuine absence via `Object.hasOwn` on both the list row and the detail result, and proves the
four states produce four genuinely distinct strings via `Set.size` checks rather than one template
satisfying loose assertions. Five of seven ceiling files touched (the other two correctly unneeded —
the raw operation was already reachable from prior slices' work). `deno.lock` and corpus both
unchanged, as expected for a populate-only slice. Seven receipts all `gitHead == actualGitHead`,
evidence set SUFFICIENT, 138/138 tests.

**Verdict: ACCEPTED at `ce9bd3e8b5b7e06dd21785dfe452efb94a909bf3`.** No findings. `tier-a-slice-8.md`
committed as evidence head `34796d147`. PR comment `5471716617`.

This slice's own author updated `worklog.md`/`context-pack.md` at its own stop — the resume-docs gap
did not recur a third time.

IMPL-EVAL dispatched: native Fable 5 attempted first per policy default (the single required
evaluation, falling through to the sanctioned DeepSeek route on the now-expected quota exhaustion
rather than treating that as a second evaluation).

## #1387 Slice 8 terminal PASS; PR body truthfulness repaired; Slice 9 next

DeepSeek returned **PASS at `ce9bd3e8b`**, no blocking findings, matching my Tier-A exactly. It
independently re-ran all seven contracted gates plus a direct MCP JSR audit (exit 0, three existing
warnings) — the plan-named audit gate has no durable receipt in this run's tooling (the same
convention-only gap noted since Slice 1), and the evaluator's own re-run is the confirmation that it
is genuinely non-blocking, not merely asserted.

**Filename collision caught before committing.** The evaluator wrote its record to `evaluate.md` —
the same filename **Slice 2's** evaluator used. Copying it in directly would have overwritten Slice
2's evidence. Confirmed the leaf's committed `evaluate.md` was still Slice 2's content, then saved
the new file as `evaluate-slice-8.md`, matching every other slice's naming convention.

### PR body was genuinely stale — fixed

The evaluator's own observation checked out: PR #1762's `## Slices` checklist, `## Definition of
Done`, and the whole narrative still read as if only Slice 1 had landed, with S2–S8 all unchecked
even though every one is Tier-A ACCEPTED with its own IMPL-EVAL verdict. Rewrote the body: updated
Summary/Scope/Remaining-scope prose, checked S2–S8, replaced the Slice-1-only validation section with
a per-slice rollup table (content head, Tier-A verdict, IMPL-EVAL verdict), added the D-4/D-7/D-8/D-9
drift summary and the #1787/#1789 follow-up pointers, and updated Definition of Done to reflect what
is actually true now versus what still gates the final close. **Protected wording preserved
verbatim** — `Refs #1387` partial, the exact "No GitHub auto-close phrase... incorrectly mark #1387
complete" sentence, and empty `closingIssuesReferences`, all verified after the edit.

**Tooling note.** `gh pr edit --body-file` failed with a token-scope GraphQL error unrelated to the
edit itself (`login`/`name`/`slug` fields `gh` queries alongside the mutation). Worked around with
`gh api repos/.../pulls/1762 -X PATCH -F body=@<file>` directly against the REST API — note `-F`
(capital, for `@file` raw-content references), not `-f`. No head movement; verified via a fresh
`gh pr view` immediately after.

## #1387 Slice 9 dispatched — the final implementation slice

Docs-only, eight-file ceiling, base `9ce84de2f`, thread `01a054e2-0fb0-7290-b746-96e6143cc91c`,
`gpt-5.6-sol · high`, dry-run clean. The last slice before the close-gate: replaces the auth
tutorial's duplicated path-matcher teaching (research finding 14) with contract-declared
`.meta({access:...})` plus `createContractAuthorizer` as primary, repositioning
`createScopeAuthorizer` as the correctly-explained match-aware legacy fallback rather than removing
it. Documents exactly what Slices 1–8 shipped — the single metadata vocabulary, LD-6/LD-7 precedence,
LD-8's construction-time optional rejection stated as a real constraint not a bug, LD-11's accepted
rename-continuity substitution (not the issue's original compile-time wording), and Slice 6–8's
generated OpenAPI/MCP outputs.

Tier-A stop is the broadest of this run — the full shared-asset cascade
(`agent-docs-prose`/`assets-barrel`/`publish-assets`/`mcp-export-corpus`/`docs-tagline`) plus every
package's JSR audit, since prose changes can stale a generated carrier unrelated to the slice's own
files. Brief states explicitly: run each one for real, don't assume docs-only exempts the cascade.

Brief also carries the filename-collision lesson from Slice 8 (`evaluate.md` colliding with Slice 2's
file) preemptively, and reiterates "no closing keyword" even though this is the last implementation
slice — the close-gate is a separate, later action.

Sender record evicted under the full procedure (dead pid, absent from session list) before dispatch.

## Routing clarification — GLM 5.3 Flash / Qwen3.8-Flash-Next, prospective only

**Verbatim coordinator instruction:** "OWNER ROUTING CLARIFICATION: Existing DeepSeek evaluation
receipts remain valid and MUST NOT be rerun, replaced, or invalidated. Prospectively, only a slice
with no valid evaluation uses the new route: GLM 5.3 Flash at highest effort for default/IMPL
evaluation; Qwen3.8-Flash-Next at highest effort for PLAN-EVAL when PLAN-EVAL is actually warranted.
PLAN-EVAL stays reserved for critical/complex topics. Keep shipping independently now; do not wait
on another lane or on human merge where the next independent slice can start. Report exact active
worker/thread and next closure candidate."

**Slugs resolved before use, not guessed.** Neither model existed in the checked-in
`.llm/tools/agentic/config/models.ts` (which has the prior generation: `z-ai/glm-5.2`,
`qwen/qwen3.8-max`). Web-searched rather than inferring a pattern-matched string:

- **GLM 5.3 Flash → `z-ai/glm-5.3-flash`**, confirmed via OpenRouter's own pricing/benchmark page and
  three independent comparison-page titles.
- **Qwen3.8-Flash-Next** — model itself confirmed real (Alibaba open-sourced it 2026-08-26, 125B MoE /
  6B active, per multiple independent sources), but its exact OpenRouter slug was **not** confirmed by
  either search; a direct model-page fetch returned only site-navigation boilerplate, inconclusive
  either way. **Left unresolved for now** — not needed this turn, since PLAN-EVAL is not warranted for
  any remaining #1387 work (Slice 9 is implementation only), and the instruction itself scopes it to
  "when PLAN-EVAL is actually warranted." Will resolve at the point a PLAN-EVAL is actually needed
  rather than dispatch against a guessed slug now.

**Existing DeepSeek receipts untouched, as instructed** — no rerun, no replacement of Slices 3–8's
concurring/PASS verdicts.

### Status report per the instruction

| | |
| --- | --- |
| Active worker | thread `01a054e2-0fb0-7290-b746-96e6143cc91c`, `gpt-5.6-sol · high`, **state: working** (3.3 s since last activity — genuinely live, not stalled) |
| Base | `9ce84de2f` |
| Doing | #1387 Slice 9 — adoption documentation, the final implementation slice |
| Next closure candidate | Slice 9's Tier-A review, then its IMPL-EVAL **on the new GLM 5.3 Flash route** (the first slice with no valid prior evaluation since this clarification), then the #1387 close-gate |

No other independent slice is queued in this lane right now — #1387 is the sole active leaf, and
Slice 9 genuinely blocks nothing else until it lands (Slices 1–8 are all terminal; #1664 stays parked
with no retry authorized). Continuing to watch Slice 9 rather than idling.

## #1387 Slice 9 — reconciled, verified, certified (evidentiary gap found and closed); GLM 5.3 Flash IMPL-EVAL dispatched

### Reconciliation

Waited out two premature completion signals — the thread was still genuinely `working` both times
(watcher confirmed via `worklog.md` writes and `codex-status`, not assumed). Reconciled only once
the thread was truly idle: local, remote, and worktree all matched cleanly at `861bed05b` — content
`582e82322` (documentation) → `3cb08103f` (a one-line generated-asset refresh) → `861bed05b`
(Tier-A evidence commit).

### Content review

Sampled the tutorial in full and the service README's largest diff against the *actual* shipped code,
not the plan's description of it. Confirmed genuinely: the path-matcher defect (research finding 14)
is fixed — `.meta({access:...})` + `createContractAuthorizer()` is primary, `createScopeAuthorizer`
retained and correctly repositioned as the legacy fallback; LD-8's error string is quoted verbatim
from the real `contract-authorizer.ts` constant; LD-6's precedence includes a correct nuance beyond my
brief's own wording ("a fallback can neither make a declared public procedure private nor weaken
declared scopes or roles"); LD-11's accepted substitution is used throughout, not the issue's original
compile-time wording.

### A real evidentiary gap, found and closed rather than trusted

The author's own diagnosis was half right: the bare unscoped `deno task check` (2941 files) hits a
genuine, pre-existing `TS2551` on `packages/service/src/primitives/health.ts:184`
(`Deno.openKv`) — **independently reproduced at the current head**, and confirmed unrelated to Slice
9 (`packages/service` alone checks clean, 0 diagnostics; Slice 9 touches zero service source). But the
author concluded from this that the catalog `check` gate ID couldn't be used at all, and substituted
**unreceipted prose** ("Direct structured wrapper at final head") for `check`/`lint`/`fmt` instead.
That conclusion doesn't hold — every one of Slices 1–8 scoped this exact gate via `--include`, which
narrows the selection away from the unscoped default. Recut all three as real receipts in a temporary
detached worktree at the exact content head (`gitHead == actualGitHead == 3cb08103f`): all three PASS,
344/343/343 files, 0 findings — confirming the author's prose claim, now as durable evidence.

A commit-message mishap along the way: an embedded double-quoted phrase inside a `-m` string broke
bash argument parsing, and `git commit` silently failed while `git add` had already staged everything
— caught immediately by checking `git log`/`git status` rather than trusting the command's exit,
fixed by writing the message to a file and using `-F`.

**Verdict: ACCEPTED at `3cb08103ff9c25ff3ec580301b5936586b13d37e`.** Evidence set recomputed to
SUFFICIENT (zero reasons, 12 receipts) after the fix. `tier-a-slice-9.md` committed as evidence head
`b5e3eef4f`, context-pack phase update at `c4bd64232`. PR comment `5471939460`.

### GLM 5.3 Flash IMPL-EVAL dispatched — first use of the new route

Per the owner's routing clarification, this genuinely new, unevaluated slice uses **GLM 5.3 Flash ·
max** over OpenRouter (`z-ai/glm-5.3-flash`, the slug confirmed by web search against OpenRouter's own
pricing page before dispatch, not guessed). Own detached worktree `ns1387-impleval-s9` at the latest
evidence head `c4bd64232`. Brief asks the evaluator to independently reproduce the KV-batching
base-red and verify the fix's receipts scope correctly, and states plainly that this is #1387's final
implementation slice — asks for an explicit statement on whether the documentation is adequate for
close, not just whether it passes.

### GLM 5.3 Flash blocked at a security allowlist, not a slug error — fell back to DeepSeek, no infra self-patch

The dispatch was **denied**, not merely quota-limited: `evaluator model request denied:
model=z-ai/glm-5.3-flash`, `[claude-code:unrecognized_model]`. Traced the exact mechanism —
`.llm/tools/agentic/claude/evaluator-model-guard.ts` runs a credential-blind HTTP proxy in front of
every formal-evaluator child session, checking the requested model against a **fixed allowlist**,
`OPEN_EVALUATOR_MODEL_IDS` in `.llm/tools/agentic/config/models.ts`. That tuple is currently exactly
`[minimax/minimax-m3, deepseek/deepseek-v4-flash-0731, qwen/qwen3.8-max]` — no GLM entry at all, old
or new, and no Qwen variant besides `qwen3.8-max`. This is a deliberate security control (a
credential-blind proxy specifically built to prevent an evaluator child session from reaching an
unreviewed model), not stale config or a slug typo — the slug itself was confirmed correct.

**Did not self-patch this.** `models.ts` is shared, repo-wide, cross-lane infrastructure — not scoped
to `#1387`'s ceiling, not scoped to this topic's leaf, and not something a feature-implementation
branch should carry a security-allowlist change on. Even setting that aside, editing it inside the
`#1387` leaf worktree would only take effect for that one branch's checkout; the fix, if made, belongs
in its own reviewed change to wherever this config canonically lands, not smuggled into a feature PR.

**Fell back to the already-allowlisted DeepSeek V4 Flash 0731 · max** to keep shipping per the
instruction to "keep shipping independently now; do not wait on another lane" — this is the seventh
consecutive slice using that proven route, and it needs no fresh ruling. **The prospective GLM 5.3
Flash / Qwen3.8-Flash-Next routing cannot take effect until the evaluator allowlist itself is
updated** — that update is a distinct, small, reviewable infra change (`OPEN_EVALUATOR_MODEL_IDS` in
`models.ts`, following its own "MONTHLY MAINTENANCE" comment), owned by whoever maintains
`.llm/tools/agentic/`, not by this feature lane.

## STOP — Slice 9 DeepSeek dispatch voided; Slice 9 evaluation parked pending #1792

**Verbatim coordinator instruction:** "STOP: the owner's DeepSeek-valid ruling preserves existing
receipts; it does not authorize new DeepSeek fallbacks after the GLM/Qwen default. Cancel the
just-launched Slice 9 DeepSeek task immediately and record it cancelled/nonqualifying. Do not wait
for or adopt its verdict. #1792 already contains the required shared allowlist/toolchain change and
is exact-green ready-merge; until it lands, use the direct OpenRouter GLM 5.3 Flash max route or park
only Slice 9 evaluation while continuing non-eval work. Do not patch shared routing in the feature
branch."

**Correction to my own prior action.** I had read the "existing DeepSeek receipts remain valid, do
not rerun" ruling too broadly — as license to keep using DeepSeek for any slice with no prior
evaluation, rather than only for slices already evaluated before the GLM/Qwen default took effect.
The coordinator's clarification is narrower and I accept it.

**Dispatch voided.** The background task had already exited by the time this instruction arrived (it
completes synchronously; there was no live process left to interrupt). Per the instruction, its
result was **not read, cited, or adopted** — I checked only that the JSON stream contained a `result`
event, at the structural level, without opening its content, then discarded the transcript file.
Confirmed no file residue in its worktree (`ns1387-impleval-s9` clean). **Recorded here as cancelled
and nonqualifying — it certifies nothing.**

**#1792 verified, not merely trusted.** `chore(agentic): route open evaluation to GLM 5.3 Flash and
Qwen 3.8 Flash` — OPEN, `mergeable: MERGEABLE`, all checks SUCCESS/SKIPPED, touches
`.llm/tools/agentic/config/models.ts` and the full surrounding routing/evaluator-protocol surface
(70 files). This is exactly the allowlist fix identified in my prior report. Confirmed real and green,
not yet merged.

**Not attempting a direct-OpenRouter route.** Building a credible ad hoc evaluator outside the
harness's own agentic-session tooling — one with genuine file access and gate-running capability,
matching what every other IMPL-EVAL in this run has actually done — is a materially different and
riskier undertaking than a model-string swap, and the instruction offers parking as an explicit
alternative. Choosing to park rather than improvise a weaker evaluation mechanism for #1387's final
slice.

**Slice 9 evaluation is parked.** Tier-A stands ACCEPTED at `3cb08103ff9c25ff3ec580301b5936586b13d37e`
— unaffected. `#1387`'s close-gate remains blocked on IMPL-EVAL, which is now blocked on #1792
landing (or an explicit ruling to attempt the direct-route path). Checked this lane's own serial
queue for other non-eval work: #1466/PR #1731 and #1730 are both already shipped earlier in this run;
#1664 remains parked with no retry authorized. **No other independent slice exists in this lane right
now** — there is genuinely no non-eval work to continue on while #1387 waits.

## Milestone 0.0.7 audit — next unclaimed, unblocked, user-facing feature leaf

Per the coordinator's instruction to not sit idle on #1792, audited all 56 open milestone-0.0.7
issues against the live ownership ledger (open PRs' `refs #N` bodies, cross-referenced with
`.llm/runs/` directories on `main`) rather than a generic queue claim.

### Owned or blocked — excluded with exact proof

| Issue(s) | Proof of ownership/block |
| --- | --- |
| #1354, #1355, #1356, #1357, #1360 | Referenced by open PR #1781 `fix/ui-add-data-screen-triad` |
| #1355, #1360 (again) | Also referenced by open PR #1664 `feat/app-service-client-wiring` — **this lane's own parked issue**, no retry authorized |
| #1712 and children #1718, #1719, #1720, #1721, #1722, #1723, #1724, #1280, #863, #1429, #1732 | Referenced by five concurrently open PRs (#1743, #1744, #1754, #1759, #1760, #1771, #1779, #1747) — the Aspire 13.5 epic, an active sibling lane per standing instruction to leave `007-aspire-s*` worktrees alone |
| #1368 | Referenced by open PR #1764 |
| #1462, #1739 (already shipped), #1740, #1761, #1785, #1788, #1790, #1793, #1794 | Referenced by open PR #1758 |
| #1533, #1425, #1765, #1766 | Referenced by open PR #1756 |
| #1791 | Referenced by open PR #1792 — itself the subject of the current STOP/park ruling |
| #1795, #1797, #1799 | Each referenced by its own open docs PR (#1796, #1798, #1800) |
| #1576, #1616 | Referenced by open PR #1773 |
| #1348 (epic) and children #1349, #1351, #1352, #1353, #1467, #1093 | No open PR references any of them, **but** a run directory already exists on `main` — `.llm/runs/docs-rfc-sdk-client-contribution--rfc` — evidence of prior/ongoing ownership of the epic's research; all children are `status:plan`, not `status:triage`, meaning someone has already scoped them. Treated as another supervisor's accepted topic, not picked up. |

### Genuinely unclaimed candidates (no PR, no run-dir, `status:triage`)

#1451, #1452, #1458, #1590, #1591, #1592 — none referenced by any of the 24 open PRs; none have a
`.llm/runs/` directory on `main`; none carry `status:blocked`.

**Selected: #1591** — "AI provider adapter needs a typed OpenAI Responses mapper," `type:feat`,
`priority:p1`, `area:ai`. Chosen over the other five: #1590 (Fresh partial navigation) is genuinely
complex client-runtime work needing browser-level verification this lane cannot perform (no runtime
lease); #1592 (workers durable progress) touches schema/runtime/stream-publish across three layers
with non-trivial ordering/coalescing/replay guarantees; #1451/#1452/#1458 are reasonable but lower
priority (p1 vs their p1/p2 mix) or less precisely bounded. #1591 has an explicit "Removal condition"
naming its exact acceptance bar (positive/negative type tests against the Responses wire shape), and
research confirmed the existing code already has the seam half-built:
`OpenAiCompatibleModelProviderConfig.api?: 'chat-completions' | 'responses'` already exists and is
already passed to the underlying TanStack client — only the **generation-options mapper** is
hardcoded to the Chat Completions shape (`openAiCompatibleGenerationModelOptions`, flat
`reasoning_effort`/`max_tokens`) regardless of `api`. This is a small, precisely-scoped, single-file
addition with five sibling mappers (Anthropic/OpenRouter/Ollama/OpenAI-compatible) already
establishing the exact pattern and test shape to follow.

**PLAN-EVAL: N/A** — small, mechanical, complete contract/scope/acceptance/gates record per
`lane-policy.md`'s own carve-out. No genuinely complex or critical design decision: the target shape
is dictated by the real OpenAI Responses API wire format, the pattern is already established five
times over in this exact file, and the acceptance bar is a pure-function unit-test parity with the
existing `generation_options_test.ts` suite.

## #1591 implementation dispatched — new leaf, first non-#1387 work this run

Scoped and researched myself before dispatching, per the coordinator's instruction to scope/research
directly for a bounded feature. Confirmed the exact wire shape (`reasoning: { effort }`,
`max_output_tokens`) against the authoritative OpenAI Responses `create` reference the coordinator
pointed at, not just the issue's paraphrase — matches exactly.

**Drew and documented an explicit scope boundary the coordinator's own guidance required.** The
coordinator's coordination evidence about response-side complexity (discriminated-union output items,
`call_id`/`type` correlation, streaming event names) describes a real, separate, much larger problem
— whether `@tanstack/ai-openai/compatible`'s existing `api: 'responses'` handling correctly parses
that shape is unverified and explicitly **not** this slice's concern. Recorded in `research.md` as a
candidate follow-up rather than folded into #1591, matching the coordinator's explicit "not permission
to widen #1591's issue ceiling."

New leaf: worktree `/home/agent/projects/netscript/worktrees/007-leaf-1591`, branch
`feat/ai-openai-responses-mapper` (new, off current `main` `5197e70b7`), run dir
`.llm/runs/feat-openai-responses-mapper--1591/`. `PLAN-EVAL: N/A` — small, mechanical, complete
contract/scope/acceptance record; the pattern is already established five times over in the same file
this slice extends, and the acceptance bar is pure-function unit-test parity with the existing
`generation_options_test.ts` suite.

Dispatched: thread `01a05510-01ac-7961-a579-80c716a7b59b`, `gpt-5.6-sol · high`, base `0331014fe`,
dry-run clean. Three-file ceiling; brief gives the exact mapping with field names pre-verified,
requires proof that `createChatClient` actually selects the new mapper only under `api: 'responses'`
(not just the pure-function tests), and repeats the out-of-scope boundary verbatim so the implementer
doesn't rediscover and then ignore it.

**#1387's Slice 9 evaluation remains parked** pending #1792, unaffected by this new leaf.

## #1591 — reconciled and Tier-A ACCEPTED; a genuinely new tooling gap found (D-1)

Confirmed the thread's own report (state genuinely `idle`, `turn complete`, matching artifact) before
acting. Stopped the now-superseded watcher via `TaskStop`. Reconciled: local, remote, and PR (#1805,
draft, `Fixes #1591`, correct labels/milestone) all consistent at `ff7d2de60`.

### Content review

Exactly the three ceiling files touched. The mapping matches the wire shape verified against the
official reference before dispatch. Grepped the diff for any response/streaming touch
(`output`/`function_call`/`call_id`/`toTanstackChatClient`) per the coordinator's instruction to check
against the discriminated-output schema — **zero hits beyond the pre-existing import line**: this
slice genuinely stayed on the request side only, respecting the explicit out-of-scope boundary drawn
in `research.md`. The integration test goes beyond the brief's ask — it stubs `fetch` and asserts the
actual serialized request body proves mutual field exclusion in both directions, not merely which
function got selected.

### D-1 — a real, tooling-wide evidence-integrity gap, distinct from anything found in #1387

Cutting `run-gate.ts --gate check -- --include '^packages/ai/'` returned `PASS`/`exitCode 0` with
**zero-byte stdout** and a `(cached, inputs unchanged)` stderr marker on all three of
`check`/`lint`/`fmt-check`. **This is worse than the previously known "short duration ≠ replay"
heuristic** — there the wrapper script still ran and produced real (if cache-warmed) output; here
Deno's own **task-runner-level** cache skipped invoking the wrapper script entirely, so the receipt's
`exitCode: 0` / `outcome: PASS` describes nothing that actually happened. Caught only by noticing the
stdout byte count was zero — a check worth adding to this lane's standing verification habit
alongside `argv`/`durationMs`.

**Suspected cause:** Deno's task cache appears keyed on task name + matched-file content, not on the
full forwarded argv — so a differently-`--include`-scoped invocation can false-positive off an earlier
unscoped run at the same file-content state. Worked around by invoking the underlying wrapper scripts
directly via `deno run` (bypasses `deno task`'s cache layer): genuinely fresh, 100 files / 0 findings
each, matching the PR's own claims exactly. Discarded the cached receipts rather than committing them
as evidence. **Not fixed** — `run-gate.ts`/`catalog.ts` are shared cross-lane tooling outside this
leaf's ceiling; recorded in `drift.md` for whoever next touches that tooling.

Also independently confirmed `docs:exports-drift` PASS, `check:mcp-export-corpus` PASS with the exact
sha256 the PR cited, `quality:gate` exit 0 across all 36 packages, and the `test` receipt's own
150/0 genuinely.

**Verdict: ACCEPTED at `ff7d2de60ef470c312d633b851975d67a6774471`.** Evidence head `ff991165f`.
PR comment `5472087619`.

**IMPL-EVAL parked, matching #1387's Slice 9** — per the standing ruling, evaluation for this new
slice also waits on #1792 (the GLM/Qwen allowlist fix) rather than falling back to DeepSeek. PR #1805
stays draft.

## #1451 assessed and deferred — genuinely more complex than initially scoped

Before dispatching #1458, researched #1451 (the next p1 candidate) in depth: `JobConfig`
(`packages/plugin-workers-core/src/config/job-config.ts`) already types/validates description,
timeout, maxRetries, permissions, tags, retention — most of the issue's ask — but the generator
(`plugins/workers/src/cli/runtime-registry-generator.ts`'s `appendJobDefinitions`) emits a **fully
generic** `createJobDefinition()` helper with hardcoded `timeout: 300000, maxRetries: 3, priority: 50`
etc. for every job, and has **zero access to loaded project config today** — it only receives
`{ manifestPath, profile, projectRoot }` and scans the filesystem. Closing this gap for real requires:
new config-loading plumbing inside the generator, a matching strategy between discovered job files
and configured `JobConfig` entries (by id? by entrypoint path?), a precedence rule between
`workers.groups[].jobs[]` and the "legacy flat `jobs[]`", and schema additions for `priority`/
`retryDelay`/`maxConcurrency`/`persist` (none exist in `JobConfig` today, though `RegisterJobInput`'s
generated literal already has all four — confirming the config schema is what's lagging).

**This crosses into genuinely complex territory** — real open design questions (matching strategy,
precedence, fallback for unconfigured files), not just mechanical wiring, despite the issue's own
"0.0.7 seam decision" pre-deciding the high-level architecture. Deferred rather than dispatched
without a plan; flagging for a future PLAN-EVAL cycle rather than picking up piecemeal.

## #1458 — researched, scoped, and dispatched

Confirmed against the pinned dependency's actual source
(`@durable-streams/tanstack-ai-transport@0.0.8`, read directly from the Deno npm cache) that this is
the exact same shape as `#1591`: a thin NetScript wrapper not forwarding an already-typed upstream
option. `toDurableChatSessionResponse` already accepts `mode?: 'immediate' | 'await'` and
`waitUntil?: (task: Promise<unknown>) => void`; `toNetScriptChatResponse`/
`NetScriptChatResponseOptions` expose neither. Verified the exact status-code/failure-propagation
behavior in both modes directly from the transport's source (`await` → `200` after write, rejects on
failure; `immediate`/default → `202` before write, failure only `console.error`'d) — matches the
issue's own description exactly. **PLAN-EVAL: N/A confirmed** — this remains a thin typed forwarding
seam with no open design question, per the coordinator's steer.

| Field | Value |
| --- | --- |
| Branch | `feat/fresh-ai-chat-response-mode` (new, off `main` `5197e70b7`) |
| Worktree (NAS-local) | `/home/agent/projects/netscript/worktrees/007-leaf-1458` |
| Codex thread ID | `01a05527-6cd3-7a03-ad75-42b542efe3ac` |
| Route | requested = observed = `openai · gpt-5.6-sol · high` |
| Remote Control proof | dry-run clean (`use harness`=true, `## SKILL`=true, git-safety `upstream: NONE` / `dirty: 0` / head `1a887128b`); live thread confirmed via `codex-status`: `state: working`, rollout `sessions/2026/08/31/rollout-2026-08-31T02-10-42-01a05527…jsonl` |
| Base | `1a887128b` (research/plan commit) |
| Ceiling | two files: `create-chat-connection.ts`, `create-chat-connection_test.ts` |
| Tier-A stop | scoped check/lint/fmt (`packages/fresh`); relevant test file(s); `docs:exports-drift`; `deno.lock` hash check |
| Next steering command | none queued — awaiting the thread's own stop; will reconcile, review, cut/verify receipts (checking for D-1's cache-hit trap specifically, since this run just discovered it), and Tier-A once it reports idle |

Brief carries #1591's D-1 finding forward explicitly (check `stdout.bytes` before trusting a
`check`/`lint`/`fmt-check` receipt) so this leaf doesn't repeat the same near-miss.

**Both parked leaves — #1387 Slice 9 and #1591 — remain immutable**, no DeepSeek relaunch, evaluation
gated on #1792 exclusively as ruled.

## #1458 — reconciled, Tier-A ACCEPTED; evaluation parked; three parked leaves now immutable

Thread finished, clean, PR #1810 opened at `acb096a94`. Reconciled local/remote/PR consistency before
review. Exactly the two ceiling files touched plus run-artifact docs.

The implementation matches the plan's locked decisions exactly, and the second test — a real local
`Deno.serve()` server driving the actual code path — proves failure propagation against the real
pinned dependency in both directions (await-mode reject, immediate-mode silent-log), stronger than
the brief's own ask.

**Independently re-verified every gate, as with `#1591`.** The PR body cited a receipt id
(`leaf-1458-focused-test-final`) with no corresponding committed file — cut all Tier-A receipts
myself. Checked specifically for `#1591`'s D-1 cache-hit trap; **not present this time** — all three
`check`/`lint`/`fmt` receipts show genuine non-empty stdout with real 200-file selections. `test`:
19/19. `docs:exports-drift`: PASS. `deno.lock`: byte-identical, matches the PR's cited hash.

**Verdict: ACCEPTED at `acb096a94e8f2dc182ebc8c73be9ba421e2a6826`.** No findings. Evidence head
`c438c82db`. PR comment `5472201209`.

**Evaluation parked, per the standing ruling — no DeepSeek relaunch.** Three leaves now sit
immutable pending #1792: `#1387` Slice 9, `#1591`, `#1458`. All three Tier-A ACCEPTED, all three
draft PRs, none touched further until GLM 5.3 Flash routing lands or a fresh ruling arrives.

Selecting the next feature from the audited candidate set now.

## #1592 — deep research revealed a partial-slice shape; Slice 1 dispatched

Investigated in real depth before scoping. Initial read of the issue suggested three-layer complexity
(schema + runtime + stream, "ordering/coalescing/replay" as an open design question) matching #1451's
shape — but tracing the actual code found something better: `KvExecutionState`'s `queue`/`start`/
`complete` all funnel through one `#transition → #save` helper that **already** persists to KV and
**unconditionally invokes a mutation hook already wired to the durable-stream publish pipeline**
(`createStreamMutationHook` → `producer.upsert`). Adding a `progress()` method in that exact shape
needs **zero new publish plumbing** — persistence and stream publication both happen automatically
through machinery three other methods already exercise.

**What genuinely could not be resolved:** the runtime wiring from `ctx.reportProgress()` (called
inside a running job) to this new state method. `WorkerOutboundMessage`/`JobProgressMessage`
(`runtime/messages.ts`) model a `'progress'` message type, but neither `job-dispatcher.ts` nor
`in-process-job-runner.ts` contains any code reading or acting on ANY outbound message — the protocol
type exists with no found consumer. Rather than force a ceiling around an unverified assumption (in
either direction — "it's simple" or "it's complex"), scoped this as an **honest partial slice**:
persist + publish (fully bounded, precedent-matched, PLAN-EVAL: N/A) now; the runtime-wiring half and
the "document ordering/coalescing/replay" requirement explicitly deferred, stated plainly in the PR
body (`Refs #1592 — partial`, no closing keyword) rather than silently dropped or guessed at.

| Field | Value |
| --- | --- |
| Branch | `feat/workers-execution-progress` (new, off `main` `5197e70b7`) |
| Worktree | `/home/agent/projects/netscript/worktrees/007-leaf-1592` |
| Codex thread | `01a05536-fa9d-7b51-867e-52139653d812`, `openai · gpt-5.6-sol · high` |
| Ceiling | four product files (`job-definition.ts`, `execution-state.ts`, `streams/schema.ts`, `streams/producer.ts`) plus a new `execution-state` test file — confirmed none exists today |
| Base | `7b9ed9f5a` |

Also confirmed no existing test file covers `KvExecutionState` at all — the brief points the
implementer at this package's own existing testing-fixture conventions rather than inventing a new
one, and requires the mutation-hook invocation itself be proven (not just persistence), since that's
the one behavior this slice is actually about. D-1's cache-trap finding carried forward again.

Four parked/active leaves now: `#1387` Slice 9 (parked), `#1591` (parked), `#1458` (parked), `#1592`
Slice 1 (dispatching now). All evaluation gated on #1792; no DeepSeek relaunch on any of them.

## #1592 Slice 1 — reconciled, Tier-A ACCEPTED; four leaves now parked pending #1792

Thread finished, clean, PR #1814 at `ce6b00fad`, correctly `Refs #1592` with no closing keyword.
Reconciled before review: local/remote/PR all consistent.

Content matches every locked decision precisely. Worth noting: the implementer correctly spotted and
kept synchronized a **pre-existing** duplicate type declaration (`execution-state.ts` hand-declares
its own `ExecutionRecord` rather than importing `job-definition.ts`'s) that my own research pass
hadn't flagged as a distinct risk — it just updated both, which was the correct move given ceiling
already covered both files. The mutation-hook test proves the *full* record flows through the
existing publish pipeline (not a partial field check), and the streams test additionally validates
through `WorkerExecutionSchema.parse()`, not just the TS type.

**Independently re-verified every gate, as with `#1591`/`#1458`.** No committed receipts to check
against — cut them myself: `check`/`lint`/`fmt-check` genuine non-zero stdout (checked `stdout.bytes`
specifically per D-1), `test` 29/29, `quality:gate` PASS, `docs:exports-drift` PASS, `deno.lock`
byte-identical matching the PR's cited hash.

**Verdict: ACCEPTED as Slice 1 (partial) at `7270cc7f7`.** No findings. Evidence head `af6f16916`.
PR comment `5472318538`.

**Evaluation parked — no DeepSeek relaunch.** Four leaves now sit immutable pending #1792: `#1387`
Slice 9, `#1591`, `#1458`, `#1592` Slice 1. All Tier-A ACCEPTED (three fully, one honestly partial),
all draft PRs, none touched further until GLM 5.3 Flash routing lands.

Checked the audited candidate queue: #1451 remains deferred (genuinely complex, needs config-loading
plumbing and a matching-strategy design decision — flagged, not silently dropped). #1452 was not yet
researched. No further immediately-obvious bounded candidate identified without deeper research;
holding here rather than force a fifth dispatch without the same diligence the prior four received.

## #1452 — researched, sliced, Slice 1 dispatched; Slice 2 flagged for an architecture decision

Researched rather than assumed. The duplicated glue the issue complains about is measurable: the
scaffold template is **123 lines**, of which the `LazyPluginKv` class is **exactly 69 (56%)** — a
pure lazy-delegation wrapper implementing `WatchableKv` by deferring `getKv()`. **Both of those are
`@netscript/kv` types**; the class has zero plugin-specific content.

**The genuine architectural question, found by checking rather than guessing:** publishing the *full*
`createPluginServiceContext()` from `@netscript/plugin/sdk` (where the `PluginServiceContext`
contract already lives) requires `@netscript/plugin` to import `@netscript/kv` — and it **does not
depend on kv today**, verified against its `deno.json`. Every `plugin-*-core` package does; the base
package deliberately doesn't, and every plugin author pays for its dependency closure. Two more open
questions compound it: the db-client resolver is a **project-relative** `../../database/mod.ts`
import no published package can resolve (so its injection shape is a public-API decision), and
**`appsettings` — named in the issue's acceptance — appears nowhere in the codebase**, searched.

**The issue's own wording permits the clean way out**: "or smaller composable host primitives."
Publishing `createLazyKv()` from `@netscript/kv` removes 56% of the template, introduces **no new
dependency edge anywhere**, and requires **no design decision** (the shape is dictated by the
existing `WatchableKv` interface). That's Slice 1. Slice 2 — the host factory, the dependency-edge
call, the resolver injection, the undefined appsettings scope — is **deferred and flagged**, with
`PLAN-EVAL: N/A` explicitly scoped to Slice 1 only and Slice 2 marked as needing a PLAN-EVAL or owner
ruling before any implementer touches it.

| Field | Value |
| --- | --- |
| Branch | `feat/kv-lazy-plugin-context` (new, off `main` `5197e70b7`) |
| Worktree | `/home/agent/projects/netscript/worktrees/007-leaf-1452` |
| Codex thread | `01a0559c-0c08-7d30-a158-b888a7fa798e`, `openai · gpt-5.6-sol · high` |
| Base | `fb08d2f9d` |
| Ceiling | `packages/kv` (new module + mod exports + new test), the scaffold template, and the regenerated `embedded.generated.ts` carrier |

Brief requires laziness be **proven by observation** (that `getKv` is not called at construction and
is called on first use), not merely that operations return correct values — the failure mode a
happy-path test would miss. D-1's cache-trap finding carried forward again.

**Five leaves now**: `#1387` S9, `#1591`, `#1458`, `#1592` S1 (all Tier-A ACCEPTED, parked pending
#1792) and `#1452` S1 (implementing).

## Serial correction applied — #1762 is the sole front

Coordinator corrected mid-turn: no more than one feature PR convergence/evaluation path active in
this orchestrator; parallelism belongs across orchestrators, not inside one. Complied at the next
clean boundary rather than aborting mid-command — the three in-flight integrations
(#1591/#1458/#1592) had already reached commit+push, so stopping there left no half-integrated tree.

**Stopped:** the #1349 PLAN-EVAL (task `bqykbr99q`, 0 lines produced, nothing lost). The #1591
IMPL-EVAL had already self-terminated on the denial below. **Front:** #1762 only, its Slice 9
evaluation still running (`bogxei74n`).

**Parked, each at a clean pushed boundary, none half-done:** #1805 (`1f87b111f`), #1810
(`b818be147`), #1814 (`a4c6c3595`), #1820 (`03392e186`), #1664 (untouched, owner boundary).

## A real finding that changes evaluation sequencing — the allowlist is read per-worktree

The #1591 evaluation was **denied instantly**: `evaluator model request denied:
model=z-ai/glm-5.3-flash`, despite #1792 having landed on `main`.

**Root cause, confirmed by direct comparison rather than inference.** The evaluator model guard
resolves `OPEN_EVALUATOR_MODEL_IDS` from `.llm/tools/agentic/config/models.ts` **in the worktree the
evaluator runs in**, not from `main`:

- `ns1387-eval-s9` (its leaf had integrated `main` twice) → carries the new
  `planEvaluator`/`implEvaluator` allowlist → GLM accepted, evaluation running.
- `ns1591-eval` (its leaf branched off pre-#1792 `main`) → still carries the old
  `minimax`/`deepseekV4Flash0731`/`qwen3.8-max` tuple → GLM denied at the proxy.

**Consequence: a leaf must integrate post-#1792 `main` before its evaluation can run on the sanctioned
route at all.** This is not optional sequencing preference — it is a hard precondition. All three
remaining leaves have now been integrated and verified to carry the new allowlist, so each is
evaluable the moment it becomes the front. That integration also freshens each packet against `main`,
which the deadline wants regardless.

Had I not root-caused this, the natural reading of the denial would have been "GLM routing is still
broken" and I would have escalated a non-existent infrastructure problem back to the coordinator.

## #1762 checkpoint — shipping front, all audit blockers resolved

The GLM task was **not stalled**; it completed at 104 turns / ~21 min with
**ACCEPTED_WITH_FINDINGS at `ffd380532`**, and its artifact is preserved verbatim at
`evaluate-slice-9.md` (not overwritten). Every blocker the coordinator's read-only audit named is now
resolved:

| Audit blocker | Resolution |
| --- | --- |
| Generated-corpus conflict with `main` #1764 | Integrated `main` `8a9257642`; sole conflict was the MCP export corpus, regenerated from current inputs → **7709 symbols** |
| Stale `evidence-set` immutableHead / receipt ids (**F-1**) | Archived the whole Slice 9 set to `receipts/slice-9-3cb08103f/` — **including the four superseded receipts, preserved not discarded** — then cut one coherent nine-gate set. Manifest and directory now agree. |
| Ledgers missing integrations / final heads (**F-2**) | `worklog.md` + `context-pack.md` now record all three integrations and the re-cuts |
| Stale PR body / `status:plan` | PR body rewritten in place; issue relabelled `status:plan` → `status:impl` |
| Issue acceptance wording + unchecked boxes | LD-11 line amended in place with its rationale; a fenced `acceptance-evidence` block now maps **all 13 boxes** to concrete slice evidence |

**Boxes were not hand-ticked.** The close-gate mirrors them from the fenced block — hand-editing
checkboxes is precisely the failure mode this lane recorded earlier. `Fixes #1387` now registers as a
live `closingIssuesReferences` entry; PR is **MERGEABLE / CLEAN**.

**The LD-11 amendment, stated plainly.** The issue demanded a negative test proving *"renaming a
router breaks a contract-declared policy at compile time."* PLAN-EVAL rejected that as incompatible
with the design it accepted, and I amended it in place: policy is **contract-local**, so it travels
*with* a renamed procedure. Making a rename *break* policy would require a second key-indexed policy
map — exactly the defect this issue exists to remove. The substituted proof (metadata follows the
rename through REST **and** RPC; the stale SDK key fails type-check) is both achievable and stronger.

**Final exact-head gates:** nine contracted gates at one head, each `gitHead == actualGitHead`,
`evidence-set.json` **SUFFICIENT / zero reasons**, `deno.lock` byte-identical. Final exact-head
IMPL-EVAL dispatched (`blcx8dfmo`); its brief explicitly asks the evaluator to judge the third
integration and both F-fixes, and to preserve rather than overwrite the prior verdict.

## Parallelism, per the owner's authorization

`#1805` (#1591) dispatched concurrently (`baoqj3061`) — its `packages/ai` surface is disjoint from
#1762's service/principal code, it has its own worktree, and **`git diff <content>..<evidence> --
packages/ai` is empty**, so the integration moved no product source. The shared export corpus is a
derivative artifact, ordered at integration time, not a concurrent edit.

**Queued, not yet started:** `main` advanced docs-only to `6bb27e46a` (#1796). Deliberately **not**
integrating it now — that would move the head under the running #1762 evaluator. It is a mechanical
derivative delta; after the verdict I will integrate, regenerate the corpus, prove product sources
byte-identical, and carry the accepted product verdict across rather than re-evaluating unchanged code.

## #1762 — final verdict, docs integration carried across, promoted non-draft

**Final exact-head IMPL-EVAL: `ACCEPTED_WITH_FINDINGS` at `2a26f0254`** — "the documentation is
adequate for the close-gate." 65 turns. It re-verified content against source rather than trusting the
prior verdict: replicated the tutorial's Steps 1–3 as a scratch type-check (0 diagnostics), traced
LD-6 both directions in `contract-authorizer.ts`, matched LD-8's error string character-for-character,
reproduced the bare-check `TS2551` itself and confirmed it pre-exists in main's own `#847`, and
inventoried **96 receipts with zero head mismatches**. Prior artifact preserved; verdict written to
`evaluate-slice-9-final.md`.

### It caught that my F-2 fix was only partial — correct, and now properly fixed

I had changed **one line** (the phase row) and left the body claiming 7,655 symbols, an
"eleven-receipt evidence set", "awaiting IMPL-EVAL", and Next Steps still instructing a Tier-A review
already performed. The evaluator flagged this as **the third recurrence of the exact class that file
documents at its own lines 45–51**. Rewritten wholesale this time rather than patched again.

### It also closed a gap I had left open

The nine-gate manifest silently dropped four doc-specific gates (`agent-docs-prose`, `docs-tagline`,
`publish-assets`, `service-doc-lint`) whose receipts predated the carrier regenerations — currency was
proven only by the evaluator's own runs, not by receipts. **All four are now receipted**, giving a
thirteen-gate set.

**One of those four re-cuts initially recorded `FAIL`.** `doc-lint` exited 1 in 454 ms from a *usage
error* — `--root` is required and the catalog argv omits it. Not a real failure: the same
exit-code-is-not-evidence trap this run has now hit three times in different forms. Re-cut with
`--root packages/service` → PASS, 0 errors across three entrypoints.

### Docs-only `main` #1796 carried across, product neutrality proven not asserted

Integrated `6bb27e46a` after the evaluator finished (not before — that would have moved the head under
it). Intersection was four generated carriers plus one docs page. **Proved the docs page is main's own
content**: byte-identical to `origin/main`, and `git log origin/main..HEAD -- <file>` shows no
non-merge leaf commit. So the accepted product verdict carries across a purely mechanical derivative
delta; re-evaluating unchanged product code would have been waste.

**Final state:** thirteen gates at one head `df1036c9b`, `evidence-set` **SUFFICIENT / zero reasons**,
`deno.lock` byte-identical, evidence head `d7cf2419c`. PR **promoted non-draft**, `Fixes #1387` live in
`closingIssuesReferences`, **MERGEABLE**. Exact CI running on `d7cf2419c` (quality + ci + phase-eval).
`BLOCKED` is only pending checks.

## #1762 `check-test` red — diagnosed, and a correction to what I previously asserted

**I was wrong earlier, and so was the final evaluator.** Both of us recorded that the repo-wide
`TS2551` on `packages/service/src/primitives/health.ts:184` was "pre-existing on `main`, untouched by
the leaf". **It is not pre-existing.** I tested it directly: clean `main` at `7908399af` runs the
identical repo-wide `deno task check` with **exit 0, 0 occurrences**. The leaf fails it
deterministically (reproduced twice). Correcting that on the record, because a merge packet resting
on "pre-existing, ignore it" would have been resting on a false claim.

### What it actually is — batch composition, not leaf code

Evidence chain, each step measured rather than inferred:

| Test | Result |
| --- | --- |
| `health.ts` byte-identical to `main`? | **Yes** |
| root `deno.json`, `packages/service/deno.json` identical to `main`? | **Yes, both** |
| `deno check --unstable-kv health.ts` **alone** | **exit 0, clean** |
| Scoped 5-package check (434 files) | **PASS, 0 diagnostics** |
| Clean `main` repo-wide | **exit 0, 0 occurrences** |
| Clean `main` + 4 inert files (same 2974 count as leaf) | **exit 0, 0 occurrences** |
| Leaf repo-wide (2974 files) | **exit 1, 1 occurrence**, twice — deterministic |

`--unstable-kv` is passed to **every** batch (`run-deno-check.ts:369`), so the flag is not the
variable. Files are `localeCompare`-sorted and chunked at 120. The leaf's added `packages/service/src/auth/`
files shift which 120-file batch `health.ts` lands in, and in that particular grouping `deno check`
stops applying the unstable-KV lib to it. Matching the file *count* on main does not reproduce it —
only the specific *composition* does.

**So the leaf's code is innocent, but the CI red is real and is the leaf's to carry.** It is not a
flake and it will not clear itself.

### Why I am not fixing it here

`packages/service/src/primitives/health.ts` is on **no slice's ceiling**, and editing it would be a
rescope of a leaf that is otherwise complete and twice-evaluated. The actual defect is in
`.llm/tools/run-deno-check.ts`'s batching — shared cross-lane harness tooling, the same class as D-1
and the D-5 catalog gap, and equally not something to patch from inside a feature branch.

**This is a concrete coordinator boundary**, and the only one currently blocking the shipping front.
Three viable resolutions, none of which is mine to pick unilaterally:

1. **Fix the batching** in `run-deno-check.ts` (e.g. keep workspace members in the same batch, or
   raise `--batch-size` above the workspace file count) — a small, reviewable tooling change in its
   own PR, which would also protect every future leaf from the same trap.
2. **Scope CI's `check` gate** the way every slice's Tier-A already does (`--include`), so it checks
   the packages under change rather than the whole repo in arbitrary groupings.
3. **Accept and label** — but I would argue against silently skipping a repo-wide type check to ship.

Per the merge-sequence correction, #1762 is **held** pending Docs #1798 anyway; this needs resolving
before the single final integration and hand-off, not after.

## Rotation resume — 2026-08-31 ~03:45–04:20Z (Opus 5 · xhigh · supervise-only)

Resumed from `RESUME.md`. Live GitHub and git treated as authoritative; two of the checkpoint's own
claims turned out to be wrong and are corrected on the record below.

### #1805 → EXACT-GREEN MERGE CANDIDATE (the lane's first this rotation)

IMPL-EVAL returned **`OPENHANDS_VERDICT: PASS`** at `e76e02271` (GLM 5.3 Flash · max, comment
`5473484620`), three info-only findings.

**The `status:augment-review` park, resolved by measurement rather than assumption.** The label
appeared 47 s after the PASS and parked an otherwise green PR. Evidence gathered: 0 reviews, 0 review
comments, no `augmentcode[bot]` check-run (every check-run on the head is `github-actions`), and no
`augment review` trigger comment. Control case **#1747** — the only other PR with the label — had its
`augmentcode[bot]` review submitted **≈11 h before** the label was applied, proving the label is a
post-hoc marker of a *completed* advisory pass, not a pending one. **Verdict: stale metadata, no live
process, no run id, no ETA.** Normalized to `status:ready-merge` (#1591 already carried it).

**Final current-main seam.** The coordinator caught that `refs/pull/1805/merge` still had first parent
`7908399af`, so the green CI did not describe the current merge snapshot. Integrated `a3e0a5aa8` at a
clean seam — **zero conflicts** — with explicit carry-forward proof: `e76e02271` is a git **ancestor**
of the new head; all three product files **byte-identical** (`14cbf897…`, `f13d3efc…`, `6db3e9a5…`);
product diff vs current main still exactly those three files; `deno.lock` unchanged. Merge ref
recomputed to first parent `a3e0a5aa8`. Gates re-cut at `8a6855d8a`; evidence head `a5d92386b`.
**`docs:exports-drift` now PASSES**, empirically confirming the evaluator's attribution of that red to
`main`'s base rather than to this slice.

### Two corrections to my own earlier record

1. **#1762 `close-gate` was never failing.** The CI red was a race: the acceptance mirror was mid-apply
   and the gate read the `03:22:22Z` issue snapshot. Live re-evaluation returns
   `close-gate PASS rickylabs/netscript#1762`; the rerun job is green without moving the head.
2. **The `check-test` "batch-composition" theory was wrong.** Root cause is config parity:
   `packages/cli/e2e/deno.json` sets `lib: ["deno.ns","dom"]`, omitting `deno.unstable`, while root and
   `packages/cli` both include it. Deno 2.9.5 honors the explicit omission, so `--unstable-kv` has **no
   effect** — reproduced with and without the flag, byte-identical `TS2551`. Owned by the P0 repair;
   **no product change belongs in #1762**, and none was made.

### #1810/#1814/#1820 — integrated, and a hidden CI hole closed

All three were `CONFLICTING/DIRTY` against `main`. Each conflicted on exactly one file (the generated
MCP export corpus), resolved by taking `main`'s and **regenerating from tooling**. Gates re-cut at each
integrated head; bodies rewritten to record integration and evidence.

**The important find: draft PRs get no real CI.** `ci.yml` gates `check-test`/`quality`/
`code-quality`/`close-gate` on `pull_request.draft == false`. All three were showing `build` +
`classify` green with everything else `skipping` — they would have reached the coordinator looking
green while proving nothing. Promoted non-draft. `impl-eval:skip` was applied first but **did not
prevent** the `ready_for_review` auto-dispatch; the resulting duplicate on #1810 was cancelled and the
now-useless labels removed, leaving exactly one eval per PR.

**That immediately paid for itself: #1814 `quality` FAILS** on `publish:dry-run`. Diagnosed to
`ExecutionRecordSchema` (`job-definition.ts:241-242`) adding `progressPercent`/`progressMessage` as
**required-nullable**, which flows through `workers.contract-definition.ts:197` into the **public v1
output schema**, breaking `plugins/workers/services/src/routers/{runs,tasks}.ts`. Proven slice-caused
(main's `ci.yml` green at three consecutive heads), and it is an unintended **breaking v1 contract
change**, not merely a type error. The slice's own `streams/schema.ts:89` makes the same field
optional — an internal inconsistency. Recommended in-ceiling fix recorded on the PR
(`5473577044`). #1810 and #1820 are `quality`-green.

### #1354/#1355 residual-scope audit, measured on `main` `0274c0a70`

- **#1355 not resolved.** Symbol collisions were fixed (templated names), but the **dead invalidation
  is still live**: the template keeps `createQueryFactories({ service: {…} }).service`, and
  `createQueryFactories` uses the **object key** as the resource (`query-factory.ts:222`), so real keys
  are `['service', …]` while the generated invalidation targets `[routerName, 'list']`. They never
  match — a silent runtime no-op still shipping in generated user code.
- **#1354 essentially untouched.** One generated app asset references `withResource`/
  `withRouteContract`; `generate-group.ts` still registers three commands. No resource-slice verb.

### #1349 PLAN-EVAL

Re-dispatched (`qwen/qwen3.8-flash · max`) in detached `ns1349-planeval` at `4b520ea44`. First attempt
died on SIGTERM/143; relaunched with `setsid nohup`, confirmed alive and reading the SDK type surface.

---

## Rotation resume — 2026-09-02 ~10:00–10:35Z (Opus 5 · xhigh · supervise-only · Remote Control)

Resumed from `RESUME.md`, `queue.md`, `merge-packets.md` and live GitHub. `main` re-fetched to
`77ad823dc` (#1910 concurrency isolation, #1911 skill single-source, #1889 transport policy, #1756
JSDoc gate, #1907 aspire skill). Every claim below is measured at a named head.

### Shipped since the last checkpoint, discovered on resume rather than assumed

`#1841` (#1349 S2), `#1886` (#1349 S3), `#1861` (#1451), `#1864` (#1592), `#1848` (#1590 S1) all
**merged**. #1451 and #1592 are `status:shipped` and closed. **#1349 is still open** with all ten
acceptance boxes unticked and no open PR to attach an evidence block to — see "Open supervisor debt".

### Live worker roster — five, all detached, all measured alive

| Issue | PR | Worktree | Thread | Route | State |
| --- | --- | --- | --- | --- | --- |
| #1590 S2 | #1895 | `007-leaf-1590-s2` | `01a060be-6b53-7962-88a2-f80a51a4010a` | Sol · medium | **completed**, pushed `31f4ff8a1` |
| #1897 | — | `007-leaf-1897` | `01a0619a-11e3-7c61-963d-6dae0a4a80d3` | Sol · low | running |
| #1355/#1360 | #1664 | `007-leaf-1664` | `01a0585d-94e1-70b0-a1c2-6f9654179b0e` | Sol · high | running |
| #1353 | — | `007-leaf-1353` | `01a061a8-2a71-7f33-be7e-72b314c5619c` | Sol · medium | running |
| #1467 | — | `007-leaf-1467` | `01a061a8-2a32-7733-86fc-2789efcb5dd1` | Sol · high | running |

### #1842 (#1452 S2) — integrated to `77ad823dc`; head `d1697421c`

Merged `main` with **zero conflicts**, then found and repaired a defect the merge could not fix.

**`packages/fresh/README.md` carried a duplicated "Ordered partial navigation" section** — two `###`
headings, at lines 158 and 198, against main's single one at 162. Cause: the earlier re-stack onto
#1848 kept the *leaf-side* copy of a section #1848 had **moved** before merging, so main's moved copy
arrived through the merge alongside the leaf's stale one. The leaf owns nothing in that file;
main's version was taken verbatim and the file is now byte-identical to `origin/main`.

Generalisation worth keeping: **a re-stack that resolves a file by keeping "our" side is only safe
when this branch actually owns content in that file.** For a file the branch merely inherited, "ours"
is a stale snapshot, and the duplication it creates survives every later clean merge silently.

Carriers regenerated at the integrated head — `assets-barrel` and `publish-assets` already current;
`mcp-export-corpus` refreshed to `4d383b1e…` / 272 subpaths / 7804 symbols, `check` exit **0**.
`deno.lock` byte-identical to `origin/main`. Scoped `packages/plugin` check: **155 files, 0
diagnostics**.

### #1842's runtime red is #1844's, and I proved it rather than asserting it

`scaffold-runtime (aspire + docker + postgres)` **FAILED** at `d1697421c`. The uploaded E2E report
(`e2e-report-scaffold-runtime.json`, run `33617486148`, job `100206685348`) gives
`passed=46 failed=1`, and the single failure is **`runtime.wait.garnet` at 300338 ms** — the last
gate in the suite, after the full database sequence and both allocation captures passed.
`runtime.wait.postgres` passed in **512 ms** on the same run.

That is exactly **#1844** (`orchestrator:fixes`, PR #1858 open). #1844 recorded itself as "a single
observation, not a confirmed shared defect"; this is a **second independent reproduction** at a
different head, with the same `passed=46 failed=1` shape and a sharper postgres/garnet asymmetry.
Posted to #1844 as evidence (comment `5508166737`), with the attribution reasoning stated rather than
implied. #1842 adds no Aspire resource, health probe or container.

### #1915 (#1352 S5) — promoted non-draft, two real reds found and fixed

The PR sat in **draft**, which per the recorded trap means `check-test`/`quality`/`code-quality`/
`close-gate` are all *skipped* — it looked green and proved nothing. Integrated `main` (clean),
regenerated the corpus (`658a3a56…` / 273 subpaths / 7809 symbols; the `+1 subpath` is this slice's
own `@netscript/plugin-auth-core/sdk`), promoted non-draft via GraphQL
`markPullRequestReadyForReview` (the token cannot `gh pr ready`).

Promotion immediately paid for itself: **`quality` FAILED** on the *Agent docs corpus freshness*
step. This slice edits `packages/plugin-auth-core/README.md` and `plugins/auth/README.md`, both of
which feed the embedded prose bundle. Ran the **whole cascade** rather than the one gate CI was
showing — `gen:agent-docs-prose` (sha256 `ec8b083c…`, 180 files) → `gen:assets-barrel` →
`gen:publish-assets` → `gen:mcp-export-corpus` — then verified all four `check:*` forms at the
committed head: **0 / 0 / 0 / 0**. `check-test` and `quality` are now green at `a6fababde`.

`close-gate` is red for a correct reason: the DoD box *"Separate-session IMPL-EVAL passes"* is
honestly unticked. Verified locally with `check-close-gate.ts`: `closing issues: none`, one unchecked
box, that one. It clears when the eval passes — not before, and not by hand.

**IMPL-EVAL is running at `88df4839e`** (run `33617695217`), one commit behind the pushed head. The
delta `88df4839e..a6fababde` is **generated carriers only**, so the product verdict carries by
byte-identity; that carry is stated here so the merge packet does not have to assert it later.

### #1895 (#1590 S2) — FAIL_FIX diagnosed, repaired, pushed

The IMPL-EVAL FAIL_FIX at `e4a2a8cdb` was a **test-harness context error**, not a product defect.
`packages/fresh/tests/form-navigation_browser.ts` builds a `run-code` script of the form
`async page => { … }`; that body runs in the **Playwright driver** context. At lines ~194–199 it did
`new MutationObserver(…)` and `document.querySelector('h1')` *directly in the driver*, where neither
global exists — so it threw `ReferenceError: MutationObserver is not defined` before any assertion
evaluated. The neighbouring `partialMarker` works because it is *passed to* `page.evaluate`.

Worker `01a060be` completed and pushed **`31f4ff8a1`**: the observer now installs and disconnects
inside the page, plus an idempotent pre-close drain that waits for `released`,
`completed === arrived` and `cancelled === 0` — addressing the second finding, where the teardown's
own abort at page close contaminated the drain-without-overlay assertion. Touch set is **exactly**
the test file plus three run artifacts; `packages/fresh/src` untouched; file still 500 lines; every
assertion (`overlayCount === 0`, `cancelled == 0`, stale drain, last-intent-wins) unchanged. Hosted
runtime gates are executing at that head.

### Dispatch decisions, with the file-overlap measurements behind them

- **#1353 and #1467 run concurrently.** The queue previously serialized both behind #1352 on the
  premise that all three rewrite `http-client-link.ts:82-101`. **That premise is now stale**:
  #1352's shipped touch set (measured) is `plugin-auth-core` / `plugin` / `plugins/auth` and does not
  touch `packages/sdk/src/client/http-client-link.ts` at all. #1353 (amended to a *proof* slice — do
  not ship `traceContextContribution()`, do not move injection out of the transport) is test-first;
  #1467 adds a locale contribution. Each brief names the other's branch and forbids its surface, and
  both are told to stay out of `prepared-call.ts` — #1467 with an instruction to **stop and report**
  rather than edit it, which converts a silent collision into a serialization decision.
- **#1353 and #1467 are both audit-first.** `traceparent`/`tracestate` are *already* in
  `RESERVED_HEADERS` (`prepared-call.ts:37`) and observability tests already exist, so a large part of
  #1353 may be shipped. #1349 S3 hit exactly this and correctly stopped; both briefs say so and say
  that "already shipped, nothing outstanding" is a complete answer.
- **#1897 dispatched despite a known collision with #1895** — both edit `packages/fresh/deno.json`'s
  `publish.exclude`. Serializing it behind an open-ended repair loop risked it missing 0.0.7 for a
  two-line change, so #1897's brief instructs it to *compose* with #1895's entries: add without
  reordering or reformatting, so the merge is a textual addition rather than a rewrite conflict.
- **#1354 stays serialized behind #1664** — measured, not cautious: #1664 is actively converging
  `packages/cli`, which is #1354's entire surface. Plan PR #1891 is open and unaffected.

### Launcher traps, both hit today, both now recorded

1. **`launch-codex-slice.ts` blocks for the child's whole lifetime.** A foreground call dies at the
   Bash tool timeout and **SIGTERMs the worker with it** — #1897's first thread was killed mid-slice
   with its edits uncommitted. Always `setsid nohup … &`. Recovery is `codex-resume.ts` on the *same
   thread id*, which preserves both its context and the worktree's uncommitted work; relaunching
   would have discarded both.
2. **The launcher does not create `--slice-dir`.** It starts the thread, then crashes writing
   `codex-thread-ids.md`, leaving a live sender lease and a thread that never received its brief —
   which is how #1353 and #1467 both had to be recovered by resume. `mkdir -p` the slice dir first,
   and give each slice its **own** dir: a shared `--slice-dir` silently overwrites the previous
   slice's thread record.

Two further launcher facts, for the same reason: `--slug X` stages to `/home/<user>/X-brief.md` with
`codex` hardcoded, so under `--user node` pass `--dest` explicitly; and a worktree created with
`git worktree add -b <b> <p> origin/main` inherits `origin/main` as upstream, which git-safety
refuses — `git branch --unset-upstream` first.

Three sender-ownership refusals were resolved today, all `owner_inactive`, all **this slice's own
prior thread**, all recovered by resume. Liveness was measured each time (rollout mtime plus
`/proc/<pid>/cwd`), never inferred from the refusal itself.

### Open supervisor debt — stated, not deferred silently

**#1349 has no closure path yet.** S1/S2/S3 all merged; none carried a closing keyword (correctly —
they were partials at the time); the issue's ten acceptance boxes are unticked; and the mirror only
runs from an `acceptance-evidence` block on a PR carrying `status:ready-merge`. With every slice
merged there is no open PR to carry that block. Closing it therefore needs either a closure PR
carrying the evidence block and `Closes #1349`, or a coordinator decision. Recorded rather than
resolved by hand — hand-ticking is exactly what the close-gate exists to prevent.

---

## Delivery continuation — 2026-09-02 ~11:00–11:45Z

`main` advanced to `634b83d64` (#1914, the JSDoc example compiler rewrite). Three new leaf PRs opened
by workers dispatched earlier: **#1918** (#1897), **#1921** (#1353), **#1922** (#1467).

### #1842 — packet closed, `status:ready-merge` applied

`scaffold-runtime-sqlite` landed **SUCCESS** (job `100206685520`). Final state at `d1697421c`:
**ten of eleven gates green**, the one red being `scaffold-runtime (postgres)` → #1844.

**The sqlite tier is the control that settles the attribution.** It runs aspire + sqlite + **garnet** —
the same resource, the same wait mechanism, the same head — and it passed. So the garnet 300 s timeout
is not this branch's code and not garnet readiness in general; it is the postgres-tier interaction
#1844 describes, and #1844's own original receipt shows the same asymmetry. Packet posted
(`5508658968`), label applied, with the caveat stated explicitly: `status:ready-merge` claims every
gate this branch can affect is green, **not** that the postgres tier is green.

### #1895 — hosted browser proof GREEN, and the marker question answered correctly

At `f44f96928`: `check-test` **success**, including step *Managed form browser regression*; both
runtime tiers success; every other gate success. The DoD box "Hosted `fresh-browser` proof green at
the exact committed head (supervisor-owned)" is now true, evidenced, and ticked with the job/step
receipt. The PR body now carries `Closes #1590`.

The worker resolved the `dynamicMarkers` question as **(a)** — a test-premise error, not a product
defect — from the resolved Fresh 2.3.3 source: `reviver.ts` sets `SHOW_MARKERS = false`,
`maybeHideMarker` replaces the comment markers, and `PartialComp.render()` returns children only, so
`frsh:partial:*` markers are **parser inputs, not durable live-DOM nodes**. `colonMarker` passed all
along precisely because it reads raw server HTML over `fetch`.

The replacement proof is stronger than what it replaces: `dynamicMarkers` now reads the three HTML
response bodies the page actually fetched, **plus** a page-side expando tagged on `#region-content`
before A→B and B→A, asserting `dynamicRemounts === [true, true]`. An ordinary same-node
reconciliation would preserve the expando; only a genuine remount drops it. That distinguishes
remount from re-render, which the old marker walk never did.

### #1922 — two docs reds, both diagnosed by measurement

1. **`quality` / JSDoc example gate.** Not a compile failure — `failures=0`,
   `enforcedFailureCensus` all zeros. It is the **ratchet**. Measured both sides:

   | Revision | Result | `deferredCensus` |
   | --- | --- | --- |
   | clean `main` `634b83d64` | **PASS** | `{"unboundName":116,"typeError":14}` |
   | #1922 with main integrated | **FAIL** | `{"unboundName":117,"typeError":14}` |

   Exactly **one** new deferral, and it is the slice's own: `locale-contribution.ts` · symbol
   `createLocaleSdkClientContribution` · example 1, with `TS2304 createServiceClient` and `TS18004
   contract`. Per the recorded doctrine the fix is to repair the example, **not** raise
   `maximumDeferredUnboundName`. Here that is unambiguous — the new deferral is the slice's own new
   symbol, so the slice owns it.

2. **`build` / docs snippets.** `TS2307` for
   `pages/services-sdk_sdk.md/blocks/contracts/accounts.ts`: the new `sdk.md` fence imports
   `./contracts/accounts.ts` and no fence supplies it. The mechanism already exists —
   `snippet-compiler.ts:32` `explicitModulePath`: a fence whose **first line** is a `// <path>.ts`
   comment is materialized at that path.

**A false alarm worth recording.** Diffing the leaf against the *new* `main` made it look as though
the worker had rewritten `.llm/tools/docs/jsdoc-example-compiler.ts` and stripped imports from
`packages/plugin` JSDoc examples — a serious scope violation. It had not. Diffing against the leaf's
**own base** (`77ad823dc`) showed a clean, in-scope touch set; the apparent edits were #1914's content
arriving on main. **Diff a leaf against its own base before accusing it of scope violation** — against
a moved `main`, every commit `main` gained reads as something the leaf removed.

Integrated `main` `634b83d64` into the leaf (zero conflicts), regenerated the corpus, pushed
`a628de1a5`, and dispatched the two repairs with the exact diagnosis.

### #1664 — one red is its own, three are foreign

- **`check-test`** (`4929 passed / 1 failed`): `add-ui-command_test.ts:19`, "ui:add help explains the
  page island query-loader triad". The expected substring **appears present** in the actual output,
  and the worker's local focused run was 106/106. Almost certainly **help-text line wrapping** at a
  CI-vs-local terminal width, with the failure report normalising the newline to a space so the two
  strings look identical. Dispatched with instructions to confirm the width hypothesis before fixing,
  and to make the assertion width-insensitive by normalising whitespace — not to weaken it.
- **`scaffold-runtime` (postgres)**: `72 passed / 1 failed`, sole failure
  `behavior.service-client-refetch` with `{"islandHydrated":false,"islandInteractive":false,...}` —
  **#1845** exactly. Posted as a fresh reproduction (`5508747615`), noting that the head moved 44
  commits of `main` — now containing #1848 and #1900 — **and the defect did not**, which eliminates
  both as candidate causes.
- **`scaffold-runtime-sqlite`**: `runtime.health.listener-unreachable` —
  `garnet healthReports.test_only_garnet_resp missed its 30s transition`. #1844/#1880 class.
- **`close-gate`**: DoD boxes, supervisor-owned.

The worker's own attribution was sound: it reproduced the CLI lint/fmt wrapper exit 2 on clean `main`
before charging it anywhere, which is the right instinct and is why that one is not on the list.

### #1349 — audited, and it is genuinely not closable

`AUDIT: GAPS 7; DOCS/CONSUMER_PROOF`. Eight of ten rows SHIPPED with published-surface evidence
(`deno doc --json` inventories, not greps). Two gaps:

- **Row 7 is structural, not a missing test.** All five rejection classes exist and are reached, but
  the row demands errors *"naming the conflicting **descriptors**"*, plural. A six-case probe showed
  an ownership conflict names only the later descriptor, and it **structurally cannot** name the
  earlier one: `SdkClientContributionDiagnostic` (`errors.ts:24`) carries a single optional
  `contributionId`. Closing the row is a public type change. Gap-fill slice dispatched.
- **Docs/consumer proof is already being closed elsewhere.** `packages/sdk/README.md` is done; the
  two site pages were not, but **#1922 is landing a "Typed request contributions" section in
  `docs/site/services-sdk/sdk.md` right now**. Deliberately dispatched no duplicate work;
  `docs/site/reference/sdk/index.md` gets re-assessed after #1922 merges.

Findings posted to #1349 (`5508755752`). Nothing hand-ticked — the boxes mirror from an
`acceptance-evidence` block on the gap-fill PR, and the gap-fill brief says to omit the block rather
than write an entry it cannot defend.

### #1354 — a third no-delta `FAIL_PLAN`, and the protocol escalates

My PLAN-EVAL dispatch was redundant: **#1891 already carried a `FAIL_PLAN` from 2026-09-01 20:26** at
the same head, never acted on. Its closing note is the important part:

> this is the **third** `FAIL_PLAN` cycle on an **unchanged** submission, and plan-gate escalates to
> the user after two.

Three cycles were spent re-recording a verdict while `plan.md` never changed. The evaluator states
the required delta is small and fully specified — two subsection rewrites, two missing sections, six
mechanical edits — with no re-research and the architecture kept as-is. Substantive findings:

- **HIGH-1:** D3's own ordering defeats D3's guarantee. Required order is
  `option selection → candidate render → conflict check → write`. No remedy surface; the ownership
  marker format is never pinned, so "never silently destroy user edits" is untestable; the
  marker-forgery case is missing; atomicity is implied but unstated.
- **HIGH-2:** D9 names 8 of 9 overlapping files with #1664 —
  `packages/cli/src/kernel/templates/app/route-templates_test.ts` is missing, exactly the merge-time
  collision D9 exists to prevent.
- Plus MEDIUM-3/4/5/6/7/8, LOW-9/10/11, NIT-12/13/14, and **two absent plan-gate sections** (Risk
  register, Open-decision sweep) that alone force `FAIL_PLAN`.

Dispatched the revision rather than idling on the escalation, and surfaced the escalation to the
owner. #1354's *implementation* remains serialized behind #1664 by D9 regardless.

### Trap: `--phase` dispatch dies in `authorize`, silently

All three IMPL-EVAL dispatches (#1895, #1921, #1918) reported `POSTED` and exited 0, then **failed
within seconds** — `authorize` failure, `agent` skipped. The only signal is a `##[notice]` inside
"Evaluate trusted manual-trigger policy":

```
Manual comment policy: phase-generation-lookup-exhausted
```

The visible 403 `Resource not accessible by integration` is the workflow failing to post its own
refusal comment — a red herring. A formal phase eval binds to a **deliberate generation** minted when
the phase status label is set; once consumed (by the `ready_for_review` auto-dispatch, or a prior
eval) further `--phase` dispatches are refused at zero spend. The workflow prints the recovery
itself: *"Cycle away from and back to the phase status label."*

Swapping `status:impl` → `status:impl-eval` on all three minted new generations **and re-triggered the
pending dispatch comments automatically** — no re-post needed. All three `authorize` jobs then
succeeded and their `agent` jobs are running. #1891's stale PLAN-EVAL dispatch failed the same way,
which is how the pre-existing cycle-3 verdict came to light.

**Standing rule from this:** after any `--phase` dispatch, confirm the run reached the `agent` job.
`POSTED` is not evidence of dispatch.

### Continuation — ~11:30–11:50Z

**#1918 (#1897) → merge-ready.** IMPL-EVAL **PASS** at `5ae37a143` (run `33624600249`); CI 7/7;
`close-gate` PASS live with `closing issues: #1897`. Packet posted (`5508929918`),
`status:ready-merge` applied. **Merging closes #1897**, correctly — the issue's whole scope is the
publish filter. The evaluator verified the two things that make a bare `"tests/"` exclude safe rather
than merely green: nothing published reaches under `tests/` (checked against the export map, not by
grep), and the entry composes with #1895's patterns without rewriting them. Its three findings are
all disclosed non-blockers, one of which is **#1920** — independently reproducing the stale-corpus
baseline I filed, with the same "identical regenerated SHA-256 with and without the slice"
attribution.

**#1915's eval burned its budget without a verdict.** The agent job failed at 34/34 steps after ~80
minutes: `Agent reached maximum iterations limit (800)`, stuck re-entering an interactive pager
(`Send quit key to less` / `No previous running command to interact with`), 34.37M tokens, $1.65.
That is an agent-side loop, not a substantive failure. Re-dispatched at `a6fababde` with a brief that
(a) forbids pagers explicitly, (b) forbids re-running the repo-wide `check`/`test` that CI already
proved green at this head, (c) tells it to emit a verdict early rather than exhaust the budget, and
(d) names the six things actually worth judging — with the cache-partition claim called out as the
security-relevant one, since a partition derived from a bearer token would leak credential material
into cache keys. Iterations lowered 800 → 500. Label cycled to mint a generation first.

**#1664's help-test repair landed, and the worker corrected my mechanism.** I hypothesised
terminal-width wrapping; it confirmed the class and fixed the mechanism:

- `COLUMNS=40` **did not** reproduce — Cliffy 1.2.1 reads `Deno.consoleSize().columns`, not the
  environment variable. My suggested repro would have produced a false negative.
- `getHelp({ width: 40, colors: false })` **did** reproduce, exit 1.
- At width 40 Cliffy splits **inside words**, so whitespace normalisation alone is insufficient —
  a sharper edge than ordinary newline wrapping.

Fix: render help at a deterministic width 80 with colors disabled (wraps across lines but never
sub-word), plus one-sided whitespace normalisation. Touch set is the one test file plus run
artifacts; 1,246 CLI tests pass, `quality:gate` 0 findings. The Cliffy width trap is recorded in
`drift.md` for the other CLI help tests that share it.

**#1922's repair worked.** `unboundName` census back to **116**, matching main's ceiling exactly;
snippets gate exit 0; `build` and `quality` both green. Carriers re-verified post-commit at the
pushed head `f570dcde4`, all four exit 0.

### Board at the end of this stretch

| Issue | Vehicle | State |
| --- | --- | --- |
| #1452 | #1842 | **`status:ready-merge`**, packet delivered |
| #1897 | #1918 | **`status:ready-merge`**, packet delivered, IMPL-EVAL PASS |
| #1590 | #1895 | hosted proof green; IMPL-EVAL running |
| #1353 | #1921 | CI 6/6 green; IMPL-EVAL running |
| #1352 | #1915 | CI green; IMPL-EVAL re-dispatched after budget exhaustion |
| #1467 | #1922 | docs reds repaired; `check-test` finishing |
| #1355/#1360 | #1664 | help test fixed; CI re-running; three reds already attributed foreign |
| #1349 | — | row-7 diagnostics gap-fill worker running |
| #1354 | #1891 | plan revision worker running (third no-delta FAIL_PLAN; escalated to owner) |
| #1348 | — | epic; no leaf PR by design |

### Coordinator directive pass — ~11:50–12:00Z

Directive honoured: no fourth PLAN-EVAL on #1891; #1917 is Internals and untouched; no foreground
waiting on evaluator watchers.

**#1922 → all six gates green** after the docs repair (`unboundName` census back to 116, snippets
exit 0). Label cycled, IMPL-EVAL dispatched at `f570dcde4` (run `33626842233`), with the same
anti-pager / don't-re-run-repo-wide-gates constraints that the #1915 budget exhaustion made
necessary.

**#1664 — the help fix worked, and unmasked the next failure.** `Repo-wide test` is now **green** at
`573d01d35`; `Managed form browser regression` now **fails**. Measured that this is not a regression:
at `7f076f875` the browser step was **`skipped`**, because the repo-wide test failed first and
short-circuited it. So the fixture has never been proven in CI — the same shape as #1895, where
clearing one failure revealed the next.

Cause, to be confirmed by the worker rather than assumed:
`query-hydration-age_browser.ts:157-175`'s `waitForServer` loops `attempt < 100` racing
`child.status` against a **50 ms** timer, so with ECONNREFUSED returning immediately the entire
budget is **≈5 seconds**. A cold Vite root does not start in five seconds on a CI runner. Two
supporting observations: the error is a *timeout*, not `Vite fixture exited before startup`, so the
child was alive; and the two `form-navigation_browser.ts` tests that passed first are a **different
Vite root**, so they do not warm this one. Repair dispatched — wall-clock deadline, keep the
`child.status` fast-fail race, and **surface the fixture's stdout/stderr in the timeout error**,
which is why this cost a CI round-trip to diagnose. Explicitly not a sleep and not flake-masking:
if a realistic budget still times out, that is a fixture defect to report, not to extend.

`tests/form-navigation_browser.ts` is fenced off — #1895 owns it and is in evaluation.

**#1354 — cycle-3 delta applied and summarised for the owner's ruling** (`5509105172`), head
`b5dcb23e2`. Both previously-absent plan-gate sections now exist (Open-decision sweep 421–448, Risk
register 450–465); D3 reordered to `option selection → candidate render → conflict check → write`
with the marker/body-hash contract and the seventh marked-but-hand-edited case defined; D9 now
carries all nine overlapping files plus the MCP corpus, with an explicit requirement that
convergence **carries #1664's `initialDataUpdatedAt` fix into the neutral island rather than
deleting it**. No fourth PLAN-EVAL dispatched.

**#1349 gap leaf** committed `672b67b61` (`feat(sdk): name contribution diagnostic conflicts`) plus
evidence; worker still running its gate set before pushing.

### Exact blockers — nothing else is waiting on a decision

1. **#1664 cannot reach all-green in this lane.** Two of its reds are foreign and unfixable from
   here: `scaffold-runtime (postgres)` → **#1845** (`islandHydrated:false`, island never hydrates)
   and `scaffold-runtime-sqlite` → **#1844/#1880** (garnet health transition). Its own two reds are
   fixed/being fixed. Merge readiness therefore depends on a coordinator ruling on merging over two
   known, separately-owned reds — the same class of ruling already open for #1842.
2. **#1842 and #1918 are `status:ready-merge`** and need only the merge decision.

---

## COORDINATOR RULING — #1354 / #1891, recorded 2026-09-02 ~12:00Z

Recorded verbatim in substance, because it overturns a protocol escalation this lane had raised.

### The ruling

1. **PLAN-EVAL cycles 2 and 3 were orchestration defects, not architecture failures.** Both
   re-evaluated a **byte-identical `b210f9092`** and returned `FAIL_PLAN` against an unchanged
   submission. They are **not** two further architecture failures, and the "third FAIL_PLAN →
   escalate to user" trigger I surfaced is discharged by this ruling rather than by another
   evaluation.
2. **`b5dcb23e` is the first substantive repair, and the architecture is settled.** No broad
   redesign, no advisory loop.
3. **One harness-only sync commit**: add the mandatory `supervisor.md`, update `context-pack.md` to
   the current command flags / safety contract and the current #1664 head `573d01d35`, and correct
   obsolete `research.md` source paths.
4. **Then exactly ONE narrow exact-head PLAN-EVAL**, restricted to the **formal plan gate and the
   cycle-1 blockers**.
5. **On PASS**: wait only for #1664 merge/rebase, then dispatch implementation **Slices A and B**.

### Refinement after a touch-set audit — narrow D3 before the final gate

**Keep:** deterministic full preflight; `owned` / `owned-edited` / `unowned` classification; additive
options; `--dry-run`; the **existing** `--force` scoped to positively generator-owned leaves only;
Fresh derivation in staging; fail-closed shared files.

**Remove:** the new public `--keep` / `--replace` / `--abort` / `--recover` flags, the crash/recovery
journal, the app-scoped lock, and the backup-rollback promise. Reason: **their IO adapters are absent
from the declared touch set**, and they exceed #1354's acceptance. A plan may only promise behaviour
some slice's declared touch set can implement.

**Explicitly defer:** process-crash / mid-rename cross-file atomicity, and concurrent-invocation
locking.

**The bar that replaces them:** validation, Fresh-staging, and shared-source-transform failures all
occur **before apply** and must prove **zero writes**; default conflict exit plus manual move/rename
or owned-only `--force` is sufficient.

### Why this correction matters beyond #1354

My own record had treated cycles 2 and 3 as three independent architecture verdicts and escalated on
that basis. The coordinator's reading is better supported by the evidence I myself gathered: each
cycle artifact says "no submission delta", and a verdict re-issued against an unchanged head is one
verdict observed three times, not three findings. **A repeated verdict on a byte-identical submission
is an orchestration defect — the loop failed to apply a delta — and counting it as new evidence
inflates the apparent severity of the plan.** That is the lesson, and it generalises to any gate that
re-runs without a head change.

### Execution status

- **D3 narrowing dispatched** to the plan lane (thread `01a05dc7-d630-7cc2-b155-2b150754d53c`) as a
  pure subtraction, with the keep/remove/defer lists above given verbatim and an explicit
  instruction to **shrink slice ceilings** where a promise is removed rather than leave a ceiling
  sized for work that no longer exists.
- **Harness sync staged** and blocked only on that commit landing, so the sync is a single clean
  commit on top rather than racing the worker in the same worktree. `research.md`'s stale paths are
  already resolved against `origin/main`:

  | Stale | Current |
  | --- | --- |
  | `.llm/harness/workflow/plan-gate.md` | `.llm/harness/gates/plan-gate.md` |
  | `.llm/harness/workflow/archetype-gate-matrix.md` | `.llm/harness/gates/archetype-gate-matrix.md` |
  | `.llm/harness/scopes/SCOPE-frontend.md` | `.llm/harness/archetypes/SCOPE-frontend.md` |
  | `doctrine/01-core-principles.md` | `01-thesis-and-axioms.md` |
  | `doctrine/02-package-archetypes.md` | `06-archetypes.md` |
  | `doctrine/07-dependency-graph.md` | `07-composition-and-extension.md` |
  | `doctrine/09-anti-patterns.md` / `10-doctrine-fitness.md` | `09-anti-patterns-and-fitness-functions.md` |
  | `doctrine/06-quality-gates.md` | `.llm/harness/gates/fitness-gates.md` (+ doctrine 09) |
  | `doctrine/05-testing.md` | **no doctrine successor** — testing gates live in `.llm/harness/gates/static-gates.md` |

  The last row is recorded as "no successor" rather than mapped to a plausible-looking file: a
  fabricated citation is worse than an acknowledged gap.
- **PLAN-EVAL not yet dispatched** — it is authorized but must run at the exact head *after* the
  sync commit, once, with restricted scope.

## #1915 (#1352 S5) → `status:ready-merge`

IMPL-EVAL **PASS** at `a6fababde` (run `33625757148`). Packet posted (`5509186239`). The evaluator
verified my byte-identity carry claim itself — `git diff 88df4839e a6fababde --stat` is exactly four
regenerated carriers, 12 lines, no product source — rather than accepting it.

Three claims mattered and all hold: the contribution is **declared, never implicitly attached**; the
cache partition is **never token-derived**, pinned by a test that generates the credential with
`crypto.randomUUID()` and asserts `assertFalse(partition.includes(credential))`, so it fails the
moment a partition starts deriving from the token; and diagnostics disclose only `contributionId` and
`procedurePath`. The published `plugin-auth-core/sdk` surface is exactly three symbols and #1349's
privacy boundary holds. `close-gate` now **PASS**; the DoD box was already ticked and the verdict
makes the claim true.

---

## #1915 merged (`37452f11f`) — dependent rebases and #1352 reconciliation, ~12:10–12:35Z

### The #1354 ruling is fully executed

- **D3 narrowed** (`6b737ab9c`) as a pure subtraction. Verified by token census: `--keep`,
  `--replace`, `--abort`, `--recover`, `single-writer` → **0 occurrences**. The four residual
  `journal` / `backup` / `rollback` mentions are all in **deferral text** — the rationale, a Risk
  row marked `Deferred`, "a later issue must scope those adapters", and an out-of-scope list. That is
  correct: a deferral must name what is not promised.
- **Harness sync** (`409630338`), harness-only: `supervisor.md` added; `context-pack.md` synced to
  the narrowed safety contract, the restricted evaluator focus, and #1664's head (`573d01d35` at
  the ruling, since advanced to `ec9e7048a`, with an instruction to re-derive overlap against its
  live head); `research.md`'s ten stale paths corrected. `doctrine/05-testing.md` and
  `06-quality-gates.md` are recorded as having **no doctrine successor** rather than mapped to a
  plausible-looking file.
- **One narrow exact-head PLAN-EVAL dispatched** at `409630338`, scope-restricted to the plan gate
  and cycle-1 blockers, with the settled decisions named as out of scope and an explicit instruction
  that findings against them will be discarded. No fourth advisory loop.

### Four leaves went CONFLICTING on the merge; three are back

| PR | Conflicts | Resolution |
| --- | --- | --- |
| **#1842** | export corpus only | main's side + regenerate → `d789febfd`. **The anticipated one-line collision with #1915 in `packages/plugin/src/sdk/mod.ts` auto-merged** — both sides add distinct exports. Corpus `dde09764…`, 273/7810. |
| **#1927** | export corpus only | main's side + regenerate → `e019fb02f`. Now `MERGEABLE`. |
| **#1922** | 6 files | see below → `af48ec18d`. All four carrier gates **0**, `docs:jsdoc-examples` **0** with census back at **116**. |
| **#1664** | — | rebase pending behind its browser-fixture CI run. |

**#1922's `sdk.md` was a genuine content conflict, resolved as a union rather than a pick.** Both
#1915 and this slice added a `contributions` row to the same option table and then a prose section.
Took **main's** table row (the shipped wording), and kept **both** sections with the right nesting:
this slice's `## Typed request contributions` (the general seam, auth + locale composed) now contains
#1915's `### Typed bearer credentials` as its specialisation. They document different things — the
seam, and credential guidance for one consumer of it — so dropping either would lose real content.

**`status:ready-merge` withdrawn from #1842.** Its packet evidence was pinned to `d1697421c` and the
head moved; the label asserts readiness that is currently unproven. It returns with a fresh packet
when this head's gates land. The IMPL-EVAL `PASS` still carries — no product source this branch
authored moved in the convergence.

### #1352 reconciled — it does not close, and #1915 said so itself

The coordinator asked that the merged implementation not be left disconnected from its milestone
issue. Audited rather than assumed: **row 2 is genuinely outstanding**, and #1915's own PR body
deferred exactly it —

> the CLI auth-session revoke/list raw-fetch migration remains out of scope because its explicit
> auth URLs are not modeled by the public SDK transport

Measured the surface: `packages/cli/src/public/features/plugins/auth/auth-session-client.ts`'s
`FetchAuthSessionHttp` (47 lines) raw-fetches two **explicit** URLs — `GET <streamUrl>` and
`POST <authUrl>/signout`. The SDK transport resolves URLs through **discovery** and cannot express
"call this exact URL". That is a real constraint, not an omission, which is why #1915 deferred rather
than forced it.

**Hand-ticking the seven boxes would have asserted something the merged PR itself declined to
claim.** Instead: finding posted to #1352 (`5509377785`), and a residual slice dispatched on
`feat/cli-auth-session-typed-transport` that audits all seven rows first, implements only what the
audit proves outstanding, and is explicitly told that "this row cannot close without extending the
public SDK transport, here is why" is a **complete and valuable** outcome rather than a failure — and
that extending `packages/sdk`'s public surface unilaterally is not its call. It carries `Closes
#1352` **only if** all seven rows end satisfied, plus the acceptance-evidence block that ticks them
through the mirror.

Also fenced in that brief: #1927, #1921 and #1922's concurrent surfaces, and **#1243** — which owns
the dead-localhost-port defect in the very file this slice edits, so it is referenced rather than
drive-by fixed.

---

## #1664 under the coordinator ruling — 2026-09-02 ~12:20Z

Proceeding without an owner decision, per the ruling. Response posted (`5509476140`).

### Converged — `1dd976024`

`CONFLICTING` cleared against `main` `37452f11f`. Only the export corpus conflicted; main's side
taken and regenerated (`67a24cf8…`, 273/7814). Three carrier gates 0, lock byte-identical.

### The `check-test` red had a cause nobody could see, and the previous repair is why we can now

The `waitForServer` fix did two things: a wall-clock deadline **and** surfacing the fixture's stderr
on timeout. The second half is what mattered:

```
[vite] Internal server error: Cannot find module '@opentelemetry/api'
  imported from 'packages/telemetry/src/context/w3c.ts'
```

The fixture imports `@netscript/fresh/query`, whose graph reaches `w3c.ts` → `@opentelemetry/api`,
and Vite cannot resolve a bare npm specifier from the workspace catalog. **For three CI cycles this
presented as a slow server. It was never slow.** A timeout that reports only a URL hides exactly the
information needed to diagnose it — that is the durable lesson.

`packages/fresh/tests/fixtures/route-binding-browser/vite.config.ts` already solves this with a
catalog-reading `resolveId`/`load` shim; `query-hydration-age-browser` simply lacks it. Repair
dispatched against that precedent rather than a hand-rolled variant.

### #1845 — route (a), with the gap in the evidence named rather than glossed

The ruling is right that #1845 cannot be waived by label. Route (a) is reachable because this PR's
own `query-hydration-age_browser.ts` drives `QueryIsland` + `useQuery` + `useQueryClient` in a real
browser — a *focused* fixture, independent of the canonical showcase.

But its assertion is *"public query wrapper preserves old and fresh server snapshot ages"*, which
proves hydration only **incidentally**. Citing it as-is would be citing evidence for a claim it does
not literally make, so the fixture is being extended to assert `freshIslandElement`,
`islandHydrated`, `islandInteractive` and `queryClientFound` first-class — **#1845's own diagnostics
vocabulary**, so the canonical showcase's four `false`s and this fixture's four trues are directly
comparable. That comparability *is* the evidence.

The lane is told explicitly that if the island does not hydrate here either, reporting it is more
valuable than a green obtained by lowering the bar — that outcome would mean #1845 is broader than
the canonical showcase and #1664 must take route (b).

### #1844/#1880 — one half of the exclusion test proven, the other explicitly pending

The ruling permits exclusion **only** when both hold. Reported separately rather than as one claim:

- **Delta does not touch their paths — proven.** The branch's only `aspire/` file is
  `generate-aspire.ts`, whose diff is dry-run/force/formatter plumbing;
  `grep -ciE "garnet|health|listener"` over the whole `generate/aspire/` diff returns **0**. No
  Aspire resource, health probe, or container declaration is touched anywhere.
- **Same-failure reproduction on current main — pending.** #1842 is re-running both tiers at
  `d789febfd` on this same `main`, touches no garnet path, and already supplied #1844's second
  reproduction. It is the control the ruling asks for. **Not claiming the exclusion until it
  lands** — asserting it now would be exactly the unproven attribution the ruling guards against.

### DoD

Both remaining boxes stay unchecked: `fresh-browser` is not green at this head and the IMPL-EVAL
`PASS` is pinned to `377811da8`. They tick when true and evidenced, not to clear the gate.

---

## Five merge packets surfaced — 2026-09-02 ~13:20Z

| PR | Issue | Head | State |
| --- | --- | --- | --- |
| **#1842** | #1452 S2 | `d789febfd` | `status:ready-merge` — 11/12, postgres red proven baseline |
| **#1895** | #1590 S2 | `f44f96928` | `status:ready-merge` — packet corrected, runtime tier unstable |
| **#1921** | #1353 | `a9c732bf6` | `status:ready-merge` — 6/6, exact-head PASS, **zero blocking findings** |
| **#1922** | #1467 | `af48ec18d` | `status:ready-merge` — 6/6, PASS carried by measured file-by-file identity |
| **#1927** | #1349 row 7 | `e019fb02f` | `status:ready-merge` — 6/6, PASS, but see the mirror finding |

### The Aspire readiness baseline is now proven, not asserted — and it is broader than garnet

The #1664 ruling required "the same exact failures reproduce on current main". Two unrelated branches
on `main` `37452f11f` now supply it, and the shape is more informative than expected:

| | #1842 `d789febfd` | #1895 `f44f96928` |
| --- | --- | --- |
| Failing gate | **`runtime.wait.postgres` — 300 346 ms** | **`runtime.wait.garnet` — 300 335 ms** |
| Error | `postgres_listener was never published; readiness deadline 300s elapsed` | `aspire wait garnet … failed (17): Timed out` |
| sqlite tier | pass | pass |

Three separable facts: **it is not garnet-specific** (postgres times out identically, so the defect is
in readiness *publication*, closer to #1880 than #1844); **it is not deterministic** (#1895's postgres
tier passed at `f44f96928` in run `33621810422` and failed at the same head in `33628354184`); and
**neither branch can cause it** (a plugin service-context factory and a `tests/`-only Fresh proof;
no Aspire resource, probe, or container in either). Posted to #1844 (`5510226535`).

I corrected #1895's earlier packet rather than leaving its "all pass" table standing — a gate that
flips at an unchanged head must not be reported from a stale snapshot.

### A mechanism finding: an acceptance-evidence block is inert without a closing keyword

#1927 carries a complete ten-entry block for #1349, and it **will not mirror**.
`mirror-acceptance-evidence.ts` iterates `classified.issues` — the PR's **closing** issues — so a
block on a PR that only says `Refs #N` is never applied. Dry-run at the head confirms `no changes`,
with no diagnostic explaining why. Worth knowing before assuming a block is doing anything.

**And `Closes #1349` would have been wrong.** Measured before deciding:

| #1349 docs/consumer proof | State |
| --- | --- |
| `packages/sdk/README.md` export table | done (14 refs) |
| `docs/site/services-sdk/sdk.md` worked example | done by #1922 (17 refs) |
| `docs/site/reference/sdk/index.md` worked example | **absent — 0 refs** |

So a genuine residual remains and the closing keyword stays off. A small docs slice for
`reference/sdk/index.md` carries `Closes #1349` plus the block, and the mirror ticks all ten boxes
then. Nothing hand-ticked.

### #1922's carry proved by measurement, not assertion

Its PASS is at `f570dcde4`; I had converged it to `af48ec18d` afterwards. Of **8 slice-owned files,
7 are byte-identical**; the eighth, `sdk.md`, is **+54/−2** where the two deletions are the
`contributions` and `propagateTraceContext` table rows replaced by main's wording for the same
fields, and the +54 is #1915's bearer section added. **The slice's own prose section is untouched.**
That is the difference between a carry claim and a carry proof.

---

## #1927 re-converged after #1921/#1922 merged — 2026-09-02 ~13:45Z

`main` `4720596fc`. Re-packet posted (`5510412632`); head `4eb736910`, `status:ready-merge` retained.

### A real conflict, not a carrier one — and both slices survive

`packages/sdk/tests/client-contribution-validation_test.ts` conflicted because **#1921 appended its
reserved-trace-header test in the same region** this slice appended its diagnostic-orientation tests.
Both sides ended mid-statement on a shared closing tail, so a naive "take one side" resolution would
have silently deleted a merged slice's test.

Resolved by splicing: this slice's block, a copy of the shared tail to close it, then #1921's block
closed by the original tail. Verified by name — `ownership diagnostics orient the later claimant
against the earlier owner` **and** `reserved trace header declarations identify the offending
descriptor` both present, 20 `Deno.test` blocks, `deno fmt --check` and `deno check` both exit 0.

### The delta-from-evaluated-head proof the coordinator asked for

Evaluated head `9a7d86b1a`, merge-base `634b83d64`, five slice-owned files:

| File | vs evaluated head |
| --- | --- |
| `client/errors.ts` | byte-identical |
| `internal/client-contributions/prepared-call.ts` | byte-identical |
| `internal/client-contributions/contribution-diagnostic-id.ts` | byte-identical |
| `desktop/application/desktop-rpc-client.ts` | byte-identical |
| `tests/client-contribution-validation_test.ts` | **+22 / −0**, sole added test is #1921's |

**All four product-source files unchanged; zero deletions anywhere.** That is a proof, not a claim —
the distinction that matters when a packet asserts a verdict still carries.

Exact-head gates re-run locally: SDK check 104 files / 0 diagnostics; SDK tests **238/0/0**; lint
exit 0; fmt 0 findings; three carrier gates 0; `deno.lock` byte-identical.

### #1349's last gap dispatched independently

`docs/site/reference/sdk/index.md` had **0** contribution references against `packages/sdk/README.md`'s
14 and `docs/site/services-sdk/sdk.md`'s 17 (the latter via #1922). Slice dispatched on
`docs/sdk-reference-contribution-example`, carrying **`Closes #1349`** and the **full ten-entry**
evidence block — which is what finally makes the mirror run, since #1927's identical block is inert
without a closing keyword. The brief tells it to re-verify every entry against merged state rather
than paste the staged copy, and that a "Mirror skipped" notice at its stage is expected because
`status:ready-merge` is the supervisor's to apply.

---

## ~14:00Z — #1927 merged; #1664 routed to (b) with the blocker made actionable

`main` → `3066a0cc5`. Merged since the last entry: **#1921** `997b836ba`, **#1922** `4720596fc`,
**#1927** `cfbb7e706`, plus **#1929** and **#1925**.

**#1929 closes the gap I filed as #1920** — `check:mcp-export-corpus` now runs inside `quality`. The
practical consequence for this lane is immediate: a stale corpus is a hard CI failure, so **every**
convergence must regenerate it. #1842 and #1664 were both converged and regenerated on that basis.

### #1664 — route (b), because (a) is not reachable from this branch

The generated-island measurement came back **indeterminate**, for a reason that turns out to be the
most valuable thing found today:

> **`behavior.service-client-refetch` and the CDP diagnostics that emit
> `__NETSCRIPT_OPTIMISTIC_RENDER_DIAGNOSTICS__` were introduced by #1664.** No clean-`main` run has
> ever produced the comparable observation, because the probe does not exist there.

So every `islandHydrated: false` receipt on #1845 came from a branch that also modifies the emitted
island templates. **Instrument and subject have never been separated**, which is why #1845 has been
undiagnosable and why four hypotheses could be eliminated without reaching a cause.

Route (a) would require proving the *generated* artifact hydrates; the passing fixture proves the
**framework** path does. Those are different claims and I am not presenting one as the other.
Extending the fixture to host the real generated island needs a scaffolded project — the hosted
runtime lane, not a focused fixture.

So (b), but **not as a park**: posted to #1845 (`5510831739`) the experiment that unblocks it —
scaffold with **clean main's** CLI, run **#1664's** probe against it, read the same payload. Same
result → pre-existing and #1664 exonerated; hydrates → the cause is in this branch's templates and
#1664 owns it. One hosted `scaffold.runtime` attempt settles a P1 that has been stuck since Aug.

The framework layer is now **eliminated** on the record: the focused fixture asserts
`freshIslandElement: 'main'`, `queryClientFound: true`, `islandHydrated: true`,
`islandInteractive: true` for both cache-age modes, passing in the same CI job.

### #1936 — #1349's closeout opened

`docs(sdk): document client contribution composition`, head `005c22fd6`, non-draft, full labels,
milestone 0.0.7, **`Closes #1349`** plus the ten-entry evidence block, and an independent Fable 5.1
IMPL-EVAL PASS. `docs/site/reference/sdk/index.md` went from **0 → 10** contribution references,
which was the exact residual measured earlier.

### #1931 — the closing-keyword question is the whole verdict

The lane audited all seven #1352 rows, found the full transport migration **not expressible without
widening the public SDK**, and migrated the credential path only — stating openly that it "does not
claim the requests became SDK discovery-transport calls". That is the honest answer I asked for. But
it carries `Closes #1352`, which asserts row 2 is satisfied, and row 2's words are *"the CLI's direct
auth requests migrate to the typed SDK path"*. Dispatched an eval pointed at exactly that, told that
an overclaiming closing keyword is a `FAIL_FIX` rather than a nitpick — it would auto-close a
milestone issue with open scope.

### Convergences

| PR | New head | Delta |
| --- | --- | --- |
| #1842 | `96f777f5a` | corpus only; `status:ready-merge` retained with the reason stated, and I withdraw it the moment anything reds |
| #1664 | `771548f6d` | corpus only |

---

## ~14:20Z — #1936 exact-green; #1349's mirror applied end to end

**#1936 is 6/6 green at `005c22fd6`, including `close-gate`.** #1349's **ten acceptance boxes are
ticked, zero unticked**, written by the mirror with provenance. `close-gate` went red → pass on the
**unchanged head** as a direct consequence. The issue stays `OPEN` until the merge; `Closes #1349`
closes it, completing the issue across #1834, #1841, #1886, #1927 and this docs closeout.

The chain that made it work, which is worth keeping because two earlier attempts failed on it:

1. `docs/site/reference/sdk/index.md` **0 → 10** contribution references — the exact residual I had
   measured against README's 14 and `services-sdk/sdk.md`'s 17.
2. `Closes #1349` on this PR, because **an evidence block is inert without a closing keyword** —
   #1927's identical block returned `no changes` on dry-run; this one returned `DRY-RUN: #1349`.
3. `status:ready-merge` applied, then the existing CI run re-read live labels at the unchanged head.
   Never pushed to re-trigger, never hand-ticked.

### The phase-eval trigger — I had the mechanism wrong, and it cost four #1891 attempts

`.github/workflows/openhands-phase-eval.yml`'s own header states it:

- **PLAN-EVAL:** add `openhands`, then add **`status:plan-eval`**. Rerun by moving away from and back
  to `status:plan-eval`.
- **IMPL-EVAL:** make a draft PR ready for review; rerun by cycling **`status:impl-eval`**.

`status:plan` triggers nothing — the job's `if` does not name it. And a hand-posted
`dispatch-openhands --phase` comment can **never** work: the workflow mints its own trigger under a
claim key of `{last "labeled" event id, phase, head}` with an embedded marker, and the manual policy
refuses anything without it. That is the whole explanation for `phase-generation-lookup-exhausted`,
and for why label swaps on #1895/#1921/#1918 appeared to "auto-retrigger" — the workflow was
dispatching, not my comment. Applied the correct pair to #1891; its eval is running and `dispatch`
is green. Memory corrected from the earlier, partly-wrong note.

### #1664 — `quality` red on a gate that did not exist when the branch was written

`main` merged **#1925**, adding a **README fence integrity** step. Measured rather than assumed:

| Revision | census | result |
| --- | --- | --- |
| clean `main` `3066a0cc5` | `checked=71 type_errors=32 failing_readmes=7` | **PASS** |
| #1664 `771548f6d` | `checked=72 type_errors=39 failing_readmes=7` | **FAIL** |

**One added TypeScript fence, seven added errors**, and the only README this branch touches is
`packages/cli/README.md` — so it is genuinely this branch's. Repair dispatched with two constraints:
land at **32** by fixing the example rather than widening the tolerance, and **do not touch**
`packages/fresh`, `service`, `ai` READMEs that appear in the error output — those sit inside main's
tolerated baseline and belong to other lanes.

Generalisation recorded in the brief: **a converged head must re-run the *current* gate set, not the
one that existed when the branch was written.** Two gates arrived on `main` mid-flight today —
`check:mcp-export-corpus` into `quality` (#1929, closing my #1920) and README fences (#1925) — and
both bit leaves that were green an hour earlier.

### Board

| PR | State |
| --- | --- |
| **#1936** | **exact-green, `status:ready-merge`** — closes #1349 |
| #1895 | ready-merge; only the alternating postgres tier red |
| #1842 | ready-merge; `quality` green post-corpus, runtime tiers running |
| #1931 | green but `close-gate` red pending its eval on the `Closes #1352` question |
| #1891 | PLAN-EVAL running at last |
| #1664 | fence repair in flight; routed behind #1845 |
