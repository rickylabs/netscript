# Review — S1: Merge-aware canary payload derivation (#1166 / PR #1180)

## Reviewer identity

| Field | Value |
| --- | --- |
| Role | Required opposite-family substantive reviewer (implementation authored by Codex) |
| Reviewer | Claude Code supervisor |
| Model / effort | `claude-opus-4-8`, high-effort substantive review |
| Session | Separate review session from the Codex implementation session (review-only; no edits/commits/pushes/PR mutation/dispatch) |
| Scope reviewed | Uncommitted diff from HEAD in `/home/codex/repos/ns005-canary-payload-s1` on `fix/canary-payload-merge-commits-s1` |
| Date | 2026-08-03 |

## Verdict

**PASS**

The slice correctly makes canary payload derivation merge-aware, fails closed on the exact
false-green signature from #1166, preserves the label/note/drift/publish contract, and is proven by
a genuine synthetic git DAG. All named gates reproduce green independently. No correctness or
evidence weakness rises to `CHANGES_REQUESTED`. Two non-blocking residual risks are recorded below.

## Independent verification performed

- Rebuilt the synthetic DAG by hand and ran both traversals against real SHAs:
  - `git rev-list --first-parent --reverse previous..head` → omits the PR merge commit (OLD, RED).
  - `git rev-list --topo-order --reverse previous..head` → includes the PR merge commit and
    correctly excludes `previous` (NEW, GREEN).
- Focused suite `deno test --allow-all .llm/tools/release/canary-label_test.ts`: 15 passed / 0 failed.
- Adjacent suite `deno test --allow-all .llm/tools/release/*_test.ts`: 87 passed / 0 failed.
- Scoped `run-deno-check` (34 files, 0 diagnostics), `run-deno-lint` (0 findings),
  `run-deno-fmt --check` (0 findings).
- `git diff origin/main -- deno.lock`: empty (lock hygiene clean).
- Added-line scan for `deno-lint-ignore` / `@ts-ignore` / `as unknown as` / `as any`: none.
- `git status` / `--stat`: production+test changes confined to
  `.llm/tools/release/canary-label.ts` and `canary-label_test.ts`; remainder is run artifacts
  (`context-pack.md`, `worklog.md`, untracked `codex-thread-ids.md`).
- Read-only `gh pr view 1180`: body carries `Refs #1166` with **no** closing keyword; milestone
  `0.0.5`; exactly one `status:` label (`status:impl`) plus `type:fix`/`area:tooling`/`epic:harness-v3`.

## Verdict on each required check

1. **`rev-list --topo-order --reverse previous..head` includes second-parent PR merge commits but
   excludes ancestors reachable from `previous` — PASS.** Verified against a rebuilt DAG: the
   topo-order range returned `{R1, P1, PR-merge, HEAD}`, contained the PR merge SHA, and did not
   contain `previous`. Production adapter at `canary-label.ts:307-309` uses exactly
   `['rev-list', '--topo-order', '--reverse', `${previous}..${head}`]`.

2. **The synthetic DAG genuinely proves old omission and new inclusion rather than hard-coding —
   PASS.** `canary-label_test.ts:32-58` constructs a real temp-repo DAG (`Deno.makeTempDir` +
   `git init/commit/merge`, local identity, explicit `main`/`release`/`pr-1166` branches, a `main`
   PR merge, then a release-branch update merge). The test first asserts the *actual*
   `--first-parent --reverse` output does **not** contain the PR-merge SHA
   (`canary-label_test.ts:62-69`), then derives via topo-order and asserts inclusion. Association is
   keyed to the real merge SHA (`commit === pullRequest ? [1166] : []`), so the answer cannot be
   fabricated — if traversal missed the buried commit, `pullRequests` would be `[]` and the test
   fails. Independently reproduced.

3. **Zero commits → explicit `genuine-empty` PASS; non-empty/no-PR throws while
   `merge-history-payload` is active — PASS.** `deriveCanaryPayload`
   (`canary-label.ts:133-137`) throws before any issue/title lookup when
   `commits.length > 0 && pullRequests.length === 0`; zero commits yields
   `outcome: 'genuine-empty'` (`canary-label.ts:151`) with no association lookup (asserted by
   `associationLookups === 0`, `canary-label_test.ts:193-207`). In `main()`, `activeCheck` is set to
   `merge-history-payload` (`canary-label.ts:515`) **before** the derive call, so a suspicious-empty
   throw lands on that check as `FAIL` and `label-application` / `release-note-publication` / `drift`
   remain `NOT_RUN` — no downstream mutation masquerades as pass. The throw path guarantees the
   note's empty branch renders **only** for a true zero-commit range, keeping the "no commits landed"
   wording accurate.

4. **Strict association filtering, PR de-dup/order, closing-issue lookup, unpublished refusal,
   note upsert/idempotence, and drift semantics preserved — PASS.** `associatedPullRequests`
   (`merged_at !== null && merge_commit_sha === commit && base.ref === 'main'`,
   `canary-label.ts:374-377`) is unchanged, so the update-merge commit itself is never mistaken for a
   payload PR. De-dup via the insertion-ordered `seen` Set is unchanged; ordering is now deterministic
   reverse-topological. `assertPublishedCanary`, `publishCanaryRelease` (GET-tag → PATCH else 404 →
   POST), `closingIssues`, and `checkCanaryDrift` are behaviorally untouched (drift has a
   formatting-only reflow at `canary-label.ts:240`). Regression tests for unpublished refusal, empty
   note, closing-lookup failure, and both-direction drift all pass.

5. **No overreach — PASS.** No `.github/workflows/**`, `packages/**`, `plugins/**`, publish-mechanics,
   dependency, catalog, version, or `deno.lock` changes. `deno.lock` diff vs `origin/main` is empty.
   No new lint-ignore or type cast in added lines. The port rename `firstParentCommits → rangeCommits`
   is internal to the tool + its tests (no compatibility alias retained, per L2).

6. **Tests fail on the original implementation and cover required regressions — PASS.** The
   merge-buried test would return `[]` (fail `assertEquals(payload.pullRequests, [1166])`) under the
   old `--first-parent` traversal; the suspicious-empty test asserts a throw the original code did not
   produce; the genuine-empty test asserts an `outcome` field the original type lacked. The worklog
   records the RED capture (exit 1: 12 pass/1 fail) before implementation. Regression coverage
   (unpublished refusal, idempotent note path, association-based derivation, drift scoping in both
   directions) is retained and green.

## Findings

No blocking findings.

| # | Severity | Location | Finding |
| - | --- | --- | --- |
| 1 | info (non-blocking) | `canary-label_test.ts:71-76` | The concrete production adapter `rangeCommits` (`canary-label.ts:307`) is not exercised directly; the test injects a mirror closure using the identical `rev-list --topo-order --reverse` command. The adapter is a thin one-liner and was verified correct by inspection and by my manual DAG reproduction, so residual risk is low, and testing through the exported derivation seam is the established pattern for this tool. |
| 2 | info (non-blocking) | `canary-cadence.md:57-58,174` | Cadence prose still describes membership as "computed from first-parent merge history." The load-bearing claim (content-derived, not plan-derived) remains fully intact; only the incidental "first-parent" mechanism wording now lags the fix. Cadence-doc edits are explicitly out of this slice's scope (owned by the orchestrator); flagged for a later doc pass, not for this PR. |

## Residual risk

- **Doc wording lag (finding 2):** the cadence document's "first-parent" phrasing should be
  reconciled to "merge-aware range history" in a future doc-owned change so the schedule contract and
  the implementation read consistently. Not a correctness risk.
- **Adapter-vs-seam coverage (finding 1):** a future regression to the concrete `rangeCommits`
  command string (e.g. dropped `--topo-order`) would not be caught by the injected-mirror test.
  Verified safe now; a direct adapter test would close the gap if the traversal is revisited.
- **Deferred live evidence (in-scope by design):** acceptance boxes 2–4 of #1166 (real canary.1 cut,
  post-update-branch payload, #1149 re-verification) remain orchestrator-owned and correctly excluded;
  `Refs #1166` (no closing keyword) and the `0.0.5` milestone handoff are preserved.
