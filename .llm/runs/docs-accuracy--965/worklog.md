# Worklog — docs accuracy

## Design

- Public surface: one cross-area “Preferred NetScript paths” table, one CLI mutation/regeneration
  map, and `deno task docs:accuracy`.
- Domain vocabulary: preferred path; source of truth; generated artifact; runtime consumer;
  preview support.
- Ports: filesystem reads only in the regression guard.
- Constants: eight preferred-path markers and eighteen mutating command families in the guard.
- Commit slice: one editorial/guard slice covering all three grouped issues.
- Deferred scope: adding transactional preview semantics to external database/cloud operations;
  that is product behavior, not a docs correction.
- Contributor path: update the relevant public guide/map, then run `deno task docs:accuracy` and
  the site verification task.

## Fails-before evidence

`deno task docs:accuracy` failed before the docs edits with:

```text
how-to preferred-path index: missing required accuracy marker "withResource"
```

After the edits it passed with four saga pages, eight preferred paths, and eighteen CLI mutation
families checked.

## Gate log

| Gate | Result | Evidence |
| --- | --- | --- |
| Accuracy regression | PASS | `deno task docs:accuracy` |
| Internal links | PASS | `deno task docs:links`: 98 docs, zero broken links/anchors |
| Live CLI sampling | PASS | Public entrypoint help sampled across ten command surfaces |
| Tool type check | PASS | scoped wrapper, `.llm/tools/docs`, 3 files, 0 findings |
| Tool lint | PASS | scoped wrapper, `.llm/tools/docs`, 3 files, 0 findings |
| Tool format | PASS | scoped wrapper, `.llm/tools/docs`, 3 files, 0 findings |
| Lume site build | NOT RUN to completion | The process terminated after diagram verification without an exit verdict or generated `_site` pages; no PASS claimed. |
| Source-doc links | PASS | `deno task docs:links`: 98 source docs, zero broken links/anchors |
| Caveat references | PASS | 27 markers across 22 source pages; all references resolve |

## Reconcile

- The PR remains draft and at `status:impl`.
- The PR body must retain `Closes #965`, `Closes #971`, and `Closes #972`.
- Issue corrections are posted for all three current-surface discrepancies.
