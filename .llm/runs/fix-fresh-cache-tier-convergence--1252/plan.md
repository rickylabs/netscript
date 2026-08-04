# Plan: fresh/sdk cache-tier convergence

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-fresh-cache-tier-convergence--1252` |
| Branch | `fix/fresh-cache-tier-convergence` |
| Phase | `plan` |
| Target | `packages/sdk`, `packages/fresh`, and cache-tier docs |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` |

## Archetype

Doctrine explicitly assigns both affected packages to Archetype 4. The generated SDK query factory
and Fresh query wrapper are the public DSL. The frontend overlay adds first-paint/browser and
consumer-contract proof because the DSL materializes a shared browser QueryClient.

## Current Doctrine Verdict

- `@netscript/sdk`: **Keep** — high cohesion; minor naming review.
- `@netscript/fresh`: historical **Restructure** verdict, with the builder monolith debt resolved.
  This slice must not reopen structural debt or deepen the current query/route/streams doc-lint
  baseline.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1 | Cache-tier precedence and option/result contracts are stated before runtime changes. |
| A2 | Cache-aware and direct reads cannot remain silently interchangeable. |
| A3 | A mutation uses framework query/cache primitives without inventing a route. |
| A6/A7 | The invalidation seam uses Fresh/Web Platform request primitives, not a product helper stack. |
| A8 | Server route behavior, client helper, hook reconciliation, and SDK factory behavior remain separate concerns. |
| A10/A11 | Existing cache-provider registration is the named server extension seam; no new container/global is introduced. |
| A14 | RED-first semantic tests and public-surface gates preserve the contract. |

## Goal

Make the cache-tier precedence explicit and executable:

`server CacheQuery entry → Fresh hydration initialData → later client refetch/optimistic writes`.

After a mutation, the framework supplies the write-side path that invalidates the server entry and
then permits browser invalidation/refetch, without a bespoke application route.

## Scope

- Route server-side `queryOptions().queryFn` through the generated cache-aware action while keeping
  browser execution direct and browser-safe.
- Allow cache policy overrides such as `preferFreshOnStale` through `queryOptions()`.
- Add `initialDataUpdatedAt` to Fresh island options.
- Reconcile mount-time `initialData` into a pre-populated shared QueryClient before first paint,
  once per hook mount.
- Expose `isFetching` and `isRefetching` in the package-owned result type.
- Register a standard JSON POST invalidation route in `defineFreshApp` and export its paired browser
  helper, with default path constant, validation, path override, and opt-out.
- Update framework docs to explain all four tiers and the mutation → server invalidation → hydration
  → browser refetch order.
- Add RED-first tests for all three reported divergences plus mutate → invalidate → reload behavior.

## Non-Scope

- Changing service mutation transaction semantics or reconciling product-specific optimistic data.
- Replacing TanStack Query, the SDK cache provider registry, or KV store implementation.
- Refactoring unrelated Fresh route/stream doc-lint debt.
- Adding authentication policy beyond same-origin/JSON transport; applications may protect the
  standard path with existing app middleware.
- Running merge-readiness/scaffold E2E; the milestone orchestrator owns that gate.

## Hidden Scope

- Issue-body acceptance includes browser reachability, refresh state, `withPolicy` write-side docs,
  and mutate → reload proof in addition to the three corrected divergences.
- Browser-safe SDK behavior requires environment selection by registered provider, not unconditional
  cache calls from query options.
- The pre-existing user-owned `deno.lock` change must remain unstaged and unattributed.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | `ActionQueryOptions` carries the SDK cache-policy fields; server `queryFn` calls the action when a cache provider exists, browser `queryFn` invokes the client directly otherwise. | One factory shape remains browser-safe while server reads and invalidation share the canonical entry. |
| D2 | Hydration `initialData` is authoritative exactly once per hook mount; later optimistic writes/refetches are never overwritten by rerenders. | Implements the specified precedence and absorbs Pulseboard's load-bearing `useRef` guard. |
| D3 | `initialDataUpdatedAt` is forwarded as a numeric timestamp and used when the mount seed writes to QueryClient. | Preserves server-cache age and matches the existing documented SDK contract. |
| D4 | `IslandQueryResult` explicitly includes `isFetching` and `isRefetching`. | The wrapper must expose the refreshing affordance its docs recommend. |
| D5 | `defineFreshApp` owns a standard JSON-only invalidation POST route, enabled by default with opt-out/path override; `@netscript/fresh/query` owns the browser helper. | The route is framework plumbing and should not be recreated per product. |
| D6 | No local PLAN-EVAL is launched; plan evaluation composes at draft→ready and the orchestrator pre-merge gate. | Explicit owner/milestone ruling. |
| D7 | Tests are written and run against current behavior before each implementation change; final commits remain green. | Captures RED proof without leaving the branch at an intentionally failing slice boundary. |
| D8 | Existing JSR/doc debt is a no-deepening baseline, not in-scope cleanup. | Doctrine stop condition preserves feature scope and honest evidence. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Endpoint authentication beyond same-origin JSON | safe to defer | Existing middleware can protect/disable the route; a new auth system would expand scope. |
| Per-entry versus action-prefix invalidation convenience | resolved now | Client helper accepts canonical primitive query-key prefixes/exact keys; callers use generated action keys/prefixes. |
| Multi-island conflicting initial snapshots | safe to defer | The contract assumes one authoritative page response; the timestamp is preserved and each mount seeds once. |
| Full dehydration API redesign | safe to defer | This defect is the recommended `initialData` path; existing advanced dehydration stays intact. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Cache-aware `queryOptions()` breaks browser bundles | Branch only on the browser-safe `hasCacheProvider()` registry; retain direct invocation when absent; consumer type/runtime test. |
| Hook reconciliation overwrites optimistic/refetched data | One `useRef` guard per hook mount; add a rerender/seed-once unit seam if browser harness permits. |
| Standard route permits cache-thrash abuse | Require POST + JSON primitive key, reject malformed input, document same-origin middleware/opt-out. |
| Default route collides with app route | Use reserved `/_netscript/...` path plus explicit override/disable option. |
| SDK/Fresh public types leak private TanStack types | Keep package-owned structural types; compare structured doc-lint baseline. |
| Existing global provider leaks across tests | Reset/replace provider in test cleanup and keep tests serialized where necessary. |
| Acceptance scope exceeds safe milestone size | Land types/tests and smallest safe cache/hydration subset; if endpoint cannot be safe, remove `Closes`, leave exact deferral to 0.0.6. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| AP-1 | risk | Keep new server/client modules focused and below size thresholds. |
| AP-2/AP-6 | risk | Helpers must encode NetScript cache-tier policy, not rename `fetch`/TanStack. |
| AP-9 | risk | Do not generalize beyond the named server-cache/browser-cache extension axis. |
| AP-11 | existing seam | Reuse the registered CacheProvider; introduce no second hidden singleton. |
| AP-14 | risk | Continue package-owned types; do not re-export TanStack. |
| AP-19 | risk | Document the network endpoint and server-side KV boundary. |
| AP-25 | risk | Server request handling stays in `runtime/server`; browser fetch stays in the query edge module. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| F-1..F-5 | yes | focused review + `quality:gate`/`arch:check`; no new size/layer/surface finding |
| F-6/F-7 | yes | JSR audit and structured doc-lint no-deepening comparison |
| F-8..F-12 | yes | `arch:check`, scoped wrappers, existing package configs |
| F-14..F-19 | yes | `quality:gate`, scoped wrappers, public export/consumer checks |
| Browser/runtime | yes | pre-populated QueryClient first-paint test and standard endpoint integration test |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| Existing Fresh/SDK doc/cardinality findings | none | No-deepening baseline only. |
| New debt | none expected | Any unsafe deferral changes the PR to partial and records a 0.0.6 follow-up instead of forcing closure. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | RED SDK | focused `deno test` for cache-aware query options | fails on direct client bypass before implementation |
| 2 | RED Fresh type/hydration | focused Fresh query tests + scoped type fixture | rejects timestamp / paints pre-existing stale entry before implementation |
| 3 | RED endpoint | focused Fresh server invalidation test | no standard route/helper before implementation |
| 4 | Package tests | `deno task --cwd packages/fresh test` and focused SDK tests | PASS |
| 5 | Scoped check/lint/fmt | repo wrappers over `packages/fresh` and `packages/sdk` | PASS |
| 6 | Doctrine quality | `deno task quality:gate` | PASS or attributable baseline only |
| 7 | JSR/doc | structured doc-lint + package audits | no new findings over recorded baseline |

## Dependencies

- Existing `@netscript/sdk/cache`, `@netscript/sdk/query`, Fresh `App`, and TanStack Query APIs.
- Pulseboard commit `56accbb` is behavioral evidence only; no source is copied.
- Draft→ready augment/OpenHands/orchestrator evaluation surfaces are external to this session.

## Drift Watch

- Any need for an application-auth redesign, query-key protocol break, new package dependency, or
  change outside Fresh/SDK/docs is significant and requires rescope/defer review.

