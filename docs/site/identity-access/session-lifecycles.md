---
layout: layouts/base.vto
title: Session lifecycles
templateEngine: [vento, md]
order: 3
---

# Session lifecycles

This page shows the HTTP lifecycle each official auth adapter needs: mounting handlers, redirecting
to the provider, exchanging the callback, checking return URLs and forwarding refreshed session
cookies. Use it to wire sign-in redirects, callbacks and token validation into your own services and
framework entry points.

## Sealed-cookie vs. bearer-token paths

Choose how the session reaches the server before you wire anything:

| Path | Mechanism | Ideal for | Adapters |
| --- | --- | --- | --- |
| **Sealed-Cookie** | The browser automatically sends the session cookie (`__Host-ns_session` or provider cookie) with each request. The server verifies it statelessly or against Deno KV. | Web frontends (Fresh, server-rendered pages), traditional monolithic apps. | `auth-kv-oauth`, `auth-better-auth`, `auth-workos` (AuthKit) |
| **Bearer-Token** | The client (mobile app, SPA, or backend service) explicitly injects a JWT access token in the `Authorization: Bearer <token>` header. The server verifies it via JWKS. | Stateless REST/oRPC APIs, mobile backends, machine-to-machine calls. | `auth-workos` (Bearer), `auth-better-auth` (Bearer) |

## better-auth: mounting and header forwarding

The better-auth adapter (`@netscript/auth-better-auth`) delegates the database tables to Prisma and
leaves routing and session verification to NetScript. better-auth exposes a fetch-compatible
`auth.handler(request)` that drives its own database and provider operations, such as magic links,
user settings and credential verification. Mount that handler under `/api/auth/**` in your web
server.

> [!WARNING]
> Forward refreshed session headers. When `backend.authenticate(authnReq)` verifies a session on a
> protected route, better-auth may rotate or refresh it, and the `AuthnResult` then carries new
> `responseHeaders` and `setCookies`. Append them to the response sent to the browser; dropping them
> silently logs the user out on the next request.

The example mounts the handler and forwards both on a protected route:

```ts
import { Hono } from "npm:hono@^4";
import { createBetterAuthBackend, createNetscriptBetterAuth } from "@netscript/auth-better-auth";
import type { AuthnRequest } from "@netscript/service/auth";

// 1. Initialize Prisma and NetScript Better Auth
const prisma = {}; // Your Prisma client instance
const auth = createNetscriptBetterAuth({
  prisma,
  provider: "postgresql",
  secret: Deno.env.get("BETTER_AUTH_SECRET")!,
});

// 2. Initialize the NetScript Better Auth Adapter
const backend = createBetterAuthBackend({
  auth,
  sessionTokenSecret: Deno.env.get("BETTER_AUTH_SECRET")!,
});

const app: Hono = new Hono();

// Helper to adapt Hono's Request into NetScript's AuthnRequest
function toAuthnRequest(req: Request): AuthnRequest {
  const url = new URL(req.url);
  return {
    header: (name) => req.headers.get(name) ?? undefined,
    headers: () => req.headers,
    cookie: (name) => {
      const cookieHeader = req.headers.get("cookie") ?? "";
      const match = cookieHeader.match(new RegExp(`(^|;)\\s*${name}\\s*=\\s*([^;]+)`));
      return match ? decodeURIComponent(match[2]) : undefined;
    },
    method: req.method,
    path: url.pathname,
  };
}

// 3. Mount the public better-auth handler at /api/auth/*
app.all("/api/auth/*", async (c) => {
  const response = await auth.handler(c.req.raw);
  return response;
});

// 4. Authenticate a protected request and forward headers/cookies
app.get("/api/protected", async (c) => {
  const authnReq = toAuthnRequest(c.req.raw);
  const result = await backend.authenticate(authnReq);

  if (!result.ok) {
    return c.json({ error: result.reason }, 401);
  }

  // FORWARD HEADERS: Refreshed session tokens are written onto headers
  if (result.responseHeaders) {
    for (const [key, value] of Object.entries(result.responseHeaders)) {
      c.header(key, value);
    }
  }

  // FORWARD COOKIES: Rotation cookies must reach the browser
  if (result.setCookies) {
    for (const cookie of result.setCookies) {
      c.header("set-cookie", cookie, { append: true });
    }
  }

  return c.json({
    message: "Access granted",
    principal: result.principal,
  });
});
```

## kv-oauth: redirect and callback

The kv-oauth adapter (`@netscript/auth-kv-oauth`) is NetScript's default, interactive backend. It
drives the browser through the full OAuth 2.0/OIDC code exchange and stores sessions in Deno KV. A
session passes through four stages:

1. **Sign-in redirect.** `backend.signIn` generates a PKCE code verifier and challenge, a state and a
   transaction id. It stores them in KV, sets a temporary transaction cookie and returns a `302`
   redirect to the identity provider.
2. **Callback exchange.** The provider redirects back to `/auth/callback` with a `code` and `state`.
   `backend.handleCallback` checks the state against the transaction cookie, exchanges the code for
   tokens, resolves the user claims and mints an active session in Deno KV. It returns a redirect to
   the validated `returnTo` URL, writing the `__Host-ns_session` cookie and clearing the transaction
   cookie.
3. **Session verification.** Later requests carry the session cookie. `backend.authenticate` checks
   the session id against Deno KV, refreshes on read and returns the mapped `Principal`.
4. **Sign-out.** `backend.signOut` deletes the session from Deno KV, so later requests with that
   session id fail. Its response expires `__Host-ns_session` (for example with `Max-Age=0`) and
   redirects to a safe public route, such as the landing or login page.

### Response propagation

`signIn`, `handleCallback` and `signOut` each return a redirect response, and your server must
propagate it completely: the `Location` header moves the browser to the provider's authorize
endpoint or back into the app, and the `Set-Cookie` headers carry the transaction cookie, the
session cookie or the expiring cookie. Mount sign-out on its own route, such as
`GET /auth/signout`. The example below returns each response unchanged.

### Return target and identity normalization

- **`allowedReturnTo`** restricts post-login redirects to prevent open redirects. The backend checks
  the target against a list of URL prefixes or a custom function and throws a
  `return_to_not_allowed` error when it fails.
- **`normalizePrincipal`** customizes how user claims and tokens map to a NetScript `Principal`
  (subject, scopes and roles). It *replaces* the default mapping, so compose on top of
  `defaultPrincipal(ctx)` instead of rebuilding the principal: that keeps the stable subject, the
  `user` role, `scheme: "custom"`, the token scopes and the `sessionId`/`providerId` claims. The
  context also carries the flow's injected `fetch`, so any provider call a mapper makes uses the same
  transport as the token exchange.

```ts
import { Hono } from "npm:hono@^4";
import { createKvOAuthBackend, defaultPrincipal, providers } from "@netscript/auth-kv-oauth";
import type { AuthnRequest } from "@netscript/service/auth";

// 1. Compose the KV OAuth Backend with allowedReturnTo & identity normalization
const backend = await createKvOAuthBackend({
  provider: providers.github({
    clientId: Deno.env.get("NETSCRIPT_AUTH_CLIENT_ID")!,
    clientSecret: Deno.env.get("NETSCRIPT_AUTH_CLIENT_SECRET")!,
    redirectUri: "http://localhost:8000/auth/callback",
  }),
  allowedReturnTo: [
    "http://localhost:8000/dashboard",
    "http://localhost:8000/profile",
  ],
  defaultReturnTo: "http://localhost:8000/dashboard",
  
  // Custom identity normalization composes on the default mapping, which keeps
  // the stable subject (github:<numeric id>), scopes, scheme and claims.
  normalizePrincipal: async (ctx) => {
    const principal = await defaultPrincipal(ctx);
    const admins = new Set(["github:583231"]);
    return admins.has(principal.subject)
      ? { ...principal, roles: [...principal.roles, "admin"] }
      : principal;
  },
});

const app: Hono = new Hono();

function toAuthnRequest(req: Request): AuthnRequest {
  const url = new URL(req.url);
  return {
    header: (name) => req.headers.get(name) ?? undefined,
    headers: () => req.headers,
    cookie: (name) => {
      const cookieHeader = req.headers.get("cookie") ?? "";
      const match = cookieHeader.match(new RegExp(`(^|;)\\s*${name}\\s*=\\s*([^;]+)`));
      return match ? decodeURIComponent(match[2]) : undefined;
    },
    method: req.method,
    path: url.pathname,
  };
}

// 2. Sign-in: begins flow, redirects browser to GitHub via Location header propagation
app.get("/auth/signin", async (c) => {
  const returnTo = c.req.query("returnTo") ?? undefined;
  const response = await backend.signIn(c.req.raw, { returnTo });
  // Propagates the redirect Location and transaction cookies to the browser
  return response;
});

// 3. Callback: exchanges code, creates session, and redirects to returnTo via Location/Cookie propagation
app.get("/auth/callback", async (c) => {
  try {
    const { response, sessionId, principal } = await backend.handleCallback(c.req.raw);
    console.log(`Session ${sessionId} established for user ${principal.subject}`);
    // Propagates the redirect Location header and set-cookies (session cookie)
    return response;
  } catch (error) {
    return c.text(`Authentication failed: ${error}`, 400);
  }
});

// 4. Session Lookup: verify session cookie on subsequent requests
app.get("/auth/me", async (c) => {
  const authnReq = toAuthnRequest(c.req.raw);
  const result = await backend.authenticate(authnReq);

  if (!result.ok) {
    return c.json({ authenticated: false, reason: result.reason }, 401);
  }

  // Forward refreshed session cookies if issued by the backend on-read
  if (result.setCookies) {
    for (const cookie of result.setCookies) {
      c.header("set-cookie", cookie, { append: true });
    }
  }

  return c.json({
    authenticated: true,
    principal: result.principal,
  });
});

// 5. Sign-out: deletes session from KV (teardown), clears browser cookie, and redirects
app.get("/auth/signout", async (c) => {
  const response = await backend.signOut(c.req.raw);
  // Propagates the cookie-clearing header and redirect Location
  return response;
});
```

### Stable subjects for non-OIDC providers

A principal's `subject` is what authorization rows, audit records and background work (workers,
sagas and triggers running under a service identity) key on. It must be the same on every sign-in
and must not depend on a live session. Each provider declares where its subject comes from with
`subject` on `defineOAuthProvider(...)`:

| Source | Value | Used by |
| --- | --- | --- |
| `{ source: "id_token", claim: "sub" }` | The validated ID-token claim, verbatim. | OIDC presets (`google`, `gitlab`, `slack`, tenant presets). |
| `{ source: "userinfo", claim: "id" }` | The userinfo field, namespaced by provider id: `github:583231`. `claim` may be a dot path (`data.id`). | `github`, `discord`, `spotify`, `facebook`, `twitter` (`data.id`). |

The userinfo request uses the flow's injected `fetch`, the access token as a bearer, and the
source's `headers`. The `github` preset sends a `User-Agent`, which the GitHub API requires. Use the
immutable numeric `id`; `login` can be renamed.

When a configured source yields no identifier, `handleCallback` throws `KvOAuthError` with code
`subject_missing` and creates no session. A failed or oversized userinfo response throws
`userinfo_failed`. A provider defined *without* `subject` uses the ID-token `sub` and is refused the
same way when the token response carries none. There is no fallback to the per-sign-in session id,
because a subject that changes on every sign-in cannot carry authorization.

The `auth` plugin configures this from its environment, including the auth environment block of
`appsettings.json`:

| Variable | Meaning |
| --- | --- |
| `NETSCRIPT_AUTH_SUBJECT_SOURCE` | `id_token` or `userinfo`. |
| `NETSCRIPT_AUTH_SUBJECT_CLAIM` | Claim or userinfo field (default: the preset's, else `sub`). |
| `NETSCRIPT_AUTH_PROVIDER_ID` | Names the provider and namespaces userinfo subjects. A preset name (`github`) supplies that preset's defaults. |

Unset variables fall back to the preset named by `NETSCRIPT_AUTH_PROVIDER_ID`, then to the ID-token
`sub`. The settings are read and validated even when the provider is only partly configured, and an
invalid `NETSCRIPT_AUTH_SUBJECT_SOURCE` stops the service at startup. The local-defaults stub (no
provider configured) points at placeholder endpoints and cannot complete a sign-in; it never issues a
session-id subject either.

## WorkOS: stateless bearer verification

The WorkOS adapter (`@netscript/auth-workos`) provides `createWorkosAccessTokenAuthenticator` to
verify stateless bearer JWTs issued by WorkOS. Use it when the client signs in through WorkOS
AuthKit and NetScript only protects the API.

1. **JWKS verification.** The authenticator reads the `Authorization: Bearer <token>` header and
   verifies the signature against the WorkOS public keys (JWKS) at
   `https://api.workos.com/sso/jwks/<clientId>`. Keys are cached locally, and the JWKS client
   refreshes the cache when verification meets an unknown key, so key rotation needs no action.
2. **Audience and issuer.** It asserts that the token's audience (`aud`) matches the WorkOS
   `clientId` and that the issuer (`iss`) matches your WorkOS domain.
3. **Principal mapping.** It maps the WorkOS JWT claims `sub`, `org_id`, `role`, `roles` and
   `permissions` to a neutral NetScript `Principal` with scheme `"custom"`.
4. **Named failures.** Rejections come back as `ok: false` with a specific reason instead of a
   thrown error, so you can handle a missing token differently from a malformed one.

```ts
import { Hono } from "npm:hono@^4";
import { createWorkosAccessTokenAuthenticator } from "@netscript/auth-workos";
import type { AuthnRequest } from "@netscript/service/auth";

// 1. Create a stateless WorkOS bearer authenticator
const authenticator = createWorkosAccessTokenAuthenticator({
  clientId: "client_01H...", // Your WorkOS Client ID (asserted as expected audience)
  // JWKS Key-Set Configuration:
  // WorkOS hosts public keys at https://api.workos.com/sso/jwks/<clientId>.
  // The authenticator fetches and caches keys from this URL. WorkOS handles key
  // rotation automatically; the underlying jose library refreshes the key-set
  // cache on signature verification failures.
  jwksUrl: "https://api.workos.com/sso/jwks/client_01H...", 
  issuer: "https://api.workos.com", // Expected JWT issuer
});

const app: Hono = new Hono();

function toAuthnRequest(req: Request): AuthnRequest {
  const url = new URL(req.url);
  return {
    header: (name) => req.headers.get(name) ?? undefined,
    headers: () => req.headers,
    cookie: (name) => {
      const cookieHeader = req.headers.get("cookie") ?? "";
      const match = cookieHeader.match(new RegExp(`(^|;)\\s*${name}\\s*=\\s*([^;]+)`));
      return match ? decodeURIComponent(match[2]) : undefined;
    },
    method: req.method,
    path: url.pathname,
  };
}

// 2. Protect routes with the authenticator
app.get("/api/protected", async (c) => {
  const authnReq = toAuthnRequest(c.req.raw);
  const result = await authenticator.authenticate(authnReq);

  if (!result.ok) {
    // 3. Handle named failure outcomes explicitly
    if (result.reason === "workos_bearer_token_missing") {
      return c.json({ error: "Authorization header with Bearer token is missing" }, 401);
    }
    // E.g. token expired, invalid signature, or wrong audience
    return c.json({ error: `Authentication failed: ${result.reason}` }, 401);
  }

  // 4. Principal claims are mapped to NetScript principal structure
  const principal = result.principal;
  return c.json({
    message: "Access granted",
    userId: principal.subject,
    scopes: principal.scopes,
    roles: principal.roles,
    organizationId: principal.claims.organizationId,
  });
});
```

## Next steps

{{ comp.xref({ key: "cap:auth" }) }} maps the `auth-api` endpoints, database tables and environment
variables that these adapters plug into.

- {{ comp.xref({ key: "explain:auth-model" }) }}: the backend-only port these lifecycles implement.
- Reference: [auth-better-auth](/reference/auth-better-auth/),
  [auth-kv-oauth](/reference/auth-kv-oauth/) and [auth-workos](/reference/auth-workos/).
