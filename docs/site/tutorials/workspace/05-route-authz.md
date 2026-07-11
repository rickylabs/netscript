---
layout: layouts/base.vto
title: Protect routes with authz
templateEngine: [vento, md]
prev: { label: "4 · Provision job", href: "/tutorials/workspace/04-provision-job/" }
next: { label: "6 · Deploy", href: "/tutorials/workspace/06-deploy/" }
---

# Protect routes with authz

Your `workspace` service still answers anyone — and after chapters 3 and 4 it fronts data with real
consequences: the member list of a specific team. The route that returns it has to do two things at
once, and both must be typed. It has to know *which* team is being asked for — a `workspace` id in
the path, not a string you fish out of the URL by hand — and it has to **fail closed**: no credential
means `401` before the handler runs, and a valid credential without the right scope means `403`.

This chapter builds exactly that pair. You declare the members route once as a **bound route
contract** — `createRouteReference` / `defineRouteContract` + `bindRoutePattern` from
`@netscript/fresh/route` — so the URL pattern, the typed `{ workspace }` path param, and the
pagination search all come from a single object your service and any client share. Then you layer the
`.withAuthn()` / `.withAuthz()` guard from `@netscript/service/auth` on top of it — the seam
NetScript ships and proves in its own `builder-auth` test suite. The result is the combination this
chapter's title promises: a **typed route and its authorization gate, from one source of truth.**

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/workspace/01-scaffold/" },
  { label: "2 · Auth", href: "/tutorials/workspace/02-auth/" },
  { label: "3 · Workspace data", href: "/tutorials/workspace/03-workspace-data/" },
  { label: "4 · Provision job", href: "/tutorials/workspace/04-provision-job/" },
  { label: "5 · Route authz", href: "/tutorials/workspace/05-route-authz/" },
  { label: "6 · Deploy", href: "/tutorials/workspace/06-deploy/" }
] }) }}

## What you will build

A guarded `GET /api/workspace/:workspace/members` route. One bound route contract declares its
pattern, its typed `{ workspace }` path param, and its typed `limit`/`offset` pagination. The service
registers that route, reads its params **through the contract** (no hand-parsing), and gates it with
`.withAuthn()` (which turns each request into a `Principal`) and `.withAuthz()` (which decides whether
that principal may reach the route). By the end an unauthenticated request returns `401 UNAUTHORIZED`,
a request with the wrong scope returns `403 FORBIDDEN`, and a correctly-scoped request returns `200`
with a typed member list — the exact three outcomes the framework's own test asserts.

## Prerequisites

- The `workspace` service and its typed contracts from
  [chapter 1](/tutorials/workspace/01-scaffold/).
- The `Member` model and the `workspaceDb` client from
  [chapter 3](/tutorials/workspace/03-workspace-data/) — the route lists members from that datasource.
- The route-authz seam is built into `@netscript/service`, and the route contract into
  `@netscript/fresh/route`; neither needs Aspire or the auth plugin to type-check, though you run the
  service under Aspire to exercise it live.

Confirm the workspace still builds before you change it:

```sh
# In my-workspace/
deno task check
```

{{ comp callout { type: "note", title: "Two layers, one Principal" } }}
The <a href="/tutorials/workspace/02-auth/">auth plugin</a> (chapter 2) signs <em>human users</em> in
and resolves their sessions. The seam in <em>this</em> chapter gates a <strong>service's own
routes</strong> — it is provider-agnostic and built into <code>@netscript/service</code>. Both layers
speak the same <code>Principal</code> type, so they compose: the plugin establishes identity, and a
service's <code>.withAuthn()</code> turns a request into that <code>Principal</code> for an
authorization decision.
{{ /comp }}

## Step 1 — Declare the bound route contract

Before the guard, give the route a typed identity. A route contract from `@netscript/fresh/route` is
the single source of truth for a route's shape: its pattern, its path params, and its search params.
`createRouteReference` infers the `{ workspace }` param straight from the pattern; `defineRouteContract`
+ `bindRoutePattern` add typed pagination search with safe defaults. Create the contract in the shared
`contracts/` tree so the service and any future client import the *same* object:

```ts
// contracts/routes/workspace-members.ts
import {
  bindRoutePattern,
  createRouteReference,
  defineRouteContract,
  fallback,
  paginationSearchSchema,
} from '@netscript/fresh/route';
import { z } from 'zod';

/** The one place the members route pattern is written. */
export const MEMBERS_ROUTE_PATTERN = '/api/workspace/[workspace]/members';

/**
 * The bound members route: typed `{ workspace }` path param + typed
 * `limit`/`offset` pagination, all inferred from this one declaration.
 */
export const membersRoute = bindRoutePattern(
  defineRouteContract({
    // A path schema types the dynamic `[workspace]` segment as a non-empty id.
    pathSchema: z.object({ workspace: z.string().min(1) }),
    // paginationSearchSchema() gives limit/offset with computed defaults.
    searchSchema: paginationSearchSchema({ defaultLimit: 20 }).extend({
      // A junk ?role=banana falls back to undefined instead of throwing.
      role: fallback(z.enum(['member', 'admin']).optional(), undefined),
    }),
  }),
  MEMBERS_ROUTE_PATTERN,
);
```

`bindRoutePattern` returns one object with everything downstream needs: `membersRoute.parsePath(...)`
and `membersRoute.parseSearch(...)` turn raw request params into typed values, and
`membersRoute.href({ path: { workspace } })` builds the URL for a client — so a link and the handler
that answers it can never disagree about the route's shape.

{{ comp.apiTable({
  caption: "@netscript/fresh/route — the bound route contract surface",
  rows: [
    { name: "createRouteReference(pattern)", type: "RouteReference", desc: "Infers typed path params directly from a Fresh route pattern — `/api/workspace/[workspace]/members` yields `{ workspace: string }`." },
    { name: "defineRouteContract({ pathSchema?, searchSchema? })", type: "DefineRouteContract", desc: "Declares typed path and search schemas; bind it to one or more concrete patterns." },
    { name: "bindRoutePattern(contract, pattern)", type: "BoundRouteContract", desc: "Binds the contract to a pattern, returning one object with .parsePath / .parseSearch / .href." },
    { name: "paginationSearchSchema(opts) / fallback(schema, default)", type: "search schema", desc: "Typed limit/offset with computed defaults; fallback() catches junk query strings instead of 500-ing the route." }
  ]
}) }}

{{ comp callout { type: "note", title: "One param name, two path syntaxes" } }}
Route contracts use Fresh's <code>[workspace]</code> pattern syntax; a service (Hono) route registers
the same segment as <code>:workspace</code>. It is the <strong>same param name</strong> either way —
the contract owns the typed shape, and <code>membersRoute.parsePath(c.req.param())</code> in Step 3
bridges the runtime params the service router collected into that typed shape. You write the pattern
once, in the contract.
{{ /comp }}

## Step 2 — Build the authenticator and scope authorizer

Now the guard. Define the credentials and the scope rule. This mirrors the framework's own
`builder-auth_test.ts`: a `read` credential carries the `workspace:read` scope, and the authorizer
requires that scope on the members route. The rule matches the **same prefix** the contract declares,
so what the contract types and what the guard protects stay in lockstep:

```ts
// services/workspace/src/auth.ts
import {
  createScopeAuthorizer,
  createStaticCredentialAuthenticator,
} from '@netscript/service/auth';

export const authenticator = createStaticCredentialAuthenticator({
  credentials: {
    read: {
      subject: 'user:reader',
      scopes: ['workspace:read'],
      roles: ['reader'],
    },
    write: {
      subject: 'user:writer',
      scopes: ['workspace:write'],
      roles: ['writer'],
    },
  },
});

export const authorizer = createScopeAuthorizer({
  rules: [{
    // Guards every /api/workspace/<id>/members request the contract addresses.
    match: (request) => request.path.startsWith('/api/workspace/'),
    requireScopes: ['workspace:read'],
  }],
});
```

{{ comp.apiTable({
  caption: "@netscript/service/auth — the route-authz surface",
  rows: [
    { name: "createStaticCredentialAuthenticator(opts)", type: "AuthenticatorPort", desc: "Maps bearer tokens to principals — each credential carries a subject, scopes, and roles. Good for tests and machine-to-machine callers." },
    { name: "createScopeAuthorizer(opts)", type: "AuthorizerPort", desc: "Rules of { match, requireScopes } — the principal must carry every required scope for a matched route." },
    { name: ".withAuthn({ authenticator, protect?, allowAnonymous? })", type: "builder stage", desc: "protect defaults to ['/api']; allowAnonymous defaults to ['/health']." },
    { name: ".withAuthz({ authorizer, denyByDefault? })", type: "builder stage", desc: "denyByDefault defaults to true — fail closed when no decision is reachable." }
  ]
}) }}

## Step 3 — Register the typed route and layer the guard

Register the members route on the service builder, then apply `.withAuthz()` and `.withAuthn()`. The
handler runs only for an authenticated, authorized caller — and it reads its params **through the
contract**, so `workspace`, `limit`, and `offset` arrive typed, never hand-sliced from the URL:

```ts
// services/workspace/src/main.ts
import { createService } from '@netscript/service';
import type { Principal } from '@netscript/service/auth';
import { membersRoute } from '../../../contracts/routes/workspace-members.ts';
import { workspaceDb } from './db.ts'; // the chapter 3 workspace client
import { authenticator, authorizer } from './auth.ts';

type RouteCtx = {
  get(key: string): unknown;
  json(data: unknown): Response;
  req: { param(): Record<string, string>; url: string };
};

const app = createService({}, { name: 'workspace' })
  .route('get', '/api/workspace/:workspace/members', async (c: unknown) => {
    const ctx = c as RouteCtx;
    // .withAuthn injected the resolved principal; the handler only sees allowed callers.
    const principal = ctx.get('principal') as Principal;

    // Typed off the ONE route contract — no manual URL parsing.
    const { workspace } = membersRoute.parsePath(ctx.req.param());
    const { limit, offset } = membersRoute.parseSearch(new URL(ctx.req.url).searchParams);

    const members = await workspaceDb.member.findMany({
      where: { workspaceId: workspace },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'asc' },
    });

    return ctx.json({ workspace, limit, offset, subject: principal.subject, members });
  })
  .withAuthz({ authorizer })
  .withAuthn({ authenticator })
  .build();

export { app };
```

The route pattern the service registers (`:workspace`) and the contract's pattern (`[workspace]`) name
the same segment; `membersRoute.parsePath(ctx.req.param())` is what turns the router's raw params into
the typed `{ workspace }` the handler uses.

{{ comp callout { type: "note", title: "Health stays public" } }}
By default <code>.withAuthn()</code> protects <code>/api</code> and leaves <code>/health</code>
anonymous — so liveness and readiness probes answer without a credential even under a guarded API
prefix. That is why the service's <code>/health</code> endpoint kept working through every earlier
chapter while <code>/api/workspace/:workspace/members</code> is now guarded.
{{ /comp }}

## Test it out

The guard produces three distinct responses, each a real assertion in the framework's
`builder-auth_test.ts`. Drive them against the running service — start it under Aspire
(`aspire start` from `aspire/`), then call the route for team `ws-1`:

{{ comp.tabbedCode({ tabs: [
  {
    label: "401 — no credential",
    lang: "sh",
    code: "# No Authorization header -> authn rejects before the handler runs.\ncurl -i http://localhost:3001/api/workspace/ws-1/members\n\n# HTTP/1.1 401 Unauthorized\n# { \"error\": \"UNAUTHORIZED\", \"message\": \"missing-credential\" }"
  },
  {
    label: "403 — wrong scope",
    lang: "sh",
    code: "# 'write' authenticates (valid credential) but lacks workspace:read,\n# so authz denies the scope-guarded route.\ncurl -i -H 'authorization: Bearer write' \\\n  http://localhost:3001/api/workspace/ws-1/members\n\n# HTTP/1.1 403 Forbidden\n# { \"error\": \"FORBIDDEN\", \"message\": \"authz.missing-scope:workspace:read\" }"
  },
  {
    label: "200 — authenticated + scoped",
    lang: "sh",
    code: "# 'read' carries workspace:read -> authn resolves the principal, authz allows it.\n# The contract parses ?limit=2 into a typed page.\ncurl -i -H 'authorization: Bearer read' \\\n  'http://localhost:3001/api/workspace/ws-1/members?limit=2'"
  }
] }) }}

The `200` body echoes the values the contract parsed — the typed `workspace` path param, the typed
`limit`/`offset` page, the authenticated `subject`, and the member rows from chapter 3:

```json
{
  "workspace": "ws-1",
  "limit": 2,
  "offset": 0,
  "subject": "user:reader",
  "members": [
    { "id": "mem_01", "workspaceId": "ws-1", "subject": "user:alice", "role": "member" }
  ]
}
```

An empty `members` array is still a `200` — it means the guard passed and the team simply has no rows
yet (provision one with the [chapter 4](/tutorials/workspace/04-provision-job/) job). A `401` or `403`
means the request never reached the query at all.

{{ comp callout { type: "warning", title: "Scope: route-level authz, not org/role RBAC" } }}
<code>.withAuthz()</code> decides from a <code>Principal</code>'s <strong>scopes</strong> on a matched
route. It is <strong>not</strong> organization-aware or role-hierarchy-aware: there is no
framework-managed notion of "this user belongs to that org" or "admins inherit member permissions."
A scope is a flat string the authenticator attached to the principal. The <code>{ workspace }</code>
path param tells you <em>which</em> team was requested, but confirming the caller may see
<em>that</em> team is app-level logic from
<a href="/tutorials/workspace/03-workspace-data/">chapter 3</a> — you filter your own queries by your
own <code>orgId</code> and derive your own roles. The seam gates the route; the tenancy is yours.
<!-- caveat: arch-debt:seamless-auth-roadmap -->
{{ /comp }}

## Verify your progress

The three `curl` calls above are the verification. The unauthenticated call must fail closed, and the
scoped call must succeed with a typed body:

- [ ] `contracts/routes/workspace-members.ts` exports `membersRoute`, a bound route contract with a
      typed `{ workspace }` param and pagination search.
- [ ] `services/workspace/src/auth.ts` defines the authenticator and a scope authorizer.
- [ ] The `workspace` service registers `GET /api/workspace/:workspace/members` and applies
      `.withAuthn()` and `.withAuthz()`.
- [ ] The handler reads params via `membersRoute.parsePath(...)` / `.parseSearch(...)`, not by hand.
- [ ] An unauthenticated request returns `401 UNAUTHORIZED` (`missing-credential`).
- [ ] `Bearer write` returns `403 FORBIDDEN` (`authz.missing-scope:workspace:read`).
- [ ] `Bearer read` returns `200` with a body carrying `workspace`, `limit`, and `subject`.
- [ ] `GET /health` still answers without a credential.

## What you built

A guarded, typed members route: one bound route contract in `contracts/routes/workspace-members.ts`
owns the pattern, the `{ workspace }` path param, and the pagination search; the `workspace` service
registers that route, parses its params through the contract, and gates it with `.withAuthn()` and
`.withAuthz()` — proven by a `401` for an anonymous request, a `403` for the wrong scope, and a `200`
for a correctly-scoped one. That is the differentiator this chapter exists to show: the URL, its typed
params, and its authorization gate are **not three hand-maintained facts that can drift** — they are
one contract plus one guard, checked by the compiler and by the framework's own `builder-auth` test.
You also saw the boundary: this is route-level scope authz, not org/role RBAC — the tenancy stays
yours.

## Next Steps

- **Ship it.** [Chapter 6 · Deploy](/tutorials/workspace/06-deploy/) runs the whole authenticated
  workspace locally under Aspire and takes it to production.
- **Reuse the contract on the client.** `membersRoute.href({ path: { workspace } })` builds the same
  URL a frontend link would call — see the typed route contract in action on a page in
  [the live-dashboard track](/tutorials/live-dashboard/04-definePage-QueryIsland/).
- **Go deeper on identity.** The [auth plugin guide](/tutorials/workspace/02-auth/) covers resolving
  real human sessions into the `Principal` this guard authorizes.

{{ comp.nextPrev({ prev: { label: "4 · Provision job", href: "/tutorials/workspace/04-provision-job/" }, next: { label: "6 · Deploy", href: "/tutorials/workspace/06-deploy/" } }) }}
</content>
