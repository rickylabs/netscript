# Drift Log: root README Quickstart clean-runner walk

## 2026-09-03 — Parent research artifact absent from leaf baseline

- **What:** The coordinator brief names
  `.llm/runs/research-aspire-13.5-adoption--0.0.7/research.md` as recorded Aspire help evidence, but
  that file is absent from the worktree at the exact coordinator baseline.
- **Source:** Direct filesystem lookup at `79adb103be568260e51b0eb3ba9fae281a5fe1f0`.
- **Expected:** Read the recorded `aspire wait --help` evidence from the parent run.
- **Actual:** Only `slices/s5/` exists beneath the parent run; the CLI syntax was re-verified locally
  with Aspire CLI 13.5.3 `aspire wait --help`.
- **Severity:** minor
- **Action:** accept
- **Evidence:** Local help proves `aspire wait <resource> --status healthy --timeout <seconds>`.

## 2026-09-03 — Exact scoped lint wrapper refuses the baseline desktop fixture

- **What:** The coordinator-required lint command exits 2 before linting seven existing
  `fixtures/desktop-native` files.
- **Source:** `run-deno-lint.ts --root packages/cli/e2e --ext ts,tsx` at untouched baseline HEAD.
- **Expected:** The scoped lint wrapper processes every selected file.
- **Actual:** Deno ignores the fixture's parent workspace config and cannot resolve its existing
  `zod: "catalog:"` dependency; the wrapper reports zero lint findings and a
  `processed-count-unavailable` coverage refusal.
- **Severity:** significant
- **Action:** defer
- **Evidence:** Baseline run selected 223 files; check, 302 tests, and format passed. The lint
  failure is isolated to the seven pre-existing desktop fixture files and predates this slice.

## 2026-09-03 — README fidelity deliberately exposes fresh-publication and non-TTY behavior

- **What:** The printed README install omits the `--minimum-dependency-age=0` accommodation used by
  `quickstart.walk`, and its Aspire commands omit the walk's non-interactive flags.
- **Source:** Root README marker block compared with `quickstart-walk-suite.ts`.
- **Expected:** `readme.quickstart` executes those printed commands without adding hidden flags.
- **Actual:** A just-published canary may fail Deno's dependency-recency policy, and the hosted run
  remains the authority for whether printed Aspire commands are non-TTY safe.
- **Severity:** significant
- **Action:** accept as admission evidence; never retry or add hidden recovery.
- **Evidence:** The drift test fixes the exact printed argv; the hosted clean runner will expose a
  failure at the named README line.

## 2026-09-03 — Prescribed RTK proxy unavailable

- **What:** `rtk` is not installed in this worktree environment.
- **Source:** `command -v rtk` / attempted `rtk git status`.
- **Expected:** Prefix read-heavy Git commands and validation tasks with the token-saving proxy.
- **Actual:** Native non-interactive Git and exact coordinator gate commands were used.
- **Severity:** minor
- **Action:** accept; no command semantics changed.
