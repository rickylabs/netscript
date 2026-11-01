# Supervisor

Issue #2451, follow-up to S8 #2430, part of #2412. Baseline: f177c3899fd445dc5351bf65d617d477322c8b6e. Branch: fix/docs-review-followups. Implementation: OpenAI Codex, feature tier. Independent evaluator: Anthropic Claude Opus, separate read-only session, preserving the parent S8 owner override. No private machine/session identifiers are published.

Write surface: docs/site/_config.ts, _data.ts, _components/{tabbedCode,comparisonTabs}.vto, styles/components.css, deno.json; tools/docs-site/README.md, style-policy.ts, navigation_test.ts and check-reproducible.ts; tools/fresh-ui-browser/docs-tests/**; .github/workflows/pages.yml; .github/scripts/ci-classify-changes{,.test}.ts; .llm/tools/docs/pages-workflow_test.ts; the old S8 drift.md status qualification; this run; native generated documentation carriers. Never commit assignment files. Restore incidental lock churn; any dependency lock closure needed by the requested existing Lume plugin must be explicitly measured.

## Refresh — 2026-11-01

Resume existing PR #2452 and branch fix/docs-review-followups at b0d5a16b12b41fbf0b8a5036a6c9707b57f91b75. Current main baseline is 6a1d84a6e04c0d39df3926528e0380e267316aee. Implementation: OpenAI Codex, feature tier, xhigh. Matrix resolved using `deno task agentic:matrix --tier feature --json`; implementation primary sol/xhigh. Owner evaluator override: “IMPL-EVAL: `claude -p --model claude-opus-5-5 --effort high`, read-only.” Separate Anthropic session; same session retained for repair. Profile limit: stop after two consecutive terminal failures.

Refresh write surface: normal merge integration of origin/main; the maintained docs/site, tools/docs-site, tools/fresh-ui-browser/docs-tests, classifier, Pages workflow and docs workflow-test paths listed above; this run; .llm/2026-11-01-docs-review-refresh.md; generated prose, export corpus, embedded documentation and publish carriers. Any additional maintained-source edit requires an explicit drift entry. Public artifacts use repository-relative paths only; raw logs and evaluator session state stay outside Git. Assignment and final-report files are excluded from commits.

Owner authorizes ordinary merge and push, changing PR links to Refs #2451 (and Refs #2453 only if included), required checks, and final READY handoff. Do not rebase, force-push, merge the PR, or create a replacement PR.
