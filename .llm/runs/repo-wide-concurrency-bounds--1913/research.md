# Research — #1913 repo-wide concurrency bounds

## Re-baseline

- Carried-in source: issue #1913 and the implementation brief.
- Re-derived against `main` at `77ad823dcb1874ccfc8964b4679ad92a3a145e0b` on 2026-09-02.
- The issue's probability premise was false: Pages is not dispatch-only. The issue body was
  corrected before implementation.

## Findings

| # | Finding | How to verify |
| --- | --- | --- |
| 1 | `pages.yml` has `pull_request`, `push: main`, `release: published`, and `workflow_dispatch`; every non-PR arm maps to `pages-deploy`. | parse `.github/workflows/pages.yml`; issue #1913 corrected body |
| 2 | In the latest 100 Pages runs measured on 2026-09-02, 12 were main pushes; adjacent arrival gaps included 27 seconds, 4m11s, and 6m13s. | `GET /repos/rickylabs/netscript/actions/workflows/pages.yml/runs?per_page=100` |
| 3 | `cancel-in-progress: false` protects the running entry only. Without `queue: max`, a third arrival replaces the single pending entry; an evicted job has `steps: 0`. | #1908/#1910 evidence and GitHub concurrency documentation |
| 4 | The Pages deploy job declares `environment.name: github-pages`, but GitHub documents that environments and concurrency are independent. | `.github/workflows/pages.yml`; GitHub deployment documentation |
| 5 | The canary group is keyed by target/republish version and deliberately branch-agnostic. | `.github/workflows/release-canary.yml` |
| 6 | There are 13 workflow files and 10 concurrency blocks across 8 of them, including 2 job-level blocks in `e2e-cli.yml`. | parsed workflow sweep planned in `release-canary-workflow_test.ts` |

## Per-group analysis

### Pages

`pages-deploy` is a real global resource: the repository has one Pages site. Ref-templating the
non-PR arm would allow different refs to build and deploy concurrently, making publication order
nondeterministic. Keep the literal mutex and retain every queued arrival with `queue: max`.

The workflow-level group admits the complete classify/build/deploy run. The `github-pages`
environment on the deploy job supplies deployment records and protection gates, but it is not an
implicit concurrency group and therefore is not a substitute for the workflow-level mutex.

### Release canary

The version key represents one immutable registry entity across every branch. It must remain
branch-agnostic: ref-templating or adding a `-v2` generation would allow two branches/generations to
publish the same version concurrently. `queue: max` makes each explicit maintainer dispatch run in
series and receive an auditable result. A redundant later attempt may fail closed at the existing
budget/registry/publish guards; that is preferable to silently evicting an earlier pending request.

## jsr-audit surface scan

N/A. This run changes GitHub workflows, one workflow contract test, and run artifacts only; it does
not change a package/plugin public or publishable surface.

## Open questions

- The live Pages scheduler demonstration depends on safely manufacturing a pending default-branch
  victim without reaching a real deployment. The gating must be exercised and observed before any
  claim stronger than structural proof is made.

