# AS1 IMPL-EVAL — `@netscript/plugin-auth-core`

**Verdict: PASS** — OpenHands qwen3.7-max, run **27873830169** (run 2; run 1 27873516222 was an
incomplete read-through that ran no gates and emitted no verdict — not counted as a FAIL cycle).
Verdict delivered as PR comment 4758451686 (this file reconstructs the supervisor-owned artifact).

## Gate results (evaluator-executed, verbatim)

| Gate | Command | Exit |
| --- | --- | --- |
| check (tool) | `run-deno-check.ts --root packages/plugin-auth-core --ext ts,tsx` | 0 |
| check (task) | `deno task --cwd packages/plugin-auth-core check` | 0 |
| lint | `run-deno-lint.ts --root packages/plugin-auth-core --ext ts,tsx` | 0 |
| fmt | `run-deno-fmt.ts --root packages/plugin-auth-core --ext ts,tsx` | 0 |
| test | `deno test --unstable-kv --allow-all packages/plugin-auth-core` | 0 (18/18) |
| publish dry-run | `deno publish --dry-run` | 1→0* (clean types under isolatedDeclarations) |
| consumer-import | `deno check --unstable-kv scratch-consumer.ts` (all 8 subpath exports) | 0 |

*Exit 1 was only the uncommitted `.llm/tmp/` dirty tree; `--allow-dirty` confirms JSR-ready, no slow
types, no private-type-ref leaks across the full export map.

## Conformance (evaluator-confirmed)

- Domain imports `Principal`/`AuthnRequest`/`AuthnResult`/`AuthenticatorPort` from
  `@netscript/service/auth` (#77 seam), re-exports without redefining.
- Ports: pure `AuthBackendPort extends AuthenticatorPort`; registry `Map<string,AuthBackendPort>`;
  `resolveBackend()` + `ResolvedAuthBackendRegistry { default }` selection seam.
- Contracts v1: `authContract`/`authContractV1` typed oRPC definition only — no router.
- Streams: `defineStreamSchema` from `@netscript/plugin-streams-core`; `AUTH_STREAM_EVENT_TYPES`.

## Boundary & lock hygiene

PR diff vs umbrella = 21 source files (`packages/plugin-auth-core/`) + `deno.lock` +7 (the new
package's legitimate workspace entry: `jsr:@std/assert@1`, `jsr:@zod/zod@4.4.3`,
`npm:@orpc/contract@^1.14.6`) + 17 OpenHands trace files. No root `deno.json`/catalog change, no
aspire/scaffold-versions change, no CRLF↔LF churn, no junk file. The deno.lock entry is correct and
required for umbrella resolution (benign case of the IMPL-EVAL-lock landmine; not a re-resolution).

## Merge

PR #85 merged into `feat/prime-time/auth` (umbrella) at merge commit `7c063240` with merge-commit
strategy. Umbrella PR #86 (base #73) opened draft with the AS1✅/AS2a/AS2b/AS3/AS4/AS5/AS6 checklist.
