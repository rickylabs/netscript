---
layout: layouts/base.vto
title: Identity and Access
templateEngine: [vento, md]
---

# Identity & Access

Identity & Access covers sign-in, sessions and the `Principal` that services authorize against.
Start here when you add authentication, choose a backend or trace how identity reaches a service.

The `auth` plugin runs exactly one backend, selected by `NETSCRIPT_AUTH_BACKEND`. Every backend
normalizes to the same `Principal`, and an operation a backend cannot perform fails with a typed
error instead of falling back to an anonymous session.

{{ comp.cardsGrid({ columns: 3, cards: [
  { eyebrow: "Concept", title: "Authentication", body: "The auth plugin: one active backend, the `auth-api` surface, typed failures and the audit surface.", href: "/identity-access/auth/" },
  { eyebrow: "Concept", title: "better-auth plugins", body: "Mount better-auth plugins through a typed passthrough, and what each kind needs to run.", href: "/identity-access/better-auth-plugins/" },
  { eyebrow: "Concept", title: "Session lifecycles", body: "Mount handlers, redirect, handle callbacks, check return URLs and forward refreshed cookies.", href: "/identity-access/session-lifecycles/" },
  { eyebrow: "How-to", title: "Add authentication", body: "Install the auth plugin in a workspace and sign in through the generated app.", href: "/identity-access/how-to/add-authentication/" },
  { eyebrow: "Recipes", title: "Recipes", body: "Task recipes for this area, one problem each.", href: "/identity-access/how-to/" },
  { eyebrow: "Tutorial", title: "Workspace auth", body: "Add authentication in the Team Workspace tutorial, then authorize routes on it.", href: "/tutorials/workspace/02-auth/" },
  { eyebrow: "Explanation", title: "Auth model", body: "Principal, session, backend and authorization: why auth is a pure-backend port.", href: "/explanation/auth-model/" },
  { eyebrow: "Reference", title: "Auth packages", body: "The auth plugin, its core contracts, and the three backend adapters.", href: "/reference/plugin-auth/" }
] }) }}
