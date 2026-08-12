# PR-A worklog — close-gate trust

## Identity

- Worktree: `/home/codex/repos/ns006-gatetrust`
- Branch: `fix/1436-1415-close-gate-trust`
- Base: `01aa12b67`
- Draft PR: #1527
- Implementation session: Codex (this thread); merge and evaluator authority remain with the orchestrator.

## Design

- Public surface: preserve `extractClosingIssues` and `resolveClosingIssueReferences`; add a pure,
  synchronously testable classification seam shared by the close-gate and mirror paths.
- Domain vocabulary: regex-derived closing reference classification is `issue`, `pull request`, or
  `lookup failed`; authoritative GitHub closing issues bypass classification because they are issues
  by construction.
- Ports: existing `GitHubClient` performs classification at each `main()` call site; no network call
  enters the pure resolver.
- Constants: one narrow leading not-yet-done evidence predicate for `pending`, `todo`, `tbd`,
  `will run`, `after merge`, and `not yet` after leading whitespace/bullet punctuation.
- Commit slices: S1 RED contract tests and artifacts; S2 keyword boundary; S3 PR classification;
  S4 evidence assertion; S5 full gates and PR evidence.
- Deferred scope: no prose workaround, parser refactor, workflow edit, or unrelated validation cleanup.
- Contributor path: extend the focused test corpora beside each exported predicate.

PLAN-EVAL: N/A — owner-recorded waiver for two mechanical predicates with complete contracts and
explicit gates. Separate-session review remains the orchestrator's authority.

## S1 — RED contract fixtures

- Added the full hyphen/word-prefix and punctuation keyword corpus.
- Added not-yet-done rejection, idempotent already-checked, and factual false-positive corpus.
- Added pure classification expectations for close-gate and mirror paths, including fail-loud lookup.
- RED command: `deno test --allow-read --allow-env acceptance-evidence_test.ts
  check-close-gate_test.ts mirror-acceptance-evidence_test.ts`
- RED verdict: exit 1. Type checking reported six expected missing-contract errors: the resolver's
  fourth classification argument and classification fields do not exist, and the mirror has no
  `closingMirrorIssues` export. This proves the classification fixtures are red before production
  changes. The existing implementation also lacks both runtime predicates exercised by the new
  acceptance-evidence tests; those execute after the S3 API seam compiles.

### Reconcile

PR #1527 remains draft with `status:impl`, the required labels/milestone, and both closing keywords.
No scope adjustment is required.

## S2 — keyword boundary

- Replaced the leading word boundary with `(?<![\w-])`; trailing number boundary is unchanged.
- The focused parser corpus proves hyphen/word prefixes reject while line start and punctuation
  prefixes still resolve.
- Gate: `deno test --allow-read --allow-env --filter 'closing keywords reject'
  acceptance-evidence_test.ts` — exit 0, 1 passed, 10 filtered out.

### Reconcile

The implementation matches the corrected #1436 contract without preserving the prose workaround.

## S3 — PR-vs-issue classification

- Kept `resolveClosingIssueReferences` synchronous and pure; its optional classification map affects
  only regex-derived references, never GitHub's authoritative issue set.
- Close-gate output retains every reference with visible classification and `excluded: yes` for PRs.
- Mirror uses the same three classifications; lookup failures stay in its issue set and are reported.
- Gate: focused close-gate + mirror tests — exit 0, 16 passed, 0 failed.

### Reconcile

No network call entered either pure helper. The implementation stays within the assigned files.

## S4 — reject unearned acceptance ticks

- Added a leading-token predicate after stripping whitespace and common dash/bullet punctuation.
- Applied it only after resolving an unchecked box, preserving already-checked historical evidence.
- Errors accumulate through the existing `errors[]` path and name issue, exact box, evidence, and
  the repair: supply real evidence or leave the box unchecked.
- Proven RED at S2 head: the acceptance-evidence test command exited 1 with
  `not-yet-done evidence is rejected only for a newly ticked box ... FAILED` and
  `AssertionError: Expected function to throw.`
- Proven GREEN after S4: focused acceptance + mirror command exited 0, 13 passed, 0 failed; this
  includes `— Pending …` rejection, normal ticking, factual non-asserting marker sentences, and all
  pre-existing mirror cases.

### Reconcile

The predicate remains narrow: factual sentences containing marker words later in the evidence pass.
