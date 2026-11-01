# Northwind showcase implementation plan

## Public surface

`netscript init <name> --example showcase` and maintainer parity produce an opt-in
Northwind commerce workspace. Default init is byte-for-byte unaffected apart from
help/API additions. Keep project/app names customizable; reserve orders/Order for
the showcase's shared typed contract. Default showcase storage is SQLite; support
Postgres where existing plugin installers support it. Reject contradictory explicit
options before writing (db none, no service/Aspire, conflicting service/model names).
Dry-run reports the selected example and planned capabilities without invoking
plugin installers, network mutations or writing generated projects.

The showcase reuses the merged Utility shell, Overview, Records/detail, Settings,
Sign-in and command palette. Add an app-owned durable chat route using shipped UI
components; never duplicate pending #2488 components. Keep the design reference.

## Vocabulary and contracts

Showcase is a closed scaffold example identifier, not a new plugin system or theme
preset. Northwind orders are persisted Prisma rows with stable order reference/name,
customer/company, shipping country, status and integer total cents. Seed through
normal db seed with deterministic idempotent records; never inject display-only rows.
The existing generated orders contract/client is authoritative. Showcase workflow
state is persisted by existing worker/saga/trigger/stream APIs, not app memory.

The order lifecycle demonstrates requested -> payment recorded -> fulfillment ->
shipped with meaningful failure/compensation paths. Payments/shipping are local
commerce simulation steps clearly named as such, not claims of external billing.
A signed webhook or schedule starts the workflow; the app invokes typed procedures,
queries actual execution state and subscribes to real activity. No browser credential
cross-origin topology, hard-coded host ports, curl, ad-hoc polling of fabricated state,
or background work inside the Fresh request server.

Auth uses the shipped BFF/session topology. AI uses the shipped durable chat runtime,
thread persistence and MCP tool integration over orders. Provider credentials and
secrets remain caller configuration; no committed secrets or invented provider
responses. Unconfigured providers get an actionable designed state; tests may use
an explicit deterministic provider fixture, with that evidence distinguished from
an external provider invocation.

## Ports and composition

Reuse InitPipelineContext, ScaffolderPort, FileSystemPort, TemplatePort and ProcessPort.
Use existing public/plugin installer and generator entry points; prefer injected
use-case callbacks over nested CLI invocation where the command composition already
owns them. Preserve maintainer local-source versus public JSR resolution. Compose
a closed ordered showcase recipe after base files/packages exist, before final
format/summary/agent handoff. Fail on installer/generator failure; never report a
partial recipe successful. Keep effects visible in InitResult and JSON output.

No plugin runtime changes are planned. If existing APIs cannot express a required
flow, record the concrete gap before broadening framework scope. Use canonical
schema/contract generation and app routes, never string-rewrite generated TS APIs.

## Constants and contributor path

One closed `ScaffoldExample` identifier and named showcase defaults; no parallel
volatile version/model catalogs. Contributor entry: the showcase recipe module
under CLI scaffold application, linked from packages/cli/README.md. Assets live in
one showcase namespace and use the existing embedded-template carrier. Existing
plugin APIs retain their own constants, registration and generation ownership.

## Sequential commit slices

1. S1: example option/validation and recipe contract; public/maintainer/dry-run/JSON
   parity, no-default-regression tests. Under30 source files.
2. S2: persisted commerce schema/seed, generated orders contract/client and reusable
   Utility pages. Generated typecheck plus actual SQLite seeded list/detail proof.
3. S3: existing workers/sagas/triggers/streams installed and wired to order lifecycle,
   actual status/activity projection, durable/negative behavior tests. No runtime
   implementation duplication; under30 source files.
4. S4: auth BFF and durable AI/MCP orders tools, UI using shipped components,
   provider-missing/error/authorization tests. Under30 source files.
5. S5: dedicated showcase runtime acceptance, independent Figma visual matrix,
   concise Explore the showcase guide, full carrier/quality/docs/release checks.

Every slice records worklog/context and receives independent implementation review
before sign-off. One draft PR opens with the plan commit. No forced pushes.

## Gates

Structured check/lint/fmt and meaningful CLI/scaffold tests per slice, generated
workspace typecheck, quality/architecture, release:preflight, docs:accuracy, all
root check:* carriers under Deno2.9.7. Preserve CSS budgets. Exact scaffold.runtime
attempt plus a showcase-specific runtime proof that checks real rows, workflow
completion/activity, auth/session and chat/MCP behavior. Local Docker preflight is
known unavailable; distinguish focused native Aspire evidence, test provider evidence,
and full runtime UNPROVEN. Seek Docker-capable CI for the full showcase proof.

Independent PLAN-EVAL and IMPL-EVAL: owner-approved Claude Opus5.5 high, read-only,
separate session/vendor, reused across rounds. Independent Astra visual comparison
for every changed page light/dark desktop/mobile, each >=8 fidelity and quality.
Two consecutive terminal review failures stop the loop for an owner decision.

## Deferred scope and parallelism

No new payment/shipping integrations, full Northwind dataset import, plugin runtime
redesign, theme engine changes, component gap duplication, or default-init examples.
The shared orders schema, recipe ordering and runtime harness couple the feature;
keep sequential slices rather than manufacture dependent sibling issues. Other
unfinished #2412 units already have active owners and remain parallel externally.
Parent #2571 stays open until every acceptance item is evidenced; do not close the
epic #2412. No unsupported acceptance checkboxes.
