# Worklog: detached Aspire telemetry discovery

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1025-aspire-otel-discovery--otel-discovery` |
| Branch | `fix/1025-aspire-otel-discovery` |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | `docs` |

## Design

### Public Surface

- No NetScript public API or CLI verb changes.
- Repository E2E behavior: detached scaffold runtime telemetry becomes a semantic gate.
- Generated scaffold surface: authenticated dashboard URLs remain automatically discoverable.

### Domain Vocabulary

- `OutputAssertion` — an internal post-command semantic assertion for captured stdout.

### Ports

- Existing `Deno.Command` harness boundary only; no new port is warranted.

### Constants

- Telemetry export filename; no new extensible enum axis.

### Commit Slices

| # | Slice | Gate | Files |
| - | - | - | - |
| 1 | Bootstrap research/plan and obtain PLAN-EVAL | PLAN-EVAL PASS | `.llm/runs/.../*` |
| 2 | Remove anonymous dashboard mode at both generator sources | focused template tests + asset generation | `generate-aspire-config.ts`, `generate-aspire-config_test.ts`, `configure-dashboard.ts.template`, `generators-pipeline_test.ts`, `embedded.generated.ts`, `docs/site/explanation/aspire.md`, run artifacts |
| 3 | Strengthen automatic detached telemetry/export regression | scoped check/lint/fmt + focused tests | `.llm/tools/e2e/scaffold-e2e-test.ts`, tests, run artifacts |
| 4 | Execute one-pass runtime evidence and final evaluation | scaffold runtime + IMPL-EVAL | run artifacts and PR/issue evidence |

### Deferred Scope

- C# AppHost parity control — the NetScript A/B control directly established the cause.

### Contributor Path

Start at the dashboard environment variables in `generate-aspire-config.ts` and the dashboard helper
template; runtime proof lives at `#checkTelemetry()` in `.llm/tools/e2e/scaffold-e2e-test.ts`.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-01 21:21 CEST | 1 | research complete | Exact failure exit 12 and explicit-URL exit 0 reproduced on generated TS AppHost. |
| 2026-08-01 21:26 CEST | 1 | discriminator complete | Removing anonymous mode restored tokenized URL and automatic traces exit 0 under `--isolated`. |
| 2026-08-01 21:38 CEST | 1 | export amendment complete | Patched detached export saved a 12,857-byte zip and exited 0. |
| 2026-08-01 21:41 CEST | 1 | token blast-radius audit | 53 files matched dashboard/open/`:18888` guidance; wider alignment reported, not expanded. |
| 2026-08-01 21:47 CEST | 2 | generator fix complete | Removed anonymous dashboard mode from config and helper sources, regenerated embedded assets, and corrected the verbatim docs sample. |
| 2026-08-01 21:49 CEST | 2 | focused gates complete | Generator tests: 3 passed / 21 steps; scoped template check, lint, and fmt passed; docs maintenance passed. |
| 2026-08-01 21:52 CEST | 3 | harness assertion implemented | Automatic traces now require a non-empty JSON array; export requires a non-empty archive; both are critical gates. |
| 2026-08-01 22:02 CEST | 3 | independent slice review FAIL | Opus session `5744e2a4` found authenticated-dashboard blast radius in the real `scaffold.runtime` telemetry consumers and generated telemetry UI. Sign-off withheld. |
| 2026-08-01 23:48 CEST | C2-S0 | rejected implementation restored | All seven named product/diagnostic files restored to `origin/main`; run artifacts retained. |
| 2026-08-01 23:55 CEST | C2-S1 | A/B diverged; implementation stopped | Authenticated and anonymous detached starts both returned automatic traces `[]`, exit 0. Owner stop condition invoked. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| NetScript-side classification | Removing only anonymous mode changed automatic discovery from exit 12 to exit 0. | research F4, F7-F9 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| C# control template creation exceeded tool execution window | minor | yes |

## Gate Results

- PLAN-EVAL launch: BLOCKED before launch. Live provider canary reported absent OpenRouter
  credential (`auth_required`) for the canonical Qwen evaluator route. No implementation started.
- Separate owner-supervisor PLAN-EVAL at `575aea3fb`: FAIL_PLAN; required the anonymous-mode A/B
  control and an honest acceptance mapping. Both plan defects are now amended for cycle 2.
- Supervisor cycle-3 adjudication: conditional PASS. Findings A/B, token audit, and the published
  package gate-table amendment are complete; implementation is authorized.
- Generator focused tests: PASS — 3 tests, 21 steps, 0 failures.
- Template scoped check/lint/fmt: PASS — 28 TypeScript files, zero findings.
- E2E harness scoped check/lint/fmt: PASS — 1 TypeScript file, zero findings after targeted format.
- Docs maintenance: PASS — 98 docs, zero broken links/anchors, docs accuracy PASS, Claude skill sync PASS.
- Docs site build: output reached Lume configuration and diagram verification, but the wrapper did
  not return a definitive exit code; do not claim this gate until rerun yields a terminal verdict.
- Package quality gate: PASS — quality scan returned no findings and doctrine/dependency checks
  completed successfully.
- Independent Tier-A slice review: FAIL — the security-posture change breaks unauthenticated
  dashboard API consumers outside the initially inspected harness. Full runtime E2E not run.
- Cycle-2 Plan-Gate: supervisor-authored `plan-eval-cycle2.md` records PASS with binding partial-
  acceptance limitations; no generator evaluator/provider command was attempted.
- Cycle-2 A/B: DIVERGED — automatic traces exit 0 in both authenticated and anonymous modes.
- Full `scaffold.runtime`: NOT RUN because the cause-verification stop condition fired first.
- Acceptance box 4 upstream issue: owner action required if the final classification is upstream;
  this lane has no authority to file on `dotnet/aspire`.
