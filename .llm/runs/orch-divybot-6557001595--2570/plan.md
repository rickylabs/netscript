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
| orders | `/records`, `/records/[id]`: PageHeader, table, detail composition, fields | Contract-derived list and get from generated service; no service displays exact `netscript service add records` guidance; empty service collection points to its existing create flow; detail handles missing records and auth distinctly. |
| settings | `/settings`: local section rail plus two-column form built from FormField/Input/Select/Switch | Actual browser appearance preferences with Save/Discard persistence; generated project/theme identity read-only. Auth/security absent state names `netscript plugin add auth`. No pretend store, payment or deletion controls. |
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
  clients/UI flows; absent panels show `netscript plugin add workers`,
  `netscript plugin add streams`, `netscript plugin add ai`. A plugin with no
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
- Shared styles budgets: keep registry CSS unchanged; measure app CSS separately.
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
