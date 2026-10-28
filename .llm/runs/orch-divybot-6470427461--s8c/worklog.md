# Worklog

## Design

1. **Public surface:** static docs content gains semantic callouts, kind tags, readable highlighted code and unified headers; chrome stays ink. Existing components retain compatible arguments.
2. **Domain vocabulary:** tone means info/success/warning/destructive/important; kind is an API export category; syntax role is a generated foreground on the generated code background; language label is a human name for a registered fence grammar.
3. **Ports:** Figma JSON/manifest → token generator; Lume/Vento → rendered HTML; highlight.js registered grammars → token spans; Pagefind → search; Playwright/axe → browser evidence. No app backend.
4. **Constants:** shared language registration/labels, callout tone and icon maps, API kind map and generated syntax roles replace scattered literals. Stable id generation replaces randomness.
5. **Commit slices:** six, ordered with exact surfaces and gates in plan.md; native generated carriers refreshed after content stabilizes. Every slice includes worklog/context and separate reviewer verdict.
6. **Deferred scope:** #2450 owns token-source consolidation and #2453 owns unrelated Pagefind serialization nondeterminism; neither relaxes byte-identical HTML. No package API or release work.
7. **Contributor path:** tools/docs-site/README.md.

## Owner route override (verbatim)

“Run PLAN-EVAL before implementing and IMPL-EVAL after, both with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only. Fix once, record both verdicts.” The implementation stays on the feature matrix primary; evaluation uses this explicit owner route and retains separate session/family independence.

## Bootstrap

- Read the full assignment and repository guidance. Consulted prior memory notes before building.
- Queried feature routing with --json and used local NetScript MCP find_guidance/search_docs successfully.
- Verified fetched main d6dfab0, no dirty tracked source and no duplicate implementation PR.
- PLAN-EVAL pending; implementation has not begun.

## PLAN-EVAL round 1

FAIL_PLAN: final API kind-tag authority was ambiguous. Fixed once: slice 6 owns syntax-role mapping and computed tag/table AA assertions; visible labels distinguish kinds sharing a tone. Re-steered the same independent evaluator.

## PLAN-EVAL round 2

PASS, same independent Claude evaluator after the one plan correction. Baseline docs build and style-policy negative contracts pass. Draft PR #2459 opened before implementation.

## Slice 1 — callout tones

- Implemented case-normalized NOTE/info, TIP/success, WARNING/warning, CAUTION/destructive and backward-compatible ERROR/destructive. Heading/icon share tone; body and links retain foreground ink. IMPORTANT remains neutral until the owner export in slice 6.
- Added rendered internal callout gallery and four-project screenshot/axe coverage. An initial bare-gallery failure revealed missing layout/engine frontmatter; corrected and rerun.
- Gates: docs build exit 0; structured tools check/lint/fmt exit 0; strict browser TypeScript check exit 0; 16/16 callout/style-policy browser checks pass, including four zero-blocking axe gallery audits. Independent slice review pending.
- Reconcile: only declared docs/tooling/run surfaces changed; assignment excluded, locks unchanged.

Slice review initial FAIL_FIX: internal gallery was indexed as public documentation. Fixed once by marking internal pages noindex/ignored in Pagefind, omitting twin links and skipping AI twin/index emission. Added real Pagefind and output assertions. Re-review pending.

Slice 1 final review PASS (same independent reviewer). Expanded browser run 20/20 passes, including real Pagefind exclusion; links: 24,011 links across 252 pages, all resolve. Browser formatting uses docs/site/deno.json. Sign-off commit prepared only after this substantive independent review.
