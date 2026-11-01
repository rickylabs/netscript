# Worklog

## Design

1. Public surface: stable CSS/markup; maintainers get a documented fixed growth policy,
   a checkout-independent budget test, and a reproducible parity command in CI.
2. Vocabulary: component CSS excludes registry/theme; baseline fixture freezes original
   CSS/tokens/specimens; rule contract is the ordered parsed selector/declaration/media list.
3. Ports: existing Deno filesystem/compression and structured test wrappers, Node filesystem/
   subprocess APIs, pinned Playwright browser harness and existing variant-parity engine.
4. Constants: raw220000/gzip28000 fixed ceilings; baseline schema version, safe registry
   path roots, original provenance SHA and exact input hashes; no runtime theme attribute.
5. Commit slices: plan+draft; then budget test/docs, maintained .llm/tools/css code/tests/
   fixtures, browser integration and CI/classifier wiring with focused/full gates and
   separate reviewer PASS; then final delivery evidence. Every slice updates this run.
6. Deferred: new components, token/design changes, adaptive per-file budget scaling,
   other epic owners' work and inherited public-export documentation findings.
7. Contributor path: .llm/tools/css/README.md explains replay inputs, negative controls,
   and the reviewed baseline/budget update process.

PLAN-EVAL N/A: bounded follow-up repair with existing engines and explicit acceptance;
no public/runtime redesign. Owner evaluation override remains read-only Claude Opus5.5,
requested high effort, separate Anthropic session. Public evidence omits session identifiers.

Intake: #2558 merged as6a6a82e; #2561 has exactly three unfinished cells and no other PR.
Branch starts at that main. Scope is one cohesive validation unit; no sibling split needed.

## Plan slice reconcile

Plan2563bef pushed normally and draftPR2563 opened. Issue2561 now links that PR's full
three-cell scope; no duplicate PR was found. The existing Frontend Contribution milestone
owns this work. No labels applied. Main baseline remains6a6a82e; no unrelated source changes.

## Implementation

Budget policy is fixed raw220000/gzip28000 with tracked-issue/cost/parity requirements for
future raises. Relative registry paths are filtered after walking; three actual-test fixtures
prove checkout independence and stale/unshipped/excessive-size failures.

The maintained .llm/tools/css command reads an87989-byte archive containing the exact original
52CSS sheets, base/Utility tokens and265HTML specimens, with SHA/provenance checks. It compares
ordered browser-parsed contracts and invokes the existing full visual engine, without needing
old git history. CI now selects and runs the command and regression tests, with durable receipts
and uploaded artifacts. Nested CSS inventory, corrupt/unsafe inputs and incomplete samplers
fail closed. Native paint/font settling requires consecutive equal PNGs, without relaxing the
before/after zero-diff threshold. Full replay reports2388000comparisons/1161rules with no drift;
a copied candidate with a Card background mutation reports one rule difference and visual failure.

Deno2.9.7: full package338results and77focused package/workflow/classifier results pass;
package276TS and scoped6TS+browser1TS checks pass. Structured lint/fmt cover10source files;
CSS policy fixtures3 and real-browser comparator regressions are green. Broad quality/architecture,
releasepreflight, JSR/nativepublish, four canonical generators and all14rootchecktasks pass.
Latest positive replay and completeness tests are being frozen before independent review.

Full runtime attempted: exit1 at Aspire doctor; Docker unavailable. Runtime and container cleanup
remainUNPROVEN; read-only leak reporter left all unproven-owner resources untouched. No product
CSS, tokens, markup, dependencies or locks changed. Extra source formatting uses the run's root
rules/style config to cover normally excluded tooling. Independent review pending.

## Frozen local verdict

All local gates are terminal. Full package:338pass/0fail/0ignored. Focused package and
workflow/classifier contracts:77pass. Durable css:test:three actual-test location/budget
regressions plus12real-browser comparator/input/completeness tests, all pass. Durable full
replay:265specimens,2388000comparisons,1161rules, zero differences, equal screenshots;
all original baseline input hashes match. Card-background negative fails with one rule
difference and visual drift. Source manifest has16files; independent review is next.

Runtime remainsUNPROVEN as explicitly disclosed; read-only resource report is summarized in
gates.json. No owned runtime started. All source/carrier scopes and fixtures fit the original
plan, apart from the documented stable-frame capture repair. No new architectural debt.

## Review repair R1

Independent round1 verdict FAIL_FIX: CSSNestedDeclarations could omit its parent selector.
The comparator now rejects implicit-parent declaration blocks. Real Chromium regressions
cover declarations directly in nested media and after a nested style rule. README spacing
is corrected. css:test now passes3Deno+14browser tests; repair lint/fmt pass. Full replay
is rerunning; all16source hashes refreshed for the same evaluator. No scope change.

R1 full replay PASS:1161rules,2388000comparisons,zero drift, original hashes match, exact
screenshots equal. Refreshed parity.json and durable gate summaries. Re-review now requested.

## Independent sign-off and reconcile

Round2 PASS from the same separate Anthropic Opus5.5/high reviewer, including rerun of
all3Deno+14Chromium regressions and verification of all16source hashes. R1 closed; no
required findings. Full post-repair replay PASS. The supervisor accepts that independent
slice sign-off for this commit. Main advanced to0af8fd9; only deno.json overlaps and
its design-skill task additions are separate from this branch CSS tasks. PR is MERGEABLE;
no merge/rebase needed. No source changed after reviewed hash freeze. Remote CI pending.
