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

## Cycle two — current verdict (2026-11-16)

Cycle-one `FAIL_FIX` history above is preserved. This cycle independently re-evaluates the current head after both F1/F2 repairs.

### Metadata (cycle two)

| Field | Value |
| --- | --- |
| Run ID | `fix-runtime-child-drain--issues-2630-2631` |
| Target | PR 2641, issues #2630/#2631 |
| Archetype | 3 runtime/behavior primary, plugin/CLI and service overlays |
| Scope overlays | `SCOPE-service.md`, `SCOPE-docs.md` |
| Evaluator | Separate session from generator; requested `muse_spark_1_3/xhigh`, observed `opencode-go/muse-spark-1.3-contributor`; generator is the owner-selected Codex `gpt-6.1-sol/xhigh` session; different session and different vendor family; no substitution; fallback `opus_5/xhigh` not used |
| Branch | `fix/runtime-child-drain` |
| Exact head evaluated | `582372c4a3f160ea6b944c1ace574ab9a5c6ba67` |
| Base | `origin/main b0eb079575968e843b781579673c9fe2ae250e07` |
| Green-smoke source head | `d6ef1fa71` (workflow 43951994678 SUCCESS); `git diff d6ef1fa71..HEAD -- packages plugins docs` exits 0, current head changes only 2 run files |
| Date | 2026-11-16 |

### Process Verification (cycle two)

| Check | Result | Evidence |
| --- | --- | --- |
| Plan-Gate passed before implementation | PASS | `.llm/runs/fix-runtime-child-drain--issues-2630-2631/plan-eval.md` cycle two `PASS`; PR comment `6923762411` |
| Design section exists in worklog | PASS | `.llm/runs/fix-runtime-child-drain--issues-2630-2631/worklog.md` `## Design` names public surface, lifecycle, contributor path, gate plan |
| Commit slices match design plan | PASS | Plan S1/S2/S3a/S3b/S4 order preserved; S4 native restart diagnostic control and supported-runtime complete recorded in worklog |
| Each slice has a passing gate | PASS | Worklog per-slice gates plus cycle-two independent reruns below |
| No speculative seams | PASS | New files trace to database identity-disposal seam and subprocess/control tests; no generic lifecycle registry; no saga transport changes; no Redis Streams dependency |
| Constants used for finite vocabularies | PASS | Exit codes 0/1/2 computed in one place per edge (`packages/plugin/src/presentation/run-child-health-process.ts`, `packages/service/src/builder/service-listener.ts`); no stringly exit-code spread |

### Static Gates (cycle two, independent)

| Gate | Command or check | Result | Evidence | Notes |
| --- | --- | --- | --- | --- |
| Narrow typecheck | structured check wrapper, service root | PASS | Independent run: 131 files selected, 0 diagnostics | Pinned Deno 2.9.7 with unstable-kv |
| Slice typecheck | structured check wrapper, child presentation root | PASS | Independent run: 4 files, 0 diagnostics | Same toolchain |
| Format | structured fmt wrapper, service root | PASS | Independent run: 131 files, 0 findings | Scoped TS only |
| Lint | structured lint wrapper, service root | PASS | Independent run: 131 files, 0 findings | Scoped TS only |
| Quality gate | `deno task quality:gate` | PASS | Independent run exit 0; A13 `Deno.exit` warnings present on intentional process edges | Same warning set as cycle one; intentional per approved plan |
| Architecture fitness | `deno task arch:check` | PASS | Independent run exit 0 | Same warning set as quality gate |
| Service doc lint | structured doc-lint wrapper, service full export map | PASS | Independent run: combined 0 diagnostics across entrypoints | Matches reported clean claim |
| Plugin/telemetry doc lint | structured doc-lint wrapper | PASS (pre-existing baseline) | Independent run: plugin 18 private-type, telemetry 7 (6 private-type + 1 missing JSDoc); changed health/SDK entrypoints clean | Matches disclosed base distributions; untouched entrypoints diff empty vs base; not new debt |
| Docs accuracy | `deno task docs:accuracy` | PASS | Independent run PASS | — |
| Release preflight | `deno task release:preflight` | PASS | Independent run: text-imports, import-attributes, file-url-import-meta, self-imports all PASS | — |
| JSR audit | reported only | PASS (reported, baseline unchanged) | Service/telemetry/CLI pass with existing warnings; plugin dry-run succeeds with 3 missing module tags in untouched entrypoints | Prior evaluator accepted these baselines; retained as disclosed, not hidden or broadened |

### Fitness Gates (cycle two)

| Gate | Function | Result | Evidence | Violations |
| --- | --- | --- | --- | --- |
| F-1 | File-size lint | PASS | quality:gate exit 0 | None introduced |
| F-2 | Helper-reinvention scan | PASS | quality:gate exit 0 | Callback contracts and existing hooks preferred; no new registry |
| F-3 | Layering check | PASS | quality:gate and arch:check exit 0 | Builder/listener/coordinator split retained |
| F-4 | Inheritance audit | PASS | quality:gate exit 0 | No new base-class coupling |
| F-5/F-6 | Public surface / JSR | PASS (pre-existing baseline) | Plugin 3 missing module tags in untouched entrypoints, diff empty vs base | No new export-shape violation in changed options (`ChildHealthProcessOptions`, `ServeOptions`, `PluginServiceContext.dispose`) |
| F-13 | Saga and runtime invariants | PASS | No changes under `packages/plugin-sagas-core/src/transports/` (`git diff --exit-code` clean); no Redis Streams dependency | Hard restriction honored |

Remaining fitness rows inherit the quality:gate/arch:check PASS; no new `any`, no new blanket lint ignores, and no host-side hardcoded plugin coupling were introduced in the reviewed diff.

### Runtime Gates (cycle two, independent)

| Gate | Validation | Result | Evidence |
| --- | --- | --- | --- |
| Generated hostname forwarding (F2 repair) | Actual generated workers/sagas/triggers entrypoints with native Deno preload observing `server.addr` and real HTTP | PASS (independent) | Structured wrapper exit 0, 6/6 pass (`packages/plugin/tests/health/generated-hostname_test.ts`); all 3 stubs forward `NETSCRIPT_CHILD_HEALTH_HOSTNAME` to native `hostname` option; default retains loopback; explicit override probes a real non-loopback interface; 503 in this isolated bind test is intentional (bootstrap deliberately invalid) and proves bind/reachability |
| Child/service Redis subprocess regressions (F1-related lifecycle) | Real isolated Redis clean plus hung work, child and service | PASS (independent) | Structured wrapper exit 0, 4/4 pass (`packages/plugin/src/presentation/run-child-health-process_exit_test.ts`, `packages/service/tests/signal-exit_test.ts` with `NETSCRIPT_TEST_REDIS_URL` against owned isolated Redis; exit 0 clean / 2 timeout observed); owned container created with unique label, verified by immutable ID before stop/remove, zero own survivors, foreign resources untouched |
| Full supported one-pass scaffold.runtime (F1 repair) | `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` on a supported runner | PASS (verified, same production source) | Workflow 43951994678 SUCCESS at source `d6ef1fa71`; Postgres 124/124, SQLite 116/116 plus showcase 8/8, scaffold-static and desktop-native success, cleanup assertions intact; current head production/tests/docs identical to that source (`git diff` exits 0, only 2 run files differ); no guard bypass, retry, target, cleanup or lifecycle-gate change; no new unproven runtime root-cause fix |
| Full structured service/plugin suite | Reported full suite | PASS (reported, currency preserved) | 820 pass / 0 fail / 4 optional Redis separately 4/4 pass with owned real Redis; generated acquired/unused/duplicate owner 37/37; installed hostname 31/31; native restart error-path 2 red->green plus adjacent refresh 14/14; no evidence of generated behavior change after green source head, so no expensive full rerun required |

### Consumer Gates (cycle two)

| Consumer | Validation | Result | Evidence |
| --- | --- | --- | --- |
| Generated container/Aspire health | Non-loopback child health reachability plus full Aspire generated-role health | PASS | F2 6/6 live bind/HTTP plus complete supported smoke confirming actual generated role health/readiness 200; Aspire host executables retain loopback by default, containers explicitly widen via environment |
| Docs consumers | Source-derived child-health docs plus MCP/CLI carriers | PASS | `docs/site/orchestration-runtime/child-health.md` regenerated from public JSDoc with loopback/hostname, budgets, exit codes; agent prose/site, export corpus, publish assets freshness passes reported plus docs:accuracy/preflight independent PASS above |

### Anti-Pattern Check (cycle two)

Only rows the run scope touches are marked `CLEAR`; the rest are `N/A`.

| AP | Status | Evidence | Notes |
| --- | --- | --- | --- |
| AP-1 | CLEAR | Small focused modules; no generic utils folder added | — |
| AP-5 | CLEAR | No new inheritance; composition via callbacks and existing hooks | — |
| AP-13 | CLEAR | `Deno.exit` confined to process-owned signal paths with documented 0/1/2 codes; `exitOnShutdown`/`exitOnSignal:false` paths leave hosts alone | A13 scanner warns, quality gate still exits 0; intentional per approved plan |
| AP-20 | CLEAR | No Redis Streams dependency; transport directory untouched | Hard restriction honored |
| Others in scope | CLEAR/N/A | No new registry, no lazy-resolve-on-close in disposal paths, manual stop and external abort retain host ownership | — |

### Arch-Debt Delta (cycle two)

| Metric | Count | Evidence |
| --- | --- | --- |
| New entries | 0 | No new doctrine violation requiring registration |
| Resolved entries | 0 | No entry claimed closed |
| Deepened violations | 0 | KV god-test debt untouched; only `closeKv()` called from composition roots, KV package unmodified |
| Unrecorded violations | 0 | OTel standalone behavior change documented and carried in docs scope |

### Findings (cycle two)

| Severity | Finding | Evidence | Required action |
| --- | --- | --- | --- |
| low | Draft-head CI lanes show skipping with only docs/build lanes green | Draft `status:impl-eval` head shows expected skipping; decisive green is the supported workflow at identical production source | No code action; parent transitions readiness after this verdict; do not change labels/readiness in this lane |

No high/medium findings remain. Both cycle-one findings are repaired and independently verified rather than trusted.

### Lessons for Promotion (cycle two retained)

| Lesson | Pattern | Applies to | Confidence |
| --- | --- | --- | --- |
| Remote-Docker loopback is not a green smoke | Temporary bridges can prove native readiness yet still fail maintained topology guards | release-gate runs | high |
| Explicit hostname without generated wiring leaves container coverage open | Child default change needs glue forwarding or probe evidence in the same slice | runtime edges | medium |

### Verdict (cycle two)

| Field | Value |
| --- | --- |
| Verdict | `PASS` |
| Rationale | Approved scope complete; static/fitness gates pass with pre-existing doc/JSR baselines disclosed; runtime and consumer gates have independent plus supported-runner evidence (F1 full smoke green on identical production source, F2 generated forwarding 6/6 live plus full Aspire health 200); no unrecorded doctrine violation; docs and run artifacts sufficient for resume. Final current-head/threads Definition-of-Done intentionally awaits parent transition after this verdict. |
