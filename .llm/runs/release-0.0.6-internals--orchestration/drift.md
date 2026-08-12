# Drift Log — release-0.0.6-internals--orchestration

Append-only. Newest entries at the bottom.

## D-1 — PLAN-EVAL and IMPL-EVAL waived for PR-A (#1436/#1415)

- **Severity:** minor (process, owner-authorized)
- **Recorded:** 2026-08-12, stage A
- **Fact:** `netscript-harness` makes IMPL-EVAL mandatory "unless the owner explicitly waives it", and
  `lane-policy.md` (owner decision 2026-08-08) allows `PLAN-EVAL: N/A` for small/mechanical issues
  with complete contract/scope/acceptance/gates.
- **Drift:** PR-A runs neither pass.
- **Authorization:** owner brief `/tmp/ns006-internals-orchestrator.md` §3 — "#1436/#1415 are
  mechanical: no ceremonial PLAN-EVAL or IMPL-EVAL; record N/A/owner waiver and prove negative cases."
- **Substitute evidence required:** executed RED→GREEN negative cases per fix plus the orchestrator's
  own re-run of the probe against the patched parser. A waiver removes the ceremony, not the proof.

## D-2 — OpenHands not used as the formal evaluator

- **Severity:** minor
- **Recorded:** 2026-08-12, stage A
- **Fact:** the brief §5 prefers OpenHands for broad/complex IMPL-EVAL "after #1524 lands". `#1524`
  (`fix(agentic): fail closed on open evaluators`) is an **open draft PR with no milestone** at
  `01aa12b67`; `lane-policy.md` additionally records the automated cloud agent lane as
  "TEMPORARILY PAUSED by owner (2026-08-06)".
- **Drift:** none against policy — the native opposite-family route *is* the documented local default.
  Recorded so the choice is visible rather than inferred.
- **Effect:** formal PLAN-EVAL and IMPL-EVAL run in fresh native opposite-family sessions. Re-check
  #1524 before the last rail IMPL-EVAL; if it has landed, the cloud route becomes available and the
  switch is recorded here.

## D-3 — No canary declared by this lane

- **Severity:** minor
- **Recorded:** 2026-08-12, stage A
- **Fact:** `milestone-run.md` stage E declares canary points at wave boundaries.
- **Drift:** this topical lane declares none.
- **Authorization:** brief §7 — "Report merges immediately; root owns canary/stable." Stage E is
  owned by the root 0.0.6 orchestration, which computes payload from merge history
  (`canary-cadence.md`). This lane's obligation is a live `cut-trace.md` and an immediate merge report.

## D-4 — #1436's prescribed fix is a no-op; the issue's diagnosis is imprecise

- **Severity:** significant (a gate-integrity finding about a gate-integrity issue)
- **Recorded:** 2026-08-12, stage B, executed at `01aa12b67`
- **Fact:** #1436 states the parser "matches closing keywords **without a word boundary**" and
  prescribes `\b(clos(e|es|ed)|fix(es|ed)?|resolv(e|es|ed))\b\s+#\d+`. Executed against
  `.llm/tools/validation/acceptance-evidence.ts:43`, the word boundary is **already present** (landed
  by #1303) and the fence-stripping the issue does not mention is present too (`:47`).
- **Executed evidence** (`evidence/probe-1436-baseline.ts`):
  - `'Exact pre-fix #1431 head'` → `[1431]` — the reported defect, reproduced.
  - `'un-fixed #555'` → `[555]` — a second instance, **not** in the issue.
  - `'hotfix #999 landed'` → `[]`, `'prefixes #888 there'` → `[]`, `'This is a bugfix #777'` → `[]` —
    the three cases the issue predicts would break are already handled.
- **Why it matters:** `\b` is the cause, not the cure. `-` is a non-word character, so `\bfix\b`
  matches the `fix` inside `pre-fix`. Implementing the issue's literal prescription yields a patch
  that changes nothing while appearing to fix the bug — the exact class `milestone-run.md`
  § Gate integrity records ("two guards whose predicate could never be true … both did nothing and
  looked correct").
- **Action:** the correct predicate excludes a preceding hyphen as well as a preceding word character
  (`(?<![\w-])` shape). PR-A's brief carries `pre-fix`, `un-fixed`, `hotfix`, `prefixes`, `bugfix` as
  mandatory cases and the orchestrator re-runs the probe against the patched parser before merge.
  #1436's acceptance is unaffected (it has no checkboxes); the issue's *analysis* section is corrected
  by a comment on the issue, so the record is not silently better than the issue.

## D-5 — `quality:scan:repo` is RED on `main`, and #1378's gate box is unsatisfiable until it is fixed

- **Severity:** significant
- **Recorded:** 2026-08-12, stage B, executed at `01aa12b67`
- **Fact:** #1378 § Current surface records "The scan is green today at 0 findings / 7 default / 10
  repo-wide allowances" (measured 2026-08-08 at `fac9e339042c`). Executed now:
  `deno task quality:scan:repo` exits **1** with **5** `ts-error-suppression` findings.
- **Cause:** `scan-code-quality.ts:86-89` exempts `_test`/`.test`/`.spec` files but not `*_type.ts`, so
  negative type fixtures are scanned as production source and their `@ts-expect-error` assertions —
  the whole point of the fixture — are reported as violations. `b3dc006e8` ("accept typed SDK client
  contributions (RFC 0001)") added `packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts`
  and turned the gate red.
- **Blast radius:** the **blocking** `code-quality-repo` job has failed on **7 consecutive pushes to
  `main`** (first `b3dc006e8` 2026-08-11T20:15Z; last green `0fbe3dadd` 2026-08-11T11:48Z). #1378's
  `gate:` acceptance box requires `quality:scan:repo` green after its change, so that box cannot be
  truthfully ticked until this is cleared.
- **Also observed:** the PR-side `code-quality` job scans only changed files and skips drafts
  (`code-quality.yml:28,36-42`), so the repo-wide job is the only path that ever scanned the file — and
  it runs post-merge. The violation was structurally invisible until it was already on `main`.
- **Action:** filed as **#1530** (p1, milestone 0.0.6) with the executed evidence and a narrow fix
  keyed on `tests/type-fixtures/**/*_type.ts`. Sequenced as PR-E before PR-D (`plan-quality-rail.md`
  R-1). Two now-redundant `// quality-allow:` lines are removed by it, lowering the repo-wide count
  10 → 8, which matters because #1378 wires `--max-allow` as a budget that can only fall.

## D-6 — #1529 added to the lane by the owner, then withdrawn by the owner

- **Severity:** significant (scope, owner-directed both ways)
- **Recorded:** 2026-08-12, stage C
- **Sequence:** the owner added #1529 (`fix(ci): ready_for_review can report every required lane as
  skipped`, p0 release blocker) to this lane as a separate leaf PR, requiring proof of both `ci` and
  `e2e` visibility semantics. The orchestrator created worktree `/home/codex/repos/ns006-cigate`,
  branch `fix/1529-required-lane-visibility`, and a brief. The owner then closed #1529 as **not
  planned**, stating the observed core-CI skip is intended, and withdrew it from the lane.
- **Independent finding, which agrees with the owner's call:** before the withdrawal the orchestrator
  reconstructed the event sequence from the Actions API and found the issue's repro **misattributed**.
  Run `31575007718` (all six jobs skipped) was created at `07:41:03Z`, while the `ready_for_review`
  timeline event is at `07:41:14Z` — 11 seconds later. That run was a **draft `synchronize`**, and
  draft pushes scheduling no jobs is documented intended behaviour (`ci.yml:59-60`). The real
  `ready_for_review` run is `31575023887`, which was **`cancelled`** 82s in by the next push under
  `concurrency.cancel-in-progress` (`ci.yml:48-50`). So the cited evidence did not demonstrate the
  claimed mechanism.
- **Action:** worktree removed, branch deleted, brief deleted. No workflow or visibility behaviour was
  changed. Two incidental observations made during that analysis are recorded in D-7 as **observations
  only** — not acted on, not filed, per the owner's instruction to drop the item completely.

## D-7 — observations recorded but deliberately not acted on

Kept because `agent-milestone-orchestrator` § Honesty rules requires recording what a run learns
rather than discarding it, and because an unrecorded observation gets rediscovered at cost. Neither is
being fixed, filed, or briefed by this lane. Both are the owner's call.

1. **Both `lane-visibility` jobs are reporters, not gates.** `ci.yml:347-395`
   (`core CI lane visibility`) and `e2e-cli.yml:509-564` (`scaffold CI lane visibility`) each consist of
   one step that writes a Markdown table to `$GITHUB_STEP_SUMMARY`. Neither contains `exit 1`
   (`grep -n "exit 1" .github/workflows/ci.yml` returns only Aspire-version checks in other jobs). They
   cannot fail.
2. **`pr-checks.ts` classifies a `skipped` check-run at head as a pass.**
   `.llm/tools/agentic/github/pr-checks.ts:141-157` chains superseded → stale-post-merge → pending →
   cancelled → failure → **else `current-pass`**, so `conclusion: 'skipped'` and `'neutral'` fall
   through to `current-pass`, and `buildPrCheckReport` then reports `ok: true`. This is the tool
   `netscript-pr`'s close-gate playbook directs operators to for "establish currency first".

## D-8 — orchestrator brief error, corrected mid-slice (Gate 1 permissions)

- **Severity:** minor
- **Recorded:** 2026-08-12, stage C
- **Fact:** PR-A's brief prescribed `deno test --allow-read --allow-env .llm/tools/validation/` as
  Gate 1. The implementation agent ran it, got exit 1 with 39 passed / 9 failed, correctly diagnosed
  all 9 as pre-existing `NotCapable: Requires write access` at `Deno.makeTempDir()` calls in
  `check-aspire-host-ports_test.ts`, `check-netscript-jsr-specifiers_test.ts` and
  `fresh-ui-quality_test.ts`, **refused to weaken unrelated tests**, recorded it, and continued with
  the unblocked gates.
- **Verdict:** the brief was wrong, the agent was right. Gate 1 is amended to include
  `--allow-write`, and that permission requirement is carried into the rail plan's validation table so
  the next three briefs do not repeat the error.
- **Worth noting:** this is the escalate-don't-idle instruction working as intended. The recorded
  failure mode it was written against — supervisors going idle at a red gate, four occurrences in
  0.0.4 — did not recur.

## D-9 — never wrap an attached Codex launch or resume in a shell `timeout`

- **Severity:** significant (tooling practice; owner-corrected)
- **Recorded:** 2026-08-12, stage C
- **What the orchestrator did wrong:** wrapped `agentic:launch-codex-slice` in `timeout 580` and
  `codex exec resume` in `timeout 900`, to keep the foreground stream from blocking the supervisor turn.
- **Why it is wrong:** the wrapper's SIGTERM at expiry **kills the attached slice**, not merely the log
  stream. The launch wrapper did fire (exit 143 / SIGTERM); this thread survived it, and the worklog
  initially recorded that as "an observation, not a failure". That conclusion was wrong — surviving once
  is not evidence the practice is safe, and treating a SIGTERM on an attached agent as harmless is
  exactly the "verify the artefact, never the exit code" mistake in reverse.
- **Correct practice, owner-stated:** attached launch and resume run **unwrapped**. For bounded
  observation use `deno task agentic:codex-watch --mode turn --thread-id <id> --timeout-seconds N`,
  which is designed to expire without touching the slice. Preserve the same thread and worktree
  throughout; never launch a rival.
- **Also learned (and independently useful):** `codex exec resume` fails fast with
  `thread-store conflict: … already has an active writer` while the thread is mid-turn. That is the
  mechanical signal for "you are not at a turn boundary" — steer on `codex-watch --mode turn`
  completion, not on git activity.

## D-10 — `status:ready-merge` alone cannot trigger the acceptance mirror; the documented behaviour is wrong

- **Severity:** significant (gate-trust defect in the close-gate surface this lane is repairing)
- **Recorded:** 2026-08-12, stage D, observed live on PR #1527
- **Two sources assert the label is a trigger:**
  - `.agents/skills/netscript-pr`: "applying `status:ready-merge` itself triggers a fresh run (the
    workflow listens to `labeled`)".
  - `check-close-gate.ts`'s own repair hint: "apply the label and the labeled event triggers a fresh
    run".
- **Both are false at `01aa12b67`:** `ci.yml:41` and `e2e-cli.yml` both declare
  `types: [opened, synchronize, reopened, ready_for_review]`. **`labeled` is in neither list.**
- **Observed cost:** the label was applied at ~08:14Z; no run was created; `close-gate` stayed
  `current-fail` on its pre-label result and #1415's four acceptance boxes were still `0` ticked at
  08:19Z. One wasted verification cycle, and a repair hint that tells the operator to do something that
  cannot work.
- **The rule that works:** **label first, then push.** The push fires `synchronize`, and because the
  gate and the mirror read everything live at execution time, that run observes the label.
- **Not fixed by this lane.** Adding `labeled` to `ci.yml`'s types is a one-line change that would make
  both documents true, but PR-A's boundary is `.llm/tools/validation/**` and the owner has just narrowed
  this lane's scope; widening a slice into workflow surgery mid-flight is how scope leaks. Raised to the
  owner as a separate decision, with the alternative being to correct the two documents instead of the
  workflow.
- **Note on the pre-merge gate:** this is check 1's failure mode from the other side — the close-gate
  *result existed* and was red, but it was red for a reason the operator was told to fix in a way that
  does not work. "Unproven, not clean" applies to a stale result just as much as to a missing one.

## D-11 — rail PLAN-EVAL returned FAIL_PLAN; the orchestrator's own plan carried an unverified claim

- **Severity:** significant
- **Recorded:** 2026-08-12, stage B (rail), eval loop failure **1 of 2**
- **Evaluator:** fresh Codex · GPT-5.6 Sol · **high** session, thread
  `019ff508-d5a3-7100-b6a0-1b6226e97e70`, worktree `/home/codex/repos/ns006-raileval` @ `83de0dc06`.
  Opposite family to the Claude-authored plan, per `lane-policy.md` `formal_plan_evaluation`.
- **Verdict:** `FAIL_PLAN`, on three findings. Two are corrections to the plan; one is a routing gap.

### Finding 2 is the one that matters most, and it is the orchestrator's error

`plan-quality-rail.md` R-9 asserts: "`rfcs/` holds only a template and a README; five numbered RFCs
(0001–0005) were accepted through `.llm/runs/*/design/canonical/` … the de-facto path is the harness
path." **That is false at the plan's own baseline.** Independently confirmed by the orchestrator:

```text
$ ls rfcs/
0000-template.md
0001-sdk-client-contributions.md
0002-runtime-versioned-automation.md
0003-command-composition-kit.md
0004-deterministic-first-hybrid-mcp-doc-retrieval.md
0005-devtools-contribution.md
README.md
```

The five numbered RFCs are present, and the merges that landed them are in this run's own opening `git
log` read (`03680f6e8 docs(rfc): accept DevTools contribution architecture (RFC 0005)` and four
siblings). The plan inherited "Zero numbered RFCs have ever landed" from #1380's 2026-08-08 measurement
and **did not re-measure it** — inside a plan whose stated value proposition is that it re-measured
everything rather than trusting the issues. A-3 in `cut-trace.md` records issue counts going stale in
four days; R-9 is that same failure committed by the plan itself.

Consequence beyond the plan: **#1380's D9/D10 divergence is stale in the same direction.** Its
acceptance box "The RFC-location divergence is resolved in `rfcs/README.md` with the 5
`DECISION_PENDING` entries mapped to the chosen location" no longer means "choose a location" — the repo
already chose, within the last week. The correct deliverable is to record `rfcs/NNNN-*.md` as canonical
and map the five entries onto it, not to adjudicate a divergence that has closed.

### Finding 1 — the A14 population is misclassified

The plan states all 54 `FAIL A14` results are `@std/testing/bdd` false positives. The evaluator reports
**53 sanctioned imports plus one locally bound `describe`**. That distinction is load-bearing: R-5's
required negative case is "the rule must still fire on a real bare global", and there is a **live
instance** to test it against rather than a synthetic fixture. Treating all 54 as false positives risks
a fix that suppresses the true positive too — the mirror image of the defect #1380 is about.

### Finding 3 — six live acceptance boxes have no stated proof route

The plan's per-PR contract table does not route every box. An unrouted box is how a milestone reaches
merge with an unticked gate, which is the failure the whole lane exists to prevent.

### Action

The plan is revised before any rail PR is dispatched — no implementation proceeds on a `FAIL_PLAN`.
Revision: correct R-9's premise and restate the #1380 RFC deliverable; split the A14 population and
name the true positive as R-5's negative case; route the six boxes. Then a second PLAN-EVAL pass. The
eval loop limit is two failures before escalation; this is failure 1.

### Process note worth keeping

The evaluator caught R-9 **because the brief told it to check R-9's premise specifically** rather than
asking for a general review. The finding cost one eval cycle and would otherwise have reached #1380's
implementation, where it would have produced a doctrine document arguing about a divergence that no
longer exists. Also recorded: the evaluator ended its turn with an in-band summary instead of writing
`plan-eval.md`, so the verdict had to be recovered from its rollout and the thread resumed to produce
the artifact. Briefs should state that the file is the deliverable and a chat answer is not.

## D-12 — a `stalled` status label is not death; verify the artifact and the writer lock

- **Severity:** minor (supervision practice)
- **Recorded:** 2026-08-12, stage B (rail)
- **What happened:** `agentic:codex-status` reported the PLAN-EVAL thread as `stalled` with
  `activityAgeMs` ≈ 626 s and `failure: null`, and no `plan-eval.md` existed. Its last recorded activity
  was an **assistant message** ending "I'm writing the formal `FAIL_PLAN` verdict now", which reads like
  a turn that ended without producing its deliverable.
- **What was actually true:** the thread was still mid-turn. The attempted `codex exec resume` was
  refused immediately with `thread-store conflict: … already has an active writer`, and the rollout file
  had grown to ~1.05 MB with a recent mtime.
- **Why it matters:** this is `agent-milestone-orchestrator` § Supervision pitfalls in its less obvious
  direction. The recorded lesson is "liveness is not progress" — a live socket does not mean work is
  happening. The converse also holds: **a `stalled` label does not mean the agent is dead.** A research
  agent believed idle for 70 minutes was 25/27 complete and came within one command of being killed.
- **The reliable signals, in order:** (1) the writer lock — a refused resume with `active writer` is
  positive proof the thread is working; (2) a growing rollout file; (3) a written artifact or new commit.
  The `state` field is a hint, not a verdict.
- **Practice:** wait at the turn boundary with
  `agentic:codex-watch --mode turn --thread-id <id> --timeout-seconds N`. Never kill on a `stalled`
  label alone. The failed resume was harmless — it fails fast and creates no rival sender — which is the
  behaviour that made this recoverable.

## D-13 — rail PLAN-EVAL cycle 2 also returned FAIL_PLAN; two-cycle limit reached, escalating

- **Severity:** architectural (the rail's plan is not implementable as written)
- **Recorded:** 2026-08-12, stage B (rail), eval loop failure **2 of 2**
- **Evaluator:** same fresh Codex · Sol · high session, thread `019ff508-…`, at `a9ddbdd46`. Verdict in
  `plan-eval-cycle2.md`. Cycle-1 disposition: 5 addressed, 4 partially addressed, 1 not addressed.
- **Verdict:** `FAIL_PLAN`, seven blocking findings. `netscript-harness` § Evaluator Separation sets the
  loop limit at two failures before escalation, so implementation stops here and the owner arbitrates.

### The three findings that are genuinely new information, not restatements

1. **Registered allowances would immediately invalidate the eight allowances that survive PR-E.** #1378
   requires every `// quality-allow:` to carry an **open, milestoned** `#<n>`. The existing allowances
   carry free-text reasons with no issue id. So the moment that rule lands, all eight become findings and
   PR-D is red by construction. #1378 never states a migration path, and the rail plan did not notice.
2. **R-3's fail-closed rule makes PR-D's own green gate unreachable.** The measured population is **567**
   `deno doc --json` unresolved-type warnings on an exit-0 run. Failing closed on them — which cycle 1
   correctly demanded — means #1378's `gate:` box can never go green without a classification or
   migration plan for those 567. Adopting the cycle-1 caveat literally created a contradiction.
3. **#1378 box 6 has no executable hook.** "A budget increase must carry an issue link in the same PR" is
   a property of a *diff*, not of a file. `quality:scan` reads files; it cannot see a PR. The proof needs
   a CI-integrated predicate, and slice D4 named a test without naming that mechanism.

### The findings that are the orchestrator's sloppiness

4. **The revised plan contradicts itself on wave membership and order.** Revision 2 inserted PR-E, but the
   authoritative wave sections above it still read PR-B → PR-C → PR-D. Appending a revision instead of
   reconciling the document produced exactly the internal inconsistency this lane exists to catch in
   others.
5. **The Design table claims 21 slices and contains 20**, and several rows are not file-scoped. A
   miscount in the artifact written specifically to satisfy a commit-slice gate.
6. **"Strictly harder" was an overstatement** (finding 8). The amended #1380 box 2 *admits a state the
   original did not* while *requiring evidence the original did not*. It is stricter on evidence and
   broader on admissible states — not strictly harder. The claim on issue comment `5264580324` needs
   correcting, because overstating the direction of an acceptance amendment is precisely the kind of
   self-serving record this lane is repairing.
7. **The provenance conclusion ignored checked-in records that claim rename/supersession** (finding 7).
   `git log --all --diff-filter=A` says four packages never existed; checked-in debt/doctrine records
   explicitly document rename or supersession for some of them. Both cannot be true as stated. The
   re-walk must reconcile them, not silently prefer the git probe.
8. **R-10's fallback is only honest if PR-D stops closing #1378** (finding 9). If slice D5 and box 3 move
   with the issue, PR-D delivers partial work and must reference `#1378` **without** a closing keyword.
   The plan kept `Closes #1378` while also allowing the box to move — an internal contradiction that would
   have auto-closed an issue with an undelivered acceptance box.

### Action

No rail PR is dispatched, including PR-E. PR-E's own slices E1–E4 are untouched by any blocking finding
and it clears a red gate on `main`, so it is a candidate for a scoped owner authorization — but
dispatching it on the orchestrator's own authority, against a formal `FAIL_PLAN` that explicitly says
"do not begin implementation on the current plan", would be the generator overruling its evaluator. That
is the self-certification the harness forbids, so it goes to the owner as a decision rather than being
taken as a judgement call.

## D-14 — evaluation automation policy change: label/transition-triggered, never manually dispatched

- **Severity:** significant (changes this lane's evaluator mechanics for every remaining PR)
- **Recorded:** 2026-08-12, owner directive mid-run
- **Policy, as stated:**
  - **Do not manually dispatch OpenHands** for formal PLAN-EVAL or IMPL-EVAL.
  - **PLAN-EVAL** fires exactly once from the **`openhands` + `status:plan-eval` label pair**. Rerun only
    by moving away from `status:plan-eval` and re-adding it.
  - **Initial IMPL-EVAL fires automatically on draft → ready**, unless `impl-eval:skip` is applied. Rerun
    only by moving away from `status:impl-eval` and re-adding it.
  - Optional `eval:model:minimax|deepseek|qwen` is **one-shot**.
  - An already-running local eval may finish; **never duplicate it**.
- **Compliance position for this lane:**
  - **No violation to unwind.** This lane never dispatched OpenHands: `drift.md` D-2 recorded on day one
    that #1524 was an open draft and `lane-policy.md` had the cloud lane paused, so formal evaluation ran
    on the documented native opposite-family route.
  - **Cycle-3 PLAN-EVAL is left to finish.** It is a local Codex · Sol · high session (thread
    `019ff508-…`) launched minutes before this directive. Per the policy it may complete, and it must
    **not** be duplicated — so this lane will **not** also apply the `openhands` + `status:plan-eval`
    pair for the same plan. One evaluation of one plan revision.
- **What changes for PR-E / PR-B / PR-C / PR-D:** the per-PR IMPL-EVAL is **no longer an orchestrator
  dispatch**. It fires on the draft → ready transition. Consequences the orchestrator must honour:
  1. **Do not launch a local IMPL-EVAL session per PR.** That would duplicate the automatic one.
  2. **Do not apply `impl-eval:skip`** on any rail PR — every one of them changes gate semantics, which
     is exactly the class that needs an independent pass.
  3. **The draft → ready flip becomes an evaluator trigger, not just a CI trigger.** So it happens when
     the slice checklist is complete and IMPL-EVAL is expected to pass — not to get CI moving. On PR #1527
     the flip was used to materialise required contexts; that is no longer a free action.
  4. **Rerun discipline:** if an IMPL-EVAL verdict must be refreshed after fixes, move away from
     `status:impl-eval` and re-add it. Do not push an empty commit and do not re-request a review.
  5. `status:plan-eval` is not applied to any rail PR: the rail's plan was evaluated at the run level,
     and the PRs carry `status:impl` → `status:impl-eval` → `status:ready-merge`.
- **Unchanged:** merge authority stays with the orchestrator through the pre-merge gate; a green automated
  gate is still not a sign-off; the generator still never evaluates its own work.

## D-15 — #1524 landed mid-run, which makes the `labeled` documentation defect worse, not better

- **Severity:** significant (sharpens R-11 and supersedes part of D-2)
- **Recorded:** 2026-08-12, while cycle 3 was running
- **Fact:** `main` advanced two commits past PR-E's base to `281ab7688`, including
  **`7837ef470 feat(agentic): automate formal evaluator phases (#1524)`** — the automation the owner's
  policy directive (D-14) describes. **D-2 is now superseded on its factual claim:** #1524 is no longer an
  open draft; the label-triggered evaluator route exists.
- **What it added:** `.github/workflows/openhands-phase-eval.yml`, whose trigger is
  `on: pull_request: types: [labeled, ready_for_review]`, with the state machine documented in its own
  header: initial IMPL-EVAL on draft→ready, `impl-eval:skip` as the attributed escape hatch, PLAN-EVAL on
  the `openhands` + `status:plan-eval` pair, rerun by label-cycling.
- **What it did *not* change:** `ci.yml:41` is still
  `types: [opened, synchronize, reopened, ready_for_review]`. **`labeled` is still absent**, and `ci.yml`
  is the workflow that runs `close-gate` and the acceptance mirror.
- **Why this makes the documentation defect worse.** `netscript-pr` `SKILL.md:169-170` still reads
  "applying `status:ready-merge` itself triggers a fresh run (the workflow listens to `labeled`)". Before
  #1524 that sentence was simply false. Now it is **half true**, which is harder to catch: a label *does*
  now trigger a workflow — just not the one that re-evaluates the close-gate. An operator who reads it
  will apply `status:ready-merge`, see a run appear, and conclude the close-gate was re-evaluated. It was
  not.
- **Action:** `R-11` refined from a negation into a distinction — the phase-eval workflow listens to
  `labeled`; `ci.yml` does not; for `status:ready-merge` it is label **then push**. PR-C slice C7 carries
  it, along with the same fix to `check-close-gate.ts`'s repair hint. No workflow trigger is changed
  (owner decision, D-14 boundary).
- **Collision check for PR-E:** the two new commits touch skills, labels, and workflows only —
  `git diff --name-only 84dd44ae7..origin/main | grep -E 'tools/quality|type-fixtures'` returns nothing.
  PR-E's surface is unaffected and its premise still holds: `quality:scan:repo` is **still exit 1** at
  `281ab7688`, so #1530 is live and its RED-first proof remains real.

## D-16 — cycle 3 FAIL_PLAN: the plan is converging, #1378 is not implementable as scoped

- **Severity:** architectural (milestone-content decision, not a plan defect)
- **Recorded:** 2026-08-12, eval cycle **3 of 3**
- **Verdict:** `FAIL_PLAN`. Cycle-2 disposition: **6 addressed, 4 partially addressed, 0 not addressed**.
  Five new blocking findings. The plan is measurably converging; what is not converging is #1378's
  premise.

### The finding that changes the milestone, not the plan

`R-3` deferred "measure the intersection, then wire or rescope" into PR-D. The evaluator refused that as
a plan-time deferral (`plan-gate.md:24-27`) **and measured it**:

```text
30-package deno doc --json run: 567 warnings reproduced
1,714 published symbol records contain unresolved type references (3,945 occurrences)
  plugin-sagas-core: 230/724 symbols affected
  fresh:             174/487 symbols affected
```

It also identified why my framing was unusable: **warning text names the dependency module, not the
published declaration that transitively depends on it**, so "warnings that touch a declaration" was never
a defined mapping. The intersection is plausibly *most* declarations in dependency-heavy packages.

That is not a plan defect I can rewrite away. #1378 box 1 ("a new `any` in an exported type fails") rests
on export-reachability that cannot be computed reliably at this baseline without a debt baseline for
1,714 symbol records — which is a programme, not a slice.

### The second unimplementable premise

`#1378` requires `// quality-allow:` to carry an issue id that is **open and milestoned**. The scanner
runs with `--allow-read` only (`deno.json:50-51`) — it cannot observe live issue state. My D2 proof
(unlinked-red / linked-green) would be satisfied by a parser that accepts any `#<n>`, i.e. **a test that
cannot fail on the property the issue actually requires**. Satisfying it needs a deterministic state
source (checked-in register, or a networked step outside the scanner) that #1378 never specifies.

### Two factual corrections the evaluator found, both mine

1. **`@netscript/sagas` — my row was false.** I wrote "no checked-in supersession record found".
   `arch-debt.md:576-584` records the resolved debt in `packages/plugin-sagas-core` and explicitly calls
   the old directory superseded.
2. **`@netscript/shared` — my row was incomplete.** I wrote "no removal commit on `main`", which is true
   but omits load-bearing evidence: the mandated full-history probe finds **`fd8259b76`**, whose diff
   deletes `packages/shared/deno.json` and the rest of `packages/shared/**`. Non-HEAD history, but it is
   the removal commit the row must cite alongside the ancestry boundary.

Both are exactly the class I was auditing #1380 for — asserting an absence without running the probe that
would find the presence. Recorded rather than quietly fixed.

3. **My 374-commit figure is unpinned** and therefore false at any later head (finding 7). A count that
   moves must be stated with the sha it was measured at.

### Also found: E1's gate is structurally invalid

`worklog.md:352` gives E1 the post-slice gate "`deno test .llm/tools/quality/` **fails**". A landed commit
slice whose required gate is red cannot satisfy the Plan-Gate's "gate that proves it" rule. RED-first
evidence belongs in the PR comment and the test's pre-change output — not as a slice's passing condition.

### Action

Three cycles is the escalation point twice over. The plan is not rewritten a fourth time. Escalated to the
owner as a **milestone-content decision**: #1530, #1403 and #1380 remain deliverable with small,
identified fixes; #1378's boxes 1 and 2 rest on properties this codebase cannot satisfy in 0.0.6 without a
separate debt programme, and the honesty rule says such criteria move with their issue rather than being
ticked or quietly reinterpreted.

## D-17 — rescope executed: which acceptance criteria moved, and why

- **Severity:** architectural (milestone content changed)
- **Recorded:** 2026-08-12, owner-authorized after cycle 3 `FAIL_PLAN`
- **Authorization:** owner directive — "If PLAN-EVAL cycle 3 fails, rescope the issues and report exactly
  which acceptance criteria move and why."

### Moved to 0.0.7

| Issue | Criteria moved | Why it cannot be truthfully ticked in 0.0.6 |
| --- | --- | --- |
| **#1378** (whole issue) | box 1 (exported `any` fails), box 2 (unlinked `as unknown as` fails), and the exported/local + linked/unlinked halves of box 8 | **Measured, not judged.** `deno doc --json` over 30 export maps: 3.733 s, exit 0, **567** warnings, **1,714** published symbol records with unresolved type references (3,945 occurrences; 230/724 in `plugin-sagas-core`, 174/487 in `fresh`). Warning text names the *dependency module*, not the dependent declaration, so export-reachability has **no deterministic attribution** at this baseline. Separately, box 2 requires the allowance's issue to be **open and milestoned**, and `scan-code-quality.ts` runs `--allow-read` only (`deno.json:50-51`) — it cannot observe live issue state, so the obvious proof cannot fail on the property the box requires. |
| **#1545** | all five boxes | Its acceptance depends on the registration rule that moved with #1378. Boxes 1 and 3 require the mechanism to exist. |

### Stayed in 0.0.6

| Issue | Status |
| --- | --- |
| **#1530** | unchanged — PR-E. Only defect was E1's gate framing, fixed in the Design table. |
| **#1403** | unchanged — PR-B. Only defect was the coverage test deriving its expectation from the function under test; now independently derived. |
| **#1380** | unchanged — PR-C. Only defects were two provenance rows, corrected against verified evidence. |
| **#1549** *(new)* | the provable half of #1378: docs-fence scanning via #1374's extractor, soundness/type-fixture exemption asserted by rule, `--max-allow` at the measured count, the same-PR budget-link predicate in the existing `code-quality` job, and typing `docs/site/reference/triggers/index.md:310` + its twin. |

### What was deliberately **not** done

- **No id-presence check dressed up as registration.** Accepting any `#<n>` without verifying open/milestoned
  would satisfy the written test while violating the contract — the unearned-green pattern this lane exists
  to remove. #1549 explicitly declines it.
- **No fourth plan rewrite.** Three cycles closed 6 of 10 findings with none unaddressed; the residue was in
  the issues' premises, not the plan's structure.
- **No criterion reinterpreted to fit.** Each moved box moved with a written reason on its issue
  (#1378 and #1545 comments), per the honesty rule.

### Net effect on the lane

Owned issues: **#1436, #1415 closed** (PR #1527, merged `63cd1cd58`). **#1530, #1403, #1380, #1549** remain
in 0.0.6 across PR-E → PR-B → PR-C → PR-D. **#1378, #1545** carry to 0.0.7. The lane's deliverable count is
unchanged at four remaining PRs; what changed is that PR-D's scope is now provable.

## D-18 — PLAN-EVAL cycle 4 runs on the automated path; evaluator route changed by automation, not escalation

- **Severity:** minor (route record)
- **Recorded:** 2026-08-12
- **Owner directive:** run a separate PLAN-EVAL cycle 4 on the rescoped plan before dispatching PR-E; do
  not waive it, because the change remains a complex cross-cutting quality-gate change.
- **Mechanism used, per D-14:** the rescoped plan needed a PR surface for the label pair, so the control
  branch's run-record PR **#1553** was opened **as a draft** and given `openhands` + `status:plan-eval`.
  Verified from `openhands-phase-eval.yml:24-34` that the PLAN-EVAL branch does **not** test draft state
  (only `status:impl-eval` requires non-draft), so a draft record PR is the correct surface.
- **Dispatch verified, not assumed:** run `29334443743` succeeded on the `labeled` event and posted the
  trigger; run **31588750658** is the evaluator.

```text
@openhands-agent model=openrouter/minimax/minimax-m3 output=pr-comment iterations=500 phase=plan
head=ce011b5f157a3f90bfbbf2c6a9e4f25ff3a060bc
Trusted base SHA: d7e2b67b2be535c9ca13449f97f8f4585344030a
```

- **Route shift worth recording.** Cycles 1–3 ran on the native opposite-family route (Codex · Sol · high),
  which `lane-policy.md` makes the local default, with OpenRouter reserved for a third opinion or a
  quota-blocked native family. Cycle 4 is **MiniMax M3 over OpenRouter** — the phase-bound PLAN-EVAL model
  in `lane-policy.md` § Native-first formal evaluation. The change is **chosen by the automation**, not an
  orchestrator escalation: the phase dispatcher resolves the model. Recorded so the run's route history is
  not mistaken for an unrecorded escalation. It also means cycle 4 is a genuine **third opinion** on a plan
  three Codex cycles have already failed, which is the more useful pairing here.
- **No duplication.** The local Codex evaluator thread finished cycle 3 and was not resumed. One evaluation
  of one plan revision, per D-14.
- **#1553 must never leave draft.** Draft → ready fires the initial IMPL-EVAL, which is meaningless for a
  record PR that ships no code. `netscript-pr` also forbids merging a PR at `status:plan-eval`, which is
  correct for this surface.

## D-19 — cycle 4 verdict `FAIL_RESCOPE`: the plan passed, its companion prose did not

- **Severity:** minor (documentation consistency; no scope or decision changed)
- **Recorded:** 2026-08-12, PLAN-EVAL cycle 4, MiniMax M3 over OpenRouter via the automated phase-eval path
- **Verdict:** `FAIL_RESCOPE` on PR #1553 at `ce011b5f1`, run `31588750658`. **Five findings PASS**, two
  FAIL — and the two are not about the plan's decisions:
  - **F-1 PASS** — the rescope is bounded, per-criterion reasoned, and honest; criteria moved with their
    issues and none was reinterpreted.
  - **F-2 PASS** — the three defects cycle 3 left standing are repaired (E1's red-gate structure, B1's
    independent oracle, the two provenance rows).
  - **F-3 PASS** — **the Plan-Gate checklist is cleared**: research current, decisions locked, 20
    file-scoped slices each with a green post-slice gate, gate set fireable, deferred scope explicit.
  - **F-6 / F-7 PASS** — lane discipline and verdict vocabulary.
  - **F-4 FAIL** — companion artifacts still describe the pre-rescope surface.
  - **F-5 FAIL** — no implementation slice is committed. The evaluator states explicitly that this is
    **not a Plan-Gate failure of the plan**; it discharges the moment PR-E is dispatched.
- **So the blocking defect is F-4 alone**, and it is the same sin as cycle 2 finding 6: I reconciled the
  rail plan and left the companion documents behind. Six stale statements, all now fixed in one
  run-artifact-only commit:
  1. `plan.md` — "the three issues … three sequential PRs" → four, with the order named in its own prose
     rather than delegated to another file.
  2. `plan.md` — "PR-D … closes #1378 … export-aware `any` severity" → closes **#1549**, effort dropped
     high → medium because export-reachability was the complex half and it moved.
  3. `worklog.md` § Ports — `discoverDoctrineRoots()` "expanded in PR-C" → PR-B performs the **single**
     transition and PR-C consumes it unchanged.
  4. `plan-quality-rail.md` routing — the nine #1378 rows and five #1545 rows replaced by seven #1549 rows,
     with the moved slices marked out-of-milestone rather than deleted.
  5. `plan-quality-rail.md` routing header — denominator corrected to the in-0.0.6 boxes, stating that the
     moved boxes are *out of milestone*, not unrouted.
  6. `plan-quality-rail.md` open decisions — R-3 and R-7 marked **withdrawn by rescope**, not "resolved".
     Calling a withdrawn decision resolved is precisely the unearned-green wording this lane removes.
- **One factual note back to the evaluator:** its Remaining-risks section says "#1549 must be filed with
  provable-half boxes before PR-D dispatch … the lane must reconcile before filing #1549". #1549 was
  **already filed** with exactly those seven boxes before this evaluation ran — it is referenced in D-17 at
  the evaluated head. The risk is discharged, not outstanding.
- **Action:** F-4 fixed; PLAN-EVAL re-triggered by label-cycling `status:plan-eval` per D-14's rerun path
  (the only sanctioned rerun mechanism — not a push, not a re-request). PR-E dispatches on `PASS`.

## D-20 — PLAN-EVAL PASS at cycle 5; Plan-Gate cleared, implementation authorized

- **Severity:** minor (milestone in the run's own process)
- **Recorded:** 2026-08-12
- **Verdict:** **`PASS`** — PR #1553, run `31589648809`, evaluated head `69ef5f15d`, MiniMax M3 over
  OpenRouter via the automated phase-eval path. Verdict body saved as `plan-eval-cycle5.md`; cycle 4's
  `FAIL_RESCOPE` saved as `plan-eval-cycle4.md`.
- **Rerun mechanism used:** label-cycled `status:plan-eval` → `status:plan` → `status:plan-eval`, the only
  sanctioned rerun path (D-14). Exactly one `status:` label at every point. Not a push, not a
  re-requested review — and a push would not have worked, since `openhands-phase-eval.yml` triggers only on
  `labeled` and `ready_for_review`.
- **Cycle history, for the retrospective:**

| Cycle | Route | Verdict | What it cost, and what it bought |
| --- | --- | --- | --- |
| 1 | Codex · Sol · high (local) | `FAIL_PLAN` | Caught R-9's premise — a claim inherited from #1380 and never re-measured, inside a plan whose whole value was re-measurement |
| 2 | Codex · Sol · high (local) | `FAIL_PLAN` | Caught the allowance rule reddening CI on day one, the unreachable green gate, and the diff-vs-file impossibility of box 6 |
| 3 | Codex · Sol · high (local) | `FAIL_PLAN` | **Measured** the premise instead of arguing it: 1,714 published symbol records with unresolved types. That number is what forced the rescope |
| 4 | MiniMax M3 (automated) | `FAIL_RESCOPE` | Passed the plan and the Plan-Gate; failed the companion prose still describing the pre-rescope surface |
| 5 | MiniMax M3 (automated) | **`PASS`** | Plan-Gate cleared |

- **Judgement worth recording:** five cycles is far more than this repo's two-cycle norm, and it was not
  ceremony. Cycles 1–3 each found a defect that would have shipped: a no-op premise, a gate red by
  construction, and a rule whose green state was unreachable. Cycle 3's measurement in particular is the
  kind of finding no amount of plan re-reading produces — it required executing `deno doc --json` and
  parsing the result. The cost was borne almost entirely by the *plan*, not by implementation, which is
  where it is cheapest to pay.
- **Implementation is now authorized.** PR-E dispatches first. F-5 of cycle 4 (no committed slice)
  discharges on that dispatch, as the evaluator stated.

## D-21 — D-10's remedy refined: re-run the workflow, do not push, once an IMPL-EVAL verdict exists

- **Severity:** significant (sequencing; the naive remedy destroys evaluation evidence)
- **Recorded:** 2026-08-12, taking PR #1560 through the gate
- **The tension.** D-10 established that `status:ready-merge` triggers no `ci.yml` run, so the acceptance
  mirror does not fire, and prescribed **label then push**. That was correct for PR #1527, which had no
  formal IMPL-EVAL (owner-waived). It is **wrong** now that the initial IMPL-EVAL fires on draft → ready
  (D-14): a push moves the head, and the IMPL-EVAL verdict was issued against the pre-push head. Pushing to
  make the mirror run would invalidate the very verdict that authorizes the merge.
- **The correct remedy, and it was in the skill all along.** `netscript-pr` states that the mirror and
  checker "fetch the PR, its labels/body/head, comments, and every closing issue **live** through the API at
  execution time … a re-run after labeling now works (labels are read live, so **a manual rerun also
  works**)". So the sequence is:
  1. IMPL-EVAL returns `PASS` at head *H*.
  2. Apply `status:ready-merge`.
  3. **Re-run the existing `ci.yml` run** (`gh run rerun <id>`), which re-reads live labels and mirrors the
     acceptance evidence. Head stays *H*; the verdict stays valid.
  4. Merge.
- **Why this matters beyond convenience.** "Push to re-trigger" is the reflex, and here it silently trades a
  formal evaluation for a workflow trigger. The provenance fields the gate prints (`headSha`,
  `evaluatedAt`, per-issue `updatedAt`/`bodySha256`) exist precisely so a verdict evaluated against a
  superseded head is detectable — a push would make every one of them stale in one step.
- **Effect on `R-11` / PR-C slice C7.** The documentation correction grows one clause. The three true
  statements are: `openhands-phase-eval.yml` **does** listen to `labeled`; `ci.yml` **does not**; and the
  way to make the close-gate and mirror observe a new label is to **re-run** the existing run, not to push —
  explicitly so an existing IMPL-EVAL verdict is not invalidated. That is strictly more useful than the flat
  "label, then push" this lane started with, and it is the version C7 ships.

## D-22 — editing a bundled `.llm/tools/` file requires same-PR asset-barrel regeneration

- **Severity:** significant (a real coupling; third gate my brief got wrong)
- **Recorded:** 2026-08-12, PR #1560 CI
- **Finding:** `ci.yml`'s `quality` job step **"Generated asset freshness"** (`ci.yml:299`) failed at PR-E's
  head. The full source text of `.llm/tools/quality/scan-code-quality.ts` is **embedded as a string** inside
  generated CLI asset barrels — both `packages/cli/src/kernel/assets/skills.generated.ts` and
  `packages/cli/src/kernel/assets/agent-tools.generated.ts` contain it. So the `isTypeFixture` change made
  those generated files stale, and the freshness check diffs regenerated output against what is committed.
- **Remedy:** `deno task gen:assets-barrel` (`deno.json:105`), committed in the same PR.
- **Why it was missed, and why that matters.** `tooling.md` documents that
  `generate-cli-assets-barrel.ts` must stay at the tools root *because its path is embedded in four
  generated files* — the coupling is written down, from the generator's side. What is **not** written down
  anywhere is the consequence for the other direction: that editing a *bundled tool* obligates regenerating
  the barrel. Neither #1530, nor this lane's brief, nor the rail plan's validation table carried it, so the
  implementer had no way to catch it locally. It is only discoverable from CI or from reading the barrel
  generator's inputs.
- **This is the third gate this lane's briefs got wrong**, all of the same shape — a required command the
  brief did not name:
  1. D-8: Gate 1 missing `--allow-write` (9 tests call `Deno.makeTempDir()`).
  2. D-8: still missing `--allow-run` (one test spawns a subprocess).
  3. D-22: no barrel regeneration for a bundled tool edit.
  Each was found by execution, not review, and each cost one CI or gate cycle. The rail plan's validation
  table now carries the barrel step for PR-B/C/D, which all touch `.llm/tools/`.
- **Worth promoting beyond this run.** A contributor editing `.llm/tools/quality/**` or
  `.llm/tools/fitness/**` has no local signal that a generated barrel depends on their file. The durable
  fix is either a note in `tooling.md` § Tool layout stating the obligation in the tool-author's direction,
  or making the freshness check runnable as a named task so it can be listed in a gate set. Recorded here;
  not taken by this PR, whose boundary is `.llm/tools/quality/**`.

## D-23 — a required fix superseded a passing IMPL-EVAL; re-evaluated rather than reasoned around

- **Severity:** significant (evaluation integrity)
- **Recorded:** 2026-08-12, PR #1560
- **Situation:** IMPL-EVAL returned `PASS` at `49e2b86e9`. The barrel-freshness fix (D-22) then landed
  `9ab361440`, so the verdict no longer corresponds to what would merge. This is the D-21 hazard arriving
  from the opposite direction: not a gratuitous push, but a **required** fix that CI itself demanded.
- **The tempting argument, and why it is refused.** The delta is a *generated* file, mechanically derived
  from a change that was already evaluated, and the orchestrator independently verified both that the
  generator is idempotent (a second run left `git status --porcelain` empty) and that the diff touches only
  `packages/cli/src/kernel/assets/agent-tools.generated.ts`. It would be easy to merge on the `49e2b86e9`
  verdict and note the delta as inert. That reasoning is exactly what this lane exists to distrust: "the
  gate does not need to run because I can see the change is safe" is the same shape as "the gate passed" when
  it did not run. `milestone-run.md` is explicit — a gate that did not execute against what ships is an
  **unproven, not clean** state.
- **Action:** re-ran IMPL-EVAL against the true final head by label-cycling `status:ready-merge` →
  `status:impl-eval`, the sanctioned rerun path (D-14). Cost is one evaluator cycle; the alternative is a
  merge whose strongest piece of evidence names a commit that is not the one being merged.
- **Rule this establishes for the rest of the rail.** Any commit that lands **after** an IMPL-EVAL `PASS` —
  including a generated-artifact refresh, a formatting fix, or a run-artifact update — invalidates that
  verdict and requires a re-evaluation before merge. The practical consequence for PR-B/C/D: run the barrel
  gate (validation row 7b) and every scoped wrapper **before** flipping draft → ready, so the ready flip
  evaluates a head that is already final. That ordering is now in the rail plan's validation table, and it
  is the cheap way to avoid paying for this twice.

## D-24 — `gh-watch` reported a terminal PASS in 0s by matching a superseded verdict comment

- **Severity:** significant (a gate-trust defect in the tool used to gate merges)
- **Recorded:** 2026-08-12, PR #1560, immediately after the D-23 re-evaluation
- **What happened:** after label-cycling to re-run IMPL-EVAL at the final head `9ab361440`,
  `deno task agentic:gh-watch --repo rickylabs/netscript --pr 1560` printed
  `TERMINAL PR #1560: PASS (PASS) after 0s` and exited 0. The re-run had **not** finished — the newest PR
  comment showed `conclusion: running` on run `31593326538` (DeepSeek V4 Flash 0731, the phase-bound
  IMPL-EVAL model). The watcher had matched the **previous** run's `PASS` comment, left on the PR by the
  superseded evaluation at `49e2b86e9`.
- **Why it matters, precisely.** The whole point of the D-23 re-evaluation was to stop merging on a verdict
  that names a commit other than the one shipping. Acting on this watcher result would have done exactly
  that, one step later and with a green tool output as cover. A verdict watcher that cannot distinguish
  "this PR has a PASS somewhere in its history" from "this PR's current evaluation passed" is the same
  defect class as #1415 (presence mistaken for assertion) and #1436 (a match that means nothing) — in the
  tool that gates merges.
- **Not a defect this lane fixes, and not this lane's issue to file blind.** `gh-watch` sits under
  `.llm/tools/agentic/github/`, outside every rail PR's boundary, and the sibling lanes use it too. Recorded
  here with the reproduction so it can be filed or fixed with an owner decision rather than absorbed
  mid-slice. The nearby `pr-checks.ts` classification already models exactly the missing concept —
  `superseded` vs `current-*` per check name — so the shape of the fix is known: a verdict comment must be
  matched against the **current head SHA**, which the trigger comment already carries (`head=<sha>`), before
  it is treated as terminal.
- **Workaround used here:** waited on the Actions **run id** (`31593326538`) reaching `completed`, then read
  the newest `OPENHANDS_VERDICT` comment and checked its head against `9ab361440`. Run identity is
  unambiguous where comment presence is not.
- **Related orchestrator lesson:** this is the third time on this lane that a green tool output has meant
  something other than what it appeared to (cancelled-vs-superseded checks nearly manufacturing a false red
  on PR #1527; the phase-eval workflow succeeding while dispatching nothing on an incomplete label pair; and
  now this). Reading the *provenance* rather than the *status* has caught all three.

## D-25 — three of four watcher findings resolved differently than reported; one instruction pair is jointly unsatisfiable

- **Severity:** significant (instruction reconciliation, recorded rather than silently picked)
- **Recorded:** 2026-08-12, PR #1560

### 1. Barrel staleness — already fixed before the report arrived

The watcher reported `ci.yml`'s `quality` job failing on stale
`packages/cli/src/kernel/assets/agent-tools.generated.ts`. True at head `49e2b86e9`; **already fixed** at
the current head. Commit `9ab361440` regenerated it, the orchestrator verified idempotence (a second
`deno task gen:assets-barrel` left `git status --porcelain` empty) and confined scope (only
`agent-tools.generated.ts`; `skills.generated.ts` did not need to change). Executed at head `9ab361440`,
ci run `31593153002`:

```text
success  quality              <- the reported failure, now green
success  check-test
success  classify changes
success  deps-report
success  core CI lane visibility
failure  close-gate           <- the only remaining failure
```

### 2. The duplicate eval run — already cancelled, not by this lane

Instruction: "cancel pending duplicate `31592081043` before it consumes capacity." Queried before acting:

```text
31592060933  completed  success    head=f99cb4fbf  created=11:29:21Z
31592081043  completed  cancelled  head=f99cb4fbf  created=11:29:38Z   <- already cancelled
31593326538  in_progress    -      head=5db37e7bb  created=11:46:00Z
```

`31592081043` was **already `cancelled`** — almost certainly by the workflow's own concurrency group, 17
seconds after the first run started. No action was taken and none was needed. Recorded because claiming
to have cancelled it would be a false record of a mitigation.

### 3. The verdict instruction and the barrel instruction cannot both be satisfied

This is the one that needs an owner decision rather than a choice by me.

- "Use only the first run's final verdict" — run `31592060933`, which returned `PASS` against PR head
  **`49e2b86e9`**.
- "Regenerate the canonical agent-tools asset and commit it" — that commit is **`9ab361440`**, which is
  what will merge.

So the authoritative verdict names a head that is *not* the head being merged, and the reason it does is
the other instruction. `milestone-run.md` treats a gate that did not execute against what ships as
**unproven, not clean**, which is why this lane re-triggered at the final head (`drift.md` D-23) — that
re-trigger predates the "do not retrigger" directive and is run `31593326538`, currently in flight.

**Position taken:** nothing further is launched, no fourth run is created, and the in-flight
`31593326538` is allowed to finish because it is the only evaluation covering the merged tree. Its verdict
is **not** consumed as authoritative without owner confirmation; the merge decision is held pending that.
Both verdicts and both heads are recorded here so the choice is the owner's and is visible either way.

### 4. Close-gate — the remaining failure, reconciled from posted evidence only

Six #1530 boxes unchecked. Reconciled the sanctioned way and no other: applied `status:ready-merge` and
**re-ran** ci run `31593153002` (`gh run rerun`), so the mirror observes the label live with the head
unchanged at `9ab361440`. No box is hand-ticked, no evidence is authored at merge time — the mirror maps
from the `acceptance-evidence` block already in the PR body. Box 7 keeps its `[post-merge]` marker and is
neither mapped nor ticked. Re-running rather than pushing is deliberate (D-21/D-23): a push would move the
head and invalidate *both* verdicts.

## D-26 — release strategy: 0.0.6 may cut intermediary canaries; this lane reports checkpoints

- **Severity:** minor (supersedes part of D-3)
- **Recorded:** 2026-08-12, owner directive
- **Policy:** 0.0.6 may publish intermediary canaries at meaningful green checkpoints. This lane keeps
  landing coherent quality/internal PRs independently and **reports each merged gate-trust checkpoint to
  the fixes/release coordinator**. It does **not** cut releases.
- **Effect on D-3:** D-3 recorded "no canary declared by this lane; root owns canary/stable". Still true —
  this lane declares and cuts nothing. What changes is that merges are now **actively reported as canary
  checkpoints** rather than merely appended to `cut-trace.md` for someone else to discover.
- **Checkpoints to report:**
  1. **PR #1527 → `63cd1cd58`** — closed #1436 + #1415. Gate-trust checkpoint: the close-gate no longer
     invents closing requirements from hyphenated prose, and the acceptance mirror no longer accepts
     not-yet-done evidence. Both proven on live data, including #1436's original incident (`#1431`
     classified as a pull request and excluded) firing on the PR that fixed it.
  2. **PR #1560** — pending the verdict question in D-25. Restores `main`'s blocking
     `code-quality-repo` job, red for seven consecutive pushes.

## D-27 — the two IMPL-EVAL verdicts disagree, and the later one was right

- **Severity:** architectural (this is the strongest evidence the lane has produced about its own thesis)
- **Recorded:** 2026-08-12, PR #1560

| Run | Head evaluated | Verdict |
| --- | --- | --- |
| `31592060933` (first) | `49e2b86e9` — **pre** barrel fix | **PASS** |
| `31593326538` (re-run at final head) | `9ab361440` — what would merge | **`FAIL_FIX`** |

**The `FAIL_FIX` was correct, specific, and independently reproduced by the evaluator.** Its single
blocking finding: the PR's fenced `acceptance-evidence` `box:` values were de-backticked,
continuation-merged sentences, while `acceptanceCheckboxes` parses an issue checkbox as **raw first line
only, backticks preserved**. So `validateEvidenceMapping` matched **none** of the six actionable boxes, the
mirror threw, `close-gate` was red, and the downstream acceptance and review-thread steps were skipped.
The evaluator reproduced it by calling
`validateEvidenceMapping(1530, acceptanceCheckboxes(issue), parseAcceptanceEvidence(pr))` directly.

**What this means for the instruction to "use only the first run's final verdict".** Following it literally
would have merged PR #1560 on a `PASS` whose head fails its own close-gate. The verdict was not wrong about
the *code* — the scanner change is correct in both evaluations — it was simply issued against a tree that
did not include the required barrel fix, and therefore never saw the close-gate failure. This is the
lane's own thesis turned on the lane: **a gate result that does not correspond to what ships is unproven,
not clean**, and the fact that it says `PASS` makes it more dangerous, not less.

Recorded plainly because the D-23 decision to re-evaluate was, at the time, a judgement call that cost a
cycle and could have looked like ceremony. It was not ceremony. The re-run is the only reason this defect
was caught before merge.

### Remediation, and why it invalidated nothing

The fix is **PR-body only** — the evidence block was rebuilt with keys taken from the repo's own parser
(`acceptanceCheckboxes` over the live issue body), preserving every evidence *value* verbatim from what was
already posted, per the instruction to reconcile only from posted evidence. Editing a PR body is **not a
commit**, so the head stayed `9ab361440` and neither verdict was invalidated by the repair itself.

Post-fix `mirror --dry-run` at the unchanged head:

```text
acceptance-mirror DRY-RUN: #1530
provenance: head=9ab361440… evaluated=2026-08-12T12:01:51Z
notice: Closing reference #1530 classified as issue; retained for acceptance mirroring.
notice: Issue #1530: excluded post-merge box(es) "`gate:` the `code-quality-repo` job is green on `main`
        after merge. `[post-merge]`"; verify in a follow-up comment and tick after merge.
```

Both notices are PR #1527's own work running in production: the PR-vs-issue classification from #1436, and
the explicit post-merge exclusion notice. The gate-trust fix is gating the next gate-trust fix.

### Open decision for the owner — not taken unilaterally

`netscript-pr` requires **IMPL-EVAL PASS evidence** before `status:ready-merge` and merge. The verdict of
record is `FAIL_FIX`. Its cause is remediated at the same head, and the sanctioned response to `FAIL_FIX`
is fix-then-re-evaluate (the loop allows two failures). But the owner directed "do not retrigger", in the
context of preventing duplicate consumption.

Options, stated rather than chosen:
1. **Label-cycle `status:impl-eval` once** to obtain a verdict on the remediated state at the same head.
   Costs one evaluator cycle; produces a `PASS` that names the merged tree. This is the harness-sanctioned
   `FAIL_FIX` loop and the orchestrator's recommendation.
2. **Merge on the first run's `PASS`.** Fastest, and explicitly what the instruction says — but the merge
   evidence would name `49e2b86e9`, which is neither the merged head nor a tree whose close-gate passed.
3. **Owner reviews directly** and records the reviewer-substitution waiver
   (`milestone-run.md` § Evaluator protocol permits it, recorded in `drift.md`, never silently applied).

Nothing further has been launched and no fourth run created. The merge is held.

## D-28 — `quality:gate` does not cover `.llm/tools/**`, so this lane's own gate citations were overstated

- **Severity:** significant (weakens gate evidence this lane has been citing on every PR)
- **Recorded:** 2026-08-12, reported by the 0.0.6 **fixes** lane, confirmed here against source
- **Fact:** `scan-code-quality.ts:18` sets `DEFAULT_ROOTS = ['packages/cli/src', 'plugins']`, and
  `quality:scan:repo` is `--root packages --root plugins`. **`.llm/tools/**` is scanned by neither.**
- **Why it matters to this lane specifically:** every PR in this rail — #1530, #1403, #1380, #1549 —
  changes `.llm/tools/**` and nothing else of substance. So `deno task quality:gate` has been reporting
  SUCCESS on these PRs **without inspecting a line of the changed code**, while the PR bodies cite it as
  gate evidence. That is a weaker claim than was made.
- **What actually inspected PR-E's diff:** the orchestrator's own pre-merge `git diff | grep -E` for new
  `deno-lint-ignore` / `@ts-ignore` / `as any` / `as unknown as` / `quality-allow:`. It found nothing real
  (one hit, a pre-existing string in the scanner's own test corpus). But **a hand grep is not a gate**, and
  representing `quality:gate` green as coverage of `.llm/tools` changes was an overstatement. Corrected here
  rather than left implied.
- **The fixes lane's evidence for the same hole:** a PR of theirs carried a **new `as unknown as`** and
  `quality:gate` still reported SUCCESS; their pre-merge diff scan was the only thing in the pipeline that
  saw it, and three adversarial eval cycles did not flag it either because they were briefed on semantics
  rather than typing hygiene.
- **CORRECTION after a probe the fixes lane asked for — the mechanism is different and the consequence is
  worse.** `scan-code-quality.ts:178` makes `DEFAULT_ROOTS` the *last* fallback
  (`changed.length > 0 ? changed : roots.length > 0 ? roots : DEFAULT_ROOTS`), so "not in the roots" was
  never provably the defect. The probe of `.github/workflows/code-quality.yml:36-42` found two independent
  failures in five lines:

  ```bash
  mapfile -t files < <(git diff --name-only --diff-filter=ACMR "$BASE" "$SHA" -- packages plugins)
  args=(); for file in "${files[@]}"; do args+=(--changed-file "$file"); done
  if ((${#args[@]})); then deno task quality:scan --pretty "${args[@]}"; fi
  ```

  1. The changed-file set is **pathspec-limited to `-- packages plugins`**, so `.llm/tools/**` can never
     enter it. This fully explains the fixes lane's observation: their PR also touched `packages/**`, so
     the scan *did* run — over the `packages`/`plugins` changed files only, never the `.llm/tools/` file
     carrying the new `as unknown as`.
  2. **`if ((${#args[@]}))` skips the scan entirely when the set is empty.** For a PR touching **only**
     `.llm/tools/**` — every PR in this rail — the step runs **no command** and reports success.

  And `quality:scan` runs from nowhere else: `ci.yml`'s `quality` job invokes `check:source-format`,
  `test:source-format`, `deno install`, `lint`, `fmt:check`, `docs:tagline:check`, `docs:accuracy` — not
  `quality:scan`. So both branches of the only caller are blind to `.llm/tools/**`: the PR branch by
  pathspec, the repo-wide branch by root list.

  So this lane's `.llm/tools`-only PRs have not been *under*-scanned; that gate has been executing **zero
  commands** and reporting success.
- **Why the probe mattered before writing #1403's acceptance.** #1403 is framed as a root-list problem.
  Adding `.llm/tools` to the roots fixes the repo-wide path and leaves the PR gate blind, because the PR
  gate never consults the roots — shipping that would produce another gate that looks covered and is not,
  the exact class #1403 exists to close, re-created by its own fix. Two acceptance properties added to
  #1403 (comment `5266602856`): a red-first fixture proving a `.llm/tools`-only diff actually executes the
  scan, and the empty-changed-set case failing closed or being reported as "not scanned" rather than green.
- **Actions taken:**
  1. Remaining rail PR bodies state what `quality:gate` does and does not cover instead of citing it flatly,
     and state intended scaffold skips as step counts ("step 2 Skipped by policy: success, step 10 skipped,
     intended") rather than as a bucket, which is a provable claim where `SUCCESS` is not.
  2. Routed into **#1403**'s triage list as a second, larger uncovered surface on the same gate — #1403
     names the `plugin-*-core` omission, and the fix for one is the fix for the other. Filed as a triage
     entry with the fixes lane's PR as provenance rather than as a duplicate issue; ownership offered back
     to them since they found it.
- **Adjacent read rule adopted from the same report:** a `scaffold-runtime` job reporting SUCCESS in a
  rollup means nothing on its own — the job always starts so its status reports, and the classifier
  short-circuits it via a step named "Skipped by policy". Only the **step count** distinguishes a real run
  from a short-circuit. This lane applies `ci:skip-e2e`/`ci:skip-scaffold` deliberately, so the intended
  skip is stated in the PR body and step counts are checked rather than buckets.

## D-29 — a third `quality:scan` failure mode, reproduced: a stale `base.sha` scans another lane's merged work

- **Severity:** architectural (the most dangerous of the three; single root cause shared with a second gate)
- **Recorded:** 2026-08-12, from the fixes lane's pushback on **my** misattribution, reproduced here
- **My error:** D-28 claimed the fixes lane's PR "also touched `packages/**`, so the scan ran over those
  files". **#1539 touches no `packages/**` files at all** — its whole diff is six `.llm/tools/` files
  (`git diff --name-only 5db37e7bb origin/pr-1539`). So neither mode explained a scan that ran over nine
  files. I had reasoned from a plausible mechanism instead of running the range.
- **Mode 3, reproduced exactly:** `code-quality.yml:39` computes its range from
  `github.event.pull_request.base.sha`, which for a never-updated branch is stale. #1539's was `cd24e1679`:

```text
$ git diff --name-only --diff-filter=ACMR cd24e1679 2a4102600 -- packages plugins    → 9 files
packages/cli/e2e/{suites/scaffold/capability-suites.ts,tests/presentation/suite-registry_test.ts}
packages/cli/src/public/features/root/public-command-tree_test.ts
packages/plugin-streams-core/{src/application/create-durable-stream.ts,
  src/application/durable-stream-producer-supervisor.ts, src/domain/producer-contract-v1.ts,
  tests/application/durable-stream-producer-contract_behavior_test.ts}
packages/sdk/src/{desktop/mod.ts,query-client/create-service-query-utils.ts}
```

  All already-merged foreign work — spot-verified against `main`: `capability-suites.ts` ← `d7e2b67b2`
  (#1536), `producer-contract-v1.ts` ← `8ff1bcb8f` (#1528), `desktop/mod.ts` ← `d8d0400ef` (#1526) — and
  **zero** of the nine appear in #1539's own diff. The gate scanned nine real files, found nothing, reported
  success, and inspected **zero lines of the PR under review**.
- **Why it is the worst of the three.** Mode 2 reports success having run *nothing* — visibly nothing to
  anyone reading the step. Mode 3 reports success having run *something substantial over the wrong input*,
  so the step log shows a genuine nine-file scan and looks **more** covered the more wrong it is. It
  degrades with PR age, which makes the gate **anti-correlated with risk**: the long-lived PR most likely to
  have accumulated a bad cast gets the least of its own code scanned.
- **Single root cause, two gates.** The same stale `pull_request.base.sha` broke evaluator prompt resolution
  on #1539 (addressed by #1552). One stale value, two independent gates producing confident false greens. A
  fix that only widens the pathspec still computes from the stale base.
- **#1403 acceptance updated** (comment `5266629043`) to three properties, replacing the two from D-28: the
  `.llm/tools`-only execution proof, the empty-set fail-closed, and a stale-base fixture asserting the
  scanned set equals the PR's own diff — with **merge-base** (or the PR's API file list) preferred over
  `pull_request.base.sha`.
- **The methodological lesson, which is mine.** I verified the *source* of modes 1 and 2 and then
  **reasoned** about which one explained the observed case instead of running the range that would have
  answered it. The peer ran the range. This lane has now made that mistake twice — asserting an absence
  without the probe that finds the presence (the sagas supersession row) and asserting a mechanism without
  the probe that identifies it (here). Both were caught by someone else executing the command I should have.

## D-30 — PR-E merged; `main`'s blocking quality gate green for the first time in nine pushes

- **Recorded:** 2026-08-12
- **Merge:** PR #1560 → `e67c1ba13`. #1530 auto-closed `COMPLETED`, `status:shipped`. All **seven** boxes
  truthfully ticked — 1–6 mirrored from structured evidence, box 7 verified **after** merge from the run it
  describes and ticked then, which is what `[post-merge]` exists for.
- **The headline result:** `code-quality-repo` on `main` at `e67c1ba13` is **success**, the first green in
  **nine** consecutive push-to-main runs (streak from `b3dc006e8`). Independently reproduced at merged main:
  `deno task quality:scan:repo` → exit 0.

```text
completed/success   e67c1ba13   12:23:53Z   <- this merge
completed/failure   d558f9ab2   12:21:08Z
completed/failure   59e435c5d   12:03:58Z
```

- **#1537 landed** at `d558f9ab2` — the docs lane's fenced-TS extractor. So **rail `R-10`'s primary path is
  available**: PR-D consumes that extractor rather than taking the fallback, and #1549's docs-fence box stays
  in 0.0.6 rather than moving. The stated fallback was never needed, which is the outcome that having stated
  it in advance bought.
- **Lane status:** #1436, #1415, #1530 closed. Remaining in 0.0.6: **#1403** (PR-B, next), **#1380** (PR-C),
  **#1549** (PR-D). #1378 and #1545 in 0.0.7.

## D-31 — Fable prohibited for this lane; two review bindings moved to their documented Opus fallbacks

- **Severity:** significant (route change), **minor in effect** (no dispatch was pending on Fable)
- **Recorded:** 2026-08-12, owner directive — Fable fully prohibited for the 0.0.6 lane until explicitly
  lifted (95% quota until Saturday). No Fable for planning, research, implementation, review or evaluation;
  if a configured route would select Fable, stop that dispatch and report it.
- **Nothing to stop.** Zero live sessions in this lane at the time of the directive (`agentic:codex-status`
  filtered to this lane's worktrees → 0). PR-E was already merged; no Fable dispatch had ever been made in
  this run — the `deep_analysis` lane was carried as "optional" and never used.
- **Three bindings named Fable; each rebound to the route `lane-policy.md` already documents:**

| Lane | Was | Now | Why this is the sanctioned substitution |
| --- | --- | --- | --- |
| `review_codex` (PR-C, PR-D) | Fable 5 · low | **Opus 5 · low** | The § Review-pairing ladder lists Opus 5 · low as this lane's token-limit fallback |
| `review_codex_complex` | Fable 5 · medium | **not used** | PR-D dropped to Sol·medium in the rescope, so it pairs on `review_codex`. Had it stayed Sol·high the fallback is Opus 5 · medium |
| `deep_analysis` | Fable 5 · medium | **Opus 5** if needed | Kept Claude-family deliberately — see below |

- **The invariant that must not be lost in the substitution.** `lane-policy.md` is explicit that the
  Codex-review lanes fall back to **Claude · Opus** rather than to a Codex model, "so an OpenAI-authored
  change is never reviewed by an OpenAI-family model — opposite-family review is never traded away for a
  token-limit fallback". Every substitution above is Claude-family for exactly that reason. The tempting
  cheap move — reviewing Codex work with Codex Sol because Claude capacity is constrained — is the one thing
  the policy forbids, and it is worth naming so a future capacity squeeze does not quietly take it.
  Note `deep_analysis`'s *published* fallback is Codex Sol · high; that is fine for orchestrator analysis in
  general, but in this lane deep analysis would be analysing **Codex-authored** artifacts, so it stays on
  Opus.
- **The automatic evaluator is unaffected, verified at source rather than assumed.**
  `openhands-phase-eval.yml:103-106` maps only `eval:model:minimax` → `minimax-m3`,
  `eval:model:deepseek` → `deepseek-v4-flash-0731`, `eval:model:qwen` → `qwen3.8-max`, and throws on any
  unknown label. **There is no Fable path.** So PLAN-EVAL and IMPL-EVAL continue on the automated route
  untouched — as already observed: MiniMax M3 for PLAN, DeepSeek V4 Flash 0731 for IMPL.
- **Effect on the remaining rail:** none on capability. PR-B is `light_implementation` (Sol · low), whose
  pairing is `review_codex_light` → **Opus 5 · high**, which never involved Fable. PR-C and PR-D now review
  on Opus 5 · low. Implementation stays Codex; formal evaluation stays automated.

## D-32 — PR-F (#1566): the reported 404 was a symptom; the defect was bookkeeping able to fail dispatch

- **Severity:** significant (structural fix beyond the reported symptom)
- **Recorded:** 2026-08-12
- **Reported defect:** `openhands-phase-eval.yml`'s status cleanup removed `status:*` labels read from the
  **event-payload snapshot**, so a concurrent dispatch's `removeLabel` returned `404 Label does not exist`
  and reddened a run whose evaluation had succeeded. Verified before filing: runs `31596291515` (red) and
  `31596293364` (green) two seconds apart on PR #1541 head `0503991ab`, and **exactly-once held** — one
  trigger marker, `generation=29339092792`. Filed as **#1566**.
- **Two findings from the orchestrator review, the second larger than the issue:**
  1. **Bootstrap self-block.** The fix imports a new module from a **trusted base checkout**, and that module
     is absent on `main`, so the introducing PR's own transition step threw `MODULE_NOT_FOUND`, aborted the
     job, and the dispatch step never ran — no evaluator, so no PASS, so #1567 could not merge by its own
     change. Explicitly **not** fixed by falling back to the PR-head copy, which would restore the very
     escalation the trusted checkout prevents (this job holds `issues: write`).
  2. **The real defect is structural.** The job exists to dispatch exactly one evaluator; the label
     transition is bookkeeping. A bookkeeping failure aborted the job and prevented the dispatch — the same
     pathology as #1566 one level up, and a red run implying dispatch had failed when it had not. Fixing only
     the 404 would have left that intact for the next hiccup.
- **Resolution:** both bookkeeping steps are `continue-on-error`; the transition still **rethrows** so its
  outcome is truthfully `failure`; a dedicated step records actor / PR / head / **trusted-checkout outcome** /
  bounded reason to `GITHUB_STEP_SUMMARY`; dispatch is gated only on `!cancelled()` and the chain-token check.
  Non-fatal **and** non-silent, with the checkout outcome reported separately so the bootstrap case is
  distinguishable from a permissions failure.
- **Consequence worth noting:** the fix retires its own bootstrap problem. #1567's ready flip now fails one
  step, records the attributed diagnostic, and dispatches anyway — so **the PR demonstrates its own fix on its
  own CI run**, and the `labeled`-path workaround is unnecessary. It self-heals on merge.
- **Two unprompted improvements by the implementer, both accepted:** the trusted-base checkout with
  `persist-credentials: false` (and pinned to `base.ref`, the branch tip, not the recorded `base.sha` — the
  #1552/#1564 lesson applied without being told), and sanitisation of the failure reason before it reaches a
  Markdown step summary.
- **Epistemic honesty, self-reported:** the new workflow-policy test extracts named step blocks and asserts
  the declared policy — static evidence that the YAML *declares* independence, not that the runner honours it.
  Recorded as such in the slice `drift.md` rather than counted as behavioural coverage. The runner behaviour is
  proven by #1567's own run.
- **Acceptance:** box 1 stands as worded — the concurrent-removal case is handled inside the caller so the
  transition completes normally; the non-fatal path applies only to other failures. The implementer defended
  the stronger reading with a reason instead of stretching the box.

## D-33 — the two steps were never independent: dispatch depends on the transition through GitHub's event history

- **Severity:** significant (falsifies my own review claim and the slice's independence test)
- **Recorded:** 2026-08-12, run `31598386001`, PR #1567 head `5b4d8caf5`
- **What I predicted:** that `continue-on-error` on the transition step would let dispatch proceed, so the
  bootstrap `ERR_MODULE_NOT_FOUND` would be cosmetic and the PR would demonstrate its own fix. **Wrong.**
- **What actually happened, step by step:**

```text
4. success   Check out trusted phase-eval scripts
5. success   Enter IMPL-EVAL status on ready transition        (conclusion success, outcome failure)
6. success   Record attributed IMPL-EVAL status-transition failure   <- the diagnostic fired correctly
7. FAILURE   Resolve and dispatch exactly one evaluator
             Error: No labeled-event generation found for status:impl-eval.
```

  So the `continue-on-error` design worked exactly as built — the transition failed truthfully, the attributed
  diagnostic fired, and **dispatch did run**. Dispatch then failed on its own.

- **The real dependency, and why it was invisible.** Dispatch resolves
  `expectedStatus = phase === 'plan' ? 'status:plan-eval' : 'status:impl-eval'` and then requires a
  **labeled-event generation** for it. That generation only exists if the label was actually applied,
  producing a `labeled` event. The transition failed, so `status:impl-eval` was never applied, so no
  generation existed, so dispatch threw.

  The two steps are therefore **not independent**: dispatch has a runtime data dependency on the transition,
  mediated through **GitHub's event history** rather than through step `if:` conditions. The implementer's
  claim that dispatch "has no dependency on checkout or transition outcomes" was true of the *conditions* and
  false of the *data flow*, and my review repeated it.
- **This is exactly the gap the slice's own test could not close, and the implementer said so.** Its
  workflow-policy test extracts named step blocks and asserts *declared* independence; it flagged that as
  "static workflow-policy evidence, not a simulation of runner semantics". That caveat turned out to name the
  decisive limitation. A test that asserts what the YAML declares cannot see a dependency carried in
  repository state.
- **My error, for the third time this session:** I traced the step conditions, saw no dependency, and asserted
  dispatch would *succeed* — reasoning one step past what I had verified. The first two were asserting an
  absence without the probe that finds the presence (the sagas supersession record) and asserting a mechanism
  without the probe that identifies it (the stale-base attribution). Same shape each time, and each time the
  missing step was cheap: read the run, run the range, trace the data flow.
- **Owner direction:** return #1567 to draft/`status:impl` (done), fix the bootstrap shape before retry —
  either keep the trusted workflow **self-contained** for the first landing (inline the narrow
  live-label/idempotent cleanup, with its helper contract still independently tested) or split a helper-only
  landing ahead of workflow adoption. No manual OpenHands trigger, no Fable.
- **Chosen: self-contained first landing.** It removes the import, so there is no bootstrap problem to work
  around rather than a smaller one; the helper and its tests still land so acceptance boxes 2–5 stay provable;
  and it is one PR rather than two. A follow-up can switch the workflow to import the helper **once it is
  reachable from trusted `main`**, deleting the inline copy — the ordering that was wrong here, done in the
  right order.
- **Declining the offered IMPL-EVAL waiver.** The owner offered `impl-eval:skip` under the small-deterministic
  waiver. **Not taking it.** This PR changes the evaluator dispatch path itself, and `drift.md` D-14 records
  this lane's position that a PR changing gate semantics is exactly the class needing an independent pass — a
  position that has now been vindicated twice on this PR alone, since both the bootstrap self-block and this
  event-history dependency were found by running the thing rather than reading it. With the import removed the
  transition succeeds, the label is applied, the generation exists, and automatic DeepSeek runs exactly once.
  The waiver would save one run and remove the only check that has caught anything here.

## D-34 — Canary.3 cut ownership sits with the runtime lane; this lane does not cut and does not compete

- **Severity:** minor (coordination), supersedes part of **D-26**
- **Recorded:** 2026-08-12, owner directive
- **Policy:** the **runtime** lane alone owns the Canary.3 cut, after merged **#1558**. No competing release is
  to be started. This lane continues its assigned issues.
- **Effect on D-26.** D-26 recorded that 0.0.6 may cut intermediary canaries and that this lane **reports**
  merged gate-trust checkpoints to the fixes/release coordinator. The reporting duty stands; what changes is
  **who cuts**. D-26 pointed reporting at the fixes lane, which had described itself as release-checkpoint
  coordinator and was assembling a cut recommendation for the owner. Canary.3 authority is the runtime lane's.
- **This lane's position is unchanged and was never at risk:** `drift.md` D-3 recorded on day one that this
  lane declares no canary point and runs no publish step. Nothing to stand down.
- **Action taken to prevent an accidental competing process:** notified the fixes lane that Canary.3 cut
  authority is the runtime lane's, because they had explicitly told me they would bring a
  first-coherent-checkpoint recommendation to the owner once #1539 landed — and #1539 **has** landed
  (`3c9dc1f39`). Without that note, two lanes could arrive at the owner with cut recommendations, which is the
  exact collision the directive guards against. Payload facts were sent to them; the cut decision is not
  this lane's to route.

## D-35 — #1566 closed; the deliberate follow-up is now unblocked, in the order that failed the first time

- **Recorded:** 2026-08-12
- **Merge:** PR #1567 → `b79eca5d6`, closing **#1566** (`CLOSED/COMPLETED`, `status:shipped`). Merged by the
  release coordinator during a Claude 529 outage on this session. **Independently re-verified here rather than
  accepted:** `origin/main` contains `b79eca5d6`; `.github/scripts/phase-eval-status.mjs` is present on main;
  #1566 and PR #1567 both carry `status:shipped`.
- **The follow-up is now valid, and only now.** PR #1567 landed the workflow carrying a **transcription** of
  the helper rather than importing it, because importing a module absent from trusted `main` is what made the
  first attempt self-block (`ERR_MODULE_NOT_FOUND` → no `status:impl-eval` → no labeled-event generation → no
  evaluator). The helper is now reachable from trusted `main`, so a follow-up may switch the workflow to
  import it and delete the inline copy. Same two stages, in the order that works.
- **Worth keeping as the general shape:** a change that introduces a trusted-path dependency cannot also be
  the change that first consumes it. The consuming edit has to come after the dependency is on the protected
  branch. That is not a quirk of this workflow — it applies to any `getContent`/checkout-from-base pattern,
  and this lane paid one full ready-flip cycle to learn it.
- **Lane state:** #1436, #1415, #1530, #1566 **closed**. Remaining: **#1403** (PR #1570), **#1380**, **#1549**.
