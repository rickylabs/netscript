# Worklog — Slice A client selector

## Design

- Public surface: none; this is an internal application resolver.
- Domain vocabulary: `ClientBinding` (selected path, query symbol, list input) and internal candidate identity.
- Ports: existing `FileSystemPort` only.
- Constants: preserve the existing prerequisite command as the sole diagnostic constant.
- Commit slices: one extraction slice, proven by focused selector/UI regression tests and the required repository gates.
- Deferred scope: every resource-command capability and public export.
- Contributor path: extend selector policy and its matrix in `client-selector.ts` and `client-selector_test.ts`; UI callers consume `selectClientBinding`.
- Archetype-6 inventory impact: no spine, layer-2 abstract, command, extension axis, adapter, permission, output, or composition change.
- PLAN-EVAL: N/A — the owner supplied an already evaluated locked plan (`PASS_PLAN_WITH_FINDINGS`, amendment applied) and explicitly instructed this run to record N/A.

## Evidence

| Gate | Exit | Evidence |
| --- | ---: | --- |
| Focused selector + #1664 UI regression tests | 0 | passed=19 failed=0; 6 selector cases + 13 unchanged UI cases |
| Structured CLI check | 0 | filesSelected=950, batches=8, failedBatches=0, occurrences=0 |
| Structured four-file lint | 0 | filesSelected=4, filesProcessed=4, findings=0 |
| Structured four-file fmt | 0 | filesSelected=4, filesProcessed=4, findings=0 |
| Full package-owned CLI suite | 0 | passed=1663 failed=0 ignored=0 |
| `deno task arch:check` | 0 | every root FAIL=0; pre-existing WARNs only; resource-slice child count=12 |
| `deno task quality:gate` | 0 | scanner ok=true, findings=0, allowCount=7; nested arch gate passed |
| `deno task docs:readme-fences` | 0 | PASS; type_errors=7 (baseline unchanged) |
| `deno task docs:jsdoc-examples` | 0 | PASS; unboundName=116, typeError=14 (baseline unchanged) |
| `git diff --check` | 0 | no whitespace errors |
| Lock hygiene | 0 | `deno.lock` has no diff |

The first full-suite run failed two browser-probe fixtures because `/ephemeral/tmp` is mounted
`noexec`. A targeted rerun with an executable temp root passed 25/25. A worktree temp root then
introduced unrelated Deno workspace-warning text into eight snapshot assertions. The authoritative
full rerun used `/home/agent/.tmp/netscript-slice-a` and passed 1663/1663 with no test edits.

## Selector matrix

- implicit zero: exact prerequisite failure;
- implicit one: selected by conventional path;
- implicit many: ambiguous, sorted service remedy, no auto-pick;
- explicit one: exact declared service identity, independent of filename;
- explicit zero: distinct no-match diagnostic plus available services;
- explicit duplicate: distinct duplicate-match diagnostic and both paths.

## Slice review

- Separate review session `/root/slice_review`: PASS, no blocking findings.
- Compared `web-scaffold.ts` against `a30405df1`: the selector body moved verbatim; UI changes are
  import, call-site rename, and binding-type rename only.
- `web-scaffold_test.ts` has an empty diff; all #1664 expectations are byte-unchanged.
- No command/input, service-query template, package export, carrier, or lockfile changed.
- Product touch set is three of the allowed four files; the untouched fourth file is the regression
  suite itself.
- Reconcile: #1354 remains partial and must use `Refs #1354`; no closing keyword. No scope or debt
  adjustment is required.
