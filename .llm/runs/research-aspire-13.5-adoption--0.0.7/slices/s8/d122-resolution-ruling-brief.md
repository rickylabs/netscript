use harness

## SKILL

- netscript-harness — commit + push, run-dir artifacts.
- netscript-doctrine — `packages/cli` is framework code; this is a re-base, not a re-design.
- netscript-tools — `gen:assets-barrel`/`check:assets-barrel`; scoped check/lint/fmt wrappers;
  `git ls-remote` immediately before any `--force-with-lease`.

## D-122 — coordinator ruling on the D-121 semantic collision: resume and complete

Your D-121 abort was **correct and accepted** — thank you for stopping at the non-generated conflict
instead of force-resolving, and for catching that `01f27d4d4..f06209d39` is 10 commits (the brief's
"9" was the supervisor's miscount; your endpoint range was right).

### The ruling

The conflict is **not** an open design question. Supervisor analysis established that S8's new export
`createTypedDbPhaseBGate()` is **architecture-independent**: it never references the listener
contract, it only calls `commandGate(GATE.RUNTIME_TYPED_DB_PHASE_B, …)` and spawns
`verify-typed-db-phase-b.ts`, needing only a `resolve` import and `context.request.options.database`.
It is merely co-located in the conflicting file. Caller audit at `f06209d39` confirms:

- S8's `listenerUnreachableExpectations` / `databaseListenerExpectation` are referenced **only** by
  `listener-readiness-gates.ts` itself and by S8's own `listener-readiness-gates_test.ts`.
- `createTypedDbPhaseBGate` / `RUNTIME_TYPED_DB_PHASE_B` are referenced by
  `scaffold-capability-gates.ts`, `cli-surface.ts`, `capability-suites.ts` (×2), and
  `runtime-gates_test.ts` — all additive, no listener coupling.
- `main`'s version still exports `listenerReadinessExpectation`, `listenerReadinessWaitCommand`,
  `createListenerReadinessGates`, and already imports `DATABASE`/`DatabaseEngine`.

**Coordinator ruling — resolve `listener-readiness-gates.ts` as follows:**

1. **Base = `main`'s version** of the file (the shipped D-101 listener architecture:
   `listenerFaultExpectations`, test-only health-check keys, controller-listener names,
   `parseListenerFaultDatabase`). Keep it intact.
2. **Append only** S8's `createTypedDbPhaseBGate()` function, plus the `resolve` import it needs.
   Preserve its body byte-for-byte from `f06209d39` (gate id, title, permission flags, argv order,
   and cwd resolver unchanged).
3. **Drop** S8's superseded `listenerUnreachableExpectations()` and `databaseListenerExpectation()`,
   and drop S8's old `createListenerReadinessGates` body in favour of `main`'s.
4. For **`packages/cli/e2e/tests/application/gates/listener-readiness-gates_test.ts`**: take
   **`main`'s** version. S8's edits to that file covered only the dropped helpers; S8's typed-db
   coverage lives in `runtime-gates_test.ts`, which S8 changes separately and additively — keep S8's
   changes there.
5. Preserve **all** other S8 typed-db work unchanged (`operation-runner*.ts`,
   `generate-db-cli-mode*`, `run-tool.ts.template`, `verify-typed-db-phase-b.ts`,
   `scaffold-capability-gates.ts`, `cli-surface.ts`, `capability-suites.ts`, `runtime-gates_test.ts`,
   and the harness run-dir docs).

### Continue the same rules for the rest of the rebase

- Generated files (`*.generated.ts`, generated `*.template` snapshots under
  `packages/cli/src/kernel/assets/generated/`) → take `main`'s side, no hand-merge (as you already
  did three times).
- **Any further non-generated source conflict beyond this one file → abort again and report.** This
  ruling authorizes exactly the `listener-readiness-gates.ts` + its test resolution above, nothing
  broader.

### Tail (unchanged from D-121)

- Finish the rebase, then run **`deno task gen:assets-barrel` once**, then
  **`deno task check:assets-barrel`** and confirm diff-clean. Commit any regeneration delta as a
  single clearly-scoped commit.
- Verify: `git merge-base HEAD origin/main == origin/main`;
  `git range-diff 01f27d4d4..f06209d39 origin/main..HEAD` with commit mapping reported (the
  listener-gates commit is expected to show `!` — explain it as this ruling); explicit confirmation
  the 17 stale S5 and 7 stale S6 commits are **absent**; scoped structured check on
  `packages/cli` + `packages/cli/e2e`; scoped lint/fmt on the files this branch changes; focused
  tests for the touched areas (including `runtime-gates_test.ts` and the operation-runner suites);
  `deno task check:aspire-version-parity` `fail=0` (repair only affected manifest path rows if S8's
  file moves broke any, per the D-114 precedent).
- **No runtime**: no Aspire, Docker, AppHost, or `e2e:cli` runtime suites.
- **No PLAN-EVAL, no evaluator rerun** — every existing qualifying verdict stays valid at its
  recorded head.
- Push with `--force-with-lease` against the SHA from a `git ls-remote` run immediately beforehand.
  Do not delete or move the `aspire-13-5-s8-pre-reconstruction` safety tag.

### Report back

Old head, new head, per-conflict resolution taken, range-diff mapping (explaining the expected `!`),
confirmation the stale S5/S6 lineage is absent, every verification command's exit code, whether the
barrel regeneration produced a delta, and confirmation the worktree is clean and the push landed.
