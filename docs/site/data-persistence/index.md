---
layout: layouts/base.vto
title: Data and Persistence
templateEngine: [vento, md]
---

# Data & Persistence

Data & Persistence covers database setup, migrations, multiple datasource wiring, KV, and adapter
packages. Start here when the question is where state lives, how schema changes ship, or how the
workspace resolves a second database.

{{ comp.cardsGrid({ columns: 3, cards: [
  { eyebrow: "Overview & Concepts", title: "Database and KV", body: "The persistence layer behind services, queues, and workflow state.", href: "/capabilities/database/", icon: "O" },
  { eyebrow: "Quickstart", title: "Data contracts", body: "Follow the Storefront data step before service and saga work expand it.", href: "/tutorials/storefront/03-cart-contracts/", icon: "Q" },
  { eyebrow: "How-To", title: "Database and migration", body: "Initialize and migrate the primary datasource.", href: "/how-to/database-migration/", icon: "H" },
  { eyebrow: "How-To", title: "Second database", body: "Add and address another datasource from the workspace.", href: "/how-to/use-a-second-database/", icon: "H" },
  { eyebrow: "API Reference", title: "database", body: "Generated database package symbols.", href: "/reference/database/", icon: "R" },
  { eyebrow: "API Reference", title: "kv and Prisma adapter", body: "Generated KV and adapter package symbols.", href: "/reference/kv/", icon: "R" }
] }) }}
