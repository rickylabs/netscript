# feat(cli): app-side client/query wiring is a one-shot template with hardcoded names, colliding 'service' cache keys and a no-op invalidation — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** T2-02 · **Proposed milestone:** 0.0.7 (new "Typed seams + generation" cut per the
Stage-E rename-shift; if the train is not shifted, `Backlog / Triage`) · **Labels:** `type:feat`
`area:cli` `area:sdk` `area:contracts` `priority:p1` `status:triage` · **Depends on:** T1-01 /
RFC-A **only** for including installed plugin SDK contributions; the manifest-derived generator for
first-party services is independent and must not be sequenced behind the RFC

## Summary

`netscript service add --with-client` renders one 27-line template that is wrong in three
structural ways at once: every service exports the same `exampleService*` symbols, every service's
cache keys live under the literal resource string `'service'`, and the generated invalidation
constant addresses a key prefix that no generated query ever produces — so the flagship showcase's
"Invalidate list cache" button and its optimistic `onSettled` reconciliation are **silent no-ops**.
There is no verb at all for the second service. Priority note: the `'service'` collision and the
dead invalidation are runtime-correctness defects shipped in generated user code; they are kept
inside this generator issue because fixing them without changing the generator would only re-emit
them, but the owner may split them out as a separate p0 fix.

## Evidence

- `research/repo-audit/services-sdk.md` §4.1 (a)–(d) and gap register S6, S7, S15, S16 — all rated
  High/Medium with citations; §7 states **no open issue covers S6/S7**.
- `research/repo-audit/mcp-cli.md` §4.1 — "no CLI verb emits `apps/<app>/lib/<service>.ts` for a
  second service"; the generated `bridgeInvalidation` pair is hand-written, so a renamed procedure
  fails at runtime, not at type-check.
- Repo, verified at `fac9e339042c`:
  - `packages/cli/src/kernel/assets/app/lib/example-service.ts.template:8-27` — exports
    `exampleServiceName`, `exampleServiceRouterName`, `exampleServiceContract`,
    `exampleServiceListInvalidation`, `exampleServiceClient`, `exampleServiceQueries`; the factory
    group is literally `createQueryFactories({ service: { … } }).service`.
  - `packages/sdk/src/query/query-factory.ts:41-46` (`createQueryFactory(resource, …)`), `:54-58`
    (`invalidate` uses `[resource]`), `:147` (`queryKey: [resource, action, { input }]`), `:174-178`
    (`clientKey`), `:218` (`createQueryFactories` passes the **object key** as `resource`).
  - `packages/sdk/src/query-client/key-bridge.ts:19-23,32-37` — `bridgeInvalidation(resource,
    action)` returns `{ queryKey: [resource, action] }`, i.e. `['users','list']` for the default
    service name, while the real keys start with `'service'`.
  - Consumed at
    `packages/cli/src/kernel/assets/app/routes/examples/(_islands)/ServiceShowcaseLab.memory.tsx.template:85`
    (`onSettled` after an optimistic mutation) and `:115` (an "Invalidate list cache" button).
  - `packages/cli/src/kernel/adapters/service/client-scaffolder.ts:9-21,45-49` — the single
    template render; `packages/cli/src/public/features/services/add/add-service.ts:69-79`;
    flag declared at `add-service-command.ts:37`.
- Verified negative: grep for `bridgeInvalidation|invalidateQueries` under `packages/sdk/tests` and
  `packages/cli/e2e/src` returns nothing (`services-sdk.md` §4.1 (c)).

## Current surface

One template, one service, one shot. Two services ⇒ two files exporting identical symbol names ⇒
any module importing both must alias every symbol; both services' `list` actions share the cache
key `['service','list',…]` in **both** tiers (server keys via
`packages/sdk/src/ports/query-key.ts`, client keys via `query-factory.ts:143`), so
`factory.invalidate()` invalidates every service at once and a cache read can be served another
service's payload. `defineServices()` — the advertised L3 preset — appears on no scaffolded path
(`services-sdk.md` S16).

## Target contract

A `generate`-family verb (name to lock in implementation; `generate sdk` / `contract sync` are the
candidates from `mcp-cli.md` §5) that regenerates the app-side data layer from the contract
manifest:

1. **Names derive from the service/contract**, never from `example*`: `<service>Client`,
   `<service>Queries`, `<service>Contract`, one module per service at
   `apps/<app>/lib/<service>.ts`. Two services never collide.
2. **Resource keys derive from the service/router name**, not the literal `'service'`. Cross-service
   collision becomes impossible by construction, and `factory.invalidate()` is scoped to one
   service.
3. **Invalidation is generated, not hand-written**: a per-procedure invalidation map derived from
   the same contract that produced the keys, so a renamed procedure is a **type error**, not a
   runtime no-op. The showcase's two call sites consume the generated map.
4. **Idempotent and drift-reporting**, matching `generate runtime-schemas`: content-compare with
   `written`/`skipped`, `--dry-run`, `--force`; a second run is byte-identical.
5. **Integrates with the existing verbs**: `service add --with-client` and `service generate` call
   the same generator rather than rendering a template, so there is one code path.
6. **Installed contributions (RFC-A-gated, T1-01):** plugin-contributed SDK/query surfaces are
   included in the generated module when the contribution contract exists. Without T1-01 the
   generator emits first-party services only — that is a shipping configuration, not a blocked one.
7. **The L1/L2 vs L3 (`defineServices`) choice is decided and documented once** in the generator, so
   the generated path and the docs teach the same dialect (S16/S17).

## Acceptance

- [ ] A documented verb regenerates `apps/<app>/lib/<service>.ts` for every service in the manifest.
- [ ] Generated export names are derived from the service name; a two-service project imports both
      modules with no aliasing.
- [ ] Generated query-factory resource keys are per-service; a two-service fixture proves the
      `list` keys differ in both cache tiers.
- [ ] The generated invalidation map is contract-derived and a renamed procedure fails `deno check`.
- [ ] The showcase island's invalidation call sites use the generated map and actually invalidate.
- [ ] Re-running with no input change writes zero files; output is byte-identical.
- [ ] `--dry-run` reports the plan and writes nothing; `--force` rewrites unchanged files.
- [ ] Negative test: a fixture asserting `bridgeInvalidation`-style keys that do not match the
      factory keys fails the suite (the S6 regression is locked out).
- [ ] Negative test: a two-service fixture whose factories share a resource key fails the suite.
- [ ] Negative test: generating for a service with no contract exits non-zero and writes no files.
- [ ] gate: `deno task e2e:cli run scaffold.runtime --cleanup` adds a second service and proves both
      generated modules type-check and their caches do not collide.

## Boundaries

- **T1-01 / RFC-A** owns the `SdkClientContribution` contract and the reopened oRPC seams
  (headers/interceptors/plugins/link/context/typed errors). Do not design that contract here.
- **#1333** owns making the default app idiomatic; this issue owns the generator it calls.
- **#1335** owns the conformance inventory.
- **T2-01** owns the route slice that consumes these factories; it must not emit client wiring.
- **#1245** owns island query *type* gaps; the `clientKey → queryKey` convergence landed in #1265.
- Not in scope: `AbortSignal` forwarding (S8), nested-router factories (S9), `port`/`timeout`
  dead options (S11) — those are SDK-surface items for T1, referenced here so they are not
  re-filed.

## Docs/consumer proof

A generated two-service project is the proof: both modules import cleanly, `deno check` passes, the
invalidation button changes observable cache state in the runtime E2E, and the services-SDK docs
page teaches exactly the dialect the generator emits (one dialect, per T5). The eis-chat
cache-key-collision note (`research/external/eis-chat.md` §3, `lib/channel-service.ts:12-24`,
"factory-group name is the cache-key prefix and must be unique per router") becomes a generated
invariant instead of app-space folklore.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. Drafted from
`research/repo-audit/services-sdk.md` §4.1 + S6/S7/S15/S16 and `research/repo-audit/mcp-cli.md`
§4.1/§5; all repo claims re-verified against worktree `fac9e339042c`. No GitHub mutation performed.
