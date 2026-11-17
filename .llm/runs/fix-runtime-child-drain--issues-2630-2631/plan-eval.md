# PLAN-EVAL — fix-runtime-child-drain--issues-2630-2631

## Cycle two — current verdict (2026-11-16)

- Plan evaluator session: separate OpenCode session, 2026-11-16, cycle two (fresh session, same pinned
  route). Requested and observed route: `glm_5_3/provider_default` on the OpenCode Go transport
  (feature-tier PLAN-EVAL primary, pinned matrix). No substitution, no fallback. Generator is the
  owner-selected Codex Sol xhigh session — different vendor family, different session. Machine
  identities omitted under the owner's public repository restrictions.
- Run: `fix-runtime-child-drain--issues-2630-2631`; branch `fix/runtime-child-drain`.
- Exact head evaluated: f86b8891b52953569c5070a49bbc382c5aea38fd (base origin/main
  b0eb079575968e843b781579673c9fe2ae250e07). The head advances the cycle-one evaluated head
  (2913e2a51) with run-dir documentation only (cycle-one verdict plus plan repairs); production
  sources are identical to main, so the cycle-one tree spot-checks remain valid and were re-verified
  at this head. The two untracked research tests are not part of the head and were read as proposed
  S1 content.
- Surface / archetype: Archetype 3 (runtime/behavior) primary — `packages/plugin` child-health edge,
  `packages/service` shutdown/listener, `packages/telemetry` OTel adapter — with plugin/CLI and
  service overlays for the generated glue and composition work.
- Scope overlays: `SCOPE-service.md`; release-gate class triggered by generated runtime glue
  (full `scaffold.runtime` smoke required, planned in S4).

## Verification performed

- Read `gates/plan-gate.md`, `evaluator/verdict-definitions.md`, the archetype profile, gate matrix,
  scope overlay, and the open debt registry (no open entry covers process shutdown/exit semantics;
  the `packages/kv` god-test debt is untouched because the plan only calls `closeKv()` from
  composition roots and does not modify the KV package; the `packages/telemetry` entry is closed and
  its resolution — layering and subpath exports — is unaffected by the bounded-flush edit).
- Read both issues in full, the draft PR body/labels/commit list and phase comments, and the complete
  cycle-one verdict (history section below; full text also preserved in git history at the head and
  in the cycle-one PR comment).
- Confirmed all five cycle-one required fixes are present in `plan.md` at the head, cross-checked
  against the pinned S1 test API (below).
- Re-verified the load-bearing research findings against the tree at the head:
  - `packages/plugin/src/presentation/run-child-health-process.ts:59-60` binds with no `hostname`
    (`Deno.serve({ port })`); `:135` awaits run completion unbounded; only the fatal path sets an
    exit code (`:90`); the one-second fatal grace (`:108`) precedes any bound.
  - `packages/service/src/builder/service-shutdown.ts:19` `DEFAULT_DRAIN_TIMEOUT_MS = 30_000`;
    nothing in `packages/service` exits the process (no `Deno.exit` anywhere in its `src/`).
  - `packages/kv/application/shared.ts:187` `closeKv()` exists as the singleton-aware process route.
  - The opt-in OTel SDK provider holds the only runtime `Deno.exit`
    (`packages/telemetry/src/adapters/otel/otel-sdk.ts:316-317`), exiting 0 ahead of drain.
  - `packages/service/src/presets/define-service.ts:337` disconnects only the health-check client.
- Read both untracked research tests as proposed S1 content: they pin `drainTimeoutMs` and bounded
  `onShutdown` on the child (exit 0 clean / 2 timed-out, `PROBE_CLOSED`), the raw-builder
  `withDatabase({ first: client, alias: client })` boundary with exactly-once `PROBE_DB_CLOSED` on
  the signal path, `serve({ port: 0, drainTimeoutMs: 100 })`, a hanging drain hook that cannot
  prevent remaining disposal, and the 5 s exit watchdog — every assertion matches the repaired plan
  contracts, and the recorded Redis-backed baseline (child 2/2, service 2/2, KV-alone negative
  control, Docker-network harness failure excluded, container removed) stands.
- Counted every per-slice file group in the plan's slice table: S1 = 8, S2 = 12, S3a = 16, S3b = 15,
  S4 = 4 run files; all below 30, ordered, each naming what it proves, its proving gate, and its
  files.

## Checklist results (cycle two)

| Plan-Gate item                          | Result | Evidence / location                                                                                                                                                                                                                              |
| --------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Research present and current            | PASS   | `research.md` re-baselined against main b0eb0795; the #2631 drift correction (no hostname environment fallback in current main; native explicit `hostname` option) recorded in `drift.md`; all findings re-verified at the head.                    |
| Decisions locked                        | PASS   | All five cycle-one gaps repaired in `plan.md` items 1-5: explicit `Deno.exit` with the computed code on clean, fatal and timed-out process-owned paths (never natural event-loop drain); identity-deduplicated Prisma `$disconnect` at the raw builder `withDatabase` boundary inherited by both presets, run in the reserved signal-path-only cleanup, redundant preset-only health hook removed; `closeKv()` as the singleton-aware process route with the lazy context-KV wrapper `close()` explicitly excluded from process disposal; standalone-OTel bounded-flush/no-exit behavior change stated and carried into `docs:accuracy`; per-slice file groups enumerated. |
| Open-decision sweep                     | PASS   | Only the conditional hostname environment delivery remains open, explicitly safe to defer with the S4 `scaffold.runtime` trigger (explicit native hostname override is locked). No unstated decision that would force rework remains.               |
| Commit slices (< 30, gate + files each) | PASS   | S1 (8) tests/red baseline; S2 (12) child edge + service builder/listener/shutdown + OTel adapter; S3a (16) generated glue and role ownership; S3b (15) docs and generated assets; S4 (4 run files) one-pass full smoke + independent IMPL-EVAL — counts verified, all below 30. |
| Risk register                           | PASS   | `plan.md` "Gates and risks": embedded shared resources, hanging cleanup, fatal-grace retention, in-flight work, each with mitigation; monotonic total deadline, no cleanup may reset it, timed-out cleanup yields exit 2 rather than claiming handles closed. |
| Gate set selected                       | PASS   | Structured focused test/check/lint/fmt, affected package tests, `quality:gate`, JSR audits + doc-lint with baseline comparison, `release:preflight`, `docs:accuracy`, plus the full one-pass `scaffold.runtime` E2E — matches Archetype 3 (runtime + consumer gates) and the release-gate class for generated-glue changes. |
| Deferred scope explicit                 | PASS   | Workers pause/delivery-budget feature, saga SSE log, other milestone fixes deferred; no saga transport changes; no Redis Streams dependency; conditional hostname environment delivery deferred with trigger.                                       |
| jsr-audit surface scan (pkg/plugin)     | PASS   | `research.md`: additive optional fields (`ChildHealthProcessOptions` hostname/drainTimeoutMs/bounded onShutdown/exitOnShutdown, `ServeOptions` exitOnSignal and total-budget drainTimeoutMs semantics, `PluginServiceContext` disposal), documented fields, no upstream re-exports, no new external dependencies; slow-type risk named for the SDK surface. |

## Open-decision sweep (evaluator-run, cycle two)

None. The five decisions the cycle-one sweep required to be locked (final termination, Prisma
disposal point, KV disposal route, standalone-OTel behavior, slice file boundaries) are all locked in
`plan.md` items 1-5 and the slice table. Flagged and accepted as safe to defer: the conditional
hostname environment delivery — the explicit native `hostname` option is the locked public override;
add environment delivery only if the S4 generated-launch smoke proves a need, recording that evidence
in `drift.md`.

## Acceptance and role coverage confirmation

All seven acceptance boxes across #2630 and #2631 are meetable by the repaired plan:

- #2630 child SIGTERM exit within the drain budget, subprocess test failing on main (S1 red
  subprocess tests → S2 explicit exit on `packages/plugin/src/presentation/run-child-health-process.ts`).
- #2630 service exits after clean and timed-out drains with distinct codes via subprocess test
  (S1 `packages/service/tests/signal-exit_test.ts` red baseline → S2 listener/shutdown explicit exit;
  0 clean, 2 timeout, 1 fatal/cleanup failure).
- #2630 each role closes the KV, Prisma and Redis handles it opened (S2 core: `closeKv()` and its
  Redis client/subscriber on the executable-role signal path; raw-builder identity-deduplicated
  `$disconnect` covering every acquired client; S3a generated glue cleanup callbacks, host bootstrap
  acquired-only idempotent DB disposal, sagas runner DB-context disposal).
- #2630 exit codes documented (S3b `docs/site` pages and READMEs under `docs:accuracy`).
- #2631 loopback-by-default child health (S1 bind tests → S2 default `127.0.0.1`).
- #2631 explicit override reusing the native plugin-service `hostname` convention (S2; the drift
  record documents that current main exposes the explicit option, not the environment convention).
- #2631 generated container/Aspire health checks still pass (S4 full one-pass `scaffold.runtime`
  smoke including hostname-override health checks).

No missing roles: workers/sagas/triggers background children (glue stubs in S3a), workers/sagas/auth
plugin API services (entrypoints in S3a), the sagas background runner's bootstrap-context DB clients
(`plugins/sagas/src/runtime/saga-runner.ts` in S3a), streams (no KV/DB handles; exits via the generic
service signal semantics), and scaffold app services via `defineService`. The web frontend and the
Aspire host are correctly out of scope. No generic global lifecycle registry is proposed (callback
contracts and existing hooks preferred); no changes under `packages/plugin-sagas-core/src/transports/`;
no Redis Streams dependency. Manual stop and external abort remain embeddable; disposal stays
signal-path scoped ("on executable-role signal shutdown"; manual stop/external cancellation do not
invoke process-owned KV/DB disposal).

## Verdict

`PASS`

Every `gates/plan-gate.md` box is satisfied at head f86b8891; implementation may begin. Cycle-two
policy authorizes the evaluator to repair fixable plan wording directly before issuing PASS: no
repair was needed — the plan as committed satisfies every box without further edit. Feature-tier
cycle budget: cycle one FAIL_PLAN (five gaps), cycle two PASS — within the maximum of two cycles.

### Conditions on implementation (advisory, non-blocking)

- Keep the S1 tests as written; they are the pinned contract for the raw-builder disposal and the
  exit-code semantics.
- Document the `drainTimeoutMs` semantic narrowing (total budget including the reserved cleanup;
  service default 30 s = 25 s work + 5 s cleanup) in the option docstrings/READMEs so `docs:accuracy`
  covers the change.
- Carry the signal-path-only disposal ownership check into implementation as an explicit reason
  check so a manual stop of an embedded service never closes host-shared KV or a host-owned DB
  client.
- Record the S4 hostname-environment decision (evidence of need or explicit non-need) in `drift.md`.
- Keep the reproduction evidence conventions (pinned Deno, real isolated Redis, KV-alone negative
  control, watchdog-tolerant harness) for the S1 gate run.

## History — cycle one (2026-11-16, superseded by the PASS above)

Cycle one evaluated head 2913e2a51 (base origin/main b0eb0795) in a separate OpenCode session on the
same pinned route (`glm_5_3/provider_default`, OpenCode Go transport; generator the Codex Sol xhigh
session — different session and vendor family). It read `gates/plan-gate.md`,
`evaluator/verdict-definitions.md`, the archetype profile, gate matrix, scope overlay, debt registry,
both issues, the draft PR, the two untracked research tests, and spot-checked every load-bearing
research finding against the tree.

Cycle-one checklist: research current PASS; decisions locked FAIL (4 gaps); open-decision sweep FAIL
(4 unstated); commit slices FAIL (per-slice file groups not enumerated); risk register PASS; gate set
PASS; deferred scope PASS; jsr-audit PASS. Verdict: `FAIL_PLAN` — the plan was sound in scope, root
cause, deadline accounting, ownership model and coverage; the failures were unstated decisions and
slice-contract detail, all repairable by editing `plan.md`. Required fixes (all applied at f86b8891):

1. Lock final termination — explicit termination with the computed exit code after the drain/cleanup
   budget completes or expires, clean path symmetric with the timed-out path, for both child and
   service.
2. Name the Prisma disposal point to match the committed S1 test — identity-deduplicated
   `$disconnect` in the service builder's `withDatabase` registration, inherited by `defineService`
   and `createPluginService`, run in the reserved cleanup phase.
3. Name the KV disposal route — `closeKv()` (singleton-aware, safe no-op when unused); never the
   lazy `PluginServiceContext` KV wrapper `close()` (resolve-on-close trap; singleton poisoning for
   embedded manual-stop hosts).
4. Name the OTel standalone behavior change — SIGTERM handler keeps bounded flush and listener
   removal, drops the exit; standalone embedders compose a runtime or own signals; carried into the
   S3 docs slice and `docs:accuracy`.
5. Complete the slice contract — per-slice file groups with the <30-file bound shown, not asserted.

Cycle-one advisory (carried above): document the `drainTimeoutMs` total-budget narrowing; carry the
signal-path-only disposal check into implementation; keep the reproduction evidence conventions. The
conditional hostname environment fallback was flagged and accepted as safe to defer to the S4 smoke
decision.

The complete cycle-one text is preserved verbatim in git history (the run-dir file as committed at
f86b8891) and in the cycle-one PR comment; the parent applied all five repairs in f86b8891 (run-dir
documentation only, no production changes).
