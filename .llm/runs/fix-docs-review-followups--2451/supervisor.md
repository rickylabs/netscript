# Supervisor

Issue #2451, follow-up to S8 #2430, part of #2412. Baseline: f177c3899fd445dc5351bf65d617d477322c8b6e. Branch: fix/docs-review-followups. Implementation: OpenAI Codex, feature tier. Independent evaluator: Anthropic Claude Opus, separate read-only session, preserving the parent S8 owner override. No private machine/session identifiers are published.

Write surface: docs/site/_config.ts, _data.ts, _components/{tabbedCode,comparisonTabs}.vto, styles/components.css, deno.json; tools/docs-site/README.md, style-policy.ts, navigation_test.ts and check-reproducible.ts; tools/fresh-ui-browser/docs-tests/**; .github/workflows/pages.yml; .github/scripts/ci-classify-changes{,.test}.ts; .llm/tools/docs/pages-workflow_test.ts; the old S8 drift.md status qualification; this run; native generated documentation carriers. Never commit assignment files. Restore incidental lock churn; any dependency lock closure needed by the requested existing Lume plugin must be explicitly measured.
