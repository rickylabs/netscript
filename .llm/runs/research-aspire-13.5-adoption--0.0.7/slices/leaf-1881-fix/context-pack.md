# Context Pack: readme.quickstart install-root isolation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `research-aspire-13.5-adoption--0.0.7/slices/leaf-1881-fix` |
| Branch | `fix/aspire-1881-readme-install-isolation` |
| Current phase | `implement` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Current State

Research, plan, Design checkpoint, and justified `PLAN-EVAL: N/A` are recorded. The focused RED
test and minimal recording-spawn seam are present; the test fails exactly because no environment is
passed. No runtime command has run.

## Completed

- Required skill and harness/doctrine references read.
- Existing execution/state/receipt flow re-baselined.
- RED/GREEN slices and forbidden runtime boundaries locked.
- RED captured through the structured test wrapper: exit 1, 0 passed / 1 failed, missing
  `DENO_INSTALL_ROOT`; exact argv/no-`-f` assertions passed first.

## In Progress

- Slice 2: implement stateful install-root propagation and receipt evidence.

## Next Steps

1. Commit the captured RED slice.
2. Implement the isolated environment, run focused green, and commit GREEN.
3. Run scoped gates and separate IMPL-EVAL.
4. Open/update the non-draft PR as directed, without ready-merge status.

## Key Decisions

See `plan.md`; all material decisions are owner-locked.

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | NOT_RUN | implementation not started |
| Fitness | NOT_RUN | implementation not started |
| Runtime | N/A | explicitly forbidden by owner |
| Consumer | NOT_RUN | focused semantic command test planned |

## Drift and Debt

- Drift: none.
- Debt: none expected.

## Commits

- See the PR commit list and per-slice comments once opened.
