# Worklog — feat-package-quality-wave4-runtimes--4b-workers

Sub-branch: `feat/package-quality-wave4-runtimes-4b`
Base: umbrella `feat/package-quality-wave4-runtimes` @ `ee9f26b` (carries merged Wave 3)

## Phase log

| Date | Phase | Session | Notes |
|------|-------|---------|-------|
| 2026-06-08 | Bootstrap + pre-research | supervisor | Sub-branch + worktree off the umbrella (prepared in parallel, user-approved). Seed (`context-pack.md`) + measured `pre-research.md` (doc-lint core 460 / plugin 143; both dry-run PASS). Draft PR → umbrella. |
| | **GATE** | — | **DO NOT LOCK.** Pull-forward required: after 4a merges → `git merge feat/package-quality-wave4-runtimes` (settles `workers-core ./streams`) → re-run MEASURE-FIRST. |
| | Research | generator | (pending) Re-run full-export doc-lint **per entrypoint** (attribute the 460); confirm dry-run; consumer scan for the F-5 17-export challenge. |
| | Plan & Design | generator | (pending) Decide core archetype (A3) + gate set; **decide the `4b-core`/`4b-plugin` split** (sizing); design the 0→real plugin test layer; over-cap concept-splits (501/469); lock slices. |
| | PLAN-EVAL | evaluator | (pending) Separate session. Hard stop. Option A. |
| | Implement | generator | (pending) Sliced; one commit + paired doc-record per slice. |
| | Gate | generator | (pending) Archetype gates + F-13/Runtime+Aspire (A3/A5) + F-10 (A5) + consumer-import + F-1 + F-6. |
| | IMPL-EVAL | evaluator | (pending) Separate session. |
| | Close | supervisor | (pending) 4b → umbrella after IMPL-EVAL PASS. 4c forks off the 4b-merged umbrella. |

## Readiness note

- 2026-06-08: Prepared in parallel; invariant to 4a EXCEPT `workers-core ./streams` (re-exports
  `@netscript/plugin-streams-core`). Pull 4a forward + re-measure before locking.
