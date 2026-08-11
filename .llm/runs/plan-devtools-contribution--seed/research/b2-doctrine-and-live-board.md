# board:doctrine — doctrine, debt, and the live board the DevTools RFC must fit into

Stage-B discovery corpus for the NetScript DevTools Contribution Architecture RFC
(run `plan-devtools-contribution--seed`, draft PR #1450).

**Baseline.** `origin/main` = `2256a67bf` (`git log --oneline -1 origin/main`), confirmed an
ancestor of this worktree's HEAD `89c539584` (`git merge-base --is-ancestor origin/main HEAD`).
Note: the *local* `main` ref in this worktree is stale at `f663fe0e4` — use `origin/main` for any
baseline claim. All repo path:line citations below are read at HEAD in
`/home/codex/repos/ns-rfc-devtools-contribution`, which for every cited file is identical to
`origin/main` (the run has touched only `.llm/runs/plan-devtools-contribution--seed/**` and
`.llm/harness/**` stage-A/B artifacts).

---

## Summary

The doctrine (`docs/architecture/doctrine/`, 12 files) is a constitution with seven archetypes, 14
axioms, 25 anti-patterns and 19 fitness gates. For a DevTools **host** the doctrine's own
decision order (`06-archetypes.md:348-367`) does **not** produce a single clean answer, and the
closest in-repo precedent — the ratified dashboard proposal — split the surface into a *fat*
`packages/plugin-dashboard-core` at **Archetype 2 (Integration)** plus a *thin* `plugins/dashboard`
at **Archetype 5 (Plugin)**, explicitly modelled on `streams`/`plugin-streams-core` rather than
`workers` (`.llm/runs/plan-roadmap-expansion--seed/design/A-dashboard/proposal.md:9-12,50-108`).
The later, merged frontend-contribution design chose a *different* split for the generic
contribution layer: a new `packages/plugin-frontend-core` at **Archetype 1 (Small Contract)** with
the host runtime added as a subpath of the existing `@netscript/fresh` (Archetype 3)
(`.llm/runs/plan-frontend-contrib--seed/design/canonical/06-doctrine-fit.md:5-15`). Those two
precedents disagree about where a DevTools host would sit, and the RFC must reconcile them
explicitly rather than inherit either silently.

The doctrine's own **verdict page** (`10-codebase-verdict-and-handoff.md`) is measurably stale:
open issue #1380 (milestone `0.0.6`) establishes that its 29-row table names five packages that no
longer exist and omits 14 that do, and that the repo-wide gate `deno task arch:check:repo` has been
`DEBT_ACCEPTED` red since 2026-06-21. `deno task arch:check` gates only **16 hand-listed roots**
(`deno.json:156`) out of 36 live units — `fresh`, `fresh-ui`, `telemetry`, `cli`, `sdk`, `service`
are all ungated. A new DevTools package therefore does *not* automatically inherit a mechanical
doctrine gate; the RFC must name adding it to `deno.json:156` as an explicit deliverable, or the
"gates apply" claim is decorative.

Nothing in the doctrine **blocks** adding a new package now: `10-…:184-195` ("Stop conditions")
states the doctrine binds *new* code immediately and existing code through the migration roadmap,
and permits violation only when recorded in `arch-debt.md` with a time-bounded plan. The binding
constraint on DevTools is therefore forward-looking (new code must be clean from slice one), not a
freeze.

There is a genuine, unresolved **RFC home collision** with three live conventions, not two:
root `rfcs/` (documented process, template + README only, **zero** merged numbered RFCs);
`.llm/runs/plan-*--seed/design/canonical/` run bundles (what merged PRs #890/#891/#1123 actually
did, and what label descriptions cite as "RFC #890" / "RFC #1123"); and `docs/architecture/rfc/`
(introduced by *unmerged* PR #1446 as `rfc-0001-runtime-versioned-automation.md`). Issue #1380
already names resolving this as required work. This is an owner fork — this corpus lays out the
options and does not choose.

On the live board: milestones `0.0.6`–`0.0.15` are open. The two that plausibly own DevTools work
are **`0.0.14`** ("Dev dashboard (thin, contribution-based) + auth/deploy tail") and **`0.0.15`**
(where all 28 open `epic:dev-dashboard` children currently sit); the prerequisite frontend
contribution layer is **`0.0.9`** (epic #922, 19 slices #923–#941). Epic #400 itself is parked in
`Backlog / Triage`.

---

## Findings

### F1 — Archetype mapping for a DevTools **host** package is contested, with two conflicting in-repo precedents

The doctrine's decision order (`docs/architecture/doctrine/06-archetypes.md:348-367`) asks, in
order: types only → A1; wraps exactly one external system → A2; owns long-running behavior with
state → A3; primary product is a fluent DSL → A4; first-party plugin → A5; ships a binary → A6;
multi-target deploy → A7. "If two archetypes apply … pick the *larger* archetype. Layers from the
smaller one fold into the larger one." (`:363-366`).

Two prior first-party designs answered differently for a DevTools-shaped host:

- **Dashboard proposal (ratified prior art, `epic:dev-dashboard` #400).** "thin `plugins/dashboard`
  (ARCHETYPE-5) + fat `packages/plugin-dashboard-core` (ARCHETYPE-2 integration core), modeled on
  the `streams` / `plugin-streams-core` analog, not `workers`. The dashboard is a **read /
  aggregation / UI-serving** surface — no background processor, no owned DB schema at beta.6."
  (`.llm/runs/plan-roadmap-expansion--seed/design/A-dashboard/proposal.md:9-12`). The core's shape
  is spelled out at `:77-95` (`domain/ ports/ application/ adapters/ contracts/v1/` — the canonical
  A2 skeleton), the thin plugin at `:96-108`.
- **Frontend contribution layer (merged PR #890, epic #922).** `packages/plugin-frontend-core` is
  **ARCHETYPE-1 (small contract)**, `packages/plugin` stays A4, and the *host runtime* is a new
  `./plugins` subpath on the existing `packages/fresh`, which that table labels **ARCHETYPE-3
  (runtime behavior)** — `.llm/runs/plan-frontend-contrib--seed/design/canonical/06-doctrine-fit.md:5-15`.

Note the second precedent contradicts the doctrine's own assignment table, which lists `fresh` as
**Archetype 4 — DSL/Builder** (`06-archetypes.md:376`). That is a live drift (see D3).

**Archetype definitions, quoted:**

- A2 Integration — "For packages that wrap an external system behind a small port and provide one
  or more adapters." (`06-archetypes.md:41-43`); "The *port* belongs to the package, not the
  adapter." (`:69`); "A package with one adapter and no foreseeable second adapter does *not*
  introduce a port; just expose the class. (Premature port = Wet Codebase failure…)" (`:74-77`).
- A3 Runtime/Behavior — "For packages that own long-running behavior with state, lifecycle, and
  supervised execution." (`:78-80`); "`AbortSignal` is plumbed through every async path."
  (`:115`); "Crash boundaries are explicit; a supervisor decides restart vs. escalate." (`:116-117`).
- A4 DSL/Builder — "For packages whose primary product is a fluent builder API." (`:119-120`);
  "`defineX()` is the only entry" (`:149`); "The materialized definition is a frozen plain object."
  (`:150`).
- A1 Small Contract — "For packages that publish *types and small invariants* and almost no
  runtime." (`:13-15`); "No base classes. No DI. No adapters." (`:35`).

**Inference (marked as such):** a DevTools host that (a) *reads* Aspire/OTel/introspection data
through package-owned ports with more than one adapter, (b) serves a Fresh UI, and (c) does **not**
own a background processor or DB schema, maps most cleanly to **A2 + folded A4 surface**, i.e. the
dashboard precedent. If the host instead owns a long-lived registry with lifecycle, live
subscriptions, and supervised streaming connections, A9's "pick the larger" pushes it to **A3**.
This is a decision the RFC must make on the basis of the host's actual runtime ownership, not by
analogy. Evidence this is inferred FROM: `06-archetypes.md:41-118,348-367`;
`A-dashboard/proposal.md:9-12,50-108`; `06-doctrine-fit.md:5-15`.

*Relevance:* Q1 (host shape), Q11 (packages/archetypes).

### F2 — Archetype mapping for a DevTools **plugin** (a plugin that contributes DevTools surface) is unambiguous: Archetype 5, governed by the thinness law

"For first-party plugin packages under `plugins/*`." (`06-archetypes.md:157-159`). The **thinness
law** at `:161-174`: "Convention-bearing primitives — contracts, base services, schema/runtime
conventions, and event/kind vocabularies — live in the sibling `@netscript/plugin-<kind>-core`
package. A first-party `plugins/*` package is **thin userland glue**… it does not redefine
contracts or re-implement a core convention." Doctrine bullets at `:200-214`: the plugin
re-exports contracts from its `-core` sibling; convention-bearing logic is imported never
re-implemented; a `verify-plugin.ts` runs the plugin-owned validation gate; "The plugin's `mod.ts`
is small."

The authoritative **folder shape** is top-level contribution folders as siblings of `src/`
(`:176-198`) — but see D1: the doctrine text and the observed layout are in recorded conflict.

*Relevance:* Q1, Q2 (contribution envelope), Q3 (contribution kinds), Q11.

### F3 — Fitness gates each archetype implies (the mechanical bar the RFC must budget for)

`.llm/harness/gates/archetype-gate-matrix.md:17-38` is "the source of truth for required gates per
archetype". Required for **every** archetype under consideration (A1/A2/A3/A4/A5): F-1 (file size),
F-5 (public surface audit), F-6 (JSR publishability), F-7 (doc score), F-8 (workspace `lib`), F-10
(test shape), F-11 (forbidden folder), F-12 (naming), F-14 (console-log), F-15 (upstream re-export),
F-16 (folder cardinality), F-17 (abstract-derived co-location), F-18 (sub-barrel), F-19 (scoped
gate runners).

Archetype-differentiated rows that matter here:

| Gate | A1 | A2 | A3 | A4 | A5 |
| --- | --- | --- | --- | --- | --- |
| F-2 helper-reinvention | n/a | required | required | required | n/a |
| F-3 layering | n/a | required | required | required | required |
| F-4 inheritance audit | n/a | required | required | required | n/a |
| F-9 permission declaration | n/a | required | required | required | required |
| F-13 saga/runtime invariants | n/a | n/a | required | n/a | subtype |

(`archetype-gate-matrix.md:19-38`.) So choosing **A3** for the host adds F-13 — "Every long-running
runtime exposes a `stop()` method. Every async public method whose body performs IO accepts an
`AbortSignal`." (`09-anti-patterns-and-fitness-functions.md:283-288`). Choosing **A1** for a
contracts package drops F-2/F-3/F-4/F-9 entirely.

Non-fitness gate families (`archetype-gate-matrix.md:65-72`): **Browser validation** is `subtype`
for A4 and `n/a` for A1/A2/A3/A5 — i.e. the matrix has **no row that makes browser validation
required for a UI-serving A2/A3 host**. The `SCOPE-frontend` overlay supplies it instead:
"Browser validation — Use Playwright or browser tooling for changed workflows",
"Loading/empty/error states — Verify each affected state, not only happy path", "Responsive check"
(`.llm/harness/archetypes/SCOPE-frontend.md:24-30`). The RFC must therefore *name the overlay*, not
rely on the archetype column, for its browser gates.

*Relevance:* Q7 (security/trust — F-9 permission declaration), Q9 (IA states — SCOPE-frontend
states row), Q11 (gates), Q8 (build/dev mechanics).

### F4 — Layering rules a new frontend host package must obey

`docs/architecture/doctrine/05-folder-structure.md:33-59` ("Layering rules"), operationalized:

- `domain/` imports nothing from elsewhere in the package (`:47`).
- `ports/` may import from `domain/` only (`:48`).
- `application/` may import `domain/` and `ports/`. **Never** from `adapters/` (`:49`).
- `adapters/` import `domain/` and `ports/` and may import external clients; they do **not** import
  `application/` (`:50-52`).
- `runtime/`, `middleware/`, `presets/`, `registry/`, `diagnostics/` follow the `application/` rule
  (`:53`).
- `presentation/` may import `application/` and `domain/`. **Never** directly from `adapters/`
  (`:54`).
- `testing/` imports the package's own surface and in-memory adapters; never tech-specific adapters
  (`:55-56`).

Role vocabulary is fixed at `:12-32`; `registry/` = "Plugin / handler registration tables, with
explicit duplicate-name guards" (`:25`), `diagnostics/` = "Error normalization, structured incident
records, evidence capture utilities" (`:26`), `presentation/` = "CLI / HTTP / RPC surface that maps
external input to application requests. Thin." (`:27`).

**Cardinality (R-FOLD-CARD, `:167-181`):** ≤ 12 immediate children per directory under `src/`;
≤ 4 levels of nesting from `src/`. **Layering mode (R-FOLD-LAYERING-MODE, `:188-208`):** horizontal
role layering is correct for shared kernels; it is *wrong* for "command-like surfaces — folders that
hold many sibling user-facing entry points (CLI commands, HTTP routes, message handlers, **dashboard
pages**)" — those use vertical/feature layering (`:194-201`). A DevTools host with many panels is
explicitly the case the doctrine names for vertical slicing.

**What a new frontend host package may depend on.** The doctrine does not publish a package-level
dependency-direction table; the binding rules are:
- A7 "Web Platform and `@std/*` first" (`01-thesis-and-axioms.md:58`), restated as doctrine at
  `06-archetypes.md:307-309` ("wrap upstream, do not reinvent").
- AP-4 "Cross-package implementation inheritance … Forbidden. Use registration against an extension
  axis instead." (`09-…:54-57`), with the mechanism spelled out at
  `07-composition-and-extension.md:114-141` — "Consumers of a `packages/*` package extend it by
  _registering_, not by _subclassing_."
- AP-14 "Re-exporting upstream packages … Consumers import Zod. We do not become a vendor for
  upstream surface." (`09-…:104-106`), gated by F-15 (`09-…:296-298`).
- The observed first-party pattern is that the contracts package must not depend on the UI layer:
  "`plugin-frontend-core` depends on neither `fresh` nor `fresh-ui`."
  (`06-doctrine-fit.md:22-23`).

**Extension-axis discipline (A11).** `07-composition-and-extension.md:82-113` requires, per axis:
a typed identifier, a factory, and a registration mechanism if the axis is open to consumers. The
published axis table at `:90-104` already contains a row **"Frontend framework | fresh (today),
future expansion"** — DevTools contribution kinds would be new rows, and each needs those three
elements named. `R-COMP-EXT-MANIFEST` (`:254-289`): "A package with **two or more** extension axes
… exports a single `extension-points.ts` … at a documented path", and the audit rule at `:287-289`
— every `Registry` subclass is either in the manifest or explicitly declared internal. A DevTools
host with >1 contribution kind therefore owes an `extension-points.ts`.

*Relevance:* Q1, Q2, Q3, Q6 (data plane), Q9 (IA), Q11.

### F5 — Anti-patterns a DevTools host is most at risk of committing

Ranked by structural likelihood for this specific surface, each quoted from
`docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md`:

1. **AP-21 flat command-surface folder** (`:142-146`) — "A `presentation/`, `routes/`, or
   `handlers/` folder with more than 12 immediate children is a flat list with a path prefix."
   A panel-per-seam DevTools (the #400 IA has ≥ 10 panels: #415–#432) hits this immediately.
   Gate: F-16 (`:300-307`).
2. **AP-3 god interface** (`:50-53`) — "An interface with more than three or four methods that is
   'the contract for everything our adapter does.'" A single `DevToolsContribution` covering pages,
   panels, inspectors, actions, data sources, nav and deep-links is exactly this shape. Q3 already
   flags "a speculative union is a plan failure".
3. **AP-9 premature abstraction / Wet Codebase** (`:78-82`) — "Two callers with similar shapes
   deduped behind one helper that grows flags as a third caller diverges." Applies to any
   "one contribution envelope for both the production admin console and developer DevTools" move —
   which Q4 explicitly separates.
4. **AP-24 switch-over-tagged-union instead of registry** (`:165-179`) — "Every new variant requires
   editing the switch. Replace with a typed registry … populated at composition." A
   `switch (contribution.kind)` in the host renderer is the default wrong answer.
5. **AP-13 `console.log` in published code** (`:99-101`) — "`console.*` is reserved for the CLI's
   presentation layer or for `examples/` scripts." A diagnostics/DevTools package is the most
   tempting place to violate this; gate F-14 (`:290-292`). Two live debt entries already exist for
   exactly this pattern (`arch-debt.md:709-723` streams-core, `:743+` watchers).
6. **AP-11 hidden globals** (`:87-90`) — "Module-load-time `Deno.openKv()`, `new Logger()`, or
   `process.env`-reading singletons. Composition root only." A host registry populated at module
   load is the classic DevTools shortcut.
7. **AP-25 side effect in non-edge file** (`:186-194`) — enumerates `Deno.env`, `Deno.readDir`,
   `fetch`, `Date.now`, `setTimeout` outside edge files. A live-refresh polling loop written inline
   in a panel module violates this.
8. **AP-19 permissions assumed silently** (`:136-139`) — "A package that calls `fetch` without
   declaring its network requirement". DevTools reads Aspire/OTLP over HTTP; F-9 makes the README
   "Required permissions" block a gate (`:262-265`).
9. **AP-22 useless re-export barrel** (`:148-155`) / F-18 (`:320-329`) — a per-panel `mod.ts` tree.
10. **AP-1 monolithic file** (`:18-39`) / F-1 (`:200-206`, "Flags files over 500 LOC; fails over
    800") — the historical failure mode of every host in this repo (`cli/pipeline.ts` 1,869;
    `fresh/builders/mod.ts` 1,110).

*Relevance:* Q2, Q3, Q9, Q11.

### F6 — Current doctrine VERDICT and its headline action; does it constrain adding a new package?

`docs/architecture/doctrine/10-codebase-verdict-and-handoff.md:22-51` is the per-package verdict
table. Rows relevant to DevTools:

| Package | Archetype | LOC | Verdict | Headline action | Line |
| --- | --- | --- | --- | --- | --- |
| `@netscript/fresh` | 4 | 11,658 | **Restructure** | "Split `builders/mod.ts` (1,110) per builder concern; subpath exports." | `:39` |
| `@netscript/fresh-ui` | 4 | 2,911 | Keep | "Confirm runtime registry shape." | `:40` |
| `@netscript/telemetry` | 2 | 4,634 | Refactor | "Confirm port + adapter split; OTEL adapter as subpath export." | `:34` |
| `@netscript/aspire` | 2 | 1,859 | Keep | "Rename `helpers/` to role-named folders." | `:27` |
| `@netscript/plugin` | 4 | 1,951 | **Restructure** | "Split `types.ts` (1,005); introduce `domain/` + `ports/`." | `:44` |
| `@netscript/cli` | 6 | 38,436 | **Restructure** | "Split `pipeline.ts` (1,869)… Apply Archetype-6 layout." | `:45` |
| `@netscript/service` | 4 | 1,633 | Refactor | "`presets/` named, `assets/` clarified." | `:42` |

The **top-priority remediation list** (`:60-73`) is, in order: `@netscript/cli`,
`@netscript/workers`, `@netscript/shared`, `@netscript/plugin`, `@netscript/fresh`. "These five
touch every doctrine concern… Doing them first creates the templates the rest of the repo follows."
(`:75-77`). Three of the five are already RESOLVED-as-superseded or closed in the debt registry
(`arch-debt.md:554-568` workers, `:587-598` fresh builders, `:656-668` plugin types) — the *page*
has not been updated.

**Does it constrain adding a new package right now? No — but with conditions.** The page's own
"Stop conditions" (`:184-195`):

> "The doctrine is *not* permission to halt feature work and restructure everything. The doctrine
> binds *new* code immediately and *existing* code through the migration roadmap. A package may
> remain in violation as long as: the violation is recorded in `arch-debt.md`, a time-bounded plan
> exists, and new code added to that package does not deepen the violation."

Two operative consequences for DevTools:
1. A **new** DevTools package is bound to the doctrine from slice one — no grandfathering, no
   accepted debt at creation without a time-bounded entry.
2. Because `@netscript/fresh` and `@netscript/plugin` carry **Restructure** verdicts, any DevTools
   slice that *adds code into them* (e.g. a `@netscript/fresh/devtools` subpath) must not deepen
   the violation — the "same-package additive" path is the one with the doctrinal friction, and the
   RFC should say which package each seam lands in with that constraint stated.

The page's "Definition of done" (`:197-213`) requires "`deno task arch:check` passes for every
package without opt-outs" and "zero 'Restructure' or 'Rewrite' verdicts" — a bar the repo does not
meet, and which #1380 shows cannot currently be evaluated (see D2).

*Relevance:* Q1, Q10 (board reconciliation), Q11.

### F7 — `arch:check` gates only 16 of 36 live units; a new DevTools package is ungated unless explicitly added

`deno.json:156` defines `arch:check` as `deps:check` plus **16 hand-listed
`check-doctrine.ts --root <path>` invocations**: `packages/plugin-auth-core`, `packages/auth-workos`,
`packages/auth-better-auth`, `packages/auth-kv-oauth`, `plugins/auth`, `packages/plugin`,
`plugins/workers`, `plugins/sagas`, `plugins/triggers`, `plugins/streams`,
`packages/plugin-sagas-core`, `packages/plugin-triggers-core`, `packages/plugin-workers-core`,
`packages/plugin-ai-core`, `packages/ai`, `plugins/ai`.

Absent: `fresh`, `fresh-ui`, `telemetry`, `aspire`, `cli`, `sdk`, `service`, `contracts`, `config`,
`kv`, `queue`, `database`, `cron`, `logger`, `mcp`, `bench`, `watchers`, `runtime-config`,
`prisma-adapter-mysql`, `plugin-streams-core`. `arch:check:repo` (`deno.json:157`) is the
unrooted full scan.

The registry records this as accepted debt: "repo doctrine task — full historical scan remains red"
— "AS7 preserved that full scan as `deno task arch:check:repo` and made `deno task arch:check` run
the auth-owned surfaces so the final auth slice has a green mechanical gate without refactoring
out-of-scope packages… **Status:** open, DEBT_ACCEPTED." (`.llm/harness/debt/arch-debt.md:523-536`).

**Consequence for the RFC:** "the archetype gates apply" is not self-executing. Adding
`--root packages/<devtools-core>` and `--root plugins/<devtools>` to `deno.json:156` is a concrete,
citable deliverable the RFC should name, or the gate claim is unbacked.

*Relevance:* Q11, Q7 (executable-gate requirement).

### F8 — Open arch-debt entries relevant to fresh / fresh-ui / plugins / telemetry

All from `.llm/harness/debt/arch-debt.md`.

| ID / heading | Line | Status | Why it bears on DevTools |
| --- | --- | --- | --- |
| `packages/fresh — PAGEBUILDER-LEGACY-COMPAT-TREE` | `:1585-1600` | open, **DECISION_PENDING** | `PageBuilder` legacy compat tree sits beside successor `DefinePageBuilder` and is re-exported through the builders surface. "removing `PageBuilder` is a deliberate public API break". A DevTools host built on Fresh page builders must pick a side. |
| `packages/fresh — FORMPAGEPROPS-PLAYGROUND-MIGRATION` | `:1602-1614` | open, **DECISION_PENDING** | `FormPageProps` transitional type consumed by playground routes; sequencing tied to the entry above. |
| `packages/fresh — hosted example sandboxes missing` (`fresh-hosted-example-sandboxes`) | `:1326-1334` | open, DEBT_ACCEPTED | Docs promise hosted sandboxes that do not exist — relevant to any DevTools "try it" claim. |
| `packages/telemetry/src/instrumentation/{saga,worker,scheduler}.ts` (`telemetry-plugin-instrumentation-extraction`) | `:903-917` | open, DEBT_ACCEPTED (Foundation alpha only) | Domain-specific instrumentation still exported from `@netscript/telemetry/instrumentation` pending move to owning plugin subpaths. A DevTools telemetry read-model consumes this surface while it is mid-migration. |
| `plugins/triggers — connector SOUND convergence deferred` | `:424-448` | open | Triggers connector implements only ~3 of 10 business routes and is not oRPC-contract-bound; blocked on a `createPluginService` raw-route escape hatch. **Any DevTools panel promising a triggers contract surface inherits this hole.** |
| `plugins/streams — connector SOUND convergence deferred` | `:450-485` | open | Streams has **no** oRPC contract surface at all (`plugin-streams-core` exposes no `contracts/v1`); the connector is a transparent proxy. Same blocker as triggers. |
| `plugins/*/services — oRPC router-composition `any` + external-boundary casts` (`plugin-service-router-composition-any`) | `:1175+` | open | Cross-plugin typed-seam debt in exactly the surface DevTools would introspect. |
| `plugins/sagas/src/runtime — saga runtime folder cardinality` (`sagas-runtime-folder-cardinality`) | `:1116+` | open | Live F-16/AP-21 precedent — the cardinality cap is enforced in practice, not aspirationally. |
| `packages/cli/e2e — scaffold runtime registry and gate directory over cap` (`scaffold-runtime-a8-f16-1333`) | `:2224+` | open | Second live F-16 precedent. |
| `packages/mcp — MCP-A6-V2-SHAPE` | `:2069-2089` | open, DEBT_ACCEPTED | Precedent for "owner-brief-locked archetype shape deviates from the current harness profile", closed only when the package gains a real CLI surface. Directly analogous if DevTools locks a shape before its consumer exists. |
| `packages/plugin/src/sdk/discovery/ast-extractor.ts` (`PLG-WALKER-AST`) | `:695-707` | open | Registry generation is a **bounded regex extractor**, not a real AST resolver — DevTools "generated-surface drift" (Q5) depends on this precision. |
| `packages/plugin — ISSUE-167-STANDALONE-PLUGIN-PROTOCOL` | `:238-260` | open, DEBT_ACCEPTED | Protocol lives as a subpath of `@netscript/plugin`; extraction deferred. Bears on where a DevTools contribution contract should live. |
| `docs/architecture/doctrine/06-archetypes.md — Archetype 5 folder-shape reconciliation deferred` | `:2091-2115` | open, DEBT_ACCEPTED | See D1. |
| `repo doctrine task — full historical scan remains red` | `:523-536` | open, DEBT_ACCEPTED | See F7 / D2. |

*Relevance:* Q3, Q5 (ownership boundaries), Q6 (data plane), Q8, Q11, Q12.

### F9 — RFC home collision: three live conventions, none of them settled

**Convention A — root `rfcs/` (documented, unexercised).**
`git ls-tree -r main --name-only | grep '^rfcs/'` → exactly `rfcs/0000-template.md`,
`rfcs/README.md`. Zero numbered RFC files exist at `2256a67bf`.

`rfcs/README.md` states the process:
- When required (`:15-24`): public API / package export surface change; breaking or
  release-surface change; **"Changes plugin contracts, the plugin/service base seam, or the
  architecture doctrine under `docs/architecture/doctrine/`"**; cross-cutting across packages or
  **"introduces a new package/plugin archetype"**; establishes a new convention. A DevTools
  contribution RFC hits at least four of the five.
- Lifecycle (`:36-59`): `Draft → Discussion → FCP → Accepted → (tracking issue) → Implemented`.
  Draft = "Copy `0000-template.md` to `rfcs/0000-<short-slug>.md` (keep the `0000` until a number
  is assigned)… Open a PR that adds the file, and open the companion **RFC tracking issue**
  (`rfc:` form) labelled `rfc`."
- Numbering (`:61-64`): "RFC numbers are assigned by a maintainer **at acceptance** (next free
  integer), not by the author."
- Milestones/labels (`:66-72`): tracking issue goes on the targeted `0.0.x` milestone or
  `Backlog / Triage`; labels `rfc`, one `status:*`, `breaking` if applicable.
- **Self-flagged as provisional** (`:74-79`): "The formal, binding 'what requires an RFC' policy…
  is being reconciled with the architecture doctrine… if it ever conflicts with a ratified doctrine
  governance statement, doctrine wins and this file will be updated to match." No such doctrine
  governance statement exists under `docs/architecture/doctrine/` (12 files, listed at
  `ls docs/architecture/doctrine/`; none is a governance/RFC chapter).

The template `rfcs/0000-template.md:1-56` is a YAML-frontmatter + fixed-heading document
(`rfc`/`title`/`status`/`authors`/`created`/`tracking-issue`/`target-milestone`, then Summary,
Motivation, Guide-level, Reference-level, Drawbacks, Rationale/alternatives, Breaking changes,
Prior art, Unresolved questions, Future possibilities). Note `:29` explicitly asks for
"package/plugin placement, contracts and **doctrine archetype**".

The issue form `.github/ISSUE_TEMPLATE/rfc_proposal.yml:1-16` auto-applies `rfc` + `status:triage`,
prefixes the title `rfc: `, and instructs: "The RFC text itself goes in a PR that adds
`rfcs/NNNN-<slug>.md` using `rfcs/0000-template.md`."

**Convention B — `.llm/runs/plan-*--seed/design/canonical/` (what actually merged).**
PR #890 "RFC: Frontend Contribution Layer — plugins that ship UI" merged 2026-08-03
(`gh pr view 890`). Its non-`.llm/` file changes are exactly one file: `.github/labels.yml`
(`gh pr view 890 --json files`). The design record it shipped is
`.llm/runs/plan-frontend-contrib--seed/design/canonical/{00-overview,01-contracts,02-authoring-dx,03-discovery-and-registry,04-host-runtime,05-scaffolding-and-cli,06-doctrine-fit}.md`.
It added **no** `rfcs/` file. Issue #1380 records the same for #891 and #1123: "Real design records
live at `.llm/runs/plan-*--seed/design/canonical/`, produced by merged PRs #891 (deploy plugin
family) and #1123 (OpenAPI→MCP) and cited by `.github/labels.yml` label descriptions as
'RFC #891' / 'RFC #1123'." (`gh issue view 1380`).

**Convention C — `docs/architecture/rfc/` (introduced, unmerged).**
`docs/architecture/rfc/` does **not** exist at `2256a67bf`
(`git ls-tree -r main --name-only | grep 'docs/architecture/rfc'` → empty). Open draft PR #1446
(`docs/rfc-runtime-versioned-automation`) adds exactly one file outside `.llm/`:
`docs/architecture/rfc/rfc-0001-runtime-versioned-automation.md`
(`gh pr view 1446 --json files`). Its naming (`rfc-0001-<slug>.md`) and its author-assigned number
at *draft* time both diverge from `rfcs/README.md:61-64`. PR #1446's body states it is
"**Proposed**" status and "PR stays draft; owner ratification required", and that DevTools is
staged behind its own RFC (locked decision 9, "the new **P-6 DevTools RFC**").

Note `docs/architecture/` is the repo-internal architecture folder (siblings: `DOCS-STRUCTURE.md`,
`PUBLIC-SURFACE-PATTERNS.md`, `STANDARDS.md`, `doctrine/`, `zod-dependency-boundary.md` —
`ls docs/architecture/`), distinct from the published Lume site at `docs/site/`. So Convention C
places RFCs beside the doctrine as internal governance; Convention A places them at repo root as a
contributor-facing, Rust/React-style repo.

**Live `rfc`-labelled issues** (`gh issue list --label rfc --state all`): #1410, #1361 (ms `0.0.6`),
#1348 (ms `0.0.6`), #820, #510, #313, #305 (closed), #234. #1348 and #1361 are the tracking issues
for the Fable-5 RFC-A/RFC-B drafts, now filed on `0.0.6` — see D4.

**Options for where a DevTools RFC should live (owner fork — NOT decided here):**

| Option | Shape | Argues for | Argues against |
| --- | --- | --- | --- |
| **A. `rfcs/0000-devtools-contribution.md`** | Follow the documented process verbatim; number assigned at acceptance; companion `rfc:` tracking issue | It is the only *written* process (`rfcs/README.md:43-59`); the issue form points at it; would be the first exercise of a documented convention and would answer #1380 acceptance item 10 in the affirmative | Zero precedent; conflicts with the two conventions the repo actually runs on; `rfcs/README.md:74-79` self-declares provisional |
| **B. `.llm/runs/plan-devtools-contribution--seed/design/canonical/*.md`** | Match merged #890/#891/#1123 | Matches every merged "RFC" in repo history; already the run's artifact home; label descriptions already cite RFCs this way | Not a contributor-facing surface; `arch-debt.md` `RUN-ARTIFACT-ARCHIVAL-POLICY` (`:1566+`, DECISION_PENDING) proposes pruning `.llm/runs/` — the tree the de-facto RFCs live in (flagged in #1380) |
| **C. `docs/architecture/rfc/rfc-000N-devtools-contribution.md`** | Match unmerged PR #1446 | Sits beside the doctrine it amends; internal-governance framing; the *immediately adjacent* RFC (#1446) chose it and named this RFC as its successor (P-6) | The convention is unmerged and therefore not yet a convention; conflicts with `rfcs/README.md` numbering *and* naming; establishing it silently would create a fourth divergence |
| **D. Hybrid: canonical body in one location + `rfc:` tracking issue** | Any of A/B/C plus the `rfc_proposal.yml` tracking issue and `0.0.x` milestone | The tracking-issue half of `rfcs/README.md:66-72` is already live practice (#1348, #1361) and is orthogonal to file location | Does not by itself resolve the file-location question |

**Constraint the owner should weigh:** #1380 (open, `0.0.6`) already carries an acceptance
checkbox — "The RFC-location divergence is resolved in `rfcs/README.md` with the 5
`DECISION_PENDING` entries mapped to the chosen location" — and a boundary: "Do **not** file the
five `DECISION_PENDING` RFCs here; this issue only records where RFCs live." So an authoritative
answer is scheduled on `0.0.6`; a DevTools RFC that picks a location *before* #1380 lands either
pre-empts it or must be re-homed.

*Relevance:* Q12 (follow-up RFC staging), Q10 (board reconciliation), and the run's own deliverable
placement.

### F10 — Fable 5 remediation roadmap: overlaps and constraints on DevTools

Run: `.llm/runs/plan-fable5-remediation-roadmap--seed/` (plan LOCKED 2026-08-08, baseline
`fac9e339042c`, profile `SCOPE-docs` — `plan.md:1-5`).

- **Program shape** (`plan.md:12-16`): "two inserted milestones (0.0.7 typed seams + generation;
  0.0.8 runtime truth + service slice) via house rename pattern; 0.0.5 closes as scoped; **RFCs
  ratify in 0.0.6**; Wave-7 measured smoke is the 0.0.8 exit gate."
- **Deliverables** (`plan.md:7-11`): 41 issue drafts across three milestone directories, two RFC
  drafts (`rfcs/RFC-A-sdk-client-composition.md`, `rfcs/RFC-B-command-composition-kit.md` inside the
  run dir), `EXISTING-ISSUE-AMENDMENTS.md`, `IMPLEMENTATION-HANDOFF.md`.
- **DevTools is explicitly OUT of its scope.** `MASTER-PLAN.md:142` lists as excluded: "…
  amendments only); **Dev Dashboard (#400, paused)**; AI stack (#238) beyond the trace-context
  dogfood…". `grep -ril 'devtools' .llm/runs/plan-fable5-remediation-roadmap--seed/` returns **zero**
  files containing "devtools" — the roadmap never uses the term.
- **It does leave DevTools an unpaid bill.** `EXISTING-ISSUE-AMENDMENTS.md:507-519`: "re-baseline
  **has not happened**: #427 and #432 are still open verbatim under `epic:dev-dashboard` (#400), and
  **#400's 29 open children overlap this epic's consumer wave**. The re-baseline is outstanding work
  owned by whoever schedules #922's Wave 3, and it should be done before #400's…" and "What it
  prevents. Someone 'fixing' #922 by moving children to match dead beta titles; and #400's…"
  (`:519`). **This is directly Q10.** `:543` also flags #400 as "themselves umbrellas with…".
- **RFC-A directly constrains a DevTools data plane.** `rfcs/RFC-A-sdk-client-composition.md:14-38`:
  `CreateServiceClientOptions` is "a closed nine-field record with no `headers`, `fetch`,
  `interceptors`, `plugins`, `link`, or context type parameter
  (`packages/sdk/src/ports/service-client.ts:203-222`)"; `ServiceClientContext` is a closed
  interface not a type parameter (`:129-155`); `createHttpClientLink` is package-private
  (`packages/sdk/src/client/mod.ts:15-36`); "`@netscript/service/auth` accepts `Authorization:
  Bearer …` and `x-api-key` … and `createServiceClient` **cannot send either header**". A DevTools
  client that must propagate an auth principal (Q6, Q7) **cannot** do so through the current
  `@netscript/sdk` surface. Its tracking issue is **#1348**, milestone `0.0.6`.
- **RFC-A's own filing note is the RFC-home evidence.** `milestones/0.0.6-verification-docs-rfcs/T1-01-rfc-a-tracking-issue.md:7-13`:
  "per `research/github-conventions.md` §5.4 the live house pattern is an **issue-hosted RFC
  (#1123)**, not a merged `rfcs/NNNN-*.md` file — **zero numbered RFC files have ever merged**.
  Paste the RFC's numbered sections into the issue body, or open the RFC PR **and** this tracking
  issue if the owner wants the documented file process exercised for the first time. **Record which
  was chosen.**"
- The conventions research is `research/github-conventions.md:412-452`, which tabulates the five
  `rfc`-labelled issues at that baseline and the de-facto #1123 section shape (`Abstract`,
  `1. Motivation`, … `7. Board — FILED …`, `8. Review trail`, `9. Forks — RATIFIED …`) including
  the arbitration rule "**GitHub wins on conflict**" (`:446-452`).

**Verdict:** Fable 5 does **not** block DevTools and does not design any part of it. It constrains
DevTools in three concrete ways: (1) it schedules RFC ratification into `0.0.6`, which is where an
authoritative RFC-home answer (#1380) also sits; (2) it hands DevTools the un-done #400↔#922
re-baseline as explicit outstanding work; (3) RFC-A/#1348 owns the SDK client seam a DevTools data
plane needs, so DevTools should *consume* that contract rather than invent a parallel one.

*Relevance:* Q6, Q10, Q12.

### F11 — Live milestone shape and which milestone plausibly owns DevTools

`gh api repos/rickylabs/netscript/milestones --paginate`:

| # | Title | Open | Closed | Description (verbatim) |
| --- | --- | --- | --- | --- |
| 3 | `Backlog / Triage` | 67 | 15 | "Holds only upstream-blocked or undecided work plus epic/umbrella issues; children carry the beta.12–beta.18 train milestones." |
| 26 | `0.0.6` | 57 | 7 | "Verification, docs truth and RFC ratification. Preserves all deferred agent-surface fixes from the former 0.0.6 and adds the Fable 5 remediation RFC/docs/quality tranche. GitHub is authoritative over seed PR #1347." |
| 27 | `0.0.7` | 10 | 0 | "Typed seams and generation: plugin-extensible SDK/client composition, auth and trace-context dogfood, route-slice generation, and contract-derived SDK/query/invalidation generation." |
| 25 | `0.0.8` | 21 | 0 | "Runtime truth and service slice: causal saga receipts, plugin child liveness, durable stream persistence, production command composition, auth defaults, and the Wave 7 measured-adoption exit gate." |
| 24 | `0.0.9` | 20 | 6 | "**Frontend Contribution Layer — plugins that ship UI. RFC #890, epic #922.** Waves 0-2: disposable proofs, contracts + spine, DX + lifecycle. Wave 3 consumers (auth v1, AI chat, panels, auth-org, convention generator) follow in later milestones." |
| 16 | `0.0.10` | 50 | 4 | "Enterprise auth wave-1 (Entra OIDC, multi-backend routing)" |
| 17 | `0.0.11` | 15 | 0 | "Deploy containers W4 + auth WorkOS broker wave (SSO/SCIM/Audit) + **frontend-contrib polish**" |
| 18 | `0.0.12` | 2 | 0 | "Deploy clouds W5 (CF/Vercel/AWS + thin adapters) + auth machine/agent/Better Auth track" |
| 19 | `0.0.13` | 10 | 0 | "Desktop graph (#830) + Aspire packaging/Windows tier + WorkOS RBAC/FGA" |
| 20 | `0.0.14` | 11 | 0 | "**Dev dashboard (thin, contribution-based)** + auth/deploy tail" |
| 21 | `0.0.15` | 45 | 0 | "Cascaded from beta.18 when beta.12 became the stabilisation release." |

Closed: `0.0.2` (#14), `0.0.3` (#15), `0.0.4` (#22) — all `open=0`.

**Where DevTools work sits today.** `gh issue list --label epic:dev-dashboard --state open` returns
29 issues: epic **#400** on `Backlog / Triage`, and **28 children all on `0.0.15`** — #410 (fresh-ui
L3 blocks promotion), #411 (`@netscript/aspire` command + app resource kinds), #412
(`plugin-dashboard-core` scaffold + contract seam), #413 (`TelemetryQueryPort` + aspire-otlp-http
adapter), #414 (`plugins/dashboard` thin plugin + E2E join), #415 (Fresh build-console shell + IA),
#416 (Stack Map), #417 (Service Catalog + API Explorer), #418 (S13 Live Flow), #419 (Run Inspector),
#420 (Plugin Control host + registry/overview), #423 (introspection endpoint `/_netscript/*`), #424
(CLI surface + auto-launch), #426 (E2E dashboard join + panel smoke), #427 (`DashboardPanelContribution`
seam `.withDashboardPanel`), #428–#431 (per-capability sections: workers/sagas/triggers/streams),
#432 (Codegen-from-UI Add-resource action), #507 (design prototype + `tools/design-sync`), #509
(fresh-ui registry-wide pixel-perfect revamp), #551–#557 (S3 runtime-config monitor, S11 DB
migrations, S12 DLQs and their co-requisites).

**`0.0.14`'s 11 open issues contain none of them** — they are #915–#919 (`epic:deploy-plugin`) and
#881–#886 (`epic:enterprise-auth`). So the milestone whose *description* says "Dev dashboard (thin,
contribution-based)" currently holds **zero** dashboard issues; the dashboard children sit one
milestone later on `0.0.15`.

**Prerequisite milestone.** `0.0.9` holds epic #922 plus 19 slices #923–#941, including
#928 `@netscript/plugin-frontend-core contracts/v1`, #929 `@netscript/plugin` pointer axis
(`.withFrontend`), #930 frontend registry emissions (transactional replace-set), #931
`@netscript/fresh/plugins` host runtime, #932 scaffold template wiring + `HostSurfaceDescriptor`,
#933 workers dogfood, #934 generated deny-by-default procedure gateway. PR #1446's locked decision 9
names "#923–#932 + #934; #933 adjacency" as the minimum cut its production/admin console depends on.

**Plausible owners for DevTools work (evidence, not a recommendation):**
- `0.0.14` — its description already claims the surface by name.
- `0.0.15` — where all 28 `epic:dev-dashboard` children actually are.
- `0.0.6` — for an RFC *tracking issue* only, matching the milestone's stated purpose ("RFC
  ratification") and the precedent of #1348/#1361.
- `Backlog / Triage` — matching #400's own placement and the milestone's stated rule ("epic/umbrella
  issues").

*Relevance:* Q10 (board reconciliation), Q11, Q12.

### F12 — The harness requires archetype + verdict + gates + debt + AP list in the plan itself

`.llm/harness/archetypes/README.md:38-47`: "Every `plan.md` for package/plugin work must include:
selected archetype and justification, scope overlays, **current doctrine verdict from doctrine file
10**, required gates from `../gates/archetype-gate-matrix.md`, known debt entries from
`../debt/arch-debt.md`, anti-patterns in scope by AP code."

Scope overlays that apply to a DevTools RFC: `SCOPE-frontend` (UI/routes/browser —
`SCOPE-frontend.md:3-5`), `SCOPE-docs` (the RFC document itself — `SCOPE-docs.md:3-5`), and
`SCOPE-service` if a DevTools service resource is introduced. `SCOPE-docs.md:20-27` adds the gates
"Source alignment — Every prescriptive claim points to doctrine, RFC, or code" and "Drift log —
Material mismatch is recorded in run `drift.md`".

`SCOPE-frontend.md:32-36` names the false-done states this RFC's IA section (Q9) must beat:
"Main route works but subpages or nested states remain broken", "Static check passes but browser
render blocks, flashes, or shows stale data", "Visual change is verified only by reading code".

*Relevance:* Q9, Q11.

---

## Contracts

Named artifacts the RFC must consume or extend, with the shape as it exists at baseline.

| Name | Shape | Evidence |
| --- | --- | --- |
| Archetype decision order | 7 ordered questions; "pick the *larger*", fold the smaller; do not split a package across archetypes | `docs/architecture/doctrine/06-archetypes.md:348-367` |
| Archetype assignment table | 29 rows mapping package → archetype (`fresh`, `fresh-ui`, `sdk`, `service`, `contracts`, `plugin` → 4; `telemetry`, `aspire` → 2; `plugins/*` → 5) | `docs/architecture/doctrine/06-archetypes.md:368-381` |
| Archetype-5 thinness law | Convention-bearing primitives live in `@netscript/plugin-<kind>-core`; the `plugins/*` package is thin userland glue that re-exports contracts and never re-implements a core convention | `docs/architecture/doctrine/06-archetypes.md:161-214` |
| Layering rule set (F-3) | `domain → (nothing)`; `ports → domain`; `application → domain+ports`; `adapters → domain+ports+external`; `presentation → application+domain`; `testing → own surface + in-memory adapters` | `docs/architecture/doctrine/05-folder-structure.md:47-56`; gate at `09-…:212-222` |
| Role-folder vocabulary | Closed list incl. `domain ports application adapters runtime state middleware presets registry diagnostics presentation testing internal`; `utils/ helpers/ common/ lib/ interfaces/` forbidden (F-11) | `docs/architecture/doctrine/05-folder-structure.md:12-32`; `09-…:271-274` |
| R-FOLD-CARD / F-16 | ≤ 12 immediate children per `src/` directory; ≤ 4 levels of nesting from `src/` | `docs/architecture/doctrine/05-folder-structure.md:167-181`; `09-…:300-307` |
| R-FOLD-LAYERING-MODE | Horizontal for shared kernels; **vertical (feature) for command-like surfaces incl. dashboard pages** | `docs/architecture/doctrine/05-folder-structure.md:188-208` |
| Extension-axis contract (A11) | Per axis: typed identifier + factory + registration mechanism; existing axis table already has a "Frontend framework" row | `docs/architecture/doctrine/07-composition-and-extension.md:82-113` |
| Registration-over-inheritance (AP-4) | Consumers extend by registering a factory against an axis; cross-package `extends` forbidden | `docs/architecture/doctrine/07-composition-and-extension.md:114-141`; `09-…:54-57` |
| R-COMP-EXT-MANIFEST | ≥ 2 extension axes ⇒ one `extension-points.ts` at a documented path; every `Registry` subclass is in it or explicitly internal | `docs/architecture/doctrine/07-composition-and-extension.md:254-289` |
| Archetype gate matrix | F-1…F-19 per archetype column; A2/A3/A4 add F-2/F-3/F-4/F-9; A3 adds F-13; browser validation is `subtype` only under A4 | `.llm/harness/gates/archetype-gate-matrix.md:19-38,65-72` |
| `SCOPE-frontend` overlay gates | Route check · Browser validation (Playwright) · Loading/empty/error states · Responsive check · Contract check | `.llm/harness/archetypes/SCOPE-frontend.md:22-30` |
| `deno task arch:check` root list | 16 hand-listed `--root` args; a new package is ungated until added | `deno.json:156` (`arch:check:repo` at `:157`) |
| Doctrine "Stop conditions" | New code bound immediately; existing code via roadmap; violation allowed only with an `arch-debt.md` entry + time-bounded plan + no deepening | `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md:184-195` |
| RFC process (`rfcs/README.md`) | Draft `rfcs/0000-<slug>.md` from template + `rfc:` tracking issue → Discussion → FCP → Accepted (maintainer assigns number, renames to `NNNN-<slug>.md`, milestone) | `rfcs/README.md:36-72` |
| RFC template headings | Frontmatter (`rfc/title/status/authors/created/tracking-issue/target-milestone`) + Summary · Motivation · Guide-level · Reference-level (incl. "doctrine archetype") · Drawbacks · Rationale/alternatives · Breaking changes · Prior art · Unresolved questions · Future possibilities | `rfcs/0000-template.md:1-56` |
| `rfc_proposal.yml` issue form | Auto-labels `rfc` + `status:triage`, title prefix `rfc: `, asks for the `rfcs/NNNN-<slug>.md` PR link | `.github/ISSUE_TEMPLATE/rfc_proposal.yml:1-16,44-52` |

---

## Drift candidates

### D1 — Doctrine Archetype-5 minimum folder shape vs the observed `plugins/*` layout (recorded, still open)

**Expected** (doctrine as-read now, `06-archetypes.md:176-198`): contribution folders sit at the
package root as siblings of `src/` — and the doctrine text itself says "This is the observed
first-party layout … and it is authoritative".

**Actual:** the debt registry says the doctrine chapter still nests them under `src/` and still
names `@netscript/sagas`/`@netscript/workers` as the sibling contract packages:
"The doctrine-06 'Archetype 5 — Plugin Package' Minimum shape nests contribution folders
(`services/`, `database/`, `jobs/`, `streams/`, `verify-plugin.ts`) under `src/` … Neither matches
reality" (`.llm/harness/debt/arch-debt.md:2091-2115`, `doctrine-06-archetype-5-folder-shape`, open,
DEBT_ACCEPTED, created 2026-07-06).

**Resolution:** the debt entry is **stale**, and this is verifiable. The doctrine text at HEAD shows
root-level siblings and declares them authoritative (`06-archetypes.md:176-179`), and names
`@netscript/plugin-<kind>-core` as the sibling (`:161-167`, `:202-204`). The harness profile
confirms the reconciliation explicitly: "As of #306 (doctrine-revamp lane) this layout is
**reconciled into doctrine**: `06-archetypes.md#archetype-5--plugin-package` now states the same
top-level-siblings shape as authoritative, so doctrine and this profile agree."
(`.llm/harness/archetypes/ARCHETYPE-5-plugin.md:45-50`). The entry's own closing gate — "doctrine-06
Archetype 5 Minimum shape matches the observed authoritative `plugins/*` layout … and the
archetype-5 profile no longer defers to the observed layout" (`arch-debt.md:2113-2115`) — is
therefore **met**, but the entry is still `open, DEBT_ACCEPTED`.

**Severity:** minor (governance bookkeeping) — but it matters because a DevTools plugin's shape is
justified by exactly this chapter, and an evaluator reading `arch-debt.md` alone would conclude the
chapter is untrustworthy. The RFC can cite `06-archetypes.md:176-198` as authoritative and note the
unclosed entry.

### D2 — Doctrine verdict table names deleted packages, omits 14 live units; its gate is accepted-red

**Expected** (`10-codebase-verdict-and-handoff.md:197-213`): "the codebase walk above shows zero
'Restructure' or 'Rewrite' verdicts" is the doctrine's definition of done, and `deno task arch:check`
"passes for every package without opt-outs".

**Actual** (issue #1380, open, milestone `0.0.6`, `gh issue view 1380`): the 29-row table names five
packages absent from `ls packages/` (`shared`, `streams`, `triggers`, `workers`, `sagas`) plus
`plugins/hello-world`; 14 live units have **no row** (`ai`, `auth-better-auth`, `auth-kv-oauth`,
`auth-workos`, `bench`, `mcp`, `plugin-ai-core`, `plugin-auth-core`, `plugin-sagas-core`,
`plugin-streams-core`, `plugin-triggers-core`, `plugin-workers-core`, `plugins/ai`, `plugins/auth`);
`arch:check` iterates 16 of 36 units so "20 live units have no doctrine gate at all";
`arch:check:repo` exits 1 with `FAIL=53 WARN=341 INFO=1`, of which 52 are false-positive
`A14 Jest/Vitest globals` hits on `jsr:@std/testing/bdd` imports and 1 is the root-as-package
structural failure. I independently confirmed the live-unit counts (`ls packages/` → 30 dirs,
`ls plugins/` → 6) and the 16-root `arch:check` definition (`deno.json:156`).

**Severity: architectural.** The RFC cannot cite "the doctrine verdict for `@netscript/fresh`" as a
current fact without noting the table is under active correction, and cannot claim mechanical gate
coverage for a new package without adding it to `deno.json:156`.

### D3 — `@netscript/fresh` archetype: doctrine says 4, the merged frontend-contrib design says 3

**Expected:** `06-archetypes.md:376` assigns `fresh` (with `fresh-ui`, `sdk`, `service`,
`contracts`, `plugin`) to **Archetype 4 — DSL/Builder**; the verdict table repeats "4" at
`10-…:39`.

**Actual:** `.llm/runs/plan-frontend-contrib--seed/design/canonical/06-doctrine-fit.md:11` labels
`packages/fresh` "**ARCHETYPE-3 (runtime behavior — existing)**" when assigning the new `./plugins`
host-runtime subpath, and routes its gates accordingly.

**Severity: significant.** A3 and A4 differ on F-13 (runtime invariants: `stop()`, `AbortSignal`)
and on whether browser validation is `subtype`-required. If DevTools mounts its host inside
`@netscript/fresh`, the RFC inherits an unresolved archetype label and an ambiguous gate set.

### D4 — Fable 5 declared "zero GitHub board mutation"; its RFC tracking issues are now filed

**Expected:** `.llm/runs/plan-fable5-remediation-roadmap--seed/plan.md:17-19`: "Mutation boundary
held: **zero GitHub board mutation**; drafts carry the no-mutation H1 marker; filing is a later
owner-ratified run (Stage H out of scope by charter)."

**Actual:** `gh issue list --label rfc --state all` shows **#1348** "rfc: SdkClientContribution — one
typed chain for client construction, credentials, transport, policy metadata, and query
invalidation" and **#1361** "RFC: production command composition kit…", both open on milestone
`0.0.6` — i.e. the T1-01/T3-01 drafts were subsequently filed. Milestone 26's description confirms
the roadmap landed on the board ("adds the Fable 5 remediation RFC/docs/quality tranche. GitHub is
authoritative over seed PR #1347").

**Severity: minor** for this run, but load-bearing for Q10: the board, not the fable-5 run
artifacts, is authoritative — the roadmap says so itself via the milestone description, matching the
house rule "GitHub wins on conflict" (`fable-5-remediation-plan/research/github-conventions.md:446-452`).

### D5 — `0.0.14`'s description claims the dev dashboard; none of its issues are dashboard issues

**Expected:** milestone `0.0.14` description: "Dev dashboard (thin, contribution-based) + auth/deploy
tail" (`gh api repos/rickylabs/netscript/milestones`).

**Actual:** `gh issue list --milestone 0.0.14 --state open` returns 11 issues, all
`epic:deploy-plugin` (#915–#919) or `epic:enterprise-auth` (#881–#886). All 28 open
`epic:dev-dashboard` children are on `0.0.15`; epic #400 is on `Backlog / Triage`.

**Severity: significant** for Q10 — any supersession map the RFC drafts must state which of the two
milestones is the intended home, because the board and the milestone descriptions disagree.

### D6 — `rfcs/README.md` defers to a doctrine governance statement that does not exist

**Expected:** `rfcs/README.md:74-79`: "The formal, binding 'what requires an RFC' policy is part of
NetScript's architecture governance and is being reconciled with the architecture doctrine
(`.agents/skills/netscript-doctrine`, `docs/architecture/doctrine/`) … if it ever conflicts with a
ratified doctrine governance statement, doctrine wins."

**Actual:** `ls docs/architecture/doctrine/` returns 12 files
(`01`–`11` plus `ref-migration-map.md`); none is a governance or RFC-policy chapter, and
`grep -n '^#\{2,3\} ' docs/architecture/doctrine/01-thesis-and-axioms.md` shows the axioms chapter
ends with "What is not in the doctrine" (`:115`) rather than a governance section. So the RFC
process currently has **no** ratified doctrinal authority behind it.

**Severity: significant** for Q12 and for this run's own deliverable placement.

---

## Open questions

1. **Which archetype does a DevTools host take** — A2 (dashboard precedent: read/aggregate/serve,
   ports + adapters, no background processor) or A3 (if it owns a live registry with lifecycle and
   supervised subscriptions)? A9's "pick the larger" makes this decidable only once the RFC states
   whether the host owns long-running supervised state. Unresolved here by design.
2. **Is `@netscript/fresh` archetype 3 or 4?** (D3.) The answer changes the gate set for any
   host mounted as a `fresh` subpath. Verification: whichever the RFC picks must be reconciled
   against `06-archetypes.md:376` and `10-…:39` or recorded as drift.
3. **Where does this RFC's document live** (F9 options A–D)? Owner fork. Sub-question: does picking
   a location pre-empt #1380's acceptance item 10, and should the RFC instead *depend on* #1380?
4. **Does a DevTools contribution reuse the `0.0.9` frontend-contribution envelope
   (`plugin-frontend-core` contracts/v1, #928) or define a sibling family?** AP-9 (premature
   abstraction) and Q4 (production admin vs developer diagnostics separation) pull in opposite
   directions; PR #1446's decision 9 asserts the #923–#932+#934 cut is "sufficient for this surface
   only" (the admin console), leaving DevTools's dependency undeclared.
5. **Which milestone owns DevTools** — `0.0.14` (description) or `0.0.15` (where the issues are)?
   (D5.)
6. ~~Is the `doctrine-06-archetype-5-folder-shape` debt entry stale?~~ **Resolved in D1: yes, its
   closing gate is met and the entry should close.** Remaining question is only who closes it.
7. **Will the RFC commit to adding its packages to `deno.json:156`?** Without it the archetype gate
   claim is unbacked (F7). Also unresolved: whether #1380's `arch:check:repo` repair lands first,
   which would make the explicit-root list obsolete.
8. **How do the triggers/streams connector SOUND-convergence holes (`arch-debt.md:424-485`) bound
   what DevTools can honestly show for those two runtimes?** Streams has no oRPC contract surface at
   all; a "contract provenance" panel (Q5) would have nothing to read.
9. **Does a DevTools data plane wait on RFC-A/#1348?** The current `@netscript/sdk` client cannot
   send `Authorization` or `x-api-key` headers (F10), which blocks Q6/Q7 auth propagation.
10. **Unverified:** whether `rfcs/` or `docs/architecture/rfc/` is included in any docs gate
    (`docs:links`, `docs:accuracy`, `docs:contract-derivation` — `deno.json:81-84`). Verification:
    run `deno task docs:links --pretty` on a branch containing a file in each location and compare
    coverage.

---

## Sources

**Repo files read (all at HEAD ≡ `origin/main` `2256a67bf` for these paths):**

- `docs/architecture/doctrine/01-thesis-and-axioms.md` (outline + axiom list)
- `docs/architecture/doctrine/02-public-surface.md` (outline)
- `docs/architecture/doctrine/05-folder-structure.md` (full)
- `docs/architecture/doctrine/06-archetypes.md` (full)
- `docs/architecture/doctrine/07-composition-and-extension.md` (`:82-155`, `:254-292`)
- `docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md` (full)
- `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md` (full)
- `.llm/harness/debt/arch-debt.md` (headings index + entries at `:12-747`, `:903-960`,
  `:1298-1340`, `:1585-1632`, `:2069-2130`)
- `.llm/harness/archetypes/README.md`, `SCOPE-frontend.md`, `SCOPE-docs.md`,
  `ARCHETYPE-3-runtime-behavior.md` (`:1-50`), `ARCHETYPE-4-dsl-builder.md` (full),
  `ARCHETYPE-5-plugin.md` (`:37-51`)
- `.llm/harness/gates/archetype-gate-matrix.md` (full)
- `.llm/harness/DOCTRINE-REF.md`
- `rfcs/README.md` (full), `rfcs/0000-template.md` (`:1-56`)
- `.github/ISSUE_TEMPLATE/rfc_proposal.yml` (`:1-60`)
- `deno.json` (`:52`, `:81-84`, `:154-157`)
- `docs/architecture/DOCS-STRUCTURE.md` (grep)
- `.llm/runs/plan-roadmap-expansion--seed/design/A-dashboard/proposal.md` (`:9-22`, `:50-120`)
- `.llm/runs/plan-frontend-contrib--seed/design/canonical/06-doctrine-fit.md` (full)
- `.llm/runs/plan-fable5-remediation-roadmap--seed/plan.md` (full),
  `fable-5-remediation-plan/MASTER-PLAN.md` (grep `:142`),
  `fable-5-remediation-plan/MILESTONE-TRAIN.md` (grep), `EXISTING-ISSUE-AMENDMENTS.md`
  (grep `:507-543`), `rfcs/RFC-A-sdk-client-composition.md` (`:1-40`),
  `milestones/0.0.6-verification-docs-rfcs/T1-01-rfc-a-tracking-issue.md` (`:1-50`),
  `research/github-conventions.md` (`:412-452`)
- `.llm/runs/plan-devtools-contribution--seed/plan.md` (`:90-115`, the Q1–Q12 docket),
  `phase-registry.md` (`:53,:63`)
- `.llm/runs/dashboard-design--orchestrator/design-project/uploads/research.md` (`:470`, `:523`)

**Commands run (verbatim):**

- `git log --oneline -1 origin/main` → `2256a67bf docs(home): complete the capability outcome story (#1442)`
- `git merge-base --is-ancestor origin/main HEAD` → 0
- `git ls-tree -r main --name-only | grep -iE '^(rfcs/|docs/architecture/rfc)'` → `rfcs/0000-template.md`, `rfcs/README.md`
- `ls packages/` → 30 directories; `ls plugins/` → 6 directories
- `grep -n 'arch:check' deno.json`
- `gh api repos/rickylabs/netscript/milestones --paginate --jq '...'`
- `gh issue list --repo rickylabs/netscript --label rfc --state all --limit 30`
- `gh issue list --repo rickylabs/netscript --label epic:dev-dashboard --state open --limit 60`
- `gh issue list --repo rickylabs/netscript --milestone 0.0.9 --state open --limit 30`
- `gh issue list --repo rickylabs/netscript --milestone 0.0.14 --state open --limit 30`
- `gh issue list --repo rickylabs/netscript --milestone 0.0.6 --state open --limit 60`
- `gh issue view 1380 --json body`
- `gh issue view 890 / 400 / 922 --json number,title,state,labels,milestone`
- `gh pr view 890 --json number,title,state,mergedAt,files`
- `gh pr view 1446 --json number,title,state,headRefName,body,files`
- `grep -ril -E 'devtools|dev dashboard|dev-dashboard' .llm/runs/plan-fable5-remediation-roadmap--seed/` → 5 files, none containing "devtools"

**No external URLs were fetched for this topic; no artifacts were saved under
`research/sources/` because every claim resolved to a repo path or a `gh` read.**
