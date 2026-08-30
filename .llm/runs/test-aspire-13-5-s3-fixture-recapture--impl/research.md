# Research — test-aspire-13-5-s3-fixture-recapture--impl

## Re-baseline

- Carried-in sources: issue #1715, epic #1712, D-13 on
  `origin/research/aspire-13.5-0.0.7`, and S2 receipts on
  `origin/test/aspire-13-5-s2-runtime-verification`.
- Re-derived against `origin/main` at `13878a80a50c55b9662099fed64555f2310ae4a3` on 2026-08-30.
- Current main has the five 13.4.6 compat cases but no parity phase-2 hook and no 13.5.3 cases.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | D-13 requires all five `compat-fixture` rows to retain 13.4.6 and add 13.5.3 beside it. | Research plan D-13 and manifest `compat-fixture` rows. |
| 2 | S2 `aspire ps` adds only `logFilePath`; the other teardown fields remain stable. | S2 `02-v5-aspire-ps-final.json` and `02-v5-shape-comparison.md`. |
| 3 | S2 `aspire describe` keeps `{ resources: [...] }`, `{ name, url }` URL entries, and string environment values; secrets are redacted. | S2 `02-v5-aspire-describe-final.json` and shape comparison. |
| 4 | S2 contains no dashboard telemetry envelopes. | S2 receipt inventory; issue dispatch's known-fact boundary. |
| 5 | Existing 13.4.6 telemetry envelopes were captured from dashboard resources/spans endpoints after the health-check worker job. | `packages/mcp/tests/fixtures/telemetry/aspire-13.4.6-fixture.ts`. |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `packages/mcp` and `packages/telemetry` export posture.
- Slow-type / surface risks: none introduced; this run changes tests and fixture documentation only.
- Locked invariant: `deno task check:mcp-export-corpus` must pass without regeneration; no export,
  metadata, publish list, or public documentation change is authorized.

## Open questions

- None for phase A. Phase B requires a supervisor-issued runtime lease and capture command.
