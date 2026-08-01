# Worklog: release task argument-separator tolerance

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1009-release-publish-arg-separator--codex` |
| Branch | `fix/1009-release-publish-arg-separator` |
| Archetype | `6 — CLI / Tooling` (contract/gate subset) |
| Scope overlays | `none` |

## Design

### Public Surface

- `deno task release:publish -- <tag> ...` — documented task entry-point contract.
- `deno task release:preflight -- --root <path>` — task-style separator contract.
- `parseArgs(argv)` in `github-release.ts` — exported parser already used by unit tests.

### Domain Vocabulary

- bare argument separator — the exact standalone token `--`; it is inert, unlike unknown flags.
- usage command — a `deno task release:publish ...` line in the source header comment.

### Ports

- Existing `Deno.args`, filesystem, process, and network edges only; no new port or abstraction.

### Constants

- No new finite domain constant is justified for the literal CLI separator.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 0 | Verified research, plan, and Design checkpoint | Separate PLAN-EVAL | Run artifacts only |
| 1 | Publish parser accepts task separator and usage docs drive parser tests | Focused `github-release_test.ts` plus static wrappers | `github-release.ts`, `github-release_test.ts`, run artifacts |
| 2 | Preflight parser accepts task separator; complete sweep and end-to-end evidence | Focused release tests, static wrappers, real task probe | `preflight-text-imports.ts`, `preflight-text-imports_test.ts`, run artifacts |

### Deferred Scope

- Common parser helper — two one-line skips do not justify an abstraction.
- Non-task-wired release scripts — no `deno task ... --` contract reaches them.
- Existing Archetype 6 package debt — no package source is touched.

### Contributor Path

For a release task usage change, edit the `Usage:` line and parser together; the source-derived
test enumerates the documented publish commands. For another task-wired entry point, add a semantic
subprocess test using the exact forwarded `--` argv.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-01 | 0 | research | Baseline and AC4 sweep independently confirmed; cause matches issue prompt. |
| 2026-08-01 | 0 | before probe | Exit 1 at `github-release.ts:349`; `Unknown argument: --`. |
| 2026-08-01 | 0 | design | Scope, semantic test strategy, and two implementation slices locked. |
| 2026-08-01 | 0 | PLAN-EVAL blocked | Local OpenRouter credentials are absent; the sole OpenHands Qwen dispatch has not landed a tracked `plan-eval.md`. Implementation remains stopped. |
| 2026-08-01 | 0 | PLAN-EVAL PASS | OpenHands Qwen posted the authoritative PASS; missing artifact transcribed with URL/timestamp/run provenance. |
| 2026-08-01 | 1 | implementation | Added the position-independent publish separator skip and non-vacuous source-derived Usage test. |
| 2026-08-01 | 1 | gate | `github-release_test.ts`: 15 passed, 0 failed; the existing unknown-argument/missing-value guard remains green. |
| 2026-08-01 | 1 | supervisor review | PASS: sibling pattern matched, final unknown-argument branch unchanged, and every matching Usage line is parsed after a non-zero count assertion. |
| 2026-08-01 | 1 | independent review | `review_codex_light` PASS: adversarial and mutation probes confirmed position-independent tolerance, strict unknown handling, and a non-vacuous doc/parser guard. |
| 2026-08-01 | 1 | reconcile | PR #1040 remains draft; issue scope, labels, milestone, and closing keyword still match with no rescope required. |
| 2026-08-01 | 2 | implementation | Added the position-independent preflight separator skip and a subprocess test of forwarded task argv. |
| 2026-08-01 | 2 | validation | Four-file check and release-directory fmt/lint wrappers passed; requested focused suite passed 38/38. |
| 2026-08-01 | 2 | after probe | Forwarded `--` parsed successfully; command reached the expected green-canary publication gate, with no `Unknown argument: --`. |
| 2026-08-01 | 2 | independent review | `review_codex_light` PASS: real task and adversarial argv probes preserved strict unknown/value errors; full release suite passed 65/65. |
| 2026-08-01 | 2 | exact check note | The literal `--root .` + four `--file` command selected 2,843 repo files and failed only on 10 unrelated existing `docs/site` Lume/isolated-declaration diagnostics; the actual four-file wrapper selection passed with zero findings. |
| 2026-08-01 | 2 | supervisor review | PASS: one-line sibling pattern, real entry-point test, no guard weakening, clean owned diff, and all owned gates green. |
| 2026-08-01 | 2 | reconcile | No new issue/PR feedback changes scope; PR remains draft and is ready for the IMPL-EVAL handoff after this slice is pushed. |
| 2026-08-01 | final | IMPL-EVAL | OpenHands Qwen PASS at `079e84360`; evaluator independently verified focused tests, format, the real probe, scope, and lock hygiene. |
| 2026-08-01 | final | close reconcile | Acceptance evidence mapped for issue #1009; final lifecycle move is ready-for-review with `status:ready-merge`. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Position-independent separator skip | Matches tolerant sibling entry points. | `cut.ts`, `canary.ts` |
| Preserve final unknown-argument branch | AC requires strictness for all other tokens. | Issue #1009 / existing test |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| None; reported cause matches baseline. | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Baseline task probe | `deno task release:publish -- v0.0.9 --message "probe" --dry-run` | FAIL (expected before fix) | Parser throws `Unknown argument: --`. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| CLI contract plan | NOT_RUN | PLAN-EVAL pending | No implementation before PASS. |
| Formal Plan-Gate | PASS | OpenHands Qwen PR verdict + transcribed `plan-eval.md` | Separate open-model session; evaluator-authored file supersedes if later pushed. |
| Publish parser focused test | PASS | `deno test --allow-all .llm/tools/release/github-release_test.ts` | 15 passed, 0 failed. |
| Scoped type check | PASS | Four explicit owned TypeScript roots | 4 selected, 0 failed batches, 0 diagnostics. |
| Literal root-plus-files check | FAIL (unrelated baseline) | 2,843 selected; 1/24 batches failed | Only 10 diagnostics in `docs/site/_config.ts` and `_plugins/ai-tooling.ts`; no owned release file finding. |
| Release fmt/lint | PASS | Repo-native scoped wrappers | 32 files; 0 failed batches/findings. |
| Focused release suite | PASS | Five requested test files | 38 passed, 0 failed. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Task entry-point probe | PASS | Exact required command reached `verifyGreenCanaryPair` | Exit 1 at the expected canary gate; parser did not reject `--`. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Release operators | PASS | Document-derived publish test plus real task probe | Documented argv and Deno task forwarding agree. |

## Handoff Notes

- PLAN-EVAL should verify the drift guard actually couples source `Usage:` lines to `parseArgs`.
- Confirm non-task-wired scripts remain explicitly outside scope.
- The evaluator-authored PLAN-EVAL artifact landed in `28f2a5aea` and superseded the temporary
  provenance-marked transcription.
- The evaluator-authored IMPL-EVAL artifact landed in `079e84360` with verdict PASS.
