# PR-A drift log

## 2026-08-12

- No implementation drift. The assigned correction that #1436's prescribed extra word boundary is
  a no-op is treated as the locked contract: `(?<![\w-])` replaces the leading `\b`.
- Bootstrap commit identity differs from the stale short hash in the already-written PR body
  (`c2d8a8e4b` live versus `32beb395e` recorded). This is PR metadata drift only; do not rewrite
  history. Correct the body during S5.
- Gate 1's prescribed command omits `--allow-write`, but nine unrelated existing validation tests
  call `Deno.makeTempDir()`. Exact command verdict: exit 1, 39 passed / 9 permission failures. This
  slice will not edit unrelated tests or claim that verdict green. A supplementary run first showed
  `--allow-run` was also required by the existing Fresh UI fixture; with both missing permissions,
  all 48 tests pass. The orchestrator amended Gate 1 to include both permissions and accepted the
  resulting final-head green verdict.
- Known accepted limit: `Will be run after merge` is accepted because the locked #1415 predicate is
  deliberately leading-token and the evidence begins with `Will be`, not `will run`. This is the
  narrowness mandated by #1415 (reject unearned leading assertions without policing broader prose),
  not an implementation defect. Do not widen it without a new contract.
