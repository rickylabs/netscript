# Stage-C synthesis notes (supervisor working file)

Written incrementally by the Tier-A supervisor while reading the **full** stage-B corpus, so the
analysis is durable independent of session context. `research.md` § Findings is derived from this
file at stage C close.

Corpus read status: `r1` ✓ · `r2` ✓ · `r3` ✓ · `r5` ✓ · `p1` ✓ · `p2` ✓ · `r4` ☐ · `p3` ☐ ·
`b1` ☐ · `b2` ☐ · `m1` ☐ · `m2` ☐ · `m3` ☐ · `m4` ☐

---

## The five facts that reshape the charter's framing

These are load-bearing enough that the RFC's whole shape depends on them. Each is cited to the
corpus file, which in turn cites `path:line`.

### S-1 — There is **no plugin→UI channel of any kind** at this baseline

Not a weak one. None.

- `capabilities.hasRoutes` on the plugin manifest means **service HTTP endpoints**, not frontend
  routes — its own doc comment says so, and its only consumers are install/scaffold/doctor paths
  (`r1` F9 → `packages/plugin/src/protocol/manifest.ts:20-21`, `:176`).
- No generated registry `kind` emits routes, pages, or islands; every one is a runtime handler
  registry (`r1` F10 → `plugins/workers/scaffold.runtime.json:24-55`).
- The **actual** mechanism by which first-party plugin client code reaches the app today is three
  **hardcoded Vite aliases** in the scaffold template (`@plugins/{workers,sagas,triggers}/streams`)
  plus a manual import. Adding a plugin adds no alias (`r1` F11 →
  `vite.config.ts.template:20-32`).
- `rtk grep -rn "devtools|_devtools|DevTools"` across `packages`, `plugins`, `docs/site` → **zero
  matches** (`r1` F14).

**Consequence.** The RFC is not extending an extension point. It is defining the first one. Every
"reuse the existing X" instinct must be checked against this.

### S-2 — RFC #890's envelope is **merged design text with zero implementation**

`gh pr view 890 --json files` → 32 files: `.github/labels.yml` plus the whole
`.llm/runs/plan-frontend-contrib--seed/` record. **No `packages/`, `plugins/`, `apps/`, or `docs/`
source line** (`p1` F1). Corroborated by absence at baseline: no `packages/plugin-frontend-core`, no
`withFrontend` (0 grep hits), no `defineFrontend`/`FrontendManifestEnvelope`/`frontend.registry`
(0 files), no `frontend` entry in `CONTRIBUTION_AXES`, no `.tsx` anywhere under `plugins/`.

All **24 children (#923–#946) and epic #922 are OPEN**, all still `status:plan`, milestone `0.0.9`
(`p1` F4). Not even the five *disposable* Wave-0 proofs (S1–S5) have run — and the epic itself
declares those a sequencing law before any public contract freezes (`p1` F5).

**Consequence — and this is the single largest plan-defect risk in the run.** The charter says
"Preserve its versioned envelope/generated registry pattern." That phrasing invites a reading in
which DevTools *reuses a shipped surface*. It does not exist. A DevTools RFC that assumes the
envelope, registry emitter, mount glue, gateway, `PluginZone`, or doctor taxonomy exists is **wrong
at this baseline**. The honest framing is a **co-dependency on unbuilt work**, and Q1/Q2 must decide
explicitly between (a) depending on #890's spine landing first, or (b) specifying a self-contained
DevTools family. This is a genuine owner fork, not a technicality.

What *is* reusable is the **pattern**, which `p1` F14 splits carefully into ten payload-agnostic
mechanisms (envelope + family/major handshake + identity quartet + `HostSurfaceDescriptor` +
transactional replace-set + ordering/collision policy + five-state diagnosis taxonomy + pointer-thin
core axis + budgets + server/client context split) versus nine app-family-specific payloads that
must **not** be copied (the five kinds, the concrete zone ids, the `base` mount policy, the T0 trust
posture, the gateway's concrete prefix, theme contribution, the Fresh-runtime helpers, the
`surfaces` filter idea, and `design/examples/dashboard.md`'s union model).

### S-3 — #1446 hands DevTools a **precise, quotable mandate** — and a boundary

P-6 is a verbatim row in RFC-0001's staged-decisions table (`p2` F1 → RFC:638). It names DevTools
"a distinct surface this RFC must not design (§8.2 surface 2)" and gives:

- **Four contracts to consume**: management oRPC (§8.1), audit/history stores (§5.2, §7),
  convergence surface (§5.3), OTel vocabulary (§7) (`p2` F2 → RFC:519-522).
- **A decision sentence, not a preference** (`p2` F3 → RFC:491-493): *"production operator
  management and developer diagnostics are two distinct hosts and two distinct contribution
  surfaces — not one ambiguous 'cockpit.'"* Slice A7 deliberately excludes diagnostics and journey
  views so as not to pre-empt DevTools (RFC:522-524).
- **A reciprocal obligation**: DevTools must not annex Surface-1 territory either. This answers
  charter Q4 directly and with authority.
- **An entry criterion**: after A2b (management contract), A3b (history), A2d (convergence) land.

**Key resolution for the run:** `p2` F11 argues, from §11's own title ("prerequisite RFCs, not faked
certainty", RFC:629) and the row calling P-6 a "DevTools **RFC**", that the entry criterion gates
when DevTools *implementation* may begin — **not** when the DevTools RFC may be written. That is the
reading this run proceeds under; it is recorded as an owner-visible assumption, not smuggled in.

#1446 also **explicitly declares epic #400 and its record (#685, #780, #506) to be "evidence, not
ratified architecture"** and requires the DevTools RFC to re-evaluate rather than inherit it
(RFC:516-519). The charter's instruction and #1446's mandate agree.

### S-4 — The RFC home is contested, and it is an owner fork

- RFC-0001 asserts *"This RFC establishes `docs/architecture/rfc/` as the in-repo RFC home"*
  (RFC:9) and takes `rfc-0001-`.
- That directory **does not exist on `main` at `2256a67bf`** — `git ls-tree -r --name-only
  2256a67bf -- docs/architecture/rfc` returns empty (`p2` F12).
- Meanwhile `rfcs/` **does** exist on `main`, with `0000-template.md` and a `README.md` describing
  the process (`b2` topic; also `p1` D-8).
- Nothing in the repo — no docs index, no `DOCS-STRUCTURE.md` entry, no docs-site route — references
  `docs/architecture/rfc` outside `.llm/` files. There is **no numbering registry**; number
  reservation is convention-by-filename only.

**Consequence.** Two RFC conventions exist, one shipped (`rfcs/`) and one claimed by an unmerged PR
(`docs/architecture/rfc/`). The charter directs `docs/architecture/rfc/`. This run follows the
charter and takes **`rfc-0002-`**, so the only overlap with PR #1446 is creation of the directory
itself, which git merges without conflict. But the collision is real and is escalated as a numbered
owner fork rather than silently resolved.

### S-5 — DevTools has a **ready-made data plane** it must consume, not rebuild

This is the most encouraging finding in the corpus and directly serves charter Q5/Q6.

- **`TelemetryQueryPort`** already exists and is published as `@netscript/telemetry/query`: seven
  methods (`queryTraces`, `getTrace`, `querySpans`, `queryLogs`, `queryMetrics`, `queryResources`,
  `exportTraces`), Standard-Schema-validated filters, backed by an adapter over Aspire's
  `/api/telemetry/*` (`r5` F10-11).
- **MCP exposes 22 stable v1 tools** with declared JSON **input *and* output** schemas keyed
  exhaustively by `ToolName`, a `ToolKind = 'read' | 'mutate' | 'meta'` safety classification, and a
  discriminated `ToolSuccess | ToolFailure` with stable machine-readable error codes (`r5` F17-18).
  That is a ready-made typed contract for a DevTools panel — **but the transport is
  newline-delimited stdio only** (`r5` F23), so a browser client cannot speak to it directly. This
  is a real, specific design constraint for Q6.
- **`@netscript/mcp/openapi-projection`** is a pure, IO-free entrypoint (`indexOpenApiOperations`,
  `resolveCanonicalOperation`, `describeOpenApiOperation`, `projectOperationSchemaViews`) — directly
  reusable by a DevTools API explorer without running MCP at all (`r5` F21).
- **Correlation floor is a single attribute**, `netscript.correlation.id`, with span naming
  contractually `<domain>.<operation>` across 15 declared `netscript.*` domains (`r5` F12-14). This
  is the join key for a job → saga → trigger → stream journey view.
- **No Aspire deep-link helper and no Scalar deep-link helper exist in any published package**
  (`r5` F8-9). `dashboardUrl` *is* present in `aspire describe --format Json` output and in detached
  `aspire start` metadata — but it is read **only by e2e-gate code**, and the one URL that ships to
  users (in a scaffolded example route) is a **bare origin, not a deep link** (`r5` F7).

**Consequence.** The charter's Q5 ownership thesis ("deep-link instead of cloning upstream UIs") is
sound *in principle* but has an unverified precondition: **whether the Aspire dashboard exposes a
stable deep-link URL grammar at all** is an open question (`r5` OQ1). A capability we cannot
deep-link to is a design constraint, not a detail — the RFC must state per-capability whether a
deep-link is actually possible, and `m4` is the topic that answers it.

---

## The security finding the RFC must carry

**Arbitrary write outside the project root, the moment a third party can contribute a registry
item.** `resolveTarget` returns `isAbsolute(target) ? target : resolve(projectRoot, target)`
(`r2` D3 → `packages/cli/src/kernel/application/ui/registry.ts:283`). There is **no containment
assertion anywhere** in `installUiRegistryItems`. An item whose `target` is `/etc/x` or `../../x`
writes there.

With only a first-party manifest this is inert. It is the single most load-bearing security finding
for any contribution RFC, and it generalizes: **every contribution kind that names a filesystem
target needs a containment invariant with a test**, not a convention.

Related, from the same corpus file: `--registry-root` **replaces** the manifest wholesale rather
than merging, so there is no composition seam today; and collision behavior is silent last-wins at
**three** independent layers, with the resolution order *flipping* depending on whether `--force`
was passed (`r2` F11).

---

## What "reuse the existing extension model" actually buys (near nothing)

`r3` is unsparing about the contribution-axis model DevTools would nominally join:

- **Two disjoint manifests**, not one — a TS runtime `PluginManifest` with a `contributions` record,
  and a JSON `scaffold.plugin.json` installer manifest. They do not reference each other; a plugin
  declares its service twice.
- **Ten names in the axis enum, twelve keys on the interface.** `cli` and `doctor` have no axis
  name, and nothing enforces correspondence. The validator `isContributionAxis` has **no non-test
  caller**.
- **Most axes are dead data**: of twelve keys, only `services`, `runtimeConfigTopics` (as a presence
  bit), `doctor`, and `cli` are read by the CLI's registry normalizer.
- **Lifecycle hooks are declared, typed, stored — and invoked by nothing.**
- **`mergeContributions` silently drops `cli`**, so the two host paths disagree.
- **`cli.doctorChecks` is typed as the closed literal `'auth-backend'[]`** — a third party cannot
  contribute a doctor check without editing the framework package. This is the sharpest single
  proof that the current axis set is not open for extension.
- **Registry writes are not transactional**: per-target `Deno.writeTextFile`, no temp+rename; the
  host only asserts the file *exists* afterwards, never its content.
- **Duplicate plugin identity collapses silently** — `DuplicatePluginError` exists but is not on the
  live load path, which last-writer-wins on a lossy "local name" (`@a/plugin-ai` and `@b/plugin-ai`
  collide).
- **Declared scaffolder permissions are not enforced**: the generator subprocess is spawned with
  flat `--allow-read --allow-write` over the entire project root.

**Consequence.** #890's transactional staged→`deno check`→atomic-swap replace-set is not gold-plating
— it is the **fix** for a real, cited, shipped defect class. That materially strengthens the case for
adopting its registry mechanics, and it should be argued from this evidence rather than from
deference to #890.

---

## Host-composition facts that constrain Q1 and Q8

- `packages/fresh` is **not** an app host; it is a 15-subpath library. The host is the
  CLI-scaffolded app the user owns (`r1` F1).
- There **is** a real programmatic server-side seam: `defineFreshApp({ configure, fsRoutes, … })`
  with a fixed ordering `preConfigure → static → telemetry → middleware → query-cache route →
  configure → fsRoutes` (`r1` F2). #890 already identified the hazard that `configure()` runs
  **before** `fsRoutes`, so plugin mounting must not ride `configure` — and `p1` F6 **re-verified
  that ordering still holds at this baseline** (line anchors drifted; the fact did not).
- Routes are discovered by filesystem walk. `_*` and `(_*)` are **helper** conventions, so
  `routes/_devtools/` and `routes/(_devtools)/` would both be **invisible** to the manifest
  generator. A visible tree must mirror `routes/(design)/design/` (`r1` F4).
- **There is no Vite-contribution seam at all.** The plugin chain is static template text in the
  app's `vite.config.ts`; no plugin in the repo references `createNetScriptVitePlugin` (`r1` F6).
  This is decisive for charter surface #3 and Q8.
- The dev watcher's response to any route change is a **full page reload**, not an HMR patch — a
  DevTools panel holding client state is reset by any route edit (`r1` F7).
- Route-manifest generation **mutates app page modules by default** (`pageModuleRouteBinding`), at
  init, build, and watch. Any DevTools route tree under `routes/` inherits source rewriting
  (`r1` F8).
- **Preact/signals singleton discipline is a hard constraint**: `dedupe: ['preact',
  '@preact/signals']` plus specifier canonicalization in `resolveId`. A DevTools surface loaded from
  a different resolution root risks a second Preact copy and dead signals (`r1` F16).
- `/design` is the existing precedent: a real shipped route group (13 templates) with its own
  sidebar shell, seeded into the typed router — and with **no dev-only gating** found (`r1` F13,
  `r5` F30-31). Whether it ships to production users is an open question worth answering, because
  DevTools must not repeat the same omission.

---

## Running list of owner forks (accumulating; finalized at stage E)

1. **Depend on #890's unbuilt spine, or specify a self-contained DevTools family?** (S-2)
2. **RFC home**: `docs/architecture/rfc/` (charter + unmerged #1446) vs `rfcs/` (shipped on main). (S-4)
3. **Where does a family-neutral envelope live**, given `@netscript/plugin-frontend-core` is a poor
   home for a non-frontend family — and #890's fork F3 was never arbitrated. (`p1` OQ2)
4. **Mount policy**: #890's unarbitrated plugin-preferred base + host remap, vs forced
   `/__devtools/<mountId>` namespacing for a DevTools host. (`p1` OQ3)
5. **Trust tier**: DevTools cannot inherit #890's T0 unexamined if it is ever remote-exposed — and
   #890 explicitly parked T1/T2 iframe tiers in "the dashboard epic", i.e. handed them here.
   (`p1` F10, OQ4)
6. **May DevTools use the #934 deny-by-default procedure gateway?** #1446 scopes the sufficiency
   claim to Surface 1 "for this surface only" and is silent for Surface 2. Two generated data planes
   would be a duplication defect. (`p2` F6, OQ2; `p1` OQ5)
7. **Does P-6's entry criterion gate authoring or only implementation?** Proceeding under "implementation
   only", per RFC:629 — flagged for owner confirmation. (S-3)

---

# Addendum 1 — after `b1` (dashboard board) and `b2` (doctrine + live board)

Corpus read status updated: `r1` ✓ · `r2` ✓ · `r3` ✓ · `r5` ✓ · `p1` ✓ · `p2` ✓ · `b1` ✓ ·
`b2` ✓ · `r4` ☐ · `p3` ☐ · `m1` ☐ · `m2` ☐ · `m3` ☐ · `m4` ☐

## S-6 — The ownership thesis the charter told me to preserve **exists verbatim**, and it is good

Epic #400's body carries it (`b1` F3), and it is stronger than the charter's paraphrase because it
is already operationalized into **three enforceable acceptance lines**:

1. **Non-duplication** — no dashboard screen may render as an owned surface an OTLP trace
   waterfall/gantt, a log tail, a metrics chart, a resource start/stop panel, or an OpenAPI
   operation list/try-it. *"Every merged panel must pass **'why can't this just deep-link to
   Aspire/Scalar?'** with a NetScript-only answer recorded in its issue."*
2. **One generator, two callers** — every mutation invokes the same contract route / CLI scaffolder
   the terminal does and renders its CLI-equivalent line. No dashboard-only write paths.
3. **Flow ≠ waterfall** — S13 renders a primitive-grouped causal chain assembled from NetScript's
   own seam events. No span bars, no time-proportional gantt, no log tails — ever.

Plus a **"Killed / folded surfaces"** list kept explicitly *"so they don't creep back"*.

**This is the single most valuable inheritance from the old board**, and the RFC should adopt these
as normative acceptance criteria rather than restate the thesis as prose. Line 1's "record a
NetScript-only answer per panel" is exactly the discipline that stops charter Q3's speculative
union.

## S-7 — Authority on the dashboard board is unevenly distributed, and the RFC must say so

- **#685 is MERGED** — but what merged is *analysis and Claude-Design prompts*, self-labelled
  *"analysis only / no product code changed"*, and its label never advanced past `status:research`.
  Its files have **committed provenance**, not ratified authority. It posted 20 issue comments, so
  its analyses are **referenced from** the board without having **rewritten** it — #427 still
  describes a single panel member, not the 7-member family (`b1` F5).
- **#780 is an OPEN DRAFT with no labels and no milestone**, 158 files all under `.llm/runs/`, zero
  under `packages/`/`plugins/`/`docs/`, stale since 2026-07-14. Nothing in it is on `main` (`b1` F6).
- **#506 was CLOSED as superseded by #685** after its value (`tools/design-sync/`) was absorbed
  (`b1` F8).
- **The last owner-ratified board event is the 2026-07-06 rescope batch** — 32 mutations, verified
  live (`b1` F7).

**Consequence.** A supersession map that treats #685 as ratified architecture would be wrong. The
RFC must distinguish *committed evidence* from *ratified decision* per artifact. This nuance is the
difference between an honest map and a plausible one.

## S-8 — Three competing seams already claim the same contribution axis

This is the sharpest board finding and it directly serves Q10:

| Claimant | Where | Position |
| --- | --- | --- |
| **#427** (DDX-17) | `epic:dev-dashboard`, `0.0.15` | `DashboardPanelContribution` in `plugin-dashboard-core/contracts/v1`; **`@netscript/plugin` gains NO dashboard-coupled axis** (thinness law) |
| **#890 / #922** | merged RFC, `0.0.9` | Pointer axis `.withFrontend()` on `@netscript/plugin` + generated registry; re-labels #427 *"KEEP, re-baseline — the dashboard epic implements kinds + host, not pipeline"* |
| **#734** | `0.0.10`, **not labelled `epic:dev-dashboard`** | Proposes a dashboard-panel contribution axis **in the plugin manifest** — the very thing #427 forbids on thinness grounds |

Three positions, one seam. The RFC must pick one and fold the others, or a fourth will appear.

Related overlap: **#933 (`0.0.9`) and #944 (`0.0.11`) already file dashboard-zone panels under epic
#922** — a *different epic at earlier milestones* than #428–#431 (`0.0.15`). Two boards claim the
same subject (`b1` D7). And **`CR-DDX-HOSTAGNOSTIC`**, which #544 (process-manager) declares itself
gated on, appears in **no** #400 body text and in no ratified rescope artifact — a dangling
dependency (`b1` D8).

## S-9 — The archetype question has **two conflicting in-repo precedents**, and doctrine does not settle it

- **Dashboard precedent**: thin `plugins/dashboard` (**A5**) + fat `packages/plugin-dashboard-core`
  (**A2 integration**), modelled on `streams`/`plugin-streams-core`.
- **Frontend-contrib precedent (merged #890)**: `packages/plugin-frontend-core` at **A1 (small
  contract)**, host runtime as a **subpath of `@netscript/fresh`**, which that design labels **A3**.

They disagree. Worse, the second **contradicts the doctrine's own assignment table**, which lists
`fresh` as **A4 — DSL/Builder** (`b2` D3, `06-archetypes.md:376`). A3 vs A4 is not cosmetic: **A3
adds gate F-13** (`stop()` on every long-running runtime; `AbortSignal` on every async public IO
method). So mounting a DevTools host inside `@netscript/fresh` inherits an *unresolved archetype
label and an ambiguous gate set*.

The doctrine's own tiebreaker (`06-archetypes.md:348-367`, "pick the larger") makes this decidable
**only once the RFC states whether the host owns long-running supervised state** — which is exactly
charter Q1. So Q1 and Q11 are the same decision wearing two hats.

## S-10 — "The archetype gates apply" is **not self-executing**

`deno task arch:check` gates **16 hand-listed roots** out of **36 live units** (`deno.json:156`).
`fresh`, `fresh-ui`, `telemetry`, `cli`, `sdk`, `service` are all **ungated**. `arch:check:repo` has
been `DEBT_ACCEPTED` red since 2026-06-21 (`b2` F7).

**Consequence — a concrete, citable RFC deliverable:** adding `--root packages/<devtools-core>` and
`--root plugins/<devtools>` to `deno.json:156` must be **named as a slice**, or the RFC's gate claim
is decorative. This is precisely the charter's "do not claim … without executable gates".

Corollary from `b2` F3: the archetype gate matrix has **no row making browser validation required**
for a UI-serving A2/A3 host — it is `subtype` for A4 and `n/a` elsewhere. The browser gates come
from the **`SCOPE-frontend` overlay**, so the RFC must *name the overlay*, not the archetype column.

## S-11 — The doctrine names the exact anti-patterns this RFC is most likely to commit

From `b2` F5, ranked by structural likelihood — these should appear in the RFC as explicit
non-goals/guardrails, each with the gate that catches it:

1. **AP-21 flat command-surface folder** (>12 children in `routes/`/`presentation/`) — a
   panel-per-seam DevTools hits it immediately. Gate F-16.
2. **AP-3 god interface** — a single `DevToolsContribution` covering pages + panels + inspectors +
   actions + data sources + nav + deep-links **is exactly this shape**. Charter Q3 already warns.
3. **AP-9 premature abstraction** — "one envelope for both the admin console and DevTools" is the
   move Q4 explicitly separates.
4. **AP-24 switch-over-tagged-union instead of registry** — `switch (contribution.kind)` in the host
   renderer is the default wrong answer.
5. **AP-13 `console.log` in published code** — a diagnostics package is the most tempting violator;
   two live debt entries already exist for it.
6. **AP-11 hidden globals** / **AP-25 side effect in a non-edge file** / **AP-19 permissions assumed
   silently** (DevTools reads Aspire/OTLP over HTTP → F-9 README permission block is a gate).

And a decisive layout rule: **R-FOLD-LAYERING-MODE** says horizontal role layering is *wrong* for
"command-like surfaces … (CLI commands, HTTP routes, message handlers, **dashboard pages**)" —
doctrine explicitly names dashboard pages as the **vertical/feature-sliced** case
(`05-folder-structure.md:188-208`). The RFC's folder design must be vertical, and can cite doctrine
for it rather than argue it.

## S-12 — The RFC-home fork is bigger than two options, and an authoritative answer is already scheduled

`b2` F9 finds **three** live conventions, not two:

- **A. `rfcs/`** — the only *written* process (`rfcs/README.md`), template + README, **zero numbered
  RFCs ever merged**. Numbering assigned by a maintainer **at acceptance**, not by the author.
  Self-declares provisional and defers to a doctrine governance statement **that does not exist**
  (`b2` D6).
- **B. `.llm/runs/plan-*--seed/design/canonical/`** — what merged PRs #890/#891/#1123 actually did,
  and what `.github/labels.yml` descriptions cite as "RFC #890"/"RFC #1123".
- **C. `docs/architecture/rfc/`** — introduced by **unmerged** PR #1446; its author-assigned number
  at draft time diverges from `rfcs/README.md`'s assign-at-acceptance rule.

**And issue #1380 (open, milestone `0.0.6`) already carries an acceptance checkbox to resolve the
RFC-location divergence.** So a DevTools RFC that picks a location either **pre-empts #1380** or
must be re-homed later.

This materially upgrades owner fork #2: it is not "which directory looks nicer" but "do we pre-empt
a scheduled governance decision, and if so, deliberately?" The charter directs
`docs/architecture/rfc/`; this run follows the charter **and** records the pre-emption explicitly so
the owner can overrule it cheaply.

## S-13 — The SDK cannot carry a DevTools auth principal today

`b2` F10, from the Fable-5 roadmap's RFC-A: `CreateServiceClientOptions` is *"a closed nine-field
record with no `headers`, `fetch`, `interceptors`, `plugins`, `link`, or context type parameter"*;
`ServiceClientContext` is a closed interface, not a type parameter; `createHttpClientLink` is
package-private; and **`createServiceClient` cannot send `Authorization: Bearer …` or `x-api-key`**
even though `@netscript/service/auth` accepts both.

**Consequence.** Charter Q6/Q7 auth propagation is **blocked on RFC-A / issue #1348** (milestone
`0.0.6`) unless DevTools bypasses the SDK — and bypassing it would be exactly the "second SDK
extension mechanism" the charter forbids. This is a hard sequencing dependency and belongs in the
risk register with a named owner, not in prose.

Also constraining what DevTools can honestly show (`b2` F8): **`plugins/streams` has no oRPC
contract surface at all** and triggers implements ~3 of 10 business routes. A "contract provenance"
panel would have **nothing to read** for streams. Any IA that promises per-runtime contract coverage
must degrade explicitly — which is precisely why charter Q9 demands degraded/empty states.

## Owner-fork list — updated

Superseding the stage-1 list; renumbered and expanded at stage E.

1. **Depend on #890's unbuilt spine (`0.0.9`), or specify a self-contained DevTools family?** (S-2)
2. **RFC home** — now a three-way fork that **pre-empts scheduled issue #1380** on `0.0.6`. (S-12)
3. **Where does a family-neutral envelope live** — `plugin-frontend-core` is a poor home for a
   non-frontend family; #890's fork F3 was never arbitrated. (`p1` OQ2)
4. **Mount policy** — plugin-preferred base + host remap vs forced `/__devtools/<mountId>`. (`p1` OQ3)
5. **Trust tier** — #890 parked T1/T2 iframe tiers in "the dashboard epic", i.e. handed them here;
   T0 is not inheritable if DevTools is ever remote-exposed. (`p1` F10)
6. **May DevTools use the #934 gateway?** #1446 scopes sufficiency to Surface 1 only. (`p2` F6)
7. **Does P-6's entry criterion gate authoring or only implementation?** Proceeding under
   "implementation only". (S-3)
8. **Which archetype does the DevTools host take** — A2 (dashboard precedent) or A3 (if it owns
   supervised state)? And **is `@netscript/fresh` A3 or A4?** (S-9)
9. **Which milestone owns DevTools** — `0.0.14` (whose description claims it but holds zero
   dashboard issues) or `0.0.15` (where all 28 children sit)? (S-8, `b2` D5)
10. **Who owns dashboard-zone panels** — epic #400 (#428–#431) or epic #922 (#933/#944)? Two boards
    claim the subject at different milestones. (S-8)
11. **#734 — close, fold, or promote?** It is the third competing position on one seam. (S-8)
12. **Is `CR-DDX-HOSTAGNOSTIC` real?** #544 depends on it; it exists in no ratified artifact. (S-8)
13. **Does the DevTools data plane wait on RFC-A/#1348** for auth propagation? (S-13)

---

# Addendum 2 — after `p3` (SDK RFC-A) and `r4` (CLI plugin flows)

Corpus read status: `r1` ✓ `r2` ✓ `r3` ✓ `r4` ✓ `r5` ✓ `p1` ✓ `p2` ✓ `p3` ✓ `b1` ✓ `b2` ✓ ·
`m1` ☐ `m2` ☐ `m3` ☐ `m4` ☐

## S-14 — RFC-A does **not** close the loop DevTools needs. This is the run's sharpest data-plane fact

`p3` F8 traces it end to end: a plugin exports a contribution descriptor and declares it in its
manifest → discovery (#1093, *not* RFC-A) collects references → **a generator or the application
author writes a literal `defineServices({ … contributions: [...] as const })`** → **call sites pass
a composed context object per call**.

The chain therefore terminates at *a statically generated services map plus a caller-supplied
context object*. RFC-A explicitly rejects a runtime registry, a locator, a `useClient()`, and any
ambient/global client (`rfc:1501-1506`). It contains zero occurrences of "devtool".

**Consequence.** *"A plugin-contributed DevTools panel obtains a typed client for its own plugin's
service"* is **not** solved by #1390 and cannot be assumed. DevTools must define its own
**host → panel context contract** — and doing so is *not* a second SDK extension mechanism, because
RFC-A itself says "UI contributions and SDK request contributions are separate named extension axes,
not one universal envelope" (`rfc:1179-1187`). That sentence is the licence to define the host→panel
seam without violating the charter's don't-duplicate-#1390 boundary. It should be quoted in the RFC.

What DevTools may safely take from RFC-A **today**, before it merges, is its **vocabulary**:
`protocol { family, major }`, namespaced `id`, duplicate rejection, static module reference +
explicit selection — which RFC-A already declares shared with #928 (`rfc:1179-1187`). Depending on
the vocabulary carries shape risk ≈ 0; depending on the *symbol* carries high availability risk.

### Hard limits RFC-A imposes on what a DevTools panel may show

- **No response hook.** The descriptor patches request headers only (`SdkClientRequestPatch {
  headers }`). A network-inspector-style panel needs a *different* seam (`p3` F14).
- **Redaction is absolute**: header values, input, context, credentials and source error causes MUST
  NOT be recorded, and **debug mode does not relax this** (`rfc:1091-1110`).
- **Partitions are explicitly non-secret and "intentionally visible in query keys and developer
  tools"** (`rfc:1117-1119`) — a narrow, quotable green light for cache introspection.
- **HTTP-only.** Desktop MessagePort contributions are normatively rejected; a MessagePort seam
  "requires a separate RFC" (`rfc:983-998`). If any DevTools transport is in-process/MessagePort,
  RFC-A is structurally inapplicable and #451 is the relevant issue.

### Sequencing risk, quantified

FCP disposition **accept**, objection deadline **2026-08-15 22:00 Europe/Zurich** — i.e. **4 days
after this run's baseline date**. On expiry the maintainer assigns number 0001 and merges. But the
implementation chain is: FCP close → #1350 error repair → **an unfiled metadata child** (disposition
6) → #1351 stable oRPC v1.15.0 family move (disposition 8) → #1349 client seam → #1352 auth dogfood.
All on milestone `0.0.7`. **A DevTools deliverable needing a credential-bearing typed client cannot
ship before #1352.**

## S-15 — `plugin dev` does not exist

Charter Q8 asks the RFC to decide build/dev mechanics including "`plugin dev`". `r4` F6 establishes
by negative search that **there is no `plugin dev` / watch loop anywhere in the CLI**. The only
"watch" is a `--watch`/`--watch-hmr` *flag string* a kind provider emits into generated Aspire
registration. Regeneration is always explicit and command-triggered.

So Q8 is not "how does DevTools fit the dev loop" — it is "does DevTools require inventing one".
That is a materially different, and larger, question than the charter's phrasing implies.

## S-16 — There are **two divergent registry generators**, writing to different paths

`r4` F3 / D4 — architectural:

- **`generate plugins`** (and `plugin sync`, a thin alias) runs the *manifest-driven* generator:
  reads each installed package's `scaffold.runtime.json`, shells out to the **plugin's own**
  generator subprocess, then asserts the declared `registryPath` files exist.
- **`plugin update`** and **`plugin item-add`** run the *SDK walker* pipeline
  (`FilesystemWalker → AstExtractor → RegistryEmitter`) emitting
  `.netscript/generated/<axis>.registry.ts`.

A plugin's registry can therefore be written by **two mechanisms at two different paths**. Worse:
**`AstExtractor` is a regex over comment/string-stripped text, not an AST parse**, and recognizes
exactly three hardcoded builders (`defineJob`/`defineSaga`/`defineWebhook`). And the walker-emitted
axis registries are **not** cleaned by `plugin remove`, which only deletes
`.netscript/generated/<name>` and `plugin-<name>` (`r4` F10, OQ2).

**Consequence.** Charter Q8's "generated registry transactions" and Q5's "generated-surface drift"
both land on a substrate that is currently non-transactional, dual-pathed, regex-parsed, and leaks
artifacts on removal. The RFC must say which generator a DevTools family uses and must not assume
drift detection is currently reliable. This also independently reinforces S-2's conclusion that
#890's transactional staged→check→atomic-swap replace-set is a **fix**, not gold-plating.

## S-17 — Adding a contribution kind today costs six framework file edits

`r4` F11 enumerates the minimum set a contributor edits for a first-party new kind:
`kernel/adapters/plugin/kinds/<kind>.kind.ts` (new), `kinds/plugin-kind-providers.ts`,
`application/registries/plugin-kind-registry.ts`, `install/plugin-package-resolver.ts` (bare alias),
`plugin/sdk/discovery/ast-extractor.ts` (if a new axis), `list/list-plugins-command.ts` (axis
display). Only `api` is compiled in; every other kind is a **bare alias to a `@netscript/plugin-*`
JSR package**.

This is the concrete, citable cost of *not* having an open contribution model — useful motivation
prose for the RFC, and it pairs with `r3`'s `cli.doctorChecks: readonly 'auth-backend'[]` closed
literal as the second proof that the current axis set is closed to third parties.

`plugin doctor`'s existing check inventory (`r4` F2 — config load, AppHost inspection, manifest
resolution, per-plugin manifest, workdir, permissions, auth-backend, and dynamically-imported
plugin-contributed `extraChecks`) is the natural host for the RFC's five-state contribution
diagnosis taxonomy: **the extension point already exists and already runs contributed checks with a
read-only `dryRun: true` context.** That is a genuine reuse, not an aspiration.

## Owner forks — additions

14. **Does the DevTools host→panel data context become a new contract** (permitted by RFC-A's own
    "separate named extension axes" sentence), and if so does it wrap the SDK client or pass one in?
    (S-14)
15. **Does DevTools require inventing a `plugin dev` watch loop**, given none exists? (S-15)
16. **Which registry generator owns a DevTools family** — manifest-driven or walker — given the two
    write to different paths and only one is declared authoritative? (S-16)

---

# Addendum 3 — after `m1` (Nuxt / Vite DevTools) and `m4` (Aspire / Scalar boundary)

Corpus read status: `r1`–`r5` ✓ `p1`–`p3` ✓ `b1` `b2` ✓ `m1` ✓ `m4` ✓ · `m2` ☐ `m3` ☐

## S-18 — The closest analogue **deleted its own shell**. That is the market study's headline

Nuxt DevTools v4 removed the floating panel entirely. Nuxt DevTools is now a **dock entry nested
under a `Nuxt` group inside the Vite DevTools panel**, and every Nuxt-specific contribution
primitive — `addCustomTab()`, `extendServerRpc()`, `startSubprocess()`, `refreshCustomTabs()`,
direct `nuxt.devtools.rpc` — is soft-deprecated with coded diagnostics `NDT_DEP_0003`–`NDT_DEP_0007`
in favour of the generic Vite DevTools hosts (`m1` F1, D1). `vite-plugin-inspect` made the same move
at v12: its standalone `/__inspect/` route disappeared and it became a panel inside Vite DevTools
(`m1` F25).

Nuxt built five bespoke things — a shell, an RPC namespace mechanism, a subprocess/terminal system,
a VS Code integration, and a global-install mode — and **deprecated or deleted all five**.

**This is the cheapest lesson available to this RFC**, and it cuts both ways:

- It is a strong argument *against* NetScript building a bespoke devtools shell…
- …except that the thing Nuxt consolidated onto is **Vite-8-bound**, and **NetScript pins Vite
  7.2.2** (`deno.json:248`, `packages/fresh/deno.json:56`) while Vite DevTools, `@nuxt/devtools` v4
  and `vite-plugin-inspect` v12 all require **Vite 8** (`m1` F28, D2).

So "just adopt `@vitejs/devtools-kit`" is **not buildable at this baseline**. The honest synthesis is:
**imitate the contract shapes, implement natively on Deno/Fresh** — and treat a Vite-8 migration as a
named prerequisite if the kit itself is ever to be adopted. `m1`'s applicability verdict already
splits this cleanly into transfers (setup-hook seam, dock descriptor as serializable data, named
prefixed RPC with four function kinds, handle-based update, launcher tier, `json-render`
zero-client-code tier, `invokeLocal`, `WeakMap`-keyed plugin state) versus does-not-transfer
(the kit as a dependency, `transformIndexHtml` injection, Node process primitives, Iconify, the fat
`ServerFunctions` god-interface, build-mode devtools output).

### Three market facts that overturn common assumptions

- **"Devtools are stripped in production" is false upstream.** Vite DevTools *re-targets* to a
  static dump: RPC results are pre-computed at build time into `__rpc-dump/*.json`, `build.withApp`
  writes devtools output into the app build dir — and **build mode disables client auth by
  construction** (`DTK0008`). NetScript should be **stricter than upstream** here, not equal (`m1`
  D4, F10, F11).
- **"iframe ⇒ sandboxed" is false.** Nuxt deliberately injects `__NUXT_DEVTOOLS__` into same-origin
  contributed iframes, giving them live access to the running app's Vue instance; no `sandbox`
  attribute is documented, only an `allow` permission allowlist. Vite DevTools additionally offers
  `custom-render`, which explicitly *skips* iframe isolation (`m1` D3, F13, F14).
- **`transformIndexHtml` injection silently no-ops** for backend-integration / middleware-mode /
  JS-entry apps. **Fresh 2 renders its own HTML**, so NetScript almost certainly lands in exactly
  that documented failure bucket — meaning mounting must be a NetScript-owned route/middleware, not
  an HTML-transform hook (`m1` F9, and its open question 6, which is flagged as the single most
  decision-relevant unknown and must be closed before the claim is asserted as fact).

## S-19 — The Aspire/Scalar boundary is now **evidence-backed**, with real URL grammars

`m4` fetched the actual Aspire dashboard `.razor` sources and Scalar's configuration docs, so Q5
stops being a thesis and becomes a table.

**Deep-linking into Aspire is real and cheap** for the cases that matter:

| Target | Link |
| --- | --- |
| Resource detail | `/?resource={name}` |
| Console logs | `/consolelogs/resource/{name}` |
| Structured logs, correlated | `/structuredlogs/resource/{name}?traceId=&spanId=&logLevel=` |
| Trace / span detail | `/traces/detail/{traceId}?spanId={id}` |
| Metric instrument | `/metrics/resource/{r}/meter/{m}/instrument/{i}?duration=` |

The log↔trace correlation query (`?traceId&spanId&logLevel&logEntryId`) is **the single most
valuable link for a "journey → logs" jump** and it exists.

**What is NOT deep-linkable:** a *filtered* log/trace view — `?filters=` is an opaque internal
serialization (`m4` F11, verified negatively: the formatter file 404s). A DevTools design must use
the typed route/query parameters and must not promise filter round-tripping.

**Aspire has no page/panel/plugin extension point at all.** Its UI configuration is purely
*subtractive* (`DisableResourceGraph`, `DisableImport`, `DisableAgentHelp`). The only additive
contribution is **custom resource commands** — and those are **local-dashboard-only, explicitly
unavailable when deployed** (`m4` F13-15). So `withCommand` is a *mirror*, never the home, for a
framework action.

**Precedent worth quoting:** Aspire **removed its in-dashboard Copilot UI in 13.3** and redirected
agents to the CLI/MCP server (`m4` F15). The trajectory is *dashboard = fixed human viewer;
agent/tool integration = external API*. That is a direct precedent for NetScript DevTools = human UI
and MCP = agent surface — and it pairs with `r5`'s finding that MCP is stdio-only.

**Two hard constraints for embedding:** the dashboard frontend defaults to `BrowserToken` auth
(there *is* a sanctioned automation path — `{PublicUrl}/login?t={token}` — explicitly provided "so
tooling can automate logging in"), and links must be built from **`Dashboard:Frontend:PublicUrl`**,
never a hardcoded `localhost:18888` (`m4` F12, F17-18).

**Scalar**: the anchor grammar is rich and documented (`#tag/{tag}/{method}{path}`, `#model/{slug}`,
`#webhook/{slug}`, `#description/{heading}`) — but NetScript **throws nearly all of Scalar away**:
`ScalarDocsOptions` is three fields (`specUrl`, `title?`, `theme?` narrowed to 5 of Scalar's 12
themes), and the vendored bundle is pinned at `@scalar/api-reference@1.44.15`, which **predates
`pluginUrls`** — so any "contribute into Scalar" thesis is blocked until the bundle is bumped
(`m4` F25, F30-33, D3). Also a concrete offline defect: the "no CDN dependency" comment is true of
the JS but **not the fonts**, which default to `https://fonts.scalar.com` (`m4` D2).

And the load-bearing gap: **no deep-link helper exists anywhere in `packages/`** for either
upstream, despite both URL grammars being stable and documented (`m4` D5, corroborating `r5` F8-9).
The hand-off thesis has **no implementation seam today** — which makes "a typed deep-link helper" an
obvious, small, high-value first slice.

## Owner forks — additions

17. **Vite 8 prerequisite?** Does the RFC scope a Vite-8 migration so `@vitejs/devtools-kit` becomes
    adoptable, or commit to a NetScript-native surface that merely imitates its contract shapes?
    (S-18)
18. **Production posture** — upstream ships devtools into production builds with auth disabled.
    Confirm NetScript's stricter "absent from production by default" stance, and decide whether a
    static/offline dump mode is ever wanted. (S-18)
19. **MCP as the agent surface, DevTools as the human surface** — adopt Aspire's 13.3 precedent
    explicitly? Bears on whether DevTools needs its own agent affordances at all. (S-19)
20. **Scalar bundle bump** — is "contribute into Scalar" in scope at all, given `1.44.15` predates
    `pluginUrls`? Recommend rejecting it and deep-linking instead. (S-19)
