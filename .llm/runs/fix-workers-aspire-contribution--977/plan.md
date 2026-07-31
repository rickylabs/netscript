# Plan — workers-aspire-contribution (#977, #960)

PR: #987 · Milestone: 0.0.1-beta.12 · Branch `fix/workers-aspire-contribution`

This slice changes a contract and what an existing configuration *means*, so it plans before it
codes.

## 1. The shared cause

Both issues are the same seam: **a plugin publishes a fact about itself that a generated consumer
independently re-derives, and the two derivations are not the same function.**

| | plugin publishes | consumer derives | drifts when |
|---|---|---|---|
| #977 | `WORKERS_API_URL: 'http://localhost:8091'` (literal, `declareEnv`) | Aspire resource endpoint plus an explicit builder dependency edge | the port moves — `ctx.port('workers-api', 8091)` relocates the listener, the literal does not follow |
| #960 | RPC mounted at `withRPC` default `/api/rpc` (`create-plugin-service.ts:159` passes no `rpcPath`) | `${baseUrl}/api/rpc/v1/${routerName}` (`http-client-link.ts:86`) | always — the server never had a version or router segment to begin with |

The literal in `declareEnv` and the missing `rpcPath` in `createPluginService` are the same
mistake at two altitudes: the endpoint a plugin *is reachable at* is owned by the Aspire builder
and the SDK path rule respectively, and in both places the plugin re-states it by hand instead of
asking.

**Fix once, at the derivation, not at each literal.** Concretely that means: the workers
contribution must publish `WORKERS_API_URL` as a reference to the same `workers-api` resource (the
`EnvSource` the signature already admits) and separately record the real builder dependency edge;
`createPluginService`
must mount at the path the SDK's client-side rule produces for that plugin's router name and API
version — one shared function consulted by both sides, not two constants that happen to match.

If Codex's reading of the code contradicts this framing, the framing loses. Say so in the PR and
correct the issues.

## 2. The contract change

Two public surfaces move:

**(a) Plugin RPC mount path.** Plugin services currently answer at `/api/rpc/<procedure>`. After
this change they answer at the path `createServiceClient` derives — `/api/rpc/v1/<routerName>/<procedure>`.
This is a **breaking change to a URL that hand-written callers may already depend on**, and #960
records that at least one consumer worked around the 404 by hand-building a fetch against the old
shape. That workaround must keep working or must be explicitly declared dead — decide which, and
say which in the PR body.

**(b) `WORKERS_API_URL` semantics.** The variable keeps its name and stays a URL, but stops being
a compile-time constant and becomes a value the Aspire graph supplies. Anything reading it at
module scope before the graph resolves, or asserting the literal `http://localhost:8091` in a
test or fixture, changes behavior. `declareHealthChecks()` hardcodes the same origin and must move
with it, or the health probe will keep passing against a port nothing listens on.

## 3. Compatibility story for existing workspaces

Required, not optional. A generated workspace that was scaffolded before this change must not
break silently on upgrade.

- **Prefer additive-then-deprecate for the mount path**: mount the derived path *and* keep the
  legacy `/api/rpc/<procedure>` prefix responding for beta.12, with the legacy prefix logging a
  deprecation once per process. A hard cutover is acceptable only if Codex can show the legacy
  shape has no reachable consumer — and "no test covers it" is not that proof.
- **`WORKERS_API_URL` must retain a working fallback** when no Aspire graph supplied it (plain
  `deno task` runs, unit tests, CI without an AppHost). Falling back to the previous literal is
  fine; falling back to `undefined` and throwing at first use is not.
- Any scaffolded template, fixture, or doc that spells either value literally is part of the
  change surface. Grep for `8091` and for `/api/rpc` across `packages/cli/src/kernel/assets`,
  `plugins/*`, and `docs/` before declaring the sweep complete.
- **Every service already using `createPluginService` is affected**, including workers, auth, and
  sagas; streams/triggers convergence remains separately tracked. The real caller set must be
  checked from code rather than assumed from the intended five-plugin architecture.

## 4. Regression guard required

The guard must fail when the defect is reintroduced, and must be *proved* to fail — break the
fix, watch it go red, restore, watch it go green, and report that as fails-before evidence.

- **For #960**: an integration test that starts a plugin service through the **real**
  `createPluginService` (not a hand-rolled `createService(...).withRPC({ rpcPath })`) and calls it
  through a **real** `createServiceClient({ serviceName, routerName })`, asserting a 2xx round
  trip. Deleting the `rpcPath` derivation must turn it red.
  **Note the trap:** `packages/sdk/tests/integration/workers-trigger-rpc_test.ts` already claims to
  cover this and passes today *while production 404s*, because it hand-builds the server with
  `withRPC({ rpcPath: '/api/rpc/v1/workers' })` — the exact mount the real factory does not
  produce. Treat that test as a false green: fix it to go through the real factory, or replace it.
  Do not add a second test alongside it that repeats the same mistake.
- **For #977**: an assertion over the contribution graph — that the combined background resource
  waits for `workers-api`, `WORKERS_API_URL` is a resource endpoint reference, and relocating
  `ctx.port('workers-api', ...)` moves both the service port and health URL. A test that only
  asserts the string `http://localhost:8091` re-encodes the bug.

## 5. Locked implementation decisions

1. The triple registration is a real duplicate default runtime. The Aspire contribution will start
   only `workers-combined`; the manifest retains standalone worker/scheduler entries as explicit
   alternative modes.
2. The service package owns a pure canonical RPC-prefix derivation with defaults `/api/rpc` and
   `v1`. Both `createPluginService` and `createServiceClient` call it. Plugin config may override
   `apiVersion` without changing existing callers.
3. Plugin services mount the canonical prefix and retain `/api/rpc` as a beta.12 compatibility
   alias with a once-per-process deprecation signal.
4. Workers publishes a resource-shaped `WORKERS_API_URL`, derives the health URL from the allocated
   port, and explicitly records background-to-API startup dependency. Existing non-Aspire consumer
   fallbacks remain unchanged.

## 6. Archetype, gates, risk, and scope

- **Archetype:** 5 (Plugin Package). Shared convention changes also touch the service/plugin/SDK
  public surfaces; thinness requires the convention in core rather than workers.
- **Doctrine verdict:** SDK `Keep`; service `Refactor`; workers `Refactor`. No broad debt remediation.
- **In-scope anti-patterns:** AP-9/AP-10 duplicated convention, AP-14 plugin redefinition,
  AP-19 runtime declaration correctness, AP-23 registration wiring.
- **Required gates:** focused semantic tests; scoped check/lint/fmt for every changed root;
  `quality:gate`; affected doc-lint/publish dry-runs/JSR audit; plugin verification; runtime and
  consumer round-trip; `arch:check`. The full scaffold runtime smoke is required only if generated
  assets change.

### Risk register

| Risk | Mitigation |
|---|---|
| Legacy hand-written RPC callers break | Additive `/api/rpc` alias retained and directly tested |
| All plugin factories move routes | Default from existing `config.name`; check every factory caller |
| Resource env shape lacks graph edge | Explicit `waitFor` assertions over the in-memory graph |
| Port relocation leaves probe stale | Test with a custom allocator and assert env indirection + moved health URL |
| Duplicate workers continue | Assert exact default resource set and edge |

### Open-decision sweep

- No must-resolve implementation decisions remain.
- Safe to defer: general AppHost consumption of all `declareEnv()` values; migration of analogous
  sagas/triggers/streams literals; broad doctrine debt.

### Deferred scope

The slice does not redesign the Aspire contribution framework, change generated CLI assets, remove
the beta.12 legacy RPC alias, or restructure existing package/plugin debt.
