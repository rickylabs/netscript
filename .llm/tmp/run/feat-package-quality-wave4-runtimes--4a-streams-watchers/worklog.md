# Worklog — feat-package-quality-wave4-runtimes--4a-streams-watchers

Sub-branch: `feat/package-quality-wave4-runtimes-4a`
Base: umbrella `feat/package-quality-wave4-runtimes` @ `ee9f26b` (carries merged Wave 3 `@netscript/plugin`)

## Phase log

| Date | Phase | Session | Notes |
|------|-------|---------|-------|
| 2026-06-08 | Bootstrap | supervisor | Sub-branch + worktree `.worktrees/wave4-runtimes-4a` off the track-synced umbrella. Seed (`context-pack.md`) + this log. Draft PR → umbrella. |
| | Research | generator | (pending) MEASURE-FIRST: full-export `deno doc --lint` + dry-run + `check --unstable-kv` per unit (streams-core, plugin-streams, watchers). Record real per-entrypoint numbers in `research.md`/`drift.md`. |
| | Plan & Design | generator | (pending) **Fix the core archetype (A1 vs A3) per unit** + gate set; design the `plugin-streams` test layer (0→real); design the `watchers` structural lift (`src/public/` + README + docs + tasks); lock slices (`<30`). |
| | PLAN-EVAL | evaluator | (pending) **Separate session. Hard stop before implementation.** Option A (one PLAN-EVAL over the combined Wave 4 plan). |
| | Implement | generator | (pending) Sliced; one commit + paired `docs(wave4): record …` per slice. |
| | Gate | generator | (pending) Archetype gates + F-6 + F-1 + consumer-import + Runtime/Aspire (A3/A5) + F-10 test-shape (A5). |
| | IMPL-EVAL | evaluator | (pending) Separate session. |
| | Close | supervisor | (pending) 4a → umbrella via Draft PR after IMPL-EVAL PASS. 4b (workers) forks off the 4a-merged umbrella. |

## Readiness note

- 2026-06-08: Opened post-Wave-3 reconciliation (umbrella carries the merged plugin host
  surface; consumer scan confirmed no drift). 4a is the foundation sub-wave — exercises the
  A3 runtime-validation path once, early. Handover = Research → Plan & Design.
