---
layout: layouts/base.vto
title: Data and Persistence
templateEngine: [vento, md]
---

# Data & Persistence

**Edit one schema file, run one generate, and every consumer follows** — the typed Prisma
client, the matching zod validation schemas, and the migration all come out of the same
`netscript db` workflow. That matters most when the one doing the editing is an AI agent:
persistence is where a generated backend usually drifts, because a model change normally
fans out into separate client, validation, and migration updates — each one a turn that
can be missed. NetScript folds those into one cycle.

The pillar splits state along one line. **Records** — durable, relational, queried with a
typed client — live in the [database layer](/data-persistence/database/), where every
plugin contributes its own models to the same datasource. **Execution state** — caches,
sessions, work queues, scheduled ticks — lives in
[KV, queues & cron](/data-persistence/kv-queues-cron/), provider-agnostic packages that
run on zero-config local backends until [Aspire](/explanation/aspire/) provisions the
production ones. The scaffold uses both from day one: Postgres for records, Redis/KV for
execution state.

Start here when the question is where state lives, how schema changes ship, or how the
workspace resolves a second database.

{{ comp.cardsGrid({ columns: 3, cards: [
  { eyebrow: "Overview & Concepts", title: "Database and KV", body: "The persistence layer behind services, queues, and workflow state.", href: "/data-persistence/database/", icon: "O" },
  { eyebrow: "Quickstart", title: "Data contracts", body: "Follow the Storefront data step before service and saga work expand it.", href: "/tutorials/storefront/03-cart-contracts/", icon: "Q" },
  { eyebrow: "How-To", title: "Database and migration", body: "Initialize and migrate the primary datasource.", href: "/data-persistence/how-to/database-migration/", icon: "H" },
  { eyebrow: "How-To", title: "Second database", body: "Add and address another datasource from the workspace.", href: "/data-persistence/how-to/use-a-second-database/", icon: "H" },
  { eyebrow: "API Reference", title: "database", body: "Generated database package symbols.", href: "/reference/database/", icon: "R" },
  { eyebrow: "API Reference", title: "kv and Prisma adapter", body: "Generated KV and adapter package symbols.", href: "/reference/kv/", icon: "R" }
] }) }}

## Learn, do, look up

{{ comp.cardsGrid({ columns: 4, cards: [
  { eyebrow: "Learn", title: "Storefront tutorial", body: "Cart contracts back a real database schema from chapter 3 on.", href: resolveXref("tut:storefront").href },
  { eyebrow: "Do", title: "Recipes", body: "Task-oriented recipes for this area, one problem each.", href: "/data-persistence/how-to/" },
  { eyebrow: "Look up", title: "`@netscript/database` reference", body: "Generated API reference. Related units: `kv`, `prisma-adapter-mysql`.", href: resolveXref("ref:database").href },
  { eyebrow: "Understand", title: "Architecture", body: "The design rationale behind this pillar.", href: resolveXref("explain:architecture").href },
] }) }}
