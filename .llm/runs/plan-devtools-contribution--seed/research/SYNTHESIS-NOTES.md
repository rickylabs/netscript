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
