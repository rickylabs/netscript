# Worklog: #1732 background reference-name validation / source safety

## Run Metadata

| Field          | Value                                                      |
| -------------- | ---------------------------------------------------------- |
| Run ID         | `fix-aspire-reference-name-validation--1732-source-safety` |
| Branch         | `fix/aspire-reference-name-validation`                     |
| Archetype      | `6 — CLI / Tooling` (dominant surface)                     |
| Scope overlays | none                                                       |

## Design

Design is locked. After independently verifying the final PLAN-EVAL findings, the owner released the
plan gate with bounded F1/F2 corrections and authorized implementation; there is no cycle 3.

### Public Surface

- `parseAppSettings` configuration acceptance contract (observable public behavior).
- Generated `registerBackgroundProcessors` AppHost helper source.

### Domain Vocabulary

- Aspire resource name — a name accepted by Aspire 13.4.6's default resource policy.
- Reference kind — `ServiceReferences` or `PluginReferences`.
- Processor name — key under `BackgroundProcessors`.
- Generated binding — generator-local TypeScript identifier derived only from fixed prefixes and
  stable ordinals, never user text.

### Ports

- None planned.

### Rule ownership

- `ASPIRE_RESOURCE_NAME_PATTERN` and canonical rule text are planned in the package-private
  `packages/aspire/src/domain/aspire-resource-name.ts` module.
- `packages/aspire/constants.ts` and the package export map remain unchanged; the grammar is an
  internal parsing invariant, not a new JSR API.

### Commit Slices

Plan artifacts → owner-released PLAN-EVAL → visible RED test commit → source-safe literal and
binding emission → composed-level grammar lock → final static evidence → separately dispatched
IMPL-EVAL.

### Deferred Scope

- All runtime and neighboring issue scope listed in the brief remains deferred.

### Contributor Path

Focused semantic RED tests → `JSON.stringify` at every config-derived literal emission plus exact
ordinal-backed `bg_` / `ref_service_` / `ref_plugin_` bindings → exact private grammar at the
composed config boundary → final static gates.

## Progress Log

| Date       | Slice       | Step               | Notes                                                                                                                                                               |
| ---------- | ----------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-30 | research    | compatibility gate | Exact Aspire grammar rejects currently scaffoldable `a--b`, `a-`, and over-64 names; stopped before implementation.                                                 |
| 2026-08-30 | plan        | owner decision     | Locked source-safe emission first, then exact config grammar; approved observable fail-fast correction.                                                             |
| 2026-08-30 | plan        | published surface  | Moved the planned rule from exported `constants.ts` to a private `src/domain` module after correcting the JSR-surface analysis.                                     |
| 2026-08-30 | plan        | baseline           | Doc-lint exits 1 on existing private-type refs; JSR audit exits 1 on four existing module-tag failures plus one slow-types warning. Neither is reported green.      |
| 2026-08-30 | plan-eval   | cycle 1 `FAIL_FIX` | Evaluator proved D1 missed reserved/invalid/shadowing identifiers and non-name literal sites; evaluated head `fddcb833ba5e49466ac942112b41bd7712aa7c17`.            |
| 2026-08-30 | plan repair | F1/F2 resolution   | Locked user-text-free ordinal bindings; unconditional entrypoint/workdir escaping; conditional concurrency-key escaping; composed-only validation.                  |
| 2026-08-30 | plan-eval   | cycle 2 `FAIL_FIX` | Owner independently confirmed the flow-B fixture anchors and U+2028 comment seam, supplied mechanical satisfying conditions, and released the gate with no cycle 3. |
| 2026-08-30 | plan repair | gate release       | Pushed the bounded amendment at `f1d7d9d8f738b4907e1c770051ee1f59abaacc4a`; evaluator verdict files stayed untouched.                                               |
| 2026-08-30 | RED         | focused tests      | Structured two-file wrapper executed 99 results: 67 passed, 32 failed. Failures expose 24 missing config rejections plus six generator source/execution seams.      |
| 2026-08-30 | slice 2     | source safety      | Replaced background name-derived bindings/comments, stringified every planned literal site, and updated the flow-B fixture to derive its `bg_\d+` binding.          |
| 2026-08-30 | slice 2     | focused gates      | Generator tests PASS 59/59; check PASS 4 selected; lint PASS 4/4 processed; format PASS 4/4 processed. No E2E or runtime suite fired.                               |
| 2026-08-30 | slice 2     | RED transition     | Combined matrix is 74 pass / 25 fail: all generator seams are green; only 24 grammar rejection steps plus their parent summary remain red for slice 3.              |
| 2026-08-30 | slice 3     | grammar lock       | Added the exact private Aspire rule and background-object `superRefine`; contextual processor/service/plugin diagnostics now fail before generation.                |
| 2026-08-30 | slice 3     | focused gates      | Full focused tests PASS 143/143; check PASS 3 selected; lint PASS 3/3 processed; format PASS 3/3 processed.                                                         |
| 2026-08-30 | slice 3     | schema comparison  | `z.toJSONSchema(AppSettingsSchema)` stayed exactly 9,988 bytes with SHA-256 `87e3911b745954f91dba8c05456e36a92ff965cbab3f03b8350e24b09766e881` before and after.    |

## Decisions

| Decision          | Reason                          | Source                                                                                                                               |
| ----------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Source safety     | literals plus bindings first    | Documentation-derived grammar cannot be the only defense; config-derived literals are stringified and bindings contain no user text. |
| Identifier seam   | option (a), ordinal bindings    | Accept Aspire-valid `class`/`await`/`builder` without reserved identifiers, collisions, or generator-binding shadowing.              |
| Non-name literals | stringify all three sites       | Resolved `Entrypoint`/`Workdir` are always stringified; `ConcurrencyEnvVar` is stringified whenever emitted.                         |
| Schema placement  | composed custom validation      | Prevent validation from leaking into published JSON schema for unrelated sections.                                                   |
| Compatibility     | deliberate fail-fast correction | `a--b`, `a-`, and over-64 names are observably rejected earlier but are not runnable Aspire names today.                             |
| Published surface | private rule module             | Avoid a permanent JSR export for an internal parsing invariant; keep `./constants` unchanged.                                        |
| PLAN-EVAL         | released after cycle 2          | Owner independently verified final mechanical findings, fixed the plan contract, authorized RED, and declared no cycle 3.            |

## Gate Results

| Gate                                                          | Exit | Result                                                                                          |
| ------------------------------------------------------------- | ---: | ----------------------------------------------------------------------------------------------- |
| `deno task doc:lint --root packages/aspire --pretty` baseline |    1 | RED BASELINE — zero missing JSDoc/combined errors; existing private-type-reference findings     |
| `audit-jsr-package.ts --root packages/aspire --text` baseline |    1 | RED BASELINE — four existing F-JSR-2 failures, one F-JSR-7 warning; dry-run OK                  |
| Historical root-test decision                                 |    — | **SUPERSEDED 2026-08-30** — honestly NOT FIRED while the earlier PID-1 zombie condition applied |
| First wrapper invocation                                      |    1 | REFUSAL — type-check stopped before TAP selection; fixed test typing and did not count as RED   |
| Focused RED wrapper                                           |    1 | EXPECTED RED — 67 passed, 32 failed, 99 total, 32 unique failures                               |
| Slice-2 generator tests                                       |    0 | PASS — 59 passed, 0 failed                                                                      |
| Slice-2 scoped check                                          |    0 | PASS — four files selected, zero findings                                                       |
| Slice-2 scoped lint                                           |    0 | PASS — four selected and processed, zero findings                                               |
| Slice-2 scoped format                                         |    0 | PASS — four selected and processed, zero findings                                               |
| Slice-2 combined RED transition                               |    1 | EXPECTED RED — 74 passed, 25 failed; grammar lock is the only remaining failure class           |
| Slice-3 focused tests                                         |    0 | PASS — 143 passed, 0 failed                                                                     |
| Slice-3 scoped check                                          |    0 | PASS — three files selected, zero findings                                                      |
| Slice-3 scoped lint                                           |    0 | PASS — three selected and processed, zero findings                                              |
| Slice-3 scoped format                                         |    0 | PASS — three selected and processed, zero findings                                              |
| Slice-3 JSON-schema comparison                                |    0 | PASS — identical byte count and SHA-256 before/after composed validation                        |
| PLAN-EVAL cycle 1                                             |    — | `FAIL_FIX`; bounded plan repair authorized, implementation remains blocked                      |
| PLAN-EVAL cycle 2                                             |    — | `FAIL_FIX`; owner-verified mechanical corrections applied and gate released; no cycle 3         |

## Final Static Gate Table

The gates below are the final evidence set. The owner later fired the root structured test wrapper
in a detached throwaway worktree at evidence head `6605625ab50850da40e71b6f0a77bb704c675751`; no
runtime substitute is used.

| #  | Gate                        | Exit | Final evidence contract                                                                                                                                                                                                                                                                                                                           |
| -- | --------------------------- | ---: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Focused tests               |    0 | PASS — 143 passed, 0 failed across `config_test.ts` and both background-generator test files                                                                                                                                                                                                                                                      |
| 2  | Focused check               |    0 | PASS — all 7 changed TypeScript source/test/fixture files selected; zero findings                                                                                                                                                                                                                                                                 |
| 3  | Focused lint                |    0 | PASS — Aspire 3/3 plus CLI 4/4 selected and processed; zero findings                                                                                                                                                                                                                                                                              |
| 4  | Focused format              |    0 | PASS — Aspire 3/3 plus CLI 4/4 selected and processed; zero findings                                                                                                                                                                                                                                                                              |
| 5  | Root structured check       |    0 | PASS — 2,929 files, 25 batches, zero failed batches/findings                                                                                                                                                                                                                                                                                      |
| 6  | Root test                   |    1 | **FIRED** — 4,308 passed, 2 failed, 19 ignored, 4,329 total, 2 unique failures in 179,100 ms. Pre-existing `.llm/tools/agentic/claude/hybrid-launcher_test.ts:102` and `packages/fresh-ui/tests/registry/markdown-renderer.test.ts:142` failures reproduce at `main` `13878a80a50c55b9662099fed64555f2310ae4a3`; the leaf's own suites are green. |
| 7  | Root structured lint        |    0 | PASS — 2,044/2,044 files processed, no dropped coverage or findings                                                                                                                                                                                                                                                                               |
| 8  | Root structured format      |    0 | PASS — 2,044/2,044 files processed, zero findings                                                                                                                                                                                                                                                                                                 |
| 9  | Code-quality scan           |    0 | PASS — no findings or allowance failures; `allowCount` remains exactly 7                                                                                                                                                                                                                                                                          |
| 10 | Doctrine / architecture     |    0 | PASS — dependency and doctrine checks complete; existing warnings only, no failures                                                                                                                                                                                                                                                               |
| 11 | Asset barrel                |    0 | PASS — canonical generator produced no owned generated-asset diff                                                                                                                                                                                                                                                                                 |
| 12 | Aspire doc-lint comparison  |    1 | EXPECTED BASELINE — zero combined errors/missing JSDoc; only existing per-entrypoint private-type-reference exits                                                                                                                                                                                                                                 |
| 13 | Aspire JSR audit comparison |    1 | EXPECTED BASELINE — four existing F-JSR-2 failures plus one F-JSR-7 warning; dry-run OK; no new finding                                                                                                                                                                                                                                           |
| 14 | Generated-source semantics  |    0 | PASS — focused tests parse/execute every matrix row and preserve the raw key; JSON schema remains 9,988 bytes at SHA-256 `87e3911b745954f91dba8c05456e36a92ff965cbab3f03b8350e24b09766e881`                                                                                                                                                       |

### Root-test evidence correction — 2026-08-30

The earlier NOT-FIRED decision remains an auditable historical fact: at that time the owner directed
this lane not to run the root suite because the host carried roughly 7,700 unreapable PID-1-owned
zombies. That operating condition is now **superseded**. The current host reports `/proc/1/comm` as
`tini`, zero zombies (including zero grouped by parent PID), 113 total processes, and `ulimit -n` of
524,288.

The owner supplied a current root-wrapper run from a detached throwaway worktree at
`6605625ab50850da40e71b6f0a77bb704c675751` using `.llm/tools/run-deno-test.ts -- --allow-all`: exit
1 after 179,100 ms, with 4,308 passed, 2 failed, 19 ignored, 4,329 total results, and 2 unique
failures. `codex-follow_test` now passes. The two remaining failures are pre-existing baseline reds
outside this leaf's scope:

| Failure                                                                                                                     | Evidence-head result | `main` result                                                            |
| --------------------------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------ |
| `.llm/tools/agentic/claude/hybrid-launcher_test.ts:102` — `fixture did not publish its descendant pid`                      | FAIL                 | FAIL at `13878a80a50c55b9662099fed64555f2310ae4a3` (9 passed / 1 failed) |
| `packages/fresh-ui/tests/registry/markdown-renderer.test.ts:142` — Rollup native `failed to map segment from shared object` | FAIL                 | FAIL at `13878a80a50c55b9662099fed64555f2310ae4a3` (1 passed / 1 failed) |

The earlier record attributed the `hybrid-launcher_test` red to zombie exhaustion. That attribution
was wrong for this file: with the host fixed, the test still fails with a different message and now
fails identically at `main`. The old failure mode's cause is no longer decidable. The provable
current claim is narrower: both remaining root-suite failures reproduce at `main`, are not caused by
this leaf, and the leaf's own focused suites are green.

## Handoff Notes

- Slice 2 published head: `6e82aad1d4e0f4e14a5e4d6ed1395b6169505099` (copied from `git log`).
- Slice 3 published head: `0d25cce469a784596101d331445b176be34cdbd6` (copied from `git log`).
- The rule remains absent from `src/domain/mod.ts`, package barrels, export maps, and exported
  symbol types.
- Aspire grammar was **not executed against Aspire in this leaf**. The source/docs-derived rule is
  protected by load-bearing literal escaping plus user-text-free ordinal bindings in the
  implementation order.
- Plan-release head: `f1d7d9d8f738b4907e1c770051ee1f59abaacc4a` (copied from `git log`).
- Final pushed evidence head is the commit containing this table; its exact immutable SHA is copied
  from `git log` into the PR slice-4 comment and handoff because a Git commit cannot contain its own
  object ID.

## D-127 convergence — 2026-08-31

The coordinator's merge ruling supersedes the ordinal-binding portion of the earlier slice-2 design:
main's `safeIdentifier(name)` binding and `// --- ${name} ---` marker are retained, while #1747's
four `JSON.stringify(name)` literal sites remain. The Flow-B fixture now discovers either a
name-derived or `bg_N`-style JavaScript identifier, captures the formatted set anchor verbatim, and
injects only missing users/sagas references through that anchor. The earlier evaluator verdict is
not claimed as coverage for discarded direct-generator ordinal-binding semantics.

Final D-127 evidence:

- Live merge base: `6bb27e46ab1bd4b9534068b2a9eb58039ae287d1`, which follows the
  coordinator-supplied `8a925764276b25ef7cef484db273604f44557cef` by one unrelated docs commit.
- Focused Aspire, CLI-E2E, and CLI-generator check/lint/fmt wrappers: all exit 0 with every selected
  file processed and zero findings.
- Aspire config/name tests: 84 passed, 0 failed.
- Background generator tests: 54 passed, 0 failed.
- `deno task quality:gate`: exit 0, quality findings empty, doctrine `FAIL=0`.
- `deno task check`: exit 0, 2,971 files, 25 batches, zero failed batches/occurrences.
- Scaffold-only fixture proof: binding `workers`; captured set anchor
  `backgroundProcessors.set('workers', workers);`; configured block contains both users and
  sagas-api discovery keys.
- No Aspire, Docker, AppHost, runtime, or `e2e:cli` command ran. See
  `d-127-main-convergence.md` for the exact conflict resolution, intermediate refusals/failures,
  and reproduction JSON.

## D-165 urgent recovery — 2026-08-31

D-127's name-derived binding decision is superseded by empirical RED evidence. The implementation
now uses background-only ordinal bindings, JSON-stringifies every user-supplied emitted literal,
and retains the generic Flow-B binding/set-anchor discovery plus the users+sagas missing-reference
union. The 74 foreign run-artifact deletions were restored by clean rebases. See
`d-165-urgent-recovery.md` for the exact RED, repair, static fixture evidence, and gate table.

No runtime, Aspire, Docker, AppHost, evaluator dispatch, lifecycle-label change, or evaluator verdict
was produced by this session. The previous IMPL-EVAL is void for the new semantic head; fresh
supervisor-dispatched evaluation and hosted runtime evidence remain pending.
