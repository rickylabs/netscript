# AS7 Auth Doctrine Conformance Report

Date: 2026-06-21  
Baseline: `91613467` plus AS7 branch changes  
Scope: `packages/plugin-auth-core`, `packages/auth-workos`, `packages/auth-better-auth`,
`packages/auth-kv-oauth`, `plugins/auth`, `packages/service/src/auth`

## Verdict Summary

| Surface | Archetype | Verdict | Findings |
| --- | --- | --- | --- |
| `@netscript/plugin-auth-core` | Archetype 1, small contract with contract subpaths | PASS with docs warnings | Contract/types package; `mod.ts` root plus declared subpaths; single sanctioned oRPC contract cast. |
| `@netscript/auth-workos` | Archetype 2, integration backend | PASS | Pure `AuthBackendPort` factory, no backend casts, no deep package imports. |
| `@netscript/auth-better-auth` | Archetype 2, integration backend | PASS | Pure `AuthBackendPort` factory, no backend casts, no deep package imports. |
| `@netscript/auth-kv-oauth` | Archetype 2, integration backend | PASS | KV/OAuth adapter exposes typed backend and helper subpaths; no return casts. |
| `@netscript/plugin-auth` | Archetype 5, plugin package | PASS with accepted warning | Service, contract, stream, database, verification, and manifest axes present. `services/src/main.ts` keeps an existing default service export warning. |
| `@netscript/service/src/auth` | Archetype 4 host seam inside `@netscript/service` | PASS | Auth seam is structural ports and middleware; no package-local inheritance or deep auth imports. |

## Surface Records

### `plugin-auth-core`

- Public surface: `mod.ts` re-exports `src/public/mod.ts`; declared subpaths cover `domain`,
  `ports`, `contracts/v1`, `streams`, `config`, `presets`, and `testing`.
- Structure: contract package has focused role folders and colocated tests.
- Abstraction shape: `AuthBackendPort`, registry, and interactive sub-port are structural ports.
  Cross-package extension is registration through `createAuthBackendRegistry`.
- Cast policy: only the sanctioned `authContractV1` oRPC contract assertion remains.
- Gate status: `deno task arch:check` hard-fail clean; warnings recorded in debt.

### Backend Packages

- `auth-workos`, `auth-better-auth`, and `auth-kv-oauth` are Archetype 2 integration packages.
- Factories declare `: AuthBackendPort` or `: Promise<KvOAuthBackend>` and return structurally typed
  objects without return assertions.
- No backend package imports another NetScript package through `@netscript/*/src`.
- No backend package introduces abstract/base classes; errors extend `Error` only.

### `plugins/auth`

- Plugin package shape is present: `contracts.ts`, `services/`, `database/`, `streams/`,
  `verify-plugin.ts`, `src/public`, and tests.
- Extension point is the named backend registry: active backend selection resolves through
  `Map<string, AuthBackendPort>` plus a default.
- The top-level oRPC router keeps the sanctioned `any` bridge with `deno-lint-ignore` in
  `services/src/router.ts`.
- Previous stream and service casts were removed through structural schemas, a typed StreamDB
  facade, and a `WatchableKv` guard.

### Service Auth Seam

- `packages/service/src/auth` exposes structural `AuthenticatorPort`, `AuthorizerPort`, middleware,
  Hono context helpers, and credential authenticators.
- The seam is host-facing and remains published through `@netscript/service/auth`.
- No AS7 gate failures detected.

## Deferred Findings

- Auth docs metadata warnings are recorded in `.llm/harness/debt/arch-debt.md`.
- Full repo doctrine scan remains red on unrelated historical debt and is preserved as
  `deno task arch:check:repo`.
- JSR provenance workflow is not wired; this is recorded as release-process debt.
