# Worklog: RFC draft: opt-in rolling quotas for protected service reads (#2653)

## Run Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `plan-rfc-rolling-service-quotas-2653--rfc` |
| Branch         | `plan/rfc-rolling-service-quotas-2653` |
| Issue          | #2653 — design draft PR; body carries `Refs #2653` only (no closing keyword anywhere, including prose) |
| Classification | design draft awaiting owner |
| Archetype      | RFC document (`rfcs/0000-*.md`); no framework source |
| Scope overlays | `SCOPE-docs.md` |
| Milestone      | `0.0.10` |

## Coordinator bootstrap (2026-11-24)

Baseline `main` = `87965d800b7d61312e8612c82bdb0cb98bdf5b29`; `v0.0.10-canary.4` = `7c51c7efb64cbf65c567232245c13fea69f45fe4`.

### Owner model authorization

> Owner explicitly authorized T3 dispatch, with rationale for Neon: it first found or co-found these gaps. Exact public builder model settings: […] providerInstanceId antigravity, model gemini-4-neon, options {thought_level:'xhigh'} for N2 #2651, […] N5 #2653, #2146 and #451. […] If Antigravity is out of quota or unavailable, report before falling back. No silent switches.
>
> […] For Neon builds Codex Sol independent review is authorized, […]

Quoted verbatim from the owner's batch directive. `[…]` marks elided text that concerns lanes or parties outside this run's public record; nothing that governs this lane is elided.

### Route record

| Role | Requested identity | Transport | Family |
| ---- | ------------------ | --------- | ------ |
| Builder | providerInstanceId `antigravity`, model `gemini-4-neon`, options `{thought_level: 'xhigh'}` | T3 `delegate_task`, isolation `worktree` | Google |
| Design reviewer | providerInstanceId `codex`, model `gpt-6.2-sol`, options `{reasoningEffort: 'xhigh'}`, a separate session (OpenAI vs Google) | separate session | OpenAI |

- Workload tier: `feature`. The privileged `complex`/`architecture` rows are not authorized for
  this lane and are not selected.
- PLAN-EVAL: N/A — design-only deliverable; the independent design review is the gate.
- Design review: one independent design verdict at the exact head; documentation cap of two rounds. The design verdict is not an IMPL-EVAL and does not authorize implementation.
- No implementation lane self-certifies. Automated green gates are evidence, not review.
- Fallback: none without an owner report first. If the builder or reviewer provider is unavailable
  or out of quota, the coordinator reports before any fallback; no silent model or provider switch.

### Scope

- `rfcs/0000-rolling-service-quotas.md` from `rfcs/0000-template.md`.
- Compatible decision semantics for fixed-window (default, unchanged) and opt-in rolling policies in both first-party rate-limit stores (memory and shared KV).
- Compare strict rolling admission, approximate rolling counters, and explicit burst/refill budgets; keeping fixed windows plus reducing duplicate reads stays a listed alternative.
- Specify storage bounds, atomicity under concurrent reservations, memory/KV parity, `resetAt` meaning, and how callers get the next eligible instant for `Retry-After`.
- Reproduce the issue's deterministic alignment example against current `main` source and label it measured; label everything else source-inspected.

### Boundaries and shared seams

- Design only: no edits under `packages/` or `plugins/`.
- No accepted governing RFC exists; this draft does not authorize implementation.
- Ask the coordinator before touching another lane's files.

### Gates

- `deno fmt --check` on the RFC file is not a verdict source for Markdown; keep the file template-shaped and link-clean (`deno task docs:links` if it covers `rfcs/`).
- Any TypeScript snippet that claims to run is run against current `main` and its output recorded in this run dir.

## Design

Design-only deliverable (`SCOPE-docs.md`; no framework source under `packages/` or `plugins/`):

1. **Proposed public surface (design draft only; not implemented)**:
   - `@netscript/service/rate-limit`: `RATE_LIMIT_POLICY_KINDS`, `RateLimitPolicyKind`,
     `RateLimitPolicy` (`{ kind: 'fixed-window' } | { kind: 'gcra'; burst?: number }`); additive
     optional `policy?: RateLimitPolicy` on `MemoryRateLimitStoreOptions` and
     `KvRateLimitStoreOptions`; additive optional `retryAt?: number` on `RateLimitDecision`.
   - `@netscript/service`: automatically inherits optional `retryAt?: number` via existing
     `RateLimitDecision` re-export; no new root exports.
2. **Domain vocabulary**: `RateLimitPolicy`, `RateLimitPolicyKind`, `StoredGcraState` (internal),
   `resetAt` (full quota reset), `retryAt` (earliest next eligible instant on rolling denial),
   `nextEligibleAt = decision.retryAt ?? decision.resetAt`.
3. **Ports**: `RateLimitStore` unchanged (`consume(request: RateLimitRequest): Promise<RateLimitDecision>`);
   consumes existing `KvStore` (`get` + `atomic`) with no new KV port methods.
4. **Constants**: `RATE_LIMIT_POLICY_KINDS = ['fixed-window', 'gcra'] as const`.
5. **Commit slices (design draft run)**:
   - S0 (coordinator bootstrap): `supervisor.md`, `worklog.md`, `drift.md` (`db048698`).
   - S1 (this slice): `rfcs/0000-rolling-service-quotas.md` + `worklog.md` measured evidence, design
     checkpoint, and link/snippet validation.
6. **Deferred scope**: Implementation under `packages/service/`, `#2365` device-grant dynamic
   monotonic polling cadence, post-auth `ServiceBuilder` rate-limit stage ordering, capped
   `sliding-log` policy, weighted request cost, and `RateLimit` response headers.
7. **Contributor path**: Read `rfcs/0000-rolling-service-quotas.md` and current
   `packages/service/src/rate-limit/{domain,ports,adapters,middleware}/`; once accepted and numbered,
   add `domain/gcra.ts`, wire `policy` into both store adapters, update middleware `Retry-After` to
   `decision.retryAt ?? decision.resetAt`, and run the 11-row gating test plan.

## Measured Evidence

### 1. Deterministic alignment reproduction on `main` (`87965d80`)

Label: **measured** (run against local `main` source `./packages/service/src/rate-limit/mod.ts`, not
the published JSR release).

Command (issue #2653 alignment example):

```sh
deno eval '
import { createMemoryRateLimitStore } from "./packages/service/src/rate-limit/mod.ts";

for (const arrivals of [[100, 200, 300, 400], [59_850, 59_950, 60_050, 60_150]]) {
  const store = createMemoryRateLimitStore();
  const decisions = [];
  for (const now of arrivals) {
    const result = await store.consume({ key: "sample", limit: 2, windowMs: 60_000, now });
    decisions.push(result.allowed);
  }
  console.log(decisions);
}
'
```

Output (exit code `0`):

```text
[ true, true, false, false ]
[ true, true, true, true ]
```

Extended verification across `createMemoryRateLimitStore`, `createKvRateLimitStore(MemoryKvAdapter)`,
and `createKvRateLimitStore(DenoKvAdapter(Deno.openKv(":memory:")))` (exit code `0`):

```text
memory mid-window [{"allowed":true,"resetAt":60000},{"allowed":true,"resetAt":60000},{"allowed":false,"resetAt":60000},{"allowed":false,"resetAt":60000}]
memory boundary-straddling [{"allowed":true,"resetAt":60000},{"allowed":true,"resetAt":60000},{"allowed":true,"resetAt":120000},{"allowed":true,"resetAt":120000}]
kv-memory mid-window [{"allowed":true,"resetAt":60000},{"allowed":true,"resetAt":60000},{"allowed":false,"resetAt":60000},{"allowed":false,"resetAt":60000}]
kv-memory boundary-straddling [{"allowed":true,"resetAt":60000},{"allowed":true,"resetAt":60000},{"allowed":true,"resetAt":120000},{"allowed":true,"resetAt":120000}]
kv-deno mid-window [{"allowed":true,"resetAt":60000},{"allowed":true,"resetAt":60000},{"allowed":false,"resetAt":60000},{"allowed":false,"resetAt":60000}]
kv-deno boundary-straddling [{"allowed":true,"resetAt":60000},{"allowed":true,"resetAt":60000},{"allowed":true,"resetAt":120000},{"allowed":true,"resetAt":120000}]
```

### 2. Surface, guidance, and validation gates

- `deno doc packages/service/src/rate-limit/mod.ts` (filtered across `RateLimitDecision`,
  `RateLimitRequest`, `RateLimitStore`, `ServiceRateLimitOptions`, `MemoryRateLimitStoreOptions`,
  `KvRateLimitStoreOptions`) and `deno doc packages/service/mod.ts --filter ServiceBuilder.withRateLimit`:
  exit code `0` (**measured**).
- Local NetScript MCP `find_guidance` (`deno run -A packages/cli/bin/netscript.ts agent mcp`,
  `intent: "service rate-limit stores memory kv atomic rolling quota retry-after"`): exit code `0`,
  high-confidence hits on `pages/reference/service#rate-limits-and-client-addresses` and
  `pages/services-sdk/how-to/protect-an-anonymous-route` (**measured**).
- Pure `BigInt` GCRA arithmetic check via `deno eval` (verifies the RFC's exact integer formulas on
  Sequence A, Sequence B, `limit: 3 / windowMs: 1000`, sub-ms `limit: 1000 / windowMs: 100`, and
  `burst: 1`): exit code `0` (**measured**).
- `deno task docs:links` (default roots; source-inspected `.llm/tools/validation/check-internal-doc-links.ts:103-113`
  confirms default roots exclude `rfcs/`, so default `docs:links` is N/A for `rfcs/` coverage):
  exit code `0` (`docs=105 broken-links=0 broken-anchors=0 orphans=0`).
- `deno run --no-lock --allow-read .llm/tools/validation/check-internal-doc-links.ts --root rfcs/0000-rolling-service-quotas.md --pretty`:
  exit code `0` (`docs=1 broken-links=0 broken-anchors=0 orphans=0`) (**measured**).
- Public-text & close-gate hygiene check (zero closing keywords near `#N`, zero process language in
  RFC body, zero machine paths/hosts/secrets/private-project names, zero edits outside `rfcs/` and
  run dir): exit code `0` (**measured**).

### 3. Source-inspected baseline claims

Every other claim in `rfcs/0000-rolling-service-quotas.md` is **source-inspected** against `main`
(`87965d80`):

- `packages/service/src/rate-limit/domain/rate-limit.ts` (lines 4–39)
- `packages/service/src/rate-limit/ports/rate-limit-store.ts` (lines 17–20)
- `packages/service/src/rate-limit/adapters/memory-rate-limit-store.ts` (lines 10–68)
- `packages/service/src/rate-limit/adapters/kv-rate-limit-store.ts` (lines 11–69)
- `packages/service/src/rate-limit/middleware/options.ts` (lines 1–40)
- `packages/service/src/rate-limit/middleware/rate-limit-middleware.ts` (lines 29–96)
- `packages/service/src/builder/service-builder-impl.ts` (lines 310–313, 458–461, 515–524)
- `packages/service/tests/rate-limit_test.ts` (lines 116–289)
- `packages/service/README.md` (lines 766–829)
- `packages/kv/types/kv-store.ts` (lines 149–196)
- `packages/kv/adapters/deno-kv.adapter.ts` (lines 105–119, 202–235)
- `packages/kv/adapters/memory.adapter.ts` (lines 197–219, 504–520)
- `packages/kv/adapters/redis.adapter.ts` (lines 102, 273–435)
- `packages/kv/adapters/redis/types.ts` (line 103)
- `packages/kv/adapters/redis/codec.ts` (lines 38–133)
- `packages/kv/adapters/redis/serialization.ts` (lines 37–46)
- `packages/kv/README.md` (lines 109–113)
- `packages/contracts/src/domain/schemas.ts` (lines 68–71, 110–113)
- `.llm/tools/validation/check-internal-doc-links.ts` (lines 103–113)

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-11-24 | S0 | bootstrap | Coordinator bootstrap commit: `supervisor.md`, `worklog.md`, `drift.md`. |
| 2026-11-24 | S1 | research | Verified branch HEAD `db048698`, read issue #2653, doctrine, skills, `packages/service/src/rate-limit/`, and `packages/kv/` adapters; queried `deno doc` and local MCP `find_guidance`; reproduced alignment example against `main` source (measured). |
| 2026-11-24 | S1 | draft | Authored `rfcs/0000-rolling-service-quotas.md` from `rfcs/0000-template.md` and recorded design checkpoint + measured/source-inspected ledgers in `worklog.md`. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Recommend GCRA (`{ kind: 'gcra', burst?: number }`) over sliding-window log and weighted two-window | O(1) storage per key for any safe-integer `limit` (no Deno KV 64 KiB cliff or memory `maxKeys` amplification), single-key CAS, 100% shift-invariant, exact rational integer parity; weighted two-window has two-sided error and epoch coupling. | `rfcs/0000-rolling-service-quotas.md` § Rationale and alternatives |
| Keep `resetAt` as full quota recovery and add optional `retryAt?: number` on `RateLimitDecision` | Preserves fixed-window `{ allowed, resetAt }` exact object shape and custom `RateLimitStore` compatibility while giving rolling rejections an exact next-eligible instant (`decision.retryAt ?? decision.resetAt`) without non-monotonic `resetAt`. | `rfcs/0000-rolling-service-quotas.md` § Compatible decision semantics |
| Place `policy?: RateLimitPolicy` on store options (`MemoryRateLimitStoreOptions` / `KvRateLimitStoreOptions`) rather than `RateLimitRequest` | Keeps `RateLimitStore` port unchanged, prevents silent fallback on custom stores, prevents mixing policies on one KV prefix, and validates configuration at construction. | `rfcs/0000-rolling-service-quotas.md` § Public API and type surface |
| Enforce `expireIn = Math.max(1, resetAt - request.now)` | Both `RedisKvAdapter` (`redis.adapter.ts:425`) and `MemoryKvAdapter` (`memory.adapter.ts:513`) treat `expireIn: 0` as falsy (no TTL). | Source inspection |

## Drift

See `drift.md`.
