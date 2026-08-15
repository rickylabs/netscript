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
