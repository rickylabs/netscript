# Research — #1459 `DeferComponent` is not hydrated

Delegated read-only sub-agent (Claude · Opus 5, `drift.md` D-1), bounded brief — 27 tool calls,
~3 min, within budget. Static analysis only; nothing built, run, or reproduced.

## The reported defect is confirmed, and its cause is simpler than "hydration is broken"

**`DeferIsland.tsx` is not an island at all.** There is no island registration for it anywhere in the
repo.

- It is a **named** export, not a default export
  (`packages/fresh/src/application/defer/DeferIsland.tsx:111`), re-exported as an ordinary module
  symbol (`defer/mod.ts:12`, reachable as `@netscript/fresh/defer`).
- **The mechanism in this repo is directory convention**, resolved by the stock Fresh Vite plugin.
  The scaffold calls `fresh()` with **no options**
  (`packages/cli/src/kernel/assets/app/vite.config.ts.template:41`), and `createNetScriptVitePlugin`
  contains **zero** island logic — no `islands` match across all 438 lines of
  `packages/fresh/src/application/vite/vite.ts`. `define-fresh-app.ts:121-135` registers fs-routes
  only and never passes a `loadIsland`.
- Every island that actually works in a scaffolded app lives in a **scanned directory**: the app
  template's `(_islands)/` folders, and `@netscript/fresh-ui` islands, which are **copied into the
  consumer app** (`packages/fresh-ui/registry/islands/`, registered as copy templates at
  `registry.generated.ts:334-340`) rather than imported from the package.
- The contrast that proves the pattern: `QueryIsland`
  (`packages/fresh/src/application/query/query-island.tsx:39`) ships from the same JSR package and
  **does** reach the client — because its documented contract is that the **consumer's own** island
  file imports it (`:26-36`), giving it a scanned entry point. `DeferComponent` has no such entry.

So the component is reached **only** through a server-render path
(`DeferPage.tsx:8` ← `builders/define-page/runtime/mod.tsx:4`), and nothing in a scanned directory
transitively imports it. Both candidate causes hold and compound.

## A second, independent defect inside the same issue

`DeferIsland.tsx:222` sets:

```tsx
f-client-nav={!(isPartialRequest && !hasCachedData)}
```

`isPartialRequest && !hasCachedData` **is exactly the `partial-miss` condition**. So in precisely the
case this issue is about, `f-client-nav` is `false` while `f-partial` is set (`:221`). If Fresh only
intercepts `f-partial` on forms under active client navigation, `requestSubmit()` would trigger a
**full document navigation**, not the `/partials/**` request the issue requires.

**This is not verified** — Fresh core's form/partial interception was not read, so it is inference
from the attribute values. But it means **hydration alone may not fix the issue**, and any fix must
test this line rather than assume it.

## Why no existing test catches this

`decideDeferClientAction` (`policy.ts:177`, `partial-miss` branch at `:178-182`) has **exactly one
caller** — the client effect at `DeferIsland.tsx:188`. There is no server-side caller. In the shipped
product it is therefore **never executed at runtime on either side**; its unit coverage is the only
thing exercising it.

The input plumbing is correct end-to-end (`runtime/mod.tsx:220` → `DeferPage.tsx:170,267-268`), which
is why this looks healthy from the server side. `DeferIsland.test.ts:1` imports only
`buildDeferFormState` and `sanitizeDeferSearchParams` and never renders the component.

## Partial-swap behaviour

From `DeferPage.tsx:257-275`: the coordinator form is rendered **as a sibling outside** the
`<Partial>` — `<div><Partial name={name}>…</Partial><DeferComponent …/></div>`.

- A swap of the region's own partial replaces the content but **leaves the form's DOM node in
  place**, so even a working island would not naturally re-run its effect (deps at `:201-214` are all
  props).
- A **page-level** partial swap re-renders the whole `<div>` including a freshly server-rendered,
  inert form — with no island marker, Fresh has nothing to hydrate into it.

Nothing in the defer code addresses island persistence or re-hydration across `<Partial>` swaps: no
`key`, no persistence attribute, no remount handling. The docs describe the transport and make no
persistence claim (`docs/site/web-layer/defer-streaming-ui.md:238-245`).

## The regression test the issue asks for requires net-new capability

The issue's acceptance says a test should *"build the Fresh client bundle, navigate into a page with
a cache-miss deferred layer, assert the partial endpoint is requested, and assert the named boundary
swaps exactly once."*

What exists:

- Pure-function unit tests (`DeferIsland.test.ts`) — never render the component.
- JSX-tree prop assertions (`define-page/tests/search-params.test.tsx:93-99,115-134`) — could assert
  an island marker in **server** output, but cannot prove a client bundle.
- A live Fresh dev server over HTTP (`probe-project-boundary-dev.ts:43` with `FetchHttpAdapter`) —
  the closest existing "drive a real app".

What does **not** exist:

- **No browser driver.** Playwright appears only in docs and in the CLI *scaffolding* Playwright
  config for consumer projects (`init-agent.ts`) — not test infra this repo runs.
- **No gate builds or inspects a client bundle** anywhere in `packages/cli/e2e`.

So the acceptance's regression test needs net-new capability at whichever level it targets.

## Options (research made no recommendation)

| Option | Trade-off |
| --- | --- |
| Consumer-side island shim from the scaffold (`routes/(_islands)/DeferIsland.tsx` re-exporting `DeferComponent`) | matches the `QueryIsland`/`fresh-ui` precedent, but every existing scaffolded app needs regeneration, and a consumer who deletes the file silently reintroduces the bug |
| Copy-mode distribution like `fresh-ui` (`registry.generated.ts`) | consistent with `ui:add`, but forks the island per project so framework fixes stop reaching existing apps |
| Declare the island from `createNetScriptVitePlugin` | the only option needing no consumer file — but **feasibility unconfirmed**, depends on a `@fresh/plugin-vite` capability not verified |
| Drop the island; resolve server-side on `ctx.isPartial && !component` | removes the hydration dependency and the `f-client-nav` hazard, but collapses the defer model — the policy branches (`policy.ts:184-208`) have no server equivalent |
| Inline `<script>` beside the form | cheapest and immune to island-scan mechanics, but forfeits typed policy logic, likely trips CSP, and is doctrine-hostile for `packages/` |

**Every option must additionally resolve the `f-client-nav` question**, or hydration alone produces a
document navigation instead of the partial request.

## Explicitly not verified

- Whether `@fresh/plugin-vite` exposes any mechanism to register an island from a JSR/npm specifier.
  The Deno-cache grep was inconclusive; **only "this repo passes no such option" is proven.**
- Fresh's actual `f-client-nav` / `f-partial` form interception semantics — so the
  document-navigation claim is inference, not fact.
- No reproduction: nothing built, no browser, no gates.
- The `streams`/`shouldStream` sibling path (`runtime/mod.tsx:178`) — deferral only applies when
  `!shouldStream`, and whether streaming delivery has the same gap is unexamined.

Minor: the `debug` prop is declared (`DeferIsland.tsx:54`) but never destructured (`:111-122`) — dead.
