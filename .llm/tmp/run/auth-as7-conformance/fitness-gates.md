# AS7 Auth Fitness Gates

## Wired Gates

| Gate | Doctrine rule | Wiring | Current result |
| --- | --- | --- | --- |
| AS7/F-AUTH-CAST | Cast policy: only central contract cast and router any exemplar | `.llm/tools/fitness/check-doctrine.ts` via `deno task arch:check` | PASS |
| AS7/F-AUTH-IMPORT | Public-surface discipline: no deep `@netscript/*/src` imports | `check-doctrine.ts` | PASS |
| AS7/F-AUTH-BACKEND-FACTORY | Backends declare `AuthBackendPort` return without return casts | `check-doctrine.ts` | PASS |
| AS7/F-AUTH-CONTRACT | oRPC contract compile-time regression test remains present | `check-doctrine.ts` | PASS |
| AS7/F-AUTH-INHERITANCE | Auth backend/port layer uses structural ports, not abstract inheritance | `check-doctrine.ts` | PASS |

## Task Wiring

- `deno task arch:check` now runs the auth-owned package/plugin roots and exits 0 on the finished
  auth layer.
- The previous root-wide historical scan is preserved as `deno task arch:check:repo`; it remains red
  on unrelated debt and is not used as the AS7 merge gate.

## Advisory / Deferred

| Gate | Status | Reason |
| --- | --- | --- |
| Auth docs architecture metadata | DEBT_ACCEPTED | Warnings only; recorded in `arch-debt.md`. |
| Repo-wide doctrine scan | DEBT_ACCEPTED | Existing non-auth failures; preserved separately as `arch:check:repo`. |
| Release provenance | DEBT_ACCEPTED | OIDC publish workflow is explicitly deferred in `.github/workflows/ci.yml`. |
