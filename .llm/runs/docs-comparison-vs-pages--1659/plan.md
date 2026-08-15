# Plan — comparison pages (#1659)

## Contract

Replace the protocol-oriented comparison surface with two concise, opinionated pages whose fixed
NetScript argument is proved by concrete, equivalent code. Remove every obsolete comparison and
migration route, keep the pages useful without JavaScript, and regenerate all affected doc assets.

## Plan gate

`N/A`: the owner supplied a contract-complete, four-slice implementation plan, exact scope,
validation commands, hard stops, and final Tier-A review boundary. No separate planning evaluator
is launched.

## Slices

| Slice | Change | Proof |
| --- | --- | --- |
| S1 | Delete the old comparison, migration, stored-result, and measurement-tool surfaces; rewire navigation and cross-references. | Search for removed routes and scoped diff review. |
| S2 | Add the frontend page, fixed-first code comparison, compact estimate table, and progressive selector. | Docs-site verify plus source inspection. |
| S3 | Add the backend page using public contracts, typed client, and worker APIs; add equivalent competitor examples. | API inspection plus docs-site verify. |
| S4 | Run the three generators in order; prove four freshness gates and all owner-specified docs/git gates. | Raw exit codes recorded in the worklog and PR comment. |

## Constraints

- No private source names, paths, or content in committed output.
- No framework behavior changes, lockfile changes, sub-issues, external dependencies, browser runs,
  services, or scaffold/E2E runs.
- Draft PR only; exactly one `status:impl`; stop after S4 for owner Tier-A review.

