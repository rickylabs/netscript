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

This chapter builds exactly that pair. You declare the members procedure once with
`baseContract.route(...).meta({ access: ... })`, so its HTTP method, path, input/output schemas, and
authorization requirements live on the same contract value used by the service and its clients.
Then `createContractAuthorizer()` projects that declaration into the service builder's
`.withAuthn()` / `.withAuthz()` middleware. The result is the combination this chapter's title
promises: a **typed route and its authorization gate, from one source of truth.**

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/workspace/01-scaffold/" },
  { label: "2 · Auth", href: "/tutorials/workspace/02-auth/" },
  { label: "3 · Workspace data", href: "/tutorials/workspace/03-workspace-data/" },
  { label: "4 · Provision job", href: "/tutorials/workspace/04-provision-job/" },
  { label: "5 · Route authz", href: "/tutorials/workspace/05-route-authz/" },
  { label: "6 · Deploy", href: "/tutorials/workspace/06-deploy/" }
] }) }}

## What you will build

A guarded `GET /api/workspace/:workspace/members` route. One oRPC procedure contract declares its
path, typed `workspace`/`limit`/`offset` input, typed output, and required `workspace:read` scope. The
service implements that exact contract and gates it with `.withAuthn()` (which turns each request
into a `Principal`) and `.withAuthz()` (which enforces the procedure metadata). By the end an
unauthenticated request returns `401 UNAUTHORIZED`, a request with the wrong scope returns
`403 FORBIDDEN`, and a correctly-scoped request returns `200` with a typed member list — the exact
three outcomes the framework's own test asserts.

## Prerequisites

- The `workspace` service and its typed contracts from
  [chapter 1](/tutorials/workspace/01-scaffold/).
- The `Member` model and the `workspaceDb` client from
  [chapter 3](/tutorials/workspace/03-workspace-data/) — the route lists members from that datasource.
- The contract metadata vocabulary is built into `@netscript/contracts`, and the route-authz seam
  into `@netscript/service/auth`; neither needs the auth plugin to type-check, though you run the
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

## Step 1 — Declare access on the procedure contract

Before the guard, give the route a typed identity and policy. Create the procedure in the shared
`contracts/` tree so the service and every client import the same object. The route uses oRPC's
`{workspace}` placeholder; the default service REST mount adds `/api` at runtime.

```ts
// contracts/versions/v1/workspace.contract.ts
import { implement } from '@orpc/server';
import { baseContract } from '@netscript/contracts';
import { z } from 'zod';

const MembersInput = z.object({
  workspace: z.string().min(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

const Member = z.object({
  id: z.string(),
  workspaceId: z.string(),
  subject: z.string(),
  role: z.string(),
});

const MembersOutput = z.object({
  workspace: z.string(),
  limit: z.number().int(),
  offset: z.number().int(),
  subject: z.string(),
  members: z.array(Member),
});

export const WorkspaceContractV1 = {
  members: baseContract
    .route({ method: 'GET', path: '/workspace/{workspace}/members' })
    .meta({
      access: {
        authentication: 'required',
        authorization: { scopes: ['workspace:read'] },
      },
    })
    .input(MembersInput)
    .output(MembersOutput),
};

export const WorkspaceV1 = implement(WorkspaceContractV1);
```

The `.meta({ access: ... })` block is the source of truth for the guard. It uses the one
`NetScriptProcedureMeta.access` vocabulary: `authentication` is `none`, `optional`, or `required`,
and `authorization` may declare readonly `scopes` and `roles`. There is no separate path-policy map
to keep aligned with this route.

{{ comp.apiTable({
  caption: "@netscript/contracts — procedure access metadata",
  rows: [
    { name: ".meta({ access })", type: "NetScriptProcedureMeta", desc: "Stores access policy on the procedure that owns the route and schemas." },
    { name: "authentication", type: "'none' | 'optional' | 'required'", desc: "Declares whether the operation is public, optional-auth, or authenticated." },
    { name: "authorization.scopes", type: "readonly string[]", desc: "Every declared scope must be present on the authenticated Principal." },
    { name: "authorization.roles", type: "readonly string[]", desc: "Every declared role must be present on the authenticated Principal." }
  ]
}) }}

{{ comp callout { type: "important", title: "Optional is declared for future support" } }}
<code>authentication: 'optional'</code> is part of the metadata vocabulary and appears honestly in
OpenAPI, but the current runtime adapter rejects it. <code>createContractAuthorizer()</code> throws
<code>[netscript.service.contract-policy] optional authentication is unsupported: &lt;procedure&gt;</code>
during construction, before the first request.
{{ /comp }}

## Step 2 — Build the authenticator and contract authorizer

Now the guard. Define the credentials, then construct the authorizer from the contract itself. A
`read` credential carries `workspace:read`; a `write` credential does not. The authorizer reads the
required scope from `WorkspaceContractV1.members` — no duplicated path matcher:

```ts
// services/workspace/src/auth.ts
import {
  createContractAuthorizer,
  createStaticCredentialAuthenticator,
} from '@netscript/service/auth';
import { WorkspaceContractV1 } from '../../../contracts/versions/v1/workspace.contract.ts';

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

export const authorizer = createContractAuthorizer(WorkspaceContractV1);
```

{{ comp.apiTable({
  caption: "@netscript/service/auth — the route-authz surface",
  rows: [
    { name: "createStaticCredentialAuthenticator(opts)", type: "AuthenticatorPort", desc: "Maps bearer tokens to principals — each credential carries a subject, scopes, and roles. Good for tests and machine-to-machine callers." },
    { name: "createContractAuthorizer(contract, { fallback? })", type: "ContractPolicyAuthorizerPort", desc: "Traverses procedure-local access metadata and binds it to the builder's real REST/RPC paths and aliases." },
    { name: "createScopeAuthorizer(opts)", type: "MatchAwareAuthorizerPort", desc: "Supported legacy path-rule authorizer; standalone, or a fallback only when a matched procedure has no metadata." },
    { name: ".withAuthn({ authenticator, protect?, allowAnonymous? })", type: "builder stage", desc: "protect defaults to ['/api']; allowAnonymous defaults to ['/health']." },
    { name: ".withAuthz({ authorizer, denyByDefault? })", type: "builder stage", desc: "denyByDefault defaults to true — fail closed when no decision is reachable." }
  ]
}) }}

This opt-in is the migration boundary. Existing unguarded services, generated scaffolds, and
standalone `createScopeAuthorizer()` users are unchanged. Contract enforcement starts only when the
application passes a `createContractAuthorizer(...)` result to `.withAuthz()`.

If you are migrating older path rules, pass `createScopeAuthorizer()` as `fallback`. Contract
metadata always wins on disagreement. The fallback is consulted only for a matched procedure with
no access metadata; if no fallback rule matches, the adapter denies even when that fallback would
allow unmatched paths in standalone mode.

## Step 3 — Implement the contract and layer the guard

Bind a handler to `WorkspaceV1.members`, then pass that router to the service builder. The handler
runs only for an authenticated, authorized caller. Its `input` and output are typed from the same
procedure that owns the access declaration:

```ts
// services/workspace/src/main.ts
import { os } from '@orpc/server';
import { createService, type ServiceHandlerContext } from '@netscript/service';
import { WorkspaceV1 } from '../../../contracts/versions/v1/workspace.contract.ts';
import { workspaceDb } from './db.ts'; // the chapter 3 workspace client
import { authenticator, authorizer } from './auth.ts';

const workspaceV1 = WorkspaceV1.$context<ServiceHandlerContext>();

const router = os.router({
  members: workspaceV1.members.handler(async ({ input, context }) => {
    // Auth is runtime-configured, so the public context type is intentionally optional.
    // This procedure is guarded; narrow once before using the principal.
    if (!context.principal) throw new Error('authenticated principal required');

    const members = await workspaceDb.member.findMany({
      where: { workspaceId: input.workspace },
      take: input.limit,
      skip: input.offset,
      orderBy: { createdAt: 'asc' },
    });

    return {
      workspace: input.workspace,
      limit: input.limit,
      offset: input.offset,
      subject: context.principal.subject,
      members,
    };
  }),
});

const app = createService(router, { name: 'workspace' })
  .withRPC()
  .withAuthn({ authenticator })
  .withAuthz({ authorizer })
  .build();

export { app };
```

The builder binds the contract policy to its actual REST and RPC mounts. If you customize
`.withRPC({ apiPath, rpcPath, rpcAliases, deprecatedRpcRoutes })`, one shared resolver uses those
effective paths for both authn and authz; you do not repeat them in the policy.

{{ comp callout { type: "note", title: "Health stays public" } }}
By default <code>.withAuthn()</code> protects <code>/api</code> and leaves <code>/health</code>
anonymous — so liveness and readiness probes answer without a credential even under a guarded API
prefix. That is why the service's <code>/health</code> endpoint kept working through every earlier
chapter while <code>/api/workspace/:workspace/members</code> is now guarded.
{{ /comp }}

## Test it out

The guard produces three distinct responses, each a real assertion in the framework's
`builder-auth_test.ts`. Drive them against the running service — start it under Aspire
(`aspire start` from `aspire/`), then call the route for team `ws-1` (note: this tutorial assumes port 3001; in unpinned scaffolds, each project is allocated its own randomized high-range ports):

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

{{ comp callout { type: "important", title: "Route-Level Scope Authorization Boundary" } }}
The contract authorizer evaluates the flat scope and role strings declared in procedure metadata against the <code>Principal</code>. This design boundary separates route gating from complex tenant-ownership check logic. The framework does not automatically evaluate role hierarchies (such as admin permission inheritance) or verify organization-specific boundaries (such as confirming the caller is a member of the requested <code>workspace</code>). Currently, you must perform tenant-membership checks manually within your queries. Integrating typed organization helpers and plugin-aware principal mapping is planned under roadmap items R3 and R5.
<!-- caveat: arch-debt:seamless-auth-roadmap -->
{{ /comp }}

## Verify your progress

The three `curl` calls above are the verification. The unauthenticated call must fail closed, and the
scoped call must succeed with a typed body:

- [ ] `contracts/versions/v1/workspace.contract.ts` exports `WorkspaceContractV1` with typed input,
      output, and `.meta({ access: ... })` requiring `workspace:read`.
- [ ] `services/workspace/src/auth.ts` defines the authenticator and constructs the authorizer from
      `WorkspaceContractV1`.
- [ ] The `workspace` service implements `WorkspaceV1.members`, calls `.withRPC()`, and applies
      `.withAuthn()` and `.withAuthz()`.
- [ ] The handler reads typed `input.workspace`, `input.limit`, and `input.offset`; it does not parse
      the URL by hand.
- [ ] An unauthenticated request returns `401 UNAUTHORIZED` (`missing-credential`).
- [ ] `Bearer write` returns `403 FORBIDDEN` (`authz.missing-scope:workspace:read`).
- [ ] `Bearer read` returns `200` with a body carrying `workspace`, `limit`, and `subject`.
- [ ] `GET /health` still answers without a credential.

## What you built

A guarded, typed members procedure: `WorkspaceContractV1.members` owns the HTTP path, typed input
and output, and required `workspace:read` scope; the service implements that procedure and opts into
its policy with `createContractAuthorizer()` — proven by a `401` for an anonymous request, a `403`
for the wrong scope, and a `200` for a correctly-scoped one. That is the differentiator this chapter
exists to show: the URL, its typed data, and its authorization gate are **not three hand-maintained
facts that can drift** — they are projections of one contract, checked by the compiler and by the
framework's own auth tests.
You also saw the boundary: this is route-level scope authz, not org/role RBAC — the tenancy stays
yours.

## Next Steps

- **Ship it.** [Chapter 6 · Deploy](/tutorials/workspace/06-deploy/) runs the whole authenticated
  workspace locally under Aspire and takes it to production.
- **Reuse the contract on the client.** A typed SDK derived from `WorkspaceContractV1` exposes the
  same `members` procedure and metadata. If that procedure key is renamed, its contract-local
  metadata follows it and a stale SDK reference to the old key fails to type-check.
- **Go deeper on identity.** The [auth plugin guide](/tutorials/workspace/02-auth/) covers resolving
  real human sessions into the `Principal` this guard authorizes.

{{ comp.nextPrev({ prev: { label: "4 · Provision job", href: "/tutorials/workspace/04-provision-job/" }, next: { label: "6 · Deploy", href: "/tutorials/workspace/06-deploy/" } }) }}
</content>
