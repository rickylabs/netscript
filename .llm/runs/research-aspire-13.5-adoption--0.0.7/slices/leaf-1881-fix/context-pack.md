# Context Pack: readme.quickstart install-root isolation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `research-aspire-13.5-adoption--0.0.7/slices/leaf-1881-fix` |
| Branch | `fix/aspire-1881-readme-install-isolation` |
| Current phase | `gate` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Current State

RED commit `b1aafaaa6` is pushed and PR #1975 is open non-draft. The corrected GREEN is implemented
and all owner-scoped gates pass, including a safe real child invocation under the walker's exact
narrow permissions. Separate substantive slice review returned PASS with no blockers. The GREEN is
ready to commit. No runtime suite has run.

## Completed

- Required skill and harness/doctrine references read.
- Existing execution/state/receipt flow re-baselined.
- RED/GREEN slices and forbidden runtime boundaries locked.
- RED captured through the structured test wrapper: exit 1, 0 passed / 1 failed, missing
  `DENO_INSTALL_ROOT`; exact argv/no-`-f` assertions passed first.
- Corrected GREEN focused test: exit 0, 1 passed / 0 failed.
- Scoped check/fmt/lint and full nested tests pass; full nested tests: 327 passed / 0 failed.
- Gate listing and real subprocess permission proof both exit 0.

## In Progress

- Slice 2: commit and push the reviewed GREEN.

## Next Steps

1. Complete the corrected slice review.
2. Commit and push GREEN; post its phase comment.
3. Run separate IMPL-EVAL and update PR evidence without changing `status:impl` or marking ready-merge.

## Key Decisions

See `plan.md`; all material decisions are owner-locked.

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | check/fmt/lint all exit 0 |
| Fitness | PASS (scoped semantic) | full tests 327/327; focused stale-root/env test 1/1 |
| Runtime | N/A | explicitly forbidden by owner |
| Consumer | PASS (non-runtime) | gate listing and exact-permission index-2 child both exit 0 |

## Drift and Debt

- Drift: permission and stale-root gaps found before GREEN commit and corrected; see `drift.md`.
- Debt: none expected.

## Commits

- See the PR commit list and per-slice comments once opened.
