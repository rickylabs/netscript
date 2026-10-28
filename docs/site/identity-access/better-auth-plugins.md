---
layout: layouts/base.vto
title: better-auth plugins
templateEngine: [vento, md]
prev: { label: "Authentication", href: "/identity-access/auth/" }
next: { label: "Session lifecycles", href: "/identity-access/session-lifecycles/" }
order: 2
---

# better-auth plugins

This page shows how to enable [better-auth](https://www.better-auth.com/) plugins on NetScript's
better-auth backend, what each kind of plugin needs before it runs, and how to protect a route with
the session it resolves. better-auth ships its features as plugins: organizations, two-factor, API
keys, bearer and JWT tokens, magic links, passkeys and more. NetScript mounts them through a typed
passthrough on `createNetscriptBetterAuth` and keeps ownership of the Prisma-backed database adapter.

## Enabling a plugin

`createNetscriptBetterAuth` accepts a `plugins` array typed as better-auth's own
`BetterAuthOptions["plugins"]`. Pass plugin instances exactly as better-auth documents them;
NetScript forwards them into the underlying better-auth server and supplies the Prisma adapter
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

For better-auth options that NetScript does not surface directly, use `betterAuthOptions`, typed as
`Omit<BetterAuthOptions, "database" | "plugins">`. Both keys are excluded because NetScript owns
`database` through its Prisma adapter and plugins have the dedicated `plugins` field.

With the `organization` plugin enabled, the active-organization fields better-auth writes onto the
session (`activeOrganizationId`, role, roles and permissions) and the user's roles flow through
NetScript's authenticator onto the `Principal` scopes, roles and claims. Downstream services and
pages can authorize on organization context with no extra wiring.

## Plugin prerequisites

A plugin enabled through the passthrough type-checks and is mounted at the better-auth layer.
Whether it runs depends on what it needs at runtime:

| Plugins | What they need | Through NetScript |
| --- | --- | --- |
| `bearer`, `jwt` | No tables of their own. | Run as-is, with no further setup. |
| `organization`, `twoFactor`, `admin`, `apiKey` | Their own database tables. | Run once you generate and apply those tables with your database and Prisma tools; `netscript db` does not generate them. |
| Interactive plugins, such as magic links and passkeys | better-auth's own handlers to drive sign-in. | NetScript verifies the session cookie they establish. Its `signin` and `callback` endpoints return `AUTH_PROVIDER_ERROR` on this backend. |

<!-- caveat: arch-debt:seamless-auth-roadmap -->

[Session lifecycles](/identity-access/session-lifecycles/#better-auth-mounting-and-header-forwarding)
shows how to mount better-auth's handler next to NetScript's verification.

## Protect a route with the resolved session

`createBetterAuthBackend` returns an `AuthBackendPort`. A page or API route needs
`backend.sessions.getSession({ request })`, which validates the request's better-auth session cookie
through `auth.api.getSession` and returns the normalized `AuthSession` or `undefined`. Map that
session to a `Principal` with `backend.principalMapper.mapSessionToPrincipal(session)` to get the
scopes and roles to authorize on. Create one shared backend instance for the app:

```ts
// server/auth-backend.ts — one shared backend instance for the app
import { auth } from './better-auth.ts'; // your createNetscriptBetterAuth(...) instance
import { createBetterAuthBackend } from '@netscript/auth-better-auth';

export const backend = createBetterAuthBackend({
  auth,
  sessionTokenSecret: Deno.env.get('BETTER_AUTH_SECRET')!,
});
```

This Fresh route requires an **active** session and an `admin` role, and fails closed on both:

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

`getSession` returns a typed `AuthSession | undefined` and the state check is explicit, so the route
cannot fall back to an anonymous render; the [authentication](/identity-access/auth/) page describes
the same fail-loud rule for the backend port. A machine-to-machine API route has the same shape:
replace the redirect with `throw new HttpError(401)`.

## Revocation and the cookie cache

better-auth can keep a signed copy of the session in a `session_data` cookie
(`session.cookieCache`) so its own reads skip the database. A revoked session's cache cookie stays
valid until its `maxAge`, which defaults to 300 seconds in better-auth.

`@netscript/auth-better-auth` never trusts that cache: its authenticator and
`backend.sessions.getSession` pass `query: { disableCookieCache: true }`, which is better-auth's own
guidance for sensitive reads. Through NetScript, a revoked session therefore stops authenticating on
the next request, on every device, including after `signout { everywhere: true }` (which wraps
better-auth's `api.revokeSessions`). The cost is one session-store read per NetScript
authentication, the same as running better-auth without the cookie cache.

> [!CAUTION]
> Outside NetScript, a revoked session can stay valid until `maxAge`. better-auth's own
> `/api/auth/*` endpoints and client helpers still honor a cached `session_data` cookie, and the
> NetScript signout response does not expire the caller's better-auth cookies. If your app reads
> sessions from better-auth directly for a sensitive decision, pass `disableCookieCache` there too,
> or keep `session.cookieCache.maxAge` short.

The signout response carries no better-auth cookies because better-auth's `revokeSessions` sets
none, and better-auth has no interactive sign-out port through which they would arrive. The auth
service forwards backend `Set-Cookie` headers only from interactive sign-out flows.

## Next steps

[Session lifecycles](/identity-access/session-lifecycles/) shows how to mount
better-auth's handler and forward refreshed session headers.

- {{ comp.xref({ key: "explain:auth-model" }) }}: how Principals, sessions and backends fit together.
- {{ comp.xref({ key: "cap:auth" }) }}: the authentication capability overview.
- [Reference: auth-better-auth](/reference/auth-better-auth/): generated symbols for every export
  shown here.

{{ comp.nextPrev({ prev: { label: "Authentication", href: "/identity-access/auth/" }, next: { label: "Session lifecycles", href: "/identity-access/session-lifecycles/" } }) }}
