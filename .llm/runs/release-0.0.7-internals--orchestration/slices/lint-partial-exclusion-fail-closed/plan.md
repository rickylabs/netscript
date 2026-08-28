# Plan: #1709 lint partial-exclusion fail-closed

## Run Metadata

| Field          | Value                                                                              |
| -------------- | ---------------------------------------------------------------------------------- |
| Run ID         | `release-0.0.7-internals--orchestration/slices/lint-partial-exclusion-fail-closed` |
| Branch         | `fix/lint-partial-exclusion-fail-closed`                                           |
| Phase          | `plan` → independent `plan-eval` pending                                           |
| Target         | Internal structured lint wrapper plus published CLI consumer-tool embedding        |
| Issue          | [#1709](https://github.com/rickylabs/netscript/issues/1709)                        |
| Lane / wave    | internals / wave 3                                                                 |
| Archetype      | `6-cli-tooling`                                                                    |
| Scope overlays | none                                                                               |
| Baseline       | `cf648f1ff973d74c213bb125a6f5f5b9328e693b`                                         |

## Archetype and doctrine

Archetype 6 is frozen by the leaf contract because the changed wrapper is user-run tooling and its
text ships inside `@netscript/cli`. The product package's current doctrine verdict is **Keep —
preserve the Archetype-6 kernel/surface split**. This leaf adds no command, export, port, registry,
composition edge, permission, or runtime asset read; it changes an internal runner contract and
canonically refreshes one generated string constant.

The applicable axioms are A2 (a green boundary must be simple and honest), A13 (coverage refusal is
an explicit failure boundary), and A14 (persistent negative controls and publish gates preserve the
contract). Archetype folder-shape work is out of scope and existing CLI doctrine warnings remain
baseline.

## Goal

Make an exit-0 lint report prove identity between wrapper-selected and Deno-processed files,
independent of batch size, after first restoring the four healthy doctor fixture files to the root
lint task. Ship the corrected wrapper text through the canonical CLI asset generator without
claiming an export/API change.

## Exact implementation surface

These are the only four non-harness paths authorized:

1. `.llm/tools/run-deno-lint.ts`
2. `.llm/tools/run-deno-lint_test.ts`
3. `deno.json`
4. `packages/cli/src/kernel/assets/agent-tools.generated.ts` — canonical regeneration only

Every implementation slice also updates the permitted leaf `worklog.md` and `context-pack.md` as
harness evidence. Any other source/generated delta is a rescope stop.

## Non-Scope and deferrals

- `run-deno-fmt.ts` and `run-deno-fmt_test.ts`: the analogous defect is proven, but mutation needs
  explicit coordinator rescope. This plan does not request or assume it.
- Root `lint.exclude` policy beyond the task-level doctor regex: no policy broadening or removal.
- Any Deno lint-rule change, inline ignore, quality allowance, CLI export, public API, or package
  version change.
- `scaffold.runtime`, Aspire, Docker, browser/Playwright, `e2e:cli`, MCP JSR audit, docs-site gates,
  runtime leases, and release publication.
- Existing CLI helper-vocabulary, folder-cardinality, public-doc, or audit baseline debt.

## Locked Decisions

| ID | Decision                                                                                                                                  | Rationale                                                                                                                            |
| -- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| D1 | Remove only `packages/mcp/tests/fixtures/doctor/` from the root lint task's wrapper-level `--exclude` as the first implementation commit. | Coverage correction must land before the stricter guard; re-baseline proves `2037/35 → 2041/36`, green.                              |
| D2 | Any selected file silently dropped by Deno is a coverage refusal and forces exit 2.                                                       | Report-only exit 0 is explicitly rejected; green means complete coverage.                                                            |
| D3 | Use Deno's anchored `Checked N file(s)` batch summary as the primary processed-count proof.                                               | It is emitted by Deno 2.9.5 for clean and ordinary-finding runs and counts actual processed inputs.                                  |
| D4 | On a short count, identify paths with same-config per-file Deno probes; never parse probe diagnostics into the report.                    | Deno does not list clean processed paths. Probes provide identity while the original batch remains the one diagnostic source.        |
| D5 | Missing, contradictory, overlarge, or unreconcilable coverage evidence fails closed with exit 2.                                          | Parser/upstream drift must create a visible refusal, never a new false green.                                                        |
| D6 | Coverage refusal takes precedence over ordinary lint exit 1; parsed original-batch findings remain present once.                          | Callers can distinguish gate-integrity failure from a normal rule finding without losing diagnostics.                                |
| D7 | Structured coverage data is additive under `selection`: processed count, dropped paths, and typed coverage failures/refusal cause.        | Keeps JSON machine-consumable and separates coverage integrity from lint diagnostic `groups`/`failures`.                             |
| D8 | Regenerate only with `deno task gen:assets-barrel`; never edit the generated file manually.                                               | Preserves embedded text/hash integrity and JSR-safe generated-constant design.                                                       |
| D9 | PLAN-EVAL is required and pending in a fresh Tier-A session.                                                                              | Identity proof, parser failure behavior, and shipped asset consequence warrant adversarial review; this author cannot self-evaluate. |

## Selected-vs-processed identity contract

For every nearest-config batch, implementation will retain the original Deno result and:

1. ANSI-strip its combined output and require exactly one line matching `^Checked (\d+) files?$` for
   an ordinary clean or lint-finding result.
2. Compare that integer to `batch.files.length`.
3. Equal counts prove that batch's selected/processed identity. Sum these into
   `selection.filesProcessed`.
4. A smaller count triggers per-file classification calls through the same injectable runner with
   the same `cwd`, effective config, and one explicit batch member. `No target files found.` means
   dropped; exactly `Checked 1 file` means processed.
5. Reconcile the classifications to the original count. Record exact `droppedFiles` and a typed
   coverage failure such as `partial-exclusion`.
6. For the existing wholly excluded `No target files found.` batch, classify every batch member as
   dropped directly; no probe is needed.

The coverage-failure JSON must contain batch index, refusal cause, selected count, observed
processed count when available, `droppedFiles`, and `unverifiedFiles` only when reconciliation is
impossible. It must not copy original or probe diagnostic text. Human stderr prints one concise
coverage-refusal summary; lint diagnostics remain solely in existing `groups`/`failures` parsed from
the original batch.

### Signal trust and failure modes

- Trust derives from Deno's own final summary, not wrapper enumeration, and same-process-contract
  per-file confirmation only on mismatches.
- The persistent tests pin clean and finding forms of `Checked N file(s)` plus all-excluded output.
- Missing/duplicate/malformed summaries, count greater than handed files, probe ambiguity, and
  batch/probe reconciliation failure become typed coverage failures and exit 2.
- File/config mutation between batch and probe is treated as inconsistency and fails closed. The
  implementation must not guess an identity.
- If an existing crash already owns the batch failure, do not duplicate its diagnostics as a
  coverage diagnostic; the non-zero crash stays visible and cannot become green.
- Mismatch probing adds work only on an already-invalid coverage path; normal green batches do not
  pay per-file process cost.

## Persistent semantic controls

### Mixed-batch RED

Create a temporary test project that mirrors the exact reachable root-config path pair and excludes
`.llm/`:

- `.llm/tools/probe.ts`: real `no-explicit-any` violation;
- `.github/scripts/ci-classify-changes.ts`: lint-clean;
- included-path copy of the probe: proves the rule is active and exits 1;
- wrapper mixed selection at batch size 200: must exit 2, report `.llm/tools/probe.ts` exactly once
  as dropped, use cause `partial-exclusion`, and never claim complete coverage;
- same selected set at batch sizes 1, 2, and 200: same exit-2 refusal and same dropped-file set.

### Must-not-regress

- Pure all-excluded selection remains exit 2 and reports every selected dropped path.
- Empty selection remains exit 2.
- Fully processed clean selection remains exit 0 with selected count equal to processed count.
- Ordinary lint finding remains exit 1; no Deno rule is removed or weakened.
- Crash-without-occurrence behavior and all existing tests remain green.
- Original-batch diagnostics occur once even if mismatch probes observe the same finding.
- `quality:scan` keeps `--max-allow 7` and reports `allowCount: 7`; no new ignore or allowance.

## Commit slices

| #  | What the slice proves                                                                                                                                | Non-harness files                                                 | Slice gates                                                                                                                                                                                                                                             |
| -- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1 | Root coverage correction precedes the guard: four healthy doctor files join selection while the malformed sibling stays hidden and lint stays green. | `deno.json`                                                       | Exact direct lint-wrapper command: `2037/35/0 → 2041/36/0`, exit 0; a focused wrapper run rooted at `packages/mcp/tests/fixtures/doctor` selects exactly 4 healthy TS files and skips the marker-owned broken subtree; structured check of `deno.json`. |
| S2 | Selected-vs-processed identity is fail-closed and batch-size invariant, with exact non-duplicated structured reporting and all refusal controls.     | `.llm/tools/run-deno-lint.ts`, `.llm/tools/run-deno-lint_test.ts` | Focused structured test wrapper over `run-deno-lint_test.ts`; focused structured check; repaired mixed RED at batch sizes 1/2/200; all-excluded, empty, clean, finding, crash controls.                                                                 |
| S3 | Published consumer bundle contains the repaired wrapper text and a refreshed hash through idempotent canonical generation only.                      | `packages/cli/src/kernel/assets/agent-tools.generated.ts`         | `deno task gen:assets-barrel` twice; second run has no diff; generated delta limited to this one file; `deno task check:assets-barrel`; CLI member dry-run and JSR audit.                                                                               |

S1 must be committed before S2. S3 follows S2. No implementation begins until independent PLAN-EVAL
returns `PASS` and the supervisor separately authorizes it.

## Open-Decision Sweep

| Decision                                                                                  | Status                                                | Notes                                                                                          |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Lint repair, refusal exit, signal, JSON shape, tests, sequencing, regeneration, and gates | resolved now                                          | Locked above; no implementation choice remains that would force later rework.                  |
| Exact internal helper/type names                                                          | safe to defer                                         | Local names do not change the locked data/exit contract and can be judged during slice review. |
| Whether to repair `run-deno-fmt.ts`                                                       | safe to defer outside leaf; explicit rescope required | Proven analogous defect, separate wrapper/test surface, no lint-leaf dependency.               |

## Risk Register

| Risk                                                        | Mitigation                                                                                                                                                    |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deno changes or omits human summary text.                   | Anchored parser plus fail-closed `coverage-summary-*` causes and persistent fixtures; never default a missing summary to complete coverage.                   |
| Per-file probes duplicate lint diagnostics.                 | Probe output is classification-only; parse/render diagnostics solely from the original batch and test one-occurrence behavior.                                |
| Batch/probe file or config race.                            | Reconciliation is mandatory; inconsistency exits 2 and lists unverified candidates instead of guessing.                                                       |
| New refusal unexpectedly reds a legitimate selection.       | Land S1 first, test root lint after each slice, and treat any remaining dropped selection as a coverage defect to fix or explicitly rescope—not an allowance. |
| Generated barrel command changes unrelated generated files. | Capture pre-generation state, run canonical generator, require name-only delta to be exactly `agent-tools.generated.ts`, and stop on any other delta.         |
| Generated asset is hand-edited or non-idempotent.           | Generator only; run twice; `check:assets-barrel` plus clean second diff.                                                                                      |
| Audit process exits 0 while warnings remain.                | Record the full 19-warning baseline and compare after-state by content/count; do not call it warning-free.                                                    |
| Scope creeps into fmt after mandatory audit.                | Significant drift entry and explicit coordinator-rescope gate; no fmt file in any slice.                                                                      |
| Severity is overstated as current CI exposure.              | Preserve the verified bound: current root CI lint selects only packages/plugins; consumer wrapper remains the shipped risk.                                   |

## Validation Plan

| Order | Gate                       | Command or check                                                                                                                                                                                       | Expected result                                                                                                                   |
| ----- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| 1     | S1 root coverage           | Direct `.llm/tools/run-deno-lint.ts` command matching root `lint` after doctor regex removal                                                                                                           | exit 0; `filesSelected: 2041`, `batches: 36`, `failedBatches: 0`; healthy +4 included; malformed marked sibling absent            |
| 2     | Focused test               | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all .llm/tools/run-deno-lint_test.ts`                                                                          | exit 0; mixed RED and refusal controls pass                                                                                       |
| 3     | Focused check              | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --file .llm/tools/run-deno-lint.ts --file .llm/tools/run-deno-lint_test.ts --ext ts` (the wrapper supplies `--unstable-kv` by default) | structured exit 0                                                                                                                 |
| 4     | Frozen `check`             | `deno task check`                                                                                                                                                                                      | structured exit 0                                                                                                                 |
| 5     | Frozen `test`              | `deno task test`                                                                                                                                                                                       | structured exit 0                                                                                                                 |
| 6     | Lint behavior              | `deno task lint` plus explicit mixed selections at batch sizes 1, 2, 200                                                                                                                               | root exit 0; every mixed selection exits 2 with identical dropped set                                                             |
| 7     | Quality job                | `deno task quality:scan` and `deno task arch:check`                                                                                                                                                    | exit 0; `allowCount` remains exactly 7; no allowance/ignore added                                                                 |
| 8     | Canonical generation       | `deno task gen:assets-barrel`, inspect name-only diff, run it again                                                                                                                                    | only `packages/cli/src/kernel/assets/agent-tools.generated.ts` changes; second run produces no delta                              |
| 9     | Frozen asset gate          | `deno task check:assets-barrel`                                                                                                                                                                        | exit 0                                                                                                                            |
| 10    | CLI member publish dry-run | `deno run --allow-read --allow-write --allow-run .llm/tools/release/run-publish-dry-run.ts --root . --member packages/cli`                                                                             | exit 0; generated tool text/hash included; no export/API change claimed; no new runtime-read/import-attribute/import-meta problem |
| 11    | Per-member CLI JSR audit   | `deno run --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/cli --text`                                                                                     | exit 0 and dry-run OK; existing 19 WARN baseline disclosed, no new warning attributable to this leaf                              |
| 12    | Scope/idempotence          | Raw `git diff --name-only cf648f1ff...HEAD` plus clean second generator check                                                                                                                          | product delta is exactly the frozen four paths; no lock/cache churn; harness delta stays inside this leaf run dir                 |

The CLI member dry-run and JSR audit are additive to the frozen proving gates. No dependency
decision is made, so `deps:*` evidence is N/A. No release or runtime gate is applicable.

## Fitness / publish implications

- F-6 / F-CLI publishability: CLI member dry-run and per-member audit required because the wrapper
  text is published.
- F-7 documentation score: no public docs or export change; retain and disclose existing
  `cli/public-api-doc-completeness` debt rather than claiming it fixed.
- F-10 / A14: semantic temp-project tests prove behavior; no giant generated-string snapshot.
- F-19: gate evidence comes from structured wrappers, not raw root `deno lint` as a verdict source.
- Generated constant preserves the JSR-safe embedded-asset pattern; no runtime file reads or import
  attributes are introduced.
- No new or deepened architecture debt is planned. The fmt finding is a rescope/deferred bug, not an
  `arch-debt.md` entry authorized by this leaf.

## Drift Watch

Log and stop for rescope if implementation needs another source path, Deno lacks a reconcilable
processed signal, root lint does not retain `2041/36/0`, generator touches another asset, quality
allowances change, CLI audit adds a new finding, or the current CI-root bound changes.

## PLAN-EVAL judgement and stop

**Selected: REQUIRED; verdict: PENDING.** The milestone supervisor must perform a fresh independent
Tier-A PLAN-EVAL on the exact committed/pushed plan head. This author does not create
`plan-eval.md`, does not issue a verdict, and does not begin implementation.
