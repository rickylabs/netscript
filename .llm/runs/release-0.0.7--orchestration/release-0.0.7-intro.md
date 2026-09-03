NetScript 0.0.7 brings the Aspire integration onto the coordinated 13.5.3 release, expands typed
client and worker APIs, and makes generated applications more complete and easier to operate.

- Aspire owns endpoint allocation; generated apps use listener-based readiness, validated service
  references, bounded database commands, and the shared telemetry-endpoint resolver. MCP guidance
  and shipped integration resources follow the same 13.5.3 train.
- SDK clients gain typed bearer and locale contributions, contract-driven procedure metadata and
  request/cache policy, browser-safe entrypoints, and exact typed contract-error propagation.
- Workers deliver durable progress in FIFO order and carry job policy plus literal payload/result
  types through installed registries. Saga publish receipts and tracing also become more explicit.
- CLI resource-slice generation and collision-safe service clients connect contracts, services and
  Fresh applications. Generated production builds exclude the development-only design surface.
- Fresh improvements cover partial navigation, typed routes, forms and hydration freshness. AI
  tooling gains cancellation propagation, context-aware handlers and isolated MCP-pool failures.
- Canonical cross-host agent skills and structured validation reports reduce duplicated guidance
  and make failed checks actionable. Database examples and migration documentation are refreshed.

Breaking API details and migration notes are recorded in the package changelog and documentation;
notably, SDK safe failures use undefined data and lazy server cache setup is explicit outside
defineFreshApp. The Prisma-next database architecture remains an RFC, not a shipped database rewrite.

Use the root README's configuration-specific prerequisites. Its PostgreSQL/cache walkthrough uses
containers, but NetScript and Aspire do not require Docker for every configuration. Normal image
and dependency caches are supported; users do not need to clear them before installation.
