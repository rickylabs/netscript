# Plan & Design — READY FOR REVIEW

Issue #2570 (supersedes #2566). Archetype 6 / frontend overlay. Mandatory PLAN-EVAL
before implementation; mandatory independent IMPL-EVAL and visual review afterward.
Do not merge until these gates are complete.

## Locked design

Preserve Studio Utility's shipped tokens, fonts and monochrome geometry. Use the
current registry components; no shared component forks and no #2488 duplication.
New CSS is app page composition only, scoped to scaffold classes, imported separately
from the registry aggregator so ui:add cannot erase it. Measure its bytes and the
existing CSS budgets; consolidate before considering any budget adjustment.

| Figma screen | Route and composition | Real content / empty state |
| --- | --- | --- |
| dashboard | `/` and `/dashboard`: SidebarShell, PageHeader, StatsGrid, ResponsiveTable, EmptyState; table/activity 2:1 | Generated route count, configured theme, service presence, fetched record count; absent metrics use an em dash with reason, never invented revenue/deltas. Recent records from typed client; unavailable service is an error, not an empty result. |
| orders | `/records`, `/records/[id]`: PageHeader, table, detail composition, fields | Contract-derived list and variant-specific detail from generated service; no service displays exact `netscript service add --name <configured-service> --with-client` guidance; empty database collection points to its existing create flow; memory variant has no create action; detail handles missing records and auth distinctly. |
| settings | `/settings`: local section rail plus two-column form built from FormField/Input/Select/Switch | Actual browser appearance preferences with Save/Discard persistence; generated project/theme identity read-only. Auth/security absent state names `netscript plugin install auth --name auth`. No pretend store, payment or deletion controls. |
| sign-in | `/sign-in`: chromeless auth column plus workspace/setup summary | When generated BFF exists, submit to its existing `/auth/signin` provider flow, never password collection or invented providers. Otherwise EmptyState with exact auth add command. |
| command | global Cmd/Ctrl+K: existing CommandPalette in a small app island | Search actual generated navigation; keyboard opening/selection, Escape, focus return. No fictitious orders or disabled demo commands. |

Keep `/design` development-only. Preserve old `/examples` links where useful, but
remove fake rows and no-service CRUD cards. Navigation and route counts derive from
actual generated routes, filtering design pages in production. Custom service/model
names and nondefault presets must flow through without hardcoded users or NS One.

## Capability contract

Use a narrow server-owned projection of generated topology and route/client presence.
Only safe names, presence and links cross into views; never appsettings secrets,
credential headers, filesystem paths or whole configuration objects. Distinguish
absent, ready, empty, unauthorized and unavailable. Do not equate installed with healthy.

- Service: init's actual service plan selects a typed loader template importing the
  existing generated contract/client; no-service emits an absent loader with no
  service import. Existing create flow remains the mutation surface.
- Auth: existing generated auth route/BFF enables signin; reuse request-scoped
  browser credentials for guarded service reads, without serializing them.
- Workers / streams / AI: inspect generated plugin registrations and supported
  routes/contracts. Wire installed capability panels through their existing typed
  clients/UI flows; absent panels show `netscript plugin install workers --name workers`,
  `netscript plugin install streams --name streams`, `netscript plugin install ai --name ai`. A plugin with no
  configured workload says so; do not seed handlers or model providers.
- Runtime topology inspection belongs server-side. Extend the explicit projection
  and template contract only as required by generated variants; do not add a
  generalized plugin framework or source-sniff arbitrary user code.

## Ordered slices

1. S1 shell and absent-capability pages (under 30 source files): app navigation,
   layout, home/dashboard, records/list-detail, settings/signin/command templates;
   app composition CSS; manifest/loader/writer registration; focused scaffold tests.
   Gate: template tests, no-service render, scoped wrappers, quality:gate.
2. S2 live capability wiring (under 30 source files): generated service loader,
   capability projection and plugin/auth view integration plus regression tests.
   Gate: service/plugin/auth variants, empty/error/unauthorized cases, scoped wrappers.
3. S3 visual refinement and acceptance: render real generated no-db/service/plugin
   apps at 1440 and 390 widths, light/dark; keyboard and form interactions; independent
   Astra page scores >=8/10. Update scoped styles only after measured comparison.
4. S4 carriers and final verification: regenerate embedded assets and entire required
   carrier chain, run every root check:* task, CLI scaffold/template tests,
   release:preflight, docs:accuracy, quality:gate, JSR audit and scaffold.runtime.
   Record failures/unproven honestly. Split generated commits if inventory exceeds 29.

Each slice includes worklog/context updates and independent substantive review before
sign-off. Final evaluation uses a separate Anthropic session. Reports stay in this run.

## Risks and decisions

- #2488 pending: safe to defer migration until it merges; use main's supported API.
- Installed plugin contracts differ: research each typed entrypoint before S2; no
  new plumbing. If a capability cannot be wired from shipped APIs, record precise
  remaining scope rather than labeling it live. No fake success.
- Sign-in differs from Figma password example: existing OAuth contract is authority;
  preserve layout and honest provider copy. This is a deliberate semantic adaptation.
- Local settings are explicitly browser preferences, not saved workspace configuration.
- Missing runtime prerequisites: runtime gate UNPROVEN, never silently waived.
- Shared styles budgets: shared CSS source stays unchanged; install command-palette and its dependency CSS, measuring the aggregate delta and page CSS separately.
- Root excludes CLI lint/fmt: structured wrappers with rule-preserving scoped config.
- Generated carriers may include unrelated baseline drift: inspect and attribute it.

## Deferred scope and debt

#2571 showcase data/plumbing, new services/providers/workload handlers, new component
contracts, publication and merge are excluded. No accepted new architecture debt.
Contributor path: generated `navigation.ts` for routes; scaffold page template README
will explain capability projection and reusable page composition for #2571.

## Acceptance evidence

Every issue acceptance maps to tests/render matrix and visual score table. Required
checks must be green or skipped by documented workflow policy before READY with head.
Use the final report file handoff for canonical issue publication. Draft PR stays
Refs-only, no labels/session ids, per highest-priority operator process instruction.


## PLAN-EVAL corrections — binding decisions (supersede ambiguous wording above)

### B1: Executable commands

Use one generated `lib/scaffold-contract.ts` constants module for commands/state
vocabulary. Commands are `netscript plugin install <kind> --name <kind>` for auth,
workers, streams, ai; and `netscript service add --name <configured-service>
--with-client`, with the service name from the selected plan or SCAFFOLD_DEFAULTS.
The issue's `plugin add` examples do not exist in this CLI. Verify command parser
options in regression tests. No new command alias is introduced by this design slice.

### B2: Detection timing, explicitly option (a)

A server-only `lib/scaffold-capabilities.ts` reads the generated workspace topology
at request time through the existing configuration boundary and known generated
module presence. It projects enabled service/plugin names and supported local links
only. It never sends whole settings, paths or credentials to an island.
The fixed state union is `absent | installed-unwired | ready | empty | unauthorized
| unavailable`. Ready is set only after a successful typed read, never mere install.

Init imports only its known typed service module. Post-init service installation is
reported immediately as installed-unwired, with the existing `netscript generate
resource <name> --app <app> --client <name> --procedure list` command directing the
user to its actual generated client. This is an explicit capability boundary, not
an absent state, and must not be claimed as fully wired acceptance. If a generated
client can be selected safely through its explicit template-owned contract, connect
it in S2; arbitrary authored clients are not introspected or source-sniffed.
Auth availability uses current enabled topology plus the known generated BFF route
file, independently of stale route manifests. Its sign-in form posts to the already
implemented `/auth/signin` route; no optional static BFF import exists in no-auth
builds. Optional request-context adapters use Vite's server-side module discovery
with an explicit typed shape, so missing optional modules are not hard imports.

For plugins, installed identity comes from persisted scaffold.plugin.json linking
metadata (canonicalName/resourceConfigKey), not directory-name guesses. Only enabled
resources for this app are considered. Existing typed workers list/status, streams
readiness/discovery and AI models capabilities are the live read surfaces; no new
jobs, streams, providers or commands are provisioned. Until a typed adapter is
available, installed-unwired is visible with `netscript plugin doctor <name>` and
relevant supported CLI discovery, never false-ready. Any final installed-unwired
required variant is reported as incomplete acceptance and prevents READY; this
fallback is honest progressive behavior, not a substitute for final wiring.

Required lifecycle regressions: no-service init → service add --with-client changes
absent to installed-unwired/live; init → auth install changes absent to enabled
signin; disabled plugin does not appear healthy; unavailable client returns error.

### B3: Procedure matrix

| Generated variant | List | Detail | Mutations shown |
| --- | --- | --- | --- |
| no service | no imports; absent | absent | add-service command |
| memory service (`dbEngine=none`) | typed `list({limit,offset,search})` | selected typed list item; bounded paginated lookup on direct detail, explicit unavailable if the lookup budget is exceeded | existing `updateStatus` only, no create |
| database service | typed CRUD list | typed `getById` | existing generated create/update flow |

The writer chooses the adapter by the existing dbEngine option. No new service
procedures are added. Missing ID, unauthorized and unavailable remain distinct.

### B4: Runtime compatibility invariants

Retain `/examples/orders/[id]` and its `data-order-id` nonce plus self-link as the
explicit typed-routing reference. Do not display it as a live business record.
Keep canonical `/examples/<service>` resource leaves and their Cache-first query,
Managed form and Deferred summary markers unchanged. Home retains visible links to
`/design` and `/design/composition` in development (where scaffold.runtime runs);
production omits both development-only links. The no-service CRUD marketing card
and fake dashboard/CRUD table rows are removed, not the canonical resource flow.
No e2e probe edits are planned; any needed probe change requires explicit drift.

### B5: Registry install

S1 installs `command-palette` alongside foundation/floating-styles/control-props,
letting the registry resolve dialog/combobox dependencies. Export it from the app
barrel or import its app-owned module directly. Measure the installed CSS aggregate
before/after against #2558 budgets, including transitive styles. Do not install the
whole AI collection just to obtain CommandPalette. Shared registry source is unchanged.

### B6: Explicit acceptance map

| Issue acceptance | Slice | Proof |
| --- | --- | --- |
| #2570 default no-db/service/plugin variants, both schemes and widths follow Figma | S1–S3 | real scaffold screenshots: each page × 1440/390 × light/dark × available variant; browser route/overflow assertions |
| #2570 shown capabilities live or exact-command EmptyState; no static rows | S1–S2 | template tests + typed loader success/empty/unauthorized/unavailable tests + post-install transitions |
| #2570 independent >=8 fidelity and quality per page | S3 | independent Astra visual audit table, all pages and schemes/widths, reports retained |
| #2570 variant scaffold tests and scaffold.runtime | S2/S4 | CLI scaffold/template wrapper suite; single runtime command, explicit UNPROVEN if unavailable |
| #2570 resolves #2566 copy and capability issues | S1/S2 | four regression cases below |
| #2566 theme card derives from actual preset | S1 | render default and alternate preset, assert appTheme label |
| #2566 no CRUD card without service, generated route count | S1/S2 | no-db init render asserts absent service and counted generated page routes (design excluded in production) |
| #2566 no maintainer wording for public installs | S1 | rendered home/template negative assertion |
| #2566 no-db home regression test | S1 | writer/render test verifies all three preceding cases together |

Open-decision sweep: all six review blockers are decided above. #2488 migration is
safe to defer until merge. Additional live plugin adapter details must conform to
this fixed projection; an inability to satisfy a required capability is incomplete
acceptance and blocks READY, never permission to invent a contract.

## S2 accepted dependency debt

Independent S2 review selected FAIL_DEBT for the unconditional workers contract
import. Accept CLI-SCAFFOLD-WORKERS-CONTRACT-DEPENDENCY in the canonical debt ledger:
no-workers apps resolve/type-check that package; independent plugin upgrades may
skew its runtime version. Both official generation paths share the release-pinned
resolver, covered by an app/core/plugin version-parity regression. Close before
supporting independent major upgrades by generating an optional typed adapter from
installed metadata, without weakening the contract. No fake success is accepted.

S2 also completes B2 for a newly added generated memory client: replace the records
placeholder only when its entire formatted contents exactly match the scaffold
source. Authored loaders and already-connected loaders are preserved. This is the
safe template-owned path contemplated by B2; arbitrary clients are not inspected.
