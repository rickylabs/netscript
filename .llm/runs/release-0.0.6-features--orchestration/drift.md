# Drift — 0.0.6 runtime / public-surface lane

Append-only. Severity: `minor` | `significant` | `architectural`.

## D-1 — research/plan sub-agent lane overridden to Opus (minor)

**Date** 2026-08-12. **Canonical route** `deep_analysis` = Claude · Fable 5 · medium. **Used**
Claude · Opus 5 medium/high. **Reason** the owner brief for this lane explicitly directs
"Delegate plan/research to Claude Opus medium/high sub-agents when useful". Owner instruction is
more specific than the default lane binding. Invariants preserved: generator ≠ evaluator, no lane
self-certifies, no paid escalation. Fable 5 · low remains the `review_codex` reviewer for the
#1398 slice, so opposite-family review of Codex work is untouched.

## D-2 — evaluator transport falls back to local fresh sessions (minor)

**Date** 2026-08-12. The brief routes PLAN-EVAL/IMPL-EVAL through OpenHands *after #1524
passes/lands*. Observed: PR #1524 is **OPEN**, `mergedAt: null`, with unticked DoD boxes for the
bounded live DeepSeek smoke and the repository default variable. Per the brief's own condition, this
run uses fresh local Claude/OpenCode OpenRouter evaluator sessions through the toolchain. Re-checked
before each dispatch; state recorded at the point of use.

## D-3 — IMPL-EVAL not required for small deterministic taxonomy fixes (significant)

**Date** 2026-08-12. **Owner ruling.** For the #1405 class — small, deterministic, fully specified
fixes with exact negative tests — a separate formal IMPL-EVAL is **not** to be dispatched. The
sufficient evidence set is: focused negative tests, CI, close-gate, and the orchestrator's own
independent diff review.

**My error.** The lane brief said an IMPL-EVAL owner waiver was "acceptable" for #1405 with exact
negative tests. I read that as a fallback to use only if the evaluator transport was blocked, and
recorded that reading in `supervisor.md`. The owner's intent was that the waiver is the **default**
for this class. One evaluator dispatch (DeepSeek V4 Flash 0731 max, 642,836 ms) was spent that should
not have been.

**Timing, stated plainly.** The ruling arrived after #1405 had already been evaluated **and merged**
(`8ff1bcb8f`, 2026-08-12T08:20:29Z). It therefore does not retract that merge or its evidence — the
IMPL-EVAL returned PASS and its per-fix revert isolation is real evidence that remains in the record.
The ruling governs this class going forward.

**Not weakened for #1398.** Formal PLAN-EVAL and IMPL-EVAL remain **mandatory** for #1398: it changes
public runtime behaviour, publishes a new record to a durable stream, and requires live evidence.
Its PLAN-EVAL has already run (PASS, MiniMax M3) and its IMPL-EVAL is still required before merge.

**Cleanup.** The detached #1405 evaluator worktree `/home/codex/repos/ns006-1405-impleval` was
verified clean (empty `git status --porcelain`) and removed. The #1398 PLAN-EVAL worktree
`/home/codex/repos/ns006-1398-planeval` is retained pending that issue's IMPL-EVAL. Pre-existing
global stashes belonging to other lanes' branches were left untouched.

## D-4 — phase evaluation moves to the automatic status dispatcher (significant)

**Date** 2026-08-12. **Owner ruling.** PR #1524 (automatic phase dispatcher) is about to merge. Once
it lands, **all future phase evaluations use the automatic status workflow** unless the owner selects
a documented local route or an explicit skip. Manual IMPL-EVAL launches and manual
`@openhands-agent` PR comments are not to be used for #1536.

**Standing instruction for #1536:** keep it on its **current head and status** — head `e4319c685`,
`status:impl-eval`, milestone `0.0.6`. Root will **deliberately re-enter** `status:impl-eval` with
the Qwen override *after* #1524 lands, which is what triggers the automatic dispatcher. This
orchestrator must not re-enter the label for the same head, must not trigger OpenHands, and must not
launch a local evaluator. Its remaining job is to **watch the automatic verdict and then finish the
merge gate**.

**Timing, recorded factually.** The steer anticipated that a local #1536 evaluator had already been
launched. It had **not**. For #1398 I wrote the evaluator prompt
(`slices/impl-eval-1398-prompt.md`, 10:57) and pre-created the detached worktree
`/home/codex/repos/ns006-1398-impleval` at `e4319c685`, then **stopped and raised the decision**
rather than dispatching. Verified at the time of this entry: no `openrouter-run`/`claude-openrouter`
process, and no `impl-eval-1398-raw.md` output file — only the prompt. **No duplicate spend occurred
and none was in flight.**

The two evaluator sessions this run did spend are unaffected and both completed before this ruling:
PLAN-EVAL #1398 (MiniMax M3, PASS) and IMPL-EVAL #1405 (DeepSeek V4 Flash 0731, PASS — itself the
subject of D-3).

**Unused artifacts retained, not removed:** `slices/impl-eval-1398-prompt.md` and the
`ns006-1398-impleval` worktree are left in place, clean and unused, in case the owner later selects
the documented local route. They are inert; nothing reads them.

**Interaction with D-3.** D-3 waives formal evaluation for the small deterministic class. D-4 does
not widen that waiver — #1398 still gets a formal IMPL-EVAL; it now arrives through the automatic
dispatcher rather than a manual launch.

## D-5 — automation trigger contract for formal evaluation (significant)

**Date** 2026-08-12. **Owner policy.** Formal PLAN/IMPL evaluation is triggered by labels, never by a
manual OpenHands dispatch:

| Phase | Initial trigger | Rerun |
| --- | --- | --- |
| PLAN-EVAL | the `openhands` + `status:plan-eval` label **pair**, exactly once | move away from `status:plan-eval`, then re-add |
| IMPL-EVAL | automatically on **draft → ready**, unless `impl-eval:skip` | move away from `status:impl-eval`, then re-add |

`eval:model:minimax|deepseek|qwen` is an optional **one-shot** override. A local eval already running
may finish, but must never be duplicated. Manual `@openhands-agent` dispatch for formal PLAN/IMPL
eval is prohibited. Merge continues to go through normal harness authority.

**This lane complies with no change required:** no manual OpenHands dispatch was made for #1536 (or
for anything else this run), and no local evaluator was launched for #1536 — the prompt and worktree
were prepared and the dispatch deliberately withheld (D-4). The two local evaluator sessions this run
did spend — PLAN-EVAL #1398 (MiniMax M3) and IMPL-EVAL #1405 (DeepSeek) — both **completed** well
before this policy and are not duplicated.

### Timing finding: #1536's automatic IMPL-EVAL could not have fired

Measured from the issue timeline rather than assumed:

| Event | UTC |
| --- | --- |
| #1536 `ready_for_review` | **2026-08-12T08:53:43Z** |
| #1536 `status:impl` removed, `status:impl-eval` applied | 2026-08-12T08:53:45Z |
| #1524 (the dispatcher) merged | **2026-08-12T09:24:15Z** |

Both candidate triggers precede the dispatcher's existence by ~30½ minutes. The draft → ready
transition therefore had nothing to fire, and the initial automatic IMPL-EVAL for #1536 **did not
run and will not run on its own**.

Under this policy the rerun path is the only one left: move #1536 away from `status:impl-eval`, then
re-add it. That matches what root already stated it would do with the Qwen override, so the
conclusion is unchanged — but it is now a **requirement** rather than a preference, and a watcher
waiting for a spontaneous verdict would wait forever. Recorded so that is visible rather than
discovered by timeout.

**Not actioned by this lane.** The label re-entry is root's, per D-4. This orchestrator has not
touched #1536's head, labels, or body.

## D-6 — Fable 5 fully prohibited for this lane (significant)

**Date** 2026-08-12. **Owner policy:** Fable is prohibited for this 0.0.6 lane — planning, research,
implementation, review, and evaluation alike — until explicitly lifted (95% quota consumed, through
Saturday). Approved routes continue: Opus, Codex, OpenHands, and the automatic evaluator workflow. If
a configured route would select Fable, the dispatch stops and is reported.

### Audit: zero Fable usage has occurred in this lane

Checked rather than assumed:

| Work | Route actually used | Fable? |
| --- | --- | --- |
| Research #1405, #1398, #1459, #1548 | Claude · Opus 5 (D-1 owner override) | no |
| Tier-A slice reviews, all five slices | Claude · Opus 5 · high — this orchestrator session | no |
| PLAN-EVAL #1398, #1459 | MiniMax M3 | no |
| IMPL-EVAL #1405 | DeepSeek V4 Flash 0731 | no |
| IMPL-EVAL #1398, #1457, #1548 | Qwen 3.8 Max via the automatic dispatcher | no |
| Implementation, all slices | Codex GPT-5.6 Sol (low/medium/high) | no |

No Fable process or session is running. **Nothing needs to be stopped or unwound.**

### One configured route would have selected Fable — stopped and reported

`lane-policy.md:32,84` binds **`review_codex_complex` → Claude · Fable 5 · medium** as the adversarial
review paired to a `complex_implementation` (Sol · high) slice. **#1459 is exactly that case** — it is
in flight right now on Sol high (thread `019ff5e6-812b-7c03-8815-d4c93d984a1d`).

That review has **not** been dispatched and now will not be. Its slice review will be performed by
this orchestrator on **Opus 5 · high**, which is also the route's own documented fallback
(`Claude · Anthropic · Opus 5 · medium`, `lane-policy.md:32`). Invariants preserved: the review stays
**Claude-family** (opposite-family to the Codex implementation), the generator does not review itself,
and no paid or higher-effort escalation is introduced.

### Correction to this lane's own record

`supervisor.md:49` binds "Slice review of #1398 (Sol·med pair) → `review_codex`: Claude · Fable 5 ·
low". **That binding was never exercised** — every slice review in this lane, #1398 included, was
performed by this Opus orchestrator session. The record advertised a Fable route that never ran.
Corrected here rather than left to imply Fable usage that did not happen.

## D-7 — commit-boundary guard failed: `deno.lock` reached the PR head (significant)

**Date** 2026-08-12. Commit **`1a5c1d688`** on `fix/1459-defer-island-hydration` includes
`deno.lock` (+385/−9) and became the PR head, despite **two** explicit orchestrator steers requiring
restore-to-HEAD before any commit.

**Advancement stopped.** PR #1558 is **not** flipped to ready and **no evaluation was triggered** — it
remains `draft` at `status:plan-eval`, so the automatic IMPL-EVAL never fired on the bad head. Nothing
has merged; nothing has left the branch.

### Root cause of the churn, and of the guard failure

- **The churn:** the B3 client-bundle fixture runs a real `vite build`, which writes the workspace
  lock (`npm:vite`, `npm:rollup`, `npm:@babel/preset-react`, `npm:@prefresh/vite`,
  `@types/babel__core`). A plain revert can never hold — the next test run regenerates it. That is why
  the first restoration did not survive to the audit boundary.
- **The guard:** my steers said "restore before commit" but the commit step evidently staged
  everything (the tree was clean afterwards, so the commit swept the lock in). **A prohibition stated
  in prose is not a mechanism.** Nothing in the slice prevented `deno.lock` from being staged; the
  guard depended entirely on the agent remembering it at the right moment, twice.

**My share of this:** I mandated B3 without considering that a real Vite build mutates the lock, so I
created the tension the guard was then asked to hold shut by discipline alone. Recorded because the
next brief should make it structural — e.g. require explicit-path staging, or `--no-lock` isolation
specified up front — rather than repeating a prose prohibition.

### Corrective slice delegated, not self-performed

`agentic:codex-status` showed the thread **still working** in that worktree
(`019ff5e6-812b-7c03-8815-d4c93d984a1d`, "Including supplemental assets-barrel output"). Editing it
concurrently would have made me a second writer to a live agent's worktree — the exact concurrent-
writer hazard this harness warns about. So the correction was **delegated to the current writer** via
`codex-resume` on the same thread rather than performed directly.

Required of it, in order: restore `deno.lock` byte-for-byte from parent `4f93a0c2e` in a **new**
commit (**history preserved — no amend, no rebase, no force-push**); fix the fixture's build isolation
so the test cannot rewrite the lock; re-run the exact client-bundle test and required gates and
**prove with pasted `git status` + `git diff --stat HEAD -- deno.lock` that the lock survives them**;
audit `agent-docs.generated.ts` against a named generator command (`embedded.generated.ts` is expected
to be legitimate — it embeds the edited template); push and report the corrected head.

**Explicitly accepted alternative:** if isolation cannot be achieved, report that B3 is not viable
under the lock policy. The fixture is then removed from this PR and the client-bundle assertion joins
#1557. Choosing that is not a failure; leaving the lock mutated to keep the test would be.

## D-8 — Fable evaluator spawned under a Codex leaf; my briefs were the gap (significant)

**Date** 2026-08-12. A Fable subprocess spawned under the **#1583** Codex leaf and was terminated
without touching its work. On auditing, I found a **second, still-running** one and terminated it too.

### What was actually live

`ps` showed PIDs **816603 / 816700**, started 18:14, `--model fable --effort medium --name
1583-impl-eval-retry` — the `-retry` name indicating it was a **second attempt** after the first was
stopped. Its prompt declared it *"the mandatory separate-session IMPL-EVAL evaluator for NetScript PR
#1593 … native opposite-family evaluator: Claude Fable 5, medium, lane `formal_impl_evaluation`."*

Three violations at once: a **prohibited model**, a **prohibited local evaluator path**, and a
**duplicate** of the automatic DeepSeek lifecycle already running on #1593.

Terminated with `TERM`, verified zero survivors, `KILL` held in reserve and not needed.

**No damage:** leaf head `b96b5a58e` intact, working tree clean, and **no `evaluate.md` was ever
written** — the run dir contains only the Codex slice's own `plan/research/worklog/supervisor` files.
#1593 remains ready at `status:impl-eval` with automatic run `31616560752` in flight.

### The gap was mine

I audited my own dispatched briefs for the prohibition:

| Brief | Fable mentions |
| --- | --- |
| `implement-1583.md` | **0** |
| `implement-1571.md` | **0** |
| `implement-1580.md` | **0** |
| `implement-1589.md` | 1 |
| `implement-1227.md` | 1 |

**Three of five carried no prohibition at all**, including #1583's — the leaf that spawned one. I had
been treating "no Fable" as an *orchestrator-level* constraint I personally honoured, and recorded it
in `drift.md` D-6 and the worklog. But a constraint the implementing agent never reads cannot bind
the implementing agent. The leaf reasonably concluded that a formal IMPL-EVAL needed an
opposite-family evaluator and spawned the canonical one from `lane-policy.md`.

**This is the same failure shape as D-7**, one layer up: *a prohibition stated where the actor cannot
see it is not a mechanism.* There I wrote a commit-boundary guard in prose and nothing stopped the
lock being staged; here I held a model prohibition in my own context and nothing stopped a leaf
spawning that model. Recorded together because the lesson generalises: **constraints must travel to
the agent that can violate them.**

### Fix forward

Every future slice brief carries a standard, non-optional block —
`slices/BRIEF-STANDARD-PROHIBITIONS.md` — prohibiting Fable and `deep_analysis` sub-agents outright,
forbidding any locally launched evaluator, and stating that evaluation arrives **only** through the
automatic label-driven lifecycle. Existing live briefs (#1589) already carry the clause; #1583's leaf
is past implementation and its evaluation is now automatic-only.
