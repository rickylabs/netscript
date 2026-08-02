# PLAN-EVAL — fix-1016-scaffold-tsconfig--project-boundary

Evaluator: Opus 5 supervisor (owner-waived open-model lane, 2026-08-01)

Generator: Codex / GPT-5.6 Sol (low). Generator and evaluator are different sessions and
different model families, so the harness independence invariant is satisfied.

Reviewed: `plan.md`, `research.md`, `context-pack.md`, `drift.md`, `worklog.md` at commit
`2032a4154`, against issue #1016 and the baseline at `3ab64720f`.

## Plan-Gate checklist

| # | Row | Verdict | Evidence |
| - | --- | --- | --- |
| 1 | Problem restated from the issue, not from the brief | PASS | `research.md` §Re-baseline re-derives against `main@3ab64720f` and adds a fact the issue did **not** state: the Vite half fails on the **first SSR request**, not at process start (finding 5). That is independent verification, not restatement. |
| 2 | Root cause verified before fixing | PASS | Findings 1–3 name the two writers that omit the file and correctly exclude `tsconfig.apphost.json` as a non-terminator. Finding 4 reproduces the failure; finding 6 shows the prototype fixes it. Cause matches my brief — see Adversarial row A. |
| 3 | Scope bounded to the issue | PASS | `## Non-Scope` explicitly excludes Deno compiler options, Vite config, Fresh source, Prisma behaviour, and existing projects. No public-surface change (`research.md` §jsr-audit: exports unchanged). |
| 4 | Content decisions are empirical, not aesthetic | PASS | D1/D2 are backed by prototype runs (findings 6–8), not by taste. This was the single largest risk in my brief and the plan resolved it the way the brief demanded. |
| 5 | Deno-toolchain non-regression addressed | PASS | Finding 8: `deno task check` exits 0 both with and without the configs, same generated project. Risk register carries it as a standing watch. |
| 6 | Editor/tsserver overreach addressed | PASS | D1/D2 both use `files: []` with no `include`, and the risk register names first-run editor errors as the risk being mitigated. This answers hazard 2 of the brief. |
| 7 | Bookkeeping correctness | PASS | `## Hidden Scope` item 1 requires create/skip counts to cover both files on force and non-force paths; validation order 1 exercises it. |
| 8 | `.gitignore` does not swallow the new files | PASS | Finding 9 checked `gitignore.template` directly. |
| 9 | Test surfaces identified | PASS | The four test files from the brief are in scope, plus the semantic `extends`-absence assertion. AP-18 row commits to parsing JSON rather than snapshotting. |
| 10 | Validation ladder is scoped, ordered, cheapest-first | PASS | Orders 1–4 scoped wrappers, then quality/JSR, then the consumer A/B, then the expensive `scaffold.runtime` gate **once** at order 8. Matches repo guidance. |
| 11 | Doctrine/archetype/debt | PASS | Archetype 6 correctly selected; no new or deepened debt claimed, and the claim is plausible — the change adds two Tier-1 generators beside existing peers and introduces no abstraction. |
| 12 | Acceptance box 3 fully discharged | **CONDITIONAL** | See below. This is the one row I will not mark clean. |

## Adversarial pass on my own framing

**A. Did I hand it the answer and get it back unexamined?** Partly. My brief asserted the cause and
named the two writers, so rows 2 and 3 were pre-framed by me. The plan is not merely echoing: it
re-derived against `main`, and finding 5 corrects the issue's implied model of the Vite failure
(request-time, not startup). If the plan had returned only my own words I would have failed it. It
did not.

**B. The `files: []` decision deserves more suspicion than the plan gives it.** "Empty file set"
is an unusual shape and it is not obvious a priori that Prisma's and Vite's config resolution stop
at a config that claims no files — a resolver could plausibly skip it and keep walking. The plan
does not reason about this; it measured it (findings 6–7), which is the stronger move. I accept it
**on the evidence**, and note that if the implementation cannot reproduce those two prototype
results, D1/D2 must be reopened rather than shipped on the plan's authority.

**C. Acceptance box 3 — the real weakness, and it is mine.** The issue's third box says
"**Test:** place a `tsconfig.json` with an unresolvable `extends` in the parent directory …".
The plan's open-decision sweep marks the automated full reproduction "safe to defer" and relies on
unit tests plus a manual A/B. My brief invited exactly that softening ("if the dev-server half can
only be evidenced by a manual run, say exactly that"). Judging the plan rather than my framing: the
deferral is explicit, reasoned, and recorded in the sanctioned place, and the unit tests do lock the
load-bearing property (`extends` absent, both files emitted). That is enough to proceed — but not
enough to tick the box silently.

**Binding conditions on this PASS:**

1. The manual A/B must be captured **verbatim** in the PR body — failing "before" and passing
   "after", for **both** `db generate` and an SSR HTTP request against `/`. Vite "ready" output is
   not acceptable evidence; only a response to a real request is (finding 5 is the reason).
2. Acceptance box 3 must be reported as **evidenced by manual reproduction plus unit-level property
   tests**, not as covered by an automated end-to-end test. If only the `db generate` half can be
   evidenced, box 3 stays unticked.
3. If either prototype result (finding 6 or 7) fails to reproduce during implementation, stop and
   record drift rather than adjusting the config until something passes.

## Verdict

**PASS** — subject to the three binding conditions above.

The plan's central strength is that its two contested decisions were settled by measurement before
Plan-Gate rather than argued. Its one weakness is a deferral I invited, which is contained by
requiring the evidence to be shown rather than summarised.
