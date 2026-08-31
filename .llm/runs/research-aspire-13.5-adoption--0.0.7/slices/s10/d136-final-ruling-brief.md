use harness

## SKILL

- netscript-harness — commit + push, run-dir artifacts.
- netscript-tools — `gen:assets-barrel`/`check:assets-barrel`; scoped check/lint/fmt; `git ls-remote`
  immediately before any `--force-with-lease`.

## D-136 — final coordinator ruling on both S10 blockers; complete and push

Both of your D-133 stops were **correct and accepted**. Rulings:

### 1. Ancestry assertion was wrong in my brief — corrected

I required `git merge-base HEAD origin/main == origin/main`. That is **structurally impossible for a
slice stacked on S8**, and you were right to refuse the force-push. **The correct assertion is:**

```
git merge-base HEAD bc838a0b3 == bc838a0b3      # S8's reconstructed head
```

S10 stays stacked on S8 (its PR base is the S8 branch) until S8 itself merges. Do **not** rebase S10
onto `origin/main`, and do not chase main's tip.

### 2. Production/test path mismatch — canonical module wins

- **Preserve `main`'s `packages/cli/e2e/src/application/gates/scaffold/runtime/verify-listener-readiness.ts`**
  (already done — keep it byte-for-byte, `ListenerHealthReport` + `readListenerHealthReport()`
  exported).
- **Preserve `main`'s shipped, CI-verified `listener-readiness-gates_test.ts`** as-is.
- **Repoint `listener-readiness-gates.ts` back to that canonical module** — the bounded one-line
  change reverting S10's path switch, so `listenerReadinessWaitCommand()` executes
  `verify-listener-readiness.ts` again.
- **Drop S10's cosmetic `runtime/evidence/listener-readiness.ts` relocation** (delete the relocated
  module if it exists only to serve that repoint). S10 does not depend on the new location; keep the
  rest of its `evidence/` work (`describe-follow.ts`, `resource-command.ts`) untouched.

This makes the focused suite **89/89** instead of 88/1. **Final ruling; no evaluator rerun.**

### Unchanged

Everything else in S10 stays as reconstructed: gate registrations (additive union — keep both S8's
and S10's gates), receipt gates, `describe --follow` parser, DTO completeness, run-dir docs, and the
manifest row drop for the deleted `wait-for-workers-runtime.ts`.

## Verify before pushing

- `git merge-base HEAD bc838a0b3 == bc838a0b3` (the corrected assertion).
- Stale S5/S6/S8 lineage absent; range-diff mapping of S10's own commits.
- Focused tests **including `listener-readiness-gates_test.ts` and `runtime-gates_test.ts` — expect
  0 failures**, and explicitly confirm `readListenerHealthReport` is still exported from
  `verify-listener-readiness.ts` and that the D-101 contract test passes.
- Scoped check/lint/fmt on changed files; **repo-wide `deno task check`** expecting
  `failedBatches: 0`; `check:aspire-version-parity` `fail=0`; one `gen:assets-barrel` +
  `check:assets-barrel` diff-clean.
- **No runtime** (a separate runtime lease is active elsewhere — do not start Aspire or Docker).
- Do not retarget the PR base.

Push with `--force-with-lease` against a freshly-read `git ls-remote` SHA. Report old/new head, the
one-line repoint, confirmation the relocation is dropped, and every verification exit code.
