# Worklog: Canary 9 README service-readiness repair

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `research-aspire-13.5-adoption--0.0.7/slices/leaf-1881-readiness` |
| Branch | `fix/canary-readme-service-readiness` |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | docs |

## Design

### Public Surface

- Root README Quickstart command block — printed user contract.
- `README_QUICKSTART_EXPECTED_COMMANDS` — private executable mirror of that contract.

### Domain Vocabulary

- Service readiness command — the literal `aspire wait users` line a user and gate both execute.
- Health request — bounded curl with HTTP failure-body diagnostics.
- Cleanup child receipt — the ownership-aware post-stop JSON attached to the production run.

### Ports

- Existing `AspireCommandRunner` process edge; no new abstraction.
- Existing `resolveResourceUrlsFromAppHost` endpoint evidence, invoked only after service readiness.

### Constants

- `GATE.README_QUICKSTART_ASPIRE_WAIT_USERS` — stable users-readiness gate ID.
- `CURL_COMMAND_TIMEOUT_MS` — outer ceiling greater than the printed curl ceiling.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 0 | Activate and re-baseline the incident leaf. | artifact review | leaf run artifacts |
| 1 | Print and execute the exact service-readiness and bounded health commands. | focused CLI E2E tests + gate listing | README, domain/runner/suite/constants/tests |
| 2 | Preserve cleanup evidence in production artifacts and finish run records. | workflow regression + YAML parse | workflow, release test, run artifacts |

### Deferred Scope

- Fresh published-canary runtime proof — coordinator-owned after this fix merges and a coherent canary is cut.

### Contributor Path

Edit the marked root README command block and its single expected-command tuple together; the drift and suite tests identify any mismatch by exact index.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-03T04:20Z | 0 | bootstrap | Reconciled exact main and run `33712927776`; recorded PLAN-EVAL N/A before implementation. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Printed readiness, no hidden argv | Gate exists to prove exactly what a user reads. | #1881 + run `33712927776` |
| Issues remain open | Hosted clean-runner acceptance is not yet green. | #1881 acceptance |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Canary 9 proved endpoint allocation did not imply service readiness. | significant | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| focused check/test/lint/fmt | pending | NOT_RUN | implementation not started |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| quality/doctrine | NOT_RUN | pending | no package public surface planned |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| hosted `readme.quickstart` | NOT_RUN | next canary | globally serialized release proof |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| README command parser/suite | NOT_RUN | pending | exact command list + gates |

## Handoff Notes

- Inspect that users readiness is printed and executed exactly, port capture moved to that line, curl is bounded in argv, and both cleanup receipt files are uploaded.

