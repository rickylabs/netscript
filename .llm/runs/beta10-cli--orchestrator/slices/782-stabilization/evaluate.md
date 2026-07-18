# IMPL-EVAL: PR #789 — Preact module identity dedupe on Windows (fixes #782)

| Field | Value |
| ----- | ----- |
| Verdict | **PASS** |
| Evaluator | Claude Fable 5 low (opposite-family; generator was Codex GPT-5.6-Sol) |
| Date | 2026-07-16 |
| Subject | worktree `/home/codex/repos/b10-782`, branch `fix/782-beta10-stabilization` @ e8a83653, base `origin/feat/beta10-integration` @ 0daa575b |
| Diff | `packages/fresh/src/application/vite/vite.ts` (+24/-8), `vite.test.ts` (+192), `README.md` (+18), run artifacts |

## Independent Evidence

| Check | Result | Evidence |
| ----- | ------ | -------- |
| Focused suite on HEAD | PASS | `deno test --no-lock -A packages/fresh/src/application/vite/vite.test.ts` → 9 passed, 0 failed (my own run) |
| Regression sensitivity | PASS | Reverted `vite.ts` to base 0daa575b in scratch: 3 new tests FAIL (missing dedupe, missing delegated resolution, merged-dedupe fixture); restored, worktree clean |
| Issue fidelity | PASS | Issue #782 read via API: Windows production Rollup emits two hooks runtimes from `C:\...` vs `C:/...` IDs; fix matches the proposed framework change and the proven eis-chat PR #150 workaround |
| PR body | PASS | `Closes #782` closing keyword present; base `feat/beta10-integration` correct |
| Suppressions | PASS | No `any`, `@ts-*`, or `deno-lint-ignore` in the vite.ts diff; generator's added-line scan corroborates |

## Findings

1. **(pass) Correct failure-mode targeting.** The fix addresses exactly what #782 reports: `resolve.dedupe: ['preact']` handles the linked/peer package-copy class, and the delegated `resolveId` + `normalizePath(resolved.id)` handles the separate slash-variant string-identity class that dedupe alone does not fix (documented in the README addition). The build-fixture test proves one hooks runtime patch (`[1,1]`) and one canonical loaded ID.
2. **(pass) Wrap-don't-reinvent honored.** Uses Vite's own `normalizePath()` and plugin-context `this.resolve(..., { skipSelf: true })`; no home-grown slash helper (AP-2 avoided), no upstream re-export (AP-14 avoided). Metadata is preserved via `{ ...resolved, id: ... }` so externality/side-effect/meta survive.
3. **(pass) No incorrect merge of distinct Preact copies.** `normalizePath` only converts separators — two genuinely different installed Preact copies retain distinct normalized paths and cannot be conflated by this code. `resolve.dedupe` is Vite's documented root-copy selection policy, the standard framework baseline (Fresh/consumer graphs want one Preact). Acceptable and intended.
4. **(pass) Symlinked node_modules.** Resolution is fully delegated to Vite (`this.resolve`), so `preserveSymlinks` and symlink realpathing follow upstream behavior; the plugin only touches separator form afterward. Safe.
5. **(pass) POSIX behavior unchanged.** `normalizePath` is a no-op on POSIX paths; alias resolution stays first; empty alias list still receives dedupe; user `resolve.dedupe` merges (fixture asserts `consumer-package` + `preact`). Full Fresh suite 199/199 per generator worklog; my focused run confirms no POSIX breakage in the touched surface.
6. **(minor, non-blocking) Drive-letter casing not canonicalized.** `normalizePath` does not lowercase `C:` vs `c:`; a casing-variant duplicate would not be collapsed. #782 reports only backslash-vs-slash variants, and the plan explicitly defers broader normalization (Open-Decision Sweep) — correctly scoped, noting for the record.
7. **(minor, non-blocking) Build fixture is not the cross-platform red.** On Linux, Vite core normalizes the controlled backslash ID pre-fix, so the build fixture's red on base code comes from the dedupe-merge assertion, not the two-module split. Honestly recorded in `drift.md`; the delegated-resolver test is the deterministic cross-platform regression, and native-Windows proof exists via eis-chat PR #150. The regex-boundary test (`preact-render-to-string` untouched) guards the match scope.
8. **(minor, process) No standalone `plan-eval.md`/PLAN-EVAL pass exists** before implementation; the run was supervisor-owned with evaluator passes explicitly reserved to the supervisor (recorded in `drift.md` and the S0-locked plan). Deliberate constraint, not generator drift; recorded per protocol rule 2.
9. **(pass) Gate evidence complete.** Worklog records scoped check/lint/fmt (164 files, 0 findings), scoped quality 0 findings, arch:check exit 0, doc-lint `./vite` entrypoint clean (25 pre-existing route-contract findings attributed to doctrine file 10 debt), publish dry-run pass. Baseline repo-level quality failures are in untouched plugin files, byte-identical to base. No new or deepened arch debt; no `arch-debt.md` entry required.

## Rationale

Approved scope is complete and tight (Preact-only, framework-owned layer, no scaffold/template churn); static, fitness, and runtime gates have evidence or valid attribution; the new tests demonstrably fail on the old code; the implementation wraps upstream Vite primitives instead of reinventing them; no doctrine violation or suppression was introduced. Findings 6–8 are non-blocking observations.
