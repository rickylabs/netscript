use harness

## SKILL

- netscript-harness — commit + push, run-dir artifacts; no self-certification.
- netscript-pr — body truth; do not self-advance lifecycle.
- netscript-tools — scoped check/lint/fmt; `git ls-remote` before any `--force-with-lease`.

## D-170 — S11 IMPL-EVAL returned CHANGES_REQUESTED. Fix the HIGH docs-accuracy defect.

Verdict: [comment](https://github.com/rickylabs/netscript/pull/1771#issuecomment-5474242157).
**The supervisor independently confirmed finding 1 in source — it is not disputable.**

### The defect

This slice's deliverable is **13.5 docs accuracy**, but the docs assert the *pre-pin* baseline is
current:

- `docs/site/explanation/aspire.md:83` shows a "generated" `aspire.config.json` with
  `"sdk": { "version": "13.4.6" }`, `Aspire.Hosting.PostgreSQL` `13.4.6`,
  `Aspire.Hosting.Redis` `13.4.6`, `Aspire.Hosting.Browsers` `13.4.6-preview.1.26319.6`.
- `docs/site/explanation/aspire.md:88-89` states this "is the baseline that the current
  `netscript init` emits."
- `docs/site/orchestration-runtime/how-to/deploy-local-aspire.md:58` likewise says "`13.4.6` on the
  default scaffold."

**All false at this head.** Verified:
- `packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts:5` → `ASPIRE_SDK: '13.5.3'`
- `packages/cli/src/kernel/constants/scaffold/scaffold-aspire.ts:17-37` → integrations `13.5.3`,
  Browsers `13.5.3-preview.1.26425.3`
- `packages/cli/src/kernel/templates/aspire/generate-aspire-config.ts:118-127` emits them
  **unconditionally — there is no 13.4.6 mode**
- The pin commit `798e901af` (#1727) is an ancestor of this stack's base.

**Also correct the false verification claim:**
`.llm/runs/docs-aspire-13-5-s11-public-docs-refresh--impl/worklog.md:61` records "confirmed current
head generates 13.4.6 baseline". That check was not actually performed against the generator. Replace
it with the truth and the command that proves it — do not quietly delete it.

### Required fix

1. Update every affected doc surface so the shown config and surrounding prose describe **13.5.3** as
   what `netscript init` emits today: the `aspire.config.json` sample (`sdk.version`, PostgreSQL,
   Redis, Browsers — use the exact pinned strings from `scaffold-aspire.ts`), the callout prose, and
   the `deploy-local-aspire.md` statement.
2. **Derive the values from the pinned constants, do not hand-copy them.** If the sample must stay
   literal, add a check or test that fails when `scaffold-versions.ts` / `scaffold-aspire.ts` drift
   from the documented strings, so this class cannot recur silently. Note the reason it recurred: the
   parity gate is Phase 1 only (scaffold/CI/root) and doc enforcement (`/13\.[0-4]\.[0-9]+/`) is
   deferred to S13 — so nothing currently catches stale versions in docs.
3. **Verify by running the generator**, not by reading: scaffold a throwaway project
   (`netscript init <name> --db postgres --no-git --non-interactive`), print the emitted
   `aspire/aspire.config.json`, and paste that exact output as the evidence. Delete the scaffold
   afterwards.
4. Address the evaluator's remaining findings on their merits; if you disagree with any, say so
   explicitly with file:line evidence rather than silently skipping.

### Gates

Scoped check/lint/fmt on changed files; `doc:lint` against the **named** public-doc roots this slice
touches (it is root-scoped — a bare invocation only prints usage); repo-wide `deno task check`
expecting `failedBatches: 0`.

**No runtime** beyond the scaffold-only generator check above — do not start Aspire or Docker.
**No PLAN-EVAL, no self-dispatched evaluator, no lifecycle label changes.** A fresh
supervisor-dispatched IMPL-EVAL follows.

Ancestry: this is a **stacked** slice — assert `git merge-base HEAD c9e3fcbe8 == c9e3fcbe8`. Do not
rebase onto `main`.

Push with `--force-with-lease` against a freshly read `git ls-remote` SHA. Report old/new head, the
generator output you captured, each doc surface corrected, and every gate's exit code.
