# Worklog: Aspire 13.5 S3 fixture re-capture

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `test-aspire-13-5-s3-fixture-recapture--impl` |
| Branch | `test/aspire-13-5-s3-fixture-recapture` |
| Archetype | `2 - Integration` |
| Scope overlays | `none` |

## Design

### Public Surface

- No public exports, entry points, CLI commands, or adapter behavior change.
- `check:mcp-export-corpus` protects the existing MCP public surface.

### Domain Vocabulary

- `CompatFixtureExpectation` — maps each D-13 manifest row to `required` or `pending-lease`.
- Version-suffixed fixture — immutable evidence named for Aspire CLI `13.4.6` or `13.5.3`.

### Ports

- Existing test `CommandPort` and `FilePort` only; no new production port.

### Constants

- `COMPAT_FIXTURES` — the five D-13 compat rows and their phase-A states.
- `13.4.6`, `13.5.3`, and `pending-lease` — finite compatibility vocabulary.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Prove missing phase-A parity is RED | structured test wrapper | parity test + run artifacts |
| 2 | Prove teardown accepts the captured 13.5.3 `ps` shape | teardown probe tests | teardown fixture/test/README + run artifacts |
| 3 | Prove banner and describe consumers accept both versions | scoped MCP/CLI E2E tests | four compat files + fixtures README + run artifacts |
| 4 | Make the lease boundary executable and documented | parity test + documentation review | telemetry README + drift/run artifacts |
| 5 | Record complete Phase-A gate evidence and #413 handoff text | prescribed full gate set | run artifacts/receipts/comment draft |

### Deferred Scope

- Dashboard telemetry resources/spans envelopes — phase B requires a runtime lease.
- Adapter behavior changes — only a later captured fixture diff may justify them.

### Contributor Path

Add a new version beside the old version in the owning test, retain both version literals, record
the capture provenance in that fixture folder's README, then update the parity expectation state.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-30 | 1 | design | Required reading re-baselined; `PLAN-EVAL: N/A` recorded before implementation. |
| 2026-08-30 | 1 | RED gate | Expected FAIL names exactly the four phase-A rows missing 13.5.3; telemetry remains `pending-lease`. |
| 2026-08-30 | 1 | reconcile | Draft PR #1741 opened with closing keyword, epic reference, requested labels/milestone, and S1 trail comment; no new review comments yet. |
| 2026-08-30 | 2 | implementation | Copied S2 V5 `aspire ps` JSON, applied documented deterministic redaction, and parameterized probes across 13.4.6/13.5.3. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Phase A never starts Aspire | No runtime lease; S2 receipts are sufficient for structural work. | User dispatch / Aspire skill |
| Telemetry row is `pending-lease` | It must fail closed when phase B lands without table promotion. | Slice 4 contract |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Dashboard envelope unavailable in S2 | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| PLAN-EVAL | N/A | N/A | Mechanical, ratified scope with locked evidence and gates. |
| Slice 1 parity RED | `deno task test .llm/tools/validation/check-compat-fixtures_test.ts` via gate runner | EXPECTED_FAIL | Receipt `receipts/01-parity-red.json`; four required rows missing. |
| Slice 2 teardown check | scoped check wrapper on `.llm/tools/agentic/teardown` | PASS | 12 files, 0 findings. |
| Slice 2 teardown tests | structured test wrapper on `probes_test.ts` | PASS | 3/3 tests. |
| Slice 2 teardown fmt | scoped fmt wrapper | PASS | 12 files, 0 findings. |
| Slice 2 excluded lint | scoped lint wrapper | EXPECTED_REFUSAL | Root config excludes `.llm`; wrapper refused all 12 dropped files (exit 2). |
| Slice 2 raw lint | `deno lint --no-config .../probes_test.ts` | PASS | Required config-excluded-file fallback; 1 file checked. |
| Slice 2 raw fmt | `deno fmt --no-config --single-quote --line-width=100 --check <owned files>` | PASS | 3 owned files checked. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| F-3/F-5/F-10/F-19 | NOT_RUN | Slice 5 | Pending implementation. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| AppHost/dashboard capture | N/A | Phase-A boundary | Deferred to lease-backed phase B. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| MCP export corpus | NOT_RUN | Slice 5 | Exports must remain unchanged. |

## Handoff Notes

- Fable supervisor should review parity expectation completeness and the `pending-lease` fail-closed arm first.
