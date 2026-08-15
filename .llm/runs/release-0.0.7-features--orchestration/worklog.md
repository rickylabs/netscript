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
