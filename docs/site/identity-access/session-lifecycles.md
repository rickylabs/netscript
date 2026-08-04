---
layout: layouts/base.vto
title: Operational session lifecycles
templateEngine: [vento, md]
prev: { label: "better-auth plugins", href: "/identity-access/better-auth-plugins/" }
next: null
order: 3
---

# Operational session lifecycles

**Authenticating a request is only half the battle. A working production auth flow requires a complete HTTP lifecycle: mounting public endpoints, redirecting to providers, exchanging callback codes, checking safe return URLs, and forwarding session-refresh cookies without dropping a single header.**

This page covers the operational lifecycles for NetScript's three official authentication adapters. Use this guide to wire sign-in redirects, callbacks, and token validation into your services and meta-framework entry points.

---

## Sealed-cookie vs. bearer-token paths

Before implementing, choose the session delivery path that fits your application architecture:

| Path | Mechanism | Ideal for | Adapters |
| --- | --- | --- | --- |
| **Sealed-Cookie** | The browser automatically sends the session cookie (`__Host-ns_session` or provider cookie) with each request. The server verifies it statelessly or against Deno KV. | Web frontends (Fresh, server-rendered pages), traditional monolithic apps. | `auth-kv-oauth`, `auth-better-auth`, `auth-workos` (AuthKit) |
| **Bearer-Token** | The client (mobile app, SPA, or backend service) explicitly injects a JWT access token in the `Authorization: Bearer <token>` header. The server verifies it via JWKS. | Stateless REST/oRPC APIs, mobile backends, machine-to-machine calls. | `auth-workos` (Bearer), `auth-better-auth` (Bearer) |

---

## 1. Better Auth: mounting and header forwarding

The better-auth adapter (`@netscript/auth-better-auth`) delegates the database tables to Prisma but leaves routing and session verification to NetScript.

### The mounting lifecycle
better-auth exposes a fetch-compatible `auth.handler(request)` to drive its internal database and provider operations (magic links, user settings, credentials verification). You must mount this handler under `/api/auth/**` in your web server.

### Refreshed session forwarding (Critical)
When verifying a session on a protected route via `backend.authenticate(authnReq)`, better-auth may rotate or refresh the session. When this happens, `AuthnResult` returns new headers in `responseHeaders` and `setCookies`. **You must append these headers to the HTTP response sent back to the browser.** Dropping them will silently log the user out on the next request.

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

---

## 2. KV OAuth: interactive redirect and callback lifecycles

The KV OAuth adapter (`@netscript/auth-kv-oauth`) is NetScript's default interactive authentication backend. It drives the browser through the full OAuth2/OIDC code exchange, storing active session details in Deno KV.

### The four-stage lifecycle
1. **Sign-In Redirect**: `backend.signIn` generates a transaction code verifier (PKCE), code challenge, state, and transaction ID. It stores this state in KV, sets a temporary transaction cookie, and returns a `302` redirect to the Identity Provider (IdP).
2. **Callback Exchange**: The IdP redirects the user back to `/auth/callback` with a `code` and `state`. `backend.handleCallback` verifies the state against the transaction cookie, exchanges the authorization code for tokens, resolves user claims, mints an active session in Deno KV, and returns a redirect to the target `returnTo` URL while writing the `__Host-ns_session` cookie.
3. **Session Verification**: Subsequent requests carry the session cookie. `backend.authenticate` verifies the session ID against Deno KV, automatically handles refresh-on-read, and returns the mapped `Principal`.
4. **Sign-Out**: `backend.signOut` deletes the session from Deno KV and returns a response that clears the `__Host-ns_session` cookie.

### Return target and identity normalization
- **`allowedReturnTo`**: To prevent open-redirect vulnerabilities, the backend restricts post-login redirects. It validates the target against a preset array of URL prefixes or a custom evaluation function. If validation fails, it throws a `return_to_not_allowed` error.
- **`normalizePrincipal`**: Customizes how user claims and tokens map to a NetScript `Principal` (subject, scopes, and roles).

```ts
import { Hono } from "npm:hono@^4";
import { createKvOAuthBackend, providers } from "@netscript/auth-kv-oauth";
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
  
  // Custom identity normalization mapping
  normalizePrincipal: (ctx) => {
    const email = (ctx.claims.email as string) ?? "";
    const isCompanyEmail = email.endsWith("@mycompany.com");
    return {
      subject: ctx.claims.sub as string,
      scopes: ctx.tokenSet.scope?.split(/\s+/) ?? ["read"],
      roles: isCompanyEmail ? ["admin", "user"] : ["user"],
      scheme: "custom",
      claims: {
        email,
        providerId: ctx.provider.id,
        sessionId: ctx.sessionId,
      },
    };
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

// 2. Sign-in: begins flow, redirects browser to GitHub
app.get("/auth/signin", async (c) => {
  const returnTo = c.req.query("returnTo") ?? undefined;
  const response = await backend.signIn(c.req.raw, { returnTo });
  return response;
});

// 3. Callback: exchanges code, creates session, redirects user to returnTo
app.get("/auth/callback", async (c) => {
  try {
    const { response, sessionId, principal } = await backend.handleCallback(c.req.raw);
    console.log(`Session ${sessionId} established for user ${principal.subject}`);
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

// 5. Sign-out: deletes session from KV, clears browser cookie
app.get("/auth/signout", async (c) => {
  const response = await backend.signOut(c.req.raw);
  return response;
});
```

---

## 3. WorkOS: stateless bearer access-token verification

The WorkOS adapter (`@netscript/auth-workos`) provides a dedicated `createWorkosAccessTokenAuthenticator` to verify stateless Bearer JWTs issued by WorkOS. This is ideal when the client handles sign-in through WorkOS AuthKit and NetScript only serves as a protected API gateway.

### How it works
1. **JWKS Verification**: The authenticator reads the `Authorization: Bearer <token>` header, fetches the WorkOS public keys (JWKS) to confirm signature authenticity, and caches them locally.
2. **Audience & Issuer Claims**: It asserts that the token's audience (`aud`) matches the WorkOS `clientId` and that the issuer (`iss`) matches your WorkOS domain.
3. **Principal Mapping**: It maps standard WorkOS JWT claims (`sub`, `org_id`, `role`, `roles`, `permissions`) to the neutral NetScript `Principal` (scheme `"custom"`).
4. **Named Failure Outcomes**: Rejections are explicitly returned via `ok: false` with specific codes rather than thrown, allowing developers to handle missing versus malformed tokens differently.

```ts
import { Hono } from "npm:hono@^4";
import { createWorkosAccessTokenAuthenticator } from "@netscript/auth-workos";
import type { AuthnRequest } from "@netscript/service/auth";

// 1. Create a stateless WorkOS bearer authenticator
const authenticator = createWorkosAccessTokenAuthenticator({
  clientId: "client_01H...", // Your WorkOS Client ID
  jwksUrl: "https://api.workos.com/sso/jwks/client_01H...", // Optional custom JWKS
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

---

## Where to go next

- {{ comp.xref({ key: "cap:auth" }) }} — Overview of endpoints, DB tables, and environment variables.
- {{ comp.xref({ key: "explain:auth-model" }) }} — Deep dive into the pure-backend seam philosophy.
- [Reference: auth-better-auth](/reference/auth-better-auth/) — Full API reference for better-auth.
- [Reference: auth-kv-oauth](/reference/auth-kv-oauth/) — Full API reference for kv-oauth.
- [Reference: auth-workos](/reference/auth-workos/) — Full API reference for WorkOS.
