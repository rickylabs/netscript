# Worklog: published JSDoc internal-codename cleanup

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `docs-1554-codenames--leaf` |
| Branch | `docs/1554-jsdoc-internal-codenames` |
| Archetype | `3 - Runtime / Behavior` |
| Scope overlays | `docs` |

## Design

### Public Surface

- Existing exports only: published symbol descriptions in `plugin-triggers-core` and
  `plugin-sagas-core` remain attached to identical declarations and signatures.
- Existing reference symbol tables follow the corrected `deno doc` summaries.
- The regression surface is a repository test, not a shipped API.

### Domain Vocabulary

- `TriggerRuntimeKind` / `RuntimeTriggerDefinition` — the three trigger kinds/definitions accepted
  by the current processor.
- `TriggerKnownKind` / `TriggerDefinition` / `TriggerPayload` — implemented plus reserved public
  trigger variants.
- `SagaDurabilityTier` / `TriggerDurabilityTier` — the real lowercase public values
  `'t1' | 't2' | 't3'`.
- Saga outbox/history/agent ports — reserved extension contracts described by mechanism, not
  planning tier.

### Ports

- No ports are added or changed. Existing processor/store/outbox/history/agent port prose is made
  consumer-facing.

### Constants

- No runtime constants change. The test owns only its forbidden JSDoc regexes and publish roots.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 1 | Bootstrap the harness run and open the draft PR | Run artifact completeness | Run dir only |
| 2 | Correct all published JSDoc and add the negative policy test | Focused test, census, scoped package gates | Two package trees, one fitness test, run artifacts |
| 3 | Align reference pages and record full gate evidence | `deno doc --json`, docs gates, repo tests | Two reference pages, run artifacts |

### Deferred Scope

- Executable Zod/template strings — prohibited by the comments-only boundary.
- Broader semantic classifier for every possible internal planning phrase — would inflate into its
  own tool; the measured codename class is locked here.
- MCP agent-docs regeneration — issue #1531 owns it.

### Contributor Path

Write public descriptions beside exported declarations, verify them through every package
entrypoint with `deno doc`, then keep hand-maintained reference summaries byte-for-byte aligned.
The policy test walks published-source JSDoc and reports exact file/line findings.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-08-12 | 1 | Bootstrap | Created `supervisor.md` first; read live #1554, doctrine, harness, tooling, PR, RTK, and JSR guidance. |
| 2026-08-12 | 1 | Census | Found 26 JSDoc tokens in 14 files across two packages; classified two executable-string exclusions. |
| 2026-08-12 | 2 | Source truth | Replaced all 26 JSDoc tokens with mechanism/public-value descriptions; post-edit JSDoc census is zero. |
| 2026-08-12 | 2 | Regression | Added a focused JSDoc-block test; 2 tests passed, including the generic-identifier exclusion fixture. |
| 2026-08-12 | 2 | Package gates | Both package wrapper trios passed. Full-export doc-lint commands exited 0 while reporting existing private-type-ref diagnostics (trigger 2, saga 9), all in untouched contract/telemetry/store files. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| PLAN-EVAL: N/A | Small bounded prose/test slice with owner-locked plan and gates; no material design decision remains. | `run-loop.md` §4; live #1554; owner brief |
| Comments are parsed, not raw-replaced | Preserves generic identifiers and executable literals. | Owner caution and D2 |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| Census expands dispatch's examples to 26 JSDoc tokens | minor | yes |
| Two executable-string matches cannot change under comments-only authority | significant | yes |

## Gate Results

### Slice 2 evidence

| Gate | Result | Evidence |
| ---- | ------ | -------- |
| Focused negative test | PASS | 2 passed / 0 failed |
| Post-edit JSDoc census | PASS | 0 findings (26/26 fixed) |
| Executable-diff boundary | PASS | `git diff --unified=0 -- packages/plugin-{sagas,triggers}-core` contains comment lines only |
| Trigger check/lint/fmt wrappers | PASS | 80 files selected; 0 failed batches/findings |
| Saga check/lint/fmt wrappers | PASS | 111 files selected; 0 failed batches/findings |
| Trigger full-export doc-lint | PASS with baseline diagnostics | Exit 0; 0 missing JSDoc; 2 private-type-ref in untouched `triggers.contract.ts` |
| Saga full-export doc-lint | PASS with baseline diagnostics | Exit 0; 0 missing JSDoc; 9 private-type-ref in untouched telemetry/contract/store files |

## Handoff Notes

- Evaluator should inspect the final comment census, executable-diff proof, and `deno doc`/reference
  comparison first.
