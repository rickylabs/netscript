---
layout: layouts/base.vto
title: Data & persistence
description: Prisma databases, KV, queues, and cron.
templateEngine: [vento, md]
---

# Data & persistence

This section covers where a NetScript app keeps its state and how a schema change ships.

**Records** (durable, relational, queried with a typed client) live in the
[database layer](/data-persistence/database/), where every plugin contributes its models to the same
datasource. **Execution state** (caches, sessions, work queues, scheduled ticks) lives in
[KV, queues & cron](/data-persistence/kv-queues-cron/), provider-agnostic packages that run on
zero-config local backends until [Aspire](/explanation/aspire/) provisions the production ones. One
`.prisma` edit and one `netscript db generate` regenerate the typed client and the matching zod
schemas, and the same `netscript db` workflow creates the migration, so a model change is one cycle
rather than three separate updates that an agent or a person can miss.

{{ comp.cardsGrid({ columns: 3, cards: [
  { eyebrow: "Concept", title: "Database & Prisma", body: "Schema aggregation, the generated Deno client and the driver adapters.", href: "/data-persistence/database/" },
  { eyebrow: "Concept", title: "KV, queues & cron", body: "Provider-agnostic state, queues and schedules with local fallbacks.", href: "/data-persistence/kv-queues-cron/" },
  { eyebrow: "Tutorial", title: "Storefront: data contracts", body: "Cart contracts back a real database schema from chapter 3 on.", href: "/tutorials/storefront/03-cart-contracts/" },
  { eyebrow: "How-to", title: "Migrate the database", body: "Initialize and migrate the primary datasource.", href: "/data-persistence/how-to/database-migration/" },
  { eyebrow: "How-to", title: "Use a second database", body: "Add and address another datasource from the workspace.", href: "/data-persistence/how-to/use-a-second-database/" },
  { eyebrow: "How-to", title: "Use KV, queues, and cron", body: "Enqueue and consume, read and write KV, schedule a job.", href: "/data-persistence/how-to/queue-kv-cron/" },
  { eyebrow: "How-to", title: "Choose a queue provider", body: "Auto-discovery, explicit providers and the PostgreSQL backend.", href: "/data-persistence/how-to/choose-a-queue-provider/" },
  { eyebrow: "Reference", title: "`@netscript/database`", body: "API reference for the database package.", href: resolveXref("ref:database").href },
  { eyebrow: "Reference", title: "`@netscript/kv`", body: "API reference for the KV package.", href: "/reference/kv/" }
] }) }}
