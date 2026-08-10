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

Draft PR #1441 is live with slices 1.1–1.9 pushed and remains draft. Separate IMPL-EVAL returned
PASS with all 8 acceptance boxes satisfied and no blocking findings. Slice 1.10 takes its first
non-blocking wording observation: the homepage feature card now distinguishes narrowing a generated
model schema from directly authoring the public shape when there is no database. The second
observation is intentionally skipped because the Tab 1 comment is the supervisor-requested DB-less
origin clarification. No framework behavior changes are in scope.

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
- Passed the complete requested root and site gate sweep, including 16/16 diagram parity and exact
  lock hashes.
- Re-proved the pre-fix page chain fails with exactly two TS2345 errors while the corrected page and
  service scratch modules compile with `deno check --unstable-kv`.
- Exercised all four tabs at 390/1024/1600 in light and dark; preserved homepage headings and five
  destinations, found no document overflow or console errors, and saved six screenshots under the
  ignored `.llm/tmp/docs-1332-playwright/` evidence directory.
- Proved all ten newly added cross-link pairs exist in rendered pages, return HTTP 200, and land on
  their expected anchors.
- Received substantive supervisor A1 acceptance for slices 1.1–1.8, including explicit acceptance
  of the narrow responsive-diagram deviation.
- Added the single requested Tab 1 import comment distinguishing Tab 0 derivation from a DB-less
  hand-authored schema module.
- Rebased all nine slice commits without conflict onto `origin/main`
  `7a379dab36d6823164bbd8dc97f3b1790321a220`.
- Passed the post-rebase derivation fixture 4/4 with both consumer exits 0, rebuilt 617 site files
  with rendered-output OK over 220 HTML files, and re-proved 16/16 diagram parity.
- Received a separate IMPL-EVAL PASS for all 8 acceptance boxes with no blocking findings.
- Reworded the homepage feature card so generated schemas are narrowed while the DB-less public
  shape is authored directly, without changing the deliberate Tab 1 comment.

## In Progress

- Slice 1.10 commit, explicit-refspec push, and PR evidence comment; all requested local gates pass.

## Next Steps

1. Commit the feature-card wording and run evidence together.
2. Push with the explicit existing-branch refspec.
3. Update the PR slice map, post the slice evidence comment, and report the PR status.
4. Leave the PR draft for the supervisor to mark ready and merge.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Compile through generated `contracts/deno.json` | plan v2 D6 | Root alias-only compilation is insufficient. |
| Real optional Tab 0 | D1 | Preserve progressive disclosure. |
| Explicit relation composition | D5 | Do not imply relation-aware generated schemas. |
| Search coercion before loader | D7 | Required pre-fix FAIL/post-fix PASS evidence. |
| Opt-in mobile viewport for this wide diagram | Playwright visual finding | Keeps labels readable while root/body overflow remain 0px. |
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
| `docs/site/_components/diagram.vto` | changed | Optional wide viewport hook used only where requested. |
| `docs/site/styles/docs.css` | changed | Mobile-only contained scrolling for opt-in wide diagrams. |
| `docs/site/explanation/contracts.md` | changed | Dual origins, generated-step back-link, private-field omission, and explicit Product/Warehouse composition. |
| `docs/site/data-persistence/database.md` | changed | `@database/zod` contract derivation and forward link. |
| `docs/site/web-layer/{route,server,builders}.md` | changed | Direct generated-schema predecessor back-links. |
| `docs/site/services-sdk/services.md` | changed | DB-aware contract origin and generated-step back-link. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | derivation task; homepage pre/post/service checks; scoped check/lint/fmt; diagram parity; slice 1.10 site build and docs accuracy; source/rendered links; caveats; exact lock equality |
| Fitness | N/A for package gates | docs-only scope |
| Runtime | PASS | Six Playwright viewport/theme combinations, all tabs, semantics, screenshots, overflow, and ten cross-link/anchor checks |
| Consumer | PASS for generated contract, depth example, and homepage code paths | Product/Warehouse contract member, service, and corrected page compile; required pre-fix exits 1 |

## Open Questions

- None that block implementation.

## Drift and Debt

- Drift: minor tooling adjustment — unchanged CLI emitters execute in a runtime probe because root
  declaration mode reports 22 unrelated pre-existing CLI diagnostics; both new TS files still pass
  the scoped check wrapper.
- Drift: mobile visual inspection found the widened graph's labels too compressed at 390px; an
  opt-in internal scroll viewport preserves legibility without document overflow.
- Debt: none created or closed.

## Commits

- `5529f5c8c` — rebased slice 1.1 bootstrap proof.
- `08c1161f0` — rebased slice 1.2 derivation-alias proof.
- `99173e706` — rebased slice 1.3 optional diagram proof.
- `1dc1a8afe` — rebased slice 1.4 homepage type-flow proof.
- `4a5fd86e2` — rebased slice 1.5 dual-origin framing proof.
- `01ac2efea` — rebased slice 1.6 omission/relation proof.
- `cf49757d0` — rebased slice 1.7 cross-link proof.
- `e1aaae0bd` — rebased slice 1.8 responsive evidence proof.
- `a35b53a0a` — slice 1.9 dual-origin/rebase proof.
- Slice 1.10 is the current wording-and-gate evidence change; see draft PR #1441 for its final SHA.
- See draft PR #1441 for the live commit list and per-slice comments.
