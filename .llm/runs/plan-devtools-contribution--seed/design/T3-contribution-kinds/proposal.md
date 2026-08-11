# T3 — Contribution kinds (charter Q3)

Stage-D deep-dive, run `plan-devtools-contribution--seed`, baseline `main` @ `2256a67bf`.
Planning-only. Every load-bearing claim cites a corpus file (which cites `path:line` / saved
artifact) or a repo path verified in this pass. Unmarked claims are `observed` via the cited
corpus; `inference` is marked.

**Method (the charter's bar):** a kind is retained only if a reader would recognize its named
first-party consumer as *real at this baseline* — an existing runtime surface, a shipped seam, or
an owner-ratified board line — not a plausible future one. The old board's 7-member
`DashboardContribution` union (`panel|route|action|ai-tool|nav|entity-tab|home-card`) comes from an
**analysis-only, never owner-ratified** document (`b1` F5, D3), so it is treated as a candidate
list to test, not a baseline. Doctrine independently forbids the one-union shape: a single
`DevToolsContribution` covering all nine candidates is **AP-3 god interface**
(`docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md:46`), and a
`switch (contribution.kind)` host renderer is **AP-24**
(ibid.`:165`; `b2` F5 via `research.md` F13).

---

## Recommendation (the v1 set)

**v1 defines exactly two new contribution kinds, plus one reuse. There is no
`DevToolsContribution` union at all** — each kind is a separate named axis with its own contract
module, keyed registry, host behavior, and failure mode. RFC-A itself licenses this shape: *"UI
contributions and SDK request contributions are separate named extension axes, not one universal
envelope"* (`p3` F14 via `research.md` F4).

| # | Kind | One-line contract | Real first-party consumer (v1) |
|---|------|-------------------|-------------------------------|
| 1 | **`panel`** — zone-targeted, server-side-only JSON-spec panel (`json-render` tier) | plugin returns a JSON element tree; host renders it with NetScript-owned components into a host-owned zone | Workers console panel: job registry + execution/attempt state from `plugins/workers`' runtime registries (`r1` F10; board #428/#933 name it — `b1` F4, D7). Sagas/triggers/streams panels follow on the same contract (#429–#431), with streams shipping an explicit `empty` state because it has **no oRPC contract surface to read** (`research.md` F15) |
| 2 | **`link`** — typed external deep-link into Aspire/Scalar | plugin declares a typed target; host builds the URL from the verified grammars and the resolved dashboard base URL | The journey→logs jump: `netscript.correlation.id` → traceId → `/structuredlogs/resource/{n}?traceId=&spanId=` (`r5` F13; `m4` F6-F11 via `research.md` F6). **No deep-link helper exists anywhere in `packages/` today** (`research.md` F7), so this kind is small and immediately load-bearing |
| 3 | **`diagnostic`** — *reuse, not a new kind*: the shipped `plugin doctor` `extraChecks` seam | host runs the existing doctor machinery (read-only `dryRun: true` context) and renders per-plugin results in the five-state taxonomy; the CLI remains the second caller | The auth plugin's `auth-backend` doctor check — the one contributed check that exists at baseline, proven by the closed literal `cli.doctorChecks: readonly 'auth-backend'[]` (`r3` F2-F4 via `research.md` F18; seam described `r4` F2 via SYNTHESIS S-17: *"the extension point already exists and already runs contributed checks"*) |

**Everything else is staged or rejected** (§ below). In particular v1 is **read-only**: no
`action` kind ships until the mutation contract routes (#554/#555/#556) and SDK auth propagation
(RFC-A → #1352) exist — `createServiceClient` cannot send `Authorization`/`x-api-key` today
(`research.md` F15), and TanStack's `install-devtools` precedent shows how fast an action channel
becomes privileged (`m2` F10 via `research.md` F25).

Two cross-kind rules, adopted from the market and cited:

- **Identity**: version-suffixed ids `'<plugin>/<name>/v1'` — Grafana derived its entire
  compatibility story from this one convention (`m2` F13, F16 via `research.md` F24).
- **Ordering**: host-owned deterministic `(order, id)` sort. No surveyed system solved ordering
  (`m2` F21, F3; `m3` M-8; SYNTHESIS S-20 R5), so this is designed, not borrowed; zones are a
  **host-owned closed vocabulary** (Medusa's actual model, `m3` M-2/M-4 — not the plugin-minted
  Strapi model #890's framing implied), which makes name collision impossible by construction.

---

## Kind-by-kind evaluation

All nine charter candidates, plus the three extra members the prior art surfaces (`launcher`,
`exposedComponent`, and the 7-member union's `ai-tool`/`entity-tab`/`home-card`).

| Kind (candidate) | Real first-party consumer? | Host behavior | Verdict | Reason |
|---|---|---|---|---|
| **Zones/panels** | **Yes** — workers job/execution console (#428, #933); sagas instances incl. `compensating` (#429); triggers firing history (#430); streams deliveries (#431) — all reading runtime state that exists at baseline (`r1` F10; `b1` F4) | Render JSON element tree into host zone; per-contribution error boundary; `(order, id)` sort; per-zone volume cap (`m2` F15) | **KEEP-v1** (`json-render` tier only) | The zero-client-code tier is *"the shortest path to a DevTools panel: server-side TypeScript only"* (`m1` F3); most plugin panels are key/value + table + list (`m1` applicability verdict); it dodges the VNode-serialization dead end Nuxt hit (`m1` F23) and — decisively — requires **none** of #890's unbuilt envelope/mount/registry spine (`research.md` F1, F2) |
| **Island/client-code panel tier** | Named but unbuilt — #933's "island" half | Would require plugin client bundles, mount glue, Preact singleton discipline (`r1` F16 via SYNTHESIS) | **STAGE** | There is no plugin→UI channel of any kind at baseline (`research.md` F1); the client-code tier is exactly the machinery #890's spine (`0.0.9`, zero implementation — F2) was to provide. Staging it keeps v1 buildable without resolving owner fork #1 first |
| **Pages/routes** | No v1 consumer: the four consoles are **host-owned screens**, not plugin-contributed pages (`b1` F10: the dashboard epic "implements kinds + host") | n/a in v1 | **STAGE** | A contributed route needs route-manifest integration that mutates page modules (`r1` F8) and a visible-tree convention (`r1` F4) — #890-spine territory. Also the fastest road to AP-21 flat command surface (doctrine `09-…md:141`) |
| **Inspectors / entity-tabs** | Yes, but as panels: per-entity detail views (run inspector #419, plugin detail #420) | Entity-scoped **zones** whose context carries a host-fetched typed slice — Medusa's `DetailWidgetProps<T>` transfer (`m3` M-7) | **FOLD into `panel`** | Not a distinct kind: an inspector is a panel whose zone is entity-scoped and whose context is typed per zone. A separate kind would be AP-9 duplication of the panel contract |
| **Visualizers** | No — S13 flow-chain is the **host-owned flagship** (#418), and the killed-surfaces list (waterfall, log tail) exists precisely so such renderers cannot creep back (`b1` F3) | n/a | **REJECT** | The extension seam for visuals is the host-owned `json-render` component vocabulary, which grows by host release, never by plugin. A plugin-contributed renderer is the `custom-render` isolation-skip Vite offers (`m1` F3) and the place where "a contribution throws" becomes "the shell is dead" (`m1` applicability verdict) |
| **Actions/commands** | Named but blocked: gated rerun/cancel (#428), trigger enable/disable (#430), runtime-config write-back (#551) — every one gated on unbuilt co-reqs (#554/#555/#556; runtime-config is read+watch only, `b1` F7 D6) and on SDK auth (`research.md` F15) | Staged contract preserves #400's law: invoke the same contract route/CLI scaffolder as the terminal and render the `cliEquivalent` line (`b1` F3, acceptance line 2) | **STAGE** | v1 is read-only by decision, not omission. The privileged-channel precedent (`m2` F10) and #1446's Surface-1/Surface-2 boundary (`research.md` F3) both say mutations need their own trust design (T6) before a kind exists |
| **Diagnostics / data sources** | **Yes** — the `auth-backend` doctor check ships today (`r3` F2); `plugin doctor` already dynamically imports and runs plugin-contributed `extraChecks` read-only (`r4` F2) | DevTools renders doctor families per plugin mapped to the five-state contribution taxonomy; CLI prints the same rows (one generator, two callers) | **KEEP-v1 as reuse** — no new union member | Minting a parallel DevTools diagnostic kind would duplicate a shipped seam — the exact "reimplement rather than consume" trap `r5` D1 documents in the scaffolded telemetry example. The *new* work is a named slice opening the closed `'auth-backend'` literal (six-file cost, `r4` F11 via SYNTHESIS S-17) |
| **Navigation** | No distinct consumer — sidebar entries for zones are derivable from panel registrations | Host derives nav from the zone vocabulary + registered panels | **REJECT** | With routes staged, a nav contribution has nothing to point at that a panel registration doesn't already imply. A separate nav kind is union filler — the AP-3 shape the charter warns about |
| **External deep-links** | **Yes** — trace/logs/metrics jumps (grammar verified from fetched `.razor` sources, `m4` F6-F11); Scalar operation anchors (`m4` grammar; `r5` F26 mount points) | Host resolves base URLs (`Dashboard:Frontend:PublicUrl`, never hardcoded `localhost:18888` — `m4` F17-18), builds typed URLs, renders disabled-with-reason when unresolvable; **never** constructs opaque `?filters=` (`m4` F11) | **KEEP-v1** | The non-duplication acceptance line — *"why can't this just deep-link to Aspire/Scalar?"* (`b1` F3) — makes deep-links the enforcement mechanism of the whole ownership thesis. No helper exists (`research.md` F7): small, high value, zero unbuilt dependencies |
| **Setup/onboarding** | No — plugin setup is owned by `plugin install` + doctor; the home "wiring" grid is host-owned (#415) | n/a | **REJECT** | "Is this plugin set up" is answered by the diagnostic reuse; an onboarding kind duplicates doctor with worse authority |
| **`launcher`** (Vite tier) | Yes — but as a **state**: every telemetry-backed panel fronts an ephemeral AppHost endpoint (`r5` F11) and must degrade when it is down | The panel `availability` state machine includes `unavailable` with an optional launch card showing (not running) a `cliEquivalent`; swap-back-when-dead rule adopted (`m1` F15) | **FOLD into `panel` as lifecycle state** | Vite models launch as a first-class *state* of a dock entry, not a kind (`m1` F15). No v1 consumer needs DevTools to *own* process launch — Aspire's runtime port does (`r5` F2), and v1 is read-only, so the card shows the command rather than executing it |
| **`exposedComponent`** (Grafana plugin↔plugin axis) | No — no plugin consumes another plugin's UI; no plugin has UI at all (`research.md` F1) | n/a | **DEFER — explicitly** | `m2`'s own adapt-list: *"it is a second, distinct feature (plugin↔plugin) layered on the first (plugin↔host). Defer."* Deferral is stated per `m2` OQ8, not omitted. If ever adopted, take singleton-key + first-registration-wins verbatim (`m2` F22) |
| **`ai-tool`** (7-member union) | No — the agent surface is MCP: 22 typed tools exist (`r5` F17-18) | n/a | **REJECT** | Aspire removed its in-dashboard Copilot in 13.3 and redirected agents to CLI/MCP (`research.md` F26). DevTools = human surface; MCP = agent surface. An ai-tool kind in DevTools would be a second, duplicated tool axis |
| **`home-card`** (7-member union) | Weak — home stats grid is host-owned (#415); a per-plugin card ("3 jobs, 1 failing") has no filed consumer | Would be a `home` zone entry, not a kind | **STAGE (as a zone id)** | Under a closed zone vocabulary this is a one-line vocabulary addition, not a contract change. Add the `home` zone when a first-party card issue is actually filed |

---

## Retained kind contracts

Real TS, family-agnostic: how these payloads are packaged/discovered (envelope vs sibling family,
package home) is **T2's decision**; the host→panel data context beyond what is shown here is
**T5's**. Names are illustrative pending T2/Q11.

### Shared base

```ts
/** Version-suffixed identity: Grafana's whole compatibility story in one string (m2 F16). */
type DevToolsContributionId = `${string}/${string}/v${number}`; // '<plugin>/<name>/v1'

interface DevToolsContributionBase {
  readonly id: DevToolsContributionId;
  readonly title: string;
  readonly description: string;
  /** Host sorts deterministically by (order ?? 0, id). Net-new design — no market precedent (m2 F21). */
  readonly order?: number;
}
```

### `panel` (v1 — `json-render` tier only)

```ts
/**
 * Host-owned CLOSED zone vocabulary (Medusa model, m3 M-2/M-4).
 * Plugins cannot mint zones; collision is impossible by construction (SYNTHESIS S-20).
 * Initial set is deliberately minimal; each entry names its context type.
 */
type DevToolsZone =
  | 'workers.console'   // ctx.data: WorkersConsoleData (host-fetched)
  | 'sagas.console'
  | 'triggers.console'
  | 'streams.console'
  | 'plugin.detail'     // entity zone — ctx.data: PluginDetailData (typed slice, Medusa m3 M-7)
  | 'run.detail';       // entity zone — ctx.data: RunDetailData

interface DevToolsPanelContribution extends DevToolsContributionBase {
  readonly zone: DevToolsZone | readonly [DevToolsZone, ...DevToolsZone[]];
  /**
   * Server-side only. No client code, no bundle, no island (m1 F3: "server-side TypeScript
   * only"). Runs in-process in the DevTools host under an AbortSignal.
   */
  readonly render: (ctx: DevToolsPanelContext) => Promise<DevToolsUiNode>;
  /** Optional probe; drives the launcher/degraded card (m1 F15). Default: 'ready'. */
  readonly availability?: (ctx: DevToolsPanelContext) => Promise<PanelAvailability>;
}

type PanelAvailability =
  | { readonly state: 'ready' }
  /** Truthful empty state — e.g. streams has no oRPC contract surface to read (research.md F15). */
  | { readonly state: 'empty'; readonly reason: string }
  /** Backing dependency down (ephemeral AppHost endpoint, r5 F11). Renders the launch card. */
  | {
      readonly state: 'unavailable';
      readonly reason: string;
      /** v1 shows the command; it never executes it (read-only surface). */
      readonly remedy?: { readonly cliEquivalent: string };
    };

interface DevToolsPanelContext {
  readonly zone: DevToolsZone;
  readonly pluginId: string;
  readonly signal: AbortSignal;
  /** Zone-scoped, host-fetched typed data (entity zones only); full shape owned by T5. */
  readonly data?: unknown;
}

/**
 * Closed, host-rendered element vocabulary, mapped onto @netscript/fresh-ui components.
 * Grows only by host release. This — not plugin renderers — is the visual extension seam.
 */
type DevToolsUiNode =
  | { readonly kind: 'stack'; readonly direction?: 'row' | 'column'; readonly children: readonly DevToolsUiNode[] }
  | { readonly kind: 'text'; readonly text: string; readonly tone?: 'default' | 'muted' | 'danger' }
  | { readonly kind: 'keyValue'; readonly entries: readonly { readonly key: string; readonly value: string }[] }
  | { readonly kind: 'table'; readonly columns: readonly string[]; readonly rows: readonly (readonly string[])[] }
  | { readonly kind: 'badge'; readonly text: string; readonly tone: 'ok' | 'warn' | 'error' }
  | { readonly kind: 'link'; readonly link: DevToolsLink; readonly label: string };
```

**Host behavior.** Registry keyed by zone (registry-over-switch, AP-24 —
`09-anti-patterns-…md:165`); per-zone `(order, id)` sort; per-zone per-plugin volume cap
(`m2` F15, ~8 lines). Every panel renders inside a per-contribution error boundary.

**Failure behavior — a deliberate departure from all prior art.** Every surveyed system fails
quietly (`m3` X-2); Grafana logs loud and renders `null` in prod (`m2` F23). NetScript inverts the
polarity because **the developer is the audience**: a throwing `render` or `availability` produces
a *visible error card in the panel's slot* (contribution id + message + stack), logged through the
host's logger — never `console.log` (AP-13 has two live debt entries, SYNTHESIS S-11) — and never
crashes the shell or neighboring panels. A silently missing panel is a debugging trap; this
departure is argued, per `m3` X-2's instruction, not assumed.

**Acceptance discipline (process, not payload):** every merged first-party panel issue must record
its NetScript-only answer to *"why can't this just deep-link to Aspire/Scalar?"* (#400 acceptance
line 1, `b1` F3) — the per-kind form of the charter's no-speculative-union bar.

### `link` (v1)

```ts
/**
 * Typed deep-link targets. Aspire grammar verified from fetched dashboard .razor sources
 * (m4 F6-F11); Scalar anchor grammar from its docs (m4). NOT expressible by design:
 * filtered Aspire views — `?filters=` is an opaque internal serialization (m4 F11).
 */
type DevToolsLink =
  | { readonly target: 'aspire.resource'; readonly resource: string }                    // /?resource={n}
  | { readonly target: 'aspire.consoleLogs'; readonly resource: string }                 // /consolelogs/resource/{n}
  | {
      readonly target: 'aspire.structuredLogs';                                          // the journey→logs jump
      readonly resource?: string;
      readonly traceId?: string;
      readonly spanId?: string;
      readonly logLevel?: 'error' | 'warn' | 'info' | 'debug' | 'trace';
    }
  | { readonly target: 'aspire.trace'; readonly traceId: string; readonly spanId?: string } // /traces/detail/{id}?spanId=
  | { readonly target: 'aspire.metric'; readonly resource: string; readonly meter: string; readonly instrument: string }
  | { readonly target: 'scalar.operation'; readonly tag: string; readonly method: string; readonly path: string } // #tag/… — gated on OQ-8 (tag emission)
  | { readonly target: 'scalar.model'; readonly slug: string }
  | { readonly target: 'external'; readonly href: string };

interface DevToolsLinkContribution extends DevToolsContributionBase {
  readonly zone: DevToolsZone | readonly [DevToolsZone, ...DevToolsZone[]];
  /** Static, or derived from zone context (e.g. an execution row's traceId). */
  readonly link: DevToolsLink | ((ctx: DevToolsPanelContext) => DevToolsLink | undefined);
}
```

**Host behavior.** A pure URL-builder module (the missing helper, `research.md` F7) resolves
Aspire links against the discovered dashboard base URL (`Dashboard:Frontend:PublicUrl` when
obtainable — open question OQ-5 — else the four-arm endpoint policy `r5` F22; **never** a
hardcoded `localhost:18888`, `m4` F17-18) and Scalar links against the service's mounted
`/api/docs` (`r5` F26). The same builder serves `netscript dashboard open|url` (#424) — one
grammar, two callers, mirroring #400 acceptance line 2. `inference`: making the builder pure and
IO-free mirrors `@netscript/mcp/openapi-projection`'s proven shape (`r5` F21).

**Failure behavior.** Unresolvable base URL → the affordance renders disabled with the reason
("dashboard not running") rather than 404-ing the developer. A malformed registration is dropped
from the list with a loud dev-mode error (empty-list degrade, `m2` F18). A callback-form `link`
returning `undefined` renders nothing for that row — the typed "this row has no trace" case.

### `diagnostic` (v1 — reuse of the shipped doctor seam)

No new payload type is minted in v1. The contract **is** the existing `plugin doctor`
`extraChecks` contract: checks are dynamically imported from the plugin and run with a read-only
`dryRun: true` context (`r4` F2). What the RFC adds:

- **Host behavior**: the DevTools plugin-detail zone renders each plugin's doctor rows mapped to
  the five-state contribution diagnosis taxonomy; the CLI renders the same rows (one generator,
  two callers). A throwing check becomes an `error` row, never a shell crash.
- **A named slice** (staged, not v1-blocking): widen `cli.doctorChecks` from the closed literal
  `readonly 'auth-backend'[]` (`r3` F2) so third-party plugins can contribute checks without the
  six-framework-file edit (`r4` F11) — the sharpest shipped proof that the current axis set is
  closed (`research.md` F18).

---

## Rejected and staged, with reasons

**Rejected (would need a consumer that does not exist, or duplicates an owned surface):**

| Kind | Reason (one line, cited) |
|---|---|
| `nav` | Derivable from zone vocabulary + panel registrations; with routes staged it has no referent — union filler (AP-3, doctrine `09:46`) |
| `visualizer` | S13/flow visuals are host-owned flagship (#418); killed-surfaces list exists so waterfall/log-tail renderers cannot creep back (`b1` F3); the seam is the host's `DevToolsUiNode` vocabulary |
| `setup/onboarding` | Doctor reuse answers "is it set up"; a second onboarding surface duplicates `plugin install` + doctor authority |
| `ai-tool` | MCP is the agent surface (22 typed tools, `r5` F17-18); Aspire's 13.3 Copilot removal is the precedent (`research.md` F26) |

**Staged (real shape, blocked on named prerequisites — each with an entry criterion):**

| Kind | Entry criterion |
|---|---|
| `action` | #554/#555/#556 mutation routes exist **and** RFC-A auth chain reaches #1352 (`research.md` F15); contract must carry `cliEquivalent` and confirm-dialog rendering (#400 line 2); trust design from T6 |
| `route` (plugin-contributed pages) | #890's spine lands **or** the DevTools host ships its own mount/registry slice (owner fork #1); until then all pages are host-owned |
| island/client-code panel tier | Same blocker as `route`, plus the Preact-singleton constraint (`r1` F16) and the trust-tier decision #890 parked "in the dashboard epic" (`p1` F10 via SYNTHESIS fork 5) |
| `home` zone id | First-party home-card issue actually filed; one-line vocabulary addition thereafter |
| `exposedComponent` (plugin↔plugin) | **Explicitly deferred** (per `m2` OQ8 deferral must be stated): adopt only when one plugin genuinely consumes another's UI; then take singleton-key + first-registration-wins verbatim (`m2` F22) |

---

## Open questions for the owner

1. **Ratify the read-only v1.** No `action` kind until #554/#555/#556 + #1352 — is a read-only
   first DevTools release acceptable, or must one gated mutation (e.g. trigger enable/disable)
   pull the action kind forward with its co-reqs?
2. **Ratify the two-kinds-plus-reuse minimum.** Specifically that `diagnostic` reuses the doctor
   seam rather than minting a DevTools-side kind, and that opening `cli.doctorChecks`' closed
   literal is a named follow-up slice, not v1 scope.
3. **Zone vocabulary ownership.** Host-owned closed vocabulary (Medusa model) is recommended —
   this is owner fork #21 (SYNTHESIS S-20); confirm, and confirm the initial six-zone set.
4. **`json-render` ceiling.** When a first-party panel outgrows the `DevToolsUiNode` vocabulary,
   the escape hatch is (a) grow the vocabulary by host release, or (b) accelerate the staged
   island tier. Recommend (a) by default; `m1` OQ7 notes even Vite's ceiling is undocumented.
5. **`scalar.operation` links** are gated on knowing what `tags` `@orpc/openapi` emits
   (`research.md` open question 8). Ship v1 links Aspire-only if OQ-8 stays open?
6. **Route/island staging vs #890.** The staging above intersects owner fork #1 (depend on #890's
   spine vs self-contained family). If the owner picks "self-contained", the staged `route`/island
   tier becomes a DevTools-owned slice; if "depend on #890", it inherits `0.0.9` sequencing.

---

## Sources

- `research.md` (stage-C synthesis) — F1–F26, R1–R5; `research/SYNTHESIS-NOTES.md` S-1…S-22.
- `research/m1-nuxt-vite.md` — F3 (six dock types, isolation postures, `json-render`), F15
  (launcher as state, swap-back rule), F16 (declarative entry data), F23 (VNode dead end),
  applicability verdict.
- `research/m2-tanstack-grafana.md` — F10 (privileged channel), F11 (no boundary), F13/F16
  (versioned ids), F15 (`limitPerPlugin`), F18 (empty-list degrade), F21/F3 (ordering unsolved),
  F22 (`exposedComponent` collision rule), F23 (error boundary), OQ8.
- `research/m3-admin-consoles.md` — M-2/M-4 (closed zone vocabulary), M-7 (typed prop flow),
  X-2 (quiet-failure prior art; departure must be argued), separation verdict.
- `research/b1-dashboard-board.md` — F3 (#400 thesis + three acceptance lines + killed surfaces),
  F4 (#428–#431 consumers, #423/#551–#557 co-reqs), F5/D3 (7-member union never ratified),
  F7 D6 (runtime-config read-only), F10 (#890 dispositions), D7 (#933/#944 overlap).
- `research/r5-observability-boundary.md` — F2 (Aspire owns lifecycle), F8-F9 (no deep-link
  helper), F11 (ephemeral endpoint), F13 (correlation id), F17-18 (MCP tools), F21
  (openapi-projection), F22 (endpoint policy), F26 (Scalar mounts), D1 (reimplement trap).
- Repo, verified this pass: `docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md:46`
  (AP-3), `:141` (AP-21), `:165` (AP-24).
- Corpus-cited board/PR reads (`gh`, 2026-08-11, read-only): #400, #427, #428–#431, #544, #554–#557,
  #734, #890, #933/#944, #1446, #1390 — via `b1`/`p1`/`p2`/`p3`.
