# Context Pack: repoint Gemini documentation lane to Antigravity

## Current State

Run `fix-lane-gemini-antigravity--1082` implements issue #1082 as one exact internal-tooling slice.
Owner-authorized scope now also folds issue #1089 into PR #1086 so the Antigravity lane passes its prompt correctly.

## Completed

- Re-baselined issue and branch at `2d58481e4`.
- Locked route/config/test/doc scope and applied the implementation edits.
- Passed root check (2,512 files), all 323 agentic tests, focused guards, and scoped lint/fmt.
- Passed the separate-session Claude/Opus slice review with no findings.
- Implemented #1089 and passed a direct unique-marker probe, empirical evidence CLI, 25 focused tests, all 323 agentic tests, and scoped lint/fmt.
- Passed the separate-session Claude/Opus #1089 slice review with all eight criteria verified and no blocking findings.

## In Progress

- Acceptance evidence mirroring. A compliant formal IMPL-EVAL remains blocked.

## Key Decisions

- Antigravity/Google/`MODEL_IDS.antigravity`/low matches `research_extraction`.
- Antigravity print argv ends with `--print`, then the prompt value; `--print-timeout` is prohibited pending proof, and `--new-project` plus skipped permissions are mandatory.
- Gemini remains a generator capability while no OpenRouter Gemini configuration remains.
- The existing named formal-evaluator rejection test passes for the lane-purpose guard after the route changes.
- The first Qwen IMPL-EVAL attempt was interrupted because it spawned closed Claude/Opus helper sessions; accepting that run would violate the open-model-only invariant.

## Drift and Debt

- Drift: owner provided a written Plan-Gate waiver; formal Qwen evaluator launch delegated to prohibited closed-model helpers and was interrupted.
- Debt: none.

## Commits

- See the draft PR commit list and per-slice comment.
