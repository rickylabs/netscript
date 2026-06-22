---
layout: layouts/base.vto
title: better-auth plugins
templateEngine: [vento, md]
---

# better-auth plugins

[better-auth](https://www.better-auth.com/) ships its feature set as plugins — organizations,
two-factor, API keys, bearer and JWT tokens, magic links, passkeys, and more. NetScript's
better-auth backend mounts them through a single typed passthrough on `createNetscriptBetterAuth`,
so you enable a plugin the same way you would in a standalone better-auth app while NetScript keeps
ownership of the Prisma-backed database adapter.

This page covers how to enable plugins, which ones run as-is, and the two prerequisites — database
tables and interactive sign-in — that decide whether a given plugin is turnkey today.

## Enabling a plugin

`createNetscriptBetterAuth` accepts a `plugins` array typed as better-auth's own
`BetterAuthOptions["plugins"]`. Pass plugin instances exactly as better-auth documents them;
NetScript forwards them into the underlying better-auth server while supplying the Prisma adapter
itself.

```ts
import { organization } from "better-auth/plugins";
import {
  createBetterAuthBackend,
  createNetscriptBetterAuth,
} from "@netscript/auth-better-auth";

const auth = createNetscriptBetterAuth({
  prisma,
  provider: "postgresql",
  secret: Deno.env.get("BETTER_AUTH_SECRET")!,
  plugins: [organization()],
});

const backend = createBetterAuthBackend({
  auth,
  sessionTokenSecret: Deno.env.get("BETTER_AUTH_SECRET")!,
});
```

For better-auth options that NetScript does not surface directly, use `betterAuthOptions` (typed as
`Omit<BetterAuthOptions, "database" | "plugins">`). NetScript owns `database` through its Prisma
adapter, and plugins use the dedicated `plugins` field, so both are excluded from that escape hatch.

When the `organization` plugin is enabled, the active-organization fields better-auth writes onto the
session (`activeOrganizationId`, role, roles, and permissions) and the user's roles flow through
NetScript's authenticator onto the `Principal` — its scopes, roles, and claims — so downstream
services and pages can authorize on organization context without any extra wiring.

## What runs today, and what needs a prerequisite

A plugin enabled through the passthrough type-checks and is mounted at the better-auth layer. Whether
it is *runnable* depends on what the plugin needs at runtime.

### Stateless plugins run as-is

`bearer` and `jwt` add no tables of their own. They run through the passthrough alone, with no
further setup.

### Table-backed plugins need a schema migration

{{ comp callout { type: "warning", title: "Generate and migrate the plugin schema first" } }}
`organization`, `twoFactor`, `admin`, and `apiKey` store state in their own better-auth tables.
Enabling them through the passthrough mounts them at the better-auth layer, but they fail at runtime
until their better-auth schema has been generated and migrated into your database. A turnkey
schema-generation path is on the roadmap; until it lands, generate and apply the better-auth schema
for these plugins before depending on them.
<!-- caveat: arch-debt:seamless-auth-roadmap -->
{{ /comp }}

### Interactive plugins are driven by better-auth directly

{{ comp callout { type: "note", title: "Interactive sign-in is owned by better-auth" } }}
`magicLink` and `passkey` sign-in are interactive flows. NetScript's better-auth backend is
non-interactive, so its `/signin` and `/callback` endpoints return `AUTH_PROVIDER_ERROR`. Drive those
flows against better-auth's own handler and let NetScript verify the resulting session. An
interactive-flow seam for the better-auth backend is tracked on the roadmap.
<!-- caveat: arch-debt:seamless-auth-roadmap -->
{{ /comp }}

## Where to go next

- {{ comp.xref({ key: "explain:auth-model" }) }} — how Principals, sessions, and backends fit
  together.
- {{ comp.xref({ key: "cap:auth" }) }} — the authentication capability overview.
- [Reference: auth-better-auth](/reference/auth-better-auth/) — generated symbols for every export
  shown here.
