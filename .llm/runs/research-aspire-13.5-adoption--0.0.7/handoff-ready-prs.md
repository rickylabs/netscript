# Human-merge handoff — Aspire 13.5 ready PRs (2026-08-30, checkpoint after S5 F-A)

Supervisor does not merge. Both PRs below pass close-gate independently of S3 Phase B.

| PR                                                                                  | Head        | Base   | Closing set (auto-closes on merge)                                                     | Refs                         | Close-gate evidence                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------------------------------------------------------------------- | ----------- | ------ | -------------------------------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **#1738** S4 generator revalidation (`chore/aspire-13-5-s4-generator-revalidation`) | `732992415` | `main` | **Closes #1716** (acceptance boxes 6/6 checked)                                        | Part of #1712                | CI `close-gate` pass, `check-test`/`quality`/`build` pass, `mergeStateStatus=CLEAN`; `agentic:review-threads` → threads 0 / unanswered 0; Tier-A + IMPL-EVAL PASS (`slices/s4/`); `status:ready-merge`, milestone 0.0.7.                                                                                                                                                                                                      |
| **#1740** S5 literal-port removal (`fix/aspire-13-5-s5-literal-ports`)              | `aa822069e` | `main` | **Closes #1717** (6/6), **Closes #1370** (7/7), **Closes #979** (no close-gated boxes) | Part of #1365, Part of #1712 | CI `close-gate` pass, `check-test`/`quality`/`build` pass, CLEAN; `review-threads` → threads 3 / unanswered 0 (all answered); Tier-A signed off + IMPL-EVAL cycle 3 PASS (`slices/s5/evaluate-cycle-3.md`); F-A runtime receipt: 26/27 with the only red = baseline #1734 (`slices/s5/receipts/e2e-scaffold-runtime-aa822069-nas.json`, D-33) and host gates re-run green (D-37/D-39); `status:ready-merge`, milestone 0.0.7. |

## Caveats for the human merger

1. **#1740 runtime verdict is blocked only by baseline #1734** (Fresh `hydration.ts` TS2345, fix PR
   #1736 still draft). The S5 diff itself is runtime-monotonic; CI `scaffold-runtime` skipped by
   classification at every head. Merge order that yields a clean merge-head runtime verdict: **#1736
   → rebase #1740 → CI `e2e-cli` dispatch → merge**; merging #1740 first is a policy call.
2. **Stacked base:** S6 PR #1743 (draft) is based on `fix/aspire-13-5-s5-literal-ports`. After #1740
   merges, retarget #1743 to `main` (supervisor does it on request; no rebase needed if the branch
   is merged, not squashed — squash-merge will require a rebase of S6 and S8).
3. **Issue labels vs PR phase:** #1716, #1717, #1370, #979 still carry `status:triage` while the PRs
   carry `status:ready-merge`; the coordinator moved #1280 to `status:impl` for the same reason on
   S6 — same decision applies here if desired. Not relabelled by this session.
4. **F-B..F-E** (S5 hygiene follow-ups, D-28) remain coordinator items; none blocks the merge.
