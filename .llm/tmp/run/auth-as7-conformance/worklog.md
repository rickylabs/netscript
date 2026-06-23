# AS7 Worklog

## Design

- Public surface: no new package exports beyond JSR/doc-lint fixes for interactive auth sub-port
  types and plugin stream facades.
- Domain vocabulary: `AuthBackendPort`, `InteractiveFlowPort`, `AuthStreamSchema`,
  `AuthPluginManifest`, `WatchableKv`.
- Ports: existing auth backend registry and service auth ports only.
- Constants: AS7 gate IDs are `AS7/F-AUTH-CAST`, `AS7/F-AUTH-IMPORT`,
  `AS7/F-AUTH-BACKEND-FACTORY`, `AS7/F-AUTH-CONTRACT`, `AS7/F-AUTH-INHERITANCE`.
- Commit slices: conformance report, fitness gate wiring, JSR scorecard/validation.
- Deferred scope: no structural refactors outside AS7-owned auth typing and gate wiring.
- Contributor path: add a backend by returning `AuthBackendPort` from a named factory and register it
  through `createAuthBackendRegistry`; `deno task arch:check` catches unsafe casts/deep imports.

## Evidence

| Gate | Command | Exit | Result |
| --- | --- | --- | --- |
| Auth doctrine | `rtk proxy deno task arch:check` | 0 | PASS; auth roots `FAIL=0`. |
| Legacy repo doctrine | `deno task arch:check:repo` equivalent observed through old root scan | 1 | Existing non-auth debt; recorded. |
| Gate script check | `deno check --unstable-kv .llm/tools/fitness/check-doctrine.ts` | 0 | PASS. |
| Scoped check | `.llm/tools/run-deno-check.ts` over touched auth/gate files | 0 | PASS, 47 files. |
| Scoped lint | `.llm/tools/run-deno-lint.ts` over touched auth/gate files | 0 | PASS, 47 files. |
| Scoped fmt | `.llm/tools/run-deno-fmt.ts` over touched auth/gate files | 0 | PASS, 47 files. |
| Auth tests | `deno test --unstable-kv --allow-all ...auth/service tests...` | 0 | PASS, 120 tests. |
| JSR doc/publish | Per-package commands in `jsr-scorecard.md` | 0 | PASS for all source-controllable auth surfaces. |

## Implementation Notes

- Removed non-sanctioned assertions from plugin auth stream/service typing by using structural public
  types and a `WatchableKv` runtime guard.
- Re-exported `InteractiveFlowPort` and `InteractiveCallbackResult` from backend packages so
  full-export doc-lint can see the referenced public types.
- Added AS7 auth-specific checks to `check-doctrine.ts`.
