# PLAN-EVAL — release-0.0.5--orchestration/slices/w2-a-1325

- Plan evaluator session: Claude · Fable 5 · medium (native opposite-family, `formal_plan_evaluation`), 2026-08-08
- Run: `release-0.0.5--orchestration/slices/w2-a-1325` (issue #1325, W2-A)
- Plan under evaluation: `origin/fix/triggers-generated-kv-adapter-bootstrap@e4d3fad29` (base `c383b2e84`), authored by Codex · GPT-5.6 Sol · low
- Surface / archetype: `plugins/triggers` + shared generated-runtime invariant + `packages/cli/e2e` — Archetype 5 (Plugin Package)
- Scope overlays: `service`
- Evaluator worktree: `/home/codex/repos/ns005-stable-opus5` at `c383b2e84` (read-only; implementation worktree untouched)

## Verdict

`PASS`

## What was verified to reach it

Every load-bearing plan claim was checked against the tree at `c383b2e84` and against issue #1325;
none failed. Findings below are ordered by how decisive they are for the verdict.

### 1. The RED test can actually fail — the failing pre-fix state is concrete (decisive)

This was the gate-integrity question (`milestone-run.md` §Gate integrity: 0.0.4 shipped two guards
whose predicate could never be true). The plan's probe (`plan.md` Open-Decision Sweep, "Exact
focused Redis proof") is: import emitted glue with `import.meta.main === false`, then call core
`getKv()` under forced Redis selection.

Traced end-to-end:

- Pre-fix triggers glue (`plugins/triggers/src/adapter/resources/glue/runtime.stub.ts`) emits only
  `import { startCombinedProcess } from '@netscript/plugin-triggers/runtime'` — no
  `@netscript/kv/redis` import anywhere in its transitive graph
  (`plugins/triggers/deno.json` `"./runtime": "./src/runtime/mod.ts"` →
  `trigger-processor.ts` imports only type-level `@netscript/kv`).
- Forced Redis selection is env-constructible with no server: `REDIS_URI`/`GARNET_URI`/
  `ConnectionStrings__garnet` etc. drive `autoDetectProvider()`
  (`packages/kv/application/auto-detect.ts:9-27,124`).
- With provider=redis and an empty registry, `initializeKv()` throws `KvConnectionError`
  "the Redis adapter is not registered" at `packages/kv/application/shared.ts:218-226` — **before
  any factory call or network connection**. That is the deterministic nonzero exit for the pre-fix
  state.
- Post-fix, `@netscript/kv/redis` self-registers on import (`packages/kv/redis.ts:33`) and
  `initializeKv()` returns `factory({url, namespace})` synchronously without awaiting a connection
  (`shared.ts:235`), so the fixed path proceeds past the registration boundary without a live
  Redis; real connectivity is separately proven by the Aspire evidence, as the plan states.
- An emitted-but-inert import fails the probe, because the assertion is a registry side effect in
  the executing module graph, not import text. Contrast: the existing saga assertion is exactly the
  text/order check the issue rejects (`plugins/sagas/src/adapter/resources/resources.test.ts:92-99`),
  and the plan correctly replaces/supplements it (AP-18 named in the plan's AP table).

### 2. `@netscript/kv` is the registration authority — LD-1 is correctly seated

Verified: provider selection lives in `packages/kv/application/auto-detect.ts`
(`autoDetectProvider()`, `CACHE_PROVIDER`, Aspire connection/service-discovery keys); the private
`adapterRegistry` + `registerKvAdapter()` + `getKv()` lifecycle live in
`packages/kv/application/shared.ts:42-66,117-136`; `packages/kv/redis.ts:33` self-registers the
Redis factory on import. The authority is not split: the four copy-mode services
(`plugins/{auth,sagas,workers,triggers}/services/src/main.ts`) each compose the same single core
entrypoint via `import '@netscript/kv/redis'` — composition of one seam, not a second mechanism.

### 3. The runtime enumeration (workers, sagas, triggers) is exactly right

Checked all six first-party plugins (`plugins/ai auth sagas streams triggers workers`):

- Generated background runtime glue stubs exist for exactly three plugins:
  `plugins/{workers,sagas,triggers}/src/adapter/resources/glue/runtime.stub.ts`.
- All three consume the shared KV lifecycle in their real startup paths: workers via
  `plugins/workers/bin/runtime.ts:8` (`import '@netscript/kv/redis'`, and its glue's
  `@netscript/plugin-workers/runtime` maps to that file per `plugins/workers/deno.json`); sagas via
  glue-level import; triggers via `startCombinedProcess` → `createRuntimeTriggerProcessor` →
  `openTriggerRuntimeKv()` → `getKv()`
  (`packages/plugin-triggers-core/src/stores/kv-trigger-runtime-stores.ts:27-29`).
- No fourth runtime is missed: `rg "@netscript/kv|getKv" plugins/streams plugins/ai` returns
  nothing — streams and ai have no KV dependency and no runtime glue stub. `plugins/auth` uses KV
  only in its copy-mode HTTP service, which already bootstraps
  (`plugins/auth/services/src/main.ts:8`) and is not a generated background runtime.
- None wrongly included: all three enumerated runtimes are genuinely KV-backed at startup.

The plan's `KV_BACKGROUND_RUNTIMES = workers, sagas, triggers` constant is therefore correct and
complete, and the behavioral probe is location-agnostic (it passes for workers even though its
bootstrap lives in the published runtime entry rather than the glue), so one shared invariant
covers all three despite the seam asymmetry.

### 4. Thinness/parity law is respected

`docs/architecture/doctrine/06-archetypes.md` §"Archetype 5 — Plugin Package", Thinness law:
convention-bearing primitives live in core; a `plugins/*` package is thin userland glue that wires
core-owned primitives. The plan keeps provider selection and adapter registration in
`@netscript/kv` (LD-1), makes trigger glue a one-line composition of the existing core side-effect
entrypoint (LD-2), rejects both a new public registry-inspection API and moving bootstrap
generation into core (Open-Decision Sweep), and places the enumerated invariant in test/E2E
surfaces (`packages/cli/e2e/**`), not plugin policy code. AP-11 is correctly named as the
intentional explicit-side-effect edge. No policy is pushed into plugin code.

### 5. Acceptance is truthfully tickable by this one PR

All six `- [ ]` boxes on #1325 are producible from the plan's own evidence: (1)+(2) by slice 2 plus
validation item 7 (isolated generated AppHost runs, health JSON/endpoints, OTEL logs); (3) by the
explicit Garnet and `CACHE_PROVIDER=denokv` scenarios with generated-file immutability; (4) by
slice 1's RED probe with the recorded pre-fix nonzero exit; (5) by slice 3's E2E enumeration plus
the granted one-pass `scaffold.runtime`; (6) by the shared enumerated invariant (LD-4/LD-5). The
current E2E genuinely lacks box 5's coverage — `runtime-gates.ts` waits on `workers-api`/
`sagas-api`/`triggers-api` HTTP services and a workers runtime wait only; there is no enumerated
background-runtime health invariant for sagas/triggers under both providers — so slice 3 is real
work, not a re-assertion of existing coverage. No box is observational/later-run-only; `Closes
#1325` per the brief's acceptance discipline is appropriate.

### 6. Gate set is named and sufficient for a `plugins/**` slice

Validation plan names: focused RED tests with recorded pre-fix nonzero exit; both `verify-plugin.ts`
commands (both files exist: `plugins/{triggers,sagas}/verify-plugin.ts`); scoped wrappers with
`--ext ts,tsx`, `--no-lock`, `--unstable-kv`; `quality:gate` (which is `quality:scan && arch:check`
per root `deno.json:52`) plus explicit `arch:check`; `doc:lint`, jsr audit, `publish:dry-run`; the
serialized one-pass `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` behind the
grant token; leak-check before/after; review-threads gate. Matches the archetype-gate-matrix Arch 5
column (F-2/F-4 correctly n/a; F-13 subtype correctly promoted to required for changed runtime
behavior; Runtime/Aspire validation required). The plan introduces no new `deno-lint-ignore` /
`as unknown as` and its AP table + risk register explicitly forbid greening wrappers that way.

### 7. Scope is contained; debt is cited, not deepened

Both cited debt entries exist and are open: `plugins/triggers — doctrine verdict Refactor`
(`arch-debt.md:846`, F-3/F-9/F-11) and `triggers-connector-sound-deferred` (`arch-debt.md:424`).
The plan runs `verify-plugin` without claiming closure, keeps the connector/HMAC service out of
scope (Non-Scope), and reports existing accepted debt as `DEBT_ACCEPTED`. No unrelated acceptance
is absorbed; release/merge authority stays with the orchestrator.

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research.md` re-baselined against `origin/main@c383b2e84` on 2026-08-08; findings 1, 2, 4, 5, 6, 8 spot-checked against the tree — all true (see findings above) |
| Decisions locked                        | PASS   | LD-1…LD-6 with rationale; LD-1/LD-2 seat verified in `packages/kv`; LD-4 enumeration verified complete |
| Open-decision sweep                     | PASS   | Sweep table present; both "resolved now" entries verified sound; evaluator sweep found no unflagged rework-forcing decision (see below) |
| Commit slices (< 30, gate + files each) | PASS   | 4 ordered slices, each with proving gate and file areas (`plan.md` §Commit Slices, `worklog.md` §Design) |
| Risk register                           | PASS   | 6 risks with concrete mitigations, including inert-import and module-cache isolation |
| Gate set selected                       | PASS   | Matches Arch 5 matrix column + service overlay; `quality:gate`, `arch:check`, `verify-plugin`, one-pass `scaffold.runtime` all named (finding 6) |
| Deferred scope explicit                 | PASS   | Non-Scope + Deferred Scope sections; both debt entries cited by exact name |
| jsr-audit surface scan (pkg/plugin)     | PASS   | `research.md` §jsr-audit surface scan; no plugin export/export-map change planned; doc-lint + publish dry-run still required and named |

## Open-decision sweep (evaluator-run)

No unflagged decision that would force rework if deferred. Two deliberately open choices were
examined and judged safe to defer:

1. "Replace the saga-only text assertion with, **or supplement it by**, the shared seam" — either
   resolution satisfies issue box 6; no rework either way.
2. Physical home of the slice-1 shared test support ("plugin resource tests and/or shared test
   support") — placement is a cheap move, not rework; see the implementation note below.

## Notes (non-blocking, for the implementer)

- **Module-graph identity of the probe.** The RED probe is only valid if the probe's `getKv` and
  the glue's `@netscript/kv/redis` registration resolve to the **same** `@netscript/kv` module
  instance. A probe importing workspace-source `shared.ts` while the generated workspace's glue
  registers into a cached JSR copy would produce a false verdict in either direction. The plan's
  own mitigation (isolated subprocess run inside the generated workspace, risk-register row 2)
  handles this — run the probe through the generated project's import resolution, not the repo's.
- **Shared test-support placement** must respect layering: no plugin may import another plugin's
  test helpers; a shared seam belongs in `@netscript/plugin` testing surface or `packages/cli/e2e`.
- The workers/sagas bootstrap-location asymmetry (published runtime entry vs emitted glue) is real
  and intentionally left unconverged; the behavioral invariant is location-agnostic so this does
  not weaken it. Do not "fix" workers in this slice — that would be scope drift.
