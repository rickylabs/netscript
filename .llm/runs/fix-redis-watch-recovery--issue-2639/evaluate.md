# Evaluation: PR 2644 / issue 2639 — Redis watch recovery

## Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-redis-watch-recovery--issue-2639` |
| Target | PR `2644` / issue `2639` |
| Archetype | `3 - runtime/behavior`, folding Integration-2 |
| Scope overlays | none |
| Evaluator | feature IMPL-EVAL primary Muse Spark 1.3/xhigh via OpenCode Go; observed identity matches requested route, fallback Opus 5/xhigh unused |
| Generator | Codex gpt-6.1-sol/xhigh (OpenAI family) — separate session and separate vendor family from evaluator, no substitution |
| Evaluated head | `93bf1a6bce1b5b34fea6cf32a90cef795da42a3f`, branch `fix/redis-watch-recovery`, clean tree, base `origin/main` `b0eb079575968e843b781579673c9fe2ae250e07` |
| Source head | `ea85fb387d0e379b97c598aa4a9a14dea604a6dd` — byte-identical to evaluated head across `packages/`, `plugins/`, `docs/`; delta to evaluated head is run-artifact evidence only |
| Date | 2026-11-16 |

## Process Verification

| Check | Result | Evidence |
| ----- | ------ | -------- |
| Plan-Gate passed before implementation | PASS | `plan-eval.md` cycle 1 PASS at `94a7bb380`, 8/8 boxes, separate-session GLM 5.3 evaluator, different vendor family from generator |
| Design section exists in worklog | PASS | `worklog.md` ## Design: state machine connected/recovering/failed/closed, shared subscriber owner, generation fences, queue terminal failure, cancellable budget |
| Commit slices match design plan | PASS | 8 commits on draft PR: S1 red tests, S2 contract then recovery, S3 consumer assets, per-lease correction, handoff evidence only |
| Each slice has a passing gate | PASS | per-slice PR comments with red baseline, green regressions, full suite and static/package gates; independently re-verified below |
| No speculative seams | PASS | changed files all traced to plan groups; no new public abstraction, no new settings/dependencies |
| Constants for finite vocabularies | PASS | `REDIS_WATCH_RECOVERY_TIMEOUT_MS`, phase union, existing error hierarchy reused |

## Static Gates

| Gate | Command or check | Result | Evidence | Notes |
| ---- | ---------------- | ------ | -------- | ----- |
| Narrow typecheck | scoped check wrapper `--root packages/kv --ext ts,tsx` | PASS | 61 files, 0 findings, independently re-run | — |
| Lint | scoped lint wrapper `--root packages/kv --ext ts,tsx` | PASS | 61 files, 0 findings, independently re-run | — |
| Format | scoped fmt wrapper `--root packages/kv --ext ts,tsx` | PASS | 61 files, 0 findings, independently re-run | — |
| Doc lint | doc-lint runner `--root packages/kv` | PASS | 0 diagnostics across `mod.ts`, `redis.ts`, `kvdex.ts`, testing entrypoints, independently re-run | — |
| Publish dry-run | `deno publish --dry-run --allow-dirty` in `packages/kv` | PASS | dry run complete, full file list as expected | — |
| JSR audit | `audit-jsr-package.ts --root packages/kv` | PASS | 1 finding: WARN F-JSR-7 slow-types (single pre-existing inspection warning, also reported by generator) | not introduced by this change |
| release:preflight | `deno task release:preflight` | PASS | text-imports, import-attributes, file-url-import-meta, self-imports all PASS, independently re-run | — |
| docs:accuracy | `deno task docs:accuracy` | PASS | independently re-run | — |
| Link/path check | changed imports/exports | PASS | `mod.ts`/`redis.ts` re-export existing errors; `watch-fixed-keys.ts` imports existing owners only | — |

## Fitness Gates

`deno task quality:gate` independently re-run: exit 0, every package `FAIL=0`. `packages/kv` row `FAIL=0 WARN=4 INFO=1`; the two F-1 size warnings name pre-existing `deno-kv.adapter.ts`/`denokv-bridge.ts`, not changed files.

| Gate | Function | Result | Evidence | Violations |
| ---- | -------- | ------ | -------- | ---------- |
| F-1 | File-size lint | PASS | adapter `747->704` lines, new focused `watch-fixed-keys.ts` 127 lines, within approved same-concern split allowance | none new |
| F-2 | Helper-reinvention scan | PASS | timing via `@std/async` retry/delay/abortable, logging via package logger | none |
| F-3 | Layering check | PASS | `watch-subscriptions.ts`/`watch-fixed-keys.ts`/`watch-batch-queue.ts` stay in existing adapter owners, import domain/ports only | none |
| F-4 | Inheritance audit | PASS | no new base behavior; existing error hierarchy reused | none |
| F-5 | Public surface audit | PASS | only existing `KvError`/`KvConnectionError`/`KvClosedError` newly exported from two existing entrypoints with JSDoc | none |
| F-6 | JSR publishability | PASS | dry-run + audit above | one pre-existing slow-type warning |
| F-7 | Doc-score gate | PASS | doc lint 0, README and guide document recovery/typed errors | none |
| F-8 | Workspace lib override | PASS | quality:gate covers | none |
| F-9 | Permission declaration | PASS | quality:gate covers | none |
| F-10 | Test-shape audit | PASS | 7 new live server cases + 3 queue cases, no `bridge_test.ts` growth | none |
| F-11 | Forbidden-folder lint | PASS | no new `utils`/`common`/`lib` folders | none |
| F-12 | Naming-convention lint | PASS | quality:gate covers | none |
| F-13 | Saga/runtime invariants | PASS | start/stop/failure/retry/cancellation exercised by live tests | none |
| F-14 | Console-log lint | PASS | logger used, no `console.*` in runtime | none |
| F-15 | Re-export-of-upstream lint | PASS | re-exports are existing local error identities, not upstream | none |
| F-16 | Folder-cardinality lint | PASS | no new top-level folders | none |
| F-17 | Abstract-derived co-location | PASS | quality:gate covers | none |
| F-18 | Sub-barrel lint | PASS | no new sub-barrels | none |
| F-19 | Scoped source gate runners | PASS | all package evidence from scoped wrappers, not raw root CLI | none |

## Runtime Gates

| Gate | Validation | Result | Evidence |
| ---- | ---------- | ------ | -------- |
| Focused live recovery + queue | `packages/kv/tests/redis-watch-recovery_test.ts` + `packages/kv/tests/redis-watch-failure_test.ts` with owned Docker daemon fixture | PASS | 10 passed / 0 failed, independently re-run (7 live server cases + 3 queue cases execute, none skip) |
| Full KV suite | `packages/kv/tests/` with owned external Redis plus Docker fixture | PASS | 251 passed / 0 failed / 2 ignored, independently re-run; the 2 ignores are the pre-existing CI-only unreachable-backend test and the old externally supplied-container integration test, no acceptance case skipped |
| Watch-point races | sibling-abort-after-end, final abort during paused reread + new watch + typed close, prefix restoration + typed close, queue idle/debounce/abort precedence, returned-lease cancellation without delaying sibling/fresh watch | PASS | covered by the 10 focused cases above, all green in the independent re-run; code paths spot-checked against `watch-subscriptions.ts` generation/lifetime fences and `watch-fixed-keys.ts` snapshot suppression |
| Resource hygiene | exact-identity container removal, unique labels, final label scan | PASS | owned container removed by immutable identity after label verification; post-run scan empty; foreign resources untouched |
| scaffold.runtime | N/A | PASS | approved in plan and PLAN-EVAL: no scaffold/Aspire/executable-launch output changes; direct actual-server tests are the acceptance oracle |

## Consumer Gates

| Consumer | Validation | Result | Evidence |
| -------- | ---------- | ------ | -------- |
| MCP prose | `check:mcp-export-corpus` | PASS | independently re-run, exit 0 |
| Symbol corpus + publish assets | `check:publish-assets` | PASS | independently re-run, exit 0 |
| CLI asset barrel | no scaffold output change | PASS | `git diff` shows no CLI scaffold changes; changed carriers are MCP prose, symbol corpus, publish assets only |

Note: the broader `check:agent-docs-prose` chain fails in unrelated `fresh-ui` docs generation (`--config` module resolution in the site tooling). It is pre-existing tooling drift outside this run's consumer surface; the three carriers this run actually changes are fresh per the two checks above. Not a blocking finding.

## Anti-Pattern Check

In-scope patterns only; others N/A.

| AP | Status | Evidence | Notes |
| -- | ------ | -------- | ----- |
| AP-1 | CLEAR | new coverage in focused test files, no `bridge_test.ts` growth; adapter shrinks | — |
| AP-4 | CLEAR | no new abstraction; fixed-key logic stays in existing adapter concern | — |
| AP-6 | CLEAR | no base class with lifecycle behavior added | — |
| AP-10 | CLEAR | callback errors normalized once into existing KV hierarchy; terminal failure delivered, not swallowed | — |
| AP-11 | CLEAR | no hidden globals; recovery state is instance-scoped | — |
| AP-12 | CLEAR | timing via `@std/async` retry/delay with AbortSignal; no direct timers in handlers | — |
| AP-13 | CLEAR | package logger used | — |
| AP-19 | CLEAR | no new `as unknown as`/`any` suppression introduced in changed files | — |
| AP-25 | CLEAR | `Deno.*`/side effects only in adapters/tests | — |

## Arch-Debt Delta

| Metric | Count | Evidence |
| ------ | ----- | -------- |
| New entries | 0 | no new doctrine violation |
| Resolved entries | 0 | open `bridge_test.ts` debt not touched |
| Deepened violations | 0 | F-1 improves (adapter shrinks); no Streams/saga-transport edits (`packages/plugin-sagas-core/src/transports/` untouched) |
| Unrecorded violations | 0 | — |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| low | Broader `check:agent-docs-prose` chain fails in unrelated `fresh-ui` site tooling | independent re-run output names the site generator, not `packages/kv` | none for this run; track site tooling separately if needed |

No high/medium findings. All six PLAN-EVAL watch-points verified in code and live tests: typed failure survives release paths; late generations cannot resurrect released channels; snapshot bookkeeping suppresses only racing entries without versionstamp ordering; prefix discovery rides the shared lifecycle with typed failure; owner-file sizes improve; retry budget is finite with minimum cumulative delay beyond 30 s plus existing jittered attempts.

## Acceptance

| Issue box | Result | Evidence |
| --------- | ------ | -------- |
| After subscriber end, next reconnect restores existing watches (real stop/restart test, red on main) | PASS | focused live case green in independent re-run; final IMPL proof comment linked in PR body mapping |
| After any reconnect, watch emits current value of keys changed during the gap | PASS | atomic subscriber-kill plus write-before-resubscribe case and restart-deletion reread green in independent re-run; mapping entry 2 |
| Unrecoverable watch rejects with typed KV error and does not hang | PASS | never-restart case rejects with public `KvConnectionError` within budget; prompt abort/close and fresh watch after failure green; mapping entry 3 |

Close-gate mapping: PR body carries `Closes #2639` plus one fenced `acceptance-evidence` block with 3 `box-index` entries pointing at the final IMPL proof comment. All three issue boxes are checked. Mapping manually verified; the dry-run mirror policy-skips only because `status:ready-merge` is (correctly) absent — that label must never be applied by the evaluator.

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| none | — | — | — |

## Verdict

| Field | Value |
| ----- | ----- |
| Verdict | `PASS` |
| Rationale | Approved scope complete; all required static/fitness/runtime/consumer gates pass or are validly N/A with evidence; no unrecorded debt; docs and run artifacts support resume; final DoD box and readiness remain intentionally open pending this verdict and required head/thread checks. |
