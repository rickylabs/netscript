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

## Gate Results

All implementation gates are `NOT_RUN` until their owning slice lands. Baseline full-export doc lint
and package publish dry-run both passed before implementation; see `research.md`.

## Handoff Notes

- Implement against locked decisions D1–D9; do not import S4.
- The fixture matrices and timeout negative case are the decisive #1131 evidence.
