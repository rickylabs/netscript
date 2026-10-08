# PLAN-EVAL — fix-pure-route-url-utilities--c2

- Plan evaluator session: independent Zhipu GLM evaluator, `opencode-go/glm-5.3-flash` (owner-selected OpenCode Go route, variant max), 2026-10-08, cycle 1
- Run: `fix-pure-route-url-utilities--c2`
- Surface / archetype: `@netscript/fresh` define-page navigation (`navigation/context.ts`, `navigation/link.tsx`) + route contract runtime (`route/_internal/contract-runtime.ts`) — Archetype 2 integration with the existing Archetype 4 route-builder concern
- Scope overlays: SCOPE-frontend
- Exact head: `82e7f5ca61f6a7a600db20436f6a125dddf02096` (branch `fix/pure-route-url-utilities`)
- Workload tier: `feature` (no privileged-row authority inferred; PLAN-EVAL selected because changing implicit current-search semantics is a public behavior migration)
- Route: generator OpenAI (lane C2) ≠ evaluator Zhipu GLM — different session and vendor family. Requested route per owner override: `opencode-go/glm-5.3-flash` max; observed: same route, healthy, no fallback used.

## Baseline currency (protocol step 1)

- `research.md` exists; recorded baseline `4ef93c2532e4aeabdbd26874cd36cd7d37e593fd` equals `origin/main` exactly (verified). The stale local `main` ref (`6f6cbdf03`) is behind and is an environment artifact, not a plan defect.
- Branch delta over baseline: 2 docs-only commits, 7 files / 88 insertions, all under `.llm/runs/fix-pure-route-url-utilities--c2/` — confirms "no source implementation" before the gate.
- Load-bearing findings spot-checked against the tree at head:
  - `getBoundLinkProps` calls `readNavigationContext()` unconditionally — `navigation/link.tsx:304`. CONFIRMED.
  - `readNavigationContext` hides `useContext` behind try/catch with error-message sniffing — `navigation/context.ts:45-61`. CONFIRMED (this is the hidden try/catch hook the plan removes).
  - Single reference `href`/`getLinkProps` and paired `href`/`partialHref`/`getLinkProps` all funnel through `getBoundLinkProps` — `route/_internal/contract-runtime.ts:253-255, 274-277, 322-348`. CONFIRMED, so the D1 single repair point (null context into existing `createResolvedLinkProps`) inherits to every named helper; exported standalone `getLinkProps` already passes `null` (link.tsx:285-298).
  - `nav.makeHref` already calls validated `buildHref` with `null` context — link.tsx:341-344, wired as `reference.nav` at contract-runtime.ts:248-252. CONFIRMED.
  - `usePageRoute` is an explicit hook returning a closure — `navigation/mod.ts:114`. CONFIRMED; adjacent tests exist (`tests/navigation.test.tsx`, `tests/surface.test.ts`).

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research.md`; baseline = `origin/main` verified; live-tree spot-checks above; EIS PR #434 evidence recorded read-only with no EIS writes |
| Decisions locked                        | PASS   | `plan.md` D1-D4 with rationale; mirrored in `worklog.md` Design. D1 one pure repair point, named internal hook, Link as sole render boundary; D2 explicit-hook context semantics + compatibility retention; D3 causal mutation + native browser acceptance; D4 no dependency/release/merge/EIS edits |
| Open-decision sweep                     | PASS   | Plan names: none force redesign; native protocol fixture details may emerge from source but implement within D3 without replacing native hook/transport (safe to defer); publication timing safe to defer (D4 rationale: no release/merge authorized); any material public-contract change must amend plan before source. Evaluator sweep below found no unflagged rework-forcing decision |
| Commit slices (< 30, gate + files each) | PASS   | S1 docs plan + PLAN-EVAL → S2 bounded source + adjacent/SSR regressions + migration docs (≤ 8 owning files; structured focused tests, scoped check/lint/fmt, causal mutation) → S3 production fixture + browser regression (≤ 9 owning files; full Fresh suite + type/quality/JSR gates) → S4 conditional carrier/corpus refresh (checker-demanded only, no hand edits) → S5 independent IMPL-EVAL + text-only close-out. Ordered, sized well under 30, each names what it proves, its gate, and its files |
| Risk register                           | PASS   | `plan.md` Risks: implicit-search migration, paired behavior, hook regression, browser fixture diagnostics, baseline docs, publication — each with a mitigation |
| Gate set selected                       | PASS   | Static (frozen structured check incl. route consumer type fixtures, scoped test/lint/fmt), fitness (quality:gate scan + architecture, JSR audit + raw publish dry-run, all-export doc lint with entry-by-entry baseline comparison and explicit DEBT only if necessary, public surface/folder/layer/manual fitness, carrier/corpus freshness), runtime/consumer (real production Fresh browser fixture per D3, existing unit route/manifest/navigation suite + full Fresh). Browser validation present (Archetype 4 concern subtype). Release-gate class N/A with justification: no scaffold/CLI/plugin publish/Aspire/DB wiring/release changes |
| Deferred scope explicit                 | PASS   | D4: qualified publication + published-consumer receipt owner-deferred (no release/merge authorized), no dependency-family edits, no release cut/merge/EIS write; S4 conditional; Release phase N/A (owner requires unmerged PRs); `Refs #2040` only — no closing keyword until publication acceptance |
| jsr-audit surface scan (pkg/plugin)     | PASS   | `research.md` rubric on PLANNED surface: existing explicit public return/type contracts retained, no upstream reexports, no casts/ignores introduced in production source, renamed context reader internal; gates include all-export doc lint with baseline comparison — never a false green |

## Open-decision sweep (evaluator-run)

None that would force rework if deferred:

1. Internal hook naming (`useNavigationContext`) — explicitly named and locked in D1; internal, not public-contract.
2. Pure-helper semantics when `preserveSearchParams` is set with no context — explicitly locked in D2 (schema defaults plus explicit supplied search); this is the migrated behavior under repair, covered by paired/SSR assertions and docs.
3. Native chat fixture protocol details — flagged in the plan as safe-to-defer implementation detail bounded by D3 (must not replace native hook/transport); does not change plan shape.
4. Publication/published-consumer timing — owner-deferred in D4 with concrete reason (no release/merge authorized); deferring forces no rework because source/browser acceptance is mandatory regardless.
5. Semantics of paired partial search (explicit override/merge/default) — retained as existing behavior in D2; verified in tree (`contract-runtime.ts:326-340` passes `partialPreserveSearchParams` through `buildHref`).

Relevant open debt (`packages/fresh` hosted example sandboxes, `PAGEBUILDER-LEGACY-COMPAT-TREE`, `FORMPAGEPROPS-PLAYGROUND-MIGRATION`) is unrelated to the navigation/route-contract surface; the plan's doc-lint baseline-comparison + explicit-debt-adjudication stance is consistent with the resolved F-7 history.

## Verdict

`PASS`

### If FAIL_PLAN — required fixes

N/A — no unchecked boxes.

## Notes

- Brief conformance verified: pure utility repair covers every single/paired `href`/`partialHref`/`getLinkProps` (one funnel point, structurally confirmed); contextual behavior is confined to explicit hooks/components with the hidden try/catch hook removed, not merely wrapped; compatibility/migration (retained input types, documented migration, paired partial semantics) is reviewed in D2; concrete source/native Fresh + useChat browser acceptance is D3 with causal red/restore-green tests; JSR and debt gate selection is explicit; publication/published-consumer is safely owner-deferred with no `Fixes` claim; EIS reference facade evidence remains read-only.
- Evaluator constraints honored: only this run artifact was written; no source/config/lock/history/public writes, no branch switches, no delegation, no CI polling; inspection was bounded to the checkout, the governing harness docs, and the run's sibling evidence.
- Implementation may begin per the plan's slice order (S2 next), with PLAN-EVAL repair policy for the `feature` tier (max two cycles) not consumed.
