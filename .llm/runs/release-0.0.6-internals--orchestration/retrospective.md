# Retrospective — 0.0.6 chores/internals lane

Written at lane close by the orchestrating session. Draft completed while PR #1596's IMPL-EVAL was running;
final merge figures filled in at close. Measured, not celebratory: the useful output of a run like this is the
list of things it got wrong early enough to fix, plus the assumptions it destroyed.

## What the lane actually delivered

Six PRs closing seven issues, all against `main`, no umbrella implementation. The three results worth naming
are the ones that changed what a gate *means* rather than adding one:

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

## My own supervision loop produced two false greens (D-42)

While auditing other people's gates for reporting success without executing, `agentic:gh-watch` did exactly
that to me twice inside five minutes — once rejecting a `--` separator, once exiting `4` on a missing token —
and both times the harness task notification read `exit code 0`, because I had wrapped the call in a pipe and
was reading the *pipeline's* status. I had the real exit code in my own log and read the notification instead.

**A watcher is a wake-up mechanism, never evidence.** Verdicts get confirmed by matching the verdict comment
to the evaluated head, which is also the fix for the separate defect where `gh-watch` reported a *superseded*
verdict as terminal in 0s, three times (D-24).

## What the delegation model got right

**Briefing the gate as a deliverable, with an explicit instruction to escalate rather than idle, worked — and
what it caught was mostly me.** Escalation found the orchestrator's brief or plan wrong rather than the code
**six** times:

| # | What the implementer caught | Consequence had they idled or complied |
| --- | --- | --- |
| 1 | Gate 1 missing `--allow-write` (9 tests use `Deno.makeTempDir()`) | idle at a red gate |
| 2 | Same gate still missing `--allow-run` | idle again |
| 3 | Asset-barrel gate absent from the brief | a red `ci.yml quality` (later cost PR-E a CI cycle) |
| 4 | Rail sequencing incoherent: the 36-root expansion (PR-B) is what surfaces A14's false positives, but A14 was scheduled in PR-C | **would have shipped a red `arch:check`** |
| 5 | #1436's prescribed fix was a no-op — `\b` was already present and *is* the cause, since `-` is a non-word character | a "fix" that changed nothing, with tests written to pass |
| 6 | PR-D's brief simultaneously required the generator's `git status` clean, forbade touching the file it regenerates, required all docs companions scanned, and forbade fixing what that surfaced | self-contradictory; no compliant implementation exists |

Six for six, the escalation was correct and I amended. An implementation lane that stops and says "your brief
is wrong" is worth more than one that produces something plausible from a contradictory spec — and #5 is the
clearest case: complying would have produced a green test suite around a fix that fixed nothing.

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

## Assumptions this run destroyed

1. **"`status:ready-merge` does not trigger `ci.yml`"** — false, and I had propagated it. `labeled` *is* in
   `pull_request.types`; the workflow's live reads observe the label. Corrected in the docs.
2. **"Local git ancestry is authoritative"** — false in this shared checkout, which is shallow. GitHub's
   compare API is the canonical source for ancestry questions.
3. **"A green `deno task quality:gate` covers this PR's diff"** — false for any `.llm/tools`-only PR, which
   was *every PR in this rail*. Cited as coverage, it is a false green.
4. **"One evaluator pass per head is enough"** — true only if the head does not move. Any required fix
   invalidates the verdict.

## What I would do differently

- **Check before publishing a rebuttal.** Especially when contradicting an evaluator, and most especially from
  the session that holds merge authority — the asymmetry means my confident wrong answer travels further than
  theirs.
- **Verify the environment before deriving evidence from it.** `--is-shallow-repository` costs nothing and
  would have prevented the run's worst error outright.
- **When a lesson is recorded, apply it to the *next* brief mechanically**, not from memory — D-22 was written
  down and still reproduced two PRs later.
- **Read tool output, not task notifications.** Two false greens in five minutes came from that single habit.
