# PLAN-EVAL — fix-db-collection-runtime-family--c2

- Plan evaluator session: independent PLAN-EVAL, 2026-10-08 (separate session; evaluator vendor family Zhipu GLM via owner-selected OpenCode Go route `glm-5.3-flash`, max; generator vendor family OpenAI — separation satisfied; fallback not invoked)
- Run: `fix-db-collection-runtime-family--c2`
- Exact HEAD: `3ecd0c25729c5cc98dee3ebca2b9daf24781caea` (branch `fix/db-collection-runtime-family`; = stated baseline `2f82548cf95a5841557b789d0713e04225e1c9da` + 2 docs-only harness commits; merge-base with origin/main equals baseline; clean tree)
- Surface / archetype: Archetype 2 integration (`packages/sdk` + `packages/fresh`)
- Scope overlays: SCOPE-frontend (Fresh live-query/stream surface)

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research.md` exists; rebaseline explicit (current main verified = origin/main; SDK/Fresh stream/query manifests unchanged between baseline and HEAD). Load-bearing spot-checks re-verified against the tree (see Notes). |
| Decisions locked                        | PASS   | `plan.md` D1–D4 with rationale; locked-decision paragraph (pin qualified exact family, guard isolated consumer graphs, prove real worker stream Collection through actual adapter with production SSR/hydration/teardown, preserve public builder contracts). |
| Open-decision sweep                     | PASS   | Plan states "Open decisions: none unless findings change the contract" and "none material". Deferred publication is an owner-imposed constraint recorded with risk + `Refs #2039` (no closing keyword) handling; the issue's own acceptance states a source merge alone does not unblock downstream pin removal, so deferral does not force source rework. |
| Commit slices (< 30, gate + files each) | PASS   | S1 done (docs-only). S2 ≤12 src files (manifest/catalog pins + cold complete-identity guard + adjacent regressions + mutation), S3 ≤10 src files (additive native lifecycle + actual-boundary integration + production browser fixture + mutation), S4 export-corpus regen + scoped checks, S5 independent IMPL-EVAL. Ordered; each names proving gates. |
| Risk register                           | PASS   | `plan.md` risk register: six named risks with mitigations (wrong-core resolution, silent adapter patch, bundle duplicates/React dispatcher, long-lived subscriptions, lock drift, slow/private public types) + publication-dependency risk recorded in plan Risk and Deferred sections. |
| Gate set selected                       | PASS   | Archetype 2 matrix satisfied: static gates via scoped structured check/test/lint/fmt; consumer import validation required — covered by cold complete-identity guard (D2) and Fresh-only/mixed probes; runtime/browser evidence required because the adapter is exercised against a real backend — production Fresh SSR + real browser hydration fixture (D4). F-* via `quality:scan` + `arch:check`; F-5/F-6/F-7 via SDK/Fresh JSR audit, per-entry doc-lint adjudication against main, publish dry-runs. Release-gate class correctly N/A (no release cut / scaffold / runtime-surface change; `scaffold.runtime`/`e2e-cli-prod` pre-merge N/A). |
| Deferred scope explicit                 | PASS   | Publication, published-consumer qualification, owner release acceptance deferred to owner post-coordinated-release; no source behavior or required test deferred. |
| jsr-audit surface scan (pkg/plugin)     | PASS   | Planned public delta is exactly additive optional native lifecycle members (`preload(): Promise<void>`, `close(): void`) on the existing owned handle with explicit docs/return types; generics unchanged; no third-party symbol reexport, type erasure, or new runtime permissions. Slow-type/surface risk pre-named ("native optional methods only, no exported constructor/helper"); doc lint + publish dry-runs gate the delta; baseline doc residue handled by per-entry adjudication, never combined false green. |

## Open-decision sweep (evaluator-run)

None that would force rework if deferred. Candidates examined and all resolved or safely recorded:
1. Exact-pin vs caret ranges — locked D1; caret drift is the verified root cause (see Notes).
2. Issue's alternative "coordinated upgrade to core 0.8.7" — plan pins the qualified coherent family instead; rationale recorded (frozen-graph/shape evidence supports the coherent family). Issue lists both as acceptable.
3. Fresh-only graph anchor — isolated exact-family probe resolves one identity; D1 records the contingency ("no direct Fresh DB anchor unless new evidence proves it necessary").
4. Fixture mechanics (client.ts, widths) — declared within the locked contract; contract-preserving, no redesign.
5. Production integration exposing unrelated public-contract redesign — pre-registered as rescope-with-owner-acceptance, not silent absorption.

## Verdict

`PASS`

### If FAIL_PLAN — required fixes

Not applicable — all boxes checked.

## Notes

- **Independent verification of load-bearing findings** (no broad gates run; file/graph inspection only):
  - Owning manifests verified in-tree: `packages/sdk/deno.json` declares `@tanstack/db` `^0.6.8` + `@tanstack/query-db-collection` `^1.2.1`; `packages/fresh/deno.json` declares `@tanstack/react-db` `^0.1.95` + `@durable-streams/state` `^0.3.1`; root catalog mirrors all of them. Warm lock resolves a single `@tanstack/db@0.6.17` node with react-db `0.1.95` and query-db-collection `1.2.1` depending on it — confirming the qualified family is already coherent under warm resolution and that D1's exact pins eliminate the specifier drift window, not a warm-state bug.
  - Cold no-lock probe evidence (private sibling evidence, `c2/item-2039/cold-baseline.json`) shows the same carets resolving **three simultaneous `@tanstack/db` identities** (0.6.17, 0.7.0, 0.12.1) plus drifted adapter/query-core identities — the exact multi-family hazard D2's complete-identity cold guard counts and rejects. Fresh-only exact-qualified probe (`fresh-only-info.json`) resolves the single `@durable-streams/state@0.3.1` / `react-db@0.1.95` family, supporting D1's no-anchor decision.
  - Upstream shape verified in the resolved `@durable-streams/state@0.3.1` type surface: `StreamDBMethods` declares `preload: () => Promise<void>` and `close: () => void`; `createStreamDB` returns `StreamDB<TDef>` carrying those members. D3's additive optional members therefore match the actual returned object with no cast or lint ignore; existing optional `stop?`/`dispose?` remain structurally compatible.
  - SDK side verified: `packages/sdk/src/collections/create-query-collection.ts` wraps `@tanstack/query-db-collection`'s `queryCollectionOptions` over `@tanstack/db`'s `createCollection`. The existing `as QueryCollection<TItem>` return cast is baseline surface, not part of the planned delta.
  - Fresh hooks verified: `packages/fresh/src/application/query/hooks.ts` delegates `useLiveQuery` to `@tanstack/react-db` — supporting D4's "verify Preact compatibility rather than replacing the adapter".
  - Issue #2039's published-dependency evidence and acceptance criteria (pinned coherent family, cross-boundary identity/source regression, production SSR + bundling, teardown/hydration confirmation, publication before downstream pin removal) map 1:1 onto D1–D4/S2–S5; the plan's risk note correctly forbids shipment/merge claims.
- **Bounded public delta / JSR rubric** confirmed compatible with F-5/F-6/F-7: additive optional native members, unchanged Collection generics, doc lint and publish dry-runs required for both owning packages, per-entry baseline adjudication instead of a combined summary.
- **Minor observations (non-blocking, left to the generator to harmonize if desired):**
  1. `plan.md` line 11's coarse slice list (S1–S3) vs the refined authoritative S2–S5 list later in the plan (and the PR body's S1–S3 checklist) differ in granularity; the refined list is the authority and both agree on ordering and on implementation-before-evaluation.
  2. The locked decision names "durable-state 0.3.1"; the actual owning dependency is `@durable-streams/state` 0.3.1 (peer-resolved against `@tanstack/db@0.6.17`). Version and peer facts are accurate; only the package name shorthand is loose.
- **Process compliance:** no source/config/lock/history/public writes; no branch switch; no delegation; no CI polling or sleeps; no broad gate runs. Only the run artifact `plan-eval.md` is written. EIS evidence consulted read-only via research; no EIS writes. Private sibling task evidence used for cold/metadata verification only.
- Implementation may begin after this verdict; S5 IMPL-EVAL remains mandatory in a separate session before any merge-readiness claim. No publication/merge authorized in this run.
