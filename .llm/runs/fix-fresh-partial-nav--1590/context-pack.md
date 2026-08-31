# Context Pack — Fresh partial-navigation Slice 1

## Current state

- Run: `fix-fresh-partial-nav--1590`; branch `fix/fresh-partial-nav-ordering`.
- Implementation base: `b236f0c5ec62b7fe5485e8628cb1697ab33aca0d`; PLAN-EVAL is `PASS`.
- IMPL-EVAL returned `FAIL_FIX` at `f3b50149e` for two stale cross-package consumers of the new
  `./navigation` subpath. Both mechanical repairs are complete in the single branch-head commit.
- Slice 1 implementation and static validation are complete within nine package files: six
  production/config/docs and three focused tests. The tenth contingency slot is unused.
- The public `@netscript/fresh/navigation` entrypoint is SSR-import-safe and exposes one
  reference-counted coordinator lifecycle plus `KeyedPartial`.
- Superseded bodies are never aborted or cancelled. They are consumed to EOF; final disposal also
  waits for a headers-arrived body whose consumer has not started `.text()`.
- Page generations invalidate older page and page-owned region application, late Fresh history
  replacement is correlated and suppressed, and route subscriptions share the installed lifecycle.
- `KeyedPartial` passes `key={name}` directly to Fresh. Colon-bearing names preserve the VNode key
  while the documented Fresh marker form normalizes colons to underscores.

## Validation boundary

- Focused navigation/keyed tests: 8 passed.
- Fresh structured check/lint/fmt: 207 files, zero findings; package tests: 275 passed.
- Consumer fixture with `--unstable-kv`: passed.
- New public entrypoint doc lint: zero findings. The full Fresh export scan retains 45 findings in
  four untouched entrypoints; this slice adds zero.
- Package publish dry-run, JSR audit process, `quality:scan`, and `arch:check`: exit 0.
- Package file ceiling 9/10; no dependency change; no production abort/cancel calls; `deno.lock`
  remains byte-identical at SHA-256
  `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c`.
- No local runtime, Aspire, Docker, or browser command was run.
- CLI closure parity now passes, and regenerated agent-docs carrier freshness exits 0 with zero
  stdout bytes and no unstaged carrier diff.
- Repair-scoped check/lint/clean-format receipts have non-empty stdout (301/349/298 bytes), and
  `quality:gate` exits 0. A diagnostic format receipt preserves one inherited finding on an
  unchanged line in the normally excluded CLI source registry rather than expanding scope.
- Repo-wide test census moved from 4467 passed / 1 parity failure / 19 ignored to 4468 passed / 0
  failed / 19 ignored. The evaluator-attributed Fresh Rollup failure was left untouched and did not
  reproduce on this host.

## External handoff

The repair is one commit on top of `f3b50149e`; it must be pushed only by explicit refspec and
documented on the existing draft PR. Slice 2 owns the hosted Fresh/Vite A → B → A browser proof;
evaluator lifecycle remains supervisor-owned.
