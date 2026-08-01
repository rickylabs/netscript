# Research — fix-1025-aspire-otel-discovery--otel-discovery

## Re-baseline

- Carried-in source: issue #1025 and the user's verified Aspire CLI 13.4.6 reproduction.
- Re-derived against `origin/main` @ `3ab64720ffe06dedc80f12e8f7bb9fa281de37b9` on 2026-08-01.
- The current E2E still starts the generated AppHost with `--isolated`; telemetry commands do not
  accept that flag and do not pass `--dashboard-url`.

## Findings

| # | Finding | How to verify |
| - | - | - |
| 1 | A fresh NetScript-generated TypeScript AppHost reproduces the defect on Aspire CLI 13.4.6. | Start `.llm/tmp/telemetry-1025-repro/aspire/apphost.mts`; automatic `aspire otel traces users --apphost apphost.mts ...` prints `Could not fetch telemetry data from the dashboard. The dashboard is not available.` and exits 12. |
| 2 | Aspire run-state contains the correct URL while automatic discovery fails. | In the same detached-start shell, `aspire ps --format Json` returned `dashboardUrl: https://localhost:42183`. |
| 3 | Dashboard HTTP access works with explicit discovery. | With the run-state URL, `aspire otel traces users --dashboard-url https://localhost:43903 ... --format Json` returned `[]` and exit 0. Empty data is expected in the minimal control before traffic. |
| 4 | The defect is upstream Aspire CLI discovery, not a missing NetScript template publication hook. | The same Aspire process writes the URL to run-state and serves its dashboard; only the CLI's AppHost/backchannel lookup fails. The CLI forbids combining `--apphost` and `--dashboard-url`, so the workaround must target the dashboard directly. |
| 5 | `aspire otel traces --help` and `aspire export --help` expose `--dashboard-url` but no `--isolated`. | Live 13.4.6 help output captured during research. |
| 6 | Existing telemetry checks can silently warn. | `.llm/tools/e2e/scaffold-e2e-test.ts:1227-1264` sets `critical` from `--strict-telemetry`; neither command asserts non-empty JSON. |
| 7 | A minimal C# control was attempted but template resolution exceeded the execution window. | `aspire new aspire-empty ... --language csharp` stopped after `Resolving template version...`; this is partial evidence and is not used to claim parity. |

## jsr-audit surface scan

- N/A: this slice changes repository E2E tooling, skills, and documentation, not a published package surface.

## Open questions

- Must resolve now: exact `aspire ps` selection logic when more than one isolated AppHost is running.
  Resolve by matching the canonical `appHostPath` to `this.appHost`, never selecting array element 0.
- Must resolve now: what counts as non-empty telemetry JSON. Resolve by parsing command stdout and
  requiring a non-empty JSON array for the traces step after the suite has exercised HTTP traffic.
- Safe to defer: upstream behavior on a minimal C# AppHost, because the run-state/backchannel
  asymmetry already locates the failing component in Aspire CLI and the NetScript workaround is the same.
