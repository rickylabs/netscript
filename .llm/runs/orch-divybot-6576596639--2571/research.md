# Research

Baseline is merged provider-boundary fix #2594. #2586/#2589 Utility pages,
#2579 sample data/projections, and #2578/#2591 plugin wiring are present.
The open #2577 is the earlier, partial Northwind foundation; its bespoke pages
predate these shared templates and do not cover this assignment. #2590 owns
generic AI MCP discovery and remains independent. Do not duplicate either PR.

`PresetRegistry` currently has no entries. Both init commands reject `--from`
before execution. `validateOptions` owns resolved scaffold choices. The shared
pipeline emits one canonical set of Utility pages and typed service adapters.
The preset can compose that output without forking the pages.

Sample rows already provide realistic statuses, signed minor units, owner data,
and sixty days of dates. The generic Prisma model can be named `Order`; the
showcase adds related customers, products and line items rather than replacing
the generic CRUD service. Existing application mutations publish record events
through the linked stream. Workers have durable execution/progress contracts;
sagas have T1 state/history and an explicit publish contract; triggers enqueue
existing jobs through the public builder.

No memory service is exposed. Read the tracked #2579/#2587/#2593 memory notes.
Deno 2.9.7 is installed; RTK is absent. Docker is installed but its daemon is
currently unavailable. Runtime and visual evidence remain unproven until executed.

JSR surface scan: no new package exports or dependencies are planned. All new
business contracts are generated app-owned modules with explicit Zod schemas.
CLI assets must be embedded and publish carriers regenerated in canonical order.
