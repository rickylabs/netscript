# Implementation worklog — #1610

## Baseline

- Branch: `fix/route-pattern-unknown-param-error`
- Baseline: `77ad823dcb1874ccfc8964b4679ad92a3a145e0b`
- `HEAD` equals `origin/main` (`0 0` from `git rev-list --left-right --count
  origin/main...HEAD`).
- Initial tracked worktree state: clean. The supervisor-provided run directory was untracked.
- Harness profile: Archetype 4 (Public DSL / Builder) with the frontend overlay; current doctrine
  verdict for `packages/fresh` is Keep.
- PLAN-EVAL: N/A. #1610 supplies a bounded type-level defect, exact scope, RED/GREEN sequence,
  acceptance criteria, and four required gates; no architecture or sequencing decision remains
  open.

## Research finding — actual index-signature mechanism

The issue's stated cause is incorrect at the current baseline: static route segments do **not**
intersect `EmptyRecord` into a dynamic path. They resolve to the deliberately index-free
`EmptySegment` at
`packages/fresh/src/application/route/_internal/contract-types.ts:66-78`.

The `[x: string]: never` carrier enters through the shared `Simplify<T>` alias at
`packages/fresh/src/application/builders/define-page/types.ts:65`, which appends
`Record<PropertyKey, never>`. Internal pattern recursion applies that alias at
`packages/fresh/src/application/route/_internal/contract-types.ts:80-83`. Consequently, a known
param remains readable, while any unknown key resolves through the injected index signature to
`never` and is assignable to `string`.

Current-head reproduction against the internal route reference used by builder consumer tests:

```text
deno eval --check '<createRouteReference("/projects/[project]"); consumer reads path.project and path.channel>'
Check $deno$eval.mts
exit 0
```

The equivalent snippet through `packages/fresh/src/application/route/mod.ts` already produces
TS2339 because that compatibility facade spells its public inference separately without the shared
`Simplify<T>`. The remaining defect is the duplicated internal inference carried into builder
consumer contexts. The fix therefore belongs in that route-inference layer and must not alter the
meaning of shared `EmptyRecord`.

## Design

- **Public surface:** no new exports and no runtime behavior. Preserve `createRouteReference()` and
  its inferred `ctx.path` contract; only remove the internal unknown-key index signature.
- **Caller-facing shape:** `createRouteReference('/projects/[workspace]')` exposes
  `{ workspace: string }`; a consumer read of `ctx.path.project` is TS2339.
- **Domain vocabulary:** `EmptySegment` remains the route-local, index-signature-free empty shape.
  Route-pattern simplification may flatten intersections but must not add exactness through a
  catch-all `never` index signature.
- **Ports:** none.
- **Constants:** none.
- **Validation rule:** unknown path keys fail at the property-access site; dynamic, catch-all,
  optional catch-all, and static inference retain their existing shapes and runtime parsing.
- **Commit slice 1 (RED):** add a non-vacuous `@ts-expect-error` in the `definePartial` loader
  consumer for a renamed-away `project` param; prove the directive is unused before the fix.
  Files: `define-partial.test.tsx`, this worklog. Gate: scoped Fresh check must fail with TS2578.
- **Commit slice 2 (GREEN):** make internal pattern simplification and its empty recursion branch
  route-local and index-signature-free, update the obsolete carrier assertion, then run all four
  requested gates. Files: route inference types, `define-partial.test.tsx`, this worklog.
- **Deferred scope:** no global `EmptyRecord` change, builder-default migration, compatibility-tree
  cleanup, public export change, or runtime route behavior change.
- **Contributor path:** route-pattern syntax is defined in
  `src/application/route/_internal/contract-types.ts`; consumer inference is proved in
  `src/application/builders/define-partial.test.tsx`, while the unchanged four-pattern runtime
  matrix remains in `define-page/tests/builder.test.tsx`.

## Progress

- Research/mechanism verification complete before package edits.
- RED proof: the scoped checker selected 207 files and failed with exactly one diagnostic,
  TS2578 (`Unused '@ts-expect-error' directive`) at
  `define-partial.test.tsx:322`. This makes the test non-vacuous: the only reason for failure is
  that the renamed-away consumer key still compiles.
- RED SHA: `ce32a94338ac3ec23c11ed84b8ec5eae381ccf88`.
- GREEN behavior: internal route recursion no longer imports shared `Simplify<T>` and therefore no
  longer acquires its `Record<PropertyKey, never>` signature. Both route-inference copies use
  `EmptySegment` for the empty branch and preserve direct `EmptySegment` intersections. Shared
  `EmptyRecord` and builder `Simplify<T>` are unchanged.
- Consumer proof without the directive: `deno eval --check` fails only with TS2339,
  `Property 'project' does not exist`, while `path.workspace` remains `string`.
- JSR correction: an intermediate private `SimplifyRoutePatternPath` alias added one new
  `private-type-ref`; it was removed before commit. Final doc-lint returned to the existing
  45-diagnostic Fresh baseline and reports no finding in `route/types.ts`.
- GREEN SHA: `e79c88dcaadac6f6f57a98f25a3369791fb920ab`.
- Last package-changing head SHA: `e79c88dcaadac6f6f57a98f25a3369791fb920ab`.

## Gate evidence

| Stage | Command | Exit | Evidence |
| --- | --- | ---: | --- |
| RED | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh --ext ts,tsx` | 1 | 207 files; one TS2578 at the new consumer directive |
| GREEN check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh --ext ts,tsx` | 0 | 207 files, 2 batches, 0 diagnostics |
| GREEN test | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts --cwd packages/fresh -- --allow-all --unstable-kv ./src ./tests` | 0 | 276 passed, 0 failed; includes unchanged dynamic/catch-all/optional/static builder matrix |
| GREEN lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/fresh --ext ts,tsx` | 0 | 207/207 files, 0 findings |
| GREEN fmt | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh --ext ts,tsx` | 0 | 207/207 files, 0 findings |
| Quality | `deno task quality:gate` | 0 | code-quality scan and doctrine check pass; no findings from this slice |
| Publish | `deno task --cwd packages/fresh publish:dry-run` | 0 | dry run complete |
| JSR audit | `audit-jsr-package.ts --root packages/fresh --text` | 0 | package audit completes; only existing runtime/AI cardinality and slow-type warnings |
| Doc lint (supplemental) | `deno task doc:lint --root packages/fresh --pretty` | 1 | existing Fresh debt: 45 diagnostics; no `route/types.ts` finding and no diagnostic added by this slice |

Structured gate receipt summaries at GREEN head `e79c88dcaadac6f6f57a98f25a3369791fb920ab`:

```text
check  selection.filesSelected=207 batches=2 failedBatches=0 totalOccurrences=0
test   exitCode=0 passed=276 failed=0 ignored=0 totalResults=276
lint   filesSelected=207 filesProcessed=207 failedBatches=0 totalOccurrences=0
fmt    filesSelected=207 filesProcessed=207 failedBatches=0 findings=0
```

## Reconcile

- Draft PR #1916 opened on the RED commit with the required taxonomy and milestone `0.0.7`.
- #1610 remains open during implementation. All four acceptance boxes are now supported by local
  evidence; the PR may carry `Closes #1610` when updated after the GREEN commit.
- No new or deepened architecture debt. Browser validation is N/A because this is compile-time-only
  route inference with no runtime or rendered UI change.
