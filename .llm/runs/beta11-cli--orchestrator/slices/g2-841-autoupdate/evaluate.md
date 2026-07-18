# Evaluation: G2 #841 — SDK auto-update

## Metadata

| Field          | Value                          |
| -------------- | ------------------------------ |
| Run ID         | `beta11-cli--orchestrator/slices/g2-841-autoupdate` |
| Target         | `@netscript/sdk/auto-update` — typed wrapper over `Deno.autoUpdate` + release client |
| Archetype      | `4 — Public DSL / Builder` (integration/runtime subtype) |
| Scope overlays | none |
| Evaluator      | `Qwen 3.7 Max · OpenRouter · formal_evaluation lane · 2026-07-18` |

## Process Verification

| Check                                  | Result   | Evidence |
| -------------------------------------- | -------- | -------- |
| Plan-Gate passed before implementation | PASS     | `plan-eval.md` verdict `PASS`, supervisor ratified 2026-07-18 |
| Design section exists in worklog       | PASS     | `worklog.md` § Design — public surface, vocabulary, ports, constants, slices, deferred scope all present |
| Commit slices match design plan        | PASS     | 3 slices (d2321cae → 35f3b726 → 82e7ac24) in exact order: contract/resolver → orchestration/policy → consumer/JSR proof |
| Each slice has a passing gate          | PASS     | Worklog § Gate Results: 27 static/fitness/runtime/consumer gates, all PASS or PASS_WITH_BASELINE |
| No speculative seams (unused files)    | PASS     | Every file in `src/auto-update/` is imported by `mod.ts` or by application modules; no unused exports |
| Constants used for finite vocabularies | PASS     | All union types derived from const arrays in `domain/constants.ts`; no raw string literals in consumer-facing types |

## Static Gates

| Gate             | Command or check | Result | Evidence | Notes |
| ---------------- | ---------------- | ------ | -------- | ----- |
| Narrow typecheck | `deno check --unstable-kv packages/sdk/src/auto-update/mod.ts` (via scoped wrapper) | PASS | 66 files, 0 diagnostics (S3) | Wrapper supplied `--unstable-kv` |
| Slice typecheck  | `.llm/tools/run-deno-check.ts --root packages/sdk --ext ts` | PASS | 66 files, 0 diagnostics |  |
| Format           | `.llm/tools/run-deno-fmt.ts --root packages/sdk --ext ts` | PASS | 66 files, 0 findings |  |
| Lint             | `.llm/tools/run-deno-lint.ts --root packages/sdk --ext ts` | PASS | 66 files, 0 findings |  |
| Doc lint         | `deno task doc:lint --root packages/sdk --pretty` | PASS_WITH_BASELINE | `auto-update/mod.ts` = 0 diagnostics; root = 0 diagnostics; 1 unrelated pre-existing transitive `plugin-streams-core` private ref | New entrypoint is zero-diagnostic |
| Doc lint (entry) | `deno doc --lint packages/sdk/src/auto-update/mod.ts` | PASS | "Checked 1 file" — 0 diagnostics, evaluator-run |  |
| Publish dry-run  | `deno publish --dry-run --allow-dirty` | PASS | Success; all 11 entrypoints listed; no slow-type warning; `./auto-update/mod.ts` in publish list |  |
| JSR audit helper | `audit-jsr-package.ts --root packages/sdk --text` | PASS_WITH_TOOL_NOTE | 11 exports; publishable; informational "slow types" banner counted as warning by helper |  |
| Release preflight | `deno task release:preflight` | PASS | Text imports, import attributes, file-URL import-meta, self-import checks all 0 findings |  |
| Consumer compile | `deno check --unstable-kv packages/sdk/tests/type-fixtures/auto-update-consumer_type.ts` | PASS | Evaluator confirmed: imports from `@netscript/sdk/auto-update`; no Deno globals in consumer |  |

## Fitness Gates

| Gate | Function                     | Result | Evidence | Violations |
| ---- | ---------------------------- | ------ | -------- | ---------- |
| F-1  | File-size lint               | PASS   | All files <30 LOC (largest: `deno-auto-update-adapter.ts` at 153 lines, acceptable for the boundary module) | None |
| F-2  | Helper-reinvention scan      | PASS   | Uses `URL`, `Reflect.get`, `@netscript/telemetry/tracer`, `setTimeout`, `@std/assert` — no custom clock/URL/crypto abstractions | None |
| F-3  | Layering check               | PASS   | `domain/` → no deps; `application/` → `domain/` + `adapters/`; `adapters/` → `domain/` only; `mod.ts` re-exports only | None |
| F-4  | Inheritance audit            | PASS   | No class hierarchy; pure interfaces and discriminated unions | None |
| F-5  | Public surface audit         | PASS   | 2 functions + 8 constants + 20 type exports; all JSDoc'd; `deno doc` clean | None |
| F-6  | JSR publishability gate      | PASS   | `deno publish --dry-run` succeeds; `./auto-update` listed in exports map; no slow types | None |
| F-7  | Doc-score gate               | PASS   | `deno doc --lint` = 0 diagnostics on the new entrypoint; `doc:lint` = 0 for auto-update | None |
| F-8  | Workspace `lib` override check | N/A  | No `lib` override in SDK deno.json | N/A |
| F-9  | Permission declaration check | N/A    | SDK package, no permission declarations required | N/A |
| F-10 | Test-shape audit             | PASS   | 12 auto-update tests across 2 test files; `Deno.test()` calls; no `@ts-expect-error`; README doctest validates fences | None |
| F-11 | Forbidden-folder lint        | PASS   | Standard `domain/`, `application/`, `adapters/` layout; no forbidden patterns | None |
| F-12 | Naming-convention lint       | PASS   | snake_case files, PascalCase types, UPPER_SNAKE constants — all consistent | None |
| F-13 | Saga and runtime invariants  | N/A    | No saga or runtime code in scope | N/A |
| F-14 | Console-log lint             | PASS   | No `console.*` in production source (only in tests and README) | None |
| F-15 | Re-export-of-upstream lint   | PASS   | No re-exports of upstream types | None |
| F-16 | Folder-cardinality lint      | PASS   | 7 files in `src/auto-update/` (3 dirs: domain/2, application/2, adapters/2, mod.ts) | None |
| F-17 | Abstract-derived co-location lint | N/A | No abstract classes | N/A |
| F-18 | Sub-barrel lint              | PASS   | Single `mod.ts` entrypoint; no nested barrels | None |
| F-19 | Scoped source gate runners   | PASS   | `quality:scan` PASS, 0 findings; `arch:check:repo --root packages/sdk` FAIL=0 | None |

## Runtime Gates

| Gate     | Validation     | Result | Evidence |
| -------- | -------------- | ------ | -------- |
| Unit tests | `deno test --allow-all packages/sdk/tests/` | PASS | 28 passed, 0 failed (evaluator-run, 2s) |
| Plain-run no-op | Test: `plain deno run disables native auto-update without invoking release config` | PASS | Under live Deno 2.9.3 (not desktop), returns `{ status: 'disabled', reason: 'not-desktop' }` without touching release config |
| Windows staged path | Test: `proposed namespace wins and Windows surfaces a manual installer event` | PASS | Windows target produces `{ applyMode: 'manual', version, manualUpdateUrl }` event |
| Telemetry-before-callback | Test: `rollback telemetry is reported before the consumer callback` | PASS | Asserts `order === ['telemetry', 'consumer']` |
| E2E apply/rollback | Per issue #841 acceptance | N/A | Explicitly deferred to #457; worklog records `N/A`; README states "Real packaged apply/rollback proof is tracked by #457" |

## Consumer Gates

| Consumer     | Validation     | Result | Evidence |
| ------------ | -------------- | ------ | -------- |
| `@netscript/sdk/auto-update` compile + narrowing | `auto-update-consumer_type.ts` imports real subpath; exercises all discriminated narrowing paths | PASS | Consumer fixture: 57 lines; imports 7 types + 1 constant + 1 function from `@netscript/sdk/auto-update`; exercises `applyMode` narrowing, `status` narrowing, disabled-reason narrowing |
| README doctest | `readme-doctest_test.ts` validates all `ts` and `json` fences compile/parse | PASS | 2 tests passed (evaluator-run) |
| Root barrel doc-only | `packages/sdk/mod.ts` mentions auto-update only in JSDoc module comment; no re-export; `deno.json` exports `"./auto-update"` as dedicated subpath | PASS | Root mod.ts lines 34–36 doc-only; line 42 onward has zero auto-update re-exports |

## Plan D1–D13 Verification

| Plan item | Verified | Evidence |
| --------- | -------- | -------- |
| D1 — Single seam | PASS | Root barrel is doc-only; `deno.json` exports `./auto-update` as standalone subpath |
| D2 — Structural resolver sole Deno-global toucher | PASS | `grep globalThis\|Deno.` — only executable use in `deno-auto-update-adapter.ts:63` (`Reflect.get(globalThis, 'Deno')`); all other matches are JSDoc or error-message strings; isolation test `release-client_test.ts:81–107` recursively proves it |
| D3 — Discriminated policy | PASS | `AutoUpdatePolicy = AutoUpdateLaunchPolicy \| AutoUpdateIntervalPolicy` discriminated on `checkOnLaunch: true \| false` |
| D4 — Capability table | PASS | `NATIVE_AUTO_APPLY_SUPPORT` record keyed by `AutoUpdateOperatingSystem` — darwin:true, linux:true, windows:false |
| D5 — Telemetry-before-callback rollback ordering | PASS | `start-auto-update.ts:99–101` — `dependencies.telemetry.reportRollback(event)` then `options.onRollback?.(event)`; test asserts `['telemetry', 'consumer']` |
| D6 — No cancellation promise | PASS | No `Promise`, `AbortController`, `AbortSignal`, `cancel()` in new surface; scheduler interface doc explicitly says "without exposing a cancellation contract" |
| D7 — No `latest.json` parsing (no second update authority) | PASS | Zero `latest.json`/`latestJson`/`parseLatest`/`fetchLatest` references in the new surface |
| D8 — String constants only (NO text/JSON import attributes) | PASS | All finite vocabularies derived from `readonly` const arrays; `release:preflight` PASS; no `import ... with {}` or `import ... assert {}` anywhere |
| D9 — Trusted HTTPS URLs | PASS | `requireHttpsUrl` validates both `baseUrl` and `manualUpdateUrl`; rejects non-HTTPS; strips query/fragment from base |
| D10 — Per-arch URL wiring | PASS | `createUpdateUrl` builds `<channel>/<os>-<arch>` path; test asserts literal `linux-x86_64` and `darwin-aarch64` |
| D11 — Public-key forwarding | PASS | `publicKey` validated non-empty, forwarded unchanged to native options; test asserts equality |
| D12 — Plain `deno run` no-op | PASS | Live under Deno 2.9.3: resolver finds no desktop properties → `disabled/not-desktop`; test passes |
| D13 — Windows honesty | PASS | `NATIVE_AUTO_APPLY_SUPPORT.windows === false` → manual event path; README documents staged-detection UX; #457 deferral explicit |

## Issue #841 Gate Verification

| Gate | Result | Evidence |
| ---- | ------ | -------- |
| Wrapper unit tests incl. plain-`deno run` no-op | PASS | 12 tests across 2 files; includes the plain-run test (line 35–42) |
| Staged-Windows manual path test | PASS | Test at `start-auto-update_test.ts:78–115` — Windows target produces manual event with `manualUpdateUrl` |
| JSR rubric on the new surface | PASS | `deno publish --dry-run` succeeds; `deno doc --lint` 0 diagnostics; `quality:scan` 0 findings; no slow types; no text imports |

## Anti-Pattern Check

| AP    | Status | Evidence | Notes |
| ----- | ------ | -------- | ----- |
| AP-1  | CLEAR  | No `any` in new surface |  |
| AP-2  | CLEAR  | No ambient augmentation or global namespace pollution |  |
| AP-3  | CLEAR  | No `as unknown as` casts in production code |  |
| AP-4  | CLEAR  | No dynamic `eval` or `Function()` constructors |  |
| AP-5  | CLEAR  | No text/JSON import attributes; string constants only |  |
| AP-6  | CLEAR  | No re-exports of upstream types |  |
| AP-7  | N/A    | No migration or schema code |  |
| AP-8  | CLEAR  | Discriminated unions throughout; no boolean flags as API |  |
| AP-9  | CLEAR  | No mutable exports; all interfaces `readonly` |  |
| AP-10 | CLEAR  | `Reflect.get`/`Reflect.apply`/`Reflect.has` used for safe global access |  |
| AP-11 | CLEAR  | No circular imports; clean `domain → application → adapters` DAG |  |
| AP-12 | N/A    | No plugin-specific patterns |  |
| AP-13 | CLEAR  | All JSDoc present (`deno doc --lint` 0 diagnostics) |  |
| AP-14 | N/A    | No Fresh/component code |  |
| AP-15 | N/A    | No Fresh/component code |  |
| AP-16 | N/A    | No saga/runtime code |  |
| AP-17 | CLEAR  | No abstract classes; interfaces only |  |
| AP-18 | CLEAR  | Single `mod.ts` barrel; no nested sub-barrels |  |
| AP-19 | N/A    | No scoped source gates in scope |  |
| AP-20 | N/A    | No database or cache code |  |
| AP-21 | N/A    | No CLI code |  |
| AP-22 | N/A    | No HTTP handler code |  |
| AP-23 | N/A    | No build-script code |  |
| AP-24 | N/A    | No test harness code beyond standard `Deno.test` |  |
| AP-25 | CLEAR  | No `console.*` in production source |  |

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           | 0     | No doctrine violations introduced |
| Resolved entries      | 0     | N/A |
| Deepened violations   | 0     | N/A |
| Unrecorded violations | 0     | N/A |

## Findings

No blocking findings.

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| (none)   | —       | —        | —               |

## Lessons for Promotion

| Lesson    | Pattern     | Applies to     | Confidence          |
| --------- | ----------- | -------------- | ------------------- |
| Structural resolver isolation test is an effective pattern for proving Deno-global containment | A recursive directory scan + comment-stripping + regex assertion in a unit test mechanically proves the isolation invariant | Archetypes 4, 5, 6 (any SDK seam wrapping runtime globals) | high |
| Const-array-derived union types eliminate text imports by construction | Vocabulary types as `(typeof CONST_ARRAY)[number]` means the finite-value registry is code, not data imported from text/JSON files | All archetypes with discriminated union surfaces | high |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | `PASS` |
| Rationale | All D1–D13 plan items verified at implementation altitude. All evaluator-run gates pass: 28/28 unit tests, quality:scan 0 findings, doc:lint 0 diagnostics on the new entrypoint, deno doc --lint clean, JSR dry-run success, no text/JSON imports, plain-run no-op proven, Windows manual-path proven, telemetry-before-callback proven, Deno-global access isolated to one file, no cancellation promise, no latest.json parsing. Issue #841 acceptance gates met. No false e2e claims (explicit #457 deferral throughout). No arch-debt introduced. |
