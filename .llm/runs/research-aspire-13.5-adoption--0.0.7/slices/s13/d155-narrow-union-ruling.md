use harness

## SKILL

- netscript-harness — commit + push, run-dir artifacts.
- netscript-doctrine — `packages/cli` and `.llm/tools` are framework surfaces; no `any`, no unsafe
  casts, no new lint-ignores.
- netscript-tools — `gen:assets-barrel`/`check:assets-barrel`, `check:aspire-version-parity`, scoped
  check/lint/fmt, `git ls-remote` immediately before any `--force-with-lease`.

## D-155 — coordinator ruling: complete the S13 un-stack with a NARROW ADDITIVE union

Your earlier abort was **correct and accepted**. Two of the three conflicts were already ruled and I
resolved them by hand while you were unavailable; the third is now ruled below. Restart the un-stack
cleanly from the branch's current state (`d3f71c0b7`, clean).

### Rebase target — STACKED slice

```
git fetch origin main
git fetch origin test/aspire-13-5-s10-e2e-gate-upgrades
git rebase --onto c9e3fcbe8 a46ea16d0
```

Assert `git merge-base HEAD c9e3fcbe8 == c9e3fcbe8` (S10's corrected head). **Do not** assert against
`origin/main` and do not rebase onto main.

### Ruled resolutions

1. **`packages/cli/src/kernel/constants/scaffold/scaffold-aspire.ts`** — **keep S13's deletion** of
   `SCAFFOLD_COMMUNITY_TOOLKIT`. Zero-consumer check was proven: `git grep` over `origin/main` returns
   only its own declaration, and its content is duplicated by the live
   `SCAFFOLD_ASPIRE_INTEGRATIONS.DENO_KV` (identical `PACKAGE_ID` and `VERSION`). **Retain
   `SCAFFOLD_ASPIRE_INTEGRATIONS.DENO_KV` unchanged.**
2. **`.llm/runs/research-aspire-13.5-adoption--0.0.7/aspire-surface-manifest.tsv`** — generated
   artifact: take upstream, regenerate at the end, and let `check:aspire-version-parity` confirm the
   manifest matches the **post-deletion** tree.
3. **`.llm/tools/validation/check-aspire-version-parity.ts` + `check-aspire-version-parity_test.ts`**
   — **NARROW ADDITIVE UNION**:
   - **Preserve current-main's parity tool and its tests as the BASE CONTRACT.** Do not replace,
     rewrite, or regress existing behaviour or existing test cases.
   - **Layer S13's phase-2 behaviour and its focused tests on top** of that base.
   - Both sides' test cases must survive; the resulting suite must cover base contract **and** phase 2.
4. **`deno.json`** — add `--allow-run=git` **only to the parity task that actually invokes git**, and
   **retain `--allow-read`**. Final form for that task:
   `deno run --allow-read --allow-run=git .llm/tools/validation/check-aspire-version-parity.ts`.
   **No broader permission widening** — do not touch any other task's permissions, and do not add
   `--allow-run` without the `=git` restriction.

### Unchanged rules

Generated files (`*.generated.ts`, generated `*.template` snapshots) → upstream side, never
hand-merged. Gate-registration lists → additive union (keep both sides' gates). Anything touching
main's shipped D-101 listener contract → main wins. **Any conflict outside the four cases above still
aborts and reports.**

### Verify before pushing

- Stacked ancestry assertion above; range-diff mapping of S13's 9 own commits; stale S5/S6/S8/S10
  lineage absent.
- One `deno task gen:assets-barrel`, then `check:assets-barrel` diff-clean.
- **`deno task check:aspire-version-parity` → `fail=0`**, and confirm the task runs with exactly
  `--allow-read --allow-run=git`.
- Focused tests for the parity tool — **both** base-contract and phase-2 cases must pass.
- Scoped check/lint/fmt on changed files; **repo-wide `deno task check`** expecting
  `failedBatches: 0`.
- **Explicitly confirm `SCAFFOLD_ASPIRE_INTEGRATIONS.DENO_KV` still exists** and
  `SCAFFOLD_COMMUNITY_TOOLKIT` is gone.

**No runtime** — runtime is parked host-wide by an upstream Aspire constraint; do not start Aspire or
Docker. **No PLAN-EVAL, no evaluator rerun** (a separate GLM IMPL-EVAL will be dispatched by the
supervisor afterwards). Do not retarget the PR base.

Push with `--force-with-lease` against a freshly-read `git ls-remote` SHA. Report old/new head, each
of the four resolutions, the final `deno.json` parity-task line, verification exit codes, and confirm
the worktree is clean.
