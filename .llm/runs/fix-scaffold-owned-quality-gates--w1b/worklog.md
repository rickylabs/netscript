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

## Design

### Public and generated surface

- No new `@netscript/cli` export, package entry point, or public CLI command is introduced.
- The generated consumer contract adds `.netscript/quality-runner.ts` and routes root tasks `check`,
  `lint`, `fmt:check`, and `fmt` through its modes `check`, `lint`, `fmt-check`, and `fmt-write`.
- #1092's optional `.llm/tools` manifest remains exactly eight tools. Ordinary `netscript init` owns
  the quality runner independently of `netscript agent init`.

### Domain vocabulary

- `QualityMode`: the four finite runner modes above, derived from a constant tuple rather than
  repeated string literals.
- `QualitySurface`: an explicit root/file descriptor for scaffold-owned product TypeScript.
- `QualitySelection`: deterministic selected paths plus count, extensions, and applied exclusions.
- `QualityBatchResult`: command, files, raw exit code, and bounded diagnostic output.
- `QualityReport`: mode, selection, batches, and overall status. An unexpected empty selection exits
  2; an underlying tool failure remains non-zero.

No speculative abstraction is planned. Types live with the generated runner/template contract and
exist only where exercised by its focused tests.

### Ports and effects

- The generated runner consumes only Web/Deno platform effects: `Deno.readDir`, `Deno.stat`, and
  `Deno.Command('deno', ...)`.
- No framework-layer port or dependency is added. Tests execute the generated source in temporary
  fixtures and inject only process arguments/filesystem state already owned by the fixture.
- E2E negative probes own exact paths, run serially, restore preexisting content defensively, and
  prove final cleanup with a green check.

### Constants

- Add `QUALITY_RUNNER: 'quality-runner.ts'` to `SCAFFOLD_FILES` beside `NODE_MODULES_VERIFIER`
  (PLAN-EVAL advisory 2).
- Keep the public task name `fmt:check` and internal mode `fmt-check` (advisory 5).
- Centralize mode names, selected extensions (`ts`, `tsx`, `mts`), explicit product roots/files,
  skip directories, and batch size in the generated runner source.
- Gate IDs added to CLI E2E are declared in `GATE`; fixture surfaces are finite data, not duplicated
  command branches.

### Commit slices

1. **Quality contract and proving tests** — add the constant, generated runner, colocated
   `quality-runner_test.ts`, root task wiring, scaffold bookkeeping, and deterministic E2E negative
   gate. Prove with focused tests, explicit empty-selection tests (including lint/fmt convention
   comparison), and scoped check/lint/fmt wrappers.
2. **Clean generator output** — repair only the measured app/service/plugin/background generator
   defects and their focused tests/assets. Prove with focused generator tests and a generated
   scaffold whose DB clients and plugin registries exist before check/lint/format evidence.
3. **Consumer/runtime closure** — run full current-head static/fitness/package gates, the installed
   released consumer smoke outside a framework checkout, leak-check, and the one-pass
   `scaffold.runtime`; update acceptance evidence and stop at independent IMPL-EVAL.

Every slice includes `worklog.md` and `context-pack.md`, a substantive sole-supervisor inspection,
an explicit-refspec push, one structured PR comment, and a post-slice issue/comment/status reconcile
note.

### PLAN-EVAL advisory ledger

| Advisory                    | Design/implementation disposition                                                                           |
| --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Mandatory Design checkpoint | This section lands before product edits.                                                                    |
| `QUALITY_RUNNER` constant   | Slice 1 constant and adjacent scaffold write; focused bookkeeping assertion.                                |
| Colocated runner test       | Slice 1 creates `quality-runner_test.ts` beside the template.                                               |
| Empty lint/fmt selection    | Slice 1 spot-checks repository wrapper behavior and directly proves generated-runner exit 2 for every mode. |
| `fmt:check` naming          | Root task uses the colon form; only the runner argument uses `fmt-check`.                                   |
| Post-codegen diagnostic     | Slice 2/3 diagnostic runs after standalone DB codegen and registry generation, never before.                |
| Drift and trail discipline  | Append `drift.md` before proceeding on any divergence; push/comment/reconcile after each slice.             |

### Deferred scope

- #1335/W1-C whole-scaffold inventory, new runner/plugin abstractions, expansion of the consumer
  agent bundle, publication, release orchestration, Billing Run, unrelated formatting, and foreign
  worktree cleanup remain excluded.
- `e2e-cli-prod` remains post-publish release authority and is not simulated here.

### Contributor path

A contributor changes the finite owned-source contract in the generated runner template, copies the
adjacent fixture pattern in `quality-runner_test.ts`, and adds a row to the E2E negative-probe
table. Generated task wiring stays in `deno-json.ts`; scaffold emission stays next to the
node-modules verifier in `plan-init.ts`. Generator-output fixes remain in the template/resource that
owns the emitted file.

## Independent PLAN-EVAL

- Verdict: PASS
- Evaluated head: `045ca6c3262c854f830b428e871ef9ed8730ba10`
- Evaluator session: `017613f0-c5be-4738-b59c-0bf540202686`
- Route: Claude Code/OpenRouter guard, `minimax/minimax-m3`, high, provider Novita
- Tracked distillation: `plan-eval.md`
- No PLAN-EVAL rerun is permitted or needed. All seven advisories are incorporated into the Design
  checkpoint above.

## Current stop

- Committed the eight-file run bootstrap as `921b1d996` and pushed it only with
  `git push origin HEAD:refs/heads/fix/scaffold-owned-quality-gates`; the local branch still has no
  upstream.
- Opened draft PR #1342 directly against `main` with both closing keywords, unchecked DoD, run-dir
  link, three slices, validation/debt sections, and pending evidence mappings for #1024 box 6 and
  #1328 boxes 1-8.
- Applied milestone `0.0.5` and valid PR taxonomy with exactly `status:plan-eval`. Reconciled #1024
  from `status:in-progress` and #1328 from `status:triage` to `status:plan-eval` while preserving
  every unrelated issue label.

The separate-session PLAN-EVAL passed on the exact recorded head. After the verdict artifact is
committed/pushed, the structured PASS comment is posted, and PR/issues move together to exactly
`status:impl`, Slice 1 product implementation may begin.

## Slice 1 — generated quality contract and proving tests

Implemented the accepted contract seam:

- every scaffold now receives `.netscript/quality-runner.ts`, registered as
  `SCAFFOLD_FILES.QUALITY_RUNNER` beside the node-materialization verifier;
- root `check`, `lint`, `fmt:check`, and `fmt` tasks route to the runner's finite modes without shell
  globs or optional agent-tool dependencies;
- deterministic discovery covers scaffold-owned TS, TSX, and executable MTS roots/files, skips
  offline agent/docs surfaces, caches, dependencies, and direct machine output, batches tools, emits
  structured results, exits 2 on empty selection, and preserves child failure as exit 1;
- the colocated runner tests execute generated source in temporary consumers and prove all four
  empty modes, the full root/extension matrix, exclusions, child failure propagation, and the
  runner's own lint/format cleanliness in its generated location;
- `scaffold.runtime` now places a ten-surface serial negative matrix after standalone DB codegen and
  workers/sagas registry generation, followed by green generated check, lint, and `fmt:check` gates.

Evidence at the uncommitted Slice 1 tree:

- focused semantic tests: exit 0, 58 passed / 0 failed;
- `deno task e2e:cli gates scaffold.runtime`: exit 0 and confirmed order
  `database.codegen` → registry gates → negative probes → check/lint/fmt-check;
- scoped CLI check wrapper: 811 files, 7 batches, 0 failed, 0 diagnostics;
- scoped CLI lint wrapper: 811 files, 5 batches, exit 0, 0 findings;
- scoped CLI format wrapper: 811 files, 5 batches, 0 failed, 0 findings;
- `git diff --check`: exit 0; `deno.lock` absent from status and untouched.

Sole-supervisor inspection checked the emitted runner as consumer code, task/mode naming, explicit
selection/exclusion boundaries, exact E2E probe ownership and restoration, registry/codegen order,
suite registration, and #1092 isolation. One inspection finding was fixed before this record: the
initial generated source was not format-clean when it selected itself. The test now provides the
generated consumer format policy and the source is clean under it. This was an implementation
correction inside the locked contract, not plan drift.

Post-slice trail reconciliation:

- commit `80a5dc07bdd99c462b3446063f0178731e962cdb` was pushed only through the explicit branch
  refspec; the local branch still has no upstream;
- structured Slice 1 comment: `#issuecomment-5214270787`;
- PR #1342, #1024, and #1328 each retain exactly one lifecycle label, `status:impl`, with every
  unrelated label preserved;
- the worktree was clean after the product commit and `deno.lock` remained absent from status.
