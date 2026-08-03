# Worklog: OMB S5 ServiceEndpointDirectoryPort + adapters

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-openapi-mcp-endpoint-directory--s5` |
| Branch | `feat/openapi-mcp-endpoint-directory` |
| Archetype | `2 — Integration` slice inside `@netscript/mcp` |
| Scope overlays | none |

## Design

Recorded before implementation files.

### Public Surface

- `createServiceEndpointDirectory(options): ServiceEndpointDirectoryPort` — default composition
  for the four sources and bounded fetch probe.
- `ServiceEndpointDirectoryPort.list(signal?)` — returns stable per-service rows plus every source
  outcome.
- `EndpointSourcePort.read(context, signal)` — one-operation adapter contract.
- `ServiceEndpointProbePort.probe(candidate, signal)` — one-operation bounded identity/spec probe.
- `AspireCliEndpointSource`, `RunManifestEndpointSource`, `AppsettingsEndpointSource`,
  `OverrideEndpointSource`, and `FetchServiceEndpointProbe` — published default adapters.

### Domain Vocabulary

- `ENDPOINT_SOURCES` / `EndpointSource` — `override`, `aspire-cli`, `run-manifest`, `appsettings`.
- `ENDPOINT_SOURCE_PRECEDENCE` — ordered current arbitration.
- `SourceOutcome` / `SourceFailureCode` — discriminated used/absent/failed source rows.
- `EndpointCandidate` / `EndpointConflict` — source facts before/after precedence.
- `SERVICE_ENDPOINT_STATUSES` / `ServiceEndpointStatus` — `running`, `not_running`,
  `spec_unavailable`, `identity_mismatch`, `excluded`.
- `ServiceEndpointRow` / `ServiceEndpointDirectoryResult` — S6-facing directory output.
- `ServiceEndpointProbeResult` — probe success or one mapped failure class.
- `ServiceEndpointDirectoryOptions` — project root, expected run id, bounds, injected seams.

### Ports

- `ServiceEndpointDirectoryPort` — application consumer seam for S6/tests.
- `EndpointSourcePort` — genuine four-variant filesystem/process source axis.
- `ServiceEndpointProbePort` — network/timeout seam required for row-level isolation tests.

### Constants

- `ENDPOINT_SOURCES` — finite source vocabulary.
- `ENDPOINT_SOURCE_PRECEDENCE` — `override > aspire-cli > run-manifest > appsettings`.
- `SERVICE_ENDPOINT_STATUSES` — finite public status vocabulary.
- Default timeout, response-byte cap, and concurrency cap — named policy constants.
- Ratified P3 `spec_unavailable` guidance — one exported/used constant only if consumers need it;
  otherwise a documented internal constant.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | Contract + four honest sources prove every used/absent/failed outcome including CLI failures and foreign/torn manifest fallback facts. | focused source adapter tests + scoped check | domain contract, four infrastructure adapters, source fixture matrix/test, run artifacts |
| 2 | Composition + bounded probe prove precedence/conflicts and every status, including reused-port identity mismatch, exclusion, and one hanging spec isolated from healthy rows. | focused directory/probe tests + package tests + scoped wrappers | application directory/factory, fetch probe, status fixture matrix/test, run artifacts |
| 3 | Published surface and docs prove S6 importability and full Archetype-2/JSR fitness without lock churn. | `quality:gate`, doc lint, JSR audit, publish dry-run | `mod.ts`, `cli.ts` re-export if appropriate, README, final evidence artifacts |

### Deferred Scope

- Projection/tool registration/operation counts — S4/S6.
- Manifest producer/current-run transport — S7; S5 requires an injected expected token.
- Endpoint execution/authenticated fetch — S13 or later.
- Package-wide Archetype-6 restructuring — existing debt owner.

### Contributor Path

Add a first-party source by implementing `EndpointSourcePort`, adding its identifier and precedence
deliberately, wiring it in `createServiceEndpointDirectory`, then extending the source-outcome matrix.
Change probe policy through `ServiceEndpointProbePort`/factory options and extend every status row;
never import an infrastructure adapter from a consumer flow.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-04 | bootstrap | research/design/plan lock | Issue/RFC/P1/P3/doctrine/Aspire/JSR baselines read; clean baseline confirmed. |
| 2026-08-04 | Plan Gate | composed per milestone-run.md (orchestrator waiver) | Owner/orchestrator directive: no local formal PLAN-EVAL; plan locked for same-run implementation. |
| 2026-08-04 | implementation dispatch | sender ownership reconciled | The provided PR worktree is durably owned by this Desktop supervisor thread; implementation uses a run-owned staging worktree and pushes each commit to the exact PR refspec. |
| 2026-08-04 | 1 | contract + source adapters | Added the discriminated directory/source/probe vocabulary, loopback normalization policy, and override/Aspire CLI/run-manifest/appsettings adapters. Source matrix passed 6/6, including CLI absent/non-zero/parse failures, foreign/missing/mismatched manifest identity, torn manifest with healthy appsettings, unknown shared-carrier fields, exclusions, and unpinned services. |
| 2026-08-04 | 1 | post-slice reconcile | PR #1194 remains draft, references #1131 without a closing keyword, and has no new implementation/reviewer comments; issue #1131 remains open with both acceptance gates unchecked. The launcher metadata push ref was corrected to the user-authorized PR branch. No scope or precedence readjustment was needed. |
| 2026-08-04 | 2 | composition + bounded probe | Added the default directory composition, deterministic precedence/conflicts, pre-fetch exclusions, bounded concurrency, per-row timeout/error isolation, and the credential-free/redirect-free spec-first identity probe. The fixture matrix passed 12/12 across source and directory tests; the package passed 78/78. |
| 2026-08-04 | 2 | package test gate repair | Added the missing test-only `--allow-write` permission required by the package's existing temporary-directory tests. The initially failing exact package task then passed 78/78 without changing runtime permissions or product dependencies. |
| 2026-08-04 | 2 | post-slice reconcile | PR #1194 remains draft at slice 1, references #1131 without a closing keyword, and has no reviewer comments after the slice 1 implementation comment. Issue #1131 remains open with both acceptance gates unchecked. No contract rescope or precedence readjustment was needed. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| CLI precedence after override | Qualified F1(b) selects the CLI as primary live source without defeating explicit operator intent. | P1 verdict + RFC S-10 |
| Expected run id required for manifest | Currency cannot be inferred honestly from a file's own token/time. | P1 evidence + S-8 |
| Opaque spec data only | Prevents S4 dependency and duplicate projection. | coordinate-surface rule |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Formal PLAN-EVAL composed/waived by milestone ruling | significant | yes |
| Local `main` stale; `origin/main` is true baseline | minor | yes |
| RFC omitted how MCP learns the current manifest `runId`; S5 requires injection | significant | yes |
| Existing package tests need test-only write permission for temporary directories | minor | yes |

## Gate Results

### Slice 1 — contract and source adapters

| Gate | Command | Result |
| --- | --- | --- |
| Focused source matrix | `deno test --allow-env --allow-net --allow-run --allow-read packages/mcp/tests/service-endpoint-*_test.ts` | PASS, exit 0; 6 passed, 0 failed |
| Scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/mcp --ext ts,tsx` | PASS, exit 0; 76 files, 0 diagnostics |
| Scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/mcp --ext ts,tsx --config packages/mcp/deno.json` | PASS, exit 0; 76 files, 0 findings |
| Scoped format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/mcp --ext ts,tsx --config packages/mcp/deno.json` | PASS, exit 0; 76 files, 0 findings |
| Code quality | `deno run --allow-read .llm/tools/quality/scan-code-quality.ts --root packages/mcp` | PASS, exit 0; no findings or allowances |
| Framework quality | `deno task quality:gate` | PASS, exit 0; quality scan and architecture task completed |
| Diff hygiene | `git diff --check`; forbidden-pattern scan | PASS, exit 0; no whitespace errors, unsafe casts, lint ignores, or console calls |

The wrapper invocations without `--config packages/mcp/deno.json` encountered the root workspace
configuration parser failure recorded in `drift.md`; the package-configured wrapper verdicts above
are the exact successful evidence.

### Slice 2 — composition and bounded probe

| Gate | Command | Result |
| --- | --- | --- |
| Focused directory/source matrix | `deno test --allow-env --allow-net --allow-run --allow-read packages/mcp/tests/service-endpoint-*_test.ts` | PASS, exit 0; 12 passed, 0 failed |
| Package tests | `deno task --cwd packages/mcp test` | PASS, exit 0; 78 passed, 0 failed |
| Scoped check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/mcp --ext ts,tsx` | PASS, exit 0; 79 files, 0 diagnostics |
| Scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/mcp --ext ts,tsx --config packages/mcp/deno.json` | PASS, exit 0; 79 files, 0 findings |
| Scoped format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/mcp --ext ts,tsx --config packages/mcp/deno.json` | PASS, exit 0; 79 files, 0 findings |
| Code quality | `deno run --allow-read .llm/tools/quality/scan-code-quality.ts --root packages/mcp` | PASS, exit 0; no findings or allowances |
| Framework quality | `deno task quality:gate` | PASS, exit 0; quality scan and architecture task completed |
| Diff hygiene | `git diff --check`; forbidden-pattern scan | PASS, exit 0; no whitespace errors, unsafe casts, lint ignores, or console calls |

The exact package task first exposed a missing test-only `--allow-write` permission in its existing
temporary-directory tests. The task definition was repaired, rerun, and is the passing evidence
above. Slice 3 consumer/JSR gates remain `NOT_RUN`.

## Handoff Notes

- Implement against locked decisions D1–D9; do not import S4.
- The fixture matrices and timeout negative case are the decisive #1131 evidence.
- Slices 1–2 are ready for the supervisor's substantive review; this implementation lane does not
  self-certify the slice.
