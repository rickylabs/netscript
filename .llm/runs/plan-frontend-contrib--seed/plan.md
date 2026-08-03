# Plan — plan-frontend-contrib--seed (generator draft, rev 2)

> **Status: generator draft, post-adversarial.** Rev 2 integrates the Sol stage-2 findings
> (`adversarial-sol.md`; per-finding dispositions in `adversarial-triage.md` — all 20 accepted,
> 7 blockers). Pending: Kimi K3 docs/API pass → owner review. Drafts only; no board mutations;
> no product code.

## Scope

Design (not implement) the frontend contribution layer: contracts, discovery/registry, host
runtime, scaffolding/CLI, DX, and four worked consumers. Deliverables are
`design/canonical/00–06` (rev 2) + `design/examples/*` (rev 2) + this plan.

## Locked design decisions (D#) — rationale in the canonical docs

| # | Decision (rev-2 state) | Where |
| --- | --- | --- |
| D1 | `@netscript/plugin-frontend-core` owns the vocabulary; **serializable types/schemas only** — all runtime helpers (definePluginPage, pluginApi, route normalizer) live in `@netscript/fresh/plugins` (S-5) | 01, 04 |
| D2 | Core `@netscript/plugin` gains only a pointer axis — unchanged | 01, 06 |
| D3 | **Envelope + family model** (S-7): stable `FrontendManifestEnvelope` + per-family payload schemas with `(family, major)` windows; `app` family v1 = route/island/zone/nav/theme; dashboard = its own family sharing envelope/pipeline/identity, NOT a widened union | 01 |
| D4 | Discovery = manifest pointer + generated **transactional replace-set** (stage → check incl. `frontend.check.ts` → atomic swap; deterministic empty emissions on removal) (S-11) | 03 |
| D5 | Islands by module specifier on both build paths — **API verified, behavior proof-gated [P3]** (S-3): clean-cache/JSR/HMR/CSS matrix must pass before the island contract freezes | 02, 04 |
| D6 | Routes mount as sub-Apps in a **post-fsRoutes composition phase** with fixed order (middleware→routes), generated **literal lazy loaders + normalizeFreshRouteModule**, plugin `_layout` rejected in v1, child App-level commands stripped (S-1, S-2); proof [P1]/[P2], fallback = prefixed `app.route()` without `mountApp` | 04 |
| D7 | Two delivery models (live vs scaffolded starter via `AppTarget`); starters never fabricate backend surface (S-13 law) | 00, 05, examples |
| D8 | Client data path = **generated deny-by-default procedure gateway** (S-6), replacing the rev-1 wildcard proxy; AI durable streaming stays on its specialized adapter; gateway is its own reviewed wave with threat model [P5] | 04 |
| D9 | Host seam split: server `PluginRequestContext` (ports/functions ok) vs serializable `PluginClientContext` (island-safe); auth supplies a **principal port**, never a concrete type in the base contract (S-9) | 01, 04 |
| D10 | Theming: `--ns-*` only; **host-owned layer-order prelude**, per-plugin portal root, copy-mode `url()` rewrite requirement (S-12); DTCG merge deferred | 04 |
| D11 | App surface trust = T0; containment contract is **data-phase + client-side + route onError** — SSR render throws are documented page failures, not "contained" (S-4) | 04 |
| D12 | Versioning: `(family, major)` handshake + install `deno check` gate + doctor + quarantine (reserved for window mismatch/load failure — never for known-but-unmounted surfaces, S-10) | 01, 03 |
| D13 | Scaffold templates wire the layer by default; hosts publish a versioned `HostSurfaceDescriptor` (zones/navGroups/reservedPaths/family windows) — zone growth is host data, not schema change (S-10) | 01, 05 |
| D14 | Explicit manifest is the contract; **export-map maintenance + `netscript plugin dev` are phase 1** (S-16); convention-derived contribution lists remain phase-2 sugar | 02, 05 |
| D15 | Identity quartet (packageName / pluginKind / installationId / mountId); all generated keys derive from mountId (S-8) | 01 |
| D16 | Quality contract: per-plugin host-fixture test kit (`./testing`) + production budgets recorded in the manifest (S-18) | 05 |

## Owner forks (F#) — re-triaged per S-20: technical invariants removed, policy retained

Resolved by evidence (no longer forks): ~~F4 zone-set additivity~~ (host-descriptor data —
D13); ~~F6 generator timing~~ (exports phase 1 — D14); F7's *mechanism* (ai chat architecture
fixed by S-14 — durable-session runtime).

| # | Fork (genuine policy) | Options | Seed recommendation |
| --- | --- | --- | --- |
| F1 | Core pointer axis | (a) `.withFrontend()` pointer in core (b) manifest-only | **(a)** |
| F2 | Route mount **default policy** (mechanics now fixed: full pattern/reserved-path/basePath collision rules, 03 §3) | (a) plugin-preferred base + host remap (b) forced `/plugins/<mountId>` namespace | **(a)** — `/auth/account` beats `/plugins/auth/account`; collisions are caught deterministically either way |
| F3 | Contract package name | (a) `@netscript/plugin-frontend-core` (b) fold into `@netscript/fresh` (c) `@netscript/frontend-core` | **(a)** |
| F5 | Theme contributions | (a) CSS overlay only (b) + DTCG token merge | **(a)** at v1 |
| F7 | First-party dogfood set for Wave 1 | (a) workers zone panel + console route (b) + ai durable chat (c) all four capability plugins | **(a) then (b)** — workers exercises zone+route+island+gateway; ai adds the specialized-stream pattern |
| F8 | Milestone placement | beta.12 … beta.14 vs stable train | defer — sequencing vs PM #510 (beta.12), dashboard epic (beta.13), deploy epics |
| F9 | **SSR zone isolation** (new, from S-4): accept the documented containment contract, or fund a designed isolated-render protocol later | accept v1 contract / fund protocol | **accept v1 contract**; protocol only on demonstrated need |

## Phasing (rev 2 — Wave 0 inserted per S-19)

**Wave 0 — five disposable proofs (no public contracts frozen until all pass):**

| P# | Proof | Kills/confirms |
| --- | --- | --- |
| P1 | mounted-app ordering: host `_app`/nested layouts/basePath × plugin middleware/404 × two plugins | S-1 / D6 |
| P2 | literal lazy loaders + `normalizeFreshRouteModule` (handlers, config, css, error shape) | S-2 / D6 |
| P3 | dependency islands matrix: clean cache × {local-source, jsr} × {dev, prod build+SSR+hydrate}, Preact identity, dependency CSS, edit loop; plugin-vite pin/compat | S-3 / D5 |
| P4 | SSR failure containment fixtures (sync + async zone throw; resolver-catch; route onError; client boundary) | S-4 / D11 |
| P5 | gateway threat model + SSE abort/reconnect semantics on one real procedure | S-6 / D8 |

**Wave 1 — narrow spine** (after Wave 0): envelope/schemas + identity + `frontend.check.ts`
pipeline + transactional emissions; ONE route + ONE island + ONE zone via the workers dogfood;
scaffold template wiring; host descriptor. **Wave 1b — gateway** (own reviewed wave). **Wave 2 —
DX + lifecycle**: `plugin new --with frontend`, `plugin dev`, doctor checks, quarantine states,
`plugin resource add --app` (AppTarget), test kit + budgets. **Wave 3 — consumers**: auth v1
(starter signin + account + session widget), ai durable chat, remaining panels; deploy +
dashboard epics consume the layer in their own runs (auth-org capability is a named backend
prerequisite, not this layer's work).

## Gates & validation map

Per-archetype columns as rev 1, plus (S-18): the `./testing` host-fixture kit (schema,
serialization round-trip, SSR, hydration, browser, a11y/keyboard, base-path, local+JSR,
install/remove) is a required gate for every frontend-contributing plugin; production budgets
(initial JS, chunks, CSS bytes, island count, render/resolver deadlines) recorded per plugin and
asserted by the kit; `scaffold.runtime` extension for merge-readiness only.

## Risk register (rev 2)

| Risk | Exposure | Mitigation |
| --- | --- | --- |
| Wave-0 proofs fail (esp. P3 islands, P1 mount ordering) | contract shape | proofs are disposable and FIRST; fallback mount mechanism named (D6); JSR island mode can ship later than local-source without changing contracts |
| Gateway scope creep | security wave | deny-by-default generation from contract metadata only; no generic forwarding, ever (D8) |
| plugin-vite `^1.0.8` drift | islands | pin or compat-test in P3; version fact lives in the registry emission |
| Dep-CSS `@import` vs copy fallback | theming | url() rewrite requirement recorded (D10); asset contract deferred as debt |
| Schema evolution mistakes | contracts | envelope/family negotiation tests (old-host/new-plugin × new-host/old-plugin) are Wave-1 deliverables (D3) |
| Consumer examples drifting from backend reality | credibility | S-13/14/15 corrections landed; rule: examples cite the real contract file+lines they compose |
| Scope creep into dashboard family | this seed | D3 boundary — dashboard is a sibling family on the shared envelope |

## Debt candidates

`design/canonical/06-doctrine-fit.md §4` (now includes AssetContribution, SSR isolation
protocol, message catalogs).

## Evidence base

`research.md`; `adversarial-sol.md` + `adversarial-triage.md` (stage-2 record); prior-art as
rev 1 (dashboard extension architecture, A-dashboard §9/OQ-12, deploy kickoff, doctrine 07).
