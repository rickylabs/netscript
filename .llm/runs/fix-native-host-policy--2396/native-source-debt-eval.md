# Independent amended F-5 debt re-review — 2026-10-31

Same separate Anthropic plan/debt evaluator session; requested/observed claude-opus-5-5,
requested effort high, read-only tools and closed stdin. Covers exact23/22 disposition only;
all source, documentation, security, runtime and publication gates remain required.

**F-5 debt re-review: #2396 native-source repair (same independent session, read-only)**

Question: do the two amended entries correctly cover the exact 23/22-name numeric F-5 violation as `DEBT_ACCEPTED`? They do. They don't relabel either count as within the cap of 20. The rule is the same as in `fix-native-host-policy--u1/plan-f5-debt-eval.md:17-23`: `PASS` means no violation, `DEBT_ACCEPTED` means a violation with a valid entry, there is no type-only discount, and doc-lint is not waived.

**Entry check**

| Field | Workers `…F5-U1-20261027` (`arch-debt.md:2967-3013`) | Streams `…F5-U1-20261028` (`arch-debt.md:3015-3048`) |
|---|---|---|
| Named | PASS: ID unchanged, heading says 23 symbols | PASS: ID unchanged, heading says 22 symbols |
| Matching violation | PASS: 2 own + 21 native type-only names = 23, which exceeds 20. The entry says "no type-only discount" (`:2970-2972`) | PASS: 2 own + 20 native names = 22, which exceeds 20. The entry says "not numeric F-5 PASS" (`:3021`, `:3033`) |
| Matches the real facade | PASS: `plugins/workers/services/mod.ts:71-100` has 1 + 1 + 7 + 13 = 23 names, and its comment says 23 | PASS: `plugins/streams/services/mod.ts:53-80` has 2 + 7 + 13 = 22 names, and its comment says 22 |
| Inventory artifact | PASS: `native-source-export-inventory.json` lists 23 names with one runtime symbol, `startWorkersService` | PASS: lists 22 names with one runtime symbol, `startStreamsService` |
| Reason / cause | PASS: names `ProcedureErrorCode` and #2492's `code?` on `AuthzDecision`, and says the explicit union removes the dependency on the constant (`:2975-2977`) | PASS: same cause and same explanation (`:3023-3026`) |
| Owner | PASS: coordinator with `rickylabs` | PASS: coordinator with `rickylabs` |
| Deadline | PASS: 2026-11-10, no automatic extension, no growth past 23 (`:2993`) | PASS: 2026-11-10, no extension, no growth past 22 (`:3019`) |
| Status | PASS: open, `DEBT_ACCEPTED`, covers numeric debt only (`:3000-3002`) | PASS: open, `DEBT_ACCEPTED`, not numeric PASS |
| Amendment authority | PASS: links comment 6541660112 and allows exactly one added type (`:3003-3004`) | PASS: same link and limit, plus a pointer to this re-review (`:3039-3041`) |
| Closing gate | PASS: unchanged. Needs a reviewed fix that meets the cap, or a doctrine amendment with matching fitness updates, plus identity, inventory, doc-lint zero and retained gates. Nothing closes by analogy | PASS: unchanged, same requirements |
| Exclusions kept | PASS: streams, U2/U3/E1, security, release and E2E are outside the entry. Function `@example` and all docs obligations stay unwaived | PASS: workers, legacy streams main (S6), U2/U3/E1, security/release/E2E, and no dependency/lock change, cast, suppression or analogy. `@example` stays unwaived |

**Facts checked in the tree**
- `ProcedureErrorCode` is now the explicit union `'procedure_not_found' | 'procedure_retired'` (`packages/service/src/auth/types.ts:99`). The constant keeps its keys and values, has an explicit readonly literal annotation, and keeps `as const satisfies Record<string, ProcedureErrorCode>` (`:110-116`).
- The test asserts exact equality between the union, the literal union, the derived constant union, the full const shape, and root versus auth identity (`procedure-availability_test.ts:73-84`). It also keeps the runtime `assertStrictEquals`.
- No facade exports the constant, re-exports a value, uses a wildcard or alias, or copies a type structurally.

**Raw hash changes, recorded openly**
- `native-source-api-diff.json` keeps all four raw changes the tool labels "major": `ProcedureErrorCode` and `PROCEDURE_ERROR_CODES` at both `.` and `./auth`.
- Its stated cause: the alias is now written out, and the const now has an explicit annotation. Previously the doc JSON widened the inferred `as const` properties.
- The semantic proof is the fixture comparing baseline 4771da92 source with the current public root/auth exports. Per the record it passed 1/0/0: code types, full const types and runtime objects are exactly equal, and all exported names are kept across 8 entrypoints.
- The scanner and baseline are unchanged, and the 24/23 fallback was not used.
- I haven't rerun any of this; the pass counts come from the run records. The JSON stays the honest raw record, and nobody claims numeric PASS.

My round-1 non-blocking note did turn up: `isolatedDeclarations` TS9010/TS9027 (`worklog.md:426-429`). It was fixed inside the same native file with an explicit annotation of the unchanged shape. That is a source question for the substantive review and IMPL-EVAL; it doesn't affect this debt disposition.

**Binding scope**
- **Workers (`plugins/workers/services/mod.ts`), 23 names:**
  - Own: `startWorkersService`, `WorkersServiceOptions`
  - `@netscript/plugin/sdk`: `PluginServiceContext`
  - `@netscript/service`: `CorsOptions`, `RunningService`, `RunningServiceAddress`, `ServeOptions`, `ServiceApp`, `ServiceEnvironment`, `ServiceTlsOptions`
  - `@netscript/service/auth`: `AuthenticatorPort`, `AuthnOptions`, `AuthnRequest`, `AuthnResult`, `AuthorizerPort`, `AuthzDecision`, `AuthzOptions`, `AuthzRequest`, `Principal`, `ProcedureErrorCode`, `ServiceAuthPolicy`, `ServiceGuardedAuthPolicy`, `ServicePublicAuthPolicy`
- **Streams (`plugins/streams/services/mod.ts`), 22 names:**
  - Own: `startStreamsService`, `StreamsServiceOptions`
  - The same 7 `@netscript/service` names and the same 13 `@netscript/service/auth` names as workers. No `PluginServiceContext`.
- **Rules for both entries:**
  - Every native name is a direct type-only identity re-export.
  - No growth while the entries are open.
  - Target stays 2026-11-10 with no automatic extension.

**Conditions this verdict does not waive**
1. Doc-lint must exit 0 on both real facades at the committed head.
2. Function-level `@example` and every other documentation obligation still apply.
3. The full gate set in `native-source-repair-plan.md:40-46` still applies, including the full combined test scope, root check, publish dry-runs and JSR audit, plus the substantive source review before commit and the exact-head IMPL-EVAL.
4. Both entries point to `native-source-debt-eval.md`, which doesn't exist yet. It must be written from this review before the commit.
5. This is not source, lifecycle, security, runtime or release acceptance. Hosted e2e-cli stays coordinator-owned.

VERDICT: PASS
