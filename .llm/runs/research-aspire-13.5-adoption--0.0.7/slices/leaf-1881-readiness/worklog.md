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
| 2026-09-03T04:30Z | 1 | implement | Printed a literal users-health wait after DB setup, moved endpoint capture to that command, and bounded the printed curl at 15 seconds with HTTP/body diagnostics. |
| 2026-09-03T04:33Z | 1 | tests | Focused structured tests PASS 22/22; exact parser/argv test and full fake-runner sequence prove no hidden readiness command and one post-readiness port capture. |
| 2026-09-03T04:35Z | 2 | implement | Added both `readme.quickstart` cleanup wrapper/child receipts to the production artifact upload and pinned them in the release workflow test. |
| 2026-09-03T04:38Z | 2 | reconcile | #1881, #863, and epic #1712 remain open because a new hosted published-version run is still required; PR #1981 references rather than closes them. |
| 2026-09-03T04:45Z | 2 | push | Implementation and focused evidence pushed at `8704b0571`; separate-session IMPL-EVAL remains the only pre-merge harness gate. |

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
| focused tests | structured test wrapper | PASS | 22 passed, 0 failed. |
| focused check | structured check wrapper | PASS | 8 files, 0 diagnostics. |
| focused lint | structured lint wrapper | PASS | 7 E2E files processed, 0 findings; root policy intentionally excludes `.llm/**`, so the release workflow test is test/check/fmt-covered but not a lint verdict target. |
| focused fmt | structured fmt wrapper | PASS | 7 E2E files, 0 findings; release test raw format check also passed. Root README retains unrelated pre-existing formatting drift and was not mass-formatted. |
| full nested E2E tests | structured test wrapper | FAIL (environment baseline) | 366 passed, 2 browser-fixture tests failed because executable fixtures under `/ephemeral/tmp` are noexec; neither file/path is touched by this slice. |
| workflow YAML | `@std/yaml` parse | PASS | `YAML_PARSE_OK`. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| quality/doctrine | PASS | `deno task quality:gate` | Repository scan and doctrine report `ok: true` / `FAIL=0`; existing WARN rows unchanged. |
| Aspire parity phase 2 | FAIL (parallel S9/S13 baseline) | 6 existing findings | Manifest freshness, skill bundle, docs checker, and legacy literal work is owned by the active Aspire convergence lane; no finding names a changed file in this slice. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| hosted `readme.quickstart` | NOT_RUN | next canary | globally serialized release proof |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| README command parser/suite | PASS | `e2e:cli suites` + `gates readme.quickstart` | 12 exact printed commands plus ownership-aware cleanup; users wait is command 11, bounded curl command 12. |
| docs carrier | PASS | `deno task check:agent-docs-prose` | Generated agent docs bundle fresh. |

## Handoff Notes

- Inspect that users readiness is printed and executed exactly, port capture moved to that line, curl is bounded in argv, and both cleanup receipt files are uploaded.
