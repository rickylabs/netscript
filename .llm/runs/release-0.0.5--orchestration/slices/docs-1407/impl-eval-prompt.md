# IMPL-EVAL — PR #1406 / issue #1407 (docs source-format consistency)

**Role:** independent evaluator. You did not write this code and must not defend it.
**Route:** Claude · Anthropic · Fable 5 · medium (native opposite-family; the work is Codex-authored).
**Protocol:** `.llm/harness/evaluator/protocol.md` + `.llm/harness/evaluator/verdict-definitions.md`.
**Subject head (exact):** `323644303832c8b86f55965237a78241ac7e3df1`
**Read-only worktree:** `/home/codex/repos/ns005-impleval-1406` (already checked out at that head).

## Hard boundaries

- **Read-only.** Do not edit, commit, or push anything anywhere. Do not run `git` write commands.
- **Never enter `/home/codex/repos/ns005-docs-consistency`** (the implementer's worktree) or
  `/home/codex/repos/ns005-w3b1`. Work only in your own worktree above.
- **Do not start Aspire, containers, or any `e2e:cli` runtime suite.** A serialized runtime token is
  held by another activity. Site build / unit tests / scoped checks are fine — they start no
  containers.
- Your final message is the verdict artifact. Emit `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`.

## Background you must not take on trust

`2f64cc001` (PR #1311) reflowed Markdown at ~100 chars *through* `{{ ... }}` Vento component
expressions, splitting double-quoted JS string literals across physical newlines. Vento's meriyah
parse then fails (`Unterminated string literal`) and `docs/site` cannot build. `pages.yml` runs only
on push to `main`, so no PR surfaced it; it has been red since 2026-08-05.

The orchestrator independently measured the build-breaking class as **2 files, 28 newlines**
(`data-persistence/how-to/database-migration.md`, `tutorials/storefront/02-catalog-service.md`).
Treat that as a claim to check, not a fact. A separate reported defect class is **raw Markdown
leakage from `index.vto`**, which the orchestrator did **not** investigate.

## Claims to falsify (each needs executed evidence, not reading)

1. **The build is actually repaired.** Run `deno task build` in `docs/site`. Record exit code and
   file count. Then `deno task check:links` and `deno task check:caveats`.
2. **Content preservation.** The repaired Markdown must not have lost or altered prose. Compare
   against `origin/main` with a word-level diff
   (`git diff --word-diff=porcelain origin/main...HEAD -- docs/site/**/*.md`) and state exactly what
   non-whitespace content changed, if any. If prose changed, judge whether each change is correct
   and intended — do not wave it through.
3. **The new gates can fail.** This is the most important check in this review. `check-source-format.ts`
   and `check-rendered-output.ts` are new. For each, **produce RED evidence**: construct the defect
   they claim to catch in a scratch copy *outside* the repo (e.g. under `/tmp`) or by feeding the
   checker a crafted fixture, and show the gate exits non-zero with a specific message. A gate you
   only read, or that passes on everything you throw at it, is a finding. Also run
   `check-source-format_test.ts` and judge whether its cases are real or tautological.
4. **The gates are reachable in CI.** Trace exactly which workflow runs the new checks on a
   **pull request**. If they run only via `docs/site` `deno task verify` inside `pages.yml`, note
   that `pages.yml` has `on: push: branches:[main]` and no `pull_request` trigger — in which case
   this defect class can still regress invisibly and the "gate" is post-merge only. Report what you
   find; do not assume either way.
5. **`index.vto` raw-Markdown leakage.** Determine what the leakage was, whether the change fixes it,
   and whether it is covered by a gate or only by the 360px browser proof.
6. **Lockfiles byte-equal to `origin/main`.** Verify `deno.lock` and any second lockfile with
   `git diff origin/main...HEAD -- '*.lock'` and a hash comparison. The claim is byte-equality.
7. **No weakening.** Confirm nothing in this diff relaxes, skips, or narrows an existing gate,
   check, or test to make the build pass. Inspect `docs/site/deno.json` changes closely.
8. **Scope discipline.** Does the diff stay inside the correctness defect #1407 claims to own?
   `docs/site/styles/docs.css` (+21) is in the diff — decide whether it is part of the correctness
   fix or unrelated scope creep, and say so.
9. **Bundle claims.** The lane reports a fresh supported agent-doc bundle of **170 pages** and
   **36 API-doc files**. Check whether those numbers are reproducible from this head and state the
   numbers you actually observe.

## Standard this run holds evaluators to

A prior IMPL-EVAL in this run returned `PASS` only after independently reproducing the failure the
slice claimed to fix and resolving a `passed=76` aggregate arithmetically. Verdicts resting on the
PR description or the lane's own comments are not acceptable. If you cannot execute something, say
so explicitly rather than inferring it passed.

Report findings as: claim → what you ran → observed output → verdict on that claim. End with the
overall verdict and, if not PASS, the specific minimal repair required.
