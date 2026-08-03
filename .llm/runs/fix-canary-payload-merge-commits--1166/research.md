# Research — fix-canary-payload-merge-commits--1166

## Re-baseline

- Carried-in source: issue #1166 and the user-provided slice contract.
- Re-derived against `origin/main` @ `fb75cf6fc5ad02130ada0ac42e6f44035ac03a9b` on 2026-08-03.
- The reported defect is still present: `deriveCanaryPayload` consumes
  `git rev-list --first-parent --reverse <previous>..<head>` and therefore cannot see PR merge
  commits reachable only through the second parent of a release-branch update merge.
- The existing empty note is explicit, but the successful check detail only reports `0 PR(s)` and
  does not distinguish a zero-commit range from a non-empty range whose PR derivation found nothing.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | `deriveCanaryPayload` is injected with a `firstParentCommits` port and iterates only those commits. | `.llm/tools/release/canary-label.ts` `CanaryPayloadDependencies` and `deriveCanaryPayload` |
| 2 | The concrete git adapter calls `rev-list --first-parent --reverse`. | `.llm/tools/release/canary-label.ts` `firstParentCommits` |
| 3 | Git range set difference already excludes every commit reachable from the previous point; removing `--first-parent` includes second-parent work without re-including old ancestry. | `git rev-list <previous>..<head>` semantics; synthetic fixture planned below |
| 4 | GitHub PR association is deliberately strict: a commit counts only when it is the PR's merge commit and the PR base is `main`. This prevents the release-branch update merge itself from being treated as a payload PR while allowing its buried `main` PR commits. | `.llm/tools/release/canary-label.ts` `GitHubClient.associatedPullRequests` |
| 5 | The observed false-green has one commit in the first-parent range (the update merge) but no associated PRs. Therefore `commitCount > 0 && pullRequests.length === 0` is a detectable suspicious empty, while `commitCount === 0` is a genuine empty range. | #1166 root-cause log and existing `merge-history-payload PASS: 0 PR(s)` output |
| 6 | Exceptions from git, commit association, closing-issue lookup, or title lookup already become a named `merge-history-payload FAIL`; the missing failure mode is a successful but suspicious empty derivation. | `main()` check allocation/catch and existing negative lookup test |
| 7 | Existing tests cover unpublished-version refusal, idempotent release payload/update mechanics through the client path, explicit empty-note rendering, and target-train drift semantics. | `.llm/tools/release/canary-label_test.ts` and adjacent release tests |
| 8 | This is internal repo tooling only. No workflow, package, plugin, publish-mechanics, dependency, or lockfile change is needed. | User scope and anticipated files |

## jsr-audit surface scan (package/plugin waves)

- N/A. The slice changes internal release tooling and its focused test only; it does not change a
  publishable package/plugin surface, exports, or dependencies.

## Open questions

- Resolved now: use the full `previous..head` commit set in reverse topological order; preserve the
  existing GitHub association filter and payload de-duplication.
- Resolved now: return derivation evidence (`commitCount` and an explicit outcome) with the payload.
  Zero commits is `genuine-empty`; commits with PRs is `populated`; commits without PRs is a thrown
  derivation failure that the preallocated check reports as `FAIL`.
- Resolved now: prove the regression with a real synthetic git DAG in a temporary repository, not a
  mocked list that could accidentally encode the desired result.
- Safe to defer: live canary.1 proof, the post-update-branch real cut, and #1149 re-verification.
  Those are acceptance boxes 2–4 and remain orchestrator-owned after this PR merges.
