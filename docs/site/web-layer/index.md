---
layout: layouts/base.vto
title: Web Layer
templateEngine: [vento, md]
---

# Web Layer

The Web Layer covers `@netscript/fresh`: server-rendered pages, route contracts, cache-aware data
loading, forms, islands, streaming, Vite integration, diagnostics, and page testing. Start here when
you are building the browser-facing surface that calls typed services through the same contracts as
the backend.

{{ comp.cardsGrid({ columns: 3, cards: [
  { eyebrow: "Overview & Concepts", title: "Fresh page model", body: "Server rendering, islands, route contracts, layers, partials, and shared query cache.", href: "/web-layer/server/", icon: "O" },
  { eyebrow: "Quickstart", title: "Live dashboard", body: "Build a Fresh page backed by a typed SDK client and a cache-first QueryIsland.", href: "/tutorials/live-dashboard/", icon: "Q" },
  { eyebrow: "How-To", title: "Customize Fresh UI", body: "Adjust the generated UI layer and design-system surface.", href: "/how-to/customize-fresh-ui/", icon: "H" },
  { eyebrow: "How-To", title: "Server-validated form", body: "Build a form that validates and mutates on the server.", href: "/how-to/build-a-server-validated-form/", icon: "H" },
  { eyebrow: "API Reference", title: "@netscript/fresh", body: "Generated symbols for the Fresh framework package.", href: "/reference/fresh/", icon: "R" },
  { eyebrow: "API Reference", title: "@netscript/fresh-ui", body: "Generated symbols for the companion UI package.", href: "/reference/fresh-ui/", icon: "R" }
] }) }}
