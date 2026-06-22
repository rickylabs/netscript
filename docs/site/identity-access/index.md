---
layout: layouts/base.vto
title: Identity and Access
templateEngine: [vento, md]
---

# Identity & Access

Identity & Access covers the Principal model, authentication backends, sessions, roles, scopes, and
claims. Use this pillar when you are adding sign-in, selecting a backend, or reasoning about how
identity flows through services and pages.

{{ comp.cardsGrid({ columns: 3, cards: [
  { eyebrow: "Overview & Concepts", title: "Auth model", body: "Principal, session, backend, and authorization vocabulary.", href: "/explanation/auth-model/", icon: "O" },
  { eyebrow: "Quickstart", title: "Workspace auth", body: "Add authentication in the Workspace tutorial.", href: "/tutorials/workspace/02-auth/", icon: "Q" },
  { eyebrow: "How-To", title: "Add authentication", body: "Wire authentication into a generated workspace.", href: "/how-to/add-authentication/", icon: "H" },
  { eyebrow: "How-To", title: "better-auth plugins", body: "Placeholder for the plugin path gated by PR #108.", href: "/identity-access/better-auth-plugins/", icon: "H" },
  { eyebrow: "API Reference", title: "auth backends", body: "Generated symbols for auth, better-auth, kv-oauth, and WorkOS packages.", href: "/reference/auth/", icon: "R" },
  { eyebrow: "API Reference", title: "plugin auth", body: "Generated plugin-auth package symbols.", href: "/reference/plugin-auth/", icon: "R" }
] }) }}
