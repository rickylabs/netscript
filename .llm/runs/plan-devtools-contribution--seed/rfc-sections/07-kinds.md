## Contribution kinds

**Charter Q3.** What may a plugin contribute to DevTools, and what may it not?

### Decision

v1 defines **two new contribution kinds — `panel` and `link` — plus one reuse, `diagnostic`, which
mints no new type at all.** There is no `DevToolsContribution` union: each kind is a separately
named axis with its own contract module, its own zone-keyed registry, its own host behavior, and
its own failure mode.

Two independent authorities force this shape rather than a single envelope:

- Doctrine. A single union covering all nine candidates is **AP-3 god interface**
  (`docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md:46`), and a
  `switch (contribution.kind)` host renderer is **AP-24 switch-over-union** (ibid.`:165`). A
  panel-per-seam host with no grouping is **AP-21 flat command surface** (ibid.`:141`).
- RFC-A (#1390), already merged as design: *"UI contributions and SDK request contributions are
  separate named extension axes, not one universal envelope"* (`research.md` F4, `p3` F14).

The retention bar is the charter's: **a kind is retained only if a reader would recognize its named
first-party consumer as real at baseline `2256a67bf`** — an existing runtime surface, a shipped
seam, or an owner-ratified board line. A plausible future consumer is not a consumer. The 7-member
`DashboardContribution` union (`panel|route|action|ai-tool|nav|entity-tab|home-card`) that circulates
on the board comes from an **analysis-only document that was never owner-ratified** (`b1` F5, D3),
so it is treated below as a candidate list to test, not as inherited scope.

| # | Kind | Status | Named first-party consumer at baseline |
| - | ---- | ------ | -------------------------------------- |
| 1 | `panel` (`json-render` tier only) | **new** | Workers job/execution console — `plugins/workers` runtime registries (`r1` F10; board #428/#933, `b1` F4/D7). Sagas #429, triggers #430, streams #431 follow on the same contract |
| 2 | `link` (typed external deep-link) | **new** | The journey→logs jump: `netscript.correlation.id` → traceId → `/structuredlogs/resource/{n}?traceId=&spanId=` (`r5` F13; `m4` F6-F11). **No deep-link helper exists anywhere in `packages/`** (`research.md` F7) |
| 3 | `diagnostic` | **reuse of shipped seam** | The auth plugin's `auth-backend` doctor check — the one contributed check that exists, proven by the closed literal `cli.doctorChecks: readonly 'auth-backend'[]` (`r3` F2; `research.md` F18) |

Why smallness is the point, not thrift: **there is no plugin→UI channel of any kind at baseline** —
`capabilities.hasRoutes` means service HTTP endpoints, no registry kind emits routes/pages/islands,
and `grep -rn "devtools\|DevTools"` across `packages`/`plugins`/`docs/site` returns **zero matches**
(`research.md` F1, `r1` F9-F11/F14). Adding one axis to the current model costs **six framework file
edits** (`r4` F11; `research.md` F18). A nine-member union would therefore be nine untested contracts
shipped simultaneously into a surface with no existing consumers — the precise AP-9 premature
abstraction doctrine names (`b2` F5).

### Evaluation of every candidate

All nine charter candidates, plus the three extra members the prior art surfaces (`launcher`,
`exposedComponent`, `ai-tool`/`entity-tab`/`home-card` from the unratified union). Every row states a
verdict so a reader can see what was considered, not only what survived.

| Candidate | Real first-party consumer? | Host behavior | Verdict | Reason |
| --- | --- | --- | --- | --- |
| **Zones/panels** | **Yes** — workers console (#428, #933); sagas instances incl. `compensating` (#429); triggers firing history (#430); streams deliveries (#431), all reading runtime state that exists today (`r1` F10; `b1` F4) | Render a JSON element tree into a host-owned zone; per-contribution error boundary; `(order, id)` sort; per-zone per-plugin volume cap (`m2` F15) | **KEEP-v1** (`json-render` tier only) | The zero-client-code tier is *"server-side TypeScript only"* (`m1` F3) and most plugin panels are key/value + table + list. It sidesteps the VNode-serialization dead end Nuxt hit (`m1` F23) and — decisively — needs **none** of #890's unbuilt envelope/mount/registry spine (`research.md` F1, F2) |
| **Island / client-code panel tier** | Named but unbuilt — #933's "island" half | Would need plugin client bundles, mount glue, Preact-singleton discipline (`r1` F16) | **STAGE** | Exactly the machinery #890's spine was to provide, and #890 merged **docs only: 32 files, all under `.llm/runs/` plus `labels.yml`, zero source**, with all 24 children open at `status:plan`/`0.0.9` (`research.md` F2). Staging keeps v1 buildable without first resolving the family fork (see *Contribution family*) |
| **Pages/routes** | **No** — the four consoles are host-owned screens; the dashboard epic implements kinds *and* host (`b1` F10) | n/a in v1 | **STAGE** | A contributed route needs route-manifest integration that mutates page modules (`r1` F8) plus a visible-tree convention (`r1` F4) — #890-spine territory — and is the fastest road to AP-21 (`09-…md:141`) |
| **Inspectors / entity-tabs** | Yes, but *as panels*: run inspector #419, plugin detail #420 | Entity-scoped **zones** whose context carries a host-fetched typed slice — Medusa's `DetailWidgetProps<T>` transfer (`m3` M-7) | **FOLD into `panel`** | An inspector is a panel whose zone is entity-scoped and whose context is typed per zone. A separate kind would duplicate the panel contract (AP-9) |
| **Visualizers** | **No** — the S13 flow chain is the host-owned flagship (#418), and #400 keeps a *killed-surfaces* list (waterfall, log tail) precisely so such renderers cannot creep back (`b1` F3) | n/a | **REJECT** | The visual extension seam is the host-owned `DevToolsUiNode` vocabulary, which grows by host release. A plugin-supplied renderer is Vite's `custom-render` type, documented as *"skip[s] iframe isolation"* and painting *"directly into the DevTools panel DOM"* (`m1` F3, citing `vite-devtools__docs_kit_dock-system.md:251`) — the point where "a contribution throws" becomes "the shell is dead" |
| **Actions / commands** | Named but **blocked**: gated rerun/cancel (#428), trigger enable/disable (#430), runtime-config write-back (#551) — each gated on unbuilt co-reqs #554/#555/#556, on runtime-config being read+watch only (`b1` F7/D6), and on SDK auth (`research.md` F15) | Staged contract preserves #400 acceptance line 2: invoke the same contract route/CLI scaffolder the terminal does, and render the `cliEquivalent` | **STAGE** | v1 is read-only by decision, not omission — see *Read-only by default* below |
| **Diagnostics / data sources** | **Yes** — the `auth-backend` check ships today (`r3` F2); `plugin doctor` already dynamically imports and runs plugin-contributed `extraChecks` under a read-only `dryRun: true` context (`r4` F2) | DevTools renders each plugin's doctor rows in the five-state diagnosis taxonomy; the CLI prints the same rows (one generator, two callers) | **KEEP-v1 as reuse** — no new type | Minting a parallel DevTools diagnostic kind would duplicate a shipped seam — the "reimplement rather than consume" trap `r5` D1 records in the scaffolded telemetry example |
| **Navigation** | **No** distinct consumer — sidebar entries are derivable from the zone vocabulary plus registered panels | Host derives nav from zones + registrations | **REJECT** | With routes staged, a nav contribution has nothing to point at that a panel registration does not already imply. It is union filler — the AP-3 shape (`09-…md:46`) |
| **External deep-links** | **Yes** — trace/logs/metrics jumps, grammar verified from fetched Aspire `.razor` sources (`m4` F6-F11); Scalar operation anchors (`r5` F26) | Resolve base URLs, build typed URLs, render disabled-with-reason when unresolvable; **never** construct opaque `?filters=` (`m4` F11) | **KEEP-v1** | #400's non-duplication acceptance line — *"why can't this just deep-link to Aspire/Scalar?"* (`b1` F3) — makes deep-links the enforcement mechanism of the entire ownership thesis. No helper exists today (`research.md` F7): small, load-bearing, zero unbuilt dependencies |
| **Setup / onboarding** | **No** — plugin setup is owned by `plugin install` + doctor; the home "wiring" grid is host-owned (#415) | n/a | **REJECT** | "Is this plugin set up" is answered by the diagnostic reuse; an onboarding kind duplicates doctor with weaker authority |
| **`launcher`** (Vite dock type) | Yes — but as a *state*: every telemetry-backed panel fronts an ephemeral AppHost endpoint (`r5` F11) and must degrade when it is down | Panel availability includes `unavailable` with an optional launch card; swap-back-when-the-process-dies adopted (`m1` F15) | **FOLD into `panel` as a lifecycle state** | Vite models launch as a first-class state of a dock entry, not a kind (`m1` F15). No v1 consumer needs DevTools to *own* process launch — Aspire's runtime port does (`r5` F2) — and v1 is read-only, so the card shows the command instead of executing it |
| **`exposedComponent`** (plugin↔plugin UI) | **No** — no plugin consumes another plugin's UI; no plugin has UI at all (`research.md` F1) | n/a | **DEFER, explicitly** | `m2`'s own adapt-list: it is a second, distinct feature (plugin↔plugin) layered on the first (plugin↔host). Deferral is *stated* per `m2` OQ8, not silently omitted. If ever adopted, take singleton-key + first-registration-wins verbatim (`m2` F22) |
| **`ai-tool`** (unratified union) | **No** — the agent surface is MCP: 22 tools with typed input *and* output schemas plus `ToolKind` read/mutate/meta already exist (`r5` F17-F18) | n/a | **REJECT** | See *Why `ai-tool` is rejected* below |
| **`home-card`** (unratified union) | Weak — the home stats grid is host-owned (#415); no per-plugin card issue is filed | Would be a `home` zone entry, not a kind | **STAGE as a zone id** | Under a closed zone vocabulary this is a one-line vocabulary addition, not a contract change. Add the zone when a first-party card issue is actually filed |

### Cross-kind rules

Two rules bind every kind, so they live once here rather than three times below.

- **Identity — version-suffixed ids.** `'<plugin>/<name>/v1'`. Grafana derived its entire
  compatibility story from this one convention (`m2` F13, F16; `research.md` F24).
- **Ordering — host-owned deterministic `(order ?? 0, id)` sort.** This is designed, not borrowed:
  **no surveyed system solved ordering** (`m2` F21/F3; `m3` M-8). Under a host-owned closed zone
  vocabulary, *name collision is impossible by construction*, which is why collision policy is not a
  major design area in this RFC and ordering inherits the budget (`research.md` R5). Note the zone
  model is **Medusa's actual model — a closed, core-owned vocabulary plugins cannot mint** (`m3`
  M-2/M-4); the plugin-minted framing that circulated as "inspired by Medusa" is **Strapi's**
  (`research.md` F22).

### Retained kind contracts

Real TypeScript. How these payloads are packaged and discovered — envelope reuse versus sibling
family, and which package they live in — is decided in *Contribution family*; the full host→panel
data context is decided in *Data plane*. Names below are the RFC's proposal pending those sections.

#### Shared base

```ts
/** Version-suffixed identity: Grafana's compatibility story in one string (m2 F16). */
type DevToolsContributionId = `${string}/${string}/v${number}`; // '<plugin>/<name>/v1'

interface DevToolsContributionBase {
  readonly id: DevToolsContributionId;
  readonly title: string;
  readonly description: string;
  /** Host sorts deterministically by (order ?? 0, id). Net-new — no market precedent (m2 F21). */
  readonly order?: number;
}
```

#### `panel` — server-rendered JSON spec, zone-targeted

```ts
/**
 * Host-owned CLOSED zone vocabulary (Medusa model, m3 M-2/M-4). Plugins cannot mint zones.
 * Initial set is deliberately minimal; each entry names its context type.
 */
type DevToolsZone =
  | 'workers.console'   // ctx.data: WorkersConsoleData (host-fetched)
  | 'sagas.console'
  | 'triggers.console'
  | 'streams.console'
  | 'plugin.detail'     // entity zone — ctx.data: PluginDetailData (typed slice, m3 M-7)
  | 'run.detail';       // entity zone — ctx.data: RunDetailData

interface DevToolsPanelContribution extends DevToolsContributionBase {
  readonly zone: DevToolsZone | readonly [DevToolsZone, ...DevToolsZone[]];
  /**
   * Server-side only. No client code, no bundle, no island (m1 F3: "server-side TypeScript only").
   * Runs in-process in the DevTools host under an AbortSignal.
   */
  readonly render: (ctx: DevToolsPanelContext) => Promise<DevToolsUiNode>;
  /** Optional probe; drives the degraded/launch card (m1 F15). Default: 'ready'. */
  readonly availability?: (ctx: DevToolsPanelContext) => Promise<PanelAvailability>;
}

type PanelAvailability =
  | { readonly state: 'ready' }
  /** Truthful empty state — e.g. plugins/streams has no oRPC contract surface to read (F15). */
  | { readonly state: 'empty'; readonly reason: string }
  /** Backing dependency down (ephemeral AppHost endpoint, r5 F11). Renders the launch card. */
  | {
      readonly state: 'unavailable';
      readonly reason: string;
      /** v1 SHOWS the command; it never executes it (read-only surface). */
      readonly remedy?: { readonly cliEquivalent: string };
    };

interface DevToolsPanelContext {
  readonly zone: DevToolsZone;
  readonly pluginId: string;
  readonly signal: AbortSignal;
  /** Zone-scoped, host-fetched typed data (entity zones); full shape owned by *Data plane*. */
  readonly data?: unknown;
}

/**
 * Closed, host-rendered element vocabulary mapped onto @netscript/fresh-ui components.
 * Grows only by host release. THIS — not plugin renderers — is the visual extension seam.
 */
type DevToolsUiNode =
  | { readonly kind: 'stack'; readonly direction?: 'row' | 'column'; readonly children: readonly DevToolsUiNode[] }
  | { readonly kind: 'text'; readonly text: string; readonly tone?: 'default' | 'muted' | 'danger' }
  | { readonly kind: 'keyValue'; readonly entries: readonly { readonly key: string; readonly value: string }[] }
  | { readonly kind: 'table'; readonly columns: readonly string[]; readonly rows: readonly (readonly string[])[] }
  | { readonly kind: 'badge'; readonly text: string; readonly tone: 'ok' | 'warn' | 'error' }
  | { readonly kind: 'link'; readonly link: DevToolsLink; readonly label: string };
```

**Host behavior.** A registry keyed by zone — registry-over-switch, per AP-24 (`09-…md:165`);
per-zone `(order, id)` sort; a per-zone per-plugin volume cap (Grafana's `limitPerPlugin`, `m2` F15);
every panel rendered inside a per-contribution error boundary (`m2` F23 — note **TanStack has no
boundary anywhere on its mount path**, `m2` F11).

**Failure behavior — a deliberate departure from all prior art.** Every surveyed system fails
quietly (`m3` X-2); Grafana logs loudly and renders `null` in production (`m2` F23). NetScript
inverts the polarity because **the developer is the audience**: a throwing `render` or `availability`
produces a *visible error card in that panel's slot* (contribution id, message, stack), logged
through the host's logger — never `console.log`, which is AP-13 with two live debt entries — and
never crashes the shell or a neighboring panel. A silently missing panel is a debugging trap. Per
`m3` X-2's own instruction, this departure is argued rather than assumed.

**Acceptance discipline (process, not payload).** Every merged first-party panel issue must record
its NetScript-only answer to *"why can't this just deep-link to Aspire/Scalar?"* — #400 acceptance
line 1 (`b1` F3), promoted here from prose to a normative merge condition. This is the per-kind form
of the charter's no-speculative-union bar.

#### `link` — typed external deep-link

```ts
/**
 * Aspire grammar verified from fetched dashboard .razor sources (m4 F6-F11); Scalar anchor
 * grammar from its docs (m4). NOT expressible BY DESIGN: filtered Aspire views — `?filters=`
 * is an opaque internal serialization (m4 F11).
 */
type DevToolsLink =
  | { readonly target: 'aspire.resource'; readonly resource: string }        // /?resource={n}
  | { readonly target: 'aspire.consoleLogs'; readonly resource: string }     // /consolelogs/resource/{n}
  | {
      readonly target: 'aspire.structuredLogs';                              // the journey→logs jump
      readonly resource?: string;
      readonly traceId?: string;
      readonly spanId?: string;
      readonly logLevel?: 'error' | 'warn' | 'info' | 'debug' | 'trace';
    }
  | { readonly target: 'aspire.trace'; readonly traceId: string; readonly spanId?: string }
  | { readonly target: 'aspire.metric'; readonly resource: string; readonly meter: string; readonly instrument: string }
  | { readonly target: 'scalar.operation'; readonly tag: string; readonly method: string; readonly path: string }
  | { readonly target: 'scalar.model'; readonly slug: string }
  | { readonly target: 'external'; readonly href: string };

interface DevToolsLinkContribution extends DevToolsContributionBase {
  readonly zone: DevToolsZone | readonly [DevToolsZone, ...DevToolsZone[]];
  /** Static, or derived from zone context (e.g. an execution row's traceId). */
  readonly link: DevToolsLink | ((ctx: DevToolsPanelContext) => DevToolsLink | undefined);
}
```

**Host behavior.** A pure, IO-free URL-builder module — the helper that exists nowhere today
(`research.md` F7) — resolves Aspire links against the discovered dashboard base URL
(`Dashboard:Frontend:PublicUrl` when obtainable, else the four-arm endpoint policy `r5` F22; **never**
a hardcoded `localhost:18888`, `m4` F17-F18) and Scalar links against the service's mounted
`/api/docs` (`r5` F26). The same builder serves `netscript dashboard open|url` (#424) — one grammar,
two callers, mirroring #400 acceptance line 2. `inference`: making the builder pure and IO-free
mirrors the proven shape of `@netscript/mcp/openapi-projection` (`r5` F21).

**Failure behavior.** An unresolvable base URL renders the affordance **disabled with the reason**
("dashboard not running") rather than 404-ing the developer. A malformed registration is dropped from
the list with a loud dev-mode error (empty-list degrade, `m2` F18). A callback-form `link` returning
`undefined` renders nothing for that row — the typed "this row has no trace" case.

`unverified` — `scalar.operation` depends on which `tags` `@orpc/openapi` emits for a NetScript
router; the anchor is unstable until that is known (`research.md` open question 8). See owner fork 3.

#### `diagnostic` — reuse, not a new kind

No payload type is minted. The contract **is** the existing `plugin doctor` `extraChecks` contract:
checks are dynamically imported from the plugin and run under a read-only `dryRun: true` context
(`r4` F2). What this RFC adds:

- **Host behavior.** The `plugin.detail` zone renders each plugin's doctor rows mapped to the
  five-state diagnosis taxonomy; the CLI prints the same rows from the same generator. A throwing
  check becomes an `error` row, never a shell crash.
- **A named follow-up slice (not v1-blocking).** Widen `cli.doctorChecks` from the closed literal
  `readonly 'auth-backend'[]` (`r3` F2) so third-party plugins can contribute checks without the
  six-framework-file edit (`r4` F11). That literal is the sharpest shipped proof that the current
  axis model is closed to third parties (`research.md` F18).

### Read-only by default

**v1 contributes nothing that mutates state.** No `action` kind, no command invocation, no launcher
that launches. Panels read; links navigate; diagnostics run an already-shipped read-only check under
`dryRun: true`. This is a decision with four cited reasons, not an omission:

1. **The mutation routes do not exist.** #554/#555/#556 are unbuilt, and runtime-config is read+watch
   only (`b1` F7/D6).
2. **Auth cannot be propagated.** `createServiceClient` cannot send `Authorization` or `x-api-key`
   even though `@netscript/service/auth` accepts both, so a mutating call would have to bypass the
   SDK — which is exactly the duplication the charter forbids (`research.md` F15).
3. **A devtools channel becomes privileged fast.** TanStack's dev-server plugin accepts an
   `install-devtools` event *from the panel* and installs an npm package on the developer's machine,
   gated only on "dev server only", with no per-plugin permission concept (`m2` F10;
   `research.md` F25).
4. **A live write primitive already exists nearby.** `resolveTarget` accepts absolute and
   escaping-relative targets with no containment assertion — inert while every contributor is
   first-party, an arbitrary-write primitive the moment a third party contributes a registry item
   (`r2` D3/F10/F11; `research.md` F19). And per drift **D-7**, the runtime-registry generator
   subprocess is spawned with **valueless** `--allow-read`/`--allow-write`, which in Deno grants
   **whole-filesystem** read and write, not project-root scope
   (`packages/cli/src/public/features/generate/plugins/installed-runtime-registry-generator.ts:416-417`).
   Mitigating and equally verified: no `--allow-net`/`--allow-env` in the same argument list.

**What would change the posture.** The read-only default is lifted for a specific kind only when all
of the following hold, and the RFC states them as an entry criterion rather than an aspiration:

| Condition | Proven by |
| --- | --- |
| A mutation contract route exists to call | #554/#555/#556 merged with routes on `main` |
| The SDK can carry auth to it | RFC-A chain reaches #1352 (`research.md` F15) |
| The action's trust design exists | *Trust model* section's invariants, including a scoped generator spawn (D-7) and `resolveTarget` containment (F19) |
| Every action renders its `cliEquivalent` and routes through the same scaffolder the terminal uses | #400 acceptance line 2 (`b1` F3) |

Until then the honest form of a mutation in DevTools is the `unavailable`/`remedy.cliEquivalent`
card: the surface **shows the command and does not run it**.

`unverified` — this RFC asserts no isolation, sandboxing, or production-safety property for any kind.
Three upstream assumptions the market study falsified are recorded as live risks, not as inherited
guarantees: devtools are *not* automatically stripped in production; **iframe ≠ sandboxed** (Nuxt
injects live app access into same-origin contributed iframes); and `transformIndexHtml` injection
**silently no-ops** for apps that render their own HTML — which Fresh 2 does (`m1` D3/D4, F9-F14;
`research.md` F21). Because of the last one, no kind in this section depends on HTML injection. Two
*independent* production-exclusion mechanisms are required before any DevTools surface is built for a
non-dev target, because TanStack explicitly distrusted a single signal (`m2` F6-F7;
`research.md` F24); the gate that would prove exclusion is named in *Trust model*, not claimed here.

### Why `ai-tool` is rejected

The unratified 7-member union included an `ai-tool` kind — a plugin contributing a tool an in-product
agent could call. It is rejected on evidence, not taste.

- **The agent surface already exists and is better.** `@netscript/mcp` ships 22 tools with typed
  **input and output** schemas and a `ToolKind` read/mutate/meta classification (`r5` F17-F18). A
  second, DevTools-side tool axis would duplicate it with weaker typing and no classification.
- **The closest analogue reversed course.** **Aspire removed its in-dashboard Copilot UI in 13.3 and
  redirected agents to the CLI and its MCP server** (`m4` F15; `research.md` F26). The trajectory is
  explicit: the dashboard is a fixed human viewer; agent integration is an external API.
- **The boundary is already ratified elsewhere.** #1446 P-6's decision sentence — *"production
  operator management and developer diagnostics are two distinct hosts and two distinct contribution
  surfaces — not one ambiguous 'cockpit'"* (`research.md` F3) — is the same partition applied one
  axis over: **DevTools is the human surface; MCP is the agent surface.**

One caveat stated honestly: MCP is **newline-delimited stdio only** (`runNewlineStdio`), so a browser
client cannot reach it today (`research.md` F5). That constrains *how* DevTools consumes MCP-adjacent
data — resolved in *Data plane* — but it is not an argument for minting a DevTools-owned tool kind.

### Staged and rejected, with entry criteria

**Rejected** — would require a consumer that does not exist, or duplicates an owned surface:

| Kind | Reason |
| --- | --- |
| `nav` | Derivable from the zone vocabulary plus panel registrations; with routes staged it has no referent. Union filler (AP-3, `09-…md:46`) |
| `visualizer` | Flow/S13 visuals are the host-owned flagship (#418); #400's killed-surfaces list exists so waterfall and log-tail renderers cannot creep back (`b1` F3). The seam is the host's `DevToolsUiNode` vocabulary |
| `setup`/`onboarding` | The diagnostic reuse answers "is it set up"; a second surface duplicates `plugin install` + doctor with weaker authority |
| `ai-tool` | MCP is the agent surface; Aspire's 13.3 Copilot removal is the precedent (`research.md` F26) |

**Staged** — real shape, blocked on a named prerequisite:

| Kind | Entry criterion |
| --- | --- |
| `action` | The four-row table in *Read-only by default* is fully satisfied |
| `route` (plugin-contributed pages) | #890's spine lands **or** the DevTools host ships its own mount/registry slice (owner fork 1). Until then every page is host-owned |
| island / client-code panel tier | Same blocker as `route`, plus the Preact-singleton constraint (`r1` F16) and the trust-tier decision #890 parked "in the dashboard epic" (`p1` F10) |
| `home` zone id | A first-party home-card issue is actually filed; a one-line vocabulary addition thereafter |
| `exposedComponent` (plugin↔plugin) | **Explicitly deferred**, per `m2` OQ8's requirement that deferral be stated. Adopt only when one plugin genuinely consumes another's UI; then take singleton-key + first-registration-wins verbatim (`m2` F22) |

Any manifest-visible pointer for any of these carries a hard precondition recorded as drift **D-6**:
`PluginInstallerManifestSchema` ends in **`.strict()`** and pins `schemaVersion: z.literal(1)`
(`packages/plugin/src/protocol/manifest.ts:271,282`), so an older CLI does **not** ignore a new
top-level block — it fails manifest parsing outright and takes the whole plugin down. #890's contract
C8 claims the opposite; this RFC does not inherit that claim. A schema-evolution slice
(`.passthrough()`/`catchall` with a compatibility test, or a `schemaVersion` bump with a documented
migration) sequences **before** any pointer lands. Packaging is decided in *Contribution family*.

### Open owner forks

1. **Ratify the read-only v1.** No `action` kind until #554/#555/#556 and #1352. Is a read-only first
   DevTools release acceptable, or must one gated mutation (trigger enable/disable is the cheapest)
   pull the action kind forward together with its co-requisites?
2. **Ratify two kinds plus one reuse as the v1 minimum** — specifically that `diagnostic` reuses the
   doctor seam rather than minting a DevTools-side kind, and that opening the closed
   `cli.doctorChecks` literal is a named follow-up slice rather than v1 scope.
3. **Ship `link` Aspire-only if OQ-8 stays open?** `scalar.operation` anchors are unstable until the
   `tags` emitted by `@orpc/openapi` are known (`research.md` open question 8).
4. **Confirm the zone vocabulary is host-owned and closed** (Medusa's real model), and confirm the
   initial six zones listed in `DevToolsZone`.
5. **Choose the `json-render` ceiling policy.** When a first-party panel outgrows `DevToolsUiNode`:
   (a) grow the vocabulary by host release, or (b) accelerate the staged island tier. This RFC
   recommends (a); `m1` OQ7 notes even Vite's own ceiling is undocumented.
6. **`CR-DDX-HOSTAGNOSTIC` is live and unanswered.** Recorded on #400 by the owner
   (`2026-07-06T12:30:28Z`, arriving from epic #510) asking for a host-neutral panel descriptor with a
   host-provided `setup()` context; no later comment accepts or declines it (drift **D-8**). The
   contracts above are host-neutral in payload but assume a NetScript-provided `DevToolsPanelContext`
   — the owner must accept, decline, or amend the change request. The same thread records a cross-epic
   `CommandInvokePort` **first-definer** acknowledgement, which binds whoever unstages `action`.
