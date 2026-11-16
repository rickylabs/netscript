# Context pack

Issues #2630/#2631, main b0eb07957, branch fix/runtime-child-drain. Research/plan drafted, real Redis subprocess reproduction in progress, PLAN-EVAL required before implementation. Generated glue changes require one full scaffold.runtime smoke at the end. Do not merge or publish. No modifications under plugin-sagas-core/src/transports.

Confirmed baseline: real Redis child clean/timeout tests fail the exit watchdog (2/2); service clean/timeout likewise (2/2). These are genuine runtime failures after readiness, not startup failures. No production changes yet. PLAN-EVAL next.

## PLAN-EVAL cycle-one repairs

Evaluator accepted reproduction and coverage but returned FAIL_PLAN for five underspecified decisions. Plan now explicitly locks Deno.exit on clean and failed process-owned paths; Prisma dedup/disposal in raw withDatabase, inherited by presets; closeKv() rather than lazy context KV close(); bounded OTel flush without process termination and documented standalone behavior; and per-slice file groups (all below 30 files). Service's default 30 s total includes 25 s work and 5 s reserved cleanup; manual stop/external abort remain embeddable. No production code has changed. Cycle-two PLAN-EVAL is required before implementation.

## S1 regression baseline and plan approval

PLAN-EVAL cycle two PASS: https://github.com/rickylabs/netscript/pull/2641#issuecomment-6923762411. All five requested plan repairs accepted; no product implementation preceded approval. New focused regression run at unchanged main source: 9 pass, 2 fail. Child default bind reports 0.0.0.0 instead of 127.0.0.1; OTel exits 0 before the composing runtime's drain/exit 7. Real Redis subprocess baseline already records four watchdog failures. Signal subprocess cases explicitly skip Windows (SIGTERM-specific acceptance).
S1 commits the red oracles and accepted plan; S2 will make these regressions pass. Tests requiring new cleanup contracts are added after those contracts exist. No resources remain from reproduction.

## S2 core lifecycle implementation

Added explicit child shutdown ownership, loopback hostname override, monotonic total work/cleanup deadlines, and exit codes 0/1/2. Service signal paths reserve cleanup within the total deadline, call singleton-aware closeKv(), disconnect every registered raw-builder DB identity once, and terminate explicitly. Manual stop/external abort and exitOnSignal:false leave process-owned resources to their host. Cleanup invokes all registered resource callbacks even if work or another cleanup hangs. OTel's bounded signal shutdown no longer exits the process.

| Gate | Result |
| --- | --- |
| Real Redis child/service clean and timeout subprocess tests | exit 0, 4/4 pass; formerly four watchdog failures |
| Child bind/fatal snapshot, service coordinator, OTel focused tests | exit 0, 15/15 pass |
| Expanded cleanup/coordinator tests | exit 0, 8/8 pass |
| Existing listener/builder/runtime embedding tests | exit 0, 34/34 pass |
| Structured targeted type-check | exit 0, no diagnostics |
| Structured lint / format | exit 0 / exit 0 after correcting require-await in test stubs |
| quality:gate (quality:scan + arch:check) | exit 0 |

Resource teardown preview remained read-only. Owned Redis was removed after exact identity, run-label and bind-mount proof; no foreign or unknown-owner resources changed. S2 adds explicit exitOnSignal:false to two existing embedded signal tests; their hook/listener assertions are retained. Plan file groups updated to 17 (<30) to include these necessary test adaptations and post-contract cleanup tests.
Reconcile: PR remains a draft, status progresses to implementation, source for excluded saga transports is unchanged. S3 composition/docs and the one-pass runtime smoke remain pending; no supervisor sign-off is claimed.

## S3a generated resource ownership

Added optional, idempotent owner disposal to PluginServiceContext without resolving unused adapters. Generated host bootstrap tracks only acquired Prisma identities; its callback attempts every disconnect once. Workers/sagas/auth service composition invokes it in reserved signal cleanup; workers/sagas/triggers child glue calls singleton closeKv and the generated host callback. Saga DB acquisitions are covered through their existing host resolver. Native embedded hosts retain ownership on manual stop. Explicit host DB disposal disables duplicate automatic raw-builder disposal.

Generated-owner tests first failed 2/37 with missing disposal against the old embedded template. After canonical gen:assets-barrel, the suite passes 37/37, including all three installed runtime artifacts, acquired/unused generated DB cases, lazy owner disposal and a real signal proving exactly one disconnect. Structured changed-source check passes (14 files); non-CLI lint/fmt passes with no findings. CLI files require the repository's explicit CLI quality config because the root config excludes them; separate wrappers validate them. No lock changes or new dependencies.
Reconcile: #2630/#2631 acceptance implementation is progressing; generated runtime smoke, documentation/assets and independent IMPL-EVAL remain. No foreign resources are running for this slice.

## S3b public behavior documentation

Documented child loopback/hostname overrides, total and reserved cleanup budgets, explicit exit codes 0/1/2, manual/external embedding semantics, host database ownership override and OTel standalone signal behavior. Expanded the generated child-health page from the public option/function JSDoc, so its operational text stays source-derived. Public prose contains no run/evaluator/finding identities.

Docs:accuracy passes. Release:preflight initially detected package self-imports inside the new subprocess test strings; tests now resolve their local source module explicitly, and preflight passes. Child seam tests still pass 4/4. This is a test import correction, not a gate exclusion. Source remains within approved runtime scope. Documentation generator carriers are refreshed after committing the read set, then the full one-pass runtime smoke runs.

## S3b generated consumers and final static gates

Canonical agent prose/site generation passes. Refreshed MCP export-surface corpus, CLI assets and publish assets; both corpus and publish freshness checks pass. Export generation used its documented --allow-dirty option only for the already-generated prose carrier; all hand-authored inputs were committed and the warning named that sole derived input. No lock changes. Reference layouts were restored after the Markdown formatter caused broad table churn, leaving only semantic shutdown additions in the PR diff.

Final quality:gate, docs:accuracy and release:preflight pass. Service full export-map doc lint passes with zero diagnostics. Plugin doc lint has 18 pre-existing private-type diagnostics; telemetry has 7 (6 private-type, 1 missing JSDoc). Measured the identical command and per-entrypoint/file distributions at base b0eb07957 in a detached baseline checkout. Changed plugin health/SDK entrypoints are clean. JSR audits: service, telemetry and CLI exit 0 (existing warnings); plugin dry-run succeeds but audit exits 1 for three pre-existing missing @module tags in untouched abstracts/config/testing entrypoints. Git diff of those three entrypoints against the base is empty. These unrelated baseline findings are not hidden or fixed in this runtime slice.

Next: one full scaffold.runtime smoke with cleanup, resource ownership audit, final independent IMPL-EVAL and head checks. #2632 is ready for review separately at head deb6b21cfcfc6b9d94e7291eb21def7072b4539b with required checks PASS/SKIPPED and no unanswered threads.
