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

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Task entry-point probe | NOT_RUN | After implementation | Later external failure permitted. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Release operators | NOT_RUN | Document-derived tests | Pending implementation. |

## Handoff Notes

- PLAN-EVAL should verify the drift guard actually couples source `Usage:` lines to `parseArgs`.
- Confirm non-task-wired scripts remain explicitly outside scope.
- The evaluator verdict is authoritative from the linked PR comment; the missing artifact is a
  provenance-marked transcription, not supervisor judgment.
