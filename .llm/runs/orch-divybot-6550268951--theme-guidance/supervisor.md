# Theme guidance run

Implementation: dispatched Codex session, feature tier; owner requests medium effort.
Branch: orch/divybot-6550268951. Baseline: f4aa307b5340bd3de8029c11778a38bbca451ba1.
Working surface: repository-relative paths only.

Allowed writes:
- packages/cli/src/kernel/templates/app/agent-conventions.ts
- packages/cli/src/kernel/templates/app/agent-conventions_test.ts
- packages/cli/src/kernel/application/ui/page/web-scaffold.ts
- packages/cli/src/kernel/application/ui/page/web-scaffold_test.ts
- .llm/runs/orch-divybot-6550268951--theme-guidance/**

Feature matrix queried with agentic:matrix --tier feature --json.
Implementation primary sol / xhigh; dispatch explicitly requests medium.
Implementation evaluation primary muse_spark_1_3 / xhigh, fallback opus_5 / xhigh.
Owner issue comment explicitly requests independent Claude Opus 5.5 / high review.
Use repo-native agentic launcher for that read-only evaluator; preserve distinct vendor/session.
No self-certification. No merge authorization requested or exercised.

Close-gate remediation expands allowed writes to the existing companion docs prerequisite, incorporated by normal merge: docs/site/cli-reference.md, docs/site/how-to/index.md, docs/site/reference/cli/commands.md, docs/site/web-layer/fresh-ui.md, docs/site/web-layer/how-to/customize-fresh-ui.md, docs/site/web-layer/how-to/theme-your-app.md, skills/netscript-build/SKILL.md, skills/netscript/SKILL.md, packages/cli/src/kernel/assets/skills.generated.ts, packages/mcp/src/infrastructure/docs/agent-docs-prose.generated.ts, packages/mcp/src/publish-assets.generated.ts. No new product logic outside original four files.
