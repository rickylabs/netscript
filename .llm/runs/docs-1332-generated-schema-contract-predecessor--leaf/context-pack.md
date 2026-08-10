# Context Pack: generated database schema contract predecessor

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-1332-generated-schema-contract-predecessor--leaf` |
| Branch | `docs/1332-generated-schema-contract-predecessor` |
| Current phase | `implement` |
| Archetype | N/A — docs-only leaf |
| Scope overlays | `SCOPE-docs.md`; responsive browser validation |

## Current State

Draft PR #1441 is live with slices 1.1–1.6 pushed. Slice 1.7 now completes the cross-link matrix:
database documentation names and demonstrates `@database/zod` before linking forward to contracts;
contracts, route, server, builders, and services link directly back to that generated step. No
framework behavior changes are in scope.

## Completed

- Read all requested skills and required harness/docs/doctrine references.
- Verified clean branch, branch name, baseline, merge-base, and live issue acceptance.
- Recorded requested/observed implementation identity, doctrine boundary, design checkpoint,
  locked decisions, eight commit slices, risks, gates, deferred scope, and evaluator separation.
- Opened draft PR #1441 with `Closes #1332`, exact acceptance evidence, required labels, and
  milestone 0.0.6; slice 1.1 is committed, pushed, and commented.
- Added `docs:contract-derivation` to the root and `docs:maintenance` task graphs.
- Proved both real `@database/zod` targets, the real Product/Warehouse CRUD exports, a
  contracts-member derivation compile, and all three negative cases.
- Passed scoped check/lint/fmt and re-proved exact lock equality.
- Added the optional database predecessor to the contract-flow diagram and updated its homepage
  accessible text for both DB-backed and DB-less origins.
- Passed diagram render/parity for all 16 committed SVGs and homepage source-format validation.
- Demonstrated the old page chain's two TS2345 failures and proved the corrected SDK/Fresh chain plus
  service module with `deno check --unstable-kv`.
- Extended the derivation fixture to compile the homepage User schema/contract through the generated
  contracts-member alias; the fixture remains 4/4 green.
- Built the site successfully with Tab 0 first and the rendered-output semantics unchanged.
- Replaced absolute no-generation/hand-authored-first claims in the contracts explanation, preserved
  the valid DB-less framing, and added its DB-backed counterpart plus the database-step back-link.
- Rebuilt the site and proved all 32,773 internal links resolve.
- Added the exact fixture-backed Product/Warehouse derivation example and made the three omitted
  storage fields explicit in prose.
- Re-ran the 4/4 derivation gate and full site build for the depth example.
- Added the fixture-backed User derivation to the database page and linked forward to contract depth.
- Added direct generated-step backlinks from contracts, route, server, builders, and services.
- Passed both source and rendered link gates with no broken links or anchors.

## In Progress

- Slice 1.7 commit, explicit-refspec push, PR body slice update, and per-slice evidence comment.

## Next Steps

1. Commit slice 1.7 with the cross-link matrix and current run artifacts.
2. Push `HEAD:docs/1332-generated-schema-contract-predecessor` and comment exact gate output.
3. Update the draft PR slice list with the commit SHA.
4. Begin slice 1.8: full gate sweep, Playwright matrix, acceptance evidence, and final handoff.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Compile through generated `contracts/deno.json` | plan v2 D6 | Root alias-only compilation is insufficient. |
| Real optional Tab 0 | D1 | Preserve progressive disclosure. |
| Explicit relation composition | D5 | Do not imply relation-aware generated schemas. |
| Search coercion before loader | D7 | Required pre-fix FAIL/post-fix PASS evidence. |
| Draft remains draft | owner hard constraint | Supervisor owns IMPL-EVAL and merge sequencing. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/docs-1332-generated-schema-contract-predecessor--leaf/` | new | Six mandatory run artifacts. |
| `.llm/tools/docs/check-docs-contract-derivation.ts` | new | Real scaffold/barrel compile fixture and CLI verdict. |
| `.llm/tools/docs/check-docs-contract-derivation_test.ts` | new | Positive case plus three command-level negative fixtures. |
| `deno.json` | changed | New task and `docs:maintenance` wiring. |
| `docs/site/_diagrams/contract-flow.mmd` | changed | Optional generated database predecessor. |
| `docs/site/assets/diagrams/contract-flow.svg` | changed | Regenerated committed diagram. |
| `.llm/tools/docs/check-docs-contract-derivation.ts` | changed | Adds compile proof for homepage User derivation/contract modules. |
| `docs/site/index.vto` | changed | Diagram text, optional Tab 0, SDK construction, search coercion, and DB-aware wording. |
| `docs/site/explanation/contracts.md` | changed | Dual origins, generated-step back-link, private-field omission, and explicit Product/Warehouse composition. |
| `docs/site/data-persistence/database.md` | changed | `@database/zod` contract derivation and forward link. |
| `docs/site/web-layer/{route,server,builders}.md` | changed | Direct generated-schema predecessor back-links. |
| `docs/site/services-sdk/services.md` | changed | DB-aware contract origin and generated-step back-link. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | derivation task; homepage pre/post/service checks; scoped check/lint/fmt; diagram parity; site build; docs accuracy; source/rendered links; lock equality |
| Fitness | N/A for package gates | docs-only scope |
| Runtime | NOT_RUN | browser validation belongs to slice 1.8 |
| Consumer | PASS for generated contract, depth example, and homepage code paths | Product/Warehouse contract member, service, and corrected page compile; required pre-fix exits 1 |

## Open Questions

- None that block implementation.

## Drift and Debt

- Drift: minor tooling adjustment — unchanged CLI emitters execute in a runtime probe because root
  declaration mode reports 22 unrelated pre-existing CLI diagnostics; both new TS files still pass
  the scoped check wrapper.
- Debt: none created or closed.

## Commits

- `851c9757aab38c7c91e489b9fa13b8415d0c3d9d` — slice 1.1 bootstrap proof.
- `5dc1a518a057a5b339594c9af50cacba8ceb0373` — slice 1.2 derivation-alias proof.
- `cd2ddc49966abe7e450bfb9cd856125da5418046` — slice 1.3 optional diagram proof.
- `70702c1ac9e7a494d132e11a4ed512c61c0de6a8` — slice 1.4 homepage type-flow proof.
- `c502e8d60467e2f87091ff9ca89a95067023ece5` — slice 1.5 dual-origin framing proof.
- `96b4593c76761f8838f49a21bfc0b39d7a8f590c` — slice 1.6 omission/relation proof.
- See draft PR #1441 for the live commit list and per-slice comments.
