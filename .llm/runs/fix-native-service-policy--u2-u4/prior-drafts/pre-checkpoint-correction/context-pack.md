# Context pack: U2 native CORS response authority · U4 exact anonymous requests

For: root read → separate different-family PLAN-EVAL → (if accepted) WSL Codex implementer.
Status: **PLAN revision 2 (root-policy-addendum applied). UNRUN gates. No implementation
authorization implied. No root/independent acceptance claimed.**

## Identity

- Worktree `C:/Users/ericc/source/repos/netscript-native-service-policy-008`, branch
  `fix/native-service-policy`, HEAD `1582e1c9e1adcaa0a8a92900ec3b5b4b0db3e92d` (= origin/main).
- Package `@netscript/service` 0.0.8; pins Hono `jsr:@hono/hono@4.13.13`, `npm:@orpc/server@1.15.5`;
  locked consumer upstream `@durable-streams/server@0.3.9`.
- Generator: native Fable 5.1 @ xhigh, session `c2672910-4296-4cbf-b7be-4652f52837eb`.
- Archetype 4 (Public DSL/Builder) + `SCOPE-service`; architecture tier → PLAN-EVAL hard stop.

## Read in this order

1. [root-policy-addendum.md](root-policy-addendum.md) — root's counterexample + dispositions.
2. [plan.md](plan.md) — decision/evidence/footprint/gates/risks/rollback.
3. [decisions.md](decisions.md) — D-U2-1..5, D-U4-1..6 locked; M-* resolved/dissolved; Q-* deferred.
4. [research.md](research.md) — §2.2 Hono mechanics, §2.3 oRPC, §2.4/§2.4b defect tables, §3
   auth stages and dispatch table.
5. [drift.md](drift.md) — env remap, revision-1→2 corrections, footprint deltas.
6. [source-receipt.json](source-receipt.json) — sha256 of every load-bearing file.

## The two defects

**U2.** Hono's `cors()` writes its decision on the placeholder before `next()`; `set res` re-applies
only those headers. Any later producer — oRPC's default `CORSPlugin` (reflects any origin, `ACAO ""`
without Origin), a raw proxy forwarding `@durable-streams/server`'s `ACAO *` + allow/expose headers,
or a handler — leaves headers Hono never set. Root measured at 1582: hostile `/raw` ⇒ `ACAO *`
survives; allowed `/raw` ⇒ upstream allow/expose survive; `/health` correct. Fix: `withCors()`
wraps Hono's middleware and, after `next()`, deletes the six `access-control-*` headers from the
final response, re-applies the snapshot Hono wrote before `next()`, and dedupes `Vary`. No new API;
standalone factories untouched; no-`withCors()` services unchanged.

**U4.** `allowAnonymous` strings are decoded-path prefixes, method-blind, evaluated by **both** authn
and authz before any authorizer; a raw `route('all','/*')` host receives `POST /health/anything`
anonymously (`/health%2Fx` is *not* affected — `%2F` stays encoded). Fix: additive `{ method, path }`
exact entries (exact method, `GET` ≠ `HEAD`; both path representations byte-equal), `TypeError` at
guard construction, legacy strings/`[]`/default untouched; six explicit entries for the native
health trio with HEAD probes; no helper constant.

## Footprints (exact; nothing else may change)

U2 (4 + 1 conditional): `packages/service/src/middleware/service-cors.ts`,
`packages/service/tests/cors-response-authority_test.ts` (new), `packages/service/README.md`,
`packages/service/CHANGELOG.md`; conditional `docs/site/reference/service/index.md` (prose).

U4 (9): `packages/service/src/auth/options.ts`, `packages/service/src/auth/auth-middleware.ts`,
`packages/service/src/auth/mod.ts`, `packages/service/mod.ts`,
`packages/service/tests/auth/middleware_test.ts`, `packages/service/tests/auth/builder-auth_test.ts`,
`packages/service/tests/auth/define-service-auth_test.ts`, `packages/service/README.md`,
`packages/service/CHANGELOG.md`.

Inspect-only: `service-builder-impl.ts`, `service-rpc.ts`, `primitives/handlers.ts`,
`define-service.ts`, `service-auth-policy.ts`, contract files, `create-plugin-service.ts`,
`plugins/streams/services/src/{main,proxy,proxy-headers}.ts`, CLI reconciler/e2e tests.

## Gate commands (prospective; full matrices + negative controls in plan.md)

```powershell
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/service --ext ts,tsx
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/service/tests/
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/service --ext ts,tsx
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/service --ext ts,tsx
deno task doc:lint; deno task arch:check; deno task quality:scan; deno task publish:dry-run
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all plugins/streams/services/tests/ packages/plugin/tests/service/
deno task e2e:cli   # merge-readiness pass only
```

Negative controls **red on HEAD, green after**: hostile `/raw` `ACAO *` and allowed `/raw` upstream
allow/expose (root-measured); hostile/lookalike/no-Origin ACAO on RPC success and duplicate `Vary`
(derived); `POST /health/anything` reaching the catch-all under an exact-only list; `HEAD /health`
admitted by a `GET`-only list (must be 401); object entry type error today.

## Evaluator questions to press (PLAN-EVAL)

1. Snapshot-then-replace inside the existing `withCors()` middleware vs. any alternative that avoids
   reading `c.res` before `next()` (placeholder creation side effect) — D-U2-1.
2. Is replacing (not merging) handler/upstream `expose-headers` the right service-owned semantics?
3. No-`withCors()` services unchanged (oRPC reflect persists) — acceptable as "no authority
   installed", with Q-U2-5 deferred? Classification honesty (M-U2-1 as applied).
4. Both-representations byte-equality vs. deny-side `normalizePath` asymmetry — D-U4-2, drift D5.
5. `GET` ≠ `HEAD` ergonomics (six entries) — root policy; confirm README recipe suffices.
6. Validation vocabulary and `TypeError` at `build()` — D-U4-4.
7. Sufficiency of body/cookie/immutable/HEAD/OPTIONS/mutation-count assertions.

## Forbidden for every downstream session until root authorizes implementation

No product/test/config/lock/dependency edits; no U1 paths/artifacts/other worktrees; no commit, push,
issue, PR or comment; no version bump, age override, cache reload/deletion; no paid/provider call
without a fresh root expense decision; no self-PASS; do not execute root's receipt script. Legacy
public hosts are not a shipping fallback.

## Dependencies named, not solved

U1 (plugin-host factories, other lane), U3 (per-request headers), E1 (issuer/roles/TTL/reader
credential/browser bootstrap), EIS adoption, process supervision, release/version/lock cut, issues
#2396/#829/#2364, docs parity owner, Q-U2-3/5/6, Q-U4-2/3.
