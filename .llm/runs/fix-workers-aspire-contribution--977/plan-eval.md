# PLAN-EVAL — fix-workers-aspire-contribution--977

- Plan evaluator session: Qwen 3.7-max / 2026-07-31
- Run: fix-workers-aspire-contribution--977
- Surface / archetype: Archetype 5 (Plugin Package) — workers Aspire contribution (#977) and plugin RPC mount seam (#960)
- Scope overlays: service, plugin, and SDK shared convention surfaces (RPC prefix derivation); workers Aspire contribution graph

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research.md` exists; states "Re-baselined 2026-07-31 against the checked-out beta.12 branch and `origin/main`. The carried-in context and plan were hypotheses, not verdicts." Six findings enumerated. |
| Decisions locked                        | PASS   | `plan.md` §5 locks four decisions with rationale: (1) triple registration is duplicate default, (2) service-owned canonical RPC prefix, (3) legacy `/api/rpc` as beta.12 alias, (4) resource-shaped `WORKERS_API_URL` with explicit graph edges. |
| Open-decision sweep                     | PASS   | `plan.md` §6 states "No must-resolve implementation decisions remain." Safe-to-defer items listed: general AppHost consumption of all `declareEnv()` values, migration of analogous sagas/triggers/streams literals, broad doctrine debt. None would force rework if deferred. |
| Commit slices (< 30, gate + files each) | PASS   | 3 slices (S1–S3), ordered: S1 locks shared publication contract, S2 makes workers Aspire graph truthful, S3 integration and publish evidence. Each names proving gates and file scope. |
| Risk register                           | PASS   | `plan.md` §6 risk register lists 5 risks with mitigations: legacy RPC callers, all plugin factories moving, resource env shape lacking graph edge, port relocation leaving probe stale, duplicate workers continuing. |
| Gate set selected                       | PASS   | `plan.md` §6 selects gates from `archetype-gate-matrix.md` for Arch 5: focused semantic tests, scoped check/lint/fmt, `quality:gate`, affected doc-lint/publish dry-runs/JSR audit, plugin verification, runtime and consumer round-trip, `arch:check`. Full scaffold runtime smoke scoped conditionally. |
| Deferred scope explicit                 | PASS   | `plan.md` §6 and `worklog.md` Design §"Deferred scope" both state: no Aspire framework redesign, no generated CLI asset changes, no beta.12 legacy alias removal, no broad doctrine debt restructuring. |
| jsr-audit surface scan (pkg/plugin)     | PASS   | `research.md` §"Doctrine / JSR surface scan" identifies effective profile Arch 5, names affected packages (service, plugin, SDK, workers plugin), states current doctrine verdicts (SDK Keep; service Refactor; plugin historical; workers Refactor), identifies public-surface risk (new shared path builder needs explicit types/JSDoc), and notes publish checks must cover all four packages. No slow-type inference planned. |

## Spot-check of load-bearing findings

Each finding was verified against the current tree:

1. **Finding #1 (RPC path drift)**: CONFIRMED. `create-plugin-service.ts:159` calls `builder.withRPC({ traceContext: ... })` with no `rpcPath`, so `service-builder-impl.ts:216` defaults to `'/api/rpc'`. Meanwhile `service-client.ts:45-46` defaults `apiPath='/api/rpc'` and `apiVersion='v1'`, and `http-client-link.ts:86` constructs `${baseUrl}/api/rpc/v1/${pathSegment}`. The server mounts at `/api/rpc/<procedure>` but the client requests `/api/rpc/v1/<routerName>/<procedure>` — the drift is real.

2. **Finding #1 (false-green SDK test)**: CONFIRMED. `workers-trigger-rpc_test.ts:56` hand-builds the server with `.withRPC({ rpcPath: RPC_PATH })` where `RPC_PATH = '/api/rpc/v1/workers'` — exactly the mount the real `createPluginService` factory does not produce. The test passes today while production 404s.

3. **Finding #2 (EnvSource)**: CONFIRMED. `env-source.ts` defines `EnvSource` with `{ kind: 'resource'; resource: string; key: string }`. `workers-contribution.ts:81` returns `WORKERS_API_URL: 'http://localhost:8091'` (a plain string, not a resource reference). `aspire-builder-port.ts` provides `reference()` and `waitFor()` as separate operations — declaring a resource env source alone does not create a graph dependency edge.

4. **Finding #4 (triple registration)**: CONFIRMED. `workers-contribution.ts:42-75` registers `workers-api` (service), `workers-combined` (background), `workers-scheduler` (background), and `workers-worker` (background) — four resources, with the combined entrypoint starting both scheduler and worker functions internally. No enablement condition gates the registration.

5. **Finding #6 (blast radius)**: CONFIRMED. grep shows `createPluginService` is used by: auth (`plugins/auth/services/src/main.ts:70`), sagas (`plugins/sagas/services/src/main.ts:69`), streams (`plugins/streams/services/src/main.ts:23`), and workers (via the plugin factory). All are affected by the canonical RPC prefix change.

6. **Finding #3 (port allocator)**: CONFIRMED. `workers-contribution.ts:45` uses `ctx.port('workers-api', 8091)` as the port authority.

## Open-decision sweep (evaluator-run)

Independently reviewed the plan for decisions left open that would force rework if deferred:

- **Deprecation signal mechanism**: The plan mandates a "once-per-process deprecation signal" for the legacy `/api/rpc` alias but does not specify the mechanism (console.warn, structured log, one-time flag). This is safe to defer — it is an implementation detail that does not affect the contract, and swapping mechanisms later requires no caller changes.
- **Resource env `key` value**: The research mentions `{ kind: 'resource', resource: 'workers-api', key: 'url' }` but the plan does not lock the exact `key` string. Safe to defer — the key is consumed only by the Aspire adapter resolution layer and is not part of the plugin's public surface.
- **`verify-plugin.ts` impact**: The plan changes the default Aspire graph to start only `workers-combined` but the manifest retains all three background processors. `verify-plugin.ts` asserts manifest shape (all three present), not Aspire graph selection. No conflict; no rework risk.

**No overlooked decisions found that would force rework if deferred.**

## Verdict

`PASS`

## Notes

The plan is well-structured and demonstrates strong understanding of the defect seam. The core insight — that both #977 and #960 are the same mistake at two altitudes (a plugin re-states by hand what the builder/SDK should derive) — is sound and verified against the tree. The additive-then-deprecate compatibility story is appropriate for beta.12. The regression guard requirements correctly identify the false-green SDK test trap. The three-slice ordering (contract first, graph second, evidence third) is sound. Implementation may begin.
