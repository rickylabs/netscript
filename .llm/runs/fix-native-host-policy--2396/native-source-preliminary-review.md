# Preliminary independent native-source analysis — 2026-10-31

Same separate Anthropic implementation evaluator; requested/observed claude-opus-5-5,
requested effort high. Read-only; stdin closed. This is not signoff; full-suite terminal
evidence is required before the slice review gate.

**ANALYSIS: NO_SOURCE_BLOCKERS.** This is a preliminary source analysis only. It is not slice sign-off, checkpoint approval or implementation acceptance; those wait for the combined suite's terminal results.

**What changed since 4771da92** (the working tree is still uncommitted):
- **Native source** (`packages/service/src/auth/types.ts:95-116`):
  - `ProcedureErrorCode` is now declared first, as the explicit union `'procedure_not_found' | 'procedure_retired'`.
  - `PROCEDURE_ERROR_CODES` keeps the same keys and values. It now has an explicit `{ readonly NOT_FOUND: 'procedure_not_found'; readonly RETIRED: 'procedure_retired' }` annotation and `as const satisfies Record<string, ProcedureErrorCode>`.
  - The constant's JSDoc `@example` is still attached to the constant.
- **Facades:** `plugins/workers/services/mod.ts:96` and `plugins/streams/services/mod.ts:76` each add only a type-only `ProcedureErrorCode` export. Their comments now say 23 and 22. Neither exports the constant, and there are no aliases or wildcards. `native-source-export-inventory.json` matches at 23 and 22 names, each with one runtime symbol.
- **Debt** (`arch-debt.md`): both entries are amended to exactly 23/22, citing #2492. The 2026-11-10 target, the no-extension/no-growth rule and the closing gates are unchanged. Both link the coordinator's comment and `native-source-debt-eval.md`, which exists and is an independent PASS.
- **Test** (`procedure-availability_test.ts:73-84`): adds `IsExact` checks between the union and the literal union, between the union and the constant-derived union, between the full readonly const shape and its expected literal type, and between root and auth for both. The existing runtime assertions are unchanged. This makes the test stricter, not weaker.

**Authority is in order.** `supervisor.md` quotes #2474 comment 6541660112 word for word: "explicit string-literal union with the same two members… the const is checked against it, and a test asserts the two are exactly equal". The delta does exactly that. The write scope was recorded before the edits, the 24/23 fallback wasn't used, and no lock, dependency, export map or runtime value changed.

**The native API is compatible:**
- **Compiler and runtime proof:** the external `native-compatibility_test.ts` imports the real 4771da92 `baseline-native-types.ts`, whose lines 104-110 have the old `as const` and derived alias. It checks them against the current public root (`packages/service/mod.ts`) and `./auth`. Both the code types and the full `typeof` const types must be `IsExact`, and the runtime objects must be equal. That fixture is the right one, and its recorded result is 1/0/0.
- **No drift in either direction:** `satisfies` guarantees every constant value is in the union. The test's `IsExact` against `typeof C[keyof C]` guarantees every union member is in the constant.
- **The explicit annotation is fine:** `isolatedDeclarations` requires it, and it is exactly the shape TypeScript previously inferred. `as const` is now redundant but harmless.
- **The four raw "major" hashes** in `native-source-api-diff.json` are reported openly, and the explanation holds up. They come from the doc-JSON before/after comparison: Deno doc previously widened the inferred properties to plain `string` and dropped `readonly`, while the compiler types are identical. These hashes shouldn't cause trouble later:
  - the committed `.llm/tools/release/baselines/public-surfaces.json` has no entries for either symbol, so the release `surface:diff` will treat them as added symbols, not changed ones;
  - the `surface-diff.yml` lane runs only with a label and is `continue-on-error`;
  - the `breaking-migration` check looks only at PR labels and body.

**Non-blocking notes:**
1. `packages/service/README.md:400` and `docs/site/reference/service/index.md:368` still call `ProcedureErrorCode` "the derived" type. It is now the canonical union that the constant is checked against. The wording is slightly inaccurate but nothing is consumer-visible; fix it if convenient, through the canonical docs and prose generators.
2. Only the corpus is staged. The 4 source/test/facade files, the debt file and the run records are unstaged, and the 6 `native-source-*`/memory records are untracked. The commit needs all of them.
3. As already recorded, the combined suite is still running. Sign-off requires its terminal receipt, the root check, and the exact-head IMPL-EVAL covering the whole delta since d3a52cb1b. Hosted e2e-cli and the published graph stay coordinator- and release-owned.

ANALYSIS: NO_SOURCE_BLOCKERS
