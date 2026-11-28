# Worklog — RFC 0013 S3

## Design Checkpoint & Plan-Gate Record

- **Plan-Gate:** N/A — slice executes accepted RFC 0013 §4.1 Phase 0a items 5–6, §4.2, §4.4, §4.5 (`rfcs/0013-orpc-v2-readiness.md`, owner-accepted 2026-11-27 in PR `#2674`) with no unapproved scope expansion.
- **Baseline:** Branched from `origin/main` `bc4bf4522` (post-S2 PR `#2707`). Sub-issue `#2708` filed and linked.

## Execution Log

- **2026-11-28 (Pass 1):**
  - Added internal `ProtocolGuardPluginV1` (`packages/service/src/primitives/rpc-protocol-guard.ts`, `name: 'netscript-rpc-protocol-guard-v1'`, `order: 0 < 9e6` inside v1 `CORSPlugin`), mounted strictly in `createRPCHandler` (never `createOpenAPIHandler`).
  - Updated `packages/service/src/middleware/service-cors.ts` and `packages/service/src/builder/service-builder-impl.ts` to append `X-NetScript-RPC-Protocol` (case-insensitively deduplicated) to explicit `allowHeaders` preflights strictly on mounted RPC paths (`rpcPath` / `rpcAliases`), keeping non-RPC routes and non-RPC services untouched.
  - Updated `packages/service/README.md` and RPC-path assertions in `packages/service/tests/cors-response-authority_test.ts`; added `packages/service/tests/rpc-protocol-guard_test.ts`.
  - Enforced `redirect: 'error'` after `...init` spread in `packages/sdk/src/client/http-client-link.ts`; added live cross-origin 307 redirect + post-spread override tests in `packages/sdk/tests/integration/http-redirect-guard_test.ts`.
- **Pass-1 Local Verification (Deno 2.9.8):**
  - Sanitized S3 test suite (`cors-response-authority_test.ts`, `rpc-protocol-guard_test.ts`, `cors-policy_test.ts`, `cors-topology_test.ts`, `handlers_test.ts`, `http-redirect-guard_test.ts`, `client-contribution-adapter_test.ts`) — **46 passed (190 steps), 0 failed**
  - Complete `packages/service/tests/` + `packages/sdk/tests/` suites — **609 passed (378 steps), 0 failed, 3 ignored**
  - `deno ci` — PASS
  - `deno task deps:check` — PASS (`reference-lock PASS locks=3`, 0 `@orpc/` violations, `private-lock-workspace PASS locks=1`, `zod-alignment PASS`, `db-alignment PASS`)
  - `deno task check` — PASS (0 errors)
  - `deno task lint` — PASS (0 errors)
  - `deno task fmt:check` — PASS (0 findings)
  - `deno task quality:cli` — PASS (0 findings)
  - `deno task quality:gate` (`quality:scan` + `arch:check`) — PASS
  - `deno task docs:exports-drift` — PASS
  - `deno task check:mcp-export-corpus` — PASS
  - `deno task check:agent-docs-prose` — PASS
  - `deno task check:publish-assets` & `deno task check:assets-barrel` & `deno task release:preflight` — PASS
  - `deno task check:netscript-jsr-specifiers` — PASS
  - `deno task publish:dry-run` (all 37 publishable packages) — PASS
  - `deno doc --lint packages/service/mod.ts packages/sdk/src/client/mod.ts` — PASS (0 errors)
