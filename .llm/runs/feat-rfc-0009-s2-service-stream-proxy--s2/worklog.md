# Worklog: RFC 0009 Slice 2 — Service stream-proxy mount, authoritative contract policy, pre-drain shutdown, and bindStreamProxy (#2678)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-rfc-0009-s2-service-stream-proxy--s2` |
| Branch | `feat/rfc-0009-s2-service-stream-proxy` |
| Issue | `#2678` (`Part of #2146`, milestone `0.0.10`, blocked-by `#2677` merged at `36a464c23`) |
| Archetype | Archetype 2 (`@netscript/service`) + Archetype 3 (`@netscript/plugin-streams-core`) |
| Scope overlays | `none` |

## Owner Direction (verbatim)

> "Then all merged RFC Ready for start implementation should be launched in separate main lanes with Neon and Fable 5.2 as reviewer (sub lane of it) + hydrogen on subsequent pass (where needed)"
>
> "Make sure relevant issues are assigned to milestone 0.0.10"
>
> "Merge all what is ready to merge as it lands"

### PLAN-EVAL Disposition

- `PLAN-EVAL: N/A` — governed directly by accepted RFC 0009 (`rfcs/0009-authorizing-stream-proxy.md`, merged at `af5107b8d` after `PLAN-EVAL: APPROVED` at `ab1ef854f6966168c66e93629c813d677d10e4f7`).

## Design

### Public Surface

- `@netscript/service`:
  - `StreamProxyMount`, `StreamProxyMountContext` (`params`, `credentialMode`, `principal`, `remoteAddr`, `shutdownSignal`)
  - `ServiceBuilder.withStreamProxy(mount: StreamProxyMount)`
  - `DefineServiceOptions.streamProxies?: readonly StreamProxyMount[]`
  - `ServiceEnvironment.shutdownSignal?: AbortSignal` (wired from `startServiceListener`'s pre-drain `AbortController.signal`)
  - `ContractPolicyBindingOptions.streamMounts?: readonly Pick<StreamProxyMount, 'endpoint'>[]`
  - `ContractAuthorizerOptions.streamEndpoints` and `ContractOverlayAuthorizerOptions.streamEndpoints`
- `@netscript/plugin-streams-core/proxy`:
  - `bindStreamProxy(endpoint, options)` validating `params`/`query` against endpoint schemas and enforcing `endpoint.clientAuth`

### Invariants

- Acyclic dependency graph: `@netscript/service` never imports `@netscript/plugin-streams-core`.
- AS7 compliance: zero `as <Type>` casts inside `packages/service/src/auth/**`.
- F-16 compliance: zero new immediate children added to `packages/service/src/auth/` (stays at 12).
- Pre-authn canonicalization (`%2F`, `%5C`, `..`, percent-encoded static segments -> `400`) and credential-selection / Cookie Origin+Fetch-Metadata middleware run before `withAuthn`, scoping `AuthnRequest` strictly to `credentialMode` and deferring `AuthnResult` headers/`Set-Cookie` to final mounted response composition.
- Symmetric 2D `patternsIntersect` overlap checks across stream mounts, `ServiceBuilder.route()`, built-in routes, oRPC OpenAPI routes, RPC mounts/aliases/deprecated prefixes, `rawRoutes`, and `retiredPaths`.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-11-26 | S2 | bootstrap | Branched `feat/rfc-0009-s2-service-stream-proxy` from `origin/main` (`36a464c23`), verified zero open-PR overlap, moved `#2678` to `status:impl`. |
| 2026-11-26 | S2 | implement | Implemented `StreamProxyMount` & `StreamProxyMountContext`, `ServiceBuilder.withStreamProxy`, `DefineServiceOptions.streamProxies`, `ServiceEnvironment.shutdownSignal` wired from `startServiceListener`'s pre-drain `AbortController.signal`, pre-authn stream canonicalization (`400`) & deterministic credential/Cookie Origin/Fetch-Metadata guard (`401`/`403`/`503`) scoping `AuthnRequest` strictly to `credentialMode`, deferred `AuthnResult` header/cookie ownership (fail-closed `503` on reserved headers + additive `Set-Cookie` + `withCors` preservation), authoritative `streamMounts` binding & `options.streamEndpoints` cross-check in `createContractAuthorizer` and `createContractOverlayAuthorizer`, unconditional `endpoint.access` enforcement on non-contract/structural mounts, symmetric 2D `patternsIntersect` overlap checks, and `bindStreamProxy` in `@netscript/plugin-streams-core/proxy`. |
| 2026-11-26 | S2 | verify | Verified 503/503 tests under `--sanitize-ops --sanitize-resources` across `packages/service/tests` and `packages/plugin-streams-core/tests`, 386-file check (0 errors), 385-file lint & fmt (0 findings), `deno doc --lint` on all 3 entrypoints (0 errors), `check-doctrine` (0 FAIL, 0 new WARN), `quality:gate` (0 findings), `docs:exports-drift`, `docs:accuracy`, `check:agent-docs-prose`, `check:mcp-export-corpus`, `check:publish-assets`, `check:netscript-jsr-specifiers`, `docs:jsdoc-examples`, `docs:readme-fences`, `publish:dry-run` on both packages, and zero `deno.lock` churn. |
| 2026-11-26 | S2 | impl-eval-r1-fixes | Addressed all 4 blocker areas (items 2–5) from Round-1 Sol 6.2 xhigh IMPL-EVAL on PR `#2692` (`#issuecomment-7204450839`): (2) strict allowlisted stream `AuthnRequest` scoping stripping `x-api-key`/trusted identity/unselected credential headers + literal `allowDirectNavigation === true`; (3) service-local immutable contract/overlay authorizer bindings (`WeakMap<ProcedurePolicyResolver, BoundContractAuthorizerEntry>`), unconditional mounted `endpoint.access` enforcement on every dispatch (even with custom `bind()`), dispatch-equivalent `patternsIntersect` handling Hono slash-spanning regex constraints and disjoint numeric constraints (`stream-path-pattern.ts`), and fail-closed unresolved lazy oRPC route detection (`traverseContractProcedures` / `isLazy`); (4) deferred raw `AuthnResult` handoff so throwing `responseHeaders`/`setCookies` getters return redacted `503` (never `500`) + unconditional exact `text/event-stream; charset=utf-8` Content-Type on `200`; (5) `validateHandedCredentialMode` before `authorize`, synchronous rejection + safe rejection consumption of Promise/thenable `parse()`/`~standard.validate()` outputs, and `Object.hasOwn` + null-prototype records for `params`/`query`. Re-verified 507/507 sanitized tests, check/lint/fmt, `deno doc --lint`, `arch:check`, `quality:gate`, all docs/corpus checks, both JSR dry-runs, zero `deno.lock` churn, and zero `@netscript/plugin-streams-core` dependency in `@netscript/service`. |

## Verification Receipts

- `deno test --allow-all --sanitize-ops --sanitize-resources packages/service/tests packages/plugin-streams-core/tests` — PASS (507 passed, 277 steps, 0 failed, 3 ignored)
- `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/service --root packages/plugin-streams-core --ext ts,tsx` — PASS (226 files, 0 errors)
- `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/service --root packages/plugin-streams-core --ext ts,tsx` — PASS (226 files, 0 occurrences)
- `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/service --root packages/plugin-streams-core --ext ts,tsx` — PASS (226 files, 0 findings)
- `deno doc --lint packages/service/mod.ts packages/service/src/auth/mod.ts packages/plugin-streams-core/proxy.ts` — PASS (0 errors)
- `deno task arch:check` & `deno run --allow-read --allow-run .llm/tools/fitness/check-doctrine.ts --root packages/service --root packages/plugin-streams-core` — PASS (0 FAIL, 0 new WARN)
- `deno task quality:gate` — PASS (0 findings)
- `deno task docs:exports-drift` & `deno task docs:accuracy` — PASS
- `deno task check:agent-docs-prose` & `deno task check:mcp-export-corpus` & `deno task check:publish-assets` & `deno task check:assets-barrel` — PASS
- `deno task check:netscript-jsr-specifiers` & `deno task docs:jsdoc-examples` & `deno task docs:readme-fences` — PASS
- `(cd packages/service && deno publish --dry-run --allow-dirty)` & `(cd packages/plugin-streams-core && deno publish --dry-run --allow-dirty)` — PASS
- `git diff --stat -- deno.lock packages/service/deno.json` — empty (zero lock or manifest churn)
