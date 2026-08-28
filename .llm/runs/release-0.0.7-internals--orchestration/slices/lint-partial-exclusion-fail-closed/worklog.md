# Worklog: #1709 lint/fmt partial-exclusion fail-closed

## Run Metadata

| Field          | Value                                                                              |
| -------------- | ---------------------------------------------------------------------------------- |
| Run ID         | `release-0.0.7-internals--orchestration/slices/lint-partial-exclusion-fail-closed` |
| Branch         | `fix/lint-partial-exclusion-fail-closed`                                           |
| Archetype      | `6-cli-tooling`                                                                    |
| Scope overlays | none                                                                               |
| Authorization  | Research + amended plan only                                                       |

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

- Reuse each wrapper's existing process seam for original batches and mismatch
  probes. No new architecture port or shared module is justified.
- Deno CLI output is the external protocol. Lint and fmt have different adapters
  feeding one fail-closed coverage contract.

### Constants

- Existing `NO_TARGET_FILES_MESSAGE` remains the dropped/all-excluded marker.
- Lint processed summary: anchored `^Checked (\d+) files?$`.
- Fmt processed summaries: the same clean/write form plus anchored
  `^error: Found (\d+) not formatted files? in (\d+) files?$`, using final `N`.
- Shared causes: `empty-selection`, `all-excluded`, `partial-exclusion`,
  `processed-count-unavailable`, `processed-count-inconsistent`.
- Exit meanings: 0 complete+clean, 1 complete+ordinary finding or existing
  recognized crash behavior, 2 selection/coverage refusal.

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

| #  | Slice                                                                                                                                        | Gate                                                                       | Files                                                             |
| -- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| S1 | Restore four healthy doctor files to root lint selection before either guard tightens.                                                       | direct structured `2037/35/0 → 2041/36/0`, exit 0; broken subtree absent   | `deno.json`                                                       |
| S2 | Establish the common coverage contract through the lint completion adapter, refusal JSON, batch invariant, and lint regression controls.     | focused lint test/check; mixed 1/2/200; root lint                          | `.llm/tools/run-deno-lint.ts`, `.llm/tools/run-deno-lint_test.ts` |
| S3 | Apply the same contract through fmt's distinct clean/write and finding completion adapters, including cross-wrapper cause/schema assertions. | focused fmt test/check; mixed 1/2/200; check/write and refusal controls    | `.llm/tools/run-deno-fmt.ts`, `.llm/tools/run-deno-fmt_test.ts`   |
| S4 | Canonically regenerate and prove only the lint-driven consumer text/hash delta.                                                              | generator twice, name-only delta, `check:assets-barrel`, CLI dry run/audit | `packages/cli/src/kernel/assets/agent-tools.generated.ts`         |

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
`Checked N`; fmt additionally parses terminal `Found M … in N`. Mismatch probes
classify paths through the existing process seam, while the original batch alone
supplies diagnostics. Only lint changes trigger canonical asset generation.

## Progress Log

| Time (Europe/Zurich) | Phase     | Step                   | Notes                                                                                                                                                  |
| -------------------- | --------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-08-28           | bootstrap | identity/scope         | Exact base, branch, no-upstream rule, frozen contract, and author-only boundary verified.                                                              |
| 2026-08-28           | research  | lint re-baseline       | Mixed exit 0 vs batch-size-1 exit 2 reproduced; root `2037/35 → 2041/36`, both green.                                                                  |
| 2026-08-28           | research  | mandatory fmt audit    | Symmetric mixed false green reproduced with excluded/clean/included controls; no mutation.                                                             |
| 2026-08-28           | plan      | original design        | Four-path lint plan authored, committed, pushed, and recorded on draft PR #1710.                                                                       |
| 2026-08-28           | rescope   | coordinator acceptance | Evidence condition satisfied; exact envelope expanded to six paths by accepted brief.                                                                  |
| 2026-08-28           | research  | fmt signal shape       | Raw controls prove clean/write use `Checked N`; check findings use `Found M … in N`; all-excluded has no completion line.                              |
| 2026-08-28           | plan      | amended design         | One coverage contract, separate ordered lint/fmt adapters, symmetrical JSON causes, four slices, lint-only publish effect, and unchanged gates locked. |

## Decisions

| Decision                                                   | Reason                                             | Source                                       |
| ---------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------- |
| Fail closed on any dropped selected path in either wrapper | Green must prove actual coverage                   | coordinator / issue #1709 / accepted rescope |
| One coverage/JSON contract, two parser adapters            | Semantics are shared, raw completion forms differ  | executed lint/fmt signal controls            |
| Keep lint and fmt as separate ordered slices               | Parser difference is proven, not assumed           | research findings 4, 10-11                   |
| S1 doctor correction precedes S2/S3                        | Accepted sequencing and clean +4 proof             | coordinator contract                         |
| Publish and generated hash claims are lint-only            | Consumer manifest embeds lint, not fmt             | settled coordinator finding                  |
| PLAN-EVAL required and pending                             | Separate adversarial judgement; no self-evaluation | harness plan gate                            |

## Drift

| Drift                                                                                                    | Severity              | Logged in drift.md |
| -------------------------------------------------------------------------------------------------------- | --------------------- | ------------------ |
| Mandatory audit proved the fmt analogue outside the original four-path envelope.                         | significant           | yes                |
| Coordinator accepted the evidence-triggered six-path rescope; fmt is now first-class in-scope plan work. | significant / granted | yes                |

## Gate results (planning phase only)

| Check                                 | Command / evidence                                                      | Result                      | Notes                                                                       |
| ------------------------------------- | ----------------------------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------- |
| Exact base/branch                     | raw git identity                                                        | PASS                        | `cf648f1ff`; correct branch; no upstream by design                          |
| Current mixed lint                    | exact two files, default vs batch size 1                                | RED reproduced              | exit 0 vs exit 2                                                            |
| Root doctor coverage                  | direct wrapper commands                                                 | PASS baseline proof         | `2037/35/0 → 2041/36/0`, both exit 0                                        |
| Mixed fmt                             | disposable excluded+clean selection, default vs batch size 1            | RED reproduced / accepted   | exit 0 vs exit 2; included dirty control exits 1                            |
| Raw lint completion                   | clean and ordinary diagnostic controls                                  | SIGNAL PROVEN               | both terminate in `Checked N file(s)`                                       |
| Raw fmt completion                    | clean, dirty, dirty+clean, excluded+clean, all-excluded, write controls | SIGNAL PROVEN / DIFFERENT   | clean/write `Checked N`; dirty check `Found M … in N`; excluded loses count |
| CLI JSR baseline                      | per-member audit `--text`                                               | PASS with baseline warnings | exit 0, dry run OK, 19 existing WARN findings                               |
| Product/tool/config/workflow mutation | raw git status and diff paths                                           | PASS                        | none; only permitted harness artifacts changed                              |
| PLAN-EVAL                             | fresh independent Tier-A session                                        | NOT_RUN / REQUIRED          | supervisor's next action on exact amended plan head                         |

Implementation gates are intentionally NOT_RUN. Disposable raw commands
establish parser evidence; they are not implementation verdicts.

## Handoff notes

- Challenge the one common coverage JSON/cause/exit contract before reviewing
  adapter details.
- Confirm S1 is independently landed before separate S2 lint and S3 fmt refusal
  slices.
- Confirm lint parser uses `Checked N`, while fmt check findings use final `N`
  from `Found M not formatted … in N`; fmt clean/write still use `Checked N`.
- Confirm both wrappers pin mixed RED, 1/2/200 invariant, all-excluded, empty,
  diagnostics-once, and inconsistent evidence.
- Confirm S4 and all publish/JSR claims are lint-only, generator-only, and
  idempotent.
- Confirm no seventh path, new allowance, evaluator/runtime lease, or N/A gate
  is requested.
