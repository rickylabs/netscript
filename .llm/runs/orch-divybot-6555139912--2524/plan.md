# Plan & Design — READY FOR REVIEW

Archetype 6 (CLI registry/scaffold tooling), frontend overlay. No public API redesign.

Locked decisions:
- Use native nesting under the identical Utility root selector, retaining specificity,
  declaration bytes and source order. Do not alter theme roots, tokens or markup.
- Budget raw UTF-8 and gzip component CSS beside the native publish-size test; measure
  the shipped embedded payload and verify its CSS inventory against source.
- Protect the existing shared QueryResult source with real generator output tests.
- Reuse the #2503 fixture generators and browser comparisons against the baseline
  CSS, adding all root aliases and meaningful negative controls where needed.

PLAN-EVAL: N/A. This is a bounded behavior-preserving selector transformation and
regression gate repair with explicit acceptance criteria and existing evidence tools;
no new public contract or unresolved architecture trade-off. Mandatory independent
IMPL-EVAL remains selected, using the owner's read-only Claude Opus 5.5/high override.

Slices:
1. Scope/research/design artifacts and draft PR.
2. CSS consolidation, size budgets, shared QueryResult regression and browser proof;
   regenerate carriers, run gates, independent slice/implementation review, sign off.
3. Delivery evidence and any current-main reconciliation; ordinary push and exact-head
   checks, READY publication only when workflow-required checks pass or policy-skip.

Risks: CSS nesting specificity/order, nested media, pseudo-elements and alias drift.
Mitigation: preserve exact root/selector lists; compare Utility/legacy fixtures in
Chromium, including interaction states, both schemes and widths; mutation controls.
Budget vacuity/stale assets: compare authored CSS inventory and bytes with the embedded
payload; prove both limits reject oversized candidates. QueryResult vacuity: call real
page/resource generators and check complete shared body, uniqueness and no placeholder.

Gates: Fresh UI tests, browser Utility parity and legacy comparisons; package and
scoped check/lint/fmt wrappers, CSS formatting, quality:gate, JSR audit,
release:preflight; canonical carrier chain and every root check:* task on Deno 2.9.7.
Full `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` or explicit
UNPROVEN; required remote checks assessed at delivered head.

Deferred: per-style packaging, token/visual redesign, unrelated quality debt and
framework architecture changes. No new accepted architectural debt expected.
Open decisions: none blocking; exact budget ceilings fixed from measured candidate.
