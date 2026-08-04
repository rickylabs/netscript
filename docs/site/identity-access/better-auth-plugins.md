---
layout: layouts/base.vto
title: better-auth plugins
templateEngine: [vento, md]
prev: { label: "Authentication", href: "/identity-access/auth/" }
next: { label: "Session lifecycles", href: "/identity-access/session-lifecycles/" }
order: 2
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

{{ comp callout { type: "important", title: "Manual Schema Integration Boundary" } }}
Database schema management for table-backed plugins (`organization`, `twoFactor`, `admin`, `apiKey`) is currently decoupled from NetScript's automatic scaffolding. This boundary exists because automated schema discovery for dynamic third-party extensions requires a dedicated CLI integration step. Today, you must generate and apply the required database tables manually using your primary database/Prisma tools. A unified `netscript db` scaffold integration that automates this step is tracked under roadmap item R1.
<!-- caveat: arch-debt:seamless-auth-roadmap -->
{{ /comp }}

### Interactive plugins are driven by better-auth directly

{{ comp callout { type: "note", title: "Session Verification Trust Boundary" } }}
NetScript's Better-Auth backend adapter operates as a non-interactive session-verification layer, meaning core endpoints like `/signin` and `/callback` reject interactive flows with `AUTH_PROVIDER_ERROR`. This design boundary separates runtime verification from dynamic redirection flows to optimize session-validation path simplicity. Today, interactive authentication (such as magic links or passkeys) must be driven directly via Better-Auth's own handlers, leaving NetScript to verify the established session cookie. Implementing a first-class `InteractiveFlowPort` for the Better-Auth adapter is tracked under roadmap item R2.
<!-- caveat: arch-debt:seamless-auth-roadmap -->
{{ /comp }}

## Protect a route with the resolved session

`createBetterAuthBackend` returns an `AuthBackendPort`, and the piece a page or API route needs is
`backend.sessions.getSession({ request })`: it validates the request's better-auth session cookie
through `auth.api.getSession` and returns the normalized `AuthSession` (or `undefined`). Map that
session to a `Principal` with `backend.principalMapper.mapSessionToPrincipal(session)` and you have
the scopes and roles to authorize on. The example below gates a Fresh route on an **active** session
and an `admin` role, failing closed on both.

```ts
// server/auth-backend.ts — one shared backend instance for the app
import { auth } from './better-auth.ts'; // your createNetscriptBetterAuth(...) instance
import { createBetterAuthBackend } from '@netscript/auth-better-auth';

export const backend = createBetterAuthBackend({
  auth,
  sessionTokenSecret: Deno.env.get('BETTER_AUTH_SECRET')!,
});
```

```tsx
// routes/admin/index.tsx — a page that only an authenticated admin can load
import { HttpError } from 'fresh';
import type { AuthnRequest } from '@netscript/service/auth';
import { define } from '@/utils/state.ts';
import { backend } from '../../server/auth-backend.ts';

// Adapt the Fresh Request into the AuthnRequest the backend port reads.
function toAuthnRequest(req: Request): AuthnRequest {
  const url = new URL(req.url);
  return {
    header: (name) => req.headers.get(name) ?? undefined,
    headers: () => req.headers,
    cookie: (name) =>
      req.headers.get('cookie')
        ?.split('; ')
        .find((c) => c.startsWith(`${name}=`))
        ?.slice(name.length + 1),
    method: req.method,
    path: url.pathname,
  };
}

export const handler = define.handlers(async (ctx) => {
  // Resolve the session from the request's better-auth cookie.
  const session = await backend.sessions.getSession({
    request: toAuthnRequest(ctx.req),
  });

  // Fail closed: no active session → redirect to sign-in, never render anonymously.
  if (!session || session.state !== 'active') {
    return ctx.redirect('/api/v1/auth/signin');
  }

  // Map to a NetScript Principal and authorize on its roles.
  const { principal } = backend.principalMapper.mapSessionToPrincipal(session);
  if (!principal.roles.includes('admin')) {
    throw new HttpError(403);
  }

  return { data: { subject: principal.subject, roles: principal.roles } };
});

export default define.page<typeof handler>(({ data }) => (
  <main>
    <h1>Admin dashboard</h1>
    <p>Signed in as {data.subject} — roles: {data.roles.join(', ')}</p>
  </main>
));
```

Because `getSession` returns a typed `AuthSession | undefined` and the state check is explicit, the
route cannot silently degrade to an anonymous render — the same fail-loud discipline the
[authentication](/identity-access/auth/) page describes for the backend port. A machine-to-machine
API route follows the identical shape: swap the redirect for `throw new HttpError(401)`.

## Where to go next

- {{ comp.xref({ key: "explain:auth-model" }) }} — how Principals, sessions, and backends fit
  together.
- {{ comp.xref({ key: "cap:auth" }) }} — the authentication capability overview.
- [Reference: auth-better-auth](/reference/auth-better-auth/) — generated symbols for every export
  shown here.

{{ comp.nextPrev({ prev: { label: "Authentication", href: "/identity-access/auth/" }, next: { label: "Session lifecycles", href: "/identity-access/session-lifecycles/" } }) }}
