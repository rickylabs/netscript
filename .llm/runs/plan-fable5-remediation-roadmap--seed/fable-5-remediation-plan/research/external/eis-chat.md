# eis-chat — the product-quality frontend bar (teardown)

**Source of truth.** `rickylabs/eis-chat` cloned read-only (`--depth 1`) to
`/home/codex/repos/netscript-fable5-remediation-plan/.llm/tmp/eis-chat`, HEAD
`d38e3986392e70535d698668c6802b8105e5ea76` (2026-07-21, "Merge pull request #154 …
agent/enterprise-windows-desktop"). All `apps/dashboard/**` paths below are relative to that clone.
NetScript-side paths are relative to this worktree (`origin/main` @ `fac9e339042c`).

**One-line verdict.** eis-chat is a NetScript app pinned at `0.0.1-beta.9`
(`apps/dashboard/deno.json:29-35`) that reaches product quality by *inventing, in app space, six
conventions the scaffold does not generate*: route guards, the degraded-loader error banner,
server-validated forms, an imperative toast bus, an honest LIVE/DESIGNED data-provenance discipline,
and a per-surface CSS ownership rule. Every API it uses already exists in `packages/fresh` on main.
The gap is almost entirely **scaffold/generation + docs/discovery**, not missing framework API.

---

## 1. Stack (verified)

| Concern | Choice | Citation |
|---|---|---|
| Runtime/build | Deno 2.9, Vite (`npm:vite --configLoader native`), Fresh 2.3.3 | `apps/dashboard/deno.json:7,38` |
| UI | Preact, `jsx: precompile` + `jsxPrecompileSkipElements` (12 elements) | `apps/dashboard/deno.json:49-66` |
| Framework | `@netscript/fresh@0.0.1-beta.9` (+ `/streams`, `/query`), `@netscript/fresh-ui@0.0.1-beta.9`, `@netscript/sdk@0.0.1-beta.9` | `apps/dashboard/deno.json:29-34` |
| RPC/data | contract-first `createServiceClient` + `createQueryFactories` over `@eis-chat/contracts` | `apps/dashboard/lib/channel-service.ts:1-24` |
| Styling | Tailwind v4 `@import 'tailwindcss'` + `--ns-*` token layer + per-block CSS files; `cn = twMerge(clsx(...))` | `apps/dashboard/assets/styles.css:1-3`, `apps/dashboard/lib/cn.ts:9-11` |
| Chat | TanStack AI (`useChat`), durable streams via `@netscript/plugin-streams-core` | `apps/dashboard/islands/ChatPane.tsx:473`, `apps/dashboard/lib/stream-loaders.ts:23-27` |
| Shell | `deno desktop --backend cef`, Windows singleton sidecar | `apps/dashboard/deno.json:12-13,71-82`, `apps/dashboard/main.ts:23-39` |
| Auth | **none.** Zero hits for `plugin-auth`/`better-auth`/`getSession`/`requireAuth` in `apps/dashboard/**` | grep, 0 results |

Scale: 21 page routes, 15 API routes, 4 `_middleware.ts`, 28 global islands, 48 app-owned UI
primitives, 10 app-owned blocks, 44 lib modules + 18 lib test files, ~31.9k LoC of TS/TSX.

---

## 2. Route organization — the folder vocabulary (a)

Fresh route groups `(…)` + underscore-prefixed dirs are used as a **non-routing colocation
vocabulary**, confirmed against the generated manifest (`(_components)` etc. produce no route
patterns — `apps/dashboard/.generated/manifest.ts:83-105` lists only real URLs).

```
routes/
  _app.tsx                     html/head/theme-init/skip-link          (34 lines)
  _layout.tsx                  3-pane app shell, SSR nav, breadcrumbs  (240 lines)
  (_components)/home-view.tsx  route-local presentational view
  (design)/design/             route GROUP: DS gallery with its own _layout + SidebarShell
    (_components)/ (_islands)/ (_shared)/
  api/…                        15 handler-only routes
  project/[project]/
    _middleware.ts             param guard
    (_components)/project-view.tsx
    channel/[channel]/
      _middleware.ts           param guard + active-channel cookie
      index.tsx                page BUILDER only — no JSX beyond withLayout
      (_components)/channel-view.tsx        7 exported presentational sections
      (_components)/create-session-form.tsx withForm component
      (_islands)/SessionsGrid.tsx           route-local island
      knowledge/{_middleware.ts,index.tsx,[doc].tsx,(_components)/…}
      session/[session]/{_middleware.ts,index.tsx,(_components)/…}
      settings/{index.tsx,(_components)/…}
```

Counts: 21 route-local `(_components)` files, 4 route-local `(_islands)`, 2 `(_shared)`, versus 28
*global* `islands/` files. **The rule in practice:** an island is global only when it is mounted by
the shell or reused across surfaces (`islands/ui/*` = ThemeToggle, NavProgress, ActionToasts,
NewSessionButton); anything owned by one route lives under that route's `(_islands)`.

The page file is **only a builder**. `routes/project/[project]/channel/[channel]/index.tsx` is 295
lines with zero presentational JSX except the `withLayout` slot grid (lines 265-287); all markup
lives in `(_components)/channel-view.tsx`. That separation is the single most transferable
convention in the repo.

Route references: `apps/dashboard/router.ts` re-exports the generated tree and adds a **flat
`appRoutes` alias map** (`router.ts:20-59`) because the generated shape is
`routes.project.$project.channel.$channel.$route` (`.generated/routes.ts`). Every outbound link goes
through `appRoutes.X.href({ path: {...} })` — no string literals — e.g.
`channel-view.tsx:92-94,202-204,301`.

---

## 3. Data fetch + cache strategy (a)

**Server tier — `definePage()` layers.** Canonical example
`routes/project/[project]/channel/[channel]/index.tsx:148-292`:

- `.withResource('data'|'mcp'|'skills', ctx => …)` — three independent resources, one of them an
  aggregate that runs 4 reads under `Promise.all` (lines 113-118).
- `.withLayer(name, Component, { loader: ctx => props })` — 7 layers, each loader projecting exactly
  the props its component declares. Components never fetch.
- `.withForm(...)` — server-validated mutation (§5).
- `.withLayout(slots => JSX)` + `.withMeta(...)` + `.build()`, then
  `export const { handler, default: page } = channelPage;`.

**Loader error contract.** Every read is wrapped: `errorHandler(loader, fallback)()` →
`hasError()` → collect `ErrorData[]` → `extractDataWithFallback()`
(`index.tsx:106-134`, same shape at `session/[session]/index.tsx:66-90`). Errors are **de-duplicated
by message** (line 132) because a total backend outage trips all four reads identically. The
`errors` array is fed to a dedicated `issues` layer that renders an inline banner
(`(_components)/channel-view.tsx:24-36`). This is the "degrade but surface" pattern, and it is the
opposite of try/catch-to-empty.

**Client tier — cache-first islands.** `QueryIsland` + `useIslandQuery({ queryKey, queryFn,
initialData: <loader seed>, staleTime })`. Seeded from the server loader so first paint has data;
`staleTime` 5s or 15s (`(_islands)/SessionsGrid.tsx:41-56`, `islands/ChannelTreeIsland.tsx:21-24`,
`islands/SkillsPanel.tsx:78-83`, `islands/SessionRail.tsx:99-104`, `islands/SessionScratch.tsx:58-61`,
`islands/KnowledgePanel.tsx:203-206`). Query keys are **contract-anchored**, never string literals:
`channelQueries.listSessions.clientKey({ channelId })`.

**Cache-key collision discipline.** `lib/channel-service.ts:12-24` documents that the factory-group
name is the cache-key prefix and *must be unique per router*, citing a real
`['service','list']` collision fixed in `lib/skills.ts`.

**Streaming.** `lib/stream-loaders.ts:52-108` is a server-side prepare/resume helper: it
create-if-missing's the durable stream so the island's first live read cannot 404, then materializes
a resume offset. Best-effort throughout — three separate `catch` sites degrade to `{ messages: [] }`
rather than 500 the page.

---

## 4. Form handling (a)

`.withForm<'createSession', typeof Schema, Result>('createSession', Component, { schema, method:
'POST', csrf: true, initial, mutate, redirectTo, spanName })`
(`routes/project/[project]/channel/[channel]/index.tsx:212-236`). The zod schema carries the *user-
facing* message (`'Name the session before starting it.'`, line 39). `mutate` calls the typed
service client and returns a typed output; `redirectTo` builds the destination through
`appRoutes.session.href(...)`; `spanName: 'channel.session.create'` names the telemetry span.

The component receives `RuntimeFormState<Values>` and renders `<Form state={state}>` with
`firstFieldError(state.fieldErrors, 'title')` plus `state.formErrors?.[0]`, wiring `aria-invalid`
and a `role='alert'` `InlineNotice`
(`(_components)/create-session-form.tsx:18-63`). Values survive a failed submit.

---

## 5. Auth composition (b)

**There is none, and that is stated honestly in the UI.** `MembersPanel`
(`(_components)/channel-view.tsx:314-331`) renders a single "You" member and a sentence naming the
blocking issue: *"Teammates arrive with team accounts (auth/RBAC — #16)."* The stats grid reports
`members: 1` with the comment *"honest counts: just you until auth/RBAC (#16); connectors are the
REAL MCP pool size (was hardcoded 4 / 3)"* (`index.tsx:194-199`). `PluginGatedView`
(`components/blocks/plugin-gated-view.tsx:15-34`) is a reusable "designed but deferred until a
netscript plugin lands" surface.

Gap — **product-expectation outside framework scope** for eis-chat, but a **docs/discovery failure**
for NetScript: the repo ships `packages/auth-better-auth`, `packages/auth-kv-oauth`,
`packages/auth-workos`, `packages/plugin-auth-core`, yet the most polished NetScript consumer wired
none of them and instead built a gated-empty-state vocabulary. No scaffold template references auth
(`grep` over `packages/cli/src/kernel/assets/app/**` → 0 hits).

---

## 6. UI-state coverage (a + b)

| State | Coverage | Citation |
|---|---|---|
| Error (server) | Per-page `issues` layer fed by `ErrorData[]`, de-duplicated, `role='alert'` | `index.tsx:168-170`, `channel-view.tsx:24-36` |
| Error (client action) | `notifyToast({ type:'error', … })` on every mutation catch | `(_islands)/SessionsGrid.tsx:99-105,124-129,150-156,179-185` |
| Error (streaming) | Inline assistant-styled error bubble with a **"Retry complete response"** button calling `reload()` | `islands/ChatPane.tsx:873-897` |
| Empty | Per-surface prose empties, not a generic component: "No sources yet…", "No MCP servers reachable — the agent answers from the knowledge base only.", "No active sessions yet — start one above." | `channel-view.tsx:215,261,` `(_islands)/SessionsGrid.tsx:278` |
| Empty (route) | `EmptyState` primitive used on 6 surfaces incl. `PluginGatedView` | `components/ui/empty-state.tsx`, `plugin-gated-view.tsx:29-31` |
| Loading | **SSR-first: no skeletons in any product surface.** `Skeleton` appears only in the DS gallery | grep: `Skeleton` hits only `components/ui/skeleton.tsx`, `mod.ts`, `(design)/…/components-view.tsx` |
| Loading (streaming) | `TypingIndicator` when `busy && lastIsUser`; `NavProgress` island for client-nav with a watchdog | `ChatPane.tsx:861-871`, `islands/ui/NavProgress.tsx` |
| Optimistic | Hand-rolled overlay: local `pending` rows merged ahead of server rows, reconciled in `onSuccess`/`onError` | `islands/SkillsPanel.tsx:104-145,164-173` |
| Optimistic (delete) | Local `removed: Set<string>` + `titles: Record<>` overlays filtered over query data | `(_islands)/SessionsGrid.tsx:57-67,117,171` |
| A11y | `role='log' aria-live='polite'` on the thread, `role='alert'` on errors, skip-link, `aria-current='page'` nav | `ChatPane.tsx:859`, `_app.tsx:27`, `_layout.tsx:34` |

**Gap — API/type-system seam (partly already fixed on main).** Every `useIslandQuery` call casts:
`queryKey: channelQueries.listSessions.clientKey({ channelId }) as unknown as string[]`
(`(_islands)/SessionsGrid.tsx:42`, and 4 more at `SkillsPanel.tsx:79`, `SessionScratch.tsx:58`,
`KnowledgePanel.tsx:203`, `ChannelTreeIsland.tsx:21`, `SessionRail.tsx:99`). At beta.9 the SDK's
`clientKey` return type and the island hook's `queryKey` type did not line up. On main they do —
`clientKey: (props?) => readonly unknown[]` (`packages/sdk/src/ports/query-factory.ts:97-100`) and
`queryKey: QueryKey` where `type QueryKey = readonly unknown[]`
(`packages/fresh/src/application/query/query-types.ts:28,130`), converged by
`77c034c33 fix(fresh): converge SDK and island cache tiers (#1265)`. **Action: verify + document the
fix so consumers delete the cast; it is currently the single most-copied wart in the reference app.**

**Gap — docs/discovery failure.** `invalidate` is used **zero times** in the whole app. Islands call
`query.refetch()` plus manual overlay bookkeeping instead of invalidating canonical keys — which is
exactly what the scaffold's own generated guidance tells agents to do ("`useMutation` with canonical
query keys", `packages/cli/src/kernel/templates/app/agent-conventions.ts:131,181`). Likewise
`cachedAt: Date.now()` is threaded from loader → layer → island through three files
(`routes/skills/index.tsx:49` → `routes/skills/(_components)/skills-view.tsx:40-48` →
`islands/SkillsPanel.tsx:34`) and then **discarded** (`SkillsPanel.tsx:74`, `cachedAt: _cachedAt`)
— the `initialDataUpdatedAt` option that would have consumed it
(`packages/fresh/src/application/query/query-types.ts:135`) was never discovered.

**Gap — runtime correctness (framework, worked around in app).** Three explicit upstream
workarounds are in-tree, each with a comment:
- `create-session-form.tsx:28-39` — `<body f-client-nav>` + a POST→redirect crashes Fresh 2.3.3's
  `domToVNode` reviver; the app must pass the literal **string** `'f-client-nav': 'false'` because a
  boolean `false` is dropped by Preact.
- `lib/stream-loaders.ts:86-90` — the streams runtime mislabels plain JSON as
  `content-encoding: gzip`, so reads must send `Accept-Encoding: identity` (cites `netscript#219`).
- `lib/stream-loaders.ts:75-81` — the transport's `materializeSnapshotFromDurableStream` replays only
  `TEXT_MESSAGE_*` chunks, dropping tool-call/thinking/widget parts, so the app replays through
  TanStack's own `StreamProcessor`.

**Gap — plugin-composition / design-system seam.** `channel-view.tsx:20-23`: *"the framework's
default `ErrorDisplay`/`InlineError` ship hardcoded Tailwind colors that ignore our theme tokens — so
we consume the normalized `ErrorData` into our own primitive."* The error **contract** is reusable;
the error **components** are not, because they are not tokenized.

---

## 7. Design-system usage (a)

- **Copy-owned registry.** `components/ui/mod.ts:1-4` — "installed with `netscript ui:init` from the
  @netscript/fresh-ui registry and are **owned by the scaffolded app**". 48 primitives, all
  re-exported with their types from one barrel; every consumer imports
  `@app/components/ui/mod.ts`, never a deep path.
- **Layered ownership, annotated in source.** `components/ui/button.tsx:1-6` carries
  `@component/@layer 2/@depends theme-seed/@description` JSDoc tags. The app keeps a
  machine-readable snapshot of the registry catalog for its own gallery
  (`routes/(design)/design/(_shared)/registry.ts:1-30`, `total: 44`).
- **Discriminated-union props over `as` escape hatches.** `Button` is
  `ButtonAsButtonProps | ButtonAsLinkProps` with `href?: never` on the button branch and `type:
  'link'` as the discriminant (`button.tsx:40-64`), so the anchor branch gets `f-client-nav` typed
  via a local `FreshAnchorNavigationAttributes` interface (`button.tsx:23-25`).
- **Tokens only, both themes.** `:root` = light, `[data-theme='dark']` = dark, OKLCH ramps with hex
  fallbacks (`assets/tokens.css:12-60`). Theme is applied pre-paint by an inline script reading
  `localStorage['ns-theme']` with a `prefers-color-scheme` fallback (`routes/_app.tsx:3-4,24`).
- **CSS ownership rule.** One CSS file per primitive and per app-owned surface block, wired by a
  single ordered `@import` list; the rule is written down: *"per-surface app-owned selectors →
  `assets/blocks/<surface>.css` (only NET-NEW selectors … don't dup). Add ONE `@import` to
  `assets/styles.css` before `@layer base`"* (`docs/design/BUILD-CONTRACT.md:37`). 57 CSS files,
  zero raw hex allowed (`docs/design/DECISIONS.md:22-24`).
- **Zero-JS-first interaction budget.** `docs/design/BUILD-CONTRACT.md:34`: Popover API,
  `<dialog>`+`::backdrop`, `<details>`/`::details-content`, `:has()`, `@container`,
  `field-sizing:content`, CSS-only tabs — *"Islands ONLY for streaming/mutations."* Applied: the nav
  channel tree is server-rendered `<a>` + native `<details>`, explicitly rejecting an island
  (`docs/design/DECISIONS.md:54-61`); the context rail's 4 tabs are CSS radio tabs
  (`docs/design/BUILD-CONTRACT.md:6`); the row action menu is a `<details>` with `role='menu'`
  (`(_islands)/SessionsGrid.tsx:253-272`).
- **Live DS gallery as a route group.** `/design/{tokens,components,composition,generative}` with its
  own `_layout.tsx` using `SidebarShell` (`routes/(design)/design/_layout.tsx:46-74`); the root shell
  short-circuits for `/design` (`routes/_layout.tsx:64-70`).

---

## 8. Type discipline (a)

Measured across `apps/dashboard/**` excluding `.generated/`:

- **`any`: 0 occurrences in code.** The 3 grep hits are the English word inside comments
  (`lib/kb-executions-stream.ts:100`, `routes/api/chat.ts:348,493`).
- **`@ts-ignore` / `@ts-expect-error` / `@ts-nocheck`: 0.**
- **`deno-lint-ignore`: 1**, with a stated reason
  (`components/ui/mcp-widget.tsx:17`, `verbatim-module-syntax` for a value import).
- **`as unknown as`: 18**, and they cluster into exactly four *framework* seams, not sloppiness:
  1. query-key type mismatch ×6 (§6, fixed on main);
  2. `Deno` desktop-API narrowing ×2 (`lib/desktop-chrome.ts:59-60`) — unavoidable, the desktop API
     is not in the type lib;
  3. AI/adapter unions ×4 (`lib/llm.ts:257,265`, `lib/chat-render.ts:209,228`,
     `islands/ChatPane.tsx:326`) — TanStack AI part-type widening;
  4. driver handle narrowing ×2 (`islands/SharingPanel.tsx:68`, `islands/KnowledgePanel.tsx:255`).
- **`readonly` props everywhere** — every exported prop interface in `(_components)` and `blocks`
  uses `readonly` fields and `readonly T[]` (`channel-view.tsx:39-58,190-196,244-247,270-272`).
- **Explicit return types** on presentational components (`: VNode`) and loaders
  (`channel-view.tsx:81,118,176,199,250,275,314`; `index.tsx:60,67,80,86,106,155,179-186`).
- Residual soundness gap — **API/type-system seam**: `islands/SkillsPanel.tsx:93-97` coerces
  `tags`/`scopeChannels` to `[]` because *"a row can reach the grid with `tags`/`scopeChannels`
  undefined (a serialization/hydration edge the contract types don't catch) … an undefined there
  throws and 500s the whole SSR."* Contract-typed non-optional arrays are not guaranteed across the
  SSR→hydration boundary.

---

## 9. Route guards — the loader-cannot-fail seam (b: API/type-system seam)

`apps/dashboard/lib/route-guards.ts:1-45` is the most important framework finding in the repo. Its
header comment, verified against alpha.17 + Fresh 2.3.3:

> a `definePage()` layer loader **CANNOT** signal a non-200 outcome — the netscript pipeline swallows
> any thrown value (a `Response` or a Fresh `HttpError`) into a 500. The seam Fresh honors is a
> route-subtree `_middleware.ts` (default export) using `ctx.redirect()` / `ctx.next()`.

Consequence: the app hand-built `guardParam(key, fallback)` and `guardParamIfMatched(...)` and nests
one guard per dynamic segment (4 `_middleware.ts` files, e.g.
`routes/project/[project]/channel/[channel]/_middleware.ts:18-24`), then every loader still writes
`ctx.params.channel ?? ''` defensively (12 occurrences in `channel/[channel]/index.tsx` alone).

Second seam in the same comment (lines 12-14): `.withRoute(routes.<key>.$route)` makes `ctx.path`
**typed but empty at runtime** when there is no `pathSchema`, so loaders must read raw `ctx.params`
instead of the typed surface the builder advertises.

The middleware also does non-guard work — appending an active-channel cookie after `ctx.next()`
(`_middleware.ts:8-15`) — which is the idiomatic "remember scope" seam.

---

## 10. Provenance discipline: LIVE vs DESIGNED (a — and the single biggest quality differentiator)

eis-chat forbids fake data and encodes provenance in **types**:

```ts
export interface ChannelStats {
  /** LIVE — session count. */            readonly sessions: number;
  /** DESIGNED — member count (no v1 backend). */ readonly members: number;
}
```
(`(_components)/channel-view.tsx:46-58`.) The build contract states it as law: *"your surface must be
**LIVE against the real DB where the backend supports it**, and cleanly **designed/deferred where it
doesn't** (do NOT fake E2E)"* and lists the deferred set explicitly
(`docs/design/BUILD-CONTRACT.md:3,25`). House style: *"Findings/uncertainty over silent failure —
surface unreachable MCP servers, failed embeddings, and sync conflicts as visible state, not
swallowed errors"* (`docs/SKILL.md:79-80`).

---

## 11. What the scaffold generates today vs. the bar (delta)

Verified against `packages/cli/src/kernel/assets/app/**` (50 template files) and
`packages/cli/src/kernel/templates/app/agent-conventions.ts`.

**Already generated (parity — do not re-litigate):** `(_components)`/`(_islands)`/`(_shared)`
vocabulary; `(design)` route group with tokens/components/composition; `components/ui/mod.ts` barrel;
`lib/example-service.ts` contract→client→query-factories; `definePage` layers; `QueryIsland`;
`routes/partials/**` deferred partial; telemetry route; `router.ts`; `_app.tsx`/`_layout.tsx`; and an
agent-facing conventions doc that already names the one-screen path
`contract → createQueryFactories → definePage layers → QueryIsland/useMutation → live stream`
(`agent-conventions.ts:163`).

**Missing (scaffold/generation failure — each is a concrete issue):**

| # | Convention at the bar | Evidence it's absent from the scaffold | Class |
|---|---|---|---|
| S1 | `_middleware.ts` param guard + a `lib/route-guards.ts` helper | `find packages/cli/src/kernel/assets/app -name '*middleware*'` → 0 | scaffold/generation |
| S2 | A dynamic `[param]` route at all | no `[`-named template in the 50-file asset tree | scaffold/generation |
| S3 | `@netscript/fresh/error` degraded-loader + `issues` layer + de-dup by message | `grep -rl '@netscript/fresh/error'` over templates → 0 | docs/discovery |
| S4 | `withForm` + zod + CSRF + field errors + `redirectTo` + `spanName` | `grep -rl 'withForm'` over templates → 0 (the API exists: `packages/fresh/src/application/form/mod.ts`) | docs/discovery |
| S5 | Client toast bus (`CustomEvent` on `document`) + one `ActionToasts` outlet in `_layout` | no toast template outside the DS gallery | scaffold/generation |
| S6 | Client-nav progress + silent-failure watchdog island | none | scaffold/generation |
| S7 | Flat `appRoutes` alias map over the nested generated tree | eis-chat hand-writes 15 `createRouteReference` literals (`router.ts:20-59`) that duplicate `.generated/manifest.ts` | scaffold/generation |
| S8 | An app `README.md` that states the app's own conventions | eis-chat's is untouched Fresh boilerplate (`apps/dashboard/README.md:1-17`) while the real rules live in `docs/design/BUILD-CONTRACT.md` | docs/discovery |
| S9 | Optimistic-mutation recipe + `invalidate` on canonical keys | 0 `invalidate` calls in the reference app despite the generated doc prescribing it | docs/discovery |
| S10 | `initialDataUpdatedAt` wired from a loader `cachedAt` | plumbed then dropped (`SkillsPanel.tsx:74`) | docs/discovery |
| S11 | Tokenized `ErrorDisplay`/`InlineError` (no hardcoded Tailwind colors) | app re-implements into `InlineNotice` (`channel-view.tsx:20-23`) | plugin-composition / DS |
| S12 | A LIVE/DESIGNED provenance convention + `PluginGatedView` primitive | app-invented (`components/blocks/plugin-gated-view.tsx`) | docs/discovery |

---

## 12. Concrete conventions the scaffold should generate (ranked, copy-ready)

1. **Page files are builders only.** Generate every example page as `definePage()` + `withLayout`
   slots with **zero** presentational JSX; markup lives in `(_components)/<surface>-view.tsx` exporting
   named sections. Bar: `channel/[channel]/index.tsx` 295 lines / 0 markup vs
   `(_components)/channel-view.tsx` 331 lines / all markup.
2. **Generate a dynamic route with a guard.** `routes/<res>/[id]/{_middleware.ts,index.tsx,(_components)/…}`
   where `_middleware.ts` default-exports `[guardParam('id', fallbackHref)]`, plus
   `lib/route-guards.ts` with `isPresent`/`guardParam`/`guardParamIfMatched`. Until loaders can emit
   non-200 (§9), this is the *only* correct 404/redirect seam and the scaffold must say so.
3. **Generate the error contract, not just the API.** Every generated resource loader wrapped in
   `errorHandler(loader, fallback)`, results funnelled through `hasError`/`extractDataWithFallback`,
   errors de-duplicated by message, rendered by a first `issues` layer with `role='alert'`.
4. **Generate one `withForm` example** with zod messages written as user-facing copy, `csrf: true`,
   `redirectTo` via the typed route map, `spanName`, and a component that reads
   `firstFieldError(state.fieldErrors, …)` and sets `aria-invalid`.
5. **Generate the toast bus.** `lib/ui/client-toast.ts` (`CustomEvent` on `document`, SSR no-op,
   optional `action: {label, run}`) + a single `ActionToasts` outlet mounted in `_layout.tsx`. This
   is what makes every island mutation reportable without prop plumbing.
6. **Generate a flat `appRoutes` map** in `router.ts` derived from the generated manifest, so link
   sites read `appRoutes.session.href({ path: { … } })` instead of `routes.a.$b.c.$d.$route`. Ship it
   as codegen, not as a hand-maintained duplicate.
7. **Generate the optimistic-mutation recipe**: local `pending`/`removed` overlay merged ahead of
   query data, reconciled in `onSuccess`/`onError`, **plus** `invalidate` on the canonical key — and
   consume `cachedAt` into `initialDataUpdatedAt` so the seam is discovered.
8. **Generate provenance vocabulary**: `PluginGatedView`, plus a documented rule that unbacked
   surfaces are rendered and labelled, never faked, with the blocking issue named in the copy.
9. **Generate a real app README** (not Fresh boilerplate) containing: the folder vocabulary table,
   the island budget ("islands only for streaming/mutations"), the CSS ownership rule (one
   `assets/blocks/<surface>.css`, one ordered `@import`, tokens only, no raw hex, light + dark), and
   the per-slice verification command pair.
10. **Generate the zero-JS interaction budget as working examples**: `<details>` row menu with
    `role='menu'`, CSS-radio tabs, native `<dialog>`, `@container` — so agents copy progressive
    enhancement instead of reaching for an island.
11. **Type discipline defaults**: `readonly` props, explicit `: VNode` returns, discriminated-union
    component props (`type: 'link'` + `href?: never`) — and a lint/gate that fails on `any`,
    `@ts-ignore`, and un-commented `as unknown as`. eis-chat proves 0/0/justified-only is achievable
    at 31.9k LoC.

---

## 13. Framework-side actions implied (not scaffold)

- **F1 (API/type-system seam, likely already fixed):** confirm `#1265` removed the
  `clientKey → queryKey` cast; add a regression test asserting `clientKey(...)` is assignable to
  `IslandQueryOptions['queryKey']`, and note the fix in the beta.9→current migration doc so the six
  copied casts get deleted.
- **F2 (API/type-system seam):** loaders cannot emit non-200 (`route-guards.ts:5-9`). Either make
  `definePage` loaders honor a thrown `Response`/`HttpError`, or document `_middleware.ts` as the
  official redirect/404 seam in the builder's own docs.
- **F3 (API/type-system seam):** `.withRoute()` types `ctx.path` but leaves it empty at runtime
  without `pathSchema` (`route-guards.ts:12-14`) — typed-but-lying surface.
- **F4 (plugin-composition/DS):** tokenize `ErrorDisplay`/`InlineError` so the framework error
  components are usable inside a token-driven design system (`channel-view.tsx:20-23`).
- **F5 (runtime correctness):** `<body f-client-nav>` + POST→redirect crashes Fresh 2.3.3's
  `domToVNode`; the only escape is the literal string `'false'`
  (`create-session-form.tsx:28-39`). Needs either a framework guard or a documented opt-out helper.
- **F6 (runtime correctness):** streams runtime sends `content-encoding: gzip` on plain JSON
  (`stream-loaders.ts:86-90`, cites `netscript#219`); durable-stream snapshot replay drops
  tool-call/thinking/widget chunks (`stream-loaders.ts:75-81`).
- **F7 (API/type-system seam):** contract-typed non-optional arrays arrive `undefined` after
  hydration and 500 SSR (`SkillsPanel.tsx:93-97`).
- **F8 (docs/discovery):** eis-chat's own `docs/NETSCRIPT-UPSTREAM-CANDIDATES.md:1-32` already lists
  three review-ready upstream candidates (typed desktop backend `webview|cef`, an explicit
  loopback-capable hostname axis on `ServeOptions`/`ServiceConfig`/`defineService`, combined-graph
  Windows deployment). These are unowned on the NetScript board as far as this teardown can see.
