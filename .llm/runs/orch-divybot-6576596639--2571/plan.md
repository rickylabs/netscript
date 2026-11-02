# Northwind showcase plan

Archetype 6 CLI/tooling, frontend and service overlays. Preserve the CLI's
kernel/surface split (doctrine verdict: Keep). One branch and one draft PR.

## Locked decisions

- Selector: `init northwind --from showcase`. Default init emits identical bytes.
- The preset resolves an orders service, Order model, and SQLite by default.
  PostgreSQL is supported; database-free and Aspire-free invocations fail early.
- Compose the canonical Utility pages with preset vocabulary and additive detail
  content. Keep projections, charts, filters, settings, sign-in and command palette.
- Add Customer, Product and OrderLine Prisma models. Reuse the existing dated
  sample rows as the order backbone and derive totals from seeded line items.
- Use the installed plugin commands and generated registries for workers, sagas,
  triggers and streams. A generated setup task performs the complete documented
  recipe; it owns no parallel plugin installer or framework runtime.
- Fulfilment is a durable worker job; order/payment/shipping are actual saga
  transitions. A webhook uses the existing trigger enqueue builder. Order detail
  shows real progress/history and Overview reads the existing stream activity.
- Optional AI stays server-only across the build boundary. No model key produces
  a designed connection state. CI must use a stub if connected chat is delivered.
- Public artifacts use repository-relative paths and contain no session IDs.

## Slices

1. S0: research/design and draft PR (this run directory).
2. S1: preset contract, additive commerce assets and setup recipe; canonical
   scaffold writer/manifest integration; semantic selector/default-isolation tests.
3. S2: live background workflow, order detail, customer/product pages and chat
   connection state; generated runtime tests and documented walkthrough.
4. S3: carrier regeneration, production build, full configured checks, independent
   source and visual review, CI runtime evidence and final handoff.

Each implementation slice updates worklog/context and receives independent source
review before sign-off. No framework API redesign or replacement runtime is planned.

## Gates and risks

Run structured scoped check/test/lint/fmt wrappers, quality:gate, root configured
checks, CLI publish dry run, generated workspace checks, provider-boundary gate,
the documented showcase runtime walkthrough (negative then positive), and a build
using packed/published packages. Run the canonical scaffold.runtime suite in CI.
Review every changed page in light/dark at desktop/390px with the Figma references.

Missing daemon is an execution risk: establish an owned runtime or report the
gate unproven; never treat mocks as the background runtime verdict. Dependency
installation must use existing pins. Preserve locks/caches. Runtime failures are
recorded, not suppressed. Separate read-only Sol source and Astra visual sessions
follow the owner's explicit override.

Open decisions: none requiring a new framework contract. AI chat/MCP completeness
is safe to defer only under the owner's explicit time-box allowance, with exact
missing capability stated in the final handoff. Accepted bounded folder-cardinality debt: `cli-showcase-cardinality-2571`,
covering adapters18→19 and scaffold gates93→94; see the central registry and
CLI README deviation, recorded after formal IMPL-EVAL D1.
