# Worklog: scaffold-verb adoption and stub upgrades

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-712-cli-adoption--codex` |
| Branch | `docs/712-cli-adoption` |
| Archetype | `5 - Plugin Package` |
| Scope overlays | `docs` |

## Design

### Public Surface

- Existing `ns-workers add job/task`, `ns-triggers add webhook/file-watch/scheduled`, and
  `ns-sagas add saga` commands; no new command or export.
- Generated worker job and saga definition source are the changed scaffold contracts.

### Domain Vocabulary

- Payload schema — Zod object placed in every generated worker job for typed validation.
- Normal handler — the saga `.on(...)` path generated for the requested message type.
- Compensation handler — the saga `.compensate(...)` path generated for the same failed step.

### Ports

- None added. Scaffolders continue through existing `StubSource`, `ItemScaffolder`, and core DSLs.

### Constants

- Existing scaffold substitution tokens and command-defined flag names remain authoritative; no new
  finite vocabulary is introduced.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Generated worker payload validation and saga compensation skeleton compile and are asserted. | focused tests plus scoped check/lint/fmt | worker/saga stubs and resource tests; run artifacts |
| 2 | Tutorials teach all requested existing scaffold verbs and auth uses install consistently. | acceptance/public-doc greps and docs checks | selected docs/site tutorials/how-to, auth README; run artifacts |

### Deferred Scope

- Full scaffold runtime E2E and IMPL-EVAL — orchestrator-owned by explicit instruction.
- PR lifecycle — prohibited by explicit instruction.

### Contributor Path

To evolve generated resources, edit the typed stub beside its resource scaffolder, assert the
rendered artifact in `resources.test.ts`, then update tutorials using the exact usage/flags in the
plugin's `src/cli/commands.ts` and input parser.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-07-12 | plan | preflight | Baseline, branch, and trigger `job` parsing verified. |
| 2026-07-12 | plan | design | PLAN-EVAL owner-waived as carried drift D1; plan locked before edits. |
| 2026-07-12 | 1 | implement | Added typed Zod payload parsing to worker jobs and `.compensate(...)` to saga definitions; focused tests pass. |
| 2026-07-12 | 1 | reconcile | Current source/contracts still match the locked plan; no issue/PR mutation permitted and no scope adjustment needed. |
| 2026-07-12 | 2 | implement | Rewrote tutorials around verified commands and corrected auth install wording. |
| 2026-07-12 | 2 | reconcile | `add file-watch` has no `--job`; docs use its real flags and retain a small generated-handler edit. No plan rescope required. |
| 2026-07-12 | CI repair | diagnosis | PR runtime feedback showed the health-check trigger passed but execution polling failed. The generated health-check receives no payload, and `PayloadSchema.parse(undefined)` threw before returning success. |
| 2026-07-12 | CI repair | implement | Defaulted the generated empty starter schema to `{}` and strengthened the artifact regression assertion; typed payload customization remains intact. |

## Gate Results

### Static Gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Focused scaffold tests | PASS | `deno test -A` on workers/sagas resource tests: 10 passed, 0 failed |
| Workers scoped check | PASS | wrapper selected 92 files; 0 findings |
| Sagas scoped check | PASS | wrapper selected 68 files; 0 findings |
| Combined scoped lint | PASS | wrapper selected 160 files; 0 findings |
| Combined scoped format | PASS | wrapper selected 160 files; 0 findings |
| Docs build | PASS | `rtk proxy deno task build` in `docs/site`; 516 files generated |
| Docs links | PASS | `rtk proxy deno task docs:links`; 0 broken links/anchors |

### Fitness and source-alignment gates

| Gate | Result | Evidence |
| --- | --- | --- |
| F-3/F-5/F-13 | PASS | Existing core APIs only; saga compensation is typed and generated artifact tests pass. |
| Docs source alignment | PASS | Every documented verb/flag checked against current command definitions/input parsers. |
| Acceptance verb scan | PASS | Tutorials/how-to contain `add-job`, `add-task`, `add-webhook`, `add-file-watch`, `add-scheduled`, and `add-saga`. |
| Auth naming | PASS | Auth README contains `plugin install`; stale `plugin add` wording removed. |
| Public-docs law | PASS | Added-line scan against the baseline returned 0 forbidden internal-wording hits. |
| Lock hygiene | PASS | `deno.lock` is unchanged; `git diff --check` passes. |
| Runtime E2E | PASS | Owner-authorized CI repair run: `scaffold.runtime` passed 60, failed 0; `behavior.workers-executions` passed in 1121 ms. |

### CI repair override

The owner subsequently authorized one serialized local `scaffold.runtime` run to repair PR CI. The
one-pass command exited 0 with `passed=60 failed=0`; the previously failing
`behavior.workers-executions` gate passed in 1121 ms. This authorization superseded the earlier lane
prohibition for this repair only.

## Handoff Notes

- Inspect the two typed stubs/tests first, then the six verb-first docs and auth README.
- Orchestrator must run the one-pass scaffold runtime E2E and separate IMPL-EVAL before merge.
