# Coordinator repair evidence

Reviewed baseline: `83f0b63ec9c928782162b2ad0df9f93244a1e051`.

| Gate | Observed result |
| --- | --- |
| Structured repair red tests before implementation | 11 failed, 2 positive controls passed; exit 1 |
| Commit-page red control before GraphQL change | 1 failed, exit 1 |
| Foreign URL and boundary controls before link-policy fixes | Each targeted run failed once, exit 1 |
| GitHub upload/site route control before exclusion | 1 failed, exit 1 |
| Structured focused tests after repair | 69 passed, 0 failed, exit 0 |
| Structured check | 3 selected files, zero findings, exit 0 |
| Structured lint | 3 processed files, same root rules without root exclusions, zero findings, exit 0 |
| Structured format | 3 processed files, zero findings, exit 0 |
| release:preflight | all four checks pass, exit 0 |
| check:netscript-jsr-specifiers | zero failures, exit 0 |
| check:aspire-host-ports | no pinned host ports, exit 0 |
| check:aspire-version-parity | fresh manifest, zero failures, exit 0 |
| Live commit adapter | Read three PR #2558 commits using the read-only GraphQL query, exit 0 |

The red controls reproduce the coordinator's missing body/commit association and
repository guards, issue provenance pagination, transient/ambiguous POST failures,
and lost partial state after PATCH. Green tests also pin unchanged CI label gates,
write defaults, original comment-failure behavior, and dry-run defaults.

PR commit association uses cursor pagination on the PR's own GraphQL connection.
The [REST PR-commits endpoint](https://docs.github.com/en/rest/pulls/pulls#list-commits-on-a-pull-request)
limits results to 250; the new control finds the target in commit 251 without
including unrelated repository history. The
[PR commit connection](https://docs.github.com/en/graphql/reference/pulls#pullrequest)
keeps membership scoped to the requested pull request.

No real apply was run. No runtime resources were started. Raw machine reports and
evaluator transport files stay in the private project run; public paths here are
repository-relative. Independent repair evaluation PASS is recorded in repair-evaluate.md. Fresh-head
CI and final READY are tracked by the PR checks and delivery comments.
