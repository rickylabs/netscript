# Drift Log: package-gate-honesty

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-08-15 — Coordinator thread record preseeded the run directory

- **What:** The first ground-truth status check found only
  `.llm/runs/release-0.0.7-internals--orchestration/slices/package-gate-honesty/codex-thread-ids.md`
  as untracked content.
- **Source:** `git status --short` and the launcher-generated file contents.
- **Expected:** A completely clean worktree before bootstrap.
- **Actual:** The agentic launcher had staged this exact session's identity in the target run dir.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `codex-thread-ids.md` identifies this thread, worktree, branch, base, and matched
  route.

## 2026-08-15 — Root task exclusion does not satisfy standalone formatter acceptance

- **What:** Root `fmt:check` already supplies a wrapper-level exclusion for the MCP doctor fixture,
  but the exact standalone scoped command in #1618 still selects fixture TS and aborts during nested
  config discovery.
- **Source:** `deno.json:139-148`; exact wrapper reproduction in `worklog.md`.
- **Expected:** The issue report could have implied no exclusion existed anywhere.
- **Actual:** Task-level selection is protected, but the reusable standalone wrapper remains red.
- **Severity:** minor
- **Action:** fix
- **Evidence:** Baseline 115 selected / one config crash; explicit wrapper exclusion 110 selected /
  exit 0.

## 2026-08-15 — R8 root-exclusion conclusion falsified by execution

- **What:** Research R8 and plan L3 claimed root `deno.json` `exclude` would make the exact
  optimized wrapper command green.
- **Source:** Separate-session PLAN-EVAL cycle 1 at evaluator commit `be2b18728`; accepted
  coordinator finding.
- **Expected:** Root exclusion would prevent Deno from consuming the malformed fixture config.
- **Actual:** Both wrappers select files independently and pass explicit argv. Deno resolves each
  named file's nearest config, so root exclusion is not consulted by selection and the batch
  crashes.
- **Severity:** significant
- **Action:** fix in plan; retain root exclusion only as non-load-bearing native directory-walk
  protection.
- **Evidence:** `plan-eval.md` §1; baseline fmt/lint matrix in `worklog.md`.

## 2026-08-15 — Coordinator granted eleven-path marker rescope and runtime waiver

- **What:** The authoritative implementation surface grew from six to eleven paths: both optimized
  wrappers, both wrapper tests, and one narrowly named marker beside the malformed fixture were
  added. The coordinator selected the marker family and waived `scaffold.runtime` as gate-matrix
  `n/a`.
- **Source:** Topic-supervisor resume instruction after PLAN-EVAL cycle 1.
- **Expected:** Original plan prohibited `.llm/tools/**` and awaited a serialized runtime lease.
- **Actual:** Wrapper changes are explicitly authorized; adding a twelfth path is still rescope. The
  expensive gate must not run and is not `NOT_RUN` pending a lease.
- **Severity:** significant (authorized rescope)
- **Action:** accept and repair plan; no implementation before cycle-2 `PASS`.
- **Evidence:** Eleven-path table and gate row 7 in repaired `plan.md`.

## 2026-08-15 — Child-only marker interpretation remained red

- **What:** A scratch prototype that skipped only `doctor/broken/` removed the malformed config's
  single TS file but did not produce a truthful fmt verdict.
- **Source:** `git archive HEAD` proof under `.llm/tmp/`; no checkout product/config edits.
- **Expected:** Marker-local subtree skip might be sufficient at 114 selected files.
- **Actual:** Deno next exposed the root/healthy nested-config conflict; after config-aware
  batching, fmt still found the healthy fixture's root-style drift. The accepted explicit
  parent-scope marker omits exactly the five-file doctor family and yields the established 110-file
  surface.
- **Severity:** significant design finding
- **Action:** reject child-only semantics; lock the narrowly named `.deno-fmt-lint-ignore-parent`
  convention and test both marked and unmarked directions.
- **Evidence:** Executed pre-plan matrix and exact collateral list in `worklog.md`.

## 2026-08-15 — Parent-family marker draft rejected before push

- **What:** Local plan-repair commit `71e803807` proposed `.deno-fmt-lint-ignore-parent`, which made
  both wrappers green by dropping the entire five-file `doctor/` family.
- **Source:** Topic-supervisor correction received before any push; independent arithmetic and
  archive proof.
- **Expected:** The marker must skip only its own marked subtree while an unmarked sibling remains
  selected.
- **Actual:** The parent marker dropped `broken/netscript.config.ts` plus all four unmarked healthy
  TS files (115→110), converting a loud real finding into a silent false-positive exclusion.
- **Severity:** significant plan correction
- **Action:** reject and amend before push. Lock child-only marker semantics plus nearest-config
  batching; preserve all four healthy files in the 114-file selection.
- **Evidence:** Corrected 114-file matrix in `worklog.md`; remote branch remained at `be2b18728`, so
  the rejected commit was never published.

## 2026-08-15 — Honest 114-file proof reveals one pending twelfth path

- **What:** With child-only marker and nearest-config batching, lint is green but fmt reports one
  genuine finding in unmarked `doctor/healthy/netscript.config.ts`.
- **Source:** Corrected `git archive HEAD` proof; coordinator independently reproduced the
  file-level finding.
- **Expected:** Removing batch poisoning should expose real findings rather than suppress them.
- **Actual:** Exactly one marked file leaves selection. The remaining healthy source has no
  competing fmt configuration; it is simply unformatted. Formatting only that file in scratch makes
  exact fmt green at 114 while lint and doctor remain green.
- **Severity:** significant pending rescope
- **Action:** prepare proof only; do not touch the checkout path until the coordinator grants it as
  a twelfth path. Implementation and PLAN-EVAL cycle 2 remain blocked.
- **Evidence:** Proposed one-file diff and fmt/lint/doctor results in `worklog.md`.

## 2026-08-15 — Coordinator granted formatting-only twelfth path

- **What:** The coordinator added `packages/mcp/tests/fixtures/doctor/healthy/netscript.config.ts`
  to the planned implementation surface, bringing the bound to twelve paths.
- **Source:** Topic-supervisor grant after review of plan head `ccf256884` and the honest R14/R15
  scratch proof.
- **Expected:** The real 114-file fmt finding must be fixed without hiding any unmarked file.
- **Actual:** Deno formatting alone expands the object and normalizes quotes. Original and formatted
  modules both export `{"plugins":["workers"]}`; both exact wrappers are green at 114, doctor is
  4/4, and the malformed config hash remains
  `6815999dbd68bd1ab5bb137b59808cb1f1a38fb3393c9133721f439c0ad37361`.
- **Severity:** significant authorized rescope
- **Action:** accept in the plan only. Do not mutate the checkout path before fresh Tier-A and
  PLAN-EVAL cycle 2 `PASS`; no thirteenth path exists.
- **Evidence:** Final green matrix, four individually named healthy selection probes, semantic
  equality, and byte-restoration evidence in `worklog.md`.

## 2026-08-15 — Cycle-2 evaluation exposed a published consumer asset

- **What:** The twelve-path plan treated `.llm/tools/run-deno-lint.ts` as maintainer-only, but the
  canonical CLI asset generator embeds it verbatim in published
  `packages/cli/src/kernel/assets/agent-tools.generated.ts`.
- **Source:** Separate-session PLAN-EVAL cycle 2 at evaluator commit `c415daad2`, independently
  confirmed by the coordinator.
- **Expected:** The plan claimed no CLI publish delta and omitted generated-asset freshness.
- **Actual:** The planned lint-wrapper edit changes installed consumer behavior, embedded tool text,
  and `EMBEDDED_AGENT_TOOL_BUNDLE_HASH`; `check:assets-barrel` would fail unless the generated
  barrel changes too.
- **Severity:** significant plan correction
- **Action:** accept coordinator grant of exactly the generated barrel as path thirteen;
  regeneration must use `deno task gen:assets-barrel`, never a hand edit. Add the freshness gate and
  disclose the consumer/JSR delta. No fourteenth path exists.
- **Evidence:** Full archive-copy generator proof in `plan-eval.md` §7; research R16 and repaired
  plan L7/S1/JSR/gate rows.

## 2026-08-15 — Fixture-format explanation and root exclusions corrected

- **What:** The earlier drift entry called `healthy/netscript.config.ts` "simply unformatted" and
  treated root exclusion as only non-load-bearing protection. The root task also retained a
  wrapper-level parent-family skip.
- **Source:** PLAN-EVAL cycle 2 advisories A1/A2 and the coordinator's binding rulings.
- **Expected:** The honest gate should apply the fixture's own config without allowing either a raw
  root walk or a task-level selection filter to undo coverage.
- **Actual:** The original bytes are valid under root style (`singleQuote: true`, width 100) but
  invalid under the authoritative fixture-local config's defaults (double quotes, width 80). The
  top-level root `exclude` is load-bearing for raw formatter walks because it prevents reversion to
  root style, while it remains non-load-bearing for the standalone explicit-argv acceptance command.
  Conversely, the `fmt:check` task's wrapper `--exclude` silently drops the whole doctor family and
  must be removed.
- **Severity:** significant plan clarification
- **Action:** preserve the historical wording above as append-only drift, supersede it here, update
  R14/L3/L10/worklog, retain only the top-level raw-walk boundary, and plan memoized `nearestConfig`
  resolution per directory before root-scale execution.
- **Evidence:** `plan-eval.md` §2/§5 and advisories A1/A2/A4; repaired `plan.md` L3/L10/L11 and gate
  row 3.

## 2026-08-15 — Ordinary PLAN-EVAL allowance exhausted; owner escalation owns disposition

- **What:** Cycle 2 returned `FAIL_PLAN`; the harness allows only two `FAIL_PLAN` cycles before
  escalation.
- **Source:** `plan-eval.md` at `c415daad2`; coordinator repair brief.
- **Expected:** No implementation begins without a disposed plan gate.
- **Actual:** The coordinator resolved every finding and granted the exact thirteenth path, but no
  cycle 3 exists absent owner escalation.
- **Severity:** process gate
- **Action:** repair and publish run artifacts only, then stop for Tier-A/owner review. Do not
  request or assume another evaluator run and do not implement.
- **Evidence:** Repaired thirteen-path plan and this commit's worklog/context pack.

## 2026-08-23 — Owner-authorized final PLAN-EVAL found top-level exclusion check loss

- **What:** Cycle 3 confirmed the thirteen-path repair and 114/2 fmt/lint acceptance, then proved
  that the planned doctor-family entry in top-level root `exclude` silently removes all five doctor
  TS files from `deno check`.
- **Source:** Owner-authorized final PLAN-EVAL at evaluator commit `65c5e1ac4`, independently
  reproduced by the topic supervisor on Deno 2.9.5.
- **Expected:** The prior drift entry described top-level `exclude` as a raw-formatter-walk boundary
  that would not alter other gate coverage.
- **Actual:** Direct check of an excluded file warns `No matching files found` at exit 0; mixed
  batches omit it while staying green; the check wrapper can count 115 selected while Deno checks
  only 110. Nested config precedence rescues explicitly named fmt/lint files but does not apply to
  check.
- **Severity:** significant final plan finding
- **Action:** supersede—not rewrite—the prior top-level-exclusion conclusion. Never place the doctor
  family in top-level `exclude`.
- **Evidence:** `plan-eval.md` §5 and research R17.

## 2026-08-23 — Owner granted existing-`fmt.exclude` amendment and Tier-A stand-in gate

- **What:** The owner granted the bounded correction inside the already-authorized `deno.json` path:
  append the doctor family to the existing `fmt.exclude` list, not a second duplicate key, and add
  explicit check-coverage and config-precedence obligations.
- **Source:** Owner-granted amendment brief for #1663 after cycle-3 `FAIL_PLAN`.
- **Expected:** A raw `deno fmt` walk must not revert fixture-local-default formatting, while
  check/lint/test selection remains intact.
- **Actual:** The evaluator's executed alternative preserves raw fmt-walk protection; exact fmt and
  lint remain 114/2 green; root `fmt:check` remains 2038/36 green; scoped doctor check reports
  `filesSelected:5, failedBatches:0`. Root `lint.exclude` keeps its doctor entry because nested
  config precedence makes the healthy lint negative fire; its `.llm/` entry remains deferred.
- **Severity:** significant owner-authorized amendment
- **Action:** retain the thirteen-path surface, amend plan/worklog/context/PR only, and stop for the
  topic supervisor's Tier-A review. Memoization tests compare grouping equality with and without the
  cache rather than timing. There is no cycle 4 or further evaluator.
- **Evidence:** Repaired plan L3/L10/L11, S1, gate row 1, risk row 2, and PR DoD row 3.

## 2026-08-23 — Worktree recreated from the pushed branch without rollout loss

- **What:** An unrelated host cleanup deleted the leaf worktree after cycle 3 completed.
- **Source:** Topic-supervisor handoff.
- **Expected:** The plan author resumes on the exact evaluated branch state.
- **Actual:** The supervisor recreated `/home/codex/repos/netscript-007-package-gate` from origin at
  `65c5e1ac47646328a54d553c838a9059928139c3`; the tree was clean and all run artifacts were present.
- **Severity:** minor operational drift
- **Action:** accept; no recovery mutation or lost commit.
- **Evidence:** pre-edit `git rev-parse HEAD` and `git status --short` in this resume.
