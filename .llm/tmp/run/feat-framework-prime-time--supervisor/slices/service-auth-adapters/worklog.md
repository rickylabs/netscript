# Worklog — service-auth-adapters

## Slice 1 — Catalog + scaffolding

- Added catalog entries:
  - `better-auth`: `^1.6.20`
  - `@workos-inc/node`: `^10.4.0`
- Added packages:
  - `packages/auth-workos`
  - `packages/auth-better-auth`
- Catalog law:
  - Runtime provider deps are package-local via `catalog:`.
  - No dependency was added to `@netscript/service`.
  - `@prisma/client` catalog entry was not changed.
- Validation:
  - `deno check --unstable-kv packages/auth-workos/mod.ts packages/auth-better-auth/mod.ts` — PASS.
  - `deno task deps:latest` — PASS for the new provider pins; neither `better-auth` nor
    `@workos-inc/node` appeared in the behind list.
  - `deno task deps:audit` — NON-BLOCKING EXISTING ADVISORIES: reported existing `undici` and `vite`
    advisories outside this slice's new provider package graph.
- Lock hygiene:
  - `deno.lock` changed only to register the two new workspace members and their currently imported
    package dependencies.

## Slice 2 — WorkOS sealed-session authenticator

- Added `createWorkosAuthenticator({ workos, cookiePassword, cookie?, refresh? })`.
- Consumes `AuthenticatorPort`, `AuthnRequest`, `AuthnResult`, and `Principal` from
  `@netscript/service/auth`; the port is not redefined.
- Principal mapping:
  - `subject`: WorkOS `user.id`.
  - `scopes`: WorkOS `permissions`.
  - `roles`: union of WorkOS `role` and `roles`.
  - `scheme`: `custom`.
  - `claims`: camelCase `organizationId`/`sessionId` plus WorkOS session metadata.
- Refresh-cookie path:
  - `refresh: "always"` calls the SDK session `.refresh()`.
  - A returned `sealedSession` is emitted via `AuthnResult.setCookies`.
- Validation:
  - `deno check --unstable-kv packages/auth-workos/mod.ts packages/auth-workos/tests/workos-authenticator_test.ts packages/auth-workos/tests/workos-node-compat_test.ts` — PASS.
  - `deno test --allow-net packages/auth-workos/tests/` — PASS, 4 tests.
  - `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/auth-workos --ext ts,tsx --ignore-line-endings` — PASS.
  - `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/auth-workos --ext ts,tsx` — PASS.
- Required node-compat smoke:
  - `@workos-inc/node@10.4.0` imports and `new WorkOS(...).userManagement.loadSealedSession(...).authenticate()` runs under Deno 2.8.3 node compatibility.
