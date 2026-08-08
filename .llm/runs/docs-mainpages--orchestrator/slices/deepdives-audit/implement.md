use harness

## SKILL
Opposite-family `docs_audit` lane over a Claude-authored docs changeset (gate set .llm/harness/workflow/doc-audit.md). Evidence-only: run commands, read source; never trust generator claims. No edits; findings file is the deliverable.

## Task — audit the D1/D4 deep-dives (branch docs/web-layer-deep-dives)
Worktree: /home/codex/repos/ns-deepdives. Changeset: 8dbc16bee..HEAD (2 commits: docs/site/web-layer/resources.md + partials.md, plus nav/cross-link edits).

Gates:
1. **API/mechanism accuracy**: every claim in resources.md about sequential resource resolution, the shared store, `page.resource.<key>` spans, declaration-order behavior, and per-layer refinement — against packages/fresh/src/application/builders/define-page/runtime/handlers.ts and related source. Every claim in partials.md about definePartial/defineStatsPartial, route-reference partial wiring, layer `partial` → DeferPage mapping, and the Suspense-ready non-streaming boundary — against define-partial.tsx, Deferred.tsx, policy.ts. Extract and type-check at least the two largest examples per page yourself.
2. **Bare-Fresh ceremony claims**: the "what bare Fresh requires" passages must be accurate about Fresh 2's actual partial/data mechanics — check against the vendored Fresh docs/types or the fresh package if present; flag anything unfair or invented.
3. **Cross-links + nav**: links from storefront ch.6 / live-dashboard ch.4-5 / chat ch.3 land at the new pages; nav/front-matter matches sibling web-layer pages; run `cd docs/site && deno task build` and root `deno task docs:links` yourself.
4. **Prose quality**: register parity with explanation/contracts.md; flag filler or checklist structure with exact replacements.
Write /home/codex/repos/ns-docs-orch/.llm/runs/docs-mainpages--orchestrator/slices/deepdives-audit/audit.md: per-gate PASS/FAIL + evidence, findings, verdict PASS / FAIL_FIX. No commits.
