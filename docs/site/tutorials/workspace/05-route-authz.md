---
layout: layouts/base.vto
title: Protect routes with authz
templateEngine: [vento, md]
prev: { label: "4 · Provision job", href: "/tutorials/workspace/04-provision-job/" }
next: { label: "6 · Deploy", href: "/tutorials/workspace/06-deploy/" }
---

# Protect routes with authz

Your `workspace` service still answers anyone. This chapter closes the loop: you gate its routes with
the real, tested `.withAuthn()` / `.withAuthz()` seam from `@netscript/service/auth`. An authenticated,
correctly-scoped request succeeds with a `200`; an unauthenticated one is rejected with a `401`. This
is the seam NetScript actually ships — not a bespoke middleware you write yourself.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/workspace/01-scaffold/" },
  { label: "2 · Auth", href: "/tutorials/workspace/02-auth/" },
  { label: "3 · Workspace data", href: "/tutorials/workspace/03-workspace-data/" },
  { label: "4 · Provision job", href: "/tutorials/workspace/04-provision-job/" },
  { label: "5 · Route authz", href: "/tutorials/workspace/05-route-authz/" },
  { label: "6 · Deploy", href: "/tutorials/workspace/06-deploy/" }
] }) }}

## What you will build

A guarded `workspace` service: `.withAuthn()` turns each request into a `Principal`, and
`.withAuthz()` decides whether that principal may reach the route. By the end an unauthenticated
request to a guarded path returns `401 UNAUTHORIZED`, a request with the wrong scope returns
`403 FORBIDDEN`, and a correctly-scoped request returns `200` — exactly the behavior the framework's
own test asserts.

## Before you begin

You need the `workspace` service from [chapter 1](/tutorials/workspace/01-scaffold/) and the provision
job from [chapter 4](/tutorials/workspace/04-provision-job/). The route-authz seam is part of
`@netscript/service` itself — it does not need the auth plugin or Aspire to type-check, though you run
the service under Aspire to exercise it live. Confirm the workspace builds:

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

## Step 1 — The seam: authn resolves, authz decides

`@netscript/service/auth` gives you two factories and two builder stages:

- **`.withAuthn({ authenticator })`** runs an `AuthenticatorPort` that turns an incoming request into a
  `Principal` (subject, scopes, roles) — or rejects it. By default it guards `/api` and leaves
  `/health` anonymous.
- **`.withAuthz({ authorizer })`** runs an `AuthorizerPort` that makes an allow/deny decision from that
  `Principal`. `createScopeAuthorizer` matches a request and requires named scopes.

{{ comp.apiTable({
  caption: "@netscript/service/auth — the route-authz surface",
  rows: [
    { name: "createStaticCredentialAuthenticator(opts)", type: "AuthenticatorPort", desc: "Maps bearer tokens to principals — each credential carries a subject, scopes, and roles. Good for tests and machine-to-machine callers." },
    { name: "createTrustedHeaderAuthenticator(opts)", type: "AuthenticatorPort", desc: "Trusts a principal asserted by an upstream gateway via request headers." },
    { name: "createScopeAuthorizer(opts)", type: "AuthorizerPort", desc: "Rules of { match, requireScopes } — the principal must carry every required scope for a matched route." },
    { name: ".withAuthn({ authenticator, protect?, allowAnonymous? })", type: "builder stage", desc: "protect defaults to ['/api']; allowAnonymous defaults to ['/health']." },
    { name: ".withAuthz({ authorizer, denyByDefault? })", type: "builder stage", desc: "denyByDefault defaults to true — fail closed when no decision is reachable." }
  ]
}) }}

## Step 2 — Build the authenticator and authorizer

Define the credentials and the scope rule. This mirrors the framework's own
`builder-auth_test.ts`: a `read` credential carries the `workspace:read` scope; the rule requires that
scope on `/api/workspace` paths:

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
    match: (request) => request.path.startsWith('/api/workspace'),
    requireScopes: ['workspace:read'],
  }],
});
```

## Step 3 — Guard the service

Apply the two stages on the service builder. Add the `.withAuthz()` and `.withAuthn()` calls to your
`workspace` service. The route handler reads the resolved `Principal` off the request context — it only
ever runs for an authenticated, authorized caller:

```ts
// services/workspace/src/main.ts
import { createService } from '@netscript/service';
import type { Principal } from '@netscript/service/auth';
import { authenticator, authorizer } from './auth.ts';

const app = createService({}, { name: 'workspace' })
  .route('get', '/api/workspace', (c: unknown) => {
    const ctx = c as { get(key: string): unknown; json(data: unknown): Response };
    // The authn stage injected the resolved principal into the context.
    const principal = ctx.get('principal') as Principal;
    return ctx.json({ subject: principal.subject });
  })
  .withAuthz({ authorizer })
  .withAuthn({ authenticator })
  .build();

export { app };
```

{{ comp callout { type: "note", title: "Health stays public" } }}
By default <code>.withAuthn()</code> protects <code>/api</code> and leaves <code>/health</code>
anonymous — so liveness and readiness probes answer without a credential even under a guarded API
prefix. That is why the service's <code>/health</code> endpoint kept working through every earlier
chapter while <code>/api/workspace</code> is now guarded.
{{ /comp }}

## Step 4 — Exercise the three outcomes

The seam produces three distinct responses, each a real assertion in the framework's
`builder-auth_test.ts`. Drive them against the running service (start it under Aspire, or call
`app.request(...)` in a test):

{{ comp.tabbedCode({ tabs: [
  {
    label: "401 — no credential",
    lang: "sh",
    code: "# No Authorization header → authn rejects before the handler runs.\ncurl -i http://localhost:3001/api/workspace\n\n# HTTP/1.1 401 Unauthorized\n# { \"error\": \"UNAUTHORIZED\", \"message\": \"missing-credential\" }"
  },
  {
    label: "403 — wrong scope",
    lang: "sh",
    code: "# 'write' authenticates (it is a valid credential) but lacks workspace:read,\n# so authz denies the scope-guarded route.\ncurl -i -H 'authorization: Bearer write' http://localhost:3001/api/workspace\n\n# HTTP/1.1 403 Forbidden\n# { \"error\": \"FORBIDDEN\", \"message\": \"authz.missing-scope:workspace:read\" }"
  },
  {
    label: "200 — authenticated + scoped",
    lang: "sh",
    code: "# 'read' carries workspace:read → authn resolves the principal, authz allows it.\ncurl -i -H 'authorization: Bearer read' http://localhost:3001/api/workspace\n\n# HTTP/1.1 200 OK\n# { \"subject\": \"user:reader\" }"
  }
] }) }}

{{ comp callout { type: "warning", title: "Scope: route-level authz, not org/role RBAC" } }}
<code>.withAuthz()</code> decides from a <code>Principal</code>'s <strong>scopes</strong> on a matched
route. It is <strong>not</strong> organization-aware or role-hierarchy-aware: there is no
framework-managed notion of "this user belongs to that org" or "admins inherit member permissions."
A scope is a flat string the authenticator attached to the principal. If you need org isolation or
role hierarchies, that is the app-level logic from
<a href="/tutorials/workspace/03-workspace-data/">chapter 3</a> — you filter your own queries by your
own <code>orgId</code> and derive your own roles. The seam gates the route; the tenancy is yours.
{{ /comp }}

## Verify your progress

The three `curl` calls above are the verification. The unauthenticated call must fail closed, and the
scoped call must succeed:

- [ ] `services/workspace/src/auth.ts` defines the authenticator and a scope authorizer.
- [ ] The `workspace` service applies `.withAuthn()` and `.withAuthz()`.
- [ ] An unauthenticated `GET /api/workspace` returns `401 UNAUTHORIZED` (`missing-credential`).
- [ ] `Bearer write` returns `403 FORBIDDEN` (`authz.missing-scope:workspace:read`).
- [ ] `Bearer read` returns `200` with `{ "subject": "user:reader" }`.
- [ ] `GET /health` still answers without a credential.

## What you built

A guarded `workspace` service that resolves a `Principal` with `.withAuthn()` and authorizes by scope
with `.withAuthz()` — proven by a `401` for an anonymous request, a `403` for the wrong scope, and a
`200` for a correctly-scoped one. You also saw the boundary: this is route-level scope authz,
not org/role RBAC. The last chapter runs the whole authenticated workspace locally under Aspire.

{{ comp.nextPrev({ prev: { label: "4 · Provision job", href: "/tutorials/workspace/04-provision-job/" }, next: { label: "6 · Deploy", href: "/tutorials/workspace/06-deploy/" } }) }}
</content>
