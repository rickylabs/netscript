# Qwen 3.8 Max — focused review: database architecture RFC

## Route receipt

| Field | Value |
| --- | --- |
| Requested model | `qwen/qwen3.8-max` |
| Requested effort | `max` |
| Evaluated commit | `5dfc4e8eb` (`docs/database-architecture-rfc`); RFC file verified byte-identical to commit |
| Files read completely | `rfcs/0000-database-architecture.md` (11,205 words); run `plan.md`; `reviews/root-rfc-review.md`; `research/typescript-schema-orpc-audit.md`; `research/runtime-validation-source-audit.md`; `research/prisma-8-deep-dive.md`; `research/market-analysis.md`; `research/planned-jsr-audit.md` |
| Prisma source inspected | **Yes** — pinned checkout `.llm/tmp/prisma-v8-rc1`, verified at tag `v8.0.0-rc.1` (commit `a76a6c5`). Paths read: `packages/2-sql/2-authoring/contract-ts/src/contract-types.ts:630-704`; `packages/3-extensions/postgres/src/contract/define-contract.ts:40-125`; `packages/2-sql/1-core/contract/src/types.ts:85-140, 200-220`; `packages/9-public/@prisma/orm-postgres/package.json` (export count). All inspections are **RC1 evidence**; no post-RC object was needed — the RFC's post-RC statements are correctly labeled as churn enumeration and were checked against the deep-dive's labeled post-RC table only. |
| NetScript source inspected | `packages/cli/src/kernel/adapters/database/workspace-resolver.ts:40-109`; doctrine `06-archetypes.md:209`, `02-public-surface.md:217-231`, `09-anti-patterns-and-fitness-functions.md:165` |

## Verdict: `PASS_WITH_CHANGES`

No decision, invariant, or refusal in D-01–D-47 is violated; the five findings are example-level and wording-level. One high finding (a flagship example that is not executable as written) must be fixed before the final refinement pass.

## Findings

| ID | Sev | RFC line(s) | Violated decision/invariant | Why it matters | Smallest correction |
| --- | --- | --- | --- | --- | --- |
| QF-01 | high | 309–310; consumed at 324, 334, 371–373 | Example-status block (169–171: `@netscript/*` examples "executable exactly as written"); one implementable API | `primary.binding.ts` shows `export declare const primaryBinding: AppBinding<…>` and `export declare const PRIMARY_MANIFEST_DIGEST` — ambient declarations emit **no runtime value**. But `primaryBinding` is imported as a value and called: `runtime.bind(primaryBinding)` (334) and `primaryBinding.ref({space:'app'}).model('User')` (371–373), and the digest is load-bearing for startup refusal (713–714). As written the module exports nothing and the imports throw at link time — the generated-binding example, the RFC's center of gravity, is pseudocode with incompatible symbol roles. | Rewrite the generated file as an emitted value module (e.g. the emitter constructs `primaryBinding` and the digest constant), or split into a `.d.ts` plus a runtime module the composition root imports. ≤3 example lines; no API change. |
| QF-02 | medium | 492–507 vs 661–665 | Dependency law: "only the adapter imports Prisma runtime or control modules"; application/plugin modules may import only the public **authoring** builder | The Step 7 extension bundle carries `control` and `runtime` facets. If the bundle is authored in app/plugin code as the example implies, that code must import Prisma `/control` and `/runtime` modules — forbidden by the RFC's own law. The RFC never says where `defineDatabaseExtension` bundles are defined, so the example can force a forbidden dependency (an implementation-gate question for the W3 import allowlist). | One sentence: extension bundles are defined by the adapter/extension-pack publisher inside the controlled build (facets opaque to consumers), or explicitly widen the law to allow controlled-build extension modules the public facet subpaths under the W3 allowlist. |
| QF-03 | low | 331, 335, 520–531 | Example-status "executable exactly as written" | The composition-root and control-journey examples (both presented as complete files with `@netscript/*` imports) leave `connections`, `runId` (×4), and `policy` unbound; `AccountStore`/`PrismaAccountStore` are prose-explained but not marked elided. Undercuts the executability claim the RFC makes of itself. | Declare the values (`const runId = …`, `const connections = fromEnv(…)`, `const policy = …`) or mark elisions with a comment. ~4 lines. |
| QF-04 | low | 181 | Claim attribution discipline | `packages/3-extensions/postgres/src/contract/define-contract.ts:46-121` is a path in the **Prisma** checkout but appears in the guide without attribution; every other citation in the section is a NetScript repo path. A reader will look for it in this repo. | Prefix "Prisma RC1" or link the deep dive. One phrase. |
| QF-05 | low | 899–901 | Audit-faithful wording (runtime-validation-source-audit §3/§4) | "Prisma's own Standard Schema usage validates codec parameters rather than model values, across three representations" conflates two distinct audit facts: `paramsSchema` validates JSON-sourced codec *parameters*; the three representations are *conversion* channels, not all validation channels. The derived conclusion (`runtime \| json` public, wire internal) is unaffected but the sentence overstates its premise. | Split: Prisma validates codec parameters, not model values; its codecs define three conversion representations, of which the driver-wire one stays adapter-internal. |

## Six-axis verdict

| Axis | Verdict | Negative evidence |
| --- | --- | --- |
| 1. TypeScript inference & API coherence | **FAIL** | QF-01/QF-03. The type model itself is sound: `defineDatabase`'s `const` generics with `DatabaseSpaceDefinition<string, Extract<keyof TTargets, string>, unknown>` make `target: 'primry'` error at the right call site (verified against R2's requirement); one 3-parameter generic `(TId, TQuery, TTx)` is used consistently for `AppBinding`/`ProcessTargetSession`; `RequestTargetSession<TId, TQuery>` has no `TTx` and no `transaction`; transaction surface is honestly deferred to W4 (358–363); no widening, private imports, re-export, or query DSL found in any signature. |
| 2. Standard Schema & trust boundaries | **PASS** | `input`/`output` semantics, `runtime \| json`, whole-model `'model'` form, construction-time `DB_VALIDATION_UNSUPPORTED` with coordinates, path-rich issues for invalid values, mandatory external boundaries, cache-key composition, codec value-schema requirement — all match the pinned-source audit. No full-parity claim (58–60, 408–414); no generated-validator repair pipeline (1084 row). Defect: QF-05 wording only. |
| 3. Control, recovery, artifact authority | **PASS** | Pure `createDatabaseControl` has no connection resolver (518–520; structural, not promised); `sign` is pure and lock-free; six-value authority table is disjoint; `outcome-unknown` on transport loss; resume = lookup (append + lookup by `RunId`/`ReceiptId`/resume token, source/sink split allowed); aggregate outcome when no target succeeds is failed/refused/outcome-unknown, never `partial-success` (854–856); every requested target appears with status; plan expiry/staleness/revocation codes present. No silent-subset or atomic-cross-target path found. |
| 4. Migration & plugin safety | **PASS** | One `managed` owner per `ObjectKey`; identical text is still a conflict; physical name collisions refused while the namespace capability is withheld (472–478, 592) — R1 resolved consistently across guide, refusal table, and reference; pinned mirror gives package-free apply/verify with `db.space.skew`; augmentation is grant-closed with explicit denies; detach-and-retain is the only guaranteed removal; adoption is marker-only over an explicitly selected target set with per-target statuses and blocked cutover; rollback row 2 promises marker removal only where provider semantics prove it. No accidental data-mutation claim found. |
| 5. Package & prospective JSR surface | **FAIL** (narrow) | Sole defect is QF-02 (last clause of this axis: whether any example forces a forbidden dependency). Everything else verifies: exact A1/A4/A3/A2/A2/A6 graph matches the plan; `-runtime`/`-control` never import each other or a provider; adapter subpaths are exactly root + `/binding`; inferred typing terminates app-local; `isolatedDeclarations` reasoning for the fragment-publish ban is correct; no slow-types waiver (669–671, 1088); no actual-publish-readiness claim anywhere in the RFC. |
| 6. Market/upstream claims & reader economy | **PASS** | All load-bearing upstream claims carry direct official links; RC1/post-RC separation is maintained (143–156); the 138-export-surface claim and the EA/scorecard claims are RC1-pinned and verified; comparator treatment credits each product before stating the limitation (no straw man); the NetScript row in the market matrix is labeled design-target, and the RFC never claims more. Defect: ~1,200 words of redundancy remain (ledger below). |

## Deletion ledger (≥1,200 words; no decision, invariant, refusal, or API contract removed)

| # | Location (lines) | Cut | Words |
| --- | --- | --- | ---: |
| 1 | 1006–1013 | Refusal boundary: delete the no-compat enumeration (restated verbatim at 1126–1131) and the no-re-export clause (restated at 661–665); keep only the no-text-patched-source/no-arbitrary-TS and no-implicit-target clauses | 80 |
| 2 | 1222–1233 | Unresolved questions: compress the implementation-time enumeration to the three largest open decisions (W3 allowlist/namespace; W5/W10 signatures; W10 window) — the full sweep is already linked in the plan (1219–1220) | 115 |
| 3 | 1190–1206 | Prior art: the five adopted lessons are already stated with links at 1092–1113; compress to link + one "no product is a template" sentence; keep the oRPC-precedent sentences (1208–1212) | 95 |
| 4 | 578–584 | "What you stop doing" prose: the eight-item enumeration restates Motivation and earlier guide steps; keep the refusal table and one intro sentence | 65 |
| 5 | 85–102 | Motivation defects: keep the `db add postgres --name analytics` counter-example and the non-atomic conclusion; move `resolveTarget` mechanics (`:66-91`, `PrimaryDatabase`) and the seven-step repair enumeration behind the linked current-state audit | 90 |
| 6 | 127–139 | "That attacks NetScript's pain points at the root" — compress the six-item mirror of Motivation to one clause | 35 |
| 7 | 913–919 | `ValidationIR` coverage paragraph: one sentence naming the supported algebra (the fail-closed inventory at 920–928 already carries the negative half) | 35 |
| 8 | 1115–1118 | Scope-law paragraph: already stated as D-31, summary non-goal (55–57), and alternatives row (1087); reduce to one sentence | 35 |
| 9 | 838–849 | Diagram-teeth prose: drop what the mermaid diagram already encodes (outcome-unknown edge, inspect-before-resume); keep never-replay, checkpoint granularity, lock scope, certified-lock refusal | 45 |
| 10 | 789–794 | Composition-validates prose: keep the determinism gate and "every invariant has a diagnostic"; drop the validation list duplicating guide refusals | 35 |
| 11 | 1053–1056 | Conformance-cost drawback: merge one sentence into the Early-Access drawback | 30 |
| 12 | 1029–1035 | Indirection drawback: drop the closing comparator ("four packages where a less disciplined design would ship one") | 30 |
| 13 | 1024–1028 | Early-Access drawback: mitigation list overlaps 157–163 and the risk register; compress | 30 |
| 14 | 866–870 | Serverless-precedent sentence: compress to a subordinate clause | 30 |
| 15 | 614–620 | Five-values paragraph: the authority table (771–782) re-introduces the same values with roles; shrink to a forward pointer | 30 |
| 16 | 222–225 | "Three things NetScript will not do": restated in summary non-goals, alternatives rows, and refusal boundary; one sentence pointing to alternatives | 45 |
| 17 | 1062–1073 | Why-this-shape: observation 3's operational-gap list is duplicated proof (lives in the deep dive); observation 4 restates 722–723 and 1037–1039 | 65 |
| 18 | 675–677 | Definition-layer wrap intro: overlaps Step 2 prose (276–280) and the contract-identity rule (703–704) | 30 |
| 19 | 741–749 | Two-phase paragraph: trim the phase-1 enumeration, keep the two-phase rationale and the no-registry/no-reduce law | 25 |
| 20 | 852–859 | Saga paragraph: the catalog-projection sentence restates Step 8's opening (510–512); keep freshness-gate/executed-examples clauses | 30 |
| 21 | 55–60 | Summary non-goals second sentence: compress the withheld-capability enumeration (each is detailed in Drawbacks/Unresolved/refusal table) | 25 |
| 22 | 282–290 | Target-key prose: drop the trailing "no fallback chain anywhere" sentence (restated at 1140–1141) | 20 |
| 23 | 1092–1113 | Market lessons: tighten each bullet ~8 words against the linked analysis | 40 |
| 24 | 432–436 | Step 5 isolation enumeration: compress to a pointer at the identity table | 15 |
| 25 | 1264–1267 | Future: policy-factory bullet — removed from v1 narrative per root review; its kill condition restates 1266–1267's own guard | 25 |
| 26 | 1216–1220 | Unresolved opening: trim the locked-topics enumeration | 15 |
| 27 | 1017–1022 | Drawbacks opening: trim ~20 words of restated scope | 20 |
| | | **Total** | **≈1,240** |

**Must not be cut:** all code blocks except the QF-01 rewrite; the refusal tables (586–599) and refusal boundary pointer; the authority and identity tables; the four inference rules and the soundness-seam paragraph; the namespace paragraph (989–1000); the fail-closed inventory and mandatory-boundary rules; the mermaid diagram (the one retained lifecycle diagram); the adoption step table, pre-cutover list, and rollback table; the alternatives table; the incident table; the operational-journey JSON/error examples; and all direct official links. With these cuts the RFC lands at ≈9,965 words.

## Claims checked and found sound (do not reopen without new evidence)

1. `@prisma/orm-postgres` publishes **138** top-level export subpath keys at the RC1 pin (RFC 149–151) — counted from `package.json` at tag `v8.0.0-rc.1`.
2. Authoring type maps lump all models under the default storage namespace and leave non-default namespace table maps empty (`contract-types.ts:644-691`, RFC 990) — verified verbatim; the withheld namespace capability (D-37) rests on accurate evidence.
3. The `defineContract(scaffold, callback)` overload exists with `const` generics preserving returned literal types; the callback receives `ComposedAuthoringHelpers<SqlFamily, PostgresPack, Extensions>` (RFC 179–182) — verified.
4. SQL field/operation/codec/aggregate type maps are installed under an optional phantom key (`__@internal/sql-contract/typeMaps@__`) — the "not runtime data" premise of bounded validation (RFC 893–896) — verified.
5. `workspace-resolver.ts:51` computes `join('database', provider.dirName)`; `resolveTarget` defaults only when exactly one target is enabled, never consults `NetScript.PrimaryDatabase`, and throws `Unknown database target: (default)` (RFC 86–91); engine selection is a four-engine `switch` (`:97-109`) — all verified against source.
6. Doctrine codifies plain `*.prisma` plugin fragments (A5, `06-archetypes.md:209`) and the oRPC-only slow-types carve-out (`02-public-surface.md:217-231`); AP-24 exists (`09-…:165`) — RFC 92–94, 667–671 are sound.
7. RC1 vs post-RC wording discipline (RFC 143–156) holds; post-RC churn items are correctly attributed as post-tag changes with linked evidence in the deep dive.
8. Root-review corrections R1–R10 are all present and consistent in the committed text (namespace contradiction, target-key location, structural offline control, pure `sign`, one binding generic, validation vocabulary, contribution modes, transaction honesty, receipt lookup, adoption closure).
