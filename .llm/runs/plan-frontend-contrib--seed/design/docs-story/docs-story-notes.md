# Docs-story notes — what writing the docs exposed

Internal working notes from the stage-3 docs pass. Files 1–4 in this directory were written
as-if-shipped, per the stage brief: proof-gated mechanisms appear without caveats, and every place
the design made the docs awkward is recorded here instead of being patched around. Each note has a
concrete suggestion. The generator integrates these next; nothing here changes the rev-2 contracts
on its own.

## Pending proofs the docs assert as shipped

Per the brief, these are documented without the proof caveat in the guide and references. If a
proof fails, the corresponding public statements need revisiting — they are quoted so the fallback
doc edit is findable.

| Proof | What the docs assert as fact | Where |
| --- | --- | --- |
| **P1** (mounted-app ordering) | The composition phase order "static files → host middleware → host fs routes/layouts → `mountPluginFrontends`" and per-plugin "middleware first, then routes"; child `App`-level commands "stripped and reported". | `reference-fresh-plugins.md` (`defineFreshApp`, `mountPluginFrontends`); `guide` Troubleshooting. |
| **P2** (literal loaders + normalizer) | `normalizeFreshRouteModule` maps `default`/`handler(s)`/`config`/`css` and throws a structured error on unknown members; generated loaders are literal specifiers. | `reference-fresh-plugins.md` (`normalizeFreshRouteModule`); `reference-plugin-frontend-core.md` (`RouteContribution`, `ComponentRef`). |
| **P3** (dependency islands matrix) | Islands register by specifier on both build paths; published mode "takes a signaled full reload rather than HMR"; `plugin dev` owns the signal; the testing kit covers "local-source and JSR-installed" modes. | `guide` (Dev loop, `./testing` row); `reference-plugin-frontend-core.md` (`IslandContribution`, `./testing`). |
| **P4** (SSR containment fixtures) | The containment contract as documented: data-phase guard → quarantine card; client boundary for islands; route-level `onError`; SSR render throw fails the page. | `guide` Troubleshooting; `reference-fresh-plugins.md` (`PluginZone`). |
| **P5** (gateway threat model) | The gateway posture list: principal-port auth, no blind credential forwarding, origin/CSRF checks, size limits, timeouts, abort propagation, manual redirects, header allowlist, per-invocation audit line, streaming only where metadata declares it. | `guide` Data access; `reference-fresh-plugins.md` (generated gateway). |

## K-notes

**K-1 — The worked examples still speak rev 1.** `design/examples/dashboard.md` and
`design/examples/ai.md` declare `contract: 'v1'`, `plugin: 'workers'`, and plain-string nav labels
(`nav: { label: 'Workers', … }`) — shapes rev 2 replaced with `contract: { family, major }`,
`pluginKind`, and `MessageRef` labels. Writing the quickstart meant choosing which voice was
normative; the answer was only knowable from `02-authoring-dx.md`.
**Suggestion:** re-run both examples through the rev-2 envelope before owner ratification. Docs
forecasting catches exactly this class of drift; the examples are what Wave-1 implementers will
copy.

**K-2 — `pluginApi`'s argument is stated two ways.** `02-authoring-dx.md` shows
`pluginApi(props.client)`; `examples/dashboard.md`'s zone comment says "polls via
`pluginApi('workers')`". One takes the client context, the other a plugin id — they cannot both be
the signature.
**Suggestion:** lock `pluginApi(client: PluginClientContext): string` (the client context is what
an island legitimately holds; a raw plugin id would invite hand-typed strings). Fix the dashboard
example comment.

**K-3 — The `frontend` option's input is shown two ways.** `00-overview.md`'s diagram reads
`frontend: fromGenerated(registry)`; `04-host-runtime.md` reads `frontend: frontendRegistry`. The
reference documented the latter (simpler, one less symbol).
**Suggestion:** pick the bare-registry form and delete `fromGenerated` from the overview diagram —
or, if the wrapper exists to adapt the generated module's shape, say what it adapts and why the
option can't take the registry directly.

**K-4 — `ctx.redirect` appears in an example but not in the contract.** `examples/auth.md` writes
`if (!ctx.host.principal) return ctx.redirect('/auth/signin')`. `01-contracts.md` describes the
page ctx as Fresh `PageProps` + injected state; `04 §5` says `definePluginPage` is "typed over
Fresh PageProps with the injected state". Redirect is the first thing every auth-adjacent page
needs; the reference could not pin it down.
**Suggestion:** either add a typed `redirect` helper to the `definePluginPage` context in
`01-contracts.md`, or rewrite the auth example with the sugar-free idiom. Do not let the first
auth page authors write depend on an uncontracted field.

**K-5 — Standalone nav contributions have no declared authoring path.** The keyed `defineFrontend`
form shows `routes`, `islands`, `zones`, `theme` — never a top-level `nav` array — yet
`NavContribution` is a first-class kind (an external docs link, an href to a host page). And
`NavSpec` (the inline route shorthand) shows `label`/`icon`/`group` but never says whether `order`
is supported.
**Suggestion:** pin the keyed form: either add `nav?: readonly NavContribution[]` or state that
standalone nav is declared only inside the envelope (not the keyed form). Pin `NavSpec` as
`{ label: MessageRef; icon?: string; group?: string; order?: number }` or document the omission of
`order` as deliberate.

**K-6 — `theme` is the odd key out.** The keyed form is `routes`/`islands`/`zones` (plurals) plus
`theme` (singular) holding an array. Every author will write `themes:` once and get a schema
error.
**Suggestion:** rename the keyed field to `themes` for symmetry, or make `theme` singular in fact
(one `ThemeContribution` per plugin, multiple CSS files inside it) — the second reads better and
matches the "overlays" mental model.

**K-7 — `contract: { family: 'app', major: 1 }` is boilerplate every author restates.** Until a
second family exists, this line is copied verbatim into every `frontend/mod.ts` with no decision
attached. Fields authors copy without thinking are fields they stop seeing.
**Suggestion:** default `contract` to `{ family: 'app', major: 1 }` inside `defineFrontend`,
keeping the field overridable for multi-family plugins. The handshake stays explicit in the
*compiled envelope*; it stops being noise in the *authoring form*.

**K-8 — `MessageRef` is two objects deep for the most common case.** `nav: { label: { id:
'crons.nav.calendar', default: 'Cron calendar' } }` is the right shape for localization and the
wrong shape for momentum: the examples already drifted to plain strings (K-1), which predicts
author behavior.
**Suggestion:** accept a string shorthand in the keyed form that compiles to a `MessageRef` with a
derived id (`<pluginKind>.nav.<routeId>`), with the object form always available. Otherwise expect
every third-party manifest to carry `default: ''` placeholders.

**K-9 — The `./testing` kit has no importable name.** `05 §5` and `06` specify the kit's coverage
thoroughly but name no entrypoint, so the reference page documents behavior without a single
runnable snippet — the weakest section in file 2, and reviewers will notice.
**Suggestion:** name the entrypoint in the contracts (e.g. `defineFrontendTestSuite(manifest,
options)` or a generated `frontend_test.ts` fixture the plugin's `deno test` picks up) before
Wave 2, and give the budgets block a manifest location and shape.

**K-10 — `.withFrontend()` restates what `mod.ts` already says.** The pointer carries
`contract: [{ family: 'app', major: 1 }]`; the envelope in `frontend/mod.ts` carries the same
triple. Two sources of truth drift (bump the family in one, forget the other) and the failure
surfaces as a cryptic handshake quarantine.
**Suggestion:** derive the pointer's `contract` from the module at generate time (the manifest
stays a pure pointer), or have `plugin doctor`'s frontend check flag the drift explicitly with
both values printed.

**K-11 — One route parameter, two syntaxes.** The manifest says `path: '/schedules/:id'`; the file
is `routes/schedules/[id].tsx`. Both are "Fresh syntax" in their own domain, but they sit one line
apart in the declaration and every author will momentarily wonder which one wins.
**Suggestion:** add a generate-time cross-check that the module path and the route pattern name
the same parameters (the machinery already cross-checks export-map presence), and one sentence in
the guide: the manifest uses Fresh *pattern* syntax, the filename uses Fresh *fs-routes* syntax.

**K-12 — Island `id` has no stated job.** Routes need ids for nav targets and typed refs; zones
need them for `data-ns-contribution` and ordering; islands register by module specifier on both
build paths, so the id's effect is undocumented — the reference says "unique within (plugin,
family)" and nothing more.
**Suggestion:** state the purpose in `01-contracts.md` (registry identity, duplicate rejection,
doctor diagnostics, budget attribution) or drop the field from `IslandContribution`. An id that
does nothing is a field authors cargo-cult.

**K-13 — The gateway's base path is nowhere pinned.** The docs need to tell authors what URL
`pluginApi` returns. The evidence is circumstantial: `reservedPaths` lists `'/api/plugins'`, the
identity model says the "gateway prefix" derives from `mountId`. The reference wrote
around it ("derived from the client context's `mountId`") because no contract line pins
`/api/plugins/<mountId>/…`.
**Suggestion:** pin the gateway prefix shape in `01-contracts.md` next to `FrontendIdentity` —
three moving parts (`pluginApi`, `reservedPaths`, the generated route table) silently depend on
the same string.

**K-14 — `ComponentRef` covers CSS files.** `ThemeContribution.css` is typed `readonly
ComponentRef[]`, but a stylesheet is not a component; the reference had to describe the alias
twice ("module specifier" for components, "also CSS") and the name actively misleads in the theme
section.
**Suggestion:** rename the alias to `ModuleRef` (or `AssetRef`) in the contracts — it already
means "package-relative module specifier" everywhere it is used.

**K-15 — Three types the docs needed are unnamed in the contracts.** The reference invented
presentation names: `FrontendDefinition` (the keyed `defineFrontend` input — only the compiled
envelope is named in `01-contracts.md`), `PluginPageProps` (the `definePluginPage` ctx — "typed
over Fresh PageProps with the injected state" names no type), and `FrontendContributionRegistry`
(the generated registry's type, whose owning module — `fresh/plugins` vs `plugin-frontend-core` —
is unpinned; `mountPluginFrontends` and `pluginNavSections` both take it).
**Suggestion:** export real names for all three. Docs and error messages both need them; "the
keyed form" is prose, not an API.

**K-16 — Multi-family export mechanics are unspecified.** `01 §envelope` says the `./frontend`
export "is one envelope (or an array of envelopes, one per family)", but `defineFrontend`'s return
and the array form are both unshown: does the author call `defineFrontend` once per family and
export an array, or is there a variadic/array input?
**Suggestion:** pin one: `export default [defineFrontend(appDef), defineFrontend(dashboardDef)]`
reads naturally and needs no new API — but say it in the contracts, because the dashboard family
is the announced second consumer.

**K-17 — "Quarantine" carries three user-visible meanings.** The design's diagnosis taxonomy
(unknown zone / known-but-unmounted / capacity-rejected / window-mismatch quarantine / load-failure
quarantine) is well separated internally, but an author staring at a gray card sees one word. The
guide needed a comparison table to make the states legible; that is a smell that the *product*
surface (doctor output, quarantine card copy) must carry the same precision.
**Suggestion:** make the doctor's frontend check print the taxonomy verbatim (the guide's table
can then quote it), and have the quarantine card deep-link the doctor command. Cheap, and it turns
a support question into a self-serve loop.

## Process note for the generator

Files 1–4 are public-clean: no run, PR, harness, proof, or model references; the `[P#]` gates
appear only above. If any K-note is accepted as a contract change, the corresponding doc file
needs the matching edit in the same pass — the guide's quickstart (K-6, K-7, K-8), both references
(K-2, K-5, K-13, K-14, K-15), and the CLI README fragment (K-17) are the touch points.
