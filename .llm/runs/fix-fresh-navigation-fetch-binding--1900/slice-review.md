use harness

# Tier-A slice review and sign-off — Fresh navigation fetch binding (#1900)

## SKILL

- `netscript-harness` — enforce the slice review gate, inspect worklog/drift, and preserve the
  commit trail.
- `deno-fresh` — review Fresh 2.3.3 partial-navigation/browser semantics.
- `netscript-doctrine` — review the `packages/fresh` Archetype 4 boundary and unchanged public
  surface.
- `netscript-tools` — treat structured wrapper output as gate evidence and preserve lock hygiene.
- `netscript-pr` — preserve the draft PR #1904 commit-trail contract.

You are the fresh native opposite-family Tier-A reviewer for a Codex-authored implementation slice.
The working tree contains the complete uncommitted slice. Do not change product code and do not
broaden scope.

Read the harness activation/run-loop/lane-policy, this run's `research.md`, `plan.md`, `worklog.md`,
`context-pack.md`, and `drift.md`, then inspect the full diff against `HEAD` and `origin/main`.
Substantively review:

1. The raw original fetch remains available for identity-preserving restoration.
2. The callable used at both transport sites is bound to the real browser receiver.
3. The new test fails conceptually if either call is detached and covers intercepted plus
   pass-through paths.
4. Drain-never-abort, EOF-awaited disposal, history behavior, and wrapper ownership are unchanged.
5. Product scope is exactly `coordinator.ts` and `coordinator_test.ts`; navigation has zero
   production `.abort(`, `AbortController`, `.cancel(` tokens.
6. The entrypoint remains seven exported symbols and `deno.lock` is unchanged.
7. Gate evidence in `worklog.md` is truthful, including the unrelated full-package doc-lint
   baseline failure.

Run only small read-only/focused checks needed to verify the evidence. Do not run Chromium, Docker,
Aspire, or `e2e:cli`.

If the slice has a blocking finding, do not commit. Append a concise slice-review FAIL entry to
`worklog.md` using apply/edit tooling and return the finding.

If the slice passes, append a concise Tier-A slice-review PASS entry to `worklog.md` naming the
reviewed invariants and your session/model identity. Then create the supervisor sign-off commit with
message `fix(fresh): preserve the navigation fetch receiver`, including the two product files and
all current run-evidence changes, and push only with:

`git push origin HEAD:refs/heads/fix/fresh-navigation-fetch-binding`

Do not perform IMPL-EVAL in this session; a second fresh session will evaluate the committed slice.
Return `PASS` plus the commit SHA, or `FAIL` plus exact file/line evidence.
