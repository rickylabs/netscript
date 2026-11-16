# PLAN-EVAL — fix-runtime-child-drain--issues-2630-2631

- Plan evaluator session: separate OpenCode session, 2026-11-16. Requested and observed route:
  `glm_5_3/provider_default` on the OpenCode Go transport (feature-tier PLAN-EVAL primary, pinned
  matrix). No substitution, no fallback. Generator is the owner-selected Codex Sol xhigh session —
  different vendor family, different session. Machine identities omitted under the owner's public
  repository restrictions.
- Run: `fix-runtime-child-drain--issues-2630-2631`; branch `fix/runtime-child-drain`.
- Exact head evaluated: 2913e2a51c160dfe191e0ec524f921cd349d9321 (base origin/main
  b0eb079575968e843b781579673c9fe2ae250e07). Head contains run-dir documentation only; the two
  untracked research test files are not part of the head and were read as proposed S1 content.
- Surface / archetype: Archetype 3 (runtime/behavior) primary — `packages/plugin` child-health edge,
  `packages/service` shutdown/listener, `packages/telemetry` OTel adapter — with plugin/CLI and
  service overlays for the generated glue and composition work.
- Scope overlays: `SCOPE-service.md`; release-gate class triggered by generated runtime glue
  (full `scaffold.runtime` smoke required, planned in S4).

## Verification performed

- Read `gates/plan-gate.md`, `evaluator/verdict-definitions.md`, the archetype profile, gate matrix,
  scope overlay, and the open debt registry (no open entry covers process shutdown/exit semantics;
  nothing in this plan deepens `packages/kv` or workers Refactor debt — the plan calls `closeKv()`
  from composition roots and does not modify the KV package).
- Read both issues in full and the draft PR body/labels/commit list.
- Spot-checked every load-bearing research finding against the tree at the head:
  - `packages/plugin/src/presentation/run-child-health-process.ts:59-60` binds with no `hostname`;
    `:135` awaits run completion unbounded; only the fatal path sets an exit code; the one-second
    fatal grace (`:108`) precedes any bound.
  - `packages/service/src/builder/service-shutdown.ts` bounds the 30 s drain, `break`s the LIFO hook
    loop on a timed-out hook, and nothing in `packages/service` exits the process.
  - `packages/kv/application/shared.ts:187` `closeKv()` has no runtime caller outside the KV
    package; `defineService` disconnects only the health-check client
    (`packages/service/src/presets/define-service.ts:335-339`).
  - The opt-in OTel SDK provider is the only runtime `Deno.exit`
    (`packages/telemetry/src/adapters/otel/otel-sdk.ts:315-319`) and can exit 0 before drain ends.
  - Generated-role survey: workers/sagas/triggers background glue
    (`plugins/*/src/adapter/resources/glue/runtime.stub.ts`), workers/sagas/auth API services load
    the host bootstrap via `NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE` and open the shared KV
    (`plugins/auth/services/src/backend-registry.ts`, `plugins/workers/services/src/service.ts`),
    the sagas runner acquires host DB clients through its bootstrap-loaded context
    (`plugins/sagas/src/runtime/saga-runner.ts:277,301`), streams is a proxy with no KV/DB handles,
    and scaffold app services acquire DB through `defineService`
    (`packages/cli/src/kernel/assets/service/main.ts.template`).
- Read the two untracked research tests. They pin the planned API (`drainTimeoutMs`,
  `onShutdown` on the child; exit codes 0/2; `PROBE_CLOSED`/`PROBE_DB_CLOSED` asserted in both the
  clean and timed-out cases) and are genuine failing-on-main reproductions per the recorded
  Redis-backed baseline (2/2 child, 2/2 service; KV-alone negative control). The corrected
  Docker-network harness failure is properly excluded from reproduction evidence.

## Checklist results

| Plan-Gate item                          | Result            | Evidence / location                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Research present and current            | PASS               | `research.md` re-baselined against main b0eb0795; #2631's historical env-fallback claim corrected in `drift.md`; all findings spot-checked against the tree (above).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Decisions locked                        | FAIL (4 gaps)     | Exit vocabulary, deadline math, ownership options, no-registry, composition-root disposal, OTel constraint, and loopback default are locked with rationale — but the final-termination mechanism, the Prisma-dedup implementation point, the shared-KV disposal route, and the standalone-OTel behavior change are unstated (see sweep).                                                                                                                                                                                                                                                                                                                  |
| Open-decision sweep                     | FAIL (4 unstated)  | The conditional hostname env fallback is flagged and safe to defer (S4 smoke decides). Four unstated decisions could force rework (below).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Commit slices (< 30, gate + files each) | FAIL (files)      | S1–S4 are enumerated, ordered, and each names what it proves and its proving gate; per-slice file groups are not enumerated, so the <30-file bound is asserted, not shown (`plan.md` "Design and slices"; `worklog.md` "Contributor path" names areas only).                                                                                                                                                                                                                                                                                                                                                                                              |
| Risk register                           | PASS               | `plan.md` "Gates and risks": embedded shared resources, hanging cleanup, fatal-grace retention, in-flight work; mitigations named.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Gate set selected                       | PASS               | Structured focused test/check/lint/fmt, affected package tests, `quality:gate`, JSR audits + doc-lint with baseline comparison, `release:preflight`, `docs:accuracy`, and the full one-pass `scaffold.runtime` E2E — matches Archetype 3 (runtime + consumer gates) and the release-gate class for generated-glue changes.                                                                                                                                                                                                                                                                                                                             |
| Deferred scope explicit                 | PASS               | Workers pause/delivery-budget, saga SSE log, other milestone fixes deferred; no saga transport changes; no Redis Streams dependency.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| jsr-audit surface scan (pkg/plugin)     | PASS               | `research.md`: additive optional fields (`ChildHealthProcessOptions`, `ServeOptions`, `PluginServiceContext` disposal), documented fields, no upstream re-exports, no new external dependencies; slow-type risk named for the SDK surface.                                                                                                                                                                                                                                                                                                                                                                                                               |

## Open-decision sweep (evaluator-run)

Unstated decisions that could force rework:

1. **Clean-path process termination is not locked.** The exit-2 case can only terminate explicitly
   (a hung run promise retains the event loop), but the plan does not state whether the clean path
   exits explicitly or relies on natural event-loop drain after cleanup. Natural drain is
   nondeterministic under foreign retainers — including an OTel periodic metric reader that this
   same PR's OTel fix may leave running when it stops exiting early. Deferred, this forces rework
   inside S2 and can make the acceptance watchdogs flaky.
2. **The identity-deduplicated Prisma disposal point is ambiguous and the committed S1 test pins
   the other reading.** `plan.md` item 4 says "implement at composition roots", which reads as the
   `defineService`/`createPluginService` presets; the S1 service test pins the raw builder
   (`createService(...).withDatabase({ first: client, alias: client })` expecting exactly-once
   `$disconnect`). Preset-only disposal leaves that test permanently red — forced rework in S2.
3. **The shared-KV disposal route is not named.** `closeKv()` is singleton-aware and a safe no-op
   when never initialized; the lazy `PluginServiceContext` KV wrapper's `close()`
   (`packages/plugin/src/sdk/runtime/plugin-service-context-factory.ts`) resolves the underlying
   adapter on first call — closing an unused context KV would open a Redis connection merely to
   close it (violating the plan's own "never resolve an unused client" principle) and would leave
   the shared singleton pointing at a closed adapter for embedded hosts on manual-stop paths.
   Deferred, this forces rework in S3.
4. **The standalone-OTel behavior change is not named.** After removing the ahead-of-drain
   `Deno.exit(0)`, a process using the opt-in SDK provider without a NetScript runtime no longer
   exits from OTel's own SIGTERM handler. This is acceptable (process ownership belongs to the
   composing runtime) but must be stated and documented, or S3 docs and `docs:accuracy` miss it.

Flagged and accepted as safe to defer: the conditional hostname environment fallback (S4
`scaffold.runtime` smoke decides whether generated container wiring needs it).

## Acceptance and role coverage confirmation

All seven acceptance boxes across #2630 and #2631 are meetable by this plan after the repairs
below:

- #2630 child SIGTERM exit within budget (S1 red subprocess tests → S2), service exit after clean
  and timed-out drains with distinct codes (S1 → S2), role-level KV/Prisma/Redis closure
  (S2 core + S3 generated glue, host bootstrap, sagas DB disposal), exit codes documented (S3).
- #2631 loopback-by-default child health (S1 bind tests → S2), explicit override reusing the native
  `hostname` convention (S2), generated container/Aspire health checks (S4 full smoke).

No missing roles: workers/sagas/triggers background children, workers/sagas/auth plugin API
services, the sagas background runner's bootstrap-context DB clients, streams (no KV/DB handles;
exits via the generic service signal semantics), and scaffold app services via `defineService`.
The web frontend and the Aspire host are correctly out of scope. No generic global lifecycle
registry is proposed; no changes under `packages/plugin-sagas-core/src/transports/`; no Redis
Streams dependency. Manual stop and external abort remain embeddable; disposal is signal-path
scoped, which the plan states as "on executable-role signal shutdown".

## Verdict

`FAIL_PLAN`

The plan is sound in scope, root cause, deadline accounting, ownership model, and coverage; the
failures are unstated decisions and slice-contract detail, all repairable by editing `plan.md`
without re-planning. Feature-tier policy: maximum two cycles; the evaluator repairs a fixable plan
on cycle two.

### If FAIL_PLAN — required fixes (exact, minimal)

1. **Lock final termination.** Add to `plan.md` item 1/2: after the drain/cleanup budget completes
   or expires, the child and service runtimes explicitly terminate the process with the computed
   exit code; the clean path must not rely on natural event-loop drain. (Timeout exit 2 already
   requires explicit termination; state the clean path symmetrically.)
2. **Name the Prisma disposal point to match the S1 test.** Implement the identity-deduplicated
   `$disconnect` in the service builder's database registration (`withDatabase`, inherited by
   `defineService` and `createPluginService`), running in the reserved cleanup phase — not only in
   the `defineService` preset. Keep the S1 service test as written.
3. **Name the KV disposal route.** Executable-role cleanup calls `closeKv()`; it must not use the
   lazy `PluginServiceContext` KV wrapper's `close()` (resolve-on-close trap; singleton poisoning
   for embedded manual-stop hosts). Either make the lazy wrapper's `close()` a no-op when unresolved
   or document it as not a disposal path.
4. **Name the OTel standalone behavior change.** State in `plan.md` item 5 that the SDK provider's
   SIGTERM handler keeps its bounded flush and listener removal, drops the exit, and that
   standalone embedders compose a runtime or own signals themselves; carry it into the S3 docs
   slice (`docs:accuracy` scope).
5. **Complete the slice contract.** Add per-slice file groups to `plan.md` (S1 tests; S2
   `packages/plugin` child edge, `packages/service` builder/coordinator/listener,
   `packages/telemetry` OTel adapter; S3 the three plugin glue stubs, CLI service-context
   template, first-party service entrypoints, docs; S4 evidence only) and confirm each slice stays
   under 30 files.

### Advisory (non-blocking)

- The service `drainTimeoutMs` semantic narrows from "work-drain budget" to "total budget including
  the reserved cleanup" (default 30 s → 25 s work + 5 s cleanup). Deliberate per the plan; document
  it in the option docstring/README so `docs:accuracy` covers the change.
- Carry "signal-path-only disposal" into the implementation as an explicit reason/ownership check
  so a manual stop of an embedded service never closes host-shared KV.
- Keep the reproduction evidence conventions: pinned Deno, real isolated Redis, KV-alone negative
  control, watchdog-tolerant harness — they are the right shape for S1.

## Notes

No implementation was performed or is permitted before a `PASS`. The evaluator did not run
resources; the reproduction container was already removed by the lane. All citations are
repo-relative.
