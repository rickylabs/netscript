use harness

## SKILL

Activate `netscript-harness`, `netscript-doctrine`, `netscript-pr`, `netscript-deno-toolchain`, `netscript-tools`, `jsr-audit`, and `rtk`.

Perform the formal IMPL-EVAL for NetScript PR #1285 on branch `feat/runtime-shutdown-orchestrator`, base `c384013662169046106ee9dd193ab8972beab3b4`, current implementation head `b1b3fcdde`.

Read the evaluator protocol and verdict definitions, Archetype 3, the service and docs overlays, issue #1231, the PR body/diff/comments, the run artifacts under `.llm/runs/feat-runtime-shutdown-orchestrator--1231/`, and the architecture debt registry. The D6 PLAN-EVAL `COMPOSED_WAIVER` is the owner's explicit ruling and is valid; do not fail merely because it is not a PLAN-EVAL PASS.

Work directly with Read/Bash only. Do not use Agent, Task, Workflow, subagent, or delegation tools. Do not edit product/source/docs files, commit, push, or touch `deno.lock`. Your only permitted write is the tracked evaluator verdict at `.llm/runs/feat-runtime-shutdown-orchestrator--1231/evaluate.md`.

Independently inspect the implementation and run the smallest useful read-only gates. In particular, verify:

- it composes existing drains and does not introduce replacement per-resource drain logic;
- one app-wide deadline bounds the returned shutdown promise even when a drain never resolves;
- phase ordering and within-phase registration ordering are deterministic;
- partial failures are reported and do not prevent later drains;
- timer effects remain isolated behind the adapter;
- the factory/types are reachable from the package root and satisfy the JSR surface;
- the obsolete app-wide-orchestrator caveat marker/callout and debt entry were removed, while still-true signal, hook-failure, kill-grace, and storage-order warnings remain;
- the PR's closing claim and acceptance-evidence mapping are earned.

Write a concise, evidence-backed `evaluate.md` with exactly one verdict from `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`, along with findings, gates run, acceptance assessment, and any residual risks. Treat Windows-native reproduction as unavailable and judge the deterministic controlled-timer proof on its merits.
