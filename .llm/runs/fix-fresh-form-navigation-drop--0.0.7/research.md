# Research — fix-fresh-form-navigation-drop--0.0.7

## Re-baseline

- Carried-in source: issue #1609 and the S1 leaf brief.
- Branch base and measured gate commit: `dea44991120a2c5da96a89df0f68d69c455c035e`.
- Local `origin/main` at research time: `eaea940bea4c19593b97b9895b09f512039f4e13`. The single
  intervening commit changes only `packages/fresh/src/runtime/ai/create-chat-connection{,_test}.ts`;
  the owned form paths are unchanged from the branch base.
- The issue's named function is stale. The live function is `applyCollectionStrategy()` at
  `packages/fresh/src/application/form/components/enhancement.tsx:42`; its client-mode early return
  is lines 49–51, before `resolveFormNavigationProps()` at lines 62–71.
- The issue's declaration-site path is current, but its line needs re-derivation:
  `FormCollectionStrategyMode` is declared at
  `packages/fresh/src/application/form/_internal/runtime-types.ts:77`, and the published
  `FormCollectionStrategy` interface starts at line 89.

## Findings

| #  | Finding                                                                                                                                                                                                                                                                                                                                               | How to verify                                                                                                                                                                             |
| -- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | `FormCollectionStrategy` extends `Partial<FormNavigationStrategy>`, so `{ mode: 'client', navigation: 'document' }` is structurally valid today.                                                                                                                                                                                                      | `runtime-types.ts:79-99`; `deno doc packages/fresh/src/application/form/mod.ts` renders the inherited optional `navigation`.                                                              |
| 2  | `applyCollectionStrategy()` returns the original button props unchanged for absent strategies and `mode === 'client'`. The return precedes navigation resolution, so both `navigation` values are silently ignored in client mode.                                                                                                                    | `enhancement.tsx:42-58`.                                                                                                                                                                  |
| 3  | The early return is semantically deliberate for client ownership: server/hybrid modes add submission transport metadata (`f-client-nav`, `f-partial`), while client mode adds neither. `useFormEnhancement()` merely exposes `collectionStrategies`; this package contains no client collection submit path that could perform a document transition. | `enhancement.tsx:49-58,85,155-161`; package-wide call-site search finds no other collection-mode implementation.                                                                          |
| 4  | Fresh can honor document navigation on a submission element by resolving the nearest `f-client-nav` and opting out only when its literal value is `"false"`. That does not make it a truthful client-mode collection behavior: correctly client-owned collection updates do not submit.                                                               | Cached Fresh 2.3.3 `src/runtime/client/partials.ts:41-45` (`5b0e…9840`) and server hook `preact_hooks.ts:185-197` (`5f4b…d3f1`).                                                          |
| 5  | Therefore route (1)—moving navigation resolution before the mode gate—would attach fallback submission metadata to a mode whose declared ownership avoids submission. Route (2) is the truthful fix: reject navigation policy for client mode at the type boundary.                                                                                   | Findings 2–4; doctrine A1/A2 require the public type to match executable behavior.                                                                                                        |
| 6  | No existing test asserts the current silent drop. The only collection navigation test uses `mode: 'server'`; no form test constructs `mode: 'client'`. Changing type acceptance is a contract change, but no checked-in test canonizes the faulty combination.                                                                                        | `components/form.test.tsx:158-205`; `rg "mode:\\s*'client'" packages/fresh/src/application/form --glob '*test*.ts*'` returns no matches.                                                  |
| 7  | The exact early-return pattern is not repeated in sibling form/enhancement helpers. `Form` and `useFormEnhancement` both consult `resolveFormNavigationProps()` without a mode gate; the package-wide form search finds the mode-client gate only at `enhancement.tsx:49`.                                                                            | Focused `rg` over `packages/fresh/src/application/form/**/*.{ts,tsx}`.                                                                                                                    |
| 8  | `FormCollectionStrategy` is published from `@netscript/fresh/form`: `_internal/runtime-types.ts` → `runtime/types.ts` → `form/mod.ts:64-110`. It is not exported from the package root entrypoint.                                                                                                                                                    | `deno.json` export `./form`; `deno doc` succeeds for the form entrypoint and the root-filter lookup does not find the symbol.                                                             |
| 9  | Narrowing requires a discriminated union/type alias (client branch with `navigation?: never`; server/hybrid branch with optional navigation). This is a potentially breaking published TypeScript change even though runtime JavaScript remains unchanged.                                                                                            | Current interface cannot correlate `mode` and `navigation`; doctrine public-surface rules and release surface-diff semantics.                                                             |
| 10 | The generated MCP export corpus will move. Its generator consumes every package export with `deno doc --json`, renders interface/type-alias declarations including properties, and embeds a compressed payload in `packages/mcp/.../export-surface-corpus.generated.ts`. The checked release baseline also hashes `FormCollectionStrategy`.           | `.llm/tools/docs/generate-export-surface-corpus.ts:52-115,181-220,275-307`; `.llm/tools/release/baselines/public-surfaces.json` `@netscript/fresh` → `./form` → `FormCollectionStrategy`. |
| 11 | Changing the declaration from interface to type alias also makes the hand-authored reference row outside the leaf stale (`docs/site/reference/fresh/index.md` currently labels it `interface`). These cross-package/docs changes exceed the leaf ceiling and must be reported, not absorbed.                                                          | `docs/site/reference/fresh/index.md:379`; leaf independence contract.                                                                                                                     |

## Design-decision conclusion

`mode: 'client'` cannot itself honor `navigation: 'document'`. In this API, the mode selects who
owns the collection update; client ownership bypasses the form-submission transport metadata that
navigation configures. Emitting `f-client-nav="false"` before the gate would only change a native
submission fallback, not supply a document-navigation operation for the client-owned update.

Lock route (2): model `FormCollectionStrategy` as a discriminated union. The client branch accepts
`mode: 'client'` and forbids `navigation`; the server/hybrid branch retains optional
`navigation: 'client' | 'document'`. Keep the legacy `partial` and `clientNav` fields unchanged in
both branches: they are already silently ignored for client mode, but narrowing them would broaden
the breaking surface beyond #1609.

## Existing-test contract answer

No checked-in test asserts the silent-drop behavior. The closest test,
`applyCollectionStrategy accepts the shared document navigation policy`, asserts document navigation
only with `mode: 'server'`. S2 must add a compile-time negative assertion for the client combination
plus positive client and server/hybrid witnesses.

## JSR / published-surface scan

- Surface scanned: `packages/fresh/deno.json` export `./form`, the re-export chain, `deno doc`, the
  JSR package audit, package publish dry-run, release surface baseline, and MCP corpus generator.
- Consequence: the public symbol changes from an interface to a discriminated type alias. Existing
  source that explicitly supplies navigation with client mode will stop type-checking. Mark this as
  a potentially breaking surface change; do not describe it as an implementation-only fix.
- `@netscript/fresh/form` is doc-lint clean at base. The whole package has an exact pre-existing
  doc-lint baseline of 45 diagnostics (28 `private-type-ref`, 17 `missing-jsdoc`) in untouched
  builders/query/route/streams entrypoints.
- The package audit reports two pre-existing warnings: F-DOCT-5 cardinality and the audit script's
  slow-types banner count. The authoritative package `deno publish --dry-run --allow-dirty` exits 0
  and completes successfully.
- MCP/export corpus consequence: yes, the corpus moves because the normalized declaration signature
  and kind move. Regenerating `packages/mcp/**`, updating
  `.llm/tools/release/baselines/public-surfaces.json`, or editing the docs reference is outside the
  locked product path ceiling. S2 must report that discovered churn to the supervisor rather than
  commit it.

## Sibling-pattern answer

No sibling form/enhancement helper repeats this early-return pattern. The only occurrence of a
`strategy.mode === 'client'` gate in `packages/fresh/src/application/form` is
`applyCollectionStrategy()`. The root `Form` component and `useFormEnhancement()` resolve navigation
directly and do not silently skip it through a collection-mode gate.

## Open questions

- Resolved now: route (2), type narrowing, is the product fix.
- Resolved now: do not narrow legacy `partial`/`clientNav` in this issue.
- Resolved now: PLAN-EVAL disposition remains the supervisor's ruling; this generator stops after S1
  push and does not create a verdict.
- Safe to defer: whether a later cleanup should also make client-mode `partial` and `clientNav`
  unrepresentable.
- Supervisor scope decision after S1: assign the MCP corpus, release surface baseline, and docs
  reference churn to an owning follow-up/slice, or explicitly expand this leaf. They are not inside
  the current ceiling.
