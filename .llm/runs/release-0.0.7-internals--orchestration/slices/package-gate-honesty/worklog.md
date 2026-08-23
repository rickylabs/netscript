# Worklog: package-gate-honesty

## Run Metadata

| Field          | Value                                                                |
| -------------- | -------------------------------------------------------------------- |
| Run ID         | `release-0.0.7-internals--orchestration/slices/package-gate-honesty` |
| Branch         | `fix/package-gate-honesty`                                           |
| Archetype      | `6 — CLI / Tooling` (supporting MCP member remains A2)               |
| Scope overlays | `docs`                                                               |

## Design

### Public surface

- No package export, subpath, symbol, binary, or command name changes.
- `@netscript/cli` has an intentional published-byte delta: canonical regeneration embeds the
  changed consumer `run-deno-lint.ts` and updates `EMBEDDED_AGENT_TOOL_BUNDLE_HASH`; an upgrading
  consumer receives marker-aware, nearest-config-batched lint selection.
- `@netscript/mcp` keeps `GUIDANCE_RANKING_POLICY` internal to its source graph; only the rationale
  comment and test change.
- Root Deno configuration appends the doctor family to the existing `fmt.exclude` list solely to
  stop raw `deno fmt` walks from reverting fixture-local-default formatting. It does not use
  top-level `exclude`, must not affect `check`/`lint`/`test` selection, and removes the `fmt:check`
  task's wrapper-level family exclusion. Root `lint.exclude` retains its doctor entry because nested
  config precedence keeps explicitly named healthy files genuinely linted.
- The optimized fmt/lint wrappers gain two shared conventions: a marker excludes only its own
  subtree, and selected files are grouped by effective nearest Deno config before explicit argv is
  built. Nearest-config lookup is memoized per normalized directory before root-scale use.

### Domain vocabulary

- **Gate honesty** — a gate fires on its intended subject, distinguishes a finding from a crash, and
  fails when its protected condition regresses.
- **Repository-owned path** — a path anchored to the owning module/repository, never ambient cwd.
- **Invalid-config fixture** — checked-in malformed config explicitly read by a test, never consumed
  through automatic configuration discovery.
- **Close-score group** — same-route candidates no more than `closeScoreGap` below one group leader.
- **Inside control / outside control** — candidates whose ordering observably changes if the
  threshold narrows/widens.

### Ports

- None. All changed behavior uses Deno/Web Platform primitives at existing test/tooling edges.

### Constants

- `GUIDANCE_RANKING_POLICY.closeScoreGap = 0.5` remains unchanged.
- Empirical values documented beside it: observed gap ≈ `0.3019801981861221`; headroom
  `0.1980198018138779`; observed regeneration movement `0.0748587451731435`.
- Test-only outside epsilon is strictly greater than zero and chosen to remain observable.

### Commit slices

| #  | Slice                                                                                                                                                                                    | Gate                                                                                                                                                                          | Exact files                                       |
| -- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| S1 | Make optimized MCP fmt/lint selection marker- and config-aware while retaining every unmarked sibling; preserve doctor check coverage; regenerate the published CLI consumer tool asset. | Both exact wrappers green at 114 + marked/unmarked/config-batch equality tests + doctor scoped check 5/0 + negative controls + doctor/semantic proof + `check:assets-barrel`. | Eight exact S1 paths in `plan.md`                 |
| S2 | Make all three CLI tests package-cwd independent without weakening assertions.                                                                                                           | Structured targeted 6/6 + exact package task + docs gates; final runtime consumer in S4.                                                                                      | Three exact CLI files in `plan.md`                |
| S3 | Pin close-score policy on both sides and record rationale.                                                                                                                               | Targeted test + widen/narrow RED controls + scoped MCP/quality gates.                                                                                                         | `guidance-index.ts`; `guidance-retrieval_test.ts` |
| S4 | Integrated evidence for the applicable frozen gate set.                                                                                                                                  | Static/test/docs/publish/JSR/generated-asset freshness gates; `scaffold.runtime` recorded coordinator-waived `n/a`.                                                           | Run artifacts/evidence only                       |

### Deferred scope

- Any fourteenth product/config path, other wrapper/CI change, docs edit, malformed-fixture repair,
  public API change, dependency update, or algorithm change.
- `scaffold.runtime`, Aspire, Docker, and `e2e:cli`; the gate is waived `n/a`, not pending.
- All implementation until the topic supervisor completes the owner-authorized Tier-A stand-in
  review. Cycle 3 was final; no cycle 4 or further evaluator exists.

### Contributor path

To extend these guards, keep repository-owned paths module-relative; mark only the deliberately
invalid subtree, group explicit argv by nearest config, and pair marked/unmarked selection tests;
for tuned ordering boundaries add one candidate on each side whose identity order conflicts with
score order. Then prove both green behavior and a controlled red mutation through structured gates.

## Progress log

| Time       | Slice     | Step                       | Notes                                                                                                                                                                                                                                                              |
| ---------- | --------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-08-15 | bootstrap | activated                  | Exact worktree/branch/base verified; coordinator thread record preserved; commit `25c29575c`; draft PR #1663 opened.                                                                                                                                               |
| 2026-08-15 | research  | live issue/source read     | All three issues fetched live; exact three-test reproduction returned 3 pass / 3 fail from package cwd.                                                                                                                                                            |
| 2026-08-15 | research  | fmt controls               | Baseline exact command: 115 selected, config crash; wrapper exclude: 110 selected/green; explicit root config: 115 selected/green.                                                                                                                                 |
| 2026-08-15 | plan      | Design checkpoint          | Six-file authoritative surface locked; formal PLAN-EVAL selected; implementation remains prohibited.                                                                                                                                                               |
| 2026-08-15 | plan-eval | cycle 1                    | `FAIL_PLAN` at evaluator commit `be2b18728`: root `exclude` cannot affect explicit wrapper argv; no product/config implementation occurred.                                                                                                                        |
| 2026-08-15 | plan      | coordinator rescope        | Authority expanded to eleven exact paths: fmt/lint wrappers + tests and one marker; `scaffold.runtime` waived `n/a`.                                                                                                                                               |
| 2026-08-15 | plan      | rejected proof draft       | Parent-family marker made both wrappers green at 110 by excluding four unmarked healthy files; coordinator rejected it before push as a silent false-positive exclusion.                                                                                           |
| 2026-08-15 | plan      | corrected mechanism proof  | Child-only marker + nearest-config batching selects 114: lint green, fmt one honest healthy-fixture finding, doctor 4/4, negative controls red, restorations byte-exact.                                                                                           |
| 2026-08-15 | plan      | twelfth-path scratch proof | Formatting only `healthy/netscript.config.ts` makes exact fmt green at 114; lint and doctor remain green. Checkout path untouched pending grant.                                                                                                                   |
| 2026-08-15 | plan      | twelfth-path grant         | Coordinator authorized that exact formatting-only path, bringing the then-current bound to twelve; no semantic/config-value change. Cycle-2 F1 later superseded that bound.                                                                                        |
| 2026-08-15 | plan      | final 114-file proof       | Both exact no-extra-flag wrappers green; all four healthy TS files individually named selected; doctor/parsed meaning/hash/negative-control requirements proved.                                                                                                   |
| 2026-08-15 | plan-eval | cycle 2                    | `FAIL_PLAN` at evaluator commit `c415daad2`: planned lint-wrapper bytes also ship in the published CLI asset barrel; ordinary two-cycle allowance exhausted.                                                                                                       |
| 2026-08-15 | plan      | thirteenth-path grant      | Coordinator granted canonical regeneration of exactly `agent-tools.generated.ts`, required generated-asset freshness, removal of the root task-level parent skip, corrected fixture-style wording, and nearest-config memoization. No implementation file changed. |
| 2026-08-23 | plan-eval | cycle 3 final              | Owner-authorized `FAIL_PLAN` at `65c5e1ac4`: prior repairs and 114/2 acceptance passed, but planned top-level `exclude` silently removed all five doctor TS files from `deno check`. No cycle 4 exists.                                                            |
| 2026-08-23 | plan      | owner-granted F1 amendment | Keep thirteen paths; move raw-walk protection to the existing `fmt.exclude` list, add explicit config-precedence/check-coverage obligations, retain justified `lint.exclude`, and hand off to Tier-A as the final plan gate.                                       |

## Decisions

| Decision                                             | Reason                                                                                                                                                                                                   | Source                                   |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Child-only marker + memoized nearest-config batching | Only the marked broken subtree may leave selection; grouping prevents config poisoning while keeping all four healthy files visible, and directory memoization makes the same rule viable at root scale. | plan L3/L4/L11; corrected pre-plan proof |
| Canonically regenerated published lint asset         | `run-deno-lint.ts` is embedded in published CLI source; freshness and consumer behavior must be explicit.                                                                                                | cycle-2 F1; plan L7                      |
| Section-scoped fmt exclusion only                    | Top-level root exclusion silently drops doctor files from `deno check`; existing `fmt.exclude` protects only raw formatter walks.                                                                        | cycle-3 F1; plan L3/L10                  |
| Module-derived paths                                 | Package cwd is the defect; module location is stable.                                                                                                                                                    | plan L1/L2                               |
| Bidirectional score controls                         | Current identity ordering masks both threshold directions.                                                                                                                                               | research R10-R12; plan L5/L6             |
| Formal PLAN-EVAL                                     | Multi-member/config/docs/JSR/runtime interactions are decision-heavy.                                                                                                                                    | run-loop §4; plan judgement              |

## Drift

| Drift                                                                                                               | Severity                       | Logged in drift.md |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ------------------ |
| Launcher preseeded exact thread record before clean check.                                                          | minor                          | yes                |
| Root task already had a wrapper-level fixture exclude, but standalone acceptance command remains red.               | minor research clarification   | yes                |
| R8 root-exclusion conclusion was falsified by evaluator execution.                                                  | significant                    | yes                |
| Child-only marker proof selected 114 but left fmt red on the healthy nested config.                                 | significant design finding     | yes                |
| Coordinator expanded the edit surface from six to eleven paths and waived `scaffold.runtime`.                       | significant authorized rescope | yes                |
| Parent-family 110-file draft silently removed four unmarked healthy files and was rejected before push.             | significant plan correction    | yes                |
| One genuine healthy-fixture fmt finding exposed a twelfth-path repair; proof led to an exact formatting-only grant. | significant resolved rescope   | yes                |
| Coordinator granted the exact formatting-only twelfth path after the honest 114-file finding.                       | significant authorized rescope | yes                |
| Cycle 2 exposed the published lint-wrapper asset and generated freshness gate omitted by the twelve-path plan.      | significant plan correction    | yes                |
| Coordinator granted the generated barrel as exact path thirteen and ruled on root task exclusion/style wording.     | significant authorized rescope | yes                |
| Cycle 3 proved the planned top-level exclusion causes a silent five-file `deno check` coverage regression.          | significant plan correction    | yes                |
| Owner granted the in-path `fmt.exclude` amendment and Tier-A stand-in review; no fourth evaluator.                  | significant authorized fix     | yes                |

## Gate results

### Research diagnostics (not merge evidence)

| Check                                        | Result           | Notes                                                                        |
| -------------------------------------------- | ---------------- | ---------------------------------------------------------------------------- |
| Targeted three-file package-cwd test         | FAIL as expected | Structured report: 3 pass / 3 fail; exact three `NotFound` paths reproduced. |
| Exact scoped MCP fmt                         | FAIL as expected | 115 selected; one config-parse crash; zero findings.                         |
| Scoped MCP fmt with wrapper `--exclude`      | PASS diagnostic  | 110 selected; no failures/findings. Not the acceptance command.              |
| Scoped MCP fmt with explicit root `--config` | PASS diagnostic  | 115 selected; no failures/findings. Informs config-discovery cause.          |

### Executed pre-plan marker proof (archive copy, not checkout)

The corrected prototype lives under `.llm/tmp/package-gate-honesty-plan-proof.xd8Msn/`, extracted
from `git archive HEAD` at evaluator head `be2b1872823cbbb07a393633fcccb684f753afc1` before scratch
edits. Commands were unpiped; exit status below is the direct child process status. The prototype
uses `.deno-fmt-lint-ignore` inside `doctor/broken/` to skip only that directory, then groups the
114 remaining files by effective nearest Deno config before batching.

| Proof                               | Exact command / mutation                                                                                               | Raw exit | Selection / failed batches                                                                            | Verdict                                                                       |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Baseline fmt                        | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/mcp --ext ts,tsx` in checkout            | 1        | 115 selected; 1 failed batch; 0 findings                                                              | RED config-parse crash                                                        |
| Baseline lint                       | equivalent `run-deno-lint.ts` command in checkout                                                                      | 1        | 115 selected; 1 crash batch (`failures.length`; lint currently has no named `failedBatches` JSON key) | RED config-parse crash                                                        |
| Corrected fmt                       | exact fmt command, no `--exclude`/`--config`                                                                           | 1        | 114 selected; 2 config batches; 1 failed batch; exactly 1 finding                                     | Honest RED naming only `doctor/healthy/netscript.config.ts`                   |
| Corrected lint                      | exact lint command, no `--exclude`/`--config`                                                                          | 0        | 114 selected; 2 config batches; 0 crash/failed batches; 0 occurrences                                 | GREEN, non-empty                                                              |
| Doctor semantics                    | structured `doctor-families_test.ts`                                                                                   | 0        | 4 passed / 0 failed                                                                                   | GREEN; marker file does not perturb asserted directory behavior               |
| Healthy-file selection probe        | after normalization, temporarily add a fmt defect to each of the three generated healthy registries; exact fmt command | 1        | 114 selected; 2 batches; 3 findings individually naming all three registry files                      | Proves the unmarked generated siblings remain selected; restored byte-exactly |
| Fmt negative after normalization    | append unformatted export to real `packages/mcp/mod.ts`, exact fmt command                                             | 1        | 114 selected; 2 batches; 1 failed batch; exactly 1 finding naming `packages/mcp/mod.ts`               | RED for a real source formatting defect                                       |
| Lint negative                       | append unused binding to real `packages/mcp/cli.ts`, exact lint command                                                | 1        | 114 selected; one `no-unused-vars` occurrence naming `packages/mcp/cli.ts`; no crash batch            | RED for a real lint violation                                                 |
| Restoration                         | archive-restore then `cmp`/SHA-256                                                                                     | 0        | `mod.ts` hash `8a76331e…c86d841`; `cli.ts` hash `1964acf7…03b87b` match checkout                      | Byte-exact restore asserted                                                   |
| Malformed fixture                   | SHA-256/cmp against checkout                                                                                           | 0        | both `deno.json` hashes `6815999d…37361`                                                              | Deliberately malformed fixture remains byte-identical                         |
| Granted twelfth path (scratch only) | `deno fmt packages/mcp/tests/fixtures/doctor/healthy/netscript.config.ts`, then both exact wrappers                    | 0        | fmt: 114 selected / 2 batches / `failedBatches: 0`; lint: 114 / 2 / 0 occurrences                     | Final fmt and lint GREEN; doctor rerun 4/4 GREEN                              |
| Parsed-meaning equality             | import original and formatted config with `deno eval --no-config`; compare serialized default exports                  | 0        | original and formatted both `{"plugins":["workers"]}`; `equal: true`                                  | Formatting-only; parsed/config value unchanged                                |

Collateral is exact: 115→114 for both wrappers. The only file removed from automatic selection is
`packages/mcp/tests/fixtures/doctor/broken/netscript.config.ts`. All four unmarked healthy TS files
remain selected and were individually named by real fmt findings during the proof:

1. `packages/mcp/tests/fixtures/doctor/healthy/netscript.config.ts` — the genuine pre-normalization
   finding.
2. `packages/mcp/tests/fixtures/doctor/healthy/.netscript/generated/plugin-ai/agents.registry.ts` —
   controlled selection probe, restored hash `c5ca3e52…ba1546`.
3. `packages/mcp/tests/fixtures/doctor/healthy/.netscript/generated/plugin-ai/tools.registry.ts` —
   controlled selection probe, restored hash `c5ca3e52…ba1546`.
4. `packages/mcp/tests/fixtures/doctor/healthy/.netscript/generated/plugin-workers/job-registry.ts`
   — controlled selection probe, restored hash `c5ca3e52…ba1546`.

Unrelated export-surface and telemetry fixture TS files also remain selected. Planned wrapper tests
independently create a marked subtree and an equivalent unmarked sibling; count/path assertions
require child-only skip, unmarked-sibling selection, and separate nearest-config batches in both
tools.

The original bytes are correctly formatted under root options (`singleQuote: true`, width 100), but
the wrapper correctly applies `healthy/deno.json` as the nearest authoritative config. Because that
fixture config has no `fmt` options, Deno defaults (double quotes, width 80) apply and the same
bytes are fixture-local-default-style-invalid. Three healthy TS files already pass those defaults.
The coordinator granted this exact formatting-only twelfth path after the scratch proof. The doctor
family is appended to the existing root `fmt.exclude` array so only raw `deno fmt` walks are kept
from flipping the normalized file back to root style; top-level `exclude` is forbidden because it
silently drops doctor files from `deno check`. The planned change is exactly:

```diff
-const config: { readonly plugins: readonly string[] } = { plugins: ['workers'] };
+const config: { readonly plugins: readonly string[] } = {
+  plugins: ["workers"],
+};
 export default config;
```

The checkout path remains untouched in this plan-only pass. The grant expands planned surface only;
it does not authorize pre-gate tree mutation.

### Executed generated-asset consequence (cycle-2 archive copy, not checkout)

The separate evaluator ran the canonical generator in a full `git archive HEAD` copy. The control
barrel matched HEAD byte-for-byte. Replacing only the scratch copy of the planned `run-deno-lint.ts`
prototype and running `deno task gen:assets-barrel` exited 0 and changed only
`packages/cli/src/kernel/assets/agent-tools.generated.ts` among generated assets:

- embedded `run-deno-lint.ts` text gained marker and nearest-config batching semantics;
- `EMBEDDED_AGENT_TOOL_BUNDLE_HASH` changed;
- `embedded.generated.ts` and `skills.generated.ts` stayed unchanged;
- CI's independent freshness verdict is `deno task check:assets-barrel`.

This proof is recorded at `plan-eval.md` §7. The checkout generated file remains untouched. Future
implementation must regenerate it canonically and never hand-edit it.

### Executed cycle-3 exclusion-key proof (archive copies, not checkout)

The final evaluator and topic supervisor independently reproduced the key asymmetry on Deno 2.9.5:

| Planned config shape                             | Fmt/lint result                                                                                                                | Check result                                                                                                                                             | Verdict                  |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| Doctor family in top-level root `exclude`        | Exact fmt/lint remain green at 114/2 because nested config takes precedence for explicit argv.                                 | Direct healthy check prints `Warning No matching files found` at exit 0; mixed checks silently omit it; the wrapper may count 115 while Deno checks 110. | Rejected false green.    |
| Doctor family appended to existing `fmt.exclude` | Raw `deno fmt` walk remains protected; exact fmt/lint stay green at 114/2; root `fmt:check` is 2038/36 with no failed batches. | Direct checks emit both healthy/broken `Check` lines; scoped doctor wrapper reports `filesSelected:5, failedBatches:0`.                                  | Owner-granted amendment. |

Nested `deno.json` precedence applies to explicitly named `fmt`/`lint` files but not `deno check`.
Root `lint.exclude` therefore keeps the doctor entry: the healthy lint negative still fires through
the nested config. The unrelated `.llm/` lint exclusion remains deferred. L11 tests compare config
grouping and batch membership with and without memoization; timing is not the assertion.

### Static gates

| Gate                 | Command or check                                      | Result | Notes                                                        |
| -------------------- | ----------------------------------------------------- | ------ | ------------------------------------------------------------ |
| Plan artifact format | Structured wrapper over five exact run-artifact files | PASS   | 5 selected; zero findings/crashes; `git diff --check` clean. |

### Fitness gates

| Gate             | Result                    | Evidence                                       | Notes                                                                                                                                     |
| ---------------- | ------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Plan-Gate        | cycle 3 final `FAIL_PLAN` | `plan-eval.md` at evaluator commit `65c5e1ac4` | Owner granted the bounded F1 amendment; no cycle 4/further evaluator. Topic-supervisor Tier-A review stands in for the plan gate.         |
| JSR surface scan | PASS (planning input)     | `research.md` JSR section                      | No export/API shape delta, but the published CLI embedded tool text/hash delta is now explicit; both members receive full planned audits. |

### Runtime gates

| Gate               | Result | Evidence                                     | Notes                                   |
| ------------------ | ------ | -------------------------------------------- | --------------------------------------- |
| `scaffold.runtime` | N/A    | Coordinator waiver after gate-matrix review. | Must not run; no lease will be granted. |

### Consumer gates

| Consumer             | Result        | Evidence                                   | Notes                                          |
| -------------------- | ------------- | ------------------------------------------ | ---------------------------------------------- |
| CLI package-cwd task | baseline FAIL | Research structured targeted reproduction. | Future S2 must make the full exact task green. |

## Handoff notes

- Tier-A should review the owner-amended thirteen-path plan: child-only marker plus memoized
  nearest-config batching, existing `fmt.exclude` raw-walk boundary, doctor check coverage 5/0,
  retained healthy lint coverage, fixture-local normalization, task-level parent exclusion removed,
  and canonical published-asset regeneration/freshness.
- No implementation authority exists until that Tier-A stand-in review passes. There is no cycle 4
  or further evaluator; `scaffold.runtime` is waived and must not run.

## 2026-08-23 — S1 implementation after Tier-A plan discharge

The topic supervisor returned `TIER-A PASS` for amended plan head
`62811a9dd454c81524dd142b00d95196439fb5c2`. Under the owner's cycle-3 exception, that review
discharged the plan gate. S1 was then implemented as one bounded slice over exactly the eight paths
named by plan S1; S2–S4 remain untouched.

### Implementation

- `deno.json`: removed the doctor-family wrapper exclusion from the `fmt:check` task and appended
  the family to the single existing `fmt.exclude` array. No top-level `exclude` or duplicate
  `fmt.exclude` key was introduced, so check/lint/test selection remains intact while raw formatter
  walks cannot rewrite fixture-local formatting to root style.
- Both optimized wrappers recognize child-only `.deno-fmt-lint-ignore`, skip only its containing
  subtree, resolve the effective nearest `deno.json`/`deno.jsonc`, memoize that result per
  directory, and batch selected files by config before invoking Deno. Explicit `--config` remains
  one group.
- Both wrapper test suites assert marked-child exclusion, unmarked-sibling selection, identical
  config-group membership with and without memoization, explicit-config grouping, and independent
  execution of two config groups.
- Added the marker only under `doctor/broken/`; the deliberately malformed sibling `deno.json`
  remains byte-identical.
- Normalized `doctor/healthy/netscript.config.ts` to its authoritative fixture-local default style.
  Its imported value remains `{"plugins":["workers"]}`.
- Regenerated `packages/cli/src/kernel/assets/agent-tools.generated.ts` only through
  `deno task gen:assets-barrel`, updating the embedded lint-wrapper text and bundle hash.

### Executed S1 evidence

All exit codes below were read from the direct process, never from a pipeline.

| Obligation                         | Result | Evidence                                                                                                                                                                                                                      |
| ---------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exact MCP fmt, no extra flags      | PASS   | exit 0; `filesSelected:114`, `batches:2`, `failedBatches:0`, `findings:0`.                                                                                                                                                    |
| Exact MCP lint, no extra flags     | PASS   | exit 0; `filesSelected:114`, `batches:2`, `failedBatches:0`, zero findings.                                                                                                                                                   |
| Four healthy files remain selected | PASS   | Each of `healthy/netscript.config.ts`, `healthy/.netscript/generated/plugin-ai/agents.registry.ts`, `tools.registry.ts`, and `plugin-workers/job-registry.ts` returned 1 selected / 1 batch / 0 failed through both wrappers. |
| Doctor check coverage              | PASS   | Scoped check selected exactly 5 files with 1 batch and 0 failed batches; no warning-only or omitted-file green.                                                                                                               |
| Focused tests                      | PASS   | Both wrapper suites plus `doctor-families_test.ts`: 24 passed / 0 failed / 0 ignored; doctor family remains 4/4.                                                                                                              |
| Focused changed-source check       | PASS   | 5 selected / 1 batch / 0 failed batches.                                                                                                                                                                                      |
| Root `fmt:check`                   | PASS   | 2038 selected / 36 batches / 0 failed batches / 0 findings.                                                                                                                                                                   |
| Quality gate                       | PASS   | `deno task quality:gate` exit 0; quality scan clean, allowance baseline 7 unchanged, architecture checks have no failures.                                                                                                    |
| Fixture integrity                  | PASS   | `broken/deno.json` SHA-256 remains `6815999dbd68bd1ab5bb137b59808cb1f1a38fb3393c9133721f439c0ad37361`; healthy parsed value unchanged.                                                                                        |

Negative controls remained honest and were restored byte-exactly:

- A single-quote formatting defect in real selected MCP source made the exact fmt wrapper exit 1 at
  114/2 with one failed batch and one named finding; root `fmt:check` also exited 1 with the same
  finding. Restoration returned the file to SHA-256
  `c1c2431fac016345102d3dc1f637ac945537b16e7d162c95e1d34964665d92fb`, and exact fmt returned
  114/2/0.
- An unused binding in the same real selected source made exact lint exit 1 at 114/2 with one failed
  batch and a real `no-unused-vars` finding. Byte-exact restoration returned the same SHA-256, and
  exact lint returned 114/2/0.

A raw `deno fmt packages/mcp` walk left the protected healthy fixture byte-identical but also
formatted four non-TypeScript files outside S1. Those four command-created collateral changes were
immediately restored from `HEAD` and verified clean. This limitation is recorded append-only in
`drift.md`; the structured TypeScript-only wrapper remains the package-quality verdict.

The root-config lint wrapper over `.llm/tools` honestly refused with exit 2 because the existing
root `lint.exclude` omits `.llm/` (deferred L-2), not because of a finding in S1. A focused
diagnostic under an explicit valid config selected all five changed TypeScript inputs and passed
with 0 failed batches. This diagnostic does not substitute for the required exact no-extra-flag MCP
lint acceptance above.

The pre-commit `check:assets-barrel` comparison was expectedly red because it compares generated
bytes to `HEAD` while the canonical S1 regeneration is still uncommitted; its diff named only the
authorized generated barrel. The freshness verdict will be rerun against the S1 commit before push.
`scaffold.runtime` remains coordinator-waived `n/a`; no Aspire, Docker, `e2e:cli`, or lease action
was taken.

## 2026-08-23 — S2 CLI cwd-independence after S1 sign-off

The topic supervisor signed off S1 at `4b988a381ea9278bcf1b1bc43cf73c0f8691d87a` after independently
reproducing its evidence. S2 then changed exactly the three CLI test/helper paths named by plan S2;
S3 and S4 remain untouched.

### Implementation

- `service-env-gates_test.ts` keeps every production gate command argument unchanged and resolves
  only the filesystem-existence check against its already module-derived repository root.
- `quickstart-command-drift_test.ts` reads the repository-owned quickstart through a module-relative
  file URL converted with `fromFileUrl`; its command-parity assertion is unchanged.
- `run-documented-stream-example.ts` anchors both the documentation read and `.llm/tmp` scratch root
  to the helper module. Extraction, execution, cleanup, and proof behavior are unchanged.
- Neither docs source was rewritten. No assertion was removed or weakened, and no ambient
  `Deno.cwd()` dependency was introduced.

### Executed S2 evidence

All exit codes were read directly from the invoked process, never through a pipeline.

| Obligation                                   | Result | Evidence                                                                                                                                                                                                                                                              |
| -------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Three targeted files from `packages/cli` cwd | PASS   | Structured test exit 0; 6 passed / 0 failed / 0 ignored. This is the exact inverse of the measured 3/3 baseline.                                                                                                                                                      |
| Same three files from repository-root cwd    | PASS   | Structured test exit 0; 6 passed / 0 failed / 0 ignored.                                                                                                                                                                                                              |
| Canonical package test command               | PASS   | Exact `deno task --cwd packages/cli test` exit 0; 828 passed (533 steps) / 0 failed.                                                                                                                                                                                  |
| Scoped check                                 | PASS   | Exactly 3 owned TS files selected; 1 batch / 0 failed batches.                                                                                                                                                                                                        |
| Scoped lint                                  | PASS   | Exactly 3 owned TS files selected; 1 batch / 0 failed batches / zero findings.                                                                                                                                                                                        |
| Scoped fmt                                   | PASS   | Exactly 3 owned TS files selected; 1 batch / 0 failed batches / zero findings.                                                                                                                                                                                        |
| Docs accuracy                                | PASS   | `deno task docs:accuracy` exit 0; accuracy/discoverability checks passed.                                                                                                                                                                                             |
| Docs source format                           | PASS   | Authoritative nested command `deno task --cwd docs/site check:source-format` exit 0; `Docs source format: OK`. An initial root `deno task check:source-format` honestly exited 1 because that task exists only in `docs/site/deno.json`; it is not counted as a pass. |
| Quality gate                                 | PASS   | `deno task quality:gate` exit 0; root coverage and architecture checks have no failures, quality findings are empty, allowance baseline remains 7.                                                                                                                    |

### Fail-loud negative control and restoration

The three repository-read anchors were temporarily shifted exactly one directory toward the module,
while the scratch anchor remained untouched. The package-cwd structured test then exited 1 with 3
passed / 3 failed and three concrete failures: service verification attempted
`packages/packages/cli/...`, quickstart attempted `packages/docs/site/quickstart.vto`, and the
stream helper attempted `packages/docs/site/durable-workflows/streams.md`. The control was restored
through an exact inverse patch; the three implemented file hashes returned byte-for-byte to:

- service-env test: `7493e6a3de76e659ea5f413402c9bf9ff9080ef38e231c57aaf31140ea77382f`
- quickstart drift test: `a67b748e7ba1825cce4ff77d27e2db0203f23f9825562385779c1f13ba7040b1`
- documented-stream helper: `9bb3fe2219eda0ce64ad65e75da456dc24125a143d16e3370cdc97beac9c1761`

The restored package-cwd suite then returned 6/0 again. A separate read-only sentinel control proved
all four correct targets (`REPO_ROOT`, quickstart, streams, scratch) exist and all four
corresponding one-directory-wrong targets do not; it created no wrong scratch tree.

The two read-only docs hashes remain
`de948fb2b31beca104ce8a3c9294fbf4bc67338db096ee88ead3387610db6300` (quickstart) and
`bcb945f1ac93eb670ddf7ed04a3e8d1299b559b3f4a535b503483944e9e7da49` (streams). `deno.lock` remains
byte-identical at `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c`.
`scaffold.runtime` remains coordinator-waived `n/a`; no Aspire, Docker, `e2e:cli`, mutex request, or
substitute runtime smoke was taken.
