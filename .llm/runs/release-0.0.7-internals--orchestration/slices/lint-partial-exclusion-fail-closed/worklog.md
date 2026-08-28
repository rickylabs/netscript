# Worklog: #1709 lint partial-exclusion fail-closed

## Run Metadata

| Field          | Value                                                                              |
| -------------- | ---------------------------------------------------------------------------------- |
| Run ID         | `release-0.0.7-internals--orchestration/slices/lint-partial-exclusion-fail-closed` |
| Branch         | `fix/lint-partial-exclusion-fail-closed`                                           |
| Archetype      | `6-cli-tooling`                                                                    |
| Scope overlays | none                                                                               |
| Authorization  | Research + plan only                                                               |

## Design

Recorded before any implementation file is changed.

### Public Surface

- No TypeScript export, CLI command, help text, or package entrypoint changes.
- Shipped behavior surface: embedded `run-deno-lint.ts` consumer tool and
  `EMBEDDED_AGENT_TOOL_BUNDLE_HASH` inside the generated CLI asset.
- Machine contract: structured lint JSON gains processed-coverage/refusal data while retaining
  existing diagnostic groups and failures.

### Domain Vocabulary

- `selected file` — a normalized file path the wrapper intentionally handed to Deno.
- `processed file` — a selected path counted by Deno's `Checked N file(s)` summary.
- `dropped file` — a selected path whose same-config explicit probe returns
  `No target files found.`.
- `coverage failure` — typed refusal metadata for partial exclusion or unverifiable/inconsistent
  selected-vs-processed evidence.
- `coverage refusal` — exit 2; it takes precedence over an ordinary lint-finding exit 1.

### Ports / seams

- Existing injectable `BatchRunner` remains the Deno process seam and is reused for mismatch probes.
  No new architecture port or adapter is justified.
- Deno CLI output is the external protocol. The parser is fail-closed at the boundary.

### Constants

- Existing `NO_TARGET_FILES_MESSAGE` remains the all-excluded/dropped marker.
- Planned anchored checked-count pattern: `^Checked (\d+) files?$` after ANSI stripping.
- Planned finite refusal causes: `partial-exclusion`, `coverage-summary-missing`,
  `coverage-summary-invalid`, and `coverage-probe-inconsistent` (exact internal names may be refined
  without changing semantics).
- Exit codes: 0 complete+clean, 1 ordinary lint findings/crash semantics as already defined, 2
  wrapper coverage/selection refusal.

### Archetype-6 checkpoint applicability

- Five spine abstracts, layer-2 abstracts, vertical feature catalog, registries, ports, command
  names, composition declarativity, and contributor flows for new CLI features are unchanged and
  therefore N/A to this bounded tool/asset leaf.
- Generated output impact is limited to one canonical embedded-tool constant.
- Permission requirements do not change (`read` + `run` remain sufficient for the consumer tool).
- Semantic test strategy uses temporary projects and exact JSON/exit assertions, not generated
  barrel snapshots.

### Commit Slices

| #  | Slice                                                                                                               | Gate                                                                               | Files                                                             |
| -- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| S1 | Restore four healthy doctor files to root lint selection before guard tightening.                                   | direct structured root lint proof `2041/36/0`, exit 0                              | `deno.json`                                                       |
| S2 | Add selected-vs-processed proof, exact dropped-file refusal JSON, batch-size invariant, and must-not-regress tests. | focused structured test/check plus mixed 1/2/200 controls                          | `.llm/tools/run-deno-lint.ts`, `.llm/tools/run-deno-lint_test.ts` |
| S3 | Regenerate and prove the shipped consumer-tool asset and hash idempotently.                                         | generator twice, name-only delta, `check:assets-barrel`, member dry-run, CLI audit | `packages/cli/src/kernel/assets/agent-tools.generated.ts`         |

Every later implementation commit must also update this worklog/context pack, but those harness
updates do not widen the frozen product file surface.

### Deferred Scope

- Analogous `run-deno-fmt.ts` defect — proven in research; explicit coordinator rescope required.
- Existing CLI audit/doctrine warnings — baseline, unrelated.
- Runtime/release/E2E surfaces — not applicable by frozen contract.

### Contributor Path

A future contributor changing lint coverage semantics starts at `runLint` and its focused test, uses
the existing `BatchRunner` seam, validates normalized structured JSON with a temporary project, then
runs canonical asset regeneration and CLI publishability gates. They do not edit the generated asset
directly.

## Progress Log

| Time (Europe/Zurich) | Phase     | Step              | Notes                                                                                               |
| -------------------- | --------- | ----------------- | --------------------------------------------------------------------------------------------------- |
| 2026-08-28           | bootstrap | identity/scope    | Exact base, branch, no-upstream rule, frozen contract, and author-only boundary verified.           |
| 2026-08-28           | research  | lint re-baseline  | Mixed exit 0 vs batch-size-1 exit 2 reproduced; root counts `2037/35 → 2041/36`, both green.        |
| 2026-08-28           | research  | fmt audit         | Analogous mixed-batch false green reproduced; recorded as significant rescope finding, no mutation. |
| 2026-08-28           | research  | JSR baseline      | CLI audit exit 0/dry-run OK with 19 existing WARN findings; baseline retained honestly.             |
| 2026-08-28           | plan      | design checkpoint | Signal, JSON/refusal contract, slices, risks, gates, deferrals, and PLAN-EVAL stop locked.          |

## Decisions

| Decision                                 | Reason                                                                               | Source                              |
| ---------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------- |
| Fail closed on any dropped selected path | Green must prove actual coverage                                                     | coordinator decision / issue #1709  |
| Parse `Checked N`, probe only mismatch   | Deno count is authoritative; probes recover identities without duplicate diagnostics | re-baseline / plan D3-D4            |
| S1 doctor correction before S2 guard     | Accepted sequencing and clean +4 proof                                               | frozen contract / executed baseline |
| Do not touch fmt                         | Defect is outside exact four-path envelope                                           | brief / drift entry                 |
| PLAN-EVAL required and pending           | Separate adversarial judgement needed; no self-evaluation                            | harness plan gate                   |

## Drift

| Drift                                                                                     | Severity    | Logged in drift.md |
| ----------------------------------------------------------------------------------------- | ----------- | ------------------ |
| Mandatory audit proves `run-deno-fmt.ts` has the analogous partial-exclusion false green. | significant | yes                |

## Gate Results (planning phase only)

| Check                        | Command / evidence                          | Result                      | Notes                                                         |
| ---------------------------- | ------------------------------------------- | --------------------------- | ------------------------------------------------------------- |
| Exact base/branch            | raw git identity                            | PASS                        | `cf648f1ff`; correct branch; no upstream                      |
| Current mixed lint           | two explicit files, default vs batch size 1 | RED reproduced              | exit 0 vs exit 2; planned test must turn the default case red |
| Root doctor coverage         | direct wrapper commands                     | PASS baseline proof         | `2037/35/0` and `2041/36/0`, both exit 0                      |
| Mandatory fmt audit          | temporary project mixed/split controls      | DEFECT / RESCOPE            | exit 0 vs exit 2; no fmt mutation authorized                  |
| CLI JSR baseline             | per-member audit `--text`                   | PASS with baseline warnings | process exit 0, dry-run OK, 19 existing WARN findings         |
| Product/tool source mutation | raw git status                              | PASS                        | none; only leaf harness directory is untracked/changed        |
| PLAN-EVAL                    | separate Tier-A session                     | NOT_RUN / REQUIRED          | supervisor's next action on exact plan head                   |

Implementation gates are intentionally NOT_RUN. A planning repro is evidence for the plan, not an
implementation verdict.

## Handoff Notes

- Evaluator should challenge the `Checked N` parser/probe reconciliation, coverage-exit precedence,
  diagnostic single-sourcing, and batch-size invariant first.
- Confirm S1 is independently committed before S2 and S3 is generator-only.
- Confirm the format defect stays deferred absent explicit coordinator rescope.
- Confirm the JSR plan reports the existing 19 warnings rather than flattening exit 0 to clean.
