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
- `@netscript/cli` changes remain under publish-excluded `e2e/`.
- `@netscript/mcp` keeps `GUIDANCE_RANKING_POLICY` internal to its source graph; only the rationale
  comment and test change.
- Root Deno configuration may carry the doctor-family exclusion only as non-load-bearing protection
  for native directory walks.
- The optimized fmt/lint wrappers gain two shared conventions: a marker excludes only its own
  subtree, and selected files are grouped by effective nearest Deno config before explicit argv is
  built.

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

| #  | Slice                                                                                                  | Gate                                                                                                               | Exact files                                       |
| -- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| S1 | Make optimized MCP fmt/lint selection marker- and config-aware while retaining every unmarked sibling. | Both exact wrappers green at 114 + marked/unmarked/config-batch tests + negative controls + doctor/semantic proof. | Seven exact S1 paths in `plan.md`                 |
| S2 | Make all three CLI tests package-cwd independent without weakening assertions.                         | Structured targeted 6/6 + exact package task + docs gates; final runtime consumer in S4.                           | Three exact CLI files in `plan.md`                |
| S3 | Pin close-score policy on both sides and record rationale.                                             | Targeted test + widen/narrow RED controls + scoped MCP/quality gates.                                              | `guidance-index.ts`; `guidance-retrieval_test.ts` |
| S4 | Integrated evidence for the applicable frozen gate set.                                                | Static/test/docs/publish/JSR gates; `scaffold.runtime` recorded coordinator-waived `n/a`.                          | Run artifacts/evidence only                       |

### Deferred scope

- Any thirteenth product/config path, other wrapper/CI change, docs edit, malformed-fixture repair,
  public API change, dependency update, or algorithm change.
- `scaffold.runtime`, Aspire, Docker, and `e2e:cli`; the gate is waived `n/a`, not pending.
- All implementation until separate-session PLAN-EVAL `PASS`.

### Contributor path

To extend these guards, keep repository-owned paths module-relative; mark only the deliberately
invalid subtree, group explicit argv by nearest config, and pair marked/unmarked selection tests;
for tuned ordering boundaries add one candidate on each side whose identity order conflicts with
score order. Then prove both green behavior and a controlled red mutation through structured gates.

## Progress log

| Time       | Slice     | Step                       | Notes                                                                                                                                                                    |
| ---------- | --------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-08-15 | bootstrap | activated                  | Exact worktree/branch/base verified; coordinator thread record preserved; commit `25c29575c`; draft PR #1663 opened.                                                     |
| 2026-08-15 | research  | live issue/source read     | All three issues fetched live; exact three-test reproduction returned 3 pass / 3 fail from package cwd.                                                                  |
| 2026-08-15 | research  | fmt controls               | Baseline exact command: 115 selected, config crash; wrapper exclude: 110 selected/green; explicit root config: 115 selected/green.                                       |
| 2026-08-15 | plan      | Design checkpoint          | Six-file authoritative surface locked; formal PLAN-EVAL selected; implementation remains prohibited.                                                                     |
| 2026-08-15 | plan-eval | cycle 1                    | `FAIL_PLAN` at evaluator commit `be2b18728`: root `exclude` cannot affect explicit wrapper argv; no product/config implementation occurred.                              |
| 2026-08-15 | plan      | coordinator rescope        | Authority expanded to eleven exact paths: fmt/lint wrappers + tests and one marker; `scaffold.runtime` waived `n/a`.                                                     |
| 2026-08-15 | plan      | rejected proof draft       | Parent-family marker made both wrappers green at 110 by excluding four unmarked healthy files; coordinator rejected it before push as a silent false-positive exclusion. |
| 2026-08-15 | plan      | corrected mechanism proof  | Child-only marker + nearest-config batching selects 114: lint green, fmt one honest healthy-fixture finding, doctor 4/4, negative controls red, restorations byte-exact. |
| 2026-08-15 | plan      | twelfth-path scratch proof | Formatting only `healthy/netscript.config.ts` makes exact fmt green at 114; lint and doctor remain green. Checkout path untouched pending grant.                         |
| 2026-08-15 | plan      | twelfth-path grant         | Coordinator authorized that exact formatting-only path, bringing planned implementation to twelve paths; no semantic/config-value change and no thirteenth path.         |
| 2026-08-15 | plan      | final 114-file proof       | Both exact no-extra-flag wrappers green; all four healthy TS files individually named selected; doctor/parsed meaning/hash/negative-control requirements proved.         |

## Decisions

| Decision                                    | Reason                                                                                                                               | Source                               |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| Child-only marker + nearest-config batching | Only the marked broken subtree may leave selection; grouping prevents config poisoning while keeping all four healthy files visible. | plan L3/L4; corrected pre-plan proof |
| Module-derived paths                        | Package cwd is the defect; module location is stable.                                                                                | plan L1/L2                           |
| Bidirectional score controls                | Current identity ordering masks both threshold directions.                                                                           | research R10-R12; plan L5/L6         |
| Formal PLAN-EVAL                            | Multi-member/config/docs/JSR/runtime interactions are decision-heavy.                                                                | run-loop §4; plan judgement          |

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

The original fmt finding is not a config-style conflict. `healthy/deno.json` contains a valid
workspace and no fmt options. Three healthy TS files already pass; `healthy/netscript.config.ts` is
simply unformatted. The coordinator granted this exact formatting-only twelfth path after the
scratch proof. The planned change is exactly:

```diff
-const config: { readonly plugins: readonly string[] } = { plugins: ['workers'] };
+const config: { readonly plugins: readonly string[] } = {
+  plugins: ["workers"],
+};
 export default config;
```

The checkout path remains untouched in this plan-only pass. The grant expands implementation
authority after Tier-A and PLAN-EVAL cycle 2 `PASS`; it does not authorize pre-gate tree mutation.

### Static gates

| Gate                 | Command or check                                      | Result | Notes                                                        |
| -------------------- | ----------------------------------------------------- | ------ | ------------------------------------------------------------ |
| Plan artifact format | Structured wrapper over five exact run-artifact files | PASS   | 5 selected; zero findings/crashes; `git diff --check` clean. |

### Fitness gates

| Gate             | Result                | Evidence                                       | Notes                                                                                |
| ---------------- | --------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| Plan-Gate        | cycle 1 `FAIL_PLAN`   | `plan-eval.md` at evaluator commit `be2b18728` | Plan repaired for required separate-session cycle 2; implementation remains blocked. |
| JSR surface scan | PASS (planning input) | `research.md` JSR section                      | No public delta; both members still receive full planned audits.                     |

### Runtime gates

| Gate               | Result | Evidence                                     | Notes                                   |
| ------------------ | ------ | -------------------------------------------- | --------------------------------------- |
| `scaffold.runtime` | N/A    | Coordinator waiver after gate-matrix review. | Must not run; no lease will be granted. |

### Consumer gates

| Consumer             | Result        | Evidence                                   | Notes                                          |
| -------------------- | ------------- | ------------------------------------------ | ---------------------------------------------- |
| CLI package-cwd task | baseline FAIL | Research structured targeted reproduction. | Future S2 must make the full exact task green. |

## Handoff notes

- Tier-A should review the now-reachable twelve-path plan. PLAN-EVAL cycle 2 should inspect L3's
  child-only marker plus nearest-config batching, the four-file unmarked-sibling evidence, the
  formatting-only semantic equality proof, the two-direction score controls, and the honest
  treatment of existing CLI JSR debt.
- No implementation authority exists before fresh Tier-A and cycle-2 `PASS`. The topic supervisor
  owns that review/evaluator launch; `scaffold.runtime` is waived and must not run.
