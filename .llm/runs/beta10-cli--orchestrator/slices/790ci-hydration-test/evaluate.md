# IMPL-EVAL: PR #797 — markdown hydration builds deterministic on CI

| Field | Value |
| ----- | ----- |
| Verdict | **PASS** |
| Evaluator | Claude Fable 5 low (opposite-family vs Codex Sol generator) |
| Subject | worktree `/home/codex/repos/b10-790ci`, `fix/790-md-hydration-ci` @ ead168c8, base `origin/feat/beta10-integration` |
| Generator run | `.llm/runs/fix-790-md-hydration-ci--codex/` |
| Date | 2026-07-17 |

## Rationale

The claimed root cause is real and was reproduced independently by this evaluator, the fix sits
at the owning layer (`@netscript/fresh` vite plugin) and mirrors the existing #789 Preact resolver
pattern without interfering with it, the hydration gate is retained (not skipped/weakened), and
the renderer test now fails loudly with full build diagnostics. All focused and worklog-claimed
gates check out.

## Findings

1. **Root cause verified independently (PASS).** Reverted only `vite.ts` to base and ran the
   focused test `generated Fresh Markdown island production-builds for hydration` with a
   brand-new isolated `DENO_DIR`: FAIL, exit 1, with exactly
   `[vite]: Rollup failed to resolve import "npm:@preact/signals@^2.5.1" from
   "deno::0::https://jsr.io/@fresh/core/2.3.3/src/runtime/client/reviver.ts"`. The TanStack
   peer-dep warning is present in the same log and is non-fatal — the "not the peer-dep warning"
   claim holds. Notably, a second run of the OLD code against the now-warmed cache PASSED,
   directly confirming the warm-cache-masking claim in drift.md.
2. **Fixed code passes on a clean cache (PASS).** Same focused test at HEAD with another
   brand-new isolated `DENO_DIR`: 1 passed / 0 failed (41s, real scaffold + client/server
   production build, no prewarming).
3. **Resolver consistency with #789 (PASS).** `canonicalizePreactSignalsImport` follows the same
   shape as `PREACT_IMPORT_PATTERN`: delegated `this.resolve(..., { skipSelf: true })`, spread of
   the delegated result preserving `meta`/`moduleSideEffects`, `normalizePath` on the id. Dedupe
   extended to `['preact', '@preact/signals']` and the merged-dedupe test updated. Regex boundary
   correct: `@preact/signals-core` is untouched (asserted in the new test). Focused vite suite:
   10 passed / 0 failed.
4. **Loud failure achieved (PASS).** `commandFailureMessage` puts exit code, exact command, and
   labeled `--- stdout --- / --- stderr ---` into the build assertion; verified in the actual
   old-code failure output (finding 1). The old equality-assert that swallowed stderr is gone.
5. **Hydration coverage preserved (PASS).** No `ignore`/`skip`/CI-conditional added; the
   production-build hydration test still scaffolds and builds a real generated app. No new
   suppressions anywhere in the diff.
6. **Self-sufficiency vs PR #772 (informational).** #797's fix is complete on its own: it fixes
   resolution at the owning vite-plugin layer and its clean-cache proof passes without anything
   from #772 (commit 73616032 there). If both merge, the supervisor should reconcile to avoid a
   redundant second mechanism, but #797 does not depend on #772.
7. **Plan-gate skipped, drift-logged (minor process finding).** No `plan-eval.md` exists;
   protocol rule 2 normally blocks implementation without PLAN-EVAL PASS. The generator recorded
   this as supervisor-owned drift in `drift.md`/`supervisor.md` for this p0 hotfix. Recorded, not
   blocking.
8. **Docs updated (PASS).** `vite/README.md` documents the new Signals canonicalization policy
   accurately, matching implemented behavior.

## Evidence commands

- Old-code repro: `git checkout origin/feat/beta10-integration -- packages/fresh/src/application/vite/vite.ts`
  + `DENO_DIR=<fresh> deno test --allow-all packages/fresh-ui/tests/registry/markdown-renderer.test.ts --filter "production-builds"` → exit 1, Rollup Signals error (worktree restored clean after).
- Fixed-code proof: same command at HEAD with fresh `DENO_DIR` → 1 passed / 0 failed.
- Resolver suite: `deno test --allow-all packages/fresh/src/application/vite/vite.test.ts` → 10 passed / 0 failed.
