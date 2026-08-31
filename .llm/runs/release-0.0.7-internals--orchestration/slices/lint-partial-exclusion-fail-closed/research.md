# Research — lint/fmt partial-exclusion fail-closed

## Re-baseline

- Carried-in sources:
  - issue [#1709](https://github.com/rickylabs/netscript/issues/1709), read live
    on 2026-08-28;
  - frozen leaf contract from
    `.llm/runs/release-0.0.7--orchestration/leaf-contracts.json` at `4686fab33`;
  - supervisor research
    `.llm/runs/release-0.0.7-internals--orchestration/research/l2-lint-exclusion-false-green.md`
    at topic checkpoint `d682db680`;
  - accepted rescope brief
    `/home/codex/repos/netscript-007-internals/.llm/runs/release-0.0.7-internals--orchestration/briefs/1709-rescope-six-path.md`,
    read in full before the six-path amendment;
  - owner-accepted F4 amendment brief
    `/home/codex/repos/netscript-007-internals/.llm/runs/release-0.0.7-internals--orchestration/briefs/1709-f4-amendment.md`,
    read in full before this bounded amendment.
- Re-derived against exact `main` baseline
  `cf648f1ff973d74c213bb125a6f5f5b9328e693b` on Deno 2.9.5.
- The coordinator accepted the formatter finding into this leaf. The
  implementation envelope is now exactly six paths: both wrappers and their
  focused tests, `deno.json`, and the generated CLI asset.
- No repository source was edited for research. Temporary controls used
  `Deno.makeTempDir()` and were removed in `finally` blocks.

## Findings

| #  | Finding                                                                                                                                                                                                                                                                                                                                                                                                         | How to verify                                                                                                               |
| -- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 1  | The lint runner hands every batch directly to `deno lint`, but `runLint` immediately accepts any exit-0 result and recognizes `No target files found.` only on non-zero batches. It records selected counts, not processed identity.                                                                                                                                                                            | `.llm/tools/run-deno-lint.ts:436-523`, `:688-742`                                                                           |
| 2  | The clean two-file lint selection `.llm/tools/run-deno-lint.ts` plus `.github/scripts/ci-classify-changes.ts` makes raw Deno say `Checked 1 file`; the wrapper reports `filesSelected: 2`, one batch, zero failures, and exits 0.                                                                                                                                                                               | Run raw `deno lint` and then the wrapper with those exact two `--file` values.                                              |
| 3  | The identical lint selection at `--batch-size 1` exits 2 with one excluded batch. The verdict therefore depends on batch construction, not the selected-file set.                                                                                                                                                                                                                                               | Repeat finding 2 with `--batch-size 1`.                                                                                     |
| 4  | Deno 2.9.5 lint emits a final `Checked N file(s)` line for both clean and ordinary diagnostic runs. A `no-explicit-any` control printed `Found 1 problem` then `Checked 1 file`; bad+clean printed `Checked 2 files`.                                                                                                                                                                                           | Temporary root with `no-explicit-any`; invoke raw `deno lint` over bad and bad+clean.                                       |
| 5  | Root lint is green as shipped at `2037` selected files / `35` batches. Removing only the root task's doctor-family wrapper `--exclude` term yields `2041` / `36`, still with zero failed batches and exit 0.                                                                                                                                                                                                    | Run the root lint wrapper command from `deno.json`, then repeat without `packages/mcp/tests/fixtures/doctor/` in its regex. |
| 6  | The +4 files are the healthy doctor fixture files. The malformed `doctor/broken` sibling remains outside wrapper selection because its subtree owns `.deno-fmt-lint-ignore`; the root `lint.exclude` doctor entry remains inert under the healthy subtree's nearest `deno.json`.                                                                                                                                | Inspect `packages/mcp/tests/fixtures/doctor/{healthy,broken}` and wrapper marker/config batching.                           |
| 7  | The current gate catalog maps `lint` to `deno task lint`, whose wrapper roots are only `packages` and `plugins`; `.llm` and `tools` are not selected. This defect is not a current CI false green, though the lint wrapper ships to consumers.                                                                                                                                                                  | `deno.json` root task; `.llm/tools/gates/catalog.ts`; `.llm/tools/consumer-tools.json`.                                     |
| 8  | `run-deno-lint.ts` is embedded as text in the CLI agent-tool bundle. Changing it changes `agent-tools.generated.ts` and `EMBEDDED_AGENT_TOOL_BUNDLE_HASH` without changing a CLI export or API.                                                                                                                                                                                                                 | `.llm/tools/generate-cli-assets-barrel.ts`; generated barrel constants.                                                     |
| 9  | **Formatter defect, now in scope.** With `fmt.exclude: ["generated/"]`, an excluded unformatted `generated/bad.ts` mixed with clean `clean.ts` reports `filesSelected: 2`, one batch, zero findings, exit 0. The identical selection at batch size 1 exits 2. An included copy of the same bad text exits 1 with a genuine formatting finding.                                                                  | `.llm/tools/run-deno-fmt.ts:420-602`; disposable mixed/split/included controls.                                             |
| 10 | Fmt completion output is not symmetric with lint and has three admissible mode-specific forms. Clean check and successful write emit `Checked N file(s)`; check findings/crashes emit `error: Found M not formatted file(s) in N file(s)`; write crashes emit ANSI-prefixed `error: Failed to format M of N checked file(s)`, with the second integer as processed count. Independently measured write controls: good+syntax exit 1 with `1 of 2 checked files`; syntax-only exit 1 with `1 of 1 checked file`; two syntax+good exit 1 with `2 of 3 checked files`. All-excluded still emits only `No target files found.`. | Raw Deno 2.9.5 commands in `Deno.makeTempDir()` directories outside the checkout; stdout/stderr captured separately and temp roots removed in `finally`. |
| 11 | The lint and fmt completion parsers therefore differ, but both yield the same primitive: Deno's processed-file count. Separate parser adapters are necessary; the selected-vs-processed identity rule and refusal wire schema can remain one shared contract.                                                                                                                                                   | Findings 4 and 10.                                                                                                          |
| 12 | The coordinator granted the exact six-path rescope because finding 9 met the frozen evidence condition. This supersedes the earlier deferral; no seventh path is authorized.                                                                                                                                                                                                                                    | Accepted rescope brief; `drift.md` append-only acceptance entry.                                                            |
| 13 | Publish consequence is lint-only. The coordinator verified at exact base that `.llm/tools/consumer-tools.json` includes `run-deno-lint.ts` but not `run-deno-fmt.ts`; only lint changes the generated consumer-tool text/hash. The fmt repair has no barrel, bundle-hash, publish, or export claim of its own.                                                                                                  | Settled coordinator finding in the accepted rescope brief; do not re-derive.                                                |
| 14 | Baseline per-member CLI JSR audit exits 0 and its internal dry-run is OK, but it reports 19 existing WARN findings (helper vocabulary, folder cardinality, and the known slow-types banner match).                                                                                                                                                                                                              | `audit-jsr-package.ts --root packages/cli --text`.                                                                          |
| 15 | The CLI doctrine verdict is `Keep`; existing warnings/debt are baseline. The generated constant preserves the registry-safe embedded-asset design.                                                                                                                                                                                                                                                              | Doctrine verdict, debt registry, generated asset.                                                                           |
| 16 | PLAN-EVAL cycle 1 confirmed only lint currently has an injectable runner seam (`BatchRunner`/`denoLintRunner`/optional `runner`). Fmt's private `runBatch` directly calls `Deno.Command`; S3 must introduce an equivalent local seam for malformed-summary and inconsistent-probe unit fixtures.                                                                                                                | Evaluator `plan-eval.md` F1 at commit `59b79ccd8`; wrapper lines cited there.                                               |
| 17 | Deno emits processed-count summaries even on parse-error batches: lint parse-error + good ends `Checked 2 files`; fmt check parse-error + good ends `Found 1 not formatted file in 2 files`; both exit 1 through today's crash classification. Coverage can and must be evaluated before crash precedence.                                                                                                      | Evaluator re-derivation §§1, 3 and F2.                                                                                      |
| 18 | Per-file evaluator controls prove the root selections are already drop-free: corrected lint is `2041/2041/0`, exit 0 at batch size 1; root fmt is `2041/2041/0`, findings 0, exit 0. These are stronger than default-batch `failedBatches: 0`.                                                                                                                                                                  | Evaluator `plan-eval.md` §7.                                                                                                |
| 19 | PLAN-EVAL cycle 2 closed F1, F3, and A1-A3 and left only F4 as the write-mode extension of F2. The owner accepted the recommended third fmt form; the ordinary two-cycle allowance is exhausted and no third PLAN-EVAL exists.                                                                                                                                                                                               | Evaluator `plan-eval.md` at `f2b3fc8b3`; owner amendment brief.                                                             |

## One selected-vs-processed identity contract

Both wrappers must expose and enforce the same contract. Tool-specific output
parsers are adapters that return a processed-file count; they do not define
different notions of coverage.

1. For each nearest-config batch, ANSI-strip the original Deno output and parse
   exactly one admissible completion summary:
   - lint: anchored `Checked N file(s)` for clean, finding, and parse-error
     crash runs;
   - fmt clean/write success: anchored `Checked N file(s)`;
   - fmt check with formatting findings or parse-error crash classification:
     anchored `error: Found M not formatted file(s) in N file(s)`, taking the
     final `N` as processed;
   - fmt write with a parse-error crash: anchored
     `error: Failed to format M of N checked file(s)`, taking the final `N` as
     processed. This third form is write-only.
2. Compare Deno's `N` with the number of selected files handed to that batch.
   Equality proves coverage for the batch.
3. If `N` is smaller, probe each selected member through an injectable runner
   with the same Deno executable, `cwd`, effective `--config`, and explicit
   path. Lint reuses its existing seam. S3 introduces the missing equivalent
   inside `run-deno-fmt.ts`. Lint accepts `Checked 1 file`; fmt probes accept
   either `Checked 1 file` or the singular summary ending `in 1 file`; either
   wrapper treats `No target files found.` as dropped. After an original fmt
   write batch, probes deliberately use non-mutating `deno fmt --check`.
4. Reconcile probe identities to the original processed count. Probes classify
   coverage only; their output never enters lint occurrence parsing, fmt finding
   parsing, crash rendering, or human diagnostics.
5. A wholly excluded batch directly classifies every selected member as dropped,
   but does not by itself choose the public cause. After aggregating all
   batches, derive the run-level cause from the selected set: zero selected is
   `empty-selection`; zero processed is `all-excluded`; any mix of processed and
   dropped is `partial-exclusion`. This keeps the cause independent of batching.
6. Evaluate completion counts and mismatch probes on recognized crash batches as
   well as clean/finding batches. Lock precedence as refusal ≥ crash ≥ ordinary
   finding: any coverage refusal exits 2; a completely covered crash exits 1 and
   retains its existing diagnostic once.

The common machine shape is one top-level `coverage` object in both reports:

```json
{
  "coverage": {
    "filesSelected": 2,
    "filesProcessed": 1,
    "droppedFiles": ["generated/bad.ts"],
    "refusals": [
      {
        "cause": "partial-exclusion",
        "filesSelected": 2,
        "filesProcessed": 1,
        "droppedFiles": ["generated/bad.ts"]
      }
    ]
  }
}
```

The finite causes are shared verbatim by both wrappers: `empty-selection`,
`all-excluded`, `partial-exclusion`, `processed-count-unavailable`, and
`processed-count-inconsistent`. `unverifiedFiles` is present only when identity
cannot be reconciled. Existing lint `selection` and fmt `summary` fields remain
for compatibility; the new `coverage` object is the common consumer contract. No
seventh shared source module is justified or authorized, so each wrapper uses a
local adapter while focused tests assert identical keys and causes across both
JSON reports.

Lint `--input` mode omits `coverage` entirely because a saved log has no wrapper
selection identity to prove; this matches its existing omission of `selection`.

The batch-size invariant is semantic and run-level: for any positive batch size,
an identical selected set must produce the same coverage exit, cause,
processed/dropped identities, and diagnostic multiplicity. Persistent controls
exercise the boundary sizes 1, 2, and 200.

### Trust and failure modes

- Trust comes from Deno's own terminal processed-count statement plus
  same-config per-file classification only on mismatches, not from wrapper
  enumeration. Fmt write-mode probes are non-mutating `--check` classifications.
- Missing, duplicate, malformed, negative, overlarge, or mutually contradictory
  completion summaries on a clean, finding, or crash batch refuse with exit 2.
- A mismatch whose probes do not reconcile, an ambiguous probe, or a file/config
  race refuses with exit 2 and lists known dropped paths plus unreconciled
  candidates.
- A recognized existing crash participates in coverage accounting. Complete
  coverage keeps exit 1; a simultaneous refusal wins with exit 2. Its existing
  diagnostic renders once, and coverage metadata never copies crash output.
- Original-batch diagnostics remain the only diagnostics. Probe output is never
  copied into JSON or stderr, so ordinary lint/fmt findings still appear once.
- Parser fixtures pin LF and CRLF termination plus ANSI-wrapped fmt `error:`
  prefixes, including singular/plural `Failed to format M of N checked
  file(s)` write-crash summaries.

## Persistent REDs and controls

### Lint mixed-batch RED

In a disposable project whose root config excludes `.llm/`:

- `.llm/tools/probe.ts` contains a real `no-explicit-any` violation;
- `.github/scripts/ci-classify-changes.ts` is lint-clean;
- an included copy of the bad text proves the rule is active and exits 1;
- the mixed wrapper selection must exit 2, report the excluded
  `.llm/tools/probe.ts` once, and use cause `partial-exclusion`;
- batch sizes 1, 2, and 200 must produce the same exit-2 verdict and
  dropped-file set.

### Fmt mixed-batch RED

In a disposable project with `fmt.exclude: ["generated/"]`:

- `generated/bad.ts` is deliberately unformatted and excluded;
- `clean.ts` is included and already formatted;
- an included copy of the bad text proves genuine formatting detection and exits
  1;
- the mixed wrapper selection must exit 2, report `generated/bad.ts` once, and
  use the same `partial-exclusion` cause as lint;
- batch sizes 1, 2, and 200 must produce the same exit-2 verdict and
  dropped-file set.

### Must-not-regress for both wrappers

- Pure all-excluded selection remains exit 2 and reports all selected dropped
  paths with the same `all-excluded` cause.
- Empty selection remains exit 2 with `empty-selection`.
- Fully processed clean selection remains exit 0 with selected count equal to
  processed count.
- Ordinary lint findings and ordinary fmt differences remain exit 1; their
  diagnostics appear once.
- Crash-only controls remain exit 1 with complete coverage; crash+drop controls
  exit 2 with the same `partial-exclusion` JSON at batch sizes 1, 2, and 200;
  diagnostics render once.
- Fmt write mode proves original-batch coverage through `Checked N` on success
  or `Failed to format M of N checked file(s)` on a crash, using `N`; mismatch
  probes use non-mutating `--check`. Write crash-only and crash+drop controls at
  1, 2, and 200 have the same exit/coverage JSON as their check-mode peers, so a
  complete write crash remains exit 1.
- No Deno rule, formatter rule, inline ignore, or allowance is weakened.
  `quality:scan --max-allow 7` must still report `allowCount: 7`.

## Publish / JSR surface scan

- Only the changed lint wrapper is a published consumer tool. Canonical
  regeneration changes its embedded text plus `EMBEDDED_AGENT_TOOL_BUNDLE_HASH`
  in `packages/cli/src/kernel/assets/agent-tools.generated.ts`.
- `run-deno-fmt.ts` is absent from the consumer manifest. Its repair has no
  generated consumer body, no bundle-hash consequence, and no publish/export/API
  claim.
- Required lint-driven evidence: canonical generation and idempotence, generated
  delta limited to the one barrel, `check:assets-barrel`, CLI publish dry run,
  per-member CLI JSR audit, and honest disclosure of the existing 19 WARN
  findings.
- `@netscript/cli` exports remain `.`, `./scaffolding`, and `./testing`. No
  runtime file read, import attribute, new top-level `import.meta` dependency,
  version, or public API is planned.

## Open questions

- **Must resolve now:** none after the owner-accepted F4 amendment. The missing
  fmt seam, crash/coverage precedence, check/write crash JSON controls,
  drop-free root proof, advisories A1-A3, and the third fmt write completion
  form are locked.
- **Safe to defer:** local helper/type names and exact internal parser function
  names. They do not change the common JSON/exit contract and can be reviewed
  during the later implementation phase.
