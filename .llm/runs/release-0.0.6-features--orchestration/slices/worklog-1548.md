# Worklog — #1548 browser stream resolver

## Design

- **Public surface:** unchanged. `mod.ts` continues to export only `buildStreamUrl`,
  `getStreamsAuth`, and `getStreamsUrl` from this resolver; the injectable browser lookup is
  source-internal and imported by tests through its `src/` path.
- **Domain vocabulary:** the two finite browser keys are
  `VITE_services__streams__http__0` and `VITE_STREAMS_URL`; their narrow `ImportMeta` declaration
  lives in `stream-browser-environment.d.ts`.
- **Ports / seams:** `getBrowserStreamsUrlFromEnv()` is the pure injected environment-bag seam.
  `getBrowserServiceEndpoint()` is the impure edge that contains the literal static member reads.
- **Constants:** `STREAMS_RESOURCE_NAME` remains the server-side discovery constant. The browser
  member names are intentionally literal because their source shape is the substitution contract.
- **Commit slice:** one S1 implementation slice changes the reader shape and adds five tests. The
  scoped static gates, package tests, doc lint, repo quality gate, and explicit package source scan
  prove it. D6's catch narrowing was dropped because it was unnecessary to fix precedence or shape.
- **Deferred scope:** no Vite transform, scaffold template, SDK fix, real Vite build fixture, or
  browser-auth change.
- **Contributor path:** add browser discovery behavior in `stream-url-resolver.ts`; add finite key
  typing in `stream-browser-environment.d.ts`; preserve the source-shape guard in
  `stream-url-resolver_test.ts`.

## Implementation

- Replaced value-passed `import.meta` and computed browser-key indexing with the two binding literal
  member expressions.
- Split the pure injected-bag precedence lookup from the impure browser reader.
- Kept server/browser precedence and the public export map unchanged.
- Added a source-shape regression guard and a text-substituted module fixture that reaches the real
  `getStreamsUrl()` path. The fixture is not claimed as a real Vite substitution test.

## Tests added

1. `browser streams URL lookup prefers the full Aspire key over shorthand`
2. `browser streams URL lookup falls back to the shorthand key`
3. `browser streams URL lookup returns undefined when both keys are absent`
4. `browser streams URL reader preserves Vite-substitutable static member expressions`
5. `getStreamsUrl reaches the browser reader and preserves browser key order`

## Gate evidence

All required commands exited 0 after the final source shape landed:

| Gate | Result |
| --- | --- |
| scoped check | `filesSelected=45`, `failedBatches=0`, no findings |
| scoped lint | `filesSelected=45`, no findings |
| scoped format | `filesSelected=45`, `failedBatches=0`, no findings |
| package test task | `38 passed`, `0 failed` |
| doc lint | `totalErrors=0`, `totalMissingJSDoc=0` |
| `quality:gate` | exit 0; its configured roots do not include this package |
| explicit package source scan | `ok=true`, `findings=[]`, `allowCount=0` |

The package-quality verdict rests on the explicit
`scan-code-quality.ts --root packages/plugin-streams-core/src` result, not the repo-level quality
gate, whose `arch:check` roots omit `packages/plugin-streams-core`.

## Reconcile

- PR #1559 still carries `Closes #1548`, remains draft, and already has exactly one lifecycle label:
  `status:impl`.
- PLAN-EVAL PASS and its binding amendments are preserved. IMPL-EVAL remains for the orchestrator's
  separate evaluator session; this implementation session did not flip the PR ready.
- No plan, doctrine, or debt drift was introduced.
