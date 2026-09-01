# Worklog — docs-plugin-sagas-core exports heading

## Design

- Public surface: no package export changes; adopt the existing nineteen-entrypoint table into the
  drift checker.
- Domain vocabulary: `PackageMapping.symbolCoverage` with `entrypoints-only` or `complete`.
- Ports/constants: none introduced.
- Commit slice: heading + mapping + derived corpus assets; proven by issue #1815's full gate set.
- Deferred scope: completing all sixteen subpath symbol inventories.
- Contributor path: update the reference page and its `AUTHORITATIVE_MAPPING` record together, then
  run the ordered corpus generators.
- `PLAN-EVAL: N/A` — mechanical scope with the only policy decision resolved from real doc output.

## Evidence

- Nineteen `deno doc --json` nodes, 724 symbol occurrences, exit 0.
- Sixteen entrypoints contain symbols absent everywhere on the page; representative omissions are
  named in the mapping reason.
- Ordered generators completed with exit 0: `gen:agent-docs-prose`, `gen:assets-barrel`, then
  `gen:publish-assets`.

## Gate results

The final pushed-head gate table is carried in the PR body. All required commands are rerun after
the implementation commit so Git-diff-based generated checks assess the committed head.

## Reconcile

- Issue #1815 remains open at `status:impl`, milestone `0.0.7`, with `type:docs`, `area:docs`, and
  `area:tooling`. The PR must carry `Closes #1815` and remain at `status:impl` for supervisor eval.
