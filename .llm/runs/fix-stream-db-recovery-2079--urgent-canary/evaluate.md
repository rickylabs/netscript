# IMPL-EVAL — fix-stream-db-recovery-2079 (round-two finite json() seam)

## Metadata

| Field             | Value                                                                                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Run ID            | `fix-stream-db-recovery-2079--urgent-canary` (PR #2083, issue #2079)                                                          |
| Target            | `packages/fresh` default StreamDB session supervisor (recovery adapter + factory)                                             |
| Exact HEAD        | `85203ec419dbdc692278a09cbca4ebd4df85c8e3` («fix(fresh): align native stream pins with canonical catalog»)                     |
| Baseline          | `6f6cbdf030d7595d1730272d0a74aedd66225069` (freshly fetched main)                                                             |
| Archetype         | 3 — runtime/behavior; frontend consumer contract overlay (browser gates N/A, no page/component change)                        |
| Workload tier     | feature (max five re-steers, notify after three)                                                                              |
| Evaluator         | opencode CLI session `ses_ee7be024dffeJ5HAlcs9qY7M49`, 2026-10-07; requested `opencode-go/glm-5.3-flash` effort max (owner-explicit route per `supervisor.md`), observed `opencode-go/glm-5.3-flash` — no fallback, no expense decision needed; distinct vendor family and session from generator (`gpt-6.1-sol` high, OpenAI family) |
| Evaluation window | Probe expansion stopped by supervisor after ~15 min per brief; final bounded pass: `git log -1`, `git diff HEAD^ HEAD`, worklog finals only |

Evaluator separation: this evaluation is a separate session from the generator; evaluator vendor family (opencode-go/glm-5.3-flash) differs from generator (OpenAI). Re-steered in the same evaluator session per feature-tier policy.

## Process Verification

| Check                                  | Result | Evidence                                                                                                               |
| -------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | PASS   | `plan-eval.md` cycle-two `PASS` (round-1 preserved in `plan-eval-round1.md`); withdrawn first seam never left WIP constraints; no implementation preceded PASS |
| Design section exists in worklog       | PASS   | `worklog.md` `## Design` names state/lifecycle, identity, transport/clock ports, cancellation, checkpoint delivery       |
| Commit slices match design plan        | PASS   | Plan commit(s) → single fix commit `c0b3d1796` covering slices 1+2 (7 files) → docs/carriers commit `ae927ce45`; two planned slices combined into one commit noted as low observation |
| Each slice has a passing gate          | PASS   | Slice gates recorded in worklog; decisive gates independently re-run below                                              |
| No speculative seams (unused files)    | PASS   | Adapter, fixture, exports, reconnect options all consumed by tests/factory/consumer; no dead files in the 7-file file set |
| Constants used for finite vocabularies | PASS   | Status union `NetScriptStreamDBStatus` typed and re-exported; no stringly-typed spread                                   |

## Static Gates (independently run)

| Gate                        | Command                                                          | Result | Evidence                                                        |
| --------------------------- | ---------------------------------------------------------------- | ------ | --------------------------------------------------------------- |
| Scoped slice typecheck      | `run-deno-check.ts --root packages/fresh/src/runtime/streams`   | PASS   | exit 0, 7 files, 0 failed batches                               |
| Scoped lint                 | `run-deno-lint.ts --root packages/fresh/src/runtime/streams`    | PASS   | exit 0                                                          |
| Scoped fmt                  | `run-deno-fmt.ts --root packages/fresh/src/runtime/streams`     | PASS   | exit 0, 0 findings                                              |
| Public consumer typecheck   | `deno task check:streams-types` (packages/fresh)                | PASS   | exit 0 (pre-correction HEAD; worklog records post-correction exit 0) |
| Doc lint (streams entry)    | `run-deno-doc-lint.ts --root packages/fresh --entrypoints ./src/runtime/streams/mod.ts` | PASS¹ | 11 privateTypeRef, 0 missingJSDoc; diagnostic set byte-identical to baseline reconstruction (verified against actual baseline file contents, same 11 diagnostics) |
| Doc lint (whole package)    | `run-deno-doc-lint.ts --root packages/fresh`                    | PASS¹  | exit 1 = retained pre-existing debt (28 privateTypeRef, 17 missingJSDoc); no new diagnostic delta — only streams sources changed |
| Publish dry-run             | `deno task publish:dry-run` (packages/fresh)                    | PASS   | exit 0, "Success", no slow types                                |

¹ Entry clean vs whole-package debt retained is the recorded posture; no new diagnostics introduced.

## Fitness Gates

| Gate                    | Result | Evidence                                                                                                  |
| ----------------------- | ------ | --------------------------------------------------------------------------------------------------------- |
| quality:scan (F-1/F-2/F-14/F-19 class) | PASS   | exit 0, `findings: []`; only pre-existing allowances in `packages/cli` and `plugins/workers` (not this slice) |
| arch:check (F-3/F-8/F-12… doctrine)    | PASS   | exit 0 (pre-existing generic warnings, unrelated files)                                                    |
| F-5  public surface     | PASS   | Additive only: two named owned types through existing streams barrel; no upstream re-export; JSDoc on all new surface |
| F-6  JSR publishability | PASS   | fresh publish dry-run exit 0; no slow types                                                                |
| F-9  permissions        | PASS   | No package manifest permission changes; `--allow-all` confined to test-child spawn in test code             |
| F-13 runtime invariants | PASS   | Named state union, injectable clock port, abort-aware stop, explicit error classification (tests below prove) |
| F-15 re-export-of-upstream | PASS | No re-export of `@durable-streams/*`; adapter imports values/types only, factory unchanged seam              |

## Runtime Gates (independently run — all nine affected stream tests)

Structured wrapper (`run-deno-test.ts`, `--allow-all`, streams dir): **exit 0, passed 9 / failed 0**, including the real regression test that SIGKILLs and restarts the persistent upstream reference server (`@durable-streams/server`, `dataDir`-backed persistence): same collection object retained, pre-restart row readable, post-restart row appears after recovery at the committed offset, no origin replay, status returns `live`, then idempotent stop/dispose reaches `stopped`.

Enumerated: 1 wires/validation (factory), 2 killed-server recovery w/o replay, 3 bounded option validation, 4 capped budget exhaustion, 5 missing-startup-stream retry at retained offset, 6 permanent auth/protocol no-retry (400/401/403/410), 7 stop-during-backoff abort idempotence, 8 subscriber-exception never committed/retried, 9 event-source (unchanged surface still green).

## Mutation Evidence (independently reproduced — assertion-red then byte-identical restore)

Ten reproductions, each restored and sha256-verified before the next; final `git status` clean:

| # | Mutation (isolated)                            | Test that went red                                                        | Result |
| - | ---------------------------------------------- | ------------------------------------------------------------------------- | ------ |
| 1 | default `maxRetries` 5 → 0                     | killed-server recovery (zero-retry budget ⇒ failed before restart)         | exit non-zero, red |
| 2 | `connect()` offset `state.offset` → `'-1'`     | killed-server recovery (AssertionError, test line 155 — resumed offset)    | exit 1, red |
| 3 | drop `maxRetries < 0` validation clause        | option validation (TypeError expected)                                     | exit 1, red |
| 4 | drop `initialDelayMs` from backoff formula     | capped exponential budget (`delays` sequence)                              | exit 1, red |
| 5 | reclassify 401 as recoverable                  | permanent auth/protocol ([requests,waits] invariant)                       | exit 1, red |
| 6 | `stop()` without `lifetime.abort()`            | stop-during-backoff (DOMException vs watchdog Error)                       | exit 1, red |
| 7 | drop `subscriberFailed` tagging                | subscriber-exception never committed/retried (request-count invariant)     | exit 1, red |
| 8 | startup offset reset (`offset: '-1'`)          | missing-startup-stream retry retains native checkpoint                     | exit 1, red |
| 9 | remove `NetScriptStreamDBReconnectOptions` export | public type-consumer fixture (type checking failed)                      | exit 1, red |
| 10 | ranged client specifier `^0.2.6` in consumer config resolves newer patch in shared DENO_DIR (0.2.7 present in cache) — corroborates the drift-recorded nominal private-field incompatibility mechanism against the ranged root catalog | consumer resolution probe (resolved module named 0.2.7) | observation only |

Every mutation's target registered failure by test assertion (no crashes passing as red); sources restored byte-identically (hash match each time).

## Consumer Gates

| Consumer                              | Validation (independent, pre-correction head)                          | Result | Post-correction status (worklog-recorded, not re-run) |
| ------------------------------------- | ----------------------------------------------------------------------- | ------ | ------------------------------------------------------ |
| Public type consumer (`streamdb-wrapper_type.ts`, exact pinned import map) | `deno task check:streams-types` exit 0; mutation 9 red removes it      | PASS   | exit 0 after catalog correction (worklog)               |
| JSDoc-example surface                 | not independently re-run                                                | N/A    | `docs:jsdoc-examples` exit 1 pre-correction (recorded receipt at `ae927ce4…`), exit 0 post-correction (worklog) |

## Dependency / Lock Hygiene (diff inspection only)

- Pre-correction `c0b3d1796`: fresh import map pins exact `@durable-streams/state@0.3.1` + `@durable-streams/client@0.2.6`; lock delta only adds the two already-resolved exact specifier declarations (resolutions identical to the pre-existing tilde-range entries — no version change).
- Correction `85203ec4`: root catalog `^0.2.6`→`0.2.6`, `^0.3.1`→`0.3.1`; fresh `package.json` joins `@durable-streams/client` via `catalog:`; lock requirements rewritten from tilde specifiers to exact ones with **identical resolved versions** (client 0.2.6, state 0.3.1, server 0.3.7); no npm/JSR/remote resolution maps changed. Runtime sources under `packages/fresh/src` untouched by the correction — the nine independently observed tests and ten mutations remain valid at current HEAD.
- Drift claim mechanism independently corroborated at probe level (mutation 10): ranged specifiers inside the shared cache resolve newer patches (client 0.2.7, state 0.3.2 exist there), which is what the exact pins eliminate.

## Anti-Pattern Check (in-scope only; others N/A)

| AP    | Status | Evidence                                                             |
| ----- | ------ | -------------------------------------------------------------------- |
| AP-1  | CLEAR  | Single-purpose supervised read seam; no second dispatcher, no upstream internals |
| AP-6  | N/A    | Composition functions; no base-class lifecycle                        |
| AP-10 | CLEAR  | Transport/terminal classification isolated in one boundary; subscriber exceptions stay terminal |
| AP-11 | CLEAR  | Recovery state is adapter-closure-scoped; no module globals           |
| AP-12 | CLEAR  | `setTimeout` only inside the named default clock adapter (`waitForRecovery`), injectable port |
| AP-13 | CLEAR  | No `console.*` in adapter, factory, or carrier runtime code           |
| AP-22 | N/A    | Existing package entrypoint barrel shape unchanged                    |
| AP-23/24 | N/A | No handler/event dispatch introduced                                  |
| AP-25 | CLEAR  | Network/timer side effects confined to the adapter and test fixtures  |

## Arch-Debt Delta

| Metric                | Count | Evidence                                      |
| --------------------- | ----- | --------------------------------------------- |
| New entries           | 0     | no `debt/arch-debt.md` change in the diff      |
| Resolved entries      | 0     | —                                              |
| Deepened violations   | 0     | streams-connector debt entry is server-side, untouched |
| Unrecorded violations | 0     | none found during review                       |

## Findings

| Severity | Finding                                                                                                                                                    | Required action                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| low      | Slices 1+2 landed as one commit (plan named two); per-slice PR phase bookkeeping was lagging at the evaluated pre-correction head (only PLAN comment, `status:plan-eval`) | Supervisor states PLAN + IMPL phase comments posted, carriers pushed, `status:impl-eval` — accepted as recorded, not re-inspected per brief constraint |
| low      | No current-head CI in this evaluation. Post-correction receipts (docs:jsdoc-examples exit 0, public consumer 0) are generator/worklog-recorded, not independently re-run | Required before any `status:ready-merge`/close-gate; current-head CI must run green per the run's gate set |
| info     | Shared main critical audit remains a separate owner dependency maintenance item: receipt at pre-correction `ae927ce4…` records actual exit 1; newer upstream patches exist in cache/registry but were deliberately **not** adopted here | Owner-side maintenance PR; adoption must not silently change this run's locked compatible pair |

## Lessons for Promotion

| Lesson                                                                 | Pattern                                                      | Applies to            | Confidence |
| ---------------------------------------------------------------------- | ------------------------------------------------------------ | --------------------- | ---------- |
| Exact-pin the catalog when a cache contains newer compatible patches   | ranged catalog specifiers resolve newer nominal types → consumer gate flips on cache state | ARCHETYPE-3 packages | high       |
| Native `closed` is lifecycle, not batch completion                      | supervise `json()` resolution; attach `closed` only as rejection guard | stream runtime work   | high       |

## Verdict

| Field     | Value                                                                    |
| --------- | ------------------------------------------------------------------------ |
| Verdict   | **PASS**                                                                  |
| Rationale | Approved finite-json() seam scope is complete and independently proven: nine affected stream tests green (including real SIGKILL/restart), nine source mutations each turned the matching test assertion-red before byte-identical restore, the public type consumer is red without the new export and green with the pinned pair, doc-lint diagnostics for the changed entrypoint are identical to actual main baseline (eleven private refs, zero missing JSDoc) with no whole-package delta, and all independently run static/fitness/carrier gates exited 0. The post-eval catalog correction changes specifier/workspace metadata only (lock resolutions byte-equivalent; runtime source untouched), so the observed evidence stands. Remaining work is exactly the recorded owner-side items: the shared critical-audit dependency maintenance (separate, receipted) and current-head draft CI before any ready-merge — neither a defect of this slice's implementation. No self-certification of the merge gate is made here. |

Report scope notes: draft-CI state and dependency maintenance are distinguished from source acceptance above; no operator paths, endpoints, credential values, or usage counts are included; no tests were added or re-run after the supervisor's bounded-stop instruction.
