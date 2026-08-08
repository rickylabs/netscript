# fix(service): the default CORS policy is `origin: '*'`, which makes credentialed browser calls impossible on every generated and plugin service — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** TA-03c · **Proposed milestone:** 0.0.8 (post-shift "Runtime truth + service slice", SYNTHESIS §5.3) · **Labels:** `type:fix` `area:service` `area:plugins` `area:auth` `priority:p1` `status:triage` · **Depends on:** none (blocks the browser half of TA-03b; pairs with T1-05)

## Summary

`ServiceBuilder.withCors` defaults to `{ origin: '*' }`, and `createPluginService` passes an
undefined `config.cors` straight into it, so every first-party plugin service and every generated
service answers with `Access-Control-Allow-Origin: *`. That header is spec-incompatible with
`credentials: 'include'`: a browser will refuse to send or store credentials against it. Combined
with cross-origin service discovery and the `__Host-` cookie prefix, browser cookie auth is
impossible today **even if** the SDK gained a credentials option — which is why this must be decided
before, not after, the client seam lands.

## Evidence

- Corpus: `research/repo-audit/auth.md` §3.4 and §4.2, gap **G7**.
- `packages/service/src/builder/service-builder-impl.ts:95-98` — `withCors(options?: CorsOptions)`
  calls `this.app.use('*', cors(options ?? { origin: '*' }))`.
- `packages/plugin/src/service/presentation/create-plugin-service.ts:139-141` — `if
  (config.enableCors !== false) { builder = builder.withCors(config.cors) }`; `config.cors` is
  `undefined` unless a plugin supplies it.
- `plugins/auth/services/src/main.ts:70-84` — the auth service supplies no `cors`, so the identity
  service itself answers `*`.
- `packages/sdk/src/discovery/service-url.ts:97-128` — `getServiceUrl` resolves the **browser** URL
  from Aspire-injected `import.meta.env`, so the app on its own port calls `http://localhost:8094`
  cross-origin.
- `packages/auth-kv-oauth/src/backend.ts:125` — the session cookie name defaults to
  `__Host-ns_session`; `packages/auth-kv-oauth/src/cookies.ts:105-121` asserts `__Host-` requires
  `Path=/`, no `Domain`, and `Secure`. A `__Host-` cookie set on `:8094` is never sent to `:8000`.
- There is no same-origin proxy, BFF route, or gateway anywhere in the scaffold (`auth.md` §4.2).

## Current surface

Three independent facts compose into "no browser session is possible": a wildcard CORS origin, a
cross-origin service URL handed to the browser, and an origin-locked cookie prefix. Each is
defensible alone; together they mean the only shipped interactive backend cannot authenticate a
browser through the generated app, and no SDK option can rescue it.

## Target contract

1. **Decide and record the topology.** Two supported shapes, one default:
   - *same-origin BFF* — the Fresh app proxies `/api/*` to the service, cookies stay first-party,
     `__Host-` remains valid; or
   - *bearer* — the browser holds no cookie, the app forwards a token through the T1-05 client seam
     and the service uses a bearer authenticator.
   The decision is written into `docs/architecture/doctrine/` (or an `arch-debt.md` entry if
   deferred) and the scaffold generates the chosen shape.
2. `withCors` no longer defaults to `origin: '*'`. The default is an explicit allowlist derived from
   the generated app's origin(s); a wildcard requires an explicit opt-in and is rejected when
   `credentials` is enabled.
3. `createPluginService` passes the workspace allowlist rather than `undefined`.
4. `getServiceUrl` gains (or documents) a same-origin mode so the browser path and the
   server-to-server path can differ without the consumer hand-rolling URLs.

## Acceptance

- [ ] The browser auth topology is decided and recorded in a doctrine or `arch-debt.md` entry.
- [ ] `withCors` no longer defaults to `origin: '*'`.
- [ ] A generated workspace produces an explicit CORS allowlist covering its own app origin.
- [ ] Plugin services receive the workspace allowlist instead of `undefined`.
- [ ] The scaffold generates the chosen topology (same-origin route or bearer forwarding).
- [ ] Negative test: a wildcard origin combined with credentialed CORS is rejected at build time.
- [ ] Negative test: a request from an origin outside the allowlist is refused.
- [ ] Negative test: a `__Host-` session cookie issued by the chosen topology is accepted on a subsequent request from the generated app.
- [ ] Negative test: the pre-fix arrangement (wildcard + cross-origin + `__Host-`) is proven to drop the cookie, so the regression cannot return silently.
- [ ] gate: `deno task e2e:cli run scaffold.runtime --cleanup` green with the new default.
- [ ] The CORS default change is recorded as breaking with a migration note.

## Boundaries

- **Do not** add the SDK `credentials`/`headers` option — **T1-05** owns the client seam. This issue
  exists so that option can work when it lands.
- **Do not** make the auth handlers emit cookies — **TA-03b** owns the response half.
- **Do not** build the plugin frontend procedure gateway or its CSRF/origin checks — **#934** owns
  them; the allowlist here is the service-level policy, not the gateway.
- **Do not** change Aspire host-port pinning — **#979** (+ **#980**) own it; this issue must not
  hardcode ports and should read origins from the workspace configuration.
- **Do not** add auth UI — **#942** owns it.

## Docs/consumer proof

`docs/site/identity-access/how-to/add-authentication.md` teaches a `curl`-based cookie round trip
because no browser round trip works. Adoption is proven when a generated app — not `curl` — completes
a sign-in and a subsequent authenticated read, and when the docs state the supported topology
explicitly instead of leaving the reader to discover the wildcard/`__Host-` conflict at runtime.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. Sourced from
`research/repo-audit/auth.md` gap G7; all cited line numbers re-verified against worktree
`fac9e339042c` on 2026-08-08. Split from the TA-03 cluster so each session-lifecycle defect carries
its own acceptance and negative tests.
