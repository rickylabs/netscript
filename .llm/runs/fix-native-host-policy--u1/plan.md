# U1 plan — additive inert caller-policy host factories

Status: PLAN generated (this file). No PLAN-EVAL verdict, no implementation. Baseline `1582e1c9`,
branch `fix/native-host-policy`. Generator: same-session Muse fallback
(`ses_e817b95e9ffe8KjbVBmpy4yDxZ`, openrouter/meta/muse-spark-1.3, variant max — label only).

## 1. Goal and scope

Add one inert public `./service` factory per plugin (`workers`, `streams`) so reviewed callers can
supply `ServiceAuthPolicy` + `CorsOptions` + native `ServeOptions` without copying a private host.
Exactly 12 product paths; per plugin: existing `deno.json`, `README.md`, `services/src/main.ts`; new
`services/mod.ts`, `services/src/service.ts`, `services/src/service_test.ts`.

Non-goals (separate leaves): U2 native CORS response authority, U3 browser credentials, E1 EIS
adoption/policy, #829 supervision chain, #2364 resolver, versions/releases, dependencies, locks.

## 2. Archetype, overlays, verdicts, APs

- **Archetype 5 (plugin)** — both owners are first-party `plugins/*` thin composition over
  core-owned primitives (`@netscript/service`, `@netscript/plugin/service`, `-core` packages).
  Nothing convention-bearing is defined here; options/start APIs compose native types.
- **Runtime subtype folded in** (Arch 3 concerns, single archetype per README rule): the factories
  own listener lifecycle (start/stop/drain, AbortSignal, owned-upstream cleanup) → F-13 applies.
- **Overlays**: SCOPE-service (services entrypoints, listener behavior, consumer compile) +
  SCOPE-docs (README recipes must match code; run artifacts describe this run only).
- **Doctrine verdicts** (file 10, 2026-08-12): `plugins/workers` = Refactor (connector thinness —
  this plan _improves_ it by extracting composition into `service.ts` without widening),
  `plugins/streams` = Keep, `packages/service` = Refactor (untouched by U1).
- **APs in scope**: AP-1 (file-size budgets §5), AP-8/AP-9 (no container, no shared helper — two
  intentional sibling implementations), AP-11 (no hidden globals; env/KV read inside `start`), AP-13
  (zero _new_ `console.*`; 4 pre-existing lines move verbatim, baseline-diffed), AP-19 (README
  permission blocks), AP-22 (new `mod.ts` files are declared subpath exports — allowed), AP-25 (side
  effects only in `service.ts` start path = edge + legacy `main.ts`).
- **Known debt honored**: `streams-connector-sound-deferred` (proxy stays via sanctioned raw route),
  `plugin-service-router-composition-any` (router casts untouched), `workers-contract-*` (contract
  shim untouched). U1 adds no new debt entry.

## 3. Exact public surface

### Workers — `services/mod.ts` re-exports `services/src/service.ts`

```ts
import { assertServiceAuthPolicy, type ServiceAuthPolicy } from '@netscript/service/auth';
import type { CorsOptions, RunningService, ServeOptions } from '@netscript/service';
import type { PluginServiceContext } from '@netscript/plugin/sdk';

export interface WorkersServiceOptions {
  readonly auth: ServiceAuthPolicy;
  readonly cors?: CorsOptions;
  readonly serve?: ServeOptions;
}
export function startWorkersService(
  context: PluginServiceContext,
  options: WorkersServiceOptions,
): Promise<RunningService>;
```

### Streams — `services/mod.ts` re-exports `services/src/service.ts`

```ts
import { assertServiceAuthPolicy, type ServiceAuthPolicy } from '@netscript/service/auth';
import type { CorsOptions, RunningService, ServeOptions } from '@netscript/service';

export interface StreamsServiceOptions {
  readonly auth: ServiceAuthPolicy;
  readonly cors?: CorsOptions;
  readonly serve?: ServeOptions;
}
export function startStreamsService(
  options: StreamsServiceOptions,
): Promise<RunningService>;
```

Surface rules: `mod.ts` = `@module` doc + runnable JSDoc example + the 2 named re-exports only (≤20
symbols, F-5). No `export *`. Internal helpers/constants stay in `service.ts`, exported there only
if the legacy adapter imports them (never re-exported by `mod.ts`).

## 4. Locked behavior

1. **Inert import**: `services/mod.ts` + `service.ts` execute zero env/file/KV/net reads at import.
   All reads move into `start*`. No `@netscript/kv/redis` import in workers `service.ts` — KV
   adapter registration is host-owned (stays in legacy `main.ts`); README documents the host import
   for callers needing Redis/Garnet. Factories resolve `getKv()` lazily inside `start`.
2. **Auth first**: first statement of each start is `assertServiceAuthPolicy(options?.auth)` —
   missing/mixed/blank-reason/malformed-callable postures throw the native redacted `TypeError`
   before any env/KV/storage/port/internal-server work. Order oracle: invalid auth + unset PORT ⇒
   auth `TypeError`, not the PORT error. No implicit public on either factory; explicit
   `{ public: true, reason }` forwards.
3. **Identity pass-through**: `auth`/`authn`/`authz` objects, `serve` object, workers `context`
   values pass by reference, never copied/normalized/mutated. Custom `allowAnonymous` replaces the
   native default (native semantics — the assert adds no `/health`).
4. **Ports**: explicit `serve.port` **including 0** wins (native `??`); else workers
   `context.env.PORT ?? Deno.env.get('PORT')`, streams
   `Deno.env.get('PORT') ??
   Deno.env.get('STREAMS_PORT')`; missing ⇒ exact legacy throw text;
   parse = legacy `Number.parseInt(v, 10)` with no added validation. No hostname env seam.
   `.serve(options.serve)` passes the caller's object by identity (legacy ≡ `serve: undefined`).
5. **Workers CORS**: `cors: options.cors` straight through — omitted keeps native env-snapshot
   behavior byte-for-byte.
6. **Streams CORS**: new-factory defaults = exact legacy protocol `allowMethods` (6) /
   `allowHeaders` (11) / `exposeHeaders` (14) as frozen `readonly` arrays in `service.ts`; caller
   arrays **replace** per-field; omitted `origin` ⇒ `undefined` (native `NETSCRIPT_CORS_ORIGINS`
   snapshot); no wildcard default; `credentials`/`maxAge` keys only when the caller provides them.
   Caller `credentials: true` + wildcard still fails closed in native assert.
7. **Legacy workers `main.ts`**: keeps redis import, `PluginServiceBootstrap`,
   `loadWorkersServiceContext`, `import.meta.main` block, type re-exports. Default becomes a 3-line
   delegate: `startWorkersService(ctx, { auth: { public: true, reason: <exact #1383
   string> } })`
   (reason const imported from `service.ts`).
8. **Legacy streams `main.ts`**: keeps start-on-import (top-level await, `void running`) with zero
   semantic change: single
   `startStreamsService({ auth: { public: true, reason: <exact #1383
   string> }, cors: { origin: '*', allowMethods/allowHeaders/exposeHeaders: <frozen legacy
   arrays> } })`,
   `serve` omitted. No `import.meta.main` guard.
9. **Streams env seams stay env, read in `start`**: `STREAMS_DATA_DIR` (durability probe, unchanged
   fail-fast semantics), `STREAMS_INTERNAL_PORT` (preferred internal port), live-create bridging
   vars (stay inside `proxy.ts`). Internal upstream stays `127.0.0.1` loopback.
10. **Streams failure ownership**:
    `try { running = await …serve(serve) } catch (error) {
   await server.stop().catch(swallow-documented); throw error; }`
    — front bind/start failure stops the factory-owned upstream, primary error always wins. Normal
    stop = native idempotent drain (+ `server.stop()` via `onShutdown`). No unrelated/global KV
    close anywhere (workers factory never closes KV; streams has no KV surface).
11. **Preserved native composition** (consumed unchanged): workers router/runtime/job registration/
    generated-jobs/mutation-hook/OpenAPI; streams proxy/sanitizer/live-bridging/bounded store/
    durability probe/upstream + storage health checks/raw `all /*` route/`serveRpc: false`.
    Post-listen `queueMicrotask` block moves verbatim into workers `service.ts` (after `serve()`).
12. **No-go enforcement**: no `any`/casts/`@ts-*`/`deno-lint-ignore`/`quality-allow` in new code
    except at most one bounded `quality-allow` line if slice discovery proves the legacy-delegation
    test cannot construct a minimal `PluginServiceContext` otherwise (§10 R5).

## 5. Owners and budgets (12 paths)

| #  | Path                                           | Change                                                                                                | Budget         |
| -- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------- |
| 1  | `plugins/workers/deno.json`                    | + `"./service": "./services/mod.ts"`; + `services/mod.ts services/src/service.ts` to `check`          | +2 lines       |
| 2  | `plugins/workers/README.md`                    | New `./service` recipe (guarded example), legacy behavior note, migration boundary, permissions block | +40–60 lines   |
| 3  | `plugins/workers/services/src/main.ts`         | Legacy adapter (§4.7); net shrink                                                                     | → ~55–70 lines |
| 4  | `plugins/workers/services/mod.ts`              | NEW surface (§3)                                                                                      | ~70–90 lines   |
| 5  | `plugins/workers/services/src/service.ts`      | NEW factory (§4.1–4.5, 4.11)                                                                          | ~110–150 lines |
| 6  | `plugins/workers/services/src/service_test.ts` | NEW oracles (table-driven, local helpers; F-10 ≤500)                                                  | ≤480 lines     |
| 7  | `plugins/streams/deno.json`                    | Same as #1                                                                                            | +2 lines       |
| 8  | `plugins/streams/README.md`                    | Legacy side-effect/wildcard vs new explicit policy, recipes, permissions                              | +40–60 lines   |
| 9  | `plugins/streams/services/src/main.ts`         | Legacy start-on-import adapter (§4.8); net shrink                                                     | → ~40–50 lines |
| 10 | `plugins/streams/services/mod.ts`              | NEW surface (§3)                                                                                      | ~70–90 lines   |
| 11 | `plugins/streams/services/src/service.ts`      | NEW factory (§4.1–4.4, 4.6, 4.9–4.11)                                                                 | ~150–200 lines |
| 12 | `plugins/streams/services/src/service_test.ts` | NEW oracles (table-driven; F-10 ≤500)                                                                 | ≤480 lines     |

No other product/config/lock file is touched. No new dependencies.

## 6. Ordered checkpoints (8 slices, 26 paths incl. run metadata)

Each slice = 1 atomic commit + push + draft-PR comment; run-dir files updated in the same slice.

- **S0 — base proof** (run metadata only): verify clean tree at 1582e1c9, capture pre-change
  `quality:scan` + `arch:check` baselines per plugin, discover TLS-fixture reuse-or-defer (§10 R3)
  read-only. Proves: revert target + violation baseline. Gate: receipts recorded.
- **S1 — workers RED**: `service_test.ts` inert-import + auth pre-I/O tests; they fail (no
  `./service` module) — proves tests target the new subpath, never legacy `./services`.
- **S2 — workers factory GREEN**: `service.ts` + `mod.ts` + `deno.json`: S1 green; scoped
  check/lint/fmt/doc-lint on the new surface.
- **S3 — workers complete**: full composition + `main.ts` adapter + README + remaining oracles
  (401/503/principal, two-instance, stop/drain, no-KV-close, legacy ctx) in `service_test.ts`; all
  workers tests green; retained suites untouched and passing.
- **S4 — streams RED**: `service_test.ts` inert + auth tests fail (no module).
- **S5 — streams factory GREEN**: `service.ts` + `mod.ts` + `deno.json`: S4 green; scoped gates.
- **S6 — streams complete**: upstream/durability/proxy + `main.ts` adapter + README + remaining
  oracles (raw `['/']` + health, TLS-or-deferred, port 0, abort, front-failure cleanup, legacy
  import); all streams tests green; retained suites passing.
- **S7 — no-regression + publishability**: no product change. Full existing suites both plugins,
  `verify-plugin.ts` both plugins, `quality:scan`/`arch:check` zero-_new_-violation diff, `doc-lint`
  full export maps, `publish --dry-run` both plugins (raw output), clean-consumer import/compile of
  both `./service` subpaths with type-identity check, JSR audit. Then (merge- readiness lane, not
  per-slice): one-pass `scaffold.runtime`.

## 7. Oracles

**Inertness**: subprocess `deno eval` with cleared env (no PORT/NETSCRIPT__/STREAMS__) importing the
new subpath under `--deny-env --deny-net --deny-write --deny-run --deny-sys --deny-ffi` and
`--allow-read` scoped to the plugin root ⇒ exit 0 + silent stderr. (Env-deny makes any import-time
`Deno.env` read fail loudly; scoped read keeps module loading possible.) **Auth**: structural
required-`auth` + runtime table — missing/mixed/blank-reason/whitespace-
reason/non-object/non-function-callables ⇒ `TypeError` before I/O; invalid-auth + unset-PORT ⇒ auth
error wins. **Live**: static-credential authenticator — missing/wrong ⇒ 401 `UNAUTHORIZED`; throwing
verifier ⇒ 503 `SERVICE_UNAVAILABLE` without leakage; valid ⇒ principal reaches handler. **Raw**:
`protect: ['/']` guards the proxy path; explicit `allowAnonymous` health exceptions stay public; no
anonymous prefix. **Isolation**: two instances, distinct ports/auth — cross-token ⇒ 401;
`serve`/option objects unmutated (reference + deep-freeze check on caller arrays). **Listener**:
`addr` + actual loopback bind on plain branch; port 0 ⇒ ephemeral port > 0; TLS per §10 R3;
abort-signal stop + idempotent double-`stop()` drain. **Streams failure**: front bind collision ⇒
start rejects with primary bind error AND upstream port released (re-bindable). **Workers KV**:
second handle usable after factory stop (no close). **Legacy**: workers default(ctx) serves with
legacy public posture; streams legacy import boots with wildcard CORS (existing suite covers;
adapter adds no behavior). **Harness**: every test file sets explicit
`--sanitize-resources --sanitize-ops` (recorded flags, not assumed defaults); synthetic preseeded
env cleared before imports; net scoped to `127.0.0.1`; permissions
`--allow-net=127.0.0.1 --allow-env --allow-read --allow-write --unstable-kv` (+
`--allow-run --allow-read=<root>` only for the inert-subprocess parent). **Retained oracles** (must
stay green, unmodified): workers `describe-route`, `generated-jobs`, `init`, `trigger-path-id`
suites + registry/mutation behavior; streams `main`, `proxy`, `durability`,
`sse-contract_conformance`, `tests/bounded-*`, `storage-*` suites; both `verify-plugin.ts`; all 11
EIS native payload fixtures are consumer acceptance, never deleted.

## 8. Gate set

- **Static** (scoped wrappers, nonzero selection, fail-closed on empty): `run-deno-check.ts` (both
  `services/` roots, `--ext ts,tsx`), `run-deno-test.ts` (new + retained suites with §7 flags),
  `run-deno-lint.ts`, `run-deno-fmt.ts`.
- **Fitness**: `quality:gate` (`quality:scan` + `arch:check`) per plugin root; F-1,F-3,F-5,F-6,
  F-7,F-8,F-9,F-10,F-11,F-12,F-13(runtime subtype: `stop()` + signal path),F-14,F-15,F-16,F-17,
  F-18,F-19. New-violation count vs S0 baseline = 0.
- **SCOPE-service**: service check (scoped), runtime health (real-listener suites), trace/log review
  (silent stderr on happy path), consumer check (clean-consumer import/compile). Contract check N/A
  (router untouched); Aspire N/A (no topology change).
- **JSR/publish**: `doc:lint` structured runner over full export maps (0 diagnostics),
  `deno publish --dry-run --allow-dirty` per plugin (raw output authoritative for slow types),
  `audit-jsr-package.ts`, §9 rubric.
- **Release class**: `scaffold.runtime` one-pass (`--cleanup --format pretty`) REQUIRED at
  merge-readiness (new public export = publish-shape touch; also proves legacy health endpoints
  still satisfy the suite's readiness contract). `e2e-cli-prod` = DEBT_ACCEPTED pre-merge (#167
  pattern — published packages don't exist yet), post-publish authority.

## 9. JSR surface rubric (applied to the §3 plan)

Named types + explicit returns everywhere; `@module` + per-symbol JSDoc (`@param`/`@returns`/
`@example`) on `mod.ts` and both symbols; exports resolve to existing files; publish globs already
cover `services/**/*.ts` and exclude `*_test.ts` (verified on disk); slow-type risk low — all public
names resolve to named imports (`ServiceAuthPolicy`, `CorsOptions`, `ServeOptions`,
`RunningService`, `PluginServiceContext`); no inferred returns, no `any`/casts/suppressions in the
surface. README recipes are verified by the clean-consumer gate, not by eye.

## 10. Risk register

- **R1 — F-10 500-line cap vs oracle breadth**: mitigate with table-driven cases + local helpers
  in-file (no new files allowed); budgets in §5 leave headroom.
- **R2 — Windows port flakiness**: fronts use port 0; internal/upstream ports via
  `getAvailablePort`; no fixed ports, no retry loops masking leaks (sanitizers stay on).
- **R3 — TLS oracle fixtures**: S0 discovers committed reusable PEM fixtures read-only. If found,
  TLS test uses them. If not: explicit deferral recorded (TLS branch structurally forwarded by
  identity — covered by the serve-identity oracle), TLS-live proof becomes an E1/E2E gate with a
  named owner. No invented fixtures, no `openssl` dependency smuggled into tests.
- **R4 — quality baseline**: S0 captures per-plugin `quality:scan` output; S7 diffs — only _new_
  violations fail (moved legacy `console.*` lines are byte-identical moves, listed in the slice
  comment).
- **R5 — minimal `PluginServiceContext` for the legacy-delegation test**: slice-owned discovery; if
  construction needs one boundary cast, a single `// quality-allow: <reason>` line is the budgeted
  exception (count reported, not a pattern).

## 11. Rollback

Complete source transaction: revert S1–S6 commits in reverse (or: `git checkout 1582e1c9 --` the 6
modified paths + delete the 6 new files), verify `git status` clean + scoped check green. No
lock/dependency/version changes exist to roll back. **Restoring legacy public hosts is a revert
mechanism, never a security-approved shipping fallback** — post-rollback exposure is identical to
pre-change and still unqualified.

## 12. Deferred scope (explicit)

U2 (service-owned CORS preservation + full matrix), U3 (browser credential architecture), E1 (EIS
host-policy composition, role tables, adoption), #829 supervision, #2364 resolver, release
cut/pins/age policy, S16 runtime/browser/Windows/OTEL closure. None forces U1 API rework (see
`decision-map.md`); E1-cutover prerequisites are MUST-RESOLVE there, not here.

## 13. Open questions (true unknowns)

1. TLS-fixture reuse-or-defer outcome (S0 discovery; owner: implementer; gate: §10 R3).
2. `quality:scan`/`arch:check` baseline content (S0 capture; owner: implementer).
3. Minimal-context construction shape (S3 discovery; owner: implementer; budget: §10 R5).
4. U2/U3/E1 dispositions stand as mapped in `decision-map.md` — owned by their leaves.

## 14. Plan-Gate mapping

Research present + re-baselined (`research.md`); decisions locked (§4 + `decision-map.md` Q1–Q2);
open-decision sweep (Q3–Q8 all SAFE-DEFER with owners, none forcing rework); commit slices (8, §6,
each with proof + gate + files); risk register (§10); gate set (§8 + Arch-5 matrix); deferred scope
explicit (§12); jsr-audit rubric applied (§9). Evaluator: separate Grok-family PLAN-EVAL session +
root substantive review before any implementation.
