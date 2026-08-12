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

### Collateral check after the termination sweep

My background **dispatch wrapper** for #1583 exited **143 (SIGTERM)** in the sweep. Verified nothing
of consequence was lost:

| Check | Result |
| --- | --- |
| #1583 leaf head | `b96b5a58e`, tree clean |
| PR #1593 | OPEN, ready, `status:impl-eval`, head unchanged |
| Automatic IMPL-EVAL `31616560752` | **still `in_progress`** |
| #1583 Codex thread | alive |

The wrapper's useful work — launching the slice — had already completed, and the automatic evaluation
runs in GitHub Actions, so a local kill could not reach it. **The sanctioned path was never at risk;
only the prohibited one was stopped.** Worth stating because "I killed processes and something exited
143" is exactly the kind of event that should be checked rather than assumed benign.

---

## D-9 — both automatic evaluators stalled; one native fallback each, by owner authorization

**Severity: significant. Recorded 2026-08-12.**

The automatic label-driven lifecycle — which D-4/D-5 established as the *only* evaluation path for
this lane — **stalled on both open PRs at once**:

| Run | PR | Phase | Model | Created | Outcome |
| --- | --- | --- | --- | --- | --- |
| `31616560752` | #1593 (#1583) | IMPL-EVAL | DeepSeek | ~16:14Z | cancelled after >20 min, no update |
| `31616569894` | #1595 (#1589) | PLAN-EVAL | MiniMax | ~16:14Z | cancelled after >20 min, no update |

The owner authorized **exactly one** native Opus 5 fallback per PR, with explicit constraints: no
label cycling, no second paid evaluator, immutable clean detached worktree at the evaluated head,
read-only, and a **trigger-immune final comment only** — no running commentary.

Executed as authorized:

| PR | Fallback worktree | Evaluated head | Clean | Verdict |
| --- | --- | --- | --- | --- |
| #1593 | `/home/codex/repos/ns006-1583-fbeval` | `b96b5a58e` | 0 | **FAIL_FIX** |
| #1595 | `/home/codex/repos/ns006-1589-fbeval` | `ec596b353` | 0 | **PASS** |

Both fallback briefs enforced: read-only, **no sub-agent spawning** (Fable and `deep_analysis` named
explicitly per D-8), **no posting to GitHub** — the evaluator returns its verdict and the orchestrator
posts it — and **no OpenHands invocation syntax anywhere in the returned text**, so the final comment
is trigger-immune *by construction* rather than by review. Both posted comments were verified to
contain zero invocation tokens before publication.

**Why the no-posting rule matters.** An evaluator that posts its own verdict is one string away from
re-triggering the dispatcher it is standing in for. Removing the capability is cheaper than auditing
the output.

**Public provenance.** The lifecycle labels showed only a cancelled run with verdict `NONE`. A
fallback verdict that lives only in an embedded agent transcript is not evidence anyone else can
audit, so each verdict was posted as a single final PR comment naming the exact evaluated head.

### Sub-drift: the resume path does not carry the requested effort

Both leaves already had registered senders, so the correction/implementation cycles were dispatched
via `agentic:codex-resume` rather than a fresh launch — correct per the one-sender-per-worktree guard.
`codex exec resume` takes no `--model`/`--effort`; the thread keeps its original binding, so both
resumed at **gpt-5.6-sol / high** where the brief specified low and medium respectively. Same model
family, higher effort — harmless here, but the launcher's route flags are **not** a control surface on
the resume path, and a brief that states an effort tier cannot enforce it.

## D-10 — C2 (#1583 late-join) closed by inspection rather than by follow-up issue

The fallback IMPL-EVAL raised, as advisory C2, that a late-joining subscriber now receives only a
**suffix** — pre-fix, every subscriber opened its own physical stream replaying from `initialOffset`.
It could not determine whether this causes real transcript loss, because the transport
(`@durable-streams/tanstack-ai-transport`) is external and no in-repo caller iterates
`connection.subscribe`. The owner's instruction was to file a bounded-replay follow-up **only if
needed after external transport behaviour is checked**.

Checked, and **not needed**. `createChatSubscriptionHub` is invoked at
`packages/fresh/src/runtime/ai/create-chat-connection.ts:395`, **inside**
`createNetScriptChatConnection` — the hub is scoped to one connection instance, not module-global.
Therefore:

- Two distinct islands each construct their own connection, hence their own hub and their own physical
  stream, each replaying from `initialOffset`. Cross-island sharing does not occur.
- A reconnect after all subscribers stop passes through retirement and opens a fresh physical stream —
  a **full replay**, not a suffix.
- The only way two subscribers coexist on one hub is two `subscribe()` calls on the **same connection
  object**.

That last case is exactly the duplicate-subscription scenario #1583 exists to eliminate: **the
late-join window is the duplicate-subscriber window.** Documenting the rule is sufficient; a replay
buffer would add a buffer to serve a case the same PR removes. Recorded here rather than filed,
because "we decided not to file" is itself a decision the next reader needs.

C6 from the #1595 PLAN-EVAL was the opposite call and **was** filed, as **#1598** — the
cache-provider throw naming its own `import.meta.url` is the only remedy that reaches
already-generated consumers, whom #1589's build-time gate structurally cannot reach.

---

## D-11 — a draft→ready evaluation does not bind to the PR head; only a label-triggered one does

**Severity: significant. Recorded 2026-08-12. Caught by the owner, not by this lane.**

The automatic phase dispatcher can be triggered two ways, and they do **not** produce equivalent
evidence:

| Trigger | Run `headSha` | Binds to the PR head? |
| --- | --- | --- |
| draft → ready (`pull_request`) | the base / merge ref | **No** |
| `status:` label applied (`labeled`) | the branch head | **Yes** |

Measured on four PRs in one window:

| PR | Head | Eval run `headSha` | Trigger |
| --- | --- | --- | --- |
| #1600 | `717cef36d` | `717cef36d` | label |
| #1607 | `966bed5dd` | `966bed5dd` | label |
| #1595 | `cbf6d5c27` | **`f542f31cb`** (old `main`) | draft→ready |
| #1602 | `f9e924d0b` | **`66196034e`** (`main`) | draft→ready |

**Why this is not cosmetic.** #1595's IMPL-EVAL returned **PASS** and that verdict was used to apply
`status:ready-merge`. The verdict's own prose claimed the "immutable head", but the run metadata could
not corroborate which commit it read. A PASS that cannot be proven to describe the commit being merged
is not evidence — it is a plausible-looking artefact, which is exactly the class this lane spends its
verdicts trying to eliminate. #1602 was worse: its evaluator was running against `main`, so a verdict
would have described a tree that does not contain the change under review.

**Correction applied.** #1595 was rolled back from `status:ready-merge`, #1602's mis-headed run was
cancelled, and both were re-triggered through the **label** path. Both re-dispatches then reported
`headSha` equal to the exact PR head (`cbf6d5c27`, `f9e924d0b`) and were re-verified before use.

**Standing rule for this lane, from now on:**

1. **Never flip draft→ready and treat the resulting evaluation as the head-bound verdict.** Flip to
   ready, then apply the `status:` label as a separate action, and let *that* dispatch be the verdict.
2. **Before consuming any verdict, assert `run.headSha == pr.headRefOid`.** One `gh run view --json
   headSha` call. If they differ, the verdict is not evidence for that merge, regardless of what it
   says.
3. **After any post-ready change** — a resync merge, a body correction, a new commit — the previous
   verdict is void. Re-trigger once at the new immutable head.

The invariant in one line: **the evaluator's head must equal the merge head.** This lane had been
checking that the verdict *said* PASS, not that it described the commit about to land.

---

## D-12 — correcting D-11: `run.headSha` is not evidence of what an evaluator read

**Severity: significant. Recorded 2026-08-12. This entry supersedes D-11's standing rule.**

D-11 concluded that draft→ready-triggered evaluations "do not bind to the PR head" because their run
metadata reported the base or merge ref while label-triggered runs reported the branch head. **That
inference was wrong.** For a `pull_request` event, `github.sha` is the merge ref **by GitHub's
design**; the checkout the evaluator actually performs is a separate matter. The metadata never
described what the evaluator read, so it could not support the conclusion drawn from it.

The cost: #1595 was rolled back off `status:ready-merge` and re-triggered, and #1602's in-flight
evaluation was cancelled — both on a PASS that was already valid. The owner caught it and restored
#1595's original verdict (`31622416983`, exact head `cbf6d5c27`), which then merged unchanged.

**Corrected rule, replacing D-11's:**

1. The authority on what was evaluated is the **verdict's own declared head**, not `run.headSha`.
2. Re-trigger a new evaluation generation **only** for a genuinely new head, or a prior run that
   failed or returned no verdict. Not for metadata that merely looks inconsistent.
3. A post-ready change that alters the tree still voids the prior verdict — that part of D-11 stands.

The general lesson is the one this lane keeps relearning from the other direction: **an inference
drawn from a proxy field is not evidence.** D-11 was written while arguing that a PASS which cannot
be shown to describe the merge commit is a plausible-looking artefact — and then treated a proxy
field as if it were the thing itself. Verify against the artefact, not the metadata about it.

---

## D-13 — #1576 criterion 5 is not satisfiable as worded; the generator emits no dynamic Form-C route

**Severity: significant. Recorded 2026-08-12. Raised by the owner during slice review.**

#1576's acceptance criterion 5 reads:

> A generated dynamic Form-C scaffold browser test loads through `fresh-partial=true` without 500.

The cycle-3 fixture (`packages/fresh/tests/fixtures/route-binding-browser/app.tsx:8-9`) hand-constructs
its reference and comments *"This is the runtime reference shape emitted for a generated Form-C page."*
That comment is the tell: the test proves the **runtime reference shape**, not **generator
provenance**. If the generator emitted a different construction, the fixture would still pass.

### What the generator actually emits

| Site | Emission |
| --- | --- |
| `packages/cli/src/kernel/application/ui/web-scaffold.ts:29` | `createRouteReference('/<segment>', { id, kind: 'page' })` then `definePage().withRoute(route)` |
| `packages/cli/src/kernel/application/scaffold/writers/app-route-seeds.ts:49-54` | `createRouteReference(routePatterns.<x>.$route, { id, kind: 'page' })` |
| `packages/cli/src/kernel/assets/embedded.generated.ts:29` | same shape, all static paths |

**The construction shape the fixture assumes is correct.** But
`grep -rnE "createRouteReference\('/[^']*\[" packages/cli/src` returns **nothing**: the default
scaffold emits **only static patterns**. It has no dynamic `[param]` page route at all.

### Why the criterion cannot be met literally

The consumer failure came from the generated **routes tree** — `.generated/routes.ts`, built by
scanning the consumer's own route files, which included `/project/[project]/channel/[channel]` — not
from the seed scaffold. So "a generated dynamic Form-C scaffold" is two claims that do not co-occur
today:

1. the generator emits the `createRouteReference(...) → withRoute(...)` wiring — **true, and
   mechanically checkable**;
2. a **dynamic** pattern flows through it in a generated scaffold — **not produced by the default
   scaffold**, only by a consumer whose own route files contain dynamic segments.

### Decision

**Do not tick criterion 5 on the current fixture, and do not reword the criterion to fit the test.**
Instead:

- **Strengthen** the evidence with a mechanical provenance anchor: assert the generator's emitted
  construction shape equals the shape the fixture exercises, so generator drift breaks the test rather
  than silently invalidating it.
- **State the residual limitation explicitly** on the issue: the dynamic-pattern half has no generated
  source in the default scaffold, so the browser test necessarily supplies the dynamic pattern itself.
- **File the gap** rather than absorbing it — a scaffold that never emits a dynamic route also means no
  gate exercises dynamic route binding end to end, which is how #1576 reached a consumer in the first
  place.

Smoothing the distinction here would reproduce the exact failure this lane keeps catching: a checked
box whose evidence does not cover the path that actually broke.
