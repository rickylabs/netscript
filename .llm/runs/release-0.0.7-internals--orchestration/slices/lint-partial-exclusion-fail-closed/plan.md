# Plan: #1709 lint/fmt partial-exclusion fail-closed

## Run Metadata

| Field          | Value                                                                              |
| -------------- | ---------------------------------------------------------------------------------- |
| Run ID         | `release-0.0.7-internals--orchestration/slices/lint-partial-exclusion-fail-closed` |
| Branch         | `fix/lint-partial-exclusion-fail-closed`                                           |
| Phase          | owner-accepted F4 amendment after cycle-2 `FAIL_PLAN`; no third PLAN-EVAL          |
| Target         | Structured lint and fmt wrappers plus lint-driven CLI consumer embedding           |
| Issue          | [#1709](https://github.com/rickylabs/netscript/issues/1709)                        |
| Lane / wave    | internals / wave 3                                                                 |
| Archetype      | `6-cli-tooling`                                                                    |
| Scope overlays | none                                                                               |
| Baseline       | `cf648f1ff973d74c213bb125a6f5f5b9328e693b`                                         |

## Archetype and doctrine

Archetype 6 remains the correct profile: the changed wrappers are user-run
repository tooling, and the lint wrapper's text ships inside `@netscript/cli`.
The CLI doctrine verdict is **Keep — preserve the Archetype-6 kernel/surface
split**. This leaf adds no command, export, port, registry, composition edge,
permission, version, runtime asset read, or public API. It changes two internal
runner contracts and canonically refreshes one generated string constant for
lint only.

The applicable axioms are A2 (a green boundary must be simple and honest), A13
(coverage refusal is an explicit failure boundary), and A14 (persistent negative
controls plus publish gates preserve the contract). Existing CLI doctrine and
audit warnings remain baseline.

## Goal

Make exit-0 lint and fmt reports prove identity between wrapper-selected and
Deno-processed files, independent of batch size. First restore four healthy
doctor fixtures to the root lint task. Then land separate lint and fmt
parser-adapter/refusal slices because their raw completion signals differ.
Finally ship only the lint wrapper delta through canonical CLI asset generation.

## Exact implementation surface

These are the only six non-harness paths authorized:

1. `.llm/tools/run-deno-lint.ts`
2. `.llm/tools/run-deno-lint_test.ts`
3. `.llm/tools/run-deno-fmt.ts`
4. `.llm/tools/run-deno-fmt_test.ts`
5. `deno.json`
6. `packages/cli/src/kernel/assets/agent-tools.generated.ts` — canonical
   regeneration only

Later implementation slices also update permitted leaf harness evidence. Any
seventh source, generated, config, or workflow path is an immediate rescope
stop. This authoring turn changes only the named harness artifacts and PR
metadata/comments; it performs no implementation.

## Non-scope and deferrals

- A seventh shared helper/module for coverage types or parsing. The common wire
  contract is defined once below; each wrapper owns only its tool-specific
  adapter and local representation.
- Root `lint.exclude` policy beyond removing the root task's obsolete
  doctor-family wrapper `--exclude` term.
- Deno lint/fmt rule changes, inline ignores, quality allowances, CLI exports,
  public APIs, package versions, or consumer-manifest changes.
- Publishing or embedding `run-deno-fmt.ts`; it is not in `consumer-tools.json`.
  The fmt repair has no generated consumer-tool body of its own.
- `scaffold.runtime`, Aspire, Docker, browser/Playwright, `e2e:cli`, MCP JSR
  audit, docs-site gates, evaluator/runtime leases, and release publication. All
  are N/A and must not be requested.
- Existing CLI helper-vocabulary, folder-cardinality, public-doc,
  slow-type-banner, or other audit baseline debt.

## Locked Decisions

| ID  | Decision                                                                                                                                                                                                                                                                                     | Rationale                                                                                                                                                                                                                               |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Remove only `packages/mcp/tests/fixtures/doctor/` from the root lint task's wrapper `--exclude` as the first implementation slice.                                                                                                                                                           | Accepted sequencing requires the coverage correction before either stricter guard. Baseline proves `2037/35/0 → 2041/36/0`, still green.                                                                                                |
| D2  | One selected-vs-processed identity rule applies to lint and fmt: complete coverage exists only when Deno's processed count equals the selected batch membership.                                                                                                                             | Green has one meaning across both wrappers; batch construction cannot change the verdict.                                                                                                                                               |
| D3  | Use separate ordered lint and fmt parser-adapter slices.                                                                                                                                                                                                                                     | Evidence proves the signals differ: lint always ends in `Checked N`; fmt check findings end in `Found M not formatted file(s) in N file(s)`. Merging adapters would assume false symmetry.                                              |
| D4  | Parse Deno's anchored terminal summaries as the primary processed-count proof; on a short count, use same-config per-file probes only to identify paths. Lint reuses its existing injectable `BatchRunner`; S3 introduces an equivalent injectable runner seam locally in `run-deno-fmt.ts`. | Deno does not list all clean paths. Its count plus mismatch-only probes proves identity without duplicating diagnostics, and the new fmt seam makes malformed-summary/inconsistent-probe unit fixtures possible without a seventh file. |
| D5  | Evaluate coverage on clean, ordinary-finding, and recognized crash batches. Missing, contradictory, overlarge, or unreconcilable completion evidence is a coverage refusal even when the batch also crashes.                                                                                 | Deno 2.9.5 still emits `Checked N` (lint) or `Found M … in N` (fmt) on parse-error batches, so their selected/processed identity is knowable and must participate in the invariant.                                                     |
| D6  | Lock precedence as **coverage refusal ≥ crash ≥ ordinary finding**. Any refusal exits 2; otherwise any crash exits 1; otherwise any ordinary finding exits 1. The original batch remains the sole diagnostic source.                                                                         | A run may contain a drop and a parse-error crash. Coverage integrity wins, while existing crash/finding diagnostics still render once and coverage never copies their text.                                                             |
| D7  | Both command-mode reports gain the same additive top-level `coverage` object and finite causes. Lint `--input` mode omits `coverage`, matching its existing omission of `selection`; existing diagnostic/crash structures remain compatible.                                                 | Saved lint logs do not carry a selected-file identity set. One command-mode consumer still handles dropped-file refusal identically for both wrappers.                                                                                  |
| D8  | Apply fmt coverage to check and write modes. Successful original write batches use `Checked N`; crashing original write batches use `error: Failed to format M of N checked file(s)`, taking the second integer as processed. Any write-mode mismatch probes run non-mutating `deno fmt --check` with the same cwd/config/path.                                 | Deno 2.9.5 exposes the processed count in both write outcomes. `--check` probes classify processed versus dropped paths without a second mutating formatting pass, while the original write batch remains the sole diagnostic source.    |
| D9  | Regenerate assets only with `deno task gen:assets-barrel`; never hand-edit the generated file. The embedded lint text and `EMBEDDED_AGENT_TOOL_BUNDLE_HASH` delta are lint-driven only.                                                                                                      | The consumer manifest embeds lint but not fmt; canonical generation preserves embedded-text/hash integrity.                                                                                                                             |
| D10 | PLAN-EVAL cycle 1 returned `FAIL_PLAN` at `59b79ccd8`; F1-F3 and A1-A3 remain closed. Cycle 2 returned the single F4 specification gap at `f2b3fc8b3`; the owner accepted the recommended third fmt write-completion adapter and there is no third PLAN-EVAL.                                                                                         | Both evaluator artifacts remain immutable. This bounded amendment closes only F4; a fresh coordinator Tier-A runs on the exact pushed head before any separate implementation grant.                                                     |

## One selected-vs-processed identity contract

This section defines the contract once for both wrappers. A tool-specific parser
is only an adapter from raw Deno output to `processedCount`; it cannot change
the identity rule, refusal causes, JSON shape, or exit semantics.

### Completion adapters

For every nearest-config batch, including a result that the existing diagnostic
logic classifies as a crash, keep the original Deno result, ANSI-strip combined
output, and require exactly one admissible terminal completion summary:

- **Lint adapter:** anchored `^Checked (\d+) files?$` on clean and ordinary
  lint-finding results.
- **Fmt adapter:**
  - clean check or successful write: anchored `^Checked (\d+) files?$`;
  - check with formatting findings: anchored
    `^error: Found (\d+) not formatted files? in (\d+) files?$`, using the
    second integer;
  - write with a formatting crash: anchored
    `^error: Failed to format (\d+) of (\d+) checked files?$`, using the
    second integer.

The fmt adapter must not infer processed count from the number of `from <path>:`
findings or from the first integer in either error summary: those values are
findings/failures, not processed identity. The third form is admissible only for
write mode. Parser tests pin singular/plural, clean, ordinary diagnostic,
parse-error, ANSI, and CRLF-terminated variants of all applicable summary forms
for both adapters.

### Identity proof and probes

1. Compare the adapter's `processedCount` with `batch.files.length`.
2. Equality verifies the batch. Sum verified counts into the run's
   `coverage.filesProcessed`.
3. A smaller count triggers one-file classifications through an injectable
   runner using the same executable, `cwd`, effective config, and explicit path.
   Lint already has `BatchRunner`; S3 introduces the equivalent seam inside
   `run-deno-fmt.ts` and routes both original batches and probes through it:
   - lint processed: `Checked 1 file` (including lint-finding output that
     terminates that way);
   - fmt processed in check mode: `Checked 1 file` or
     `Found 1 not formatted file in 1 file`;
   - fmt processed after an original write batch: probe with non-mutating
     `deno fmt --check`; accept `Checked 1 file` or
     `Found 1 not formatted file in 1 file`;
   - either tool dropped: `No target files found.`.
4. Classifications must reconcile exactly to the original processed count. Known
   dropped paths are normalized, sorted, and deduplicated. Unreconciled
   candidates go in `unverifiedFiles`; the wrapper never guesses.
5. Existing wholly excluded results classify the whole batch as dropped without
   probes. They do not independently choose the public refusal cause.
6. Aggregate identities across all batches, then derive the run-level cause:
   zero selected is `empty-selection`; zero processed is `all-excluded`; any
   processed+dropped mix is `partial-exclusion`. Unavailable/inconsistent
   evidence uses its corresponding cause. Cause and verdict therefore cannot
   change merely because a dropped path moved into its own child batch.
7. Run the same coverage accounting on a recognized crash batch. Its completion
   count contributes to `filesProcessed`; a short count is probed and reconciled
   normally. Missing/invalid/inconsistent crash-batch evidence creates the same
   typed coverage refusal and exit 2. Crash classification and rendering remain
   in the existing failure path and occur once.

Probe output is classification-only. It is never fed into lint occurrence
parsing, fmt finding parsing, crash structures, JSON diagnostic arrays, or human
stderr. The original batch remains the one diagnostic source.

### Shared structured JSON contract

Both reports add the same top-level shape:

```ts
type CoverageRefusalCause =
  | "empty-selection"
  | "all-excluded"
  | "partial-exclusion"
  | "processed-count-unavailable"
  | "processed-count-inconsistent";

interface CoverageReport {
  filesSelected: number;
  filesProcessed?: number;
  droppedFiles: string[];
  refusals: Array<{
    cause: CoverageRefusalCause;
    filesSelected: number;
    filesProcessed?: number;
    droppedFiles: string[];
    unverifiedFiles?: string[];
  }>;
}
```

- Fully covered runs emit `droppedFiles: []`, `refusals: []`, and exact
  `filesProcessed`.
- Lint `--input`/saved-log mode omits the entire `coverage` property because it
  has no wrapper selection to prove; its existing parse-only report is
  unchanged.
- Partial and all-excluded runs name every proven dropped path and the same
  cause strings in lint and fmt.
- Empty selection emits `filesSelected: 0`, `filesProcessed: 0`, and
  `empty-selection`.
- `filesProcessed` is omitted only when Deno's result cannot be reconciled; that
  refusal lists candidates under `unverifiedFiles`.
- Coverage entries contain identities/counts/causes only—never Deno diagnostic
  text. Existing lint `groups`/`failures` and fmt `findings`/crash rendering
  remain the sole diagnostic homes.
- The batch-size invariant is run-level: for any positive batch size, an
  identical selected set must produce the same exit, cause, processed/dropped
  identities, and diagnostic multiplicity. Tests pin boundary sizes 1, 2,
  and 200.
- The exact six-path envelope forbids a shared seventh module. Each wrapper
  represents this single wire contract locally, and the fmt focused suite
  includes a cross-wrapper assertion that equivalent partial/all-excluded/empty
  cases expose identical coverage keys and cause values.

### Failure precedence

Precedence is locked as **coverage refusal ≥ crash ≥ ordinary finding**.

| State                                                           | Exit | Coverage and diagnostic behavior                                                                                                                                                       |
| --------------------------------------------------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Complete coverage, no finding                                   | 0    | Counts equal; `droppedFiles: []`; `refusals: []`.                                                                                                                                      |
| Complete coverage, ordinary lint/fmt finding                    | 1    | Counts equal; original finding once; no refusal.                                                                                                                                       |
| Complete coverage, recognized process/config/parse crash        | 1    | Crash-batch completion count is included; `droppedFiles: []`; `refusals: []`; existing crash diagnostics render once.                                                                  |
| Empty, all-excluded, partial-excluded, or unverifiable coverage | 2    | Refusal wins even if another batch crashes or has findings; coverage holds only identities/counts/causes, while original crash/finding diagnostics render once through existing paths. |

### Exact crash-plus-drop invariant

For lint and fmt check mode, a disposable three-file selection contains
`clean.ts`, a parse-error `syntax.ts`, and config-excluded
`excluded/dropped.ts`. At batch sizes 1, 2, and 200 the exact expected
command-mode outcome is exit 2 and:

```json
{
  "coverage": {
    "filesSelected": 3,
    "filesProcessed": 2,
    "droppedFiles": ["excluded/dropped.ts"],
    "refusals": [
      {
        "cause": "partial-exclusion",
        "filesSelected": 3,
        "filesProcessed": 2,
        "droppedFiles": ["excluded/dropped.ts"]
      }
    ]
  }
}
```

There is no `unverifiedFiles`. Lint's existing `failures` path and fmt's
existing crash renderer each report the parse error exactly once at every batch
size; `coverage` contains no crash text. Companion crash-without-drop selections
contain `clean.ts` and `syntax.ts`; at 1, 2, and 200 they exit 1 with exactly:

```json
{
  "coverage": {
    "filesSelected": 2,
    "filesProcessed": 2,
    "droppedFiles": [],
    "refusals": []
  }
}
```

Each companion control also renders one existing crash diagnostic and no crash
text inside `coverage`.

Fmt write mode repeats both exact controls at batch sizes 1, 2, and 200. The
crash-plus-drop selection exits 2 with the same `3/2`, one-dropped-file,
`partial-exclusion` JSON above; the crash-only selection exits 1 with the same
`2/2`, empty-refusal JSON above. A crashing original write batch is counted from
`Failed to format M of N checked file(s)` using `N`; successful original write
batches use `Checked N`. Any short count is reconciled by non-mutating `--check`
probes. In both controls the original write crash renders once, and `coverage`
never copies its text. Thus a write-mode crash without a drop remains an
ordinary crash at exit 1, while any coverage refusal still wins at exit 2.

## Persistent semantic controls

### Lint mixed-batch RED

Create a disposable project whose root lint config excludes `.llm/`:

- `.llm/tools/probe.ts`: a real `no-explicit-any` violation;
- `.github/scripts/ci-classify-changes.ts`: lint-clean;
- included-path copy of the probe: proves the rule is active and exits 1;
- mixed wrapper selection at batch size 200: must exit 2, report
  `.llm/tools/probe.ts` exactly once, use `partial-exclusion`, and never claim
  complete coverage;
- identical selected set at batch sizes 1, 2, and 200: identical refusal verdict
  and dropped set.

### Fmt mixed-batch RED

Create a disposable project with `fmt.exclude: ["generated/"]`:

- `generated/bad.ts`: deliberately unformatted and excluded;
- `clean.ts`: included and already formatted;
- included copy of the bad text: proves genuine format checking and exits 1;
- mixed wrapper selection at batch size 200: must exit 2, report
  `generated/bad.ts` exactly once, use the same `partial-exclusion` cause, and
  never claim complete coverage;
- identical selected set at batch sizes 1, 2, and 200: identical refusal verdict
  and dropped set.

### Must-not-regress — both wrappers

- Pure all-excluded selections stay exit 2, list every dropped path, and use
  `all-excluded`.
- Empty selections stay exit 2 and use `empty-selection`.
- Fully processed clean selections stay exit 0 with selected count equal to
  processed count.
- Ordinary lint rule findings and fmt differences stay exit 1; original
  diagnostics occur once.
- Existing crash-without-finding/occurrence behavior stays exit 1 when coverage
  is complete and becomes exit 2 only when a coverage refusal is also present;
  crash diagnostics remain once.
- Fmt write mode retains a verified original count from either `Checked N` or
  `Failed to format M of N checked file(s)` (using `N`) and uses non-mutating
  `--check` mismatch probes. A write-mode crash without a drop stays exit 1.
- No Deno lint/fmt rule, config allowance, inline ignore, or diagnostic parser
  is weakened.
- `deno task quality:scan` must retain `--max-allow 7` and report
  `allowCount: 7`; no new allowance or ignore is permitted.

## Ordered commit slices

| #  | What the slice proves                                                                                                                                                                                                          | Non-harness files                                                 | Proving gates for the slice                                                                                                                                                                                                                                                                                                                                                              |
| -- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1 | Root coverage correction lands first: four healthy doctor files join root lint while the malformed marker-owned sibling remains hidden and lint stays green.                                                                   | `deno.json`                                                       | Exact direct lint-wrapper before/after evidence `2037/35/0 → 2041/36/0`, exit 0; corrected root lint at `--batch-size 1` is `2041/2041/0`, exit 0, proving every selected path is accepted by Deno; focused doctor selection proves exactly four healthy TS files and excludes broken; structured check of `deno.json`.                                                                  |
| S2 | The common coverage contract is established through the lint adapter: coverage is evaluated on crash batches, refusal ≥ crash ≥ finding, mixed/crash selections are batch invariant, and diagnostics remain single-sourced.    | `.llm/tools/run-deno-lint.ts`, `.llm/tools/run-deno-lint_test.ts` | Focused structured test/check; LF/CRLF/ANSI lint summaries; mixed and exact crash-plus-drop controls at 1/2/200 with exit/JSON above; all-excluded, empty, `--input` omission, clean, finding, malformed-summary, inconsistent-probe, and crash-without-drop controls; corrected root lint `--batch-size 1` remains `2041/2041/0`, exit 0.                                               |
| S3 | The fmt adapter applies the same contract and introduces an equivalent injectable runner seam inside `run-deno-fmt.ts`; successful writes use `Checked N`, write crashes use `Failed to format M of N checked`, and write mismatch probes use non-mutating `--check`. | `.llm/tools/run-deno-fmt.ts`, `.llm/tools/run-deno-fmt_test.ts`   | Focused structured test/check; LF/CRLF/ANSI and singular/plural fixtures for all three fmt forms; mixed controls plus check-mode and write-mode crash+drop/crash-only controls at 1/2/200 with the exact exit/JSON above; malformed-summary and inconsistent-probe unit fixtures through the new seam; all-excluded, empty, clean, dirty, write, and cross-wrapper cause/schema controls; root fmt `--batch-size 1` is `2041/2041/0`, findings 0, exit 0. |
| S4 | The published CLI consumer bundle contains the repaired lint wrapper text and refreshed hash through idempotent canonical generation only; fmt creates no publish delta or claim.                                              | `packages/cli/src/kernel/assets/agent-tools.generated.ts`         | `deno task gen:assets-barrel` only, twice; second run no diff; generated delta limited to this file; `deno task check:assets-barrel`; CLI publish dry run and per-member CLI JSR audit tied to lint.                                                                                                                                                                                     |

Ordering is strict: S1 → S2 → S3 → S4. The parser evidence forces distinct S2/S3
rather than a merged assumption of symmetry. S2 defines the common wire contract
first; S3 proves its fmt adapter without changing the definition. S4 follows
lint repair and has no fmt publish consequence.

No implementation starts until independent PLAN-EVAL returns `PASS` and the
coordinator separately authorizes implementation.

## Open-decision sweep

| Decision                                                                                                                                                    | Status                | Notes                                                                                                                               |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Six-path scope, ordering, common identity/JSON contract, two parser adapters, refusal precedence, persistent controls, asset/publish consequence, and gates | resolved now          | Locked above; none can be deferred without rework.                                                                                  |
| Crash-vs-coverage precedence and crash-batch accounting                                                                                                     | resolved now          | Refusal ≥ crash ≥ finding; completion counts are evaluated on crash batches; exact 1/2/200 JSON and exit controls are locked above. |
| Fmt injectable runner seam                                                                                                                                  | resolved now          | S3 introduces it inside `run-deno-fmt.ts`; no new module/path.                                                                      |
| Lint `--input` coverage behavior (A1)                                                                                                                       | resolved now / folded | Omit `coverage`, matching parse-only `selection` omission.                                                                          |
| Fmt write-mode probe command (A2)                                                                                                                           | resolved now / folded | Use non-mutating `deno fmt --check` for mismatch probes.                                                                            |
| CRLF parser fixture (A3)                                                                                                                                    | resolved now / folded | Both lint and fmt parser suites pin CRLF-terminated summaries.                                                                      |
| Fmt write-mode crash completion (F4)                                                                                                                        | resolved now / owner accepted | Admit the write-only `Failed to format M of N checked file(s)` form, use `N`, and pin crash-only/crash+drop at 1/2/200.              |
| Exact local helper/type/function names                                                                                                                      | safe to defer         | They cannot alter the locked wire contract or cause vocabulary.                                                                     |
| A shared seventh helper file                                                                                                                                | resolved: prohibited  | The common contract is tested across local adapters inside the six-path envelope.                                                   |

## Risk register

| Risk                                                             | Mitigation                                                                                                                                                           |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deno changes human completion text.                              | Anchored tool-specific adapters, persistent real-output fixtures, and fail-closed unavailable/inconsistent causes; never default missing output to full coverage.    |
| Fmt findings are mistaken for processed identities.              | Parse terminal `Found M … in N files`, using final `N`; never count `from` blocks. Pin dirty+clean where `M != N`.                                                   |
| Per-file probes duplicate lint/fmt diagnostics.                  | Probes are classification-only; original batch alone feeds diagnostic parsers/renderers; assert single occurrence/finding in mixed controls.                         |
| Batch/probe file or config race.                                 | Require exact reconciliation; inconsistency exits 2 with unverified candidates rather than guessed identity.                                                         |
| Common JSON semantics drift between local implementations.       | One contract/cause table in this plan plus cross-wrapper focused assertions; stop rather than add a seventh helper.                                                  |
| Fmt tests cannot inject malformed output or probe inconsistency. | S3 introduces a local injectable runner seam in `run-deno-fmt.ts`; unit fixtures use it without a seventh file.                                                      |
| A crash hides a refusal or changes verdict with batching.        | Parse completion counts on crash batches, aggregate identities before precedence, and pin exact crash+drop/crash-only outcomes at 1/2/200.                           |
| New refusals red a legitimate root selection.                    | Land S1 first, run root lint and fmt checks after relevant slices, and treat any drop as a coverage defect or explicit rescope—not an allowance.                     |
| Fmt write crashes are misclassified by a two-form adapter.       | Pin raw write controls for `Checked N` and `Failed to format M of N checked file(s)`, including singular/plural, ANSI, crash-only, and crash+drop at 1/2/200; keep the third form write-only. |
| Generator changes unrelated output.                              | Capture state, invoke only `deno task gen:assets-barrel`, require the only generated delta to be `agent-tools.generated.ts`, run twice, and stop on any other delta. |
| Publish claims incorrectly include fmt.                          | Tie S4, CLI dry run, JSR audit, embedded text, and hash only to lint; state explicitly that fmt is not in `consumer-tools.json`.                                     |
| Audit exits 0 while warnings remain.                             | Record and compare the full 19-WARN CLI baseline; never report the audit as warning-free.                                                                            |
| Severity is overstated as current CI exposure.                   | Preserve the verified bound: current root CI lint selects packages/plugins only; risk remains wrapper/consumer correctness.                                          |

## Validation plan

| Order | Gate                         | Command or check                                                                                                              | Expected result                                                                                                                                                                  |
| ----- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | S1 root coverage             | Direct root lint wrapper after doctor term removal at default and `--batch-size 1`                                            | default exit 0 at `2041/36/0`; per-file exit 0 at `2041/2041/0`; healthy +4 present, malformed sibling absent                                                                    |
| 2     | Lint focused test            | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all .llm/tools/run-deno-lint_test.ts` | structured exit 0; exact mixed/crash 1/2/200 JSON, CRLF, `--input` omission, and refusal controls pass; per-file root lint remains `2041/2041/0`                                 |
| 3     | Fmt focused test             | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all .llm/tools/run-deno-fmt_test.ts`  | structured exit 0; new seam fixtures, all three completion forms, exact check/write mixed and crash 1/2/200 JSON, CRLF/ANSI, non-mutating write probes, and refusal controls pass; per-file root fmt is `2041/2041/0`, findings 0 |
| 4     | Focused check                | `.llm/tools/run-deno-check.ts` over the four wrapper/test files with `--ext ts`                                               | structured exit 0; no seventh dependency                                                                                                                                         |
| 5     | Frozen `check`               | `deno task check`                                                                                                             | structured exit 0                                                                                                                                                                |
| 6     | Frozen `test`                | `deno task test`                                                                                                              | structured exit 0                                                                                                                                                                |
| 7     | Behavioral batch invariant   | Exact lint and fmt mixed selections at batch sizes 1, 2, 200                                                                  | both wrappers exit 2 at every size with identical per-tool dropped set and common `partial-exclusion` cause                                                                      |
| 8     | Root wrapper behavior        | `deno task lint` and non-mutating `deno task fmt:check`                                                                       | exit 0 for both root tasks; no rule weakened                                                                                                                                     |
| 9     | Frozen `quality-job`         | `deno task quality:scan` and `deno task arch:check`                                                                           | exit 0; `allowCount: 7`; no allowance/ignore added                                                                                                                               |
| 10    | Canonical regeneration       | `deno task gen:assets-barrel`, inspect name-only diff, run the same task again                                                | only `packages/cli/src/kernel/assets/agent-tools.generated.ts` changes; second run no delta; text/hash change is lint-only                                                       |
| 11    | Frozen `check:assets-barrel` | `deno task check:assets-barrel`                                                                                               | exit 0                                                                                                                                                                           |
| 12    | Frozen CLI `publish-dry-run` | `deno run --allow-read --allow-write --allow-run .llm/tools/release/run-publish-dry-run.ts --root . --member packages/cli`    | exit 0; lint embedded text/hash included; no export/API change; no fmt publish claim                                                                                             |
| 13    | Per-member CLI JSR audit     | `deno run --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/cli --text`            | exit 0 and internal dry run OK; 19 existing WARN baseline disclosed; no new leaf warning                                                                                         |
| 14    | Scope/idempotence            | Raw `git diff --name-only cf648f1ff...HEAD` plus clean second generator state                                                 | product/tool/config/generated delta exactly the six authorized paths; no lock/cache/workflow churn                                                                               |

The frozen proving-gate set is unchanged: `check`, `test`, `publish-dry-run`,
`quality-job`, and `check:assets-barrel`. Focused wrapper controls are slice
evidence, not a widened gate class. The CLI dry run and per-member JSR audit are
lint-driven; fmt carries no publish gate claim. Dependency evidence is N/A
because no dependency decision exists.

Pre-implementation drop-free baseline is evaluator cycle 1 §7 at `59b79ccd8`:
root lint `2037/35/0` exit 0; corrected lint `2041/36/0` exit 0; corrected lint
at batch size 1 `2041/2041/0` exit 0; root fmt at batch size 1 `2041/2041/0`,
findings 0, exit 0. Later slice evidence must reproduce these per-file rows
rather than infer coverage from a default-batch green.

## Fitness and publish implications

- F-6 / F-CLI publishability applies only because the lint wrapper is embedded.
  CLI dry run and per-member audit are required and must disclose the existing
  19 warnings.
- The fmt repair is repository-tool behavior only: no generated body, hash,
  export, or API change.
- F-7 documentation score is unchanged; existing public-doc debt is baseline.
- F-10 / A14 uses semantic disposable-project tests, not giant generated-string
  snapshots.
- F-19 requires structured wrapper evidence; raw Deno invocations above are
  parser controls, not final gate verdicts.
- Canonical generated constants preserve the JSR-safe embedded-asset pattern; no
  runtime file reads or import attributes are introduced.
- No new or deepened architecture debt is planned.

## Drift watch

Stop and report if implementation needs a seventh path, either adapter lacks a
reconcilable terminal processed count, root lint does not retain `2041/36/0`,
fmt cannot preserve its ordinary/write semantics, shared JSON causes diverge,
the generator touches another output, quality allowances change, the CLI audit
gains a new finding, or the current CI-root/publish-consumer bound changes.

## PLAN-EVAL judgement and stop

Cycle 1 returned `FAIL_PLAN` at evaluator commit `59b79ccd8`; F1-F3 and A1-A3
remain closed. Cycle 2 returned `FAIL_PLAN` at `f2b3fc8b3` on only F4 and
exhausted the ordinary two-cycle allowance. The owner accepted the evaluator's
recommended third write-mode completion form for this bounded amendment. There
is **no third PLAN-EVAL**. After this author commits, explicitly pushes, and
records the exact head on draft PR #1710, the coordinator runs a fresh Tier-A;
on `PASS`, the leaf stops for a separate implementation grant. This author does
not edit either evaluator artifact, issue an evaluator verdict, request a lease,
or begin implementation.
