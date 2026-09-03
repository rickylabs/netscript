# Evaluation: SDK contribution conflict diagnostics (issue #1349 acceptance row 7)

## Metadata

| Field          | Value                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------- |
| Run ID         | `feat-sdk-contribution-conflict-diagnostics--1349`                                        |
| Target         | `packages/sdk` — contribution construction diagnostics (`672b67b61`, `365955dac`, `88065c3c3`) |
| Archetype      | `2 — Integration`                                                                         |
| Scope overlays | `none`                                                                                    |
| Evaluator      | Fresh native opposite-family session, Claude Code / Fable 5 (`claude-fable-5`) / medium, 2026-09-02 |

Baseline `634b83d647c37f60f24a57839333f16c7cc61f12`; evaluated HEAD
`88065c3c3` (`fix(sdk): preserve contribution rejection precedence`) on branch
`feat/sdk-contribution-conflict-diagnostics`, clean tree. The initial pass evaluated
`365955dac`; the `365955dac..88065c3c3` remediation delta was then independently reviewed line by
line and its narrow gates rerun (Remediation Verification below), so this verdict is current for
`88065c3c3`. No PR exists by recorded owner override (non-draft-with-metadata opening; `drift.md`
2026-09-02); the local commit list and run worklog are the pre-publication review record. This
session made no source/test/plan/worklog/drift edits; only this file was written.

## Process Verification

| Check                                  | Result | Evidence                                                                                                                                                                    |
| -------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | PASS   | `PLAN-EVAL: N/A` recorded in `worklog.md` Progress Log before the implementation row, with a concrete run-loop §4 justification (owner supplied audit, contract, cases, gates). |
| Design section exists in worklog       | PASS   | `worklog.md` `## Design` names public surface, vocabulary (claimant/owner/offender), ports (none), constants, one commit slice, deferred scope, contributor path.            |
| Commit slices match design plan        | PASS   | One designed slice landed as `672b67b61` (source+tests+run dir) plus evidence-carry `365955dac` (worklog/context-pack + generated corpus) plus eval-remediation `88065c3c3`; changed-file set stays inside the design's file list (`git diff --name-only 634b83d64..HEAD`). |
| Each slice has a passing gate          | PASS   | All named gates independently rerun by this session (tables below); every one green.                                                                                        |
| No speculative seams (unused files)    | PASS   | Sole new file `contribution-diagnostic-id.ts` (30 lines) is imported by `prepared-call.ts` and `desktop-rpc-client.ts` and packed by publish dry-run (grep count 1).         |
| Constants used for finite vocabularies | PASS   | `CONTRIBUTION_ID_PATTERN` moved verbatim into the policy module; `CONTRIBUTION_FIELDS`, `RESERVED_HEADERS`, `RESERVED_CONTEXT_KEYS`, 16-budget untouched in the diff.        |

## Contract Verification (issue #1349 acceptance row 7, audit gap)

Audit source read via
`git show chore/sdk-client-1349-acceptance-audit:.llm/runs/chore-sdk-client-1349-acceptance-audit--1349/audit.md`
(row 7 PARTIAL; shipped rows 1–6, 8–10 not re-audited per owner direction — and not edited by this
diff, which touches no audit artifact).

| Contract clause                                                             | Result | Evidence                                                                                                                                                                                              |
| --------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Additive optional `conflictingContributionId`; `contributionId` unchanged   | PASS   | `errors.ts` diff adds only the optional field to diagnostic/error/`toJSON()`; `deno doc --filter SdkClientContributionDiagnostic` shows both fields documented; existing 228-test suite green unmodified semantics. |
| Duplicate-id names both descriptors by the shared id                        | PASS   | `prepared-call.ts` sets both fields to `contribution.id`; test `duplicate-id diagnostics name both descriptors by their shared id` asserts `{contributionId:"test:duplicate", conflictingContributionId:"test:duplicate"}` incl. exact `toJSON()`. |
| Header-owner conflict oriented claimant vs earlier owner (+ headerName)     | PASS   | `headers` map now yields `ownerId` into `conflictingContributionId`; test asserts claimant `test:header-claimant`, owner `test:owner`, `headerName:"x-tenant"`.                                        |
| Context-owner conflict oriented claimant vs earlier owner                   | PASS   | `contexts` map yields `ownerId`; test asserts claimant `test:context-claimant`, owner `test:owner`, no headerName.                                                                                     |
| Unsupported version names offending id                                      | PASS   | `validateProtocol(value, contributionId?)` carries the non-throwing diagnostic id; test covers wrong family and wrong major, both `contributionId:"test:unsupported-version"`; baseline protocol-before-id precedence restored in `88065c3c3` with the doubly-invalid case pinned to `SDK_CONTRIBUTION_VERSION` carrying no fabricated id. |
| 17th contribution named on tuple limit                                      | PASS   | `fail('SDK_CONTRIBUTION_LIMIT', …, { contributionId: getSdkClientContributionDiagnosticId(value[16]) })`; test builds 17 descriptors and asserts `test:limit-16` (index 16 = 17th).                    |
| Every dependency/order field names offending id                             | PASS   | `hasExactFields` failure now carries the pre-extracted diagnostic id; test loops `dependsOn`, `before`, `after`, `order`, `priority`, each asserting `SDK_CONTRIBUTION_INVALID` with `test:<field>`.   |
| Desktop rejection names first supplied valid descriptor                     | PASS   | `desktop-rpc-client.ts` reads `contributions[0]` via own-property descriptor and `getSdkClientContributionDiagnosticId`; test asserts `test:desktop` with exact `toJSON()` and no other fields.        |
| Structured diagnostics and `toJSON()` exact                                 | PASS   | `assertConstructionDiagnostic` asserts all six fields individually plus `assertEquals(error.toJSON(), expected)` and `assertFalse('cause' in error)` for every case.                                   |
| Redaction: header values, credentials, context values, inputs excluded      | PASS   | Existing redaction tests (`preparation failures are deterministic and redact source, context, input, and headers`; `partition failures are redacted…`) pass unmodified; the id policy exposes only pattern-valid ≤128-char ids, rejects `@netscript/internal:` prefix, reads via `getOwnPropertyDescriptor` (no getter execution of foreign values beyond the id property). |
| Protected sibling scope untouched                                           | PASS   | `git diff --name-only 634b83d64..HEAD` (excluding run dir): 5 SDK files + 1 generated MCP corpus only; no docs/site, trace, locale, ports, budget, or reservation files.                               |
| Private client-link surfaces untouched                                      | PASS   | `stable-v1-adapter.ts`, `adapter-ports.ts`, `src/ports/**` absent from the diff; `client-contribution-private-surface_test.ts` green inside the 228-test rerun.                                        |

## Static Gates

All commands rerun independently by this evaluator session from the worktree root (or
`packages/sdk` where noted); raw exit codes observed directly.

| Gate             | Command or check                                                                  | Result | Evidence                                                              | Notes                                                            |
| ---------------- | --------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Narrow typecheck | `run-deno-check.ts --root packages/sdk --ext ts,tsx`                              | PASS   | exit 0; 102 files, 1 batch, 0 diagnostics                             | Matches worklog claim exactly.                                   |
| Slice typecheck  | same wrapper covers all changed SDK files                                         | PASS   | included in the 102-file selection                                    |                                                                  |
| Format           | `run-deno-fmt.ts --root packages/sdk --ext ts,tsx`                                | PASS   | exit 0; 102 processed, 0 findings                                     |                                                                  |
| Lint             | `run-deno-lint.ts --root packages/sdk --ext ts,tsx`                               | PASS   | exit 0; 102 processed, 0 findings; no new `deno-lint-ignore` in diff  |                                                                  |
| Doc lint         | `deno doc --lint` over the full 13-entry SDK export map (current)                 | PASS   | exit 1 with exactly 3 pre-existing `private-type-ref` errors (`QueryClient` ×2, `StreamsInstrumentation`), none referencing any symbol touched by this diff → new diagnostics = 0, matching the worklog A/B claim | Baseline side accepted via symbol-level disjointness.            |
| JSDoc examples   | `deno task docs:jsdoc-examples`                                                   | PASS   | exit 0; 2,040 files, 358 examples, 357 checked, `unboundName=116`     | Ceiling unchanged, matching worklog.                             |
| Publish dry-run  | `deno publish --dry-run --allow-dirty` in `packages/sdk`                          | PASS   | exit 0, `Success Dry run complete`; `contribution-diagnostic-id.ts` in packed list |                                                                  |
| Link/path check  | run artifacts reference real files/commits                                        | PASS   | all paths in `context-pack.md` Files Changed exist in the diff        |                                                                  |

## Fitness Gates

| Gate | Function                     | Result | Evidence                                                                                     | Violations |
| ---- | ---------------------------- | ------ | -------------------------------------------------------------------------------------------- | ---------- |
| F-1  | File-size lint               | PASS   | `wc -l`: `prepared-call.ts` 499 (< 500); `arch:check` SDK section `FAIL=0 WARN=1` with no F-1 row | 0          |
| F-2  | Helper-reinvention scan      | PASS   | policy module wraps the existing pattern; no duplicated validator                            | 0          |
| F-3  | Layering check               | PASS   | internal module consumed by internal validation + desktop application layer only             | 0          |
| F-4  | Inheritance audit            | N/A    | no class hierarchy change                                                                    |            |
| F-5  | Public surface audit         | PASS   | one documented optional property; `deno doc --filter` output above                           | 0          |
| F-6  | JSR publishability gate      | PASS   | clean-tree dry-run exit 0, no slow-type failure                                              | 0          |
| F-7  | Doc-score gate               | PASS   | doc lint delta 0; JSDoc examples gate exit 0                                                 | 0          |
| F-8  | Workspace `lib` override     | N/A    | untouched                                                                                    |            |
| F-9  | Permission declaration check | N/A    | no permission change                                                                         |            |
| F-10 | Test-shape audit             | PASS   | focused 19/19; full package 229/229 at `88065c3c3` (both wrapper-sourced, exit 0)            | 0          |
| F-11–F-18 | composite               | PASS   | `deno task quality:scan` exit 0 (0 findings, 7 pre-existing allowances); `deno task arch:check` exit 0; SDK section only pre-existing F-16/A9 notices | 0          |
| F-19 | Scoped source gate runners   | PASS   | structured wrappers used for every check/lint/fmt/test verdict above                         | 0          |

## Runtime Gates

| Gate                                | Validation                                             | Result | Evidence                                              |
| ----------------------------------- | ------------------------------------------------------ | ------ | ----------------------------------------------------- |
| Focused contribution construction   | `run-deno-test.ts -- --allow-all …validation_test.ts`  | PASS   | exit 0; 19 passed, 0 failed, 0 ignored (811 ms) at `88065c3c3` |
| Full SDK package                    | `run-deno-test.ts -- --allow-all packages/sdk`         | PASS   | exit 0; 229 passed, 0 failed, 0 ignored (8,948 ms) at `88065c3c3` |
| External runtime (Aspire/Docker/E2E)| owner boundary                                         | N/A    | prohibited by evaluator brief; not applicable to slice |

## Consumer Gates

| Consumer                        | Validation                                     | Result | Evidence                                                                                                        |
| ------------------------------- | ---------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| `@netscript/sdk/client` docs    | `deno doc --filter SdkClientContributionDiagnostic` | PASS   | new field rendered with JSDoc one-liner; no undocumented public member                                           |
| Carrier cascade idempotence     | `deno task gen:mcp-export-corpus` at HEAD      | PASS   | exit 0; regenerated SHA-256 `2899a7da…a9c9`, 35 packages / 272 subpaths / 7,803 symbols — byte-identical (clean `git status`), matching the committed corpus and worklog claim |
| Lock hygiene                    | `sha256sum deno.lock`                          | PASS   | `e52c167e48e78a3c822ee1e63d5874401e1a02d0c49c214e1cd2df189272c46d` — unchanged vs worklog baseline               |

## Remediation Verification (`365955dac..88065c3c3`)

The delta was reviewed line by line: it changes only `prepared-call.ts` (restores the baseline
exact-fields → protocol → id rejection order; `validateProtocol` now takes the optional
non-throwing diagnostic id so version diagnostics still name valid descriptors),
`client-contribution-validation_test.ts` (adds the doubly-invalid pin
`protocol rejection precedence is preserved when the id is also invalid` asserting
`SDK_CONTRIBUTION_VERSION` with no `contributionId`), and run artifacts (`drift.md` precedence
entry, `implement.md` `## SKILL` chapter, worklog/context-pack count updates). No public surface
(`errors.ts` untouched), generated file, or sibling scope is in the delta, so the initial pass's
doc-lint A/B, publish dry-run, JSDoc-examples, and carrier-cascade evidence remains valid.

Gates independently rerun by this session at `88065c3c3`:

| Gate                     | Result | Evidence                                                                 |
| ------------------------ | ------ | ------------------------------------------------------------------------ |
| Focused validation tests | PASS   | wrapper exit 0; 19 passed, 0 failed, 0 ignored                           |
| Full SDK package tests   | PASS   | wrapper exit 0; 229 passed, 0 failed, 0 ignored                          |
| Scoped check/lint/fmt    | PASS   | all exit 0; 102 files selected/processed, 0 diagnostics/findings each    |
| `deno task quality:scan` | PASS   | exit 0; `"findings":[]`, 7 pre-existing allowances                       |
| `deno task arch:check`   | PASS   | exit 0; SDK section `FAIL=0 WARN=1` (pre-existing F-16 only), no F-1     |
| File size                | PASS   | `prepared-call.ts` remains 499 lines                                     |
| Lock hygiene             | PASS   | `sha256sum deno.lock` = `e52c167e…72c46d`, unchanged                     |

Both initial-pass findings are resolved by `88065c3c3` and removed from the Findings table: the
precedence reorder is reverted, drift-logged, and pinned by test; `implement.md` carries its
`## SKILL` chapter.

## Anti-Pattern Check

| AP    | Status | Evidence                                                                            | Notes |
| ----- | ------ | ----------------------------------------------------------------------------------- | ----- |
| AP-1  | CLEAR  | 499-line file after policy extraction; drift-logged and fixed within the slice      |       |
| AP-3  | N/A    | no port change                                                                      |       |
| AP-5  | CLEAR  | `fail()` throws typed errors directly; no catch-and-rethrow added                   |       |
| AP-15 | CLEAR  | only pattern-validated ids and declared header names enter diagnostics; redaction suite green |       |
| AP-20 | CLEAR  | the single `as SdkClientContributionId` narrows only after full syntactic validation |       |
| AP-2/4/7/8/9/11/13/14/16/17/19/22/23/24/25 | N/A | outside the touched surface | |

## Arch-Debt Delta

| Metric                | Count | Evidence                                                                    |
| --------------------- | ----- | --------------------------------------------------------------------------- |
| New entries           | 0     | `arch-debt.md` untouched by diff; no new violation introduced               |
| Resolved entries      | 0     | —                                                                           |
| Deepened violations   | 0     | transient F-1 crossing was resolved in-slice (drift.md 3rd entry), not shipped |
| Unrecorded violations | 0     | quality:scan 0 findings; arch:check SDK FAIL=0                              |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| —        | none current — both initial-pass low findings (rejection-precedence reorder; missing `implement.md` SKILL chapter) were resolved by `88065c3c3` with the drift entry, precedence-pinning test, and SKILL chapter verified in the delta | Remediation Verification section above | none |

## Lessons for Promotion

| Lesson                                              | Pattern                                                                                     | Applies to | Confidence |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------- | ---------- |
| Extract id policy before enrichment pushes F-1      | Pre-validation diagnostic extraction belongs in a role-named policy module, not the validator | 2, 3       | medium     |

## Verdict

| Field     | Value                                                                                                                                                                                                                                                                                                          |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Verdict   | `PASS` — current for HEAD `88065c3c3`                                                                                                                                                                                                                                                                           |
| Rationale | Every acceptance-row-7 contract clause is implemented with exact structured/`toJSON()` assertions and correct claimant/owner orientation; all worklog gate claims were independently rerun and reproduced exactly at `88065c3c3` (19/19 focused and 229/229 package tests, scoped wrappers 102/0, quality/arch exit 0, 499-line file, unchanged lock; doc-lint delta 0, examples ceiling 116, clean dry-run, and byte-identical carrier corpus verified in the initial pass and untouched by the remediation delta); baseline rejection precedence is restored and pinned; both initial-pass findings are resolved and removed; scope stayed inside the designed file set with sibling and private-link surfaces untouched. |
