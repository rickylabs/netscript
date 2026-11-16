# Evaluation: fix-runtime-child-drain--issues-2630-2631

## Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-runtime-child-drain--issues-2630-2631` |
| Target | PR 2641, issues #2630/#2631 |
| Archetype | 3 runtime/behavior primary, plugin/CLI and service overlays |
| Scope overlays | `SCOPE-service.md`, `SCOPE-docs.md` |
| Evaluator | Separate session from generator; requested `muse_spark_1_3/xhigh`, observed `opencode-go/muse-spark-1.3-contributor`; generator is the owner-selected Codex `gpt-6.1-sol/xhigh` session; different session and different vendor family; no substitution; fallback `opus_5/xhigh` not used |
| Branch | `fix/runtime-child-drain` |
| Exact head evaluated | `26e945e9f3b710a1f18e2452bb4d524ed217e09b` |
| Base | `origin/main b0eb079575968e843b781579673c9fe2ae250e07` |
| Date | 2026-11-16 |

## Process Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Plan-Gate passed before implementation | PASS | `.llm/runs/fix-runtime-child-drain--issues-2630-2631/plan-eval.md` cycle two `PASS`; PR comment `6923762411` `[PHASE: PLAN-EVAL] [VERDICT: APPROVED]` at head `f86b8891` |
| Design section exists in worklog | PASS | `.llm/runs/fix-runtime-child-drain--issues-2630-2631/worklog.md` `## Design` names public surface, lifecycle, contributor path, and gate plan |
| Commit slices match design plan | PASS | Plan S1/S2/S3a/S3b/S4 order preserved in worklog and PR slice checklist; S1 red oracles, S2 core lifecycle, S3a generated ownership, S3b docs/carriers, S4 validation follow-up with two recorded expectation updates |
| Each slice has a passing gate | PASS | Worklog records per-slice gates: S1 9 pass/2 fail red baseline; S2 Redis 4/4 plus 15/15 plus 8/8 plus 34/34; S3a generated 37/37; S3b docs/accuracy, release preflight, carrier freshness; S4 structured 820 pass/0 fail/4 ignored with the 4 Redis cases executed separately |
| No speculative seams | PASS | New files trace to the database identity-disposal seam and subprocess/control tests; no generic lifecycle registry; no saga transport changes; no Redis Streams dependency |
| Constants used for finite vocabularies | PASS | Exit codes 0/1/2 computed in one place per edge (`packages/plugin/src/presentation/run-child-health-process.ts`, `packages/service/src/builder/service-listener.ts`); no stringly exit-code spread |

## Static Gates

| Gate | Command or check | Result | Evidence | Notes |
| --- | --- | --- | --- | --- |
| Narrow typecheck | structured check wrapper, service root | PASS | Independent run: service selection 131 files, 0 diagnostics | Uses pinned Deno 2.9.7 with unstable-kv |
| Slice typecheck | structured check wrapper, child presentation root | PASS | Independent run: 4 files, 0 diagnostics | Same toolchain |
| Format | structured fmt wrapper, service root | PASS | Independent run: 131 files, 0 findings | Scoped TS only, not raw root noise |
| Lint | structured lint wrapper, service root | PASS | Independent run: 131 files, 0 findings | Scoped TS only |
| Focused tests | structured test wrapper | PASS | Independent runs: service resources plus coordinator 9/9; child health plus OTel provider 11/11 | Smallest meaningful independent evidence; Redis subprocess regressions not rerun here |
| Quality gate | `deno task quality:gate` | PASS | Independent run exit 0; A13 `Deno.exit` warnings present on the intentional process edges | Warnings are the planned process-ownership exits, not a failure |
| Architecture fitness | `deno task arch:check` | PASS | Independent run exit 0 | Same warning set as quality gate |
| Service doc lint | structured doc-lint wrapper, service full export map | PASS | Independent run: combined 0 diagnostics across all entrypoints | Matches reported clean claim |
| Plugin/telemetry doc lint | reported only | PENDING | Reported plugin 18 and telemetry 7 match measured base distributions; changed health/SDK entrypoints reported clean | Not independently re-measured at base in this pass; accepted as disclosed pre-existing baseline, not new debt |
| JSR audit | reported only | PENDING | Reported service/telemetry/CLI pass with existing warnings; plugin dry-run succeeds but audit reports 3 missing module tags in untouched abstracts/config/testing entrypoints | Matches the disclosed pre-existing pattern; not independently rerun here |
| Docs accuracy / release preflight / carriers | reported only | PASS (reported) | Worklog records docs:accuracy, release:preflight, and generated-carrier freshness passing after the test import correction | Import correction described as resolving package self-imports to local module URLs, not a gate exclusion |

## Fitness Gates

| Gate | Function | Result | Evidence | Violations |
| --- | --- | --- | --- | --- |
| F-1 | File-size lint | PASS | quality:gate exit 0 | None introduced |
| F-2 | Helper-reinvention scan | PASS | quality:gate exit 0 | Callback contracts and existing hooks preferred; no new registry |
| F-3 | Layering check | PASS | quality:gate and arch:check exit 0 | Builder/listener/coordinator split retained |
| F-4 | Inheritance audit | PASS | quality:gate exit 0 | No new base-class coupling |
| F-5/F-6 | Public surface / JSR | PENDING | Plugin 3 missing module tags reported in untouched entrypoints | Pre-existing; no new export-shape violation found in changed options (`ChildHealthProcessOptions`, `ServeOptions`, `PluginServiceContext.dispose`) |
| F-13 | Saga and runtime invariants | PASS | No changes under `packages/plugin-sagas-core/src/transports/`; saga DB covered through the existing host resolver; no Redis Streams dependency added | Hard restriction honored |

Remaining fitness rows inherit the quality:gate/arch:check PASS; no new `any`, no new blanket lint ignores, and no host-side hardcoded plugin coupling were introduced in the reviewed diff.

## Runtime Gates

| Gate | Validation | Result | Evidence |
| --- | --- | --- | --- |
| Child/service Redis subprocess regressions | Real Redis clean plus hung work, child and service | PASS (generator-reported) | Worklog: 4 watchdog failures on base, 4/4 pass at head; KV-alone negative control exits; this pass did not rerun live Redis subprocesses and does not re-certify them |
| Child bind plus OTel order | Focused snapshot tests | PASS (generator-reported, partially independent) | Worklog: bind default reports loopback vs base ephemeral-interface behavior; OTel no longer exits before runtime drain; child plus OTel focused tests independently rerun here 11/11 |
| Generated owner disposal | Acquired/unused/alias identity plus installed artifacts | PASS (generator-reported) | Worklog: 37/37 including acquired/unused cases and one real-signal exactly-once disconnect |
| Full service plus plugin suite | Structured suite | PASS (generator-reported) | Worklog: 820 passed, 0 failed, 4 ignored; the 4 ignored are the Redis cases executed separately above |
| Full one-pass scaffold runtime | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` on a supported runner | NOT_RUN | Local attempts correctly stopped: first at PostgreSQL loopback readiness on remote-Docker topology, second at the maintained explicit remote-Docker rejection in plugin doctor; temporary owned-only bridge plus diagnostic AppHost are stopped with zero owned survivors; supported-runner `e2e-cli` workflow dispatch is in progress and, at read time, has not produced a terminal verdict; draft PR checks show that lane skipped with one conformance lane still running |

## Consumer Gates

| Consumer | Validation | Result | Evidence |
| --- | --- | --- | --- |
| Generated container/Aspire health | Non-loopback child health reachability on a supported runner | NOT_RUN | Explicit native `hostname` override exists and defaults to loopback, but generated workers/sagas/triggers glue stubs do not forward any hostname override and no environment fallback was added; the S4 hostname-environment decision was deferred to the smoke that has not completed, so there is no supported-runner proof that generated launches needing non-loopback probes still pass |
| Docs consumers | Source-derived child health docs plus MCP/CLI carriers | PASS (reported) | Worklog: generation passes, carrier freshness passes, reference layout churn reverted leaving only semantic shutdown additions |

## Anti-Pattern Check

Only rows the run scope touches are marked `CLEAR`; the rest are `N/A`.

| AP | Status | Evidence | Notes |
| --- | --- | --- | --- |
| AP-1 | CLEAR | Small focused modules; no generic utils folder added | — |
| AP-5 | CLEAR | No new inheritance; composition via callbacks and existing hooks | — |
| AP-13 | CLEAR | `Deno.exit` confined to process-owned signal paths with documented 0/1/2 codes; `exitOnShutdown`/`exitOnSignal` false paths leave hosts alone | A13 scanner warns, quality gate still exits 0; intentional per approved plan |
| AP-20 | CLEAR | No Redis Streams dependency; transport directory untouched | Hard restriction honored |
| Others in scope | CLEAR/N/A | No new registry, no lazy-resolve-on-close in disposal paths, manual stop and external abort retain host ownership | — |

## Arch-Debt Delta

| Metric | Count | Evidence |
| --- | --- | --- |
| New entries | 0 | No new doctrine violation found requiring registration |
| Resolved entries | 0 | No entry claimed closed |
| Deepened violations | 0 | KV god-test debt untouched; only `closeKv()` called from composition roots, KV package unmodified |
| Unrecorded violations | 0 | OTel standalone behavior change is documented and carried in docs scope |

## Findings

| Severity | Finding | Evidence | Required action |
| --- | --- | --- | --- |
| high | Full supported-runner `scaffold.runtime` has no green verdict | PR Definition of Done leaves generated-launch smoke unchecked; `e2e-cli` workflow dispatch is in progress with no terminal conclusion at read time; local evidence is explicitly partial by topology, with no guard disabled | Obtain the green supported-runner one-pass smoke with cleanup on this exact head; link the run and its exit code; then re-run IMPL-EVAL currency checks before any ready-merge move. Do not rerun full local smoke on the unsupported remote-Docker topology and do not weaken plugin doctor. |
| high | Generated child-health hostname override has no container evidence | `packages/plugin/src/presentation/run-child-health-process.ts` defaults to `127.0.0.1` with an explicit `hostname` option; workers/sagas/triggers `plugins/*/src/adapter/resources/glue/runtime.stub.ts` pass only `onShutdown` and restart history, with no hostname forwarding; issue #2631 requires generated container/Aspire launches needing non-loopback probes to still pass, and the deferred hostname-environment decision is not recorded in `.llm/runs/fix-runtime-child-drain--issues-2630-2631/drift.md` | Either wire the override through generated glue (option or documented environment delivery) with a test, or supply supported-runner evidence that loopback suffices for the generated probes, and record the S4 hostname decision in drift. Generator to resolve while CI runs. |
| medium | Close-gate is correctly red | Both issues carry unchecked acceptance boxes; PR Definition of Done leaves the smoke and independent evaluation unchecked; PR carries no closing keywords and must not gain them until the two high findings are resolved | Keep the PR draft without closing keywords; verify every acceptance and gate checkbox with linked evidence before any `status:ready-merge` transition. |
| low | Baseline doc/JSR deltas rely on measured comparison | Plugin 18 plus telemetry 7 doc-lint and 3 plugin JSR module-tag findings are reported as identical to base with empty diff on those entrypoints | No code action; retain the base-measurement note in the final ready-merge evidence so a closer does not mistake them for new debt. |

No implementation logic defect was found in the reviewed edges: monotonic total budgets with reserved cleanup, cleanup attempted despite hung work, signal-only identity-deduplicated Prisma disposal, singleton-aware KV disposal, explicit owner-disposal opt-out, idempotent host disposal tracking only acquired clients, and bounded OTel flush with listener removal and no process exit all match the approved contracts.

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| --- | --- | --- | --- |
| Remote-Docker loopback is not a green smoke | Temporary bridges can prove native readiness yet still fail maintained topology guards | release-gate runs | high |
| Explicit hostname without generated wiring leaves container coverage open | Child default change needs glue forwarding or probe evidence in the same slice | runtime edges | medium |

## Verdict

| Field | Value |
| --- | --- |
| Verdict | `FAIL_FIX` |
| Rationale | Plan remains valid and the reviewed lifecycle, ownership, and OTel changes match the approved contracts with static and focused gates green, but the release-gate class has no supported-runner green verdict and generated non-loopback health coverage has no evidence; both are required remedies, not a plan or debt failure. PR phase comment is therefore `CHANGES_REQUESTED`. |
