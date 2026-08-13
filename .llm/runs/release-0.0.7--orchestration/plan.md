# Plan — release 0.0.7 milestone cluster

## Gate

`PLAN-EVAL` is required once for the composed milestone wave plan. Leaf plans may record
`PLAN-EVAL: N/A` only for small mechanical work whose design is already locked by this approved
plan. Every implementation leaf still requires a separate-session IMPL-EVAL unless the owner
records an attributed waiver.

## Sequence

1. Freeze the owner-ratified intake, disposition every target issue, assign exactly one topic lane
   to every active issue, and validate a topological dependency DAG.
2. Dispatch at most two implementation leaves and one evaluator per topic lane; serialize the one
   global expensive-gate slot.
3. Land independently evaluated leaf PRs directly on `main`, keeping the cluster state and
   receipts current after each merge.
4. Publish canaries only at coherent checkpoints whose membership is derived from actual
   first-parent merge history.
5. Claim the singleton release-writer lease only after every issue and leaf is terminal and the
   exact-`main` evidence set is sufficient; then cut stable and prove the exact published artifact
   with production E2E.

The dependency waves and leaf boundaries remain intentionally uncommitted until Step 0 validation.

