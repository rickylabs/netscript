---
layout: layouts/base.vto
title: Identity and Access
templateEngine: [vento, md]
---

# Identity & Access

**One env var and five endpoints separate a scaffolded workspace from a working OAuth sign-in —
and the boundaries fail loud with typed errors instead of degrading to a silent anonymous
session.**

Identity & Access covers the Principal model, authentication backends, sessions, roles, scopes, and
claims. Use this pillar when you are adding sign-in, selecting a backend, or reasoning about how
identity flows through services and pages.

Auth is where an agent-assembled backend most easily *looks* done without *being* done — the
mis-wired flow compiles, demos, and ships. NetScript's answer is to keep the security conventions
in the contract itself: `NETSCRIPT_AUTH_BACKEND` selects exactly one active backend, every backend
normalizes to the same `Principal`, unsupported operations fail loud with typed errors, and the
redacted audit surface refuses to run without a salt. The full story — including the concrete
failure modes the contract closes off — is on the
[Authentication](/identity-access/auth/) page.

{{ comp.cardsGrid({ columns: 3, cards: [
  { eyebrow: "Capability", title: "Authentication", body: "The auth plugin story: one active backend, five endpoints, fail-loud typed boundaries, and the salt-gated audit surface.", href: "/identity-access/auth/", icon: "C" },
  { eyebrow: "Overview & Concepts", title: "Auth model", body: "Principal, session, backend, and authorization vocabulary.", href: "/explanation/auth-model/", icon: "O" },
  { eyebrow: "Quickstart", title: "Workspace auth", body: "Add authentication in the Workspace tutorial.", href: "/tutorials/workspace/02-auth/", icon: "Q" },
  { eyebrow: "How-To", title: "Add authentication", body: "Wire authentication into a generated workspace.", href: "/how-to/add-authentication/", icon: "H" },
  { eyebrow: "How-To", title: "better-auth plugins", body: "Mount better-auth plugins through a typed passthrough; bearer and jwt run as-is, table-backed and interactive plugins carry caveats.", href: "/identity-access/better-auth-plugins/", icon: "H" },
  { eyebrow: "API Reference", title: "auth backends", body: "Generated symbols for auth, better-auth, kv-oauth, and WorkOS packages.", href: "/reference/auth/", icon: "R" },
  { eyebrow: "API Reference", title: "plugin auth", body: "Generated plugin-auth package symbols.", href: "/reference/plugin-auth/", icon: "R" }
] }) }}
