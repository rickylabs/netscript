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
| 4 | The defect is NetScript-side: anonymous dashboard mode suppresses the login-token URL needed by automatic discovery. | In the disposable generated scaffold, remove only `ASPIRE_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS` from both `aspire.config.json` and `configure-dashboard.mts`; a detached isolated start then prints a tokenized dashboard login URL and automatic `aspire otel traces users --apphost apphost.mts ...` returns `[]`, exit 0. |
| 5 | `aspire otel traces --help` and `aspire export --help` expose `--dashboard-url` but no `--isolated`. | Live 13.4.6 help output captured during research. |
| 6 | Existing telemetry checks can silently warn. | `.llm/tools/e2e/scaffold-e2e-test.ts:1227-1264` sets `critical` from `--strict-telemetry`; neither command asserts non-empty JSON. |
| 7 | `ASPIRE_ALLOW_UNSECURED_TRANSPORT` is not the cause and must remain. | Removing it makes startup fail because NetScript configures an HTTP OTLP endpoint; restoring it while leaving anonymous mode unset makes discovery pass. |
| 8 | The presumed isolated-mode defect does not exist after the template fix. | The passing control used `aspire start --isolated` and automatic `aspire otel traces ... --apphost apphost.mts`; no `--isolated` option is needed on the consumer command. |
| 9 | Anonymous mode is emitted twice by NetScript. | `generate-aspire-config.ts` writes the environment variable into `aspire.config.json`; `configure-dashboard.ts.template` sets it in the AppHost process. Both must be removed and the embedded asset regenerated. |

## jsr-audit surface scan

- N/A: this slice changes repository E2E tooling, skills, and documentation, not a published package surface.

## Open questions

- Must resolve now: what counts as non-empty telemetry JSON. Resolve by parsing command stdout and
  requiring a non-empty JSON array for the traces step after the suite has exercised HTTP traffic.
- Safe to defer: no open cause question remains; the local A/B control directly changed the failing behavior.
