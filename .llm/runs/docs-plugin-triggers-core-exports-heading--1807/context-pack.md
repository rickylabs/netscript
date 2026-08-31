# Context Pack

- Goal: close #1807 by making the existing twelve-row table recognizable and adopting the package into `docs:exports-drift`.
- Baseline: `origin/main` `5197e70b716eafb82fbb12ddb9a910c248ddb86a`.
- Profile: Archetype 3 subject + docs overlay; package source is untouched.
- PLAN-EVAL: N/A, justified before implementation.
- Symbol result: `entrypoints-only`; 157 deduplicated real exports are absent page-wide, concentrated in layered subpaths.
- Current phase: final-head gates. Implementation commit: `eb3c9e90f`.
- Preliminary gates: all returned 0 except `check:assets-barrel`, whose expected clean-diff check ran before the generated barrel was committed; the initial red is recorded in `worklog.md` and requires a final-head rerun.
- Remaining: commit this evidence note, run every required gate at the final head, push, open the draft PR at `status:impl`, then obtain separate-session IMPL-EVAL.
