# Worklog

## Design

- Public surface: stable static HTML and accessible named anchors, a single CSS request, unchanged component APIs, precise Pages browser scheduling.
- Vocabulary: rendered inputs, push diff, stable instance namespace, heading permalink.
- Ports: existing Lume 2.5.4/Lightning CSS APIs, DOM, pinned highlighter, Git rename-aware diff, pure CI classifier, native carrier commands.
- Constants: page URL and local DOM index supply instance identity; nav lane identity and explicit push-diff opt-in replace positional/event assumptions.
- Commit slices: rendering/reader fixes, then CI precision and final evidence; each slice updates this run and pushes its gates/review on the new PR.
- Deferred scope: token source merge belongs to #2450 after S1/new Figma export; other epic cells retain their owners and dependencies.
- Contributor path: tools/docs-site/README.md.

Parent S8 evaluator override carried verbatim: “Run PLAN-EVAL before implementing and IMPL-EVAL after, both with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only.” Routing inspected via agentic:matrix --tier feature --json; public artifacts retain model/role only, no private identifiers.

Research: #2451 has no linked PR/comments. S1 is actively owned by PR #2435. S2–S7 depend on that chain. The directly scoped S8 review follow-up is available. No implementation yet; PLAN-EVAL pending.

PLAN-EVAL initial FAIL_PLAN identified bundled-token provenance and full-output determinism gaps. Corrected plan keeps exact generated declaration provenance while retaining full maintained checks and strengthens comparison to every output file. No implementation started.

Corrected independent PLAN-EVAL PASS before source edits. Slice1 implemented deterministic per-page IDs before both consumers, bundle provenance checks and negative controls, heading labels, stable lane identity, dotenv plaintext, stack margin repair and historical drift qualification. Validation pending.

Slice1 complete: independent source review PASS after the recorded FAIL_FIX and reverted dependency experiment. Candidate browser52/0/0,24axe reports with0serious/critical;6focused tests; structured tooling8/site2/browser2 checks;23970links/251pages. Accepted reproducibility compares806files and protects HTML/twins/fragments/assets; reports only the known Pagefind metadata variation. Real raw-custom control exits1 through the normal policy command. Seven-line native Lightning CSS lock closure retained, all other dependency entries unchanged.

Reconcile1: source scope remains #2451. Token authority stays assigned to #2450. The discovered upstream Pagefind variation is a separate sibling task; no Pagefind upgrade is retained. CI slice remains pending.

Slice2 complete:71classifier/workflow tests PASS after intended68/3RED; structured2-file types/lint/fmt PASS; native CLI probes prove opted-in push needs_pages=false and default push=true. Separate source review PASS. Browser/deploy conditions retain fail-toward-running behavior and the rendered reproducibility check is now in CI.

Reconcile2: new PR2452 remains draft for carrier integration/final IMPL. Current main has advanced with #2449; include it normally before native generation. Independent source reviews accept both slices. No protected theme-source edits.

Integration: normally merged main d6dfab0 (#2449 theme framing). Protected canonical design sources match main exactly. Ran gen:agent-docs-prose, gen:mcp-export-corpus --allow-dirty, gen:assets-barrel, gen:publish-assets in order, all exit0. The native write option covers only staged generated carriers; package/plugin implementation input is unchanged. Restored incidental nested lock churn; retain the previously reviewed seven-line Lightning CSS closure. Root quality:gate, including architecture, exits0 with existing warnings.

Canonical local e2e:cli exits1 at preflight.aspire; Docker is also unavailable. No runtime PASS is claimed. Hosted canonical workflow will qualify that gate. Full source/browser evidence remains separate from this environment limitation.

Final source IMPL-EVAL PASS at f8db7ee. Post-integration browser52/0/0 and24axe audits with0serious/critical; reproducibility,23970links and15caveats pass. Four freshness receipts exit0 at f8db7ee. All source findings are fixed or explicitly assigned to2450. Upstream metadata is sibling2453. Hosted CLI40690612382 and PR Pages CI remain pending; not waived. Final evidence-only commit does not change source or carriers.

## Refresh design — 2026-11-01

1. Public surface: preserve current main's docs content, Studio Utility theme, renderers, language support and theming docs while retaining only review follow-ups still missing.
2. Domain vocabulary: current-main disposition (already fixed, retained, deferred), normal merge, strict reproducibility, READY handoff.
3. Ports: existing Lume/Pagefind APIs, pure change classifier, repository generators/check tasks, browser suite, independent Claude evaluator.
4. Constants: retain existing stable identity and navigation constants; no new token authority or model routing literals in maintained code.
5. Commit slices: bootstrap refresh evidence; integrate origin/main and reconcile all #2451 findings (docs/site, tools/docs-site, browser tests, classifier/Pages, native carriers); include #2453 only if a bounded upstream-supported fix is proven; final native gates and independent review evidence. Each source slice updates this worklog and context pack.
6. Deferred scope: unrelated framework implementation and token consolidation remain owned by their current issues. Do not duplicate fixes already on main. No PR merge or publication; Cockpit owns merging.
7. Contributor path: tools/docs-site/README.md.

Owner routing override (verbatim): “IMPL-EVAL: `claude -p --model claude-opus-5-5 --effort high`, read-only.” Owner process override (verbatim): “Post READY on #2451 once every required check is green **or skipped by workflow policy**. Include the head. STOP at READY; Cockpit merges.” Specific operator instructions require Refs links and normal push, superseding generic closing-keyword and replacement-branch boilerplate.

PLAN-EVAL: N/A for this refresh: the existing independently approved plan and owner-provided acceptance fix the contract. Routine conflict resolution, removing superseded changes and generated freshness do not introduce a new architecture/public contract. A material Pagefind redesign would remain deferred to #2453.

Initial reconcile: PR #2452 remains open at b0d5a16 with conflicts. There is no orchid-triage comment. The PR itself is the explicitly assigned work, so reuse it. Main already has Lightning CSS, deterministic identity passes and named heading permalinks; these must be preserved from main rather than reintroduced. Exact post-merge dispositions and gate evidence follow. Deno 2.9.7 is installed; RTK is unavailable.
