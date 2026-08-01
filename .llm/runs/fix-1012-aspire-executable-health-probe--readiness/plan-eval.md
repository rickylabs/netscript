# PLAN-EVAL — fix-1012-aspire-executable-health-probe--readiness

- Plan evaluator session: Claude Code · OpenRouter · Qwen preset · 2026-08-01
- Run: `fix-1012-aspire-executable-health-probe--readiness`
- Surface / archetype: Archetype 6 — CLI / Tooling
- Scope overlays: service

## Checklist results

| Plan-Gate item                          | Result            | Evidence / location |
| --------------------------------------- | ----------------- | ------------------- |
| Research present and current            | PASS              | `research.md` exists; re-baselined against `main` @ `3ab64720ffe06dedc80f12e8f7bb9fa281de37b9` on 2026-08-01. All six findings verified against source: (1) `generate-register-apps.ts:118` gates probe on `entry.Port` while `needsHttpEndpoint` returns true unconditionally for `type === 'app'`; (2) cause confirmed at same line; (3) `service-builder-impl.ts:359-378` registers `/health`, `/health/live`, `/health/ready`; (4) `create-plugin-service.ts:179` unconditionally calls `builder.withHealth(...)`; (5) `generate-register-services.ts` and `generate-register-plugins.ts` emit `renderHttpEndpointCall` but no `withHttpHealthCheck`; (6) `config.ts:196` has `HealthCheckPath?: string \| false` on `AppEntry` but `ServiceEntry:161` and `PluginEntry:200` lack it. |
| Decisions locked                        | PASS              | `plan.md` D1-D5 each state decision with rationale. D1 (probe every `type === 'app'` independent of Port) — endpoint existence is the precondition. D2 (include services/plugins) — both evidence `/health`. D3 (use `/health` via `RESOURCE_DEFAULTS.AppHealthCheckPath`) — matches evidenced route, avoids duplicate literals. D4 (preserve `HealthCheckPath: false` as only opt-out, emit probe after endpoint) — prevents false-unhealthy, preserves order. D5 (prefer semantic string assertions over whole-output snapshots) — AP-18 compliance. |
| Open-decision sweep                     | PASS              | One open decision: "Live AppHost dead-port test — Safe to defer only with explicit evidence." Plan states: "Attempt only if a stable existing harness fixture exists; otherwise record generator integration floor honestly." Risk register: "The strongest honest automated test may remain generator-level rather than a live AppHost dead-port integration. This will be stated explicitly if no stable fixture is available." This is a feasibility question, not a decision that would force rework if deferred. |
| Commit slices (< 30, gate + files each) | PASS              | 1 slice: "Make readiness reports invariant for generated HTTP executables, with config opt-outs and semantic tests." Gate: "Six requested scoped gates + harness quality/doc gates." Files: "Aspire app/service/plugin generators; generator tests; `packages/aspire/config.ts`; Aspire schema tests; run artifacts." Well-bounded, < 30. |
| Risk register                           | PASS              | `plan.md` lists four risks with mitigations: (1) service/plugin entrypoint does not serve `/health` — scope included only because both builder paths are source-evidenced; preserve explicit opt-out for custom executables; (2) probe precedes endpoint — ordering assertions for app, service, and plugin generated output; (3) contract field parses for apps only — add service/plugin schema tests for default/custom/false; (4) existing non-HTTP app types gain probes — retain strict `type === 'app'` condition and negative tests. |
| Gate set selected                       | PASS              | Required gates from archetype 6 + service overlay selected. Static: CLI template check, Aspire check. Runtime: CLI helper tests, Aspire tests. Quality: lint, format, framework quality gate. JSR: `deno task doc:lint --root packages/aspire --pretty`. Service overlay gates (Contract check, Service check, Runtime health, Trace/log review, Consumer check) acknowledged: Contract check covered by Aspire schema tests; Service check covered by scoped CLI template check; Runtime health "NOT_RUN — feasibility pending — No coverage claim"; Trace/log review N/A (no runtime changes); Consumer check "NOT_RUN — implementation pending — Semantic tests planned." |
| Deferred scope explicit                 | PASS              | `plan.md` "Non-Scope" section: no changes to `tauri`, `desktop`, `task`, background, or tool resources; no CLI health-reporting/status consumer; no change to Aspire's upstream collapse of zero health reports to `Healthy`; no scaffold runtime E2E unless implementation changes scaffold output beyond generated helpers. "Deferred Scope" section in `worklog.md`: "Live AppHost dead-port integration — only if no stable existing fixture can exercise it honestly in this repository harness"; "Aspire upstream zero-report status semantics — not a NetScript-owned surface." |
| jsr-audit surface scan (pkg/plugin)     | PASS              | `research.md` "jsr-audit surface scan" section: surface scanned is `packages/aspire/config.ts` public `ServiceEntry` and `PluginEntry` contracts; generator functions remain internal CLI kernel templates. Slow-type/surface risks: none. The planned fields are explicitly typed optional properties with JSDoc and mirror the existing `AppEntry` field; no export-map, dependency, entrypoint, or inferred-return change. Publish verification remains part of the harness fitness evidence through doc-lint/quality gates where applicable. |

## Open-decision sweep (evaluator-run)

None. The plan's single open decision (live AppHost dead-port test feasibility) is correctly scoped as a feasibility question with an honest floor statement, not a decision that would force rework if deferred. The plan explicitly commits to stating the generator-integration boundary honestly if no stable fixture exists, which is the correct approach for this repository's harness constraints.

## Verdict

`PASS`

## Notes

All load-bearing claims independently verified:

1. **UNPINNED_APP emits endpoint but no probe on baseline** — VERIFIED. `generate-register-apps.ts:118` has `if (type === 'app' && entry.Port)` gating the probe, while `needsHttpEndpoint` (lines 50-54) returns `true` unconditionally for `type === 'app'`. An unpinned app gets `withHttpEndpoint({ env: 'PORT' })` but skips `withHttpHealthCheck(...)`.

2. **Services and plugin services actually serve `/health` strongly enough to justify probes** — VERIFIED. `service-builder-impl.ts:359-378` registers `/health`, `/health/live`, `/health/ready` routes via `withHealth()`. `create-plugin-service.ts:179` unconditionally calls `builder.withHealth(...)`. Both builder paths evidence the route contract.

3. **`HealthCheckPath?: string | false` contract/schema plan is complete** — VERIFIED. Plan adds the field to both `ServiceEntry` and `PluginEntry` interfaces and Zod schemas in `config.ts`, mirroring the existing `AppEntry` pattern (line 196 interface, line 475 schema). The Zod union `z.union([z.string().min(1), z.literal(false)]).optional()` is the correct shape.

4. **Endpoint-before-probe ordering and exclusions for tauri/desktop/task are protected** — VERIFIED. Existing tests in `generators-background-app_test.ts:379-423` assert: probe emitted after endpoint (line 389 `output.indexOf('.withHttpEndpoint(') < output.indexOf('.withHttpHealthCheck(')`); custom path preserved (line 394); `HealthCheckPath: false` opts out (line 405); non-app types (tauri, desktop, task) do not get probes (line 413). The plan extends these assertions to services and plugins.

5. **Validation plan is honest about generator integration floor versus live AppHost dead-port test** — VERIFIED. Plan explicitly states: "The strongest honest automated test may remain generator-level rather than a live AppHost dead-port integration. This will be stated explicitly if no stable fixture is available." Risk register and open-decision sweep both acknowledge this boundary without overclaiming coverage.

Plan is thorough, honest, and well-scoped. Implementation may begin.
