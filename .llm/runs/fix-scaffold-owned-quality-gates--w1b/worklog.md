# Worklog: Canary.15 W1-B

## Bootstrap and identity

- Verified raw Git state: correct branch, no upstream, no remote head, exact declared base, current
  `origin/main`, and merge base all `7af6d1c02ab3f380dde7354ebac190e67d363db0`.
- Verified no staged/tracked changes; only the pre-created run skeleton was untracked.
- Enumerated foreign/quarantined worktrees and the old `ns004-agenttools` tree; mutated none.
- Verified GitHub authentication and sole daemon-attached writer thread
  `019fdb07-deb8-7971-80aa-d02fb6b56c37` with the requested OpenAI route.
- Preserved `deno.lock`; all research scaffold commands used no-lock behavior and no cache reload.

## Research

- Re-queried #1024 and #1328 from GitHub. Captured every unchecked acceptance item verbatim and
  confirmed milestone 23 (`0.0.5`).
- Inspected merged #1092 and current main. Locked the exact eight-tool optional `agent init` bundle
  as a preserved boundary.
- Traced the installed consumer smoke's released-CLI fallback, project-root inference, 22-step
  lifecycle, and current dry-run-only outside-checkout unit proof.
- Traced root tasks, plugin workspace tasks, generated check gates, standalone DB codegen ordering,
  plugin registry generation, the runtime suite, and AppHost resource entrypoints.
- Read the harness, CLI/tooling doctrine and archetype, CLI, PR, tools, Deno toolchain, WSL remote,
  and RTK instructions named by the brief. Applied the required JSR audit rubric and release-gate
  authority before slicing.

## Diagnostic evidence

Created disposable `.llm/tmp/w1b-research.T0q1HB/w1b-full` from current local source and installed
the full starter background/plugin sample set without starting Aspire or containers.

| Diagnostic                                |        Selection | Result                                                                       |
| ----------------------------------------- | ---------------: | ---------------------------------------------------------------------------- |
| scoped check before standalone DB codegen | 129 TS/TSX files | expected fail: 4 unresolved generated DB/Zod symbols; establishes sequencing |
| scoped lint                               | 129 TS/TSX files | fail: 5 product findings + 1 generated-client finding                        |
| scoped format-check                       | 129 TS/TSX files | fail: 4 product outputs                                                      |

The product findings were mapped to app layout/telemetry, service health/context, sagas, triggers,
and workers generator sources. No scratch output was promoted as a code fix.

## Plan decision

- Selected Archetype 6 (CLI/tooling), no overlay.
- Chose an always-generated `.netscript` quality runner, distinct from #1092's optional `.llm`
  bundle.
- Defined a mode-aware TS/TSX/MTS owned-source matrix and a ten-probe negative E2E matrix.
- Ordered three slices: contract/tests, generator fixes, consumer/runtime closure.
- Selected focused semantics, scoped wrappers, doctrine/quality, asset/doc/publish static checks,
  installed consumer smoke, leak-check, and one-pass `scaffold.runtime` as the evidence chain.
- Recorded #1335/W1-C, publication, release orchestration, and Billing Run as explicit exclusions.

## Current stop

The next allowed actions are bootstrap commit/push, draft PR creation/taxonomy reconciliation, and a
separate-session PLAN-EVAL. Product-code implementation remains blocked until that evaluator PASS.
