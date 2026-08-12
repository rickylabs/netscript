# Retrospective — 0.0.6 chores/internals lane

Written at lane close by the orchestrating session. Measured, not celebratory: the useful output of a run like
this is the list of things it got wrong early enough to fix, plus the assumptions it destroyed.

**Final state.** Six PRs merged, seven issues closed (#1436, #1415, #1530, #1566, #1403, #1380, #1549), all
directly against `main`, no umbrella implementation. The four owned issues (#1380, #1403, #1549, #1566) are each
`CLOSED/COMPLETED`, milestone 0.0.6, exactly one `status:shipped`. 49 drift entries. Verified on merged `main`
`c7fc45318`: `quality:scan:repo` exit 0 `allowCount` **8**, `arch:check` 0, `arch:check:repo` 0, import-closure
guard 3/3.

## What the lane actually delivered

The three results worth naming are the ones that changed what a gate *means* rather than adding one:

- **`main`'s `code-quality-repo` went green after nine consecutive red push runs** (PR-E/#1530). It had been
  red long enough to be background noise, which is the state in which a gate stops being read.
- **`arch:check` went from 16 hand-listed roots to 36 discovered ones** (PR-B/#1403), and
  **`arch:check:repo` went green after seven weeks `DEBT_ACCEPTED`** (PR-C/#1380).
- **`quality:gate` had three independent coverage defects, on one line** (PR-B): a `-- packages plugins`
  pathspec that could never see `.llm/tools/**`, an `if ((${#args[@]}))` that reported success having run no
  command, and two-dot diff semantics that on PR #1539 enumerated nine already-merged foreign files and zero
  lines of the PR under review. Every PR in this rail was `.llm/tools`-only, so the gate had been reporting
  success on its own repairs.

The last point is the lane's thesis in miniature: **a gate that reports success without executing is worse
than a red one**, because a red gate gets investigated and a false green gets trusted.

And then the lane's final PR proved the thesis against the lane itself. My asset-freshness gate —
`gen:assets-barrel` then assert an empty `git status` — **passed twice, including as an idempotence proof, while
the installed consumer bundle could not resolve its own import**. The result was true and answered the wrong
question: it proves the barrel is *current with respect to the manifest*, never that the bundle is *complete with
respect to its own imports*. CI caught it (`init-agent_test.ts:580`), the formal IMPL-EVAL named it independently
as F2, and the fix is the durable one — a generic import-closure guard with a negative control, so the next tool
that grows an import is caught without anyone remembering.

**The barrel gate is two gates, and I had only ever written the first.** Currency and closure. Only closure
executes what a consumer actually does.

`allowCount` fell **10 → 8** on PR-D — the first downward movement of the run. Every prior change to the
allowance budget was upward or flat. A budget that only ratchets up is not a budget.

## The mistake that matters most

On PR #1585 an evaluator returned `FAIL_FIX` saying a doctrine claim was false. **I rebutted it publicly, with
three probes, and I was wrong.** All three probes ran in a **shallow** checkout: `git rev-parse
--is-shallow-repository` → `true`, so the "root commit" I cited (`317e4b509`) was the shallow boundary, whose
canonical parent is `6a4ca79de`. GitHub's compare API showed both commits as ancestors
(`merge_base=0ef13de359b`, `ahead_by=2050`). The owner corrected me; I withdrew the rebuttal publicly, fixed
the prose, tests, and box evidence, and recorded the trap.

The lesson is sharper than "shallow clones lie":

> **Independence of method is not independence of premise.** Three different commands sharing one corrupted
> premise produce three confirmations and zero information. I mistook agreement among my own probes for
> corroboration.

The aggravating factor is that I posted the rebuttal *before* checking, so for 20 minutes the PR carried
confident, false provenance written by the session holding merge authority. Withdrawing it publicly was the
minimum, not a remedy.

## My own supervision loop produced four false verdict signals (D-42, D-44, D-45, D-48)

While auditing other people's gates for reporting success without executing, `agentic:gh-watch` did exactly
that to me twice inside five minutes — once rejecting a `--` separator, once exiting `4` on a missing token —
and both times the harness task notification read `exit code 0`, because I had wrapped the call in a pipe and
was reading the *pipeline's* status. I had the real exit code in my own log and read the notification instead.

**A watcher is a wake-up mechanism, never evidence.** Verdicts get confirmed by matching the verdict comment
to the evaluated head, which is also the fix for the separate defect where `gh-watch` reported a *superseded*
verdict as terminal in 0s, three times (D-24).

It got worse before it got better, and the pattern is mine rather than the tool's:

| # | Signal | What it actually was |
| --- | --- | --- |
| D-42a | `gh-watch` "success" | `--` separator rejected; the watch never started |
| D-42b | `gh-watch` "success" | exit **4**, no token; masked because I read a pipeline's status |
| D-44 | `gh-watch` "TERMINAL PASS after 724s" | **my own `[PHASE: REVIEW] [VERDICT: PASS]` comment**, matched as the evaluator's verdict, with zero IMPL-EVAL comments on the PR |
| D-48 | my replacement poller "TERMINAL FAIL_PLAN" | a marker from one comment paired with a verdict from **another**, on a run still `"conclusion":"running"` |

D-44 is the dangerous one: it manufactured *authority*. Consumed, I would have run the pre-merge gate believing
an independent evaluator had passed the head, and merged **on my own certification** — the harness's single
unconditional prohibition — with a reproducible consumer-facing defect in the diff. What made it catchable was
the owner reporting the run as cancelled, which contradicted the watcher. On its own it was entirely plausible:
724s is a believable duration and PASS a believable verdict.

D-48 is the humbling one. I wrote it **immediately after** recording the rule against exactly that error. Four
false verdict signals in one afternoon, three from a tool and one from the replacement I built to be more careful.
The common defect is a detector that conflates independent fields and then reports confidence.

**Rule that survived:** parse per-comment; require the marker's `run_id`, its terminal `conclusion`, and the
verdict to come from the **same** comment body, and the evaluated head to equal the head under consideration.
Never grep two facts out of a concatenated blob and treat them as related — that is not a heuristic, it is a
coincidence generator.

## What the delegation model got right

**Briefing the gate as a deliverable, with an explicit instruction to escalate rather than idle, worked — and
what it caught was mostly me.** Escalation found the orchestrator's brief or plan wrong rather than the code
**seven** times:

| # | What the implementer caught | Consequence had they idled or complied |
| --- | --- | --- |
| 1 | Gate 1 missing `--allow-write` (9 tests use `Deno.makeTempDir()`) | idle at a red gate |
| 2 | Same gate still missing `--allow-run` | idle again |
| 3 | Asset-barrel gate absent from the brief | a red `ci.yml quality` (later cost PR-E a CI cycle) |
| 4 | Rail sequencing incoherent: the 36-root expansion (PR-B) is what surfaces A14's false positives, but A14 was scheduled in PR-C | **would have shipped a red `arch:check`** |
| 5 | #1436's prescribed fix was a no-op — `\b` was already present and *is* the cause, since `-` is a non-word character | a "fix" that changed nothing, with tests written to pass |
| 6 | PR-D's brief simultaneously required the generator's `git status` clean, forbade touching the file it regenerates, required all docs companions scanned, and forbade fixing what that surfaced | self-contradictory; no compliant implementation exists |
| 7 | The correction brief's "generator's own suite" command was not a suite selector — it swept **724** tests, two of which need `--allow-net` | exit 1 on unrelated pre-existing tests; either a false red or a silent substitution of a narrower command |

Seven for seven, the escalation was correct and I amended. An implementation lane that stops and says "your brief
is wrong" is worth more than one that produces something plausible from a contradictory spec — and #5 is the
clearest case: complying would have produced a green test suite around a fix that fixed nothing.

**Three of the seven were permissions or targets on a test command I wrote without running it.** That is not bad
luck, it is a specific habit: I authored gate commands from memory of what the repo's commands look like. Verifying
a command before briefing it costs seconds; each of these cost a round trip and one risked a false red.

Case 3 has an uncomfortable coda: I recorded the asset-barrel coupling as D-22 after it cost PR-E a cycle,
then **copied the gate into PR-D's brief without copying the boundary**, reproducing the contradiction I had
already paid to learn. Writing a lesson down is not the same as applying it.

## Process findings worth keeping

- **`box-index` beats exact box text, structurally.** `acceptanceCheckboxes` keeps only each checkbox's first
  raw line with backticks preserved, so any box that *wraps in the issue body* is unmatchable by exact text —
  and the author cannot see the wrapping. Five of #1530's six boxes wrapped, so five of six keys were
  unmatchable by construction. This cost PR #1560 a full failed IMPL-EVAL cycle before the cause was clear.
- **Re-evaluate after a required fix; never reason around a stale PASS.** PR #1560's *first* verdict PASSed a
  head whose close-gate was red; the re-run's `FAIL_FIX` caught a real defect. Consuming the first verdict
  would have merged a red gate. The rule paid for itself the one time it was tested.
- **Label, then re-run — never push.** `status:ready-merge` does trigger `ci.yml` via `labeled`, but where a
  re-run is needed, a push would move the head and invalidate the IMPL-EVAL verdict.
- **Pre-validate the evidence mapping locally.** The mirror's `--dry-run` short-circuits on the missing
  `status:ready-merge` label *before* parsing, so it cannot validate a mapping pre-label; running
  `validateEvidenceMapping` directly against the live PR body and issue boxes can, and catches #1560's failure
  class without a CI round trip.
- **Distinguish a flake from a defect before touching anything.** PR-D's `scaffold-static` failure was
  `Error: socket hang up` — infrastructure. Re-run, do not investigate the diff, and do not push.

## Infrastructure is a first-class failure mode, and it cost three outcomes

A `socket hang up` window between 16:40Z and 17:54Z killed three unrelated jobs — `scaffold-static`, the
evaluator's `setup-deno` bootstrap, and `close-gate`. All three died **before producing any work product**, which
is exactly what separates transport from a finding: no test output, no scan result, no verdict body.

The middle one is the expensive one: it **consumed the single authorized evaluation generation** and delivered
`verdict:NONE`. That forced a distinction worth keeping — **"the generation was spent" and "an evaluation was
delivered" are different facts, and only the second licenses a merge decision.** A policy that counts triggers
rather than verdicts eventually merges on a flake.

Recovery rules that held: read a red as transport only when the job produced nothing; recover with `gh run rerun`,
**never a push**, because a push moves the head and invalidates the verdict bound to it; `--failed` is refused
while any job in the run is still in flight; and check for partial mutation before re-running a job that runs
*after* the acceptance mirror (#1549 was confirmed 0/7 ticked, which is what made a plain re-run safe rather than
a guess).

## Assumptions this run destroyed

1. **"`status:ready-merge` does not trigger `ci.yml`"** — false, and I had propagated it. `labeled` *is* in
   `pull_request.types`; the workflow's live reads observe the label. Corrected in the docs.
2. **"Local git ancestry is authoritative"** — false in this shared checkout, which is shallow. GitHub's
   compare API is the canonical source for ancestry questions.
3. **"A green `deno task quality:gate` covers this PR's diff"** — false for any `.llm/tools`-only PR, which
   was *every PR in this rail*. Cited as coverage, it is a false green.
4. **"One evaluator pass per head is enough"** — true only if the head does not move. Any required fix
   invalidates the verdict.
5. **"A regenerated, clean generated asset proves the generated surface is sound"** — false. It proves currency
   against the manifest, nothing about import closure. The shipped guard is what makes it true going forward.
6. **"A cancelled evaluator run produced no verdict"** — false. `conclusion:cancelled, state:not-run` still
   carried a complete `FAIL_FIX` via `verdict_source: summary-file`, published by **editing an existing comment
   in place**. My detection rule missed it and I dispatched an unnecessary fallback as a result.
7. **"Evidence pinned to a commit hash stays valid"** — false past the next history rewrite. A rebase orphaned
   all six hashes the PR body cited, including gate evidence that mirrors into the issue and outlives the PR.

## What I would do differently

- **Check before publishing a rebuttal.** Especially when contradicting an evaluator, and most especially from
  the session that holds merge authority — the asymmetry means my confident wrong answer travels further than
  theirs.
- **Verify the environment before deriving evidence from it.** `--is-shallow-repository` costs nothing and
  would have prevented the run's worst error outright.
- **When a lesson is recorded, apply it to the *next* brief mechanically**, not from memory — D-22 was written
  down and still reproduced two PRs later.
- **Read tool output, not task notifications.** Two false greens in five minutes came from that single habit.
- **Re-fetch before concluding a thing does not exist.** "No verdict" was wrong because the verdict arrived by
  editing a comment I had already read. An absence proved by one stale query is not an absence, and here it cost
  an unnecessary fallback dispatch.
- **Verify a command before briefing it as a gate.** Three of seven brief errors were test-command permissions or
  targets written from memory.

## What I would keep unchanged

- **Escalate-don't-idle in every brief.** Seven corrections, all of them mine, none discovered at merge time.
- **Re-execute the decisive claim rather than relaying it.** Every substantive defect in this lane — the no-op
  fix, the coverage defects, the closure gap — was found by running something, never by reading it.
- **Re-evaluate after a required fix, and bind the verdict to a head.** It caught a red close-gate on PR #1560 the
  one time it was tested, and it is the reason the flake window could not smuggle a stale PASS into a merge.
- **`box-index` over exact box text**, and pre-validating the mapping locally before spending a CI round trip.
