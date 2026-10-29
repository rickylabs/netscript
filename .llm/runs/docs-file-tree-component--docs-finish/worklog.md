# Worklog

## Design

1. Public surface: authored alerts render as shared callouts only when GitHub-compatible.
2. Domain vocabulary: HTML container stack; bold-only paragraph.
3. Ports: existing markdown-it parseInline and core token stream.
4. Constants: HTML void tags and tag matching; existing alert markers and callout types.
5. Commit slices: renderer + fixture corrections; source-format tests and site verify; this run updated with the slice.
6. Deferred scope: content pass and comparisons have their own ordered branches.
7. Contributor path: docs/site/_plugins/markdown-alerts.ts.

PLAN-EVAL: N/A — bounded correction with owner-defined behavior, no unresolved design choice.

## Routing override

Owner authorization, verbatim: "Claude is at its weekly limit." "Evaluate with Gemini 4 Argon, read-only: agy -p --mode plan --model gemini-4-argon-high, given the PR diff and these acceptance points, blockers only. Fix once and re-evaluate."

Matrix queried with agentic:matrix --tier feature --json. Owner-selected evaluator replaces the matrix evaluation cell; vendor/session independence retained. Operator selects assigned implementation model and high effort.

## Gate results

- Scoped check/lint/format wrappers: PASS, two selected files, no findings.
- Site verify: PASS, 254 HTML pages, 24,225 internal links, 15 caveat markers.
- Initial regression run exposed an old fixture expecting code inside a bold title; that conflicts with the new exact-token acceptance. Changed the parity title to plain text and kept an explicit negative inline-code regression.

- Final renderer regressions: PASS (13 root test results, including the 17-case site fixture bridge). Source-format independent run: 35 passed.
- Prose freshness, MCP corpus, publish assets and root docs links: PASS. No generated carrier or lock change.
- Independent Gemini evaluation: MERGE, no blockers; substantive slice review completed before sign-off commit.
- Raw-text HTML contents cannot close an outer container; script-string regression passes.

## Reconcile

Baseline remains PR #2469 at 3a9b8f37a. The correction changes only the renderer, its fixture and this run. Existing authored page output remains carrier-fresh.
