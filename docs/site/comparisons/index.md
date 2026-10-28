---
layout: layouts/base.vto
title: Comparisons
description: See how NetScript composes complete frontend and backend features against leading frameworks.
templateEngine: [vento, md]
order: 1
---

# Compare NetScript

These pages build the same feature in NetScript and in other frameworks, side by side, so you can
compare the code directly. [Why NetScript](/why/) covers the positioning and the trade-offs.

{{ comp.cardsGrid({ columns: 2, cards: [
  {
    eyebrow: "Frontend",
    title: "NetScript vs frontend frameworks",
    body: "One detail page, compared with Next.js, Nuxt, SvelteKit, and TanStack Start.",
    href: "/comparisons/frontend/",
  },
  {
    eyebrow: "Backend",
    title: "NetScript vs backend frameworks",
    body: "One typed endpoint and job, compared with Nest.js, Hono, and Encore.dev.",
    href: "/comparisons/backend/",
  },
] }) }}
