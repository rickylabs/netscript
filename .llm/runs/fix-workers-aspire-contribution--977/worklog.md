# Worklog — workers Aspire contribution and plugin RPC seam

## Design

### Public surface

- A service-owned pure RPC-prefix derivation used by server and SDK client.
- `PluginServiceConfig.apiVersion?: string`, defaulting to the shared `v1` convention.
- No workers plugin export change; its Aspire declaration changes meaning from literal endpoint to
  resource endpoint.

### Domain vocabulary and ports

- Canonical RPC prefix: API base + API version + router name.
- Legacy RPC prefix: `/api/rpc`, registered as a compatibility alias.
- `EnvSource` resource reference names the `workers-api` endpoint; `AspireBuilder.waitFor` records
  the real startup edge.
- No new port: the existing `AspireBuilder` and service builder are the exercised seams.

### Constants

- Default RPC API path `/api/rpc`, default version `v1`.
- Workers API resource `workers-api`, default port `8091`, combined resource `workers-combined`.

### Commit slices

1. **S1 — lock and test the shared publication contract.** Change service/plugin/SDK route
   derivation, keep the legacy alias, replace the false-green SDK test with the real plugin factory,
   and prove red-before/green-after. Files: service RPC convention/wiring and exports, plugin factory
   and tests, SDK client/test and package imports. Gates: focused tests plus scoped check/lint/fmt.
2. **S2 — make the workers Aspire graph truthful.** Publish resource-backed env, derive health from
   allocated port, select one default runtime, and record wait/reference edges. Files: workers
   contribution/tests and run artifacts. Gates: workers focused test plus scoped check/lint/fmt.
3. **S3 — integration and publish evidence.** Run affected package/plugin tests, JSR audits,
   quality gate, doctrine gate, and required runtime/consumer smoke; update PR/run evidence. Files:
   run artifacts and PR metadata only unless a reviewed fix is required.

### Deferred scope

- General consumption of every plugin `declareEnv()` by generated AppHosts is not introduced here.
- Other plugins' hardcoded Aspire URLs are follow-up candidates, not silent scope expansion.
- Broad service/plugin doctrine debt is unchanged.

### Contributor path

Add or change an RPC route prefix in the service-owned convention, then consume it from both the
server factory and SDK link. Add a workers Aspire dependency through `AspireBuilder`, and keep
non-Aspire runtime fallback at the consumer edge.

## PLAN-EVAL

- Separate evaluator: Qwen 3.7 Max via Claude Code + OpenRouter, session
  `12f40bb8-5391-475b-8b20-8a0dd0eec4a2`.
- Verdict: `PASS` — all eight Plan-Gate checks satisfied.
- Invalid prior launch: rejected and terminated after it attempted closed-model delegation; see
  `drift.md`. It produced no accepted verdict.

## S1 — shared RPC publication contract

- Added service-owned `buildServiceRpcPath` through the lightweight `@netscript/service/rpc-path`
  subpath; the SDK derives the canonical client prefix from it while the plugin factory mounts the
  assembled router once at the shared RPC base.
- `assemblePluginContractRouter` now owns the `version/routerName` tree and retains the beta.11
  version-only branch for compatibility. A matched legacy route emits one process-local structured
  deprecation warning.
- Replaced the false-green SDK setup with the real `createPluginService` factory **and** the real
  `assemblePluginContractRouter` production shape; added direct canonical + legacy assertions.
- Dependency change used `deno add` from `packages/sdk`; `deno.lock` changed only by adding the SDK
  workspace dependency edge to `@netscript/service@0.0.1-beta.11`.

### Regression proof

| State | Command | Result |
|---|---|---|
| old production binder temporarily restored | `deno test --allow-all packages/sdk/tests/integration/workers-trigger-rpc_test.ts` | FAIL, exit 1, `Error: Not Found` at the real client round trip |
| fix restored | same command | PASS, 1 passed / 0 failed |

### Gates

| Gate | Result |
|---|---|
| focused service/plugin/SDK tests | PASS, 5 passed / 0 failed |
| scoped check: service + plugin + SDK | PASS, 269 files, 0 diagnostics |
| scoped lint: service + plugin + SDK | PASS, 269 files, 0 findings |
| scoped fmt: service + plugin + SDK | PASS, 269 files, 0 findings |
| `deno task quality:gate` | PASS; code-quality scan 0 findings, doctrine 0 FAIL (pre-existing WARN/INFO retained) |

### Reconcile

The first opposite-family review rejected the initial guard because its router was flat while every
production plugin router is assembled. That finding was fixed before commit and the red/green proof
was repeated against the assembled shape. PR #987 remains draft and carries both closing keywords.
The issue correction for #977 is deferred until S2 proves the exact graph shape.

## S2 — truthful workers Aspire graph

- `WORKERS_API_URL` is resource-backed and `workers-combined` explicitly waits for `workers-api`;
  the environment value and graph edge are separate contracts.
- The default graph now registers the API plus combined runtime only, avoiding duplicate scheduler
  and worker processes while leaving standalone manifest modes intact.
- Listener and health URLs both use the contribution context's allocated port.
- Corrected #977 on the issue itself: `issuecomment-5145179379`.

### Regression proof

| State | Command | Result |
|---|---|---|
| production contribution before fix | `deno test --allow-all plugins/workers/tests/aspire/workers-contribution_test.ts` | FAIL, exit 1, four resources observed instead of two |
| fix restored | same command | PASS, 1 passed / 0 failed; port 9191, resource env, wait edge, and exact resource set asserted |

### Current scoped gates

| Gate | Result |
|---|---|
| focused RPC + Aspire tests | PASS, 4 passed / 0 failed |
| scoped check: service/plugin/SDK/workers/triggers | PASS |
| scoped lint: same roots | PASS, 440 files, 0 findings |
| scoped fmt: same roots | PASS after formatting, 440 files, 0 findings |

### S1 review

Opposite-family reviewer `claude-opus-5`, session
`91d34eb6-8829-4376-b1b1-de542c875872`, returned `SLICE_REVIEW_PASS` after two blocking
compatibility findings were fixed: the production router false green and accidental REST/OpenAPI
route movement. The final design uses a canonical OpenAPI router plus an RPC-only compatibility
view, and gives service names that differ from router namespaces an explicit `routerName`.
