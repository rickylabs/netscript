# PLAN-EVAL — fix-1004-canary-republish--same-semver

Evaluator: Opus 5 supervisor (owner-waived open-model lane, 2026-08-01)

The `drift.md` entry "Local formal evaluator unavailable" is superseded: the owner waiver of
2026-08-01 routes PLAN-EVAL and IMPL-EVAL for the 0.0.3 fix train to the Opus supervisor. Generator
(GPT-5.6 Sol) and evaluator (Opus 5) are different sessions and different model families, so the
independence invariant holds. `OPENROUTER_API_KEY` is not required and is not a blocker.

## Plan-Gate checklist

| Box                          | Verdict                   | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current | PASS                      | `research.md` re-baselines against `origin/main` `3ab64720f`. Spot-checked finding 3 myself: `github-release.ts:167` `verifyGreenCanaryPair` reads the status on `HEAD` first and only falls back to `HEAD^` under `isExactVersionReplacement` — so a republish run dispatched at the tag commit does record pair evidence on the right SHA. Finding 2 spot-checked at `publish-workspace.ts:66` (`deno publish --allow-dirty`, root workspace publish) and `run-publish.ts` (delegates unchanged). |
| Decisions locked             | PASS                      | `plan.md` D1–D4 each carry a rationale. D2 correctly refuses the vacuous "checkout the tag" variant.                                                                                                                                                                                                                                                                                                                                                                                                |
| Open-decision sweep          | PASS                      | Both open items (new task vs direct invocation; priority label) are resolved in-plan; neither forces rework if deferred. My own sweep found one further decision the plan does not resolve — see FAIL item 1 — and it _would_ force rework, because it changes the guard's contract and its tests.                                                                                                                                                                                                  |
| Commit slices                | PASS                      | `worklog.md` § Commit Slices: 2 ordered slices, each naming gate and files. Under 30.                                                                                                                                                                                                                                                                                                                                                                                                               |
| Risk register                | PARTIAL → see FAIL item 1 | `plan.md` risk register lists four risks. The "Same commit but dirty checkout" row states a mitigation that does not hold.                                                                                                                                                                                                                                                                                                                                                                          |
| Gate set selected            | PASS                      | `plan.md` § Validation Plan rows 1–5: fmt, scoped lint, `run-deno-check.ts --root .llm/tools/release --ext ts`, the two named test files, manual release-diff review. Correctly excludes the scaffold E2E — no scaffold surface is touched.                                                                                                                                                                                                                                                         |
| Deferred scope explicit      | PASS                      | `worklog.md` § Deferred Scope names live-JSR retry and stable-gate changes.                                                                                                                                                                                                                                                                                                                                                                                                                         |
| jsr-audit                    | N/A                       | Workflow + `.llm/tools` only; no package or plugin export surface changes. `research.md` records the same.                                                                                                                                                                                                                                                                                                                                                                                          |

## Required fixes

1. **The tree-identity guard does not actually establish byte identity of what gets published, and
   the risk register waves this away.** `publishWorkspace` invokes `deno publish --allow-dirty`
   (`publish-workspace.ts:66`), so the bytes uploaded are the **working tree**, not the committed
   tree. `verifyCanaryRepublishTree` as designed compares `v<V>^{tree}` to `HEAD^{tree}` — two
   _committed_ trees. A checkout whose working tree has been modified passes the guard and then
   publishes the modified content at an immutable already-partially-published semver. That is
   precisely the failure acceptance gate 3 exists to prevent, and "Actions checkout is clean" is a
   property of one caller, not of the gate. Extend the guard to also require a clean working tree
   (`git status --porcelain` empty, or an equivalent `git diff --quiet HEAD` check) through the same
   injectable `ReleaseCommandRunner`, unit-test the dirty case as a rejection, and correct the
   corresponding risk-register row.

This is a defect in **my brief's framing** as much as in the plan — the brief specified tree
comparison and said nothing about `--allow-dirty`. The plan followed the brief faithfully; the brief
was wrong to stop there. Fixing it now is one cheap cycle.

## Verdict

FAIL

One unchecked box (risk register / guard soundness). Everything else passes. Apply required fix 1,
update `plan.md` and `worklog.md`, and proceed directly to implementation — no second PLAN-EVAL
cycle is required for this single, scoped correction.
