# Research — lint-partial-exclusion-fail-closed

## Re-baseline

- Carried-in sources:
  - issue [#1709](https://github.com/rickylabs/netscript/issues/1709), read live on 2026-08-28;
  - frozen leaf contract from `.llm/runs/release-0.0.7--orchestration/leaf-contracts.json` at
    `4686fab33`;
  - supervisor research
    `.llm/runs/release-0.0.7-internals--orchestration/research/l2-lint-exclusion-false-green.md` at
    topic checkpoint `d682db680`.
- Re-derived against exact `main` baseline `cf648f1ff973d74c213bb125a6f5f5b9328e693b` on Deno 2.9.5.
- The supervisor's lint findings and counts remain current. The mandatory format-wrapper audit adds
  a significant out-of-envelope finding: `run-deno-fmt.ts` has the analogous generic mixed-batch
  false green and needs an explicit coordinator rescope before it can be changed.

No source file was edited for research. Temporary Deno fixtures were created under
`Deno.makeTempDir()` and removed in `finally` blocks.

## Findings

| #  | Finding                                                                                                                                                                                                                                                                                                                                                       | How to verify                                                                                                                              |
| -- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1  | The lint runner hands every batch directly to `deno lint`, but `runLint` immediately accepts any exit-0 result and only recognizes `No target files found.` on non-zero batches. It records selected counts, not processed identities.                                                                                                                        | `.llm/tools/run-deno-lint.ts:436-450`, `:469-523`, `:688-710`                                                                              |
| 2  | The clean two-file mixed selection (`.llm/tools/run-deno-lint.ts` plus `.github/scripts/ci-classify-changes.ts`) makes raw Deno say `Checked 1 file`; the wrapper reports `filesSelected: 2`, one batch, zero failures, and exits 0.                                                                                                                          | `deno lint .llm/tools/run-deno-lint.ts .github/scripts/ci-classify-changes.ts`; then the wrapper with those exact two `--file` arguments   |
| 3  | The identical lint selection at `--batch-size 1` exits 2 with `excludedBatches: 1`. Verdict therefore depends on batching rather than selected-file coverage.                                                                                                                                                                                                 | Repeat finding 2's wrapper command with `--batch-size 1`                                                                                   |
| 4  | Deno 2.9.5 prints a final `Checked N file(s)` summary on both clean lint runs and ordinary lint-finding runs. A temporary `no-explicit-any` control printed `Found 1 problem` followed by `Checked 1 file`; the same bad+clean pair printed `Checked 2 files`.                                                                                                | Temporary root with a `no-explicit-any` rule; invoke `deno lint bad.ts` and `deno lint bad.ts clean.ts`                                    |
| 5  | Root lint is green as shipped at `2037` selected files / `35` batches. Removing only the task-level doctor regex term yields `2041` / `36`, still with zero failed batches and exit 0.                                                                                                                                                                        | Run the root lint wrapper command from `deno.json:151-160`, then repeat without `packages/mcp/tests/fixtures/doctor/` in the wrapper regex |
| 6  | The +4 files are the healthy doctor fixture files. The malformed `doctor/broken` sibling remains outside wrapper selection because its subtree owns `.deno-fmt-lint-ignore`; the root `lint.exclude` doctor entry remains inert under the healthy subtree's nearest `deno.json`.                                                                              | `packages/mcp/tests/fixtures/doctor/{healthy,broken}` and `.llm/tools/run-deno-lint.ts` marker/config batching code                        |
| 7  | The current CI gate catalog invokes the root `lint` task over only `packages` and `plugins`; it does not select `.llm` or `tools`. This is not a current CI false green, though the wrapper behavior is shipped to consumers.                                                                                                                                 | `deno.json:151-160`; `.llm/tools/gates/catalog.ts`; `.llm/tools/consumer-tools.json`                                                       |
| 8  | `run-deno-lint.ts` is embedded as text in the published CLI agent-tool bundle. Changing it changes `packages/cli/src/kernel/assets/agent-tools.generated.ts` and `EMBEDDED_AGENT_TOOL_BUNDLE_HASH` even though no CLI export or API changes.                                                                                                                  | `.llm/tools/generate-cli-assets-barrel.ts:267-325`; generated barrel constant                                                              |
| 9  | **Mandatory fmt audit: affected.** In a temporary project with `fmt.exclude: ["generated/"]`, an excluded unformatted `generated/bad.ts` mixed with clean `clean.ts` produces `filesSelected: 2`, one batch, zero findings, exit 0. The identical selection at batch size 1 exits 2. An included copy of the bad text exits 1 with a real formatting finding. | `run-deno-fmt.ts:420-438`, `:533-602`; temporary mixed/split controls                                                                      |
| 10 | The format defect is not in the frozen four-path contract. Mutating `run-deno-fmt.ts` or its tests requires explicit coordinator rescope and must not be folded into #1709 silently.                                                                                                                                                                          | Frozen leaf contract `fmtBoundary`; brief absolute bound                                                                                   |
| 11 | Baseline per-member CLI JSR audit exits 0 and its internal dry-run is OK, but it is not warning-free: it reports 19 existing findings (forbidden `helpers` vocabulary, folder-cardinality warnings, and the known slow-types banner match).                                                                                                                   | `deno run --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/cli --text`                         |
| 12 | The CLI doctrine verdict is `Keep`; existing audit/debt warnings are baseline, not scope for this leaf. The generated constant preserves the registry-safe embedded-asset design.                                                                                                                                                                             | `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md`; `.llm/harness/debt/arch-debt.md`                                          |

## Selected-vs-processed signal assessment

The only normal batch-level identity signal Deno exposes is the final `Checked N file(s)` count. It
does not list clean processed paths. The trustworthy plan is therefore a two-stage proof:

1. Parse exactly one anchored, ANSI-stripped `Checked N file(s)` summary from the original batch.
   The count is Deno's own statement of processed inputs and appears after both clean and ordinary
   diagnostic runs.
2. If `N` is smaller than the batch handed to Deno, probe each batch member separately using the
   exact same Deno executable, `cwd`, effective `--config`, and explicit file path. A per-file
   `No target files found.` identifies a dropped path; `Checked 1 file` identifies a processed path.
   Probe output is classification-only and is never fed into the occurrence parser.

This preserves a single diagnostic source: the original batch. The structured report can list the
dropped paths and coverage-refusal cause without repeating probe or lint diagnostics.

Failure modes must themselves fail closed:

- missing, duplicate, malformed, negative, or overlarge `Checked` counts;
- a mismatch that per-file probes cannot reconcile to the original count;
- a probe that returns neither `No target files found.` nor `Checked 1 file`;
- file/config races between the batch and probes.

For those cases the report should use a machine-readable coverage-verification cause and list any
directly proven dropped paths plus the unreconciled candidate paths. Existing crash/finding records
remain the sole home for diagnostics.

## Mixed-batch RED and controls

The persistent RED must reproduce the exact reachable path classes in a temporary project whose root
config excludes `.llm/`:

- excluded file: `.llm/tools/probe.ts`, containing a real `no-explicit-any` violation;
- included peer: `.github/scripts/ci-classify-changes.ts`, lint-clean;
- control: the same violating text at an included path exits 1 with `no-explicit-any`;
- mixed command: wrapper
  `--file .llm/tools/probe.ts --file
  .github/scripts/ci-classify-changes.ts --batch-size 200`;
- expected repaired verdict: exit 2, exact dropped file reported, cause `partial-exclusion`, and no
  false complete-coverage claim;
- invariant: the same selected set at batch sizes 1, 2, and 200 has the same refusal verdict and
  dropped-file set.

Must-not-regress controls are pure all-excluded selection (exit 2 with the path), empty selection
(exit 2), ordinary findings (exit 1 with diagnostics once), clean fully processed selection (exit
0), and batch crash handling.

## jsr-audit surface scan

- Planned published surface: the generated constant
  `packages/cli/src/kernel/assets/agent-tools.generated.ts`, regenerated from the changed internal
  lint wrapper. `@netscript/cli` exports remain `.`, `./scaffolding`, and `./testing` unchanged.
- Publish consequence: embedded consumer-tool text and `EMBEDDED_AGENT_TOOL_BUNDLE_HASH` change.
  This is a shipped behavior delta but **not** an export/API delta.
- Required implementation evidence: canonical member dry-run, per-member CLI JSR audit, published
  file-list review, generated-asset freshness/idempotence, and a static check that no runtime file
  read, import attribute, or new top-level `import.meta` dependency was introduced.
- Baseline debt: the 19 WARN-level audit findings above must be reported as pre-existing. A zero
  process exit must not be summarized as a warning-free audit.

## Open questions

- **Leaf decisions:** none. Repair, sequence, file surface, gates, and PLAN-EVAL stop are frozen.
- **Safe to defer / requires separate decision:** whether and when to rescope the analogous format
  defect. It does not force rework in the lint leaf because the wrappers and tests are separate.
