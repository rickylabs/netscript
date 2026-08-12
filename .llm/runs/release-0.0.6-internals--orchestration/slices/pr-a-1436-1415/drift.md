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

## Orchestrator finding — `status:ready-merge` alone does not trigger the acceptance mirror

Recorded 2026-08-12 by the lane orchestrator while taking this PR through the pre-merge gate.

`.agents/skills/netscript-pr` states that "applying `status:ready-merge` itself triggers a fresh run
(the workflow listens to `labeled`)", and `check-close-gate.ts`'s own repair hint says "apply the label
and the labeled event triggers a fresh run". Both are **false against the current workflows**:

```text
.github/workflows/ci.yml:41       types: [opened, synchronize, reopened, ready_for_review]
.github/workflows/e2e-cli.yml     types: [opened, synchronize, reopened, ready_for_review]
```

`labeled` is not in either list, so no run is created by the label event. Observed here: the label was
applied at ~08:14Z, no new run appeared, `close-gate` stayed red on its pre-label result, and #1415's
four acceptance boxes remained unticked (`0` ticked at 08:19Z).

The operational rule that actually works is **label first, then push** — the push fires `synchronize`,
and because every read in the gate and the mirror is live, the label is observed by that run. This
commit is that push.

Not fixed here, deliberately: adding `labeled` to `ci.yml`'s trigger types would make the documented
behaviour true, but this PR's boundary is `.llm/tools/validation/**` and widening it to workflow
surgery mid-slice is how scope leaks. Raised to the owner as a separate decision.
