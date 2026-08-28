# Worklog: #1709 lint/fmt partial-exclusion fail-closed

## Run Metadata

| Field          | Value                                                                              |
| -------------- | ---------------------------------------------------------------------------------- |
| Run ID         | `release-0.0.7-internals--orchestration/slices/lint-partial-exclusion-fail-closed` |
| Branch         | `fix/lint-partial-exclusion-fail-closed`                                           |
| Archetype      | `6-cli-tooling`                                                                    |
| Scope overlays | none                                                                               |
| Authorization  | Coordinator-authorized bounded implementation; strict S1 → S2 → S3 → S4           |

## Design

Recorded before any implementation file is changed; amended after
coordinator-approved six-path rescope and before PLAN-EVAL.

### Public surface

- No TypeScript export, CLI command, help text, package entrypoint, or version
  changes.
- Shipped behavior surface: embedded `run-deno-lint.ts` consumer text and
  `EMBEDDED_AGENT_TOOL_BUNDLE_HASH` in the generated CLI asset.
- Repository-tool behavior: both lint and fmt structured reports gain the same
  additive top-level `coverage` contract. Fmt is not embedded and has no
  publish/API consequence.

### Domain vocabulary

- `selected file` — normalized path the wrapper intentionally hands to Deno.
- `processed file` — selected path included in Deno's terminal processed count.
- `dropped file` — selected path whose same-command/config explicit probe
  returns `No target files found.`.
- `completion adapter` — tool-specific parser that converts Deno's terminal
  lint/fmt summary into a processed count; it does not define coverage
  semantics.
- `coverage refusal` — common typed metadata for empty, all-excluded,
  partial-excluded, unavailable, or inconsistent identity proof; exit 2 for
  ordinary-result coverage failures.
- `diagnostic source` — original batch only. Probe output is never a diagnostic
  source.

### Ports / seams

- Lint already exposes an injectable `BatchRunner` used by `runLint`; S2 reuses
  it for original batches and mismatch probes.
- Fmt has no equivalent seam today: private `runBatch` directly invokes
  `Deno.Command`. S3 introduces an equivalent injectable runner seam inside
  `run-deno-fmt.ts`, routes original batches and probes through it, and uses
  that seam for malformed-summary/inconsistent-probe unit fixtures. No shared
  module or seventh path is introduced.
- Deno CLI output is the external protocol. Lint and fmt have different adapters
  feeding one fail-closed coverage contract.

### Constants

- Existing `NO_TARGET_FILES_MESSAGE` remains the dropped/all-excluded marker.
- Lint processed summary: anchored `^Checked (\d+) files?$`.
- Fmt processed summaries: clean check/successful write use the lint `Checked`
  form; check findings/crashes use anchored
  `^error: Found (\d+) not formatted files? in (\d+) files?$`; write crashes
  use anchored
  `^error: Failed to format (\d+) of (\d+) checked files?$`. Both error forms
  use the second integer as processed count; the third form is write-only.
- Shared causes: `empty-selection`, `all-excluded`, `partial-exclusion`,
  `processed-count-unavailable`, `processed-count-inconsistent`.
- Locked precedence: coverage refusal ≥ crash ≥ ordinary finding. Exit 2 wins
  for any refusal; otherwise crash/finding exits 1; complete+clean exits 0.
- Lint `--input` omits `coverage`; fmt write mismatch probes use non-mutating
  `--check`; both parser suites pin CRLF summaries.

### Archetype-6 checkpoint applicability

- CLI spine abstracts, registries, ports, command names, composition
  declarativity, and contributor flows for new commands are unchanged and N/A to
  this bounded tooling/asset leaf.
- Generated impact is one canonical embedded-tool constant driven only by lint.
- Permission requirements do not change (`read` + `run`; test fixtures also use
  existing write).
- Semantic tests use disposable projects and exact JSON/exit assertions, not
  barrel snapshots.

### Commit slices

| #  | Slice                                                                                                                                       | Gate                                                                                      | Files                                                             |
| -- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| S1 | Restore four healthy doctor files before either guard and prove every corrected root-lint path is processed.                                | default `2037/35/0 → 2041/36/0`; per-file `2041/2041/0`, exit 0; broken absent            | `deno.json`                                                       |
| S2 | Establish lint coverage on clean/finding/crash batches with refusal ≥ crash ≥ finding, exact crash+drop JSON, CRLF, and `--input` omission. | focused lint test/check; mixed and crash 1/2/200; per-file root lint                      | `.llm/tools/run-deno-lint.ts`, `.llm/tools/run-deno-lint_test.ts` |
| S3 | Introduce fmt's injectable runner seam and apply the same coverage/crash contract, including the third write-crash completion form and non-mutating write probes. | seam-based malformed/inconsistent units; all three forms; check/write crash-only and crash+drop 1/2/200; CRLF/ANSI; per-file root fmt | `.llm/tools/run-deno-fmt.ts`, `.llm/tools/run-deno-fmt_test.ts`   |
| S4 | Canonically regenerate and prove only the lint-driven consumer text/hash delta.                                                             | generator twice, name-only delta, `check:assets-barrel`, CLI dry run/audit                | `packages/cli/src/kernel/assets/agent-tools.generated.ts`         |

Every later implementation commit must update this worklog/context pack, but
those harness updates do not widen the exact six-path implementation surface.

### Deferred scope

- Any seventh shared coverage helper/module; cross-wrapper tests pin the common
  local wire contract.
- Existing CLI audit/doctrine warnings; baseline, unrelated.
- Runtime/release/E2E surfaces and leases; explicitly N/A.

### Contributor path

A contributor starts with the common `coverage` wire contract in `plan.md`, then
edits the relevant wrapper's batch runner and focused test. Lint parses terminal
`Checked N`; fmt also parses check-mode `Found M … in N` and write-crash
`Failed to format M of N checked`, always using final `N`. Mismatch probes
classify paths through the existing process seam, while the original batch alone
supplies diagnostics. Only lint changes trigger canonical asset generation.

## Progress Log

| Time (Europe/Zurich) | Phase     | Step                   | Notes                                                                                                                                                         |
| -------------------- | --------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-28           | bootstrap | identity/scope         | Exact base, branch, no-upstream rule, frozen contract, and author-only boundary verified.                                                                     |
| 2026-08-28           | research  | lint re-baseline       | Mixed exit 0 vs batch-size-1 exit 2 reproduced; root `2037/35 → 2041/36`, both green.                                                                         |
| 2026-08-28           | research  | mandatory fmt audit    | Symmetric mixed false green reproduced with excluded/clean/included controls; no mutation.                                                                    |
| 2026-08-28           | plan      | original design        | Four-path lint plan authored, committed, pushed, and recorded on draft PR #1710.                                                                              |
| 2026-08-28           | rescope   | coordinator acceptance | Evidence condition satisfied; exact envelope expanded to six paths by accepted brief.                                                                         |
| 2026-08-28           | research  | fmt signal shape       | Raw controls prove clean/write use `Checked N`; check findings use `Found M … in N`; all-excluded has no completion line.                                     |
| 2026-08-28           | plan      | amended design         | One coverage contract, separate ordered lint/fmt adapters, symmetrical JSON causes, four slices, lint-only publish effect, and unchanged gates locked.        |
| 2026-08-28           | plan-eval | cycle 1                | `FAIL_PLAN` at evaluator commit `59b79ccd8`: specification gaps F1-F3; architecture, signals, envelope, publish bound, and no-seventh-path finding confirmed. |
| 2026-08-28           | plan      | repair                 | Corrected fmt seam premise; locked crash coverage/precedence and exact 1/2/200 JSON; strengthened root drop-free gates; folded A1-A3. Cycle 2 not launched.   |
| 2026-08-28           | plan-eval | cycle 2                | `FAIL_PLAN` at evaluator commit `f2b3fc8b3`: F1, F3, and A1-A3 closed; F2 closed except for single F4 write-mode completion extension. Ordinary allowance exhausted. |
| 2026-08-28           | research  | F4 signal measurement  | Independently measured Deno 2.9.5 write crashes outside the checkout: `1 of 1 checked file`, `1 of 2 checked files`, and `2 of 3 checked files`, ANSI-prefixed, exit 1. |
| 2026-08-28           | plan      | owner F4 amendment      | Admitted the write-only third form, extended exact crash controls to fmt write mode at 1/2/200, preserved precedence/F1-F3/A1-A3/six paths; no third PLAN-EVAL. |
| 2026-08-28           | plan-gate | fresh Tier-A             | Topic-supervisor independently returned `PASS` on exact plan head `fc00aed0f`; coordinator then granted bounded implementation. |
| 2026-08-28           | implement | S1 doctor coverage       | Removed only the root lint task's obsolete doctor wrapper exclusion. Shipped `2037/35/0` and corrected `2041/36/0` both exit 0; corrected per-file proof is `2041/2041/0`, exit 0; focused doctor selection is exactly `4/4/0`. |
| 2026-08-28           | implement | S2 lint fail-closed       | Added terminal `Checked N` coverage accounting, mismatch-only probes through the existing runner seam, shared coverage JSON, and refusal ≥ crash ≥ finding. Focused suite 14/14 and two-file structured check pass; root lint is `2041/2041` processed at default and batch size 1. |
| 2026-08-28           | implement | S3 fmt fail-closed        | Introduced the local injectable fmt runner, three mode-aware completion forms, write-mode `--check` probes, and the same coverage contract/precedence. Focused suite 17/17 and two-file structured check pass; root fmt is `2041/2041` processed at default and batch size 1 with zero findings. |

## Decisions

| Decision                                                   | Reason                                                         | Source                                       |
| ---------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------- |
| Fail closed on any dropped selected path in either wrapper | Green must prove actual coverage                               | coordinator / issue #1709 / accepted rescope |
| One coverage/JSON contract, two parser adapters            | Semantics are shared, raw completion forms differ              | executed lint/fmt signal controls            |
| Keep lint and fmt as separate ordered slices               | Parser difference is proven, not assumed                       | research findings 4, 10-11                   |
| S1 doctor correction precedes S2/S3                        | Accepted sequencing and clean +4 proof                         | coordinator contract                         |
| Publish and generated hash claims are lint-only            | Consumer manifest embeds lint, not fmt                         | settled coordinator finding                  |
| Fmt S3 introduces a local injectable runner seam           | None exists today; unit fixtures need it                       | cycle-1 F1                                   |
| Refusal ≥ crash ≥ ordinary finding                         | Crash batches expose processed counts; coverage integrity wins | cycle-1 F2                                   |
| Fold A1: omit lint `--input` coverage                      | Saved logs have no selected identity set                       | cycle-1 advisory A1                          |
| Fold A2: fmt write probes use `--check`                    | Same classification with no second mutation                    | cycle-1 advisory A2                          |
| Fold A3: pin CRLF summaries                                | Cheap Windows-runner parser insurance                          | cycle-1 advisory A3                          |
| F4 third fmt write completion form                         | Write crashes state processed `N` in a distinct terminal form   | Deno 2.9.5 measurement / cycle-2 F4          |
| No third PLAN-EVAL                                         | Owner accepted bounded F4 fix after ordinary allowance exhausted | owner amendment brief / harness gate         |

## Drift

| Drift                                                                                                    | Severity              | Logged in drift.md |
| -------------------------------------------------------------------------------------------------------- | --------------------- | ------------------ |
| Mandatory audit proved the fmt analogue outside the original four-path envelope.                         | significant           | yes                |
| Coordinator accepted the evidence-triggered six-path rescope; fmt is now first-class in-scope plan work. | significant / granted | yes                |
| Cycle-1 `FAIL_PLAN` found three specification gaps without rejecting the design or widening scope.       | material / repair     | yes                |
| Cycle-2 `FAIL_PLAN` left only F4; owner accepted its bounded in-envelope fix and no third cycle exists.   | material / accepted amendment | yes          |

## Gate results (planning phase only)

| Check                                 | Command / evidence                                                      | Result                      | Notes                                                                       |
| ------------------------------------- | ----------------------------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------- |
| Exact base/branch                     | raw git identity                                                        | PASS                        | `cf648f1ff`; correct branch; no upstream by design                          |
| Current mixed lint                    | exact two files, default vs batch size 1                                | RED reproduced              | exit 0 vs exit 2                                                            |
| Root doctor coverage                  | direct wrapper commands                                                 | PASS baseline proof         | `2037/35/0 → 2041/36/0`, both exit 0                                        |
| Mixed fmt                             | disposable excluded+clean selection, default vs batch size 1            | RED reproduced / accepted   | exit 0 vs exit 2; included dirty control exits 1                            |
| Raw lint completion                   | clean and ordinary diagnostic controls                                  | SIGNAL PROVEN               | both terminate in `Checked N file(s)`                                       |
| Raw fmt completion                    | clean, check finding/crash, write success/crash, singular/plural controls | SIGNAL PROVEN / THREE FORMS | write crashes use ANSI `Failed to format M of N checked file(s)`; second integer is processed |
| CLI JSR baseline                      | per-member audit `--text`                                               | PASS with baseline warnings | exit 0, dry run OK, 19 existing WARN findings                               |
| Product/tool/config/workflow mutation | raw git status and diff paths                                           | PASS                        | none; only permitted harness artifacts changed                              |
| PLAN-EVAL cycle 1                     | fresh independent Tier-A session / `59b79ccd8`                          | `FAIL_PLAN`                 | F1-F3 repaired in author artifacts; evaluator file preserved                |
| Root drop-free evaluator baseline     | cycle-1 §7 batch-size-1 lint/fmt                                        | PASS baseline proof         | lint `2041/2041/0`; fmt `2041/2041/0`, findings 0; both exit 0              |
| PLAN-EVAL cycle 2                     | evaluator artifact / `f2b3fc8b3`                                        | `FAIL_PLAN` / F4 only       | F1, F3, A1-A3 closed; F2 needs only write extension; no third PLAN-EVAL     |

Full final-head implementation gates remain NOT_RUN until S4. Disposable raw
commands establish parser evidence only; the structured wrapper rows below are
the slice verdicts.

## Implementation slice evidence

| Slice | Evidence | Result |
| ----- | -------- | ------ |
| S1 | Shipped `deno task lint` before edit | PASS — exit 0, `filesSelected: 2037`, `batches: 35`, `failedBatches: 0` |
| S1 | Corrected `deno task lint` | PASS — exit 0, `filesSelected: 2041`, `batches: 36`, `failedBatches: 0` |
| S1 | Corrected root wrapper with `--batch-size 1` | PASS — exit 0, `filesSelected: 2041`, `batches: 2041`, `failedBatches: 0` |
| S1 | Focused doctor root with `--batch-size 1` | PASS — exit 0, exactly `filesSelected: 4`, `batches: 4`, `failedBatches: 0`; malformed marker-owned sibling absent |
| S1 | Scope inspection | PASS — only `deno.json` plus this leaf's harness evidence; separate root `lint.exclude` and fmt exclusions unchanged |
| S2 | Focused lint suite through `run-deno-test.ts` | PASS — 14/14; mixed RED and exact crash-only/crash+drop controls at 1/2/200, ANSI/LF/CRLF, empty/all-excluded, malformed/inconsistent evidence, and `--input` omission |
| S2 | Structured check over lint wrapper + test | PASS — 2 selected, 1 batch, 0 failed, 0 occurrences |
| S2 | Corrected root lint at default batching | PASS — exit 0, `2041 selected / 2041 processed`, 36 batches, 0 failed, no refusals |
| S2 | Corrected root lint at `--batch-size 1` | PASS — exit 0, `2041 selected / 2041 processed`, 2041 batches, 0 failed, no refusals |
| S2 | Scope inspection | PASS — only lint wrapper/test plus leaf evidence after S1; no fmt/generated/evaluator/workflow path touched |
| S3 | Focused fmt suite through `run-deno-test.ts` | PASS — 17/17; three completion forms and wrong-mode rejection, seam-based malformed/inconsistent controls, non-mutating write probes, mixed RED, check/write crash-only and crash+drop at 1/2/200, cross-wrapper keys/causes |
| S3 | Structured check over fmt wrapper + test | PASS — 2 selected, 1 batch, 0 failed, 0 occurrences |
| S3 | Root `fmt:check` at default batching | PASS — exit 0, `2041 selected / 2041 processed`, 36 batches, 0 failed, 0 findings |
| S3 | Root fmt check at `--batch-size 1` | PASS — exit 0, `2041 selected / 2041 processed`, 2041 batches, 0 failed, 0 findings |
| S3 | Scope inspection | PASS — only fmt wrapper/test plus leaf evidence after S2; lint/deno config unchanged in this slice; no generated/evaluator/workflow path touched |

## Post-slice reconcile notes

- **S1:** Swept issue #1709 and draft PR #1710 after the gate. Issue remains open
  with the correct milestone/type/area and one `status:plan`; PR remains draft at
  the plan head. Read the latest topic-supervisor Tier-A `PASS`; no reviewer
  objection or scope readjustment appeared. Publish S1 with `status:impl`, retain
  `Closes #1709`, and make no plan/drift change.
- **S2:** Swept issue #1709 and draft PR #1710 after the gate. Issue is open
  with exactly one `status:impl`; PR is open/draft at the pushed S1 head. The
  only new comment is the run-owned S1 record; no reviewer finding, issue-state
  change, or plan/drift readjustment appeared.
- **S3:** Swept issue #1709 and draft PR #1710 after the gate. Issue remains
  open with exactly one `status:impl`; PR remains open/draft at the pushed S2
  head. The only new comment is the run-owned S2 record; no reviewer finding,
  issue-state change, or plan/drift readjustment appeared.

## Handoff notes

- Challenge the one common coverage JSON/cause/exit contract before reviewing
  adapter details.
- Confirm S1 is independently landed before separate S2 lint and S3 fmt refusal
  slices.
- Confirm lint parser uses `Checked N`; fmt check findings/crashes use final
  `N` from `Found M not formatted … in N`; fmt successful writes use `Checked
  N`; and fmt write crashes use final `N` from `Failed to format M of N
  checked`, scoped to write mode.
- Confirm both wrappers pin mixed RED, 1/2/200 invariant, all-excluded, empty,
  diagnostics-once, crash+drop exact JSON/exit, and inconsistent evidence.
- Confirm S3 adds the missing fmt runner seam in-file, with malformed-summary
  and inconsistent-probe unit fixtures through it.
- Confirm A1-A3 are folded: lint input omission, non-mutating fmt write probes,
  and CRLF fixtures.
- Confirm S4 and all publish/JSR claims are lint-only, generator-only, and
  idempotent.
- Confirm no seventh path, new allowance, evaluator/runtime lease, or N/A gate
  is requested.
- Plan gate is closed and bounded implementation is active. S1-S3 are proven;
  S4 canonical regeneration is next. Formal IMPL-EVAL remains a separate later
  session after the final push.
