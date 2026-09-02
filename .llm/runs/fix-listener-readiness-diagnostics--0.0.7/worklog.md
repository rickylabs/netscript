# Worklog: listener readiness diagnostics and bounded endpoint allocation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-listener-readiness-diagnostics--0.0.7` |
| Branch | `fix/listener-readiness-diagnostics` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `service` |

## Design

### Public Surface

- No published package export or CLI command changes.
- Internal E2E seam: pure deadline snapshot selection/formatting exported from the existing verifier for tests.
- Generated AppHost seam: a bounded resource-endpoint listener check used by emitted infrastructure registration.

### Domain Vocabulary

- `ListenerReadinessSnapshot` — one final view of resource match, state, aggregate health, and named report statuses.
- `ListenerHealthSummary` — one published health key/status pair.
- `ListenerEndpoint` — the minimal host/port capability supplied by Aspire.
- `EndpointListenerReadinessCheckOptions` — listener kind plus a lazy endpoint resolver.
- `ENDPOINT_UNALLOCATED` — allocation did not complete inside one health-evaluation budget.

### Ports

- Aspire CLI process edge — existing `Deno.Command` runner for one `describe` and one `logs` observation.
- Aspire endpoint capability — injected lazy `getEndpoint` callback; no new package-level port abstraction.
- TCP socket edge — existing Node `createConnection`, already bounded independently.

### Constants

- `LISTENER_READINESS_TIMEOUT_MS = 2_000` — existing socket attempt bound and new total endpoint allocation bound.
- `LISTENER_LOG_TAIL_LINES = 20` — one-shot console evidence cap.
- `ENDPOINT_UNALLOCATED` — stable health data code.
- Existing gate/resource/report IDs remain unchanged.

### Archetype-6 Existing Contracts (unchanged)

- Spine abstracts: `CliCommand<Input, Result>`, `CliCommandGroup`, `CliRoot`, `UseCase<Input, Result>`, and `Registry<TKey, TValue>`; none are touched.
- Layer-2 abstracts: none introduced or changed.
- Vertical feature catalog, command names, composition roots, registries, and extension axes: unchanged.
- Existing command/filesystem/process/template/output ports: unchanged; this slice only uses the existing E2E Aspire process edge and generated endpoint/socket capabilities.

### Locked Path Ceiling

- `packages/cli/e2e/src/application/gates/scaffold/runtime/verify-listener-readiness.ts`
- `packages/cli/e2e/tests/application/gates/listener-readiness-gates_test.ts`
- `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-infrastructure.ts`
- `packages/cli/src/kernel/templates/aspire/helpers/tests/generate-register-infrastructure_test.ts`
- `packages/cli/src/kernel/assets/aspire/helpers/_aspire-compat.ts.template`
- `packages/cli/src/kernel/templates/aspire/helpers/tests/aspire-compat-health-checks_test.ts`
- Existing generated asset carrier only if changed by the canonical generator.
- Run artifacts and PR metadata are outside the product path ceiling.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 0 | Harness bootstrap and locked design | artifact review | run artifacts only |
| 1R | RED: deadline snapshot distinguishes unmatched/not-Running/key-absent and includes log tail | focused E2E gate test fails for missing contract | E2E test + run artifacts |
| 1G | GREEN: one-shot final snapshot and console-log diagnostic | focused E2E gate tests + E2E source check | verifier + run artifacts |
| 2R | RED: emitted registration uses bounded endpoint allocation and helper times out with `ENDPOINT_UNALLOCATED` | focused generator/helper tests fail | helper tests + run artifacts |
| 2G | GREEN: bounded endpoint allocation helper and generated use | helper tests + emitted compile + parity | template, generator, generated carrier if canonical, run artifacts |
| 3 | Full local gate set and PR handoff | all brief gates + quality/doctrine | run artifacts and PR metadata |

### Deferred Scope

- Hosted causal diagnosis and two consecutive same-head Postgres passes — supervisor owns the runtime lease.
- Changes to #1952-owned readiness fixture and resource stream — explicitly excluded.
- Historical root-cause assertion — evidence was not retained.

### Contributor Path

For deadline evidence, extend the snapshot type and its formatter in
`verify-listener-readiness.ts`, then add a focused object fixture beside the existing readiness
tests. For an emitted listener kind, use the bounded endpoint wrapper in the infrastructure
generator and prove both generated text and emitted-workspace compilation; never add a new polling
loop or a literal timeout at the gate call site.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-02T22:00Z | 0 | Bootstrap | Read harness, CLI, tools, doctrine, Aspire, PR process, brief, selected Archetype 6 + service overlay, and re-baselined branch setup commits. |
| 2026-09-02T22:10Z | 0 | Research | Verified log CLI options, the evidence discarded at the deadline, bounded socket behavior, and unbounded endpoint allocation. |
| 2026-09-02T22:15Z | 0 | Addendum | Locked #1952 reachability semantics: container logs are not authority, empty reports are unknown, and no forced Unhealthy state. |
| 2026-09-03T00:05Z | 1R | RED authored | Added pure snapshot, classification, and Aspire JSON/NDJSON log-selection contract tests before implementation. |
| 2026-09-03T00:06Z | 1R | RED measured | Structured focused test exited 1 with TS2305 for the three deliberately absent snapshot/log exports; 0 tests ran. |
| 2026-09-03T00:10Z | 1G | GREEN measured | Focused readiness suite passed 10/10; structured E2E source check selected 155 files in two batches with 0 diagnostics. |
| 2026-09-03T00:13Z | 2R | RED authored | Generator contract now requires lazy bounded endpoint resolution; helper contract requires a never-settling endpoint to return `ENDPOINT_UNALLOCATED` near 2,000 ms. |
| 2026-09-03T00:14Z | 2R | RED measured | Structured helper test run exited 1: 29 passed / 5 failed; failures name the absent generated wrapper and missing helper function. |
| 2026-09-03T00:18Z | 2G | GREEN measured | Structured generator/helper/emitted-compile run passed 35/35 in 8.4s; helper source check selected 39 files with 0 diagnostics; carrier regenerated canonically. |
| 2026-09-03T00:22Z | 2G | Full-suite correction | Complete helper directory found one stale old-helper import assertion (276 passed / 2 failed); updated the assertion before rerunning the directory. |
| 2026-09-03T01:05Z | 2G | Full-suite GREEN | Complete helper directory passed 278/278; E2E gate directory passed 183/183. Both source checks passed with zero diagnostics. |
| 2026-09-03T01:07Z | 3 | Quality gates | E2E lint and focused E2E format passed. Root configuration excludes `packages/cli` template sources, so template lint/fmt wrappers refused with `all-excluded`; emitted helper format is independently green in the 278-test helper suite. Version parity, quality scan, and doctrine check passed. |
| 2026-09-03T01:12Z | 3 | Draft PR | Pushed explicit refspec at `8d7a6178a` and opened draft PR #1959 with `Refs #1844`, requested labels, milestone `0.0.7`, and hosted/IMPL-EVAL boxes left open. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| PLAN-EVAL N/A | Small contract is fully locked by the implement brief/addendum. | plan D6 |
| Ship S2 | H1 is credible from direct code evidence. | research findings 3–5 |
| Use one 2s total allocation budget | Matches existing health-attempt scale without multiplying stages. | plan D4 |
| One final describe + log tail | Captures deadline truth without another poller. | brief S1 / Aspire skill |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Service overlay references absent `.claude` files | minor | yes |
| Brief describes emitted helper under the templates path, but source asset lives under `kernel/assets` and may require a generated carrier | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| E2E source check | structured `run-deno-check` on `packages/cli/e2e/src` | PASS | 155 files, 2 batches, 0 diagnostics. |
| Aspire template check | structured `run-deno-check` on template root | PASS | 39 files, 1 batch, 0 diagnostics. |
| E2E gate tests | structured `run-deno-test` on gate directory | PASS | 183 passed / 0 failed. |
| Aspire helper tests | structured `run-deno-test` on helper test directory | PASS | 278 passed / 0 failed. |
| E2E lint | structured `run-deno-lint` on E2E source | PASS | 155/155 processed, 0 findings/refusals. |
| Template lint | structured `run-deno-lint` on Aspire template source | REFUSAL | Repository lint config excludes `packages/cli`; 39 selected / 0 processed, `all-excluded`. |
| E2E source format | structured `run-deno-fmt` | PASS | 155/155 processed, 0 findings/refusals. |
| E2E test format | structured `run-deno-fmt` | PASS | 27/27 processed, 0 findings/refusals. |
| CLI-wide format | brief command | REFUSAL | Root fmt config excludes `packages/cli`; 955 selected / 214 processed. Emitted helper format test passes. |
| Aspire parity | `deno task check:aspire-version-parity` | PASS | 907 checked, 0 failures, manifest fresh. |
| Lock hygiene | `git diff 5ce87fb8b..HEAD -- deno.lock` | PASS | No output; byte-identical. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `quality:scan` | PASS | repository scanner | 0 findings; 7 pre-existing allowances. |
| `arch:check` | PASS | doctrine/dependency composite | Exit 0; existing warnings only, including recorded CLI cardinality debt. |
| F-CLI manual | PASS | diff review | No command, composition, registry, folder, or public-surface change. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| hosted Postgres tier twice | NOT_RUN | supervisor-dispatched | No runtime lease held. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| emitted AppHost helper | PASS | structured focused suite | 35/35 including emitted compile and format checks. |

## Handoff Notes

- Evaluator should inspect the final deadline classification and confirm the endpoint timeout reports reachability semantics without forcing state.
- IMPL-EVAL is mandatory and supervisor-dispatched in a separate session.
- Draft PR: #1959. Hosted proof has not been claimed or dispatched by this lane.
