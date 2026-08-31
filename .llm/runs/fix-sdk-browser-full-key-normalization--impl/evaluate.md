# Evaluation: #1824 browser full-key discovery normalization (draft PR #1831)

Allowed result values: `PASS`, `FAIL`, `N/A`, `PENDING_SCRIPT`, `DEBT_ACCEPTED`, `NOT_RUN`.
Anti-pattern status values: `CLEAR`, `VIOLATION`, `DEBT_ACCEPTED`, `N/A`.

## Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `fix-sdk-browser-full-key-normalization--impl` |
| Target         | Issue #1824 / draft PR #1831 @ `b05ae25b88de089781ab581e77b3f0567628f780` (baseline `dea449911`, current `origin/main` `0e93a6c05`) |
| Archetype      | `2 — Integration` |
| Scope overlays | `frontend` (browser environment-key contract only) |
| Evaluator      | Separate-session IMPL-EVAL, 2026-08-31 — session `38e40773-fe64-4eed-b737-d597e9df575e` |

### Evaluator route (requested vs observed)

| Field | Value |
| --- | --- |
| Requested route | Native Claude / Fable 5 / medium (recorded in `supervisor.md`) |
| Observed model | `z-ai/glm-5.3-flash` via OpenRouter on Claude Code |
| Observed effort | IMPL evaluator preset per `evaluator/protocol.md`; the exact effort parameter is not exposed to the session |
| Session id | `38e40773-fe64-4eed-b737-d597e9df575e` (launch transcript captured untracked as `impl-eval-openrouter.jsonl`) |

The observed model is the protocol-approved IMPL evaluator preset with a verified reasoning trace and
verified agentic turn (`evaluator/protocol.md` capability table), so gates were genuinely run in this
session. Evaluator separation holds: this session is distinct from generator Codex
`01a05611-ee74-7ff2-9234-8e00691a3523` and from all Opus slice-review sessions
(`f63a7890…`, `b888c0a7…`, `31eee6bd…`, `bca46f11…`). The requested-vs-observed route deviation is a
low-severity process observation (see Findings); the supervisor should mirror it in
`supervisor.md`/`drift.md`, which this session may not edit.

## Process Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Plan-Gate passed before implementation | PASS (justified `PLAN-EVAL: N/A`) | `worklog.md` progress log 2026-08-31T04:30:20Z records `PLAN-EVAL: N/A` before the first RED attempt (04:32) and before slice 1 commit (04:49). Locked as D4 in `plan.md`: #1824 supplies the mechanical contract, non-scope, regression guards, and gate set; no material decision remained open (open-decision sweep closed both items). Matches run-loop §4 skip criteria. |
| Design section exists in worklog | PASS | `worklog.md` `## Design` contains all seven required elements: public surface, domain vocabulary, ports, constants, commit slices, deferred scope, contributor path. |
| Commit slices match design plan | PASS | Two slices in Design order: S1 `e5dd8dbc5` (tests + RED + harness bootstrap; test file + run artifacts), S2 `b05ae25b8` (`browser-env.ts` + gate receipts + review artifacts). Both commits touch the run dir (slice completeness rule). |
| Each slice has a passing gate | PASS | S1: checked structured RED exit 1 with only intended normalization failures (`red-contract.json`; independently reproduced — see Static Gates). S2: focused GREEN 11/11, SDK 86/86, Aspire 91/91, scoped check/lint/fmt exit 0, root check, `quality:scan`, `arch:check` — all independently reproduced in this session. |
| No speculative seams (unused files) | PASS | Branch diff vs baseline touches exactly 2 product files plus run artifacts; every test case is reachable from the changed surface; no new folders/files. |
| Constants used for finite vocabularies | PASS | No new finite vocabulary introduced; the regex is the cited Aspire contract rule, not a value set (Design `## Constants` explains the omission). |
| Slice review gate (A1) honored | PASS | S1: three native Claude Opus 5 review cycles — `CHANGES_REQUESTED`, `CHANGES_REQUESTED`, `PASS` (`slice-1-review-cycle-1/2/3.md`), remediations recorded in `drift.md`. S2: one native Claude Opus 5 review, `PASS`, with independently rerun gates (`slice-2-review.md`). Sign-off commits are the supervisor's. |
| RED preceded GREEN | PASS | Independently verified in a detached temp worktree at `e5dd8dbc5` (tests present, source unfixed — grep confirms no normalization in `browser-env.ts` at that commit): focused test exit 1, 5 passed / 6 failed / 4 unique intended failures, identical to `red-contract.json`. Same test at HEAD: exit 0, 11/11. |
| Owner-required contracts covered | PASS | All six pinned in `packages/sdk/tests/discovery/env-ordering_test.ts`: hyphenated full keys (`sagas-api`, `workers-api`), unchanged valid names (`orders`), other invalid characters (`orders.api/v2`), unchanged shorthand (`VITE_SAGAS_API_URL`), unchanged server key (`services__sagas-api__http__0`), and cross-package SDK full == Aspire `full` for `sagas-api` and `workers.api/v2`. |
| Recorded gate results truthful | PASS | Every recorded result in `worklog.md` Gate Results was independently reproduced at the same exit code and count (see Static/Fitness/Consumer tables below). |
| Close-gate posture | PASS (n/a at this phase) | Issue #1824 body contains zero acceptance/gate checkboxes (grep count 0) and 0 comments; PR body carries `Closes #1824`; PR is draft with `status:impl` per the owner's explicit no-ready-for-review constraint, so the close-gate applies at ready-merge, not now. Nothing unchecked to block. |
| Release-gate class | N/A | Not a release cut; no scaffold output, plugin scaffolding, DB wiring, Aspire helper generation, or published CLI/publish shape change. |

## Static Gates

All commands below were run by this evaluator session in this worktree (exceptions noted).

| Gate | Command or check | Result | Evidence | Notes |
| --- | --- | --- | --- | --- |
| RED contract (independent) | `run-deno-test.ts` on focused test in detached temp worktree at `e5dd8dbc5` | FAIL (expected), exit 1 | 5 passed / 6 failed / 4 unique — byte-identical summary to `red-contract.json` | Temp worktree removed after verification. |
| Focused contract GREEN | `run-deno-test.ts -- --allow-all packages/sdk/tests/discovery/env-ordering_test.ts` | PASS, exit 0 | 11 passed / 0 failed | Matches `focused-contract-green.json`. |
| SDK package tests | `run-deno-test.ts --cwd packages/sdk -- --allow-all tests/` | PASS, exit 0 | 86 passed / 0 failed | Matches `sdk-tests.json`. |
| Aspire package tests | `run-deno-test.ts --cwd packages/aspire -- --allow-all tests/` | PASS, exit 0 | 91 passed / 0 failed | Matches `aspire-tests.json`. |
| Changed-file check | `run-deno-check.ts --file browser-env.ts --file env-ordering_test.ts` (default `--unstable-kv`) | PASS, exit 0 | 0 occurrences, `failedBatches: 0` | Matches `scoped-check.json`. |
| Changed-file lint | `run-deno-lint.ts --file` (same two files) | PASS, exit 0 | 0 occurrences | Matches `scoped-lint.json`. |
| Changed-file fmt | `run-deno-fmt.ts --file` (same two files) | PASS, exit 0 | 2 files, 0 findings | Matches `scoped-fmt.json`. |
| Repository check | `deno task check` | PASS, exit 0 | cached, inputs unchanged (identical tree previously checked green by generator and S2 reviewer) | Plan validation gate 6. |
| Doc lint | N/A | N/A | Plan scopes out; no export map, module doc, or metadata change | Behavior-only slice per `research.md` jsr-audit surface scan. |
| Publish dry-run | N/A | N/A | Plan scopes out; no export map or manifest change | Same rationale. |

Wrapper note: the first scoped check/lint/fmt attempts without `--allow-write` failed with
`NotCapable` at exit 1 (invocation error, no gate ran) — the same setup issue `worklog.md` records;
all three were rerun authoritatively with `--allow-write` and exited 0.

## Fitness Gates

| Gate | Function | Result | Evidence | Violations |
| --- | --- | --- | --- | --- |
| F-1 | File-size lint | PASS | `deno task arch:check` exit 0; changed source file is ~60 LOC | None |
| F-2 | Helper-reinvention scan | PASS | Manual review + `deno task quality:scan` exit 0. `normalizeViteIdentifierSegment` is private, pure, policy-bearing (encodes the Aspire browser-key identifier policy), cites `packages/aspire/src/application/build-vite-env-var-name.ts` as contract source, and is directly exercised by the focused and cross-package tests. D1/D2 justify privacy: no public surface is warranted. | None |
| F-3 | Layering check | PASS | `deno task arch:check` exit 0; no package manifest change; the only new cross-package import is test-only, SDK→Aspire public subpath `@netscript/aspire/application` (an existing export); production dependency directions unchanged | None |
| F-4 | Inheritance audit | PASS | `arch:check` exit 0; no class hierarchy added | None |
| F-5 | Public surface audit | PASS | Manual: `createBrowserServiceEnvKey` remains module-internal (not re-exported by `packages/sdk/src/discovery/mod.ts`; only consumer is `service-url.ts`); `@netscript/aspire/application` pre-exists in Aspire's export map; no export map diff | None |
| F-6 | JSR publishability gate | N/A | No public symbol, export map, or manifest change (research surface scan; branch diff confirms) | — |
| F-7 | Doc-score gate | N/A | No public doc surface change; new private helper carries the required JSDoc-adjacent comment naming the contract source | — |
| F-8 | Workspace `lib` override check | PASS | `arch:check` (runs `deps:check` incl. npm-catalog/zod scans) exit 0 | None |
| F-9 | Permission declaration check | PASS | No new permission or external-system requirement; no README change needed | None |
| F-10 | Test-shape audit | PASS | Focused tests use `Deno.test` + `t.step` with independent steps (so every agreement input executes); 11 results; structured test wrapper | None |
| F-11 | Forbidden-folder lint | PASS | `arch:check` exit 0 | None |
| F-12 | Naming-convention lint | PASS | `arch:check` exit 0 | None |
| F-13 | Saga and runtime invariants | N/A | Archetype 2 column: n/a | — |
| F-14 | Console-log lint | PASS | `arch:check` exit 0; no console logging added | None |
| F-15 | Re-export-of-upstream lint | PASS | `arch:check` exit 0; no re-export added | None |
| F-16 | Folder-cardinality lint | PASS | `arch:check` exit 0; no folder added | None |
| F-17 | Abstract-derived co-location lint | PASS | `arch:check` exit 0 | None |
| F-18 | Sub-barrel lint | PASS | `arch:check` exit 0; no sub-barrel added | None |
| F-19 | Scoped source gate runners | PASS | Structured scoped check/lint/fmt/test wrappers all exit 0 in this session | None |
| Code-quality scan | `deno task quality:scan` | PASS, exit 0 | 0 findings; 7 allowances all pre-existing (#1276, `packages/cli`/`plugins/workers` — none in this slice) | None |
| Archetype/doctrine | `deno task arch:check` | PASS, exit 0 | No `FAIL=` unit; warnings pre-existing and outside `packages/sdk`/`packages/aspire` | None |

## Runtime Gates

| Gate | Validation | Result | Evidence |
| --- | --- | --- | --- |
| Aspire/browser runtime | Real backend/browser exercise | N/A | Owner-constrained: runtime parked host-wide; no Aspire/Docker/Playwright/browser tooling started (per evaluation brief). The contract is pure string construction; semantic parity is proven by the cross-package agreement test against `buildViteEnvVarName` itself, and `RESOURCE_DEFAULTS.HttpEndpointName === 'http'` was verified so the agreement test's defaults align with Aspire's. |

## Consumer Gates

| Consumer | Validation | Result | Evidence |
| --- | --- | --- | --- |
| SDK ↔ Aspire browser full-key contract | Cross-package agreement test in SDK consuming Aspire's public application subpath | PASS, exit 0 | Focused test suite 11/11 includes `SDK browser full key agrees with Aspire output` for `sagas-api` and `workers.api/v2`; test-only import keeps both published packages dependency-free (verified: no manifest/lock change) |
| Existing browser lookup consumers (`getBrowserServiceUrlFromEnv`) | Behavior preserved via changed builder | PASS, exit 0 | SDK package suite 86/86; lookup falls back full→shorthand with normalized full keys now matching Aspire-injected env |

## Anti-Pattern Check

| AP | Status | Evidence | Notes |
| --- | --- | --- | --- |
| AP-1 | N/A | No god-module added | Outside scope |
| AP-2 | CLEAR | Helper encodes the NetScript/Aspire env-key policy, not a rename of a platform primitive; private + contract source cited (plan risk row resolved as planned) | F-2 manual justification on record |
| AP-3 | N/A | No port touched | Outside scope |
| AP-4 | N/A | No lease/lifecycle logic | Outside scope |
| AP-5 | N/A | No speculative versioning | Outside scope |
| AP-6 | N/A | Outside scope | — |
| AP-7 | N/A | Outside scope | — |
| AP-8 | N/A | No DI container | Outside scope |
| AP-9 | CLEAR | No configurable helper or cross-package abstraction; single-purpose private function mirroring Aspire's own private rule | Both packages keep identical tiny private rules, pinned together by the agreement test |
| AP-10 | N/A | Outside scope | — |
| AP-11 | CLEAR | Pure function; no module-load env reads, clients, or `Deno.openKv()` added | `getBrowserServiceUrl`'s pre-existing `import.meta.env` read is unchanged |
| AP-12 | N/A | Outside scope | — |
| AP-13 | N/A | Outside scope | — |
| AP-14 | N/A | Outside scope | — |
| AP-15 | N/A | Outside scope | — |
| AP-16 | N/A | Outside scope | — |
| AP-17 | N/A | No `interfaces/` folder | Outside scope |
| AP-18 | N/A | Outside scope | — |
| AP-19 | N/A | No README/permission change required | No new external-system requirement |
| AP-20 | N/A | Outside scope | — |
| AP-21 | N/A | Outside scope | — |
| AP-22 | N/A | No sub-`mod.ts` added | Outside scope |
| AP-23 | N/A | No adapter wiring touched | Outside scope |
| AP-24 | N/A | No engine switch added | Outside scope |
| AP-25 | CLEAR | `normalizeViteIdentifierSegment` is a pure string transform with no filesystem/process/network/clock side effect | Plan AP-25 target upheld |

## Arch-Debt Delta

| Metric | Count | Evidence |
| --- | --- | --- |
| New entries | 0 | `.llm/harness/debt/arch-debt.md` untouched; plan's debt table says none required — verified: no doctrine violation introduced that needs an entry |
| Resolved entries | 0 | No existing SDK/Aspire entry (F-6 carve-outs, CommunityToolkit Deno, deno-kv cache, etc.) is implicated by this slice |
| Deepened violations | 0 | `quality:scan` 0 findings; `arch:check` no `FAIL=` unit; no lint-ignore/cast added |
| Unrecorded violations | 0 | See Anti-Pattern Check — all in-scope APs CLEAR |

## Findings

| Severity | Finding | Evidence | Required action |
| --- | --- | --- | --- |
| low | Evaluator route deviation: requested native Claude Fable 5 medium; observed OpenRouter `z-ai/glm-5.3-flash` (protocol-approved IMPL evaluator preset with verified reasoning trace + agentic turn). Evaluator separation and capability invariants hold; verdict validity is unaffected. | `supervisor.md` route table vs Metadata above; `evaluator/protocol.md` capability table | None blocking. Supervisor mirrors requested/observed identity in `supervisor.md`/`drift.md` (this session may not edit those files). |
| low | Two run-dir files are untracked: `impl-eval-prompt.md` and `impl-eval-openrouter.jsonl` (this evaluation session's launch prompt and transcript). The run-dir tracking convention commits run artifacts per slice. | `git status --short` | Commit them with the evaluate.md close-out (Close phase), or delete the transcript if the supervisor prefers not to track session logs; either is acceptable. |
| low | `worklog.md` Gate Results records the pre-`--allow-write` wrapper invocation errors (exit 1) transparently and reran authoritatively — no action; noted as truthful-evidence confirmation. | `worklog.md` Static Gates row "Scoped wrapper setup attempt" | None. |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| --- | --- | --- | --- |
| (none — no repeated cross-run pattern observed in this single-slice run) | — | — | — |

## Verdict

| Field | Value |
| --- | --- |
| Verdict | `PASS` |
| Rationale | Approved scope is complete: all six owner-required contracts are pinned by tests, the SDK browser full-key resource segment now applies Aspire's exact `/[^a-zA-Z0-9_]/g` rule with the contract source cited, and shorthand/server/public-surface/dependency/lock surfaces are provably untouched. `PLAN-EVAL: N/A` was recorded and justified before implementation; the Design checkpoint exists and the two commit slices follow it; RED independently preceded GREEN (reproduced at `e5dd8dbc5` in a temp worktree, identical 4 unique failures). Every recorded gate result was independently reproduced at the same exit code and count, including `quality:scan` and `arch:check` (the two gates a scoped-wrapper run cannot substitute). No forbidden `any`, unsafe cast, or lint-ignore was introduced; no new, deepened, or unrecorded doctrine debt exists; docs and run artifacts are sufficient to resume. Runtime remains a valid owner-constrained N/A for a pure string contract. |
