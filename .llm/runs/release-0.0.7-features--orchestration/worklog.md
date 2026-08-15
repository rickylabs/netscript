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
