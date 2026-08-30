# S3 Tier-A slice review — #1715 / PR #1741 (phase A)

- Reviewer: Fable 5 medium supervisor; generator: GPT-5.6 Sol medium, thread
  `01a05045-3929-7fd2-b889-60bde60b3849`. Review worktree
  `/home/codex/repos/netscript-aspire-13-5-s3-eval` (detached).
- Exact head reviewed: `a964a2120` (base `origin/main` `13878a80a`). Phase A only — the dashboard
  telemetry envelope capture (phase B) is lease-backed and pending on #1712.

## Commit stack
`c6afffd1a` parity test RED (run-gate receipt `01-parity-red.json`, FAIL on base) → `b8b1c3b6f`
`aspire-ps-13.5.3.json` + teardown probes both versions + README → `2e4e3e785` 13.5.3 banner +
`describe` shape in `service-endpoint-source-fixtures.ts`, `generated-app-endpoint_test.ts`,
`service-env-evidence_test.ts` cases beside kept 13.4.6 → `37f0487f1` telemetry fixtures README
(phase-B procedure, no fabrication) → `a964a2120` gate receipts + `#413` comment draft.
10 product/tool files, +320/−110; no `*13.4.6*` file touched.

## Substantive review
- `aspire-ps-13.5.3.json`: key set equals S2 receipt `02-v5-aspire-ps-final.json` (adds
  `logFilePath`), `sdkVersion` 13.5.3, lower-case `running`; `appHostPath`/pids/`dashboardUrl`
  normalised to the 13.4.6 fixture's values so teardown expectations stay shared — README states
  the copy-then-redact provenance. Acceptable.
- `describe` fixture: 13.5.3 banner + `{ resources: [...] }` with the S2 key set; kept 13.4.6 case.
- Parity test `check-compat-fixtures_test.ts`: every D-13 `compat-fixture` manifest row must keep
  13.4.6 and carry a 13.5.3 case; the telemetry row is `pending-lease` and the test flips RED if a
  phase-B file lands without promoting it — exactly the brief's contract.
- `#413` comment draft is explicitly post-phase-B. PR body states phase B and stays draft.
- Boundaries: no adapter change, no runtime start, no capture, no pins.

## Gates executed by the reviewer at `a964a2120`
| Gate | Result |
| --- | --- |
| configured `deno task lint` | exit 0 |
| `quality:scan` / `arch:check` | ok / exit 0 |
| `check:mcp-export-corpus` | OK (corpus unchanged) |
| `run-deno-test` mcp, telemetry, teardown, parity test, cli e2e cases | 282 passed / 0 failed |
| `run-deno-check` mcp, telemetry, teardown, validation, cli/e2e | 0 diagnostics |
| raw `deno lint --no-config` / `deno fmt --check` on changed TS | clean (5 files) |
| new lint-ignore / `as unknown as` / `any` | 0 |

## Findings
1. process — runner looped 7 turns after the child's phase-A completion (final message was a
   status table, not a bare `DONE`); runner stopped by the supervisor, no branch mutation.

No blocking finding. **Tier-A verdict: sign-off to IMPL-EVAL (phase A) at `a964a2120`.** The PR
stays draft until phase B lands under the lease.

## IMPL-EVAL cycle 1 (session `81638614`, head `a964a2120`) — `FAIL_FIX`

- H-1: the retained 13.4.6 `describe` compat case in `service-endpoint-source-fixtures.ts` was
  reshaped (shared object, `displayName` added), silently removing the adapter's `resourceName`
  DCP-suffix fallback test. **Tier-A miss** — I verified "no `*13.4.6*` file touched" by filename
  and did not diff the inline 13.4.6 case; checklist updated: diff every inline compat case
  against `origin/main`.
- M-1: 13.5.3 describe case = 13.4.6 data + synthetic banner, with a "captured live" provenance
  comment. L-1 README fmt; L-2 omitted-key list.
- Fix brief sent on the thread (slice 6). Cycle 2 follows at the slice-6 head.
