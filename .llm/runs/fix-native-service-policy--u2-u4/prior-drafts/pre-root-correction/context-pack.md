# Context pack: U2 native CORS authority · U4 exact anonymous requests

For: root read → separate different-family PLAN-EVAL → (if accepted) WSL Codex implementer.
Status: **PLAN only. UNRUN gates. No implementation authorization implied.**

## Identity

- Worktree `C:/Users/ericc/source/repos/netscript-native-service-policy-008`, branch
  `fix/native-service-policy`, HEAD `1582e1c9e1adcaa0a8a92900ec3b5b4b0db3e92d` (= origin/main).
- Package `@netscript/service` 0.0.8; pins Hono `jsr:@hono/hono@4.13.13`, `npm:@orpc/server@1.15.5`.
- Generator: native Fable 5.1 @ xhigh, session `c2672910-4296-4cbf-b7be-4652f52837eb`.
- Archetype 4 (Public DSL/Builder) + `SCOPE-service`; architecture tier → PLAN-EVAL hard stop.

## Read in this order

1. [plan.md](plan.md) — decision/evidence/footprint/gates/risks/rollback (compact).
2. [decisions.md](decisions.md) — D-U2-1..5, D-U4-1..6 locked; M-U2-1, M-U2-2, M-U4-1 MUST RESOLVE;
   Q-* deferred.
3. [research.md](research.md) — mechanics derivation (Hono `cors`/`newResponse`/`set res`/`compose`,
   oRPC `CORSPlugin`, auth middleware stages, dispatch table for path variants).
4. [drift.md](drift.md) — env remap, footprint deltas vs. EIS candidate, docs-vs-source gap.
5. [source-receipt.json](source-receipt.json) — sha256 of every load-bearing file inspected.

## The two defects in one paragraph each

**U2.** `createRPCPlugins` always installs oRPC's `CORSPlugin` (default resolver reflects any
origin). Hono's `withCors()` runs first and only re-applies headers *it* set; the oRPC response is
adopted by `c.res = …`, so on RPC/OpenAPI **success** a hostile or lookalike origin gets
`access-control-allow-origin: <origin>`, a request without `Origin` gets `""`, and `Vary` reads
`origin, Origin`. Error/401/403/413/404/raw/health responses are Hono-only and already correct.
Fix: builder passes `cors: false` into both handler factories; standalone factories keep default.

**U4.** `allowAnonymous` strings are decoded-path prefixes, method-blind, evaluated by **both** authn
and authz before any authorizer. A raw `route('all','/*')` host therefore receives `POST
/health/anything` anonymously. Fix: additive `{ method, path }` exact entries (both path
representations byte-equal; `GET`⇒`HEAD`), validated with `TypeError` at guard construction, legacy
strings/`[]`/default untouched.

## Footprints (exact; nothing else may change)

U2 (8): `packages/service/src/primitives/handlers.ts`, `packages/service/src/builder/service-rpc.ts`,
`packages/service/src/middleware/service-cors.ts` (JSDoc), `packages/service/tests/cors-rpc-policy_test.ts`
(new), `packages/service/tests/handlers_test.ts`, `packages/service/README.md`,
`packages/service/CHANGELOG.md`, conditional `docs/site/reference/service/index.md`.

U4 (9): `packages/service/src/auth/options.ts`, `packages/service/src/auth/auth-middleware.ts`,
`packages/service/src/auth/mod.ts`, `packages/service/mod.ts`,
`packages/service/tests/auth/middleware_test.ts`, `packages/service/tests/auth/builder-auth_test.ts`,
`packages/service/tests/auth/define-service-auth_test.ts`, `packages/service/README.md`,
`packages/service/CHANGELOG.md`.

Inspect-only: `service-builder-impl.ts`, `define-service.ts`, `service-auth-policy.ts`, contract
files, `packages/plugin/.../create-plugin-service.ts`, CLI reconciler/e2e tests.

## Gate commands (prospective; see plan.md for the full matrices and negative controls)

```powershell
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/service --ext ts,tsx
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/service/tests/
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/service --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/service --ext ts,tsx
deno task doc:lint; deno task arch:check; deno task quality:scan; deno task publish:dry-run
deno task e2e:cli   # merge-readiness pass only
```

Negative controls that must be **red on HEAD, green after**: hostile/lookalike/no-Origin ACAO on RPC
success; single `Vary: Origin` token; `POST /health/anything` reaching the catch-all under an
exact-only list; object entry type error today.

## Evaluator questions to press (PLAN-EVAL)

1. Is `cors?: boolean` on `RPCHandlerConfig` an acceptable public knob, or should the builder reach
   the factories through an internal path? (D-U2-1 rationale.)
2. Is "both path representations byte-equal" the right canonical rule, given deny-side
   `normalizePath` strips trailing slashes? (D-U4-2, drift D5.)
3. `GET`⇒`HEAD` implication vs. requiring explicit `HEAD` entries (D-U4-3).
4. Validation vocabulary and the `TypeError` surface at `build()` (D-U4-4).
5. MUST RESOLVE M-U2-1 / M-U2-2 / M-U4-1 — policy owners, not generator.
6. Are the test matrices sufficient on body identity, cookies, immutable responses and
   authenticator/authorizer counts (status-only is insufficient by order)?

## Forbidden for every downstream session until root authorizes implementation

No product/test/config/lock/dependency edits; no U1 paths/artifacts/other worktrees; no commit, push,
issue, PR or comment; no version bump, age override, cache reload/deletion; no paid/provider call
without a fresh root expense decision; no self-PASS. Legacy public hosts are not a shipping fallback.

## Dependencies named, not solved

U1 (plugin-host factories, other lane), U3 (per-request headers), E1 (issuer/roles/TTL/reader
credential/browser bootstrap), EIS adoption, process supervision, release/version/lock cut, issues
#2396/#829/#2364, docs-site regeneration owner.
