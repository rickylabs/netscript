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
    read in full before this amendment.
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
| 10 | Fmt completion output is not symmetric with lint. Clean `deno fmt --check clean.ts` emits `Checked 1 file`; dirty-only emits `error: Found 1 not formatted file in 1 file`; dirty+clean emits `error: Found 1 not formatted file in 2 files`; excluded+clean emits `Checked 1 file`; all-excluded emits only `No target files found.`. Write mode emits `Checked N file(s)`, including when it rewrites a file. | Raw Deno 2.9.5 commands in disposable directories; ANSI-stripped stderr lines recorded during this amendment.               |
| 11 | The lint and fmt completion parsers therefore differ, but both yield the same primitive: Deno's processed-file count. Separate parser adapters are necessary; the selected-vs-processed identity rule and refusal wire schema can remain one shared contract.                                                                                                                                                   | Findings 4 and 10.                                                                                                          |
| 12 | The coordinator granted the exact six-path rescope because finding 9 met the frozen evidence condition. This supersedes the earlier deferral; no seventh path is authorized.                                                                                                                                                                                                                                    | Accepted rescope brief; `drift.md` append-only acceptance entry.                                                            |
| 13 | Publish consequence is lint-only. The coordinator verified at exact base that `.llm/tools/consumer-tools.json` includes `run-deno-lint.ts` but not `run-deno-fmt.ts`; only lint changes the generated consumer-tool text/hash. The fmt repair has no barrel, bundle-hash, publish, or export claim of its own.                                                                                                  | Settled coordinator finding in the accepted rescope brief; do not re-derive.                                                |
| 14 | Baseline per-member CLI JSR audit exits 0 and its internal dry-run is OK, but it reports 19 existing WARN findings (helper vocabulary, folder cardinality, and the known slow-types banner match).                                                                                                                                                                                                              | `audit-jsr-package.ts --root packages/cli --text`.                                                                          |
| 15 | The CLI doctrine verdict is `Keep`; existing warnings/debt are baseline. The generated constant preserves the registry-safe embedded-asset design.                                                                                                                                                                                                                                                              | Doctrine verdict, debt registry, generated asset.                                                                           |

## One selected-vs-processed identity contract

Both wrappers must expose and enforce the same contract. Tool-specific output
parsers are adapters that return a processed-file count; they do not define
different notions of coverage.

1. For each nearest-config batch, ANSI-strip the original Deno output and parse
   exactly one admissible completion summary:
   - lint: anchored `Checked N file(s)` for clean and ordinary finding runs;
   - fmt clean/write success: anchored `Checked N file(s)`;
   - fmt check with formatting findings: anchored
     `error: Found M not formatted file(s) in N file(s)`, taking the final `N`
     as processed.
2. Compare Deno's `N` with the number of selected files handed to that batch.
   Equality proves coverage for the batch.
3. If `N` is smaller, probe each selected member separately with the same Deno
   executable, command mode, `cwd`, effective `--config`, and explicit path.
   Lint accepts `Checked 1 file`; fmt accepts either `Checked 1 file` or the
   singular dirty summary ending `in 1 file`; either wrapper treats
   `No target files found.` as dropped.
4. Reconcile probe identities to the original processed count. Probes classify
   coverage only; their output never enters lint occurrence parsing, fmt finding
   parsing, crash rendering, or human diagnostics.
5. A wholly excluded batch directly classifies every selected member as dropped,
   but does not by itself choose the public cause. After aggregating all
   batches, derive the run-level cause from the selected set: zero selected is
   `empty-selection`; zero processed is `all-excluded`; any mix of processed and
   dropped is `partial-exclusion`. This keeps the cause independent of batching.

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

The batch-size invariant is semantic and run-level: for any positive batch size,
an identical selected set must produce the same coverage exit, cause,
processed/dropped identities, and diagnostic multiplicity. Persistent controls
exercise the boundary sizes 1, 2, and 200.

### Trust and failure modes

- Trust comes from Deno's own terminal processed-count statement plus
  same-command per-file classification only on mismatches, not from wrapper
  enumeration.
- Missing, duplicate, malformed, negative, overlarge, or mutually contradictory
  completion summaries on a result otherwise classed as clean or an ordinary
  finding refuse with exit 2.
- A mismatch whose probes do not reconcile, an ambiguous probe, or a file/config
  race refuses with exit 2 and lists known dropped paths plus unreconciled
  candidates.
- A recognized existing crash remains non-zero and keeps its existing diagnostic
  record; it cannot become green. Coverage metadata must not duplicate crash
  output.
- Original-batch diagnostics remain the only diagnostics. Probe output is never
  copied into JSON or stderr, so ordinary lint/fmt findings still appear once.

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
- Existing crash handling remains non-zero and diagnostic.
- Fmt write mode continues to use Deno's `Checked N` summary and does not lose
  coverage proof.
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

- **Must resolve now:** none. Signals, shared coverage contract, exact six-path
  envelope, ordering, refusal semantics, publish consequence, and gates are
  locked.
- **Safe to defer:** local helper/type names and exact internal parser function
  names. They do not change the common JSON/exit contract and can be reviewed
  during the later implementation phase.
