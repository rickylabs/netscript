# Worklog: issue #380 prompt assembly

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-380-prompt-assembly--codex` |
| Branch | `feat/380-prompt-assembly` |
| Archetype | `1 - Small Contract` |
| Scope overlays | none |

## Design

### Public Surface

- `composeSystemPrompt(sections): string` — deterministic pure composition.
- `PromptAssembler` — immutable object seam for callers that prefer an assembled value object.
- `PromptSection` — named content with numeric precedence.
- `DuplicatePromptSectionError` — typed duplicate-name failure with the conflicting name.

### Domain Vocabulary

- `PromptSection` — one opaque, app-owned prompt block plus ordering metadata.
- `precedence` — lower numbers render before higher numbers.

### Ports

- None; composition performs no IO and needs no replaceable collaborator.

### Constants

- `SYSTEM_PROMPT_SECTION_SEPARATOR` — `"\n\n"`, the documented stable rendering boundary.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Public prompt composition contract, semantics, loop-compatible test, docs, and run evidence | scoped static gates, unit tests, doc lint, publish dry-run | `packages/ai/src/contracts/prompt.ts`, `packages/ai/mod.ts`, `packages/ai/tests/prompt_test.ts`, `packages/ai/README.md`, run artifacts |

### Deferred Scope

- App-specific section names/precedence constants; content slices own them.
- Mutable registration/builder methods, async content, token accounting, and loop changes; issue #380 requires only composition.

### Contributor Path

Import `PromptSection` and `composeSystemPrompt` from `@netscript/ai`, contribute an opaque named section with an explicit precedence, and pass the returned string to `AgentLoopInput.system`.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-07-11 | 1 | Plan & Design | Base verified; issue and package seam inspected; owner-waived PLAN-EVAL recorded before implementation. |
| 2026-07-11 | 1 | Implement | Added the pure contract, root exports, README policy, and five focused tests. |
| 2026-07-11 | 1 | Reconcile | Issue #380 remains open; no PR was opened per owner instruction; implementation stayed within the locked scope. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Reject duplicate names | Makes composition mistakes explicit and typed instead of silently discarding content. | Issue #380 design note |
| Lower precedence first; stable ties | Deterministic and directly represents ordered layers. | Issue #380 contract |
| Double-LF separator | Human-readable prompt boundary with no content conventions imposed. | Plan |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| D1 PLAN-EVAL owner-waived | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root /home/codex/repos/ns-b8-380/packages/ai --ext ts,tsx` | PASS | 79 selected files, zero findings. |
| Check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root /home/codex/repos/ns-b8-380/packages/ai --ext ts,tsx` | PASS | 79 selected files, zero occurrences. |
| Lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root /home/codex/repos/ns-b8-380/packages/ai --ext ts,tsx` | PASS | 79 selected files, zero occurrences. |
| Unit tests | `deno test --allow-all /home/codex/repos/ns-b8-380/packages/ai/tests/` | PASS | Entire package suite green; focused prompt file has 5/5 passing. |
| Doc lint | `deno task doc:lint --root /home/codex/repos/ns-b8-380/packages/ai --pretty` | PASS | Full package export map clean. |
| Publish dry-run | `cd /home/codex/repos/ns-b8-380/packages/ai && deno publish --dry-run --allow-dirty` | PASS | Dry run complete; three existing MCP dynamic-import warnings remain outside slice scope. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Archetype 1 applicable static/public/test gates | PASS | scoped wrappers, doc lint, package tests, publish dry-run | No new forbidden folders, effects, dependencies, inheritance, or sub-barrels. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Runtime/Aspire | N/A | pure contract | No lifecycle or IO changed. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| E3 agent loop input | PASS | `PromptAssembler result fits the agent-loop system input unchanged` | Assembled string assigns directly to `AgentLoopInput.system`. |

## Handoff Notes

- Inspect `src/contracts/prompt.ts` first, then the semantic tests and README policy.
- IMPL-EVAL remains a separate-session supervisor responsibility; this implementation agent does not self-certify it.
