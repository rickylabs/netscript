# Issue 2290 — D1 supervisor record

Date: 2026-10-31. Branch: `orch/divybot-6538732825`. Baseline main:
`6b7f152f6ac2bbdddcd5f4eb896b3d9f8aaf2db4`.

Implementation: assigned Codex session, OpenAI family. Independent review: Claude,
Anthropic family, read-only, stdin closed. No additional implementation lanes.

Authorized write surface: this run directory; `packages/service/src/auth/types.ts`,
`packages/service/src/auth/options.ts`, `packages/service/src/auth/auth-middleware.ts`,
`packages/service/src/auth/mod.ts`, `packages/service/src/auth/contract/contract-authorizer.ts`,
`packages/service/src/auth/contract/retired-procedures.ts`,
`packages/service/src/auth/contract/contract-policy.ts`, `packages/service/mod.ts`,
`packages/service/CHANGELOG.md`, `packages/service/README.md`,
`packages/service/tests/auth/`, `docs/site/reference/service/index.md`,
`docs/site/tutorials/workspace/05-route-authz.md`. Final report handoff is an excluded file.
No locks, generated assets, labels, milestones, scaffold resources, or other runs are owned.

Routing was resolved with `deno task agentic:matrix --tier feature --json`.
The assignment explicitly overrides both evaluator routes to
`claude -p --model claude-opus-5-5 --effort high`; vendor/session independence is retained.
The requested feature loop limits are 2 PLAN-EVAL and 5 IMPL-EVAL rounds; two consecutive
terminal failures stop the leaf. The coordinator alone may merge.

Privacy: public artifacts use repository-relative paths and omit environment/session identifiers.

## CI correction authorization

The owner requested addressing the quality failure and pushing fixes. The generated-assets write
surface is extended to the outputs required by agent-docs, MCP export-corpus and publish-asset
freshness: CLI `src/kernel/assets/*generated.ts`, MCP `src/*generated.ts` and their generated
provenance files, plus `.llm/assets/agent-docs/provenance.json` if generation changes it. Use the
repo generators only and review generated changes for task scope. No lock or cache deletion.

The MCP output is specifically
`packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`.
The generator's --allow-dirty write option was used only because the just-regenerated CLI prose
carrier was uncommitted; all hand-authored package/plugin sources matched the reviewed head.
Freshness checks remain unmodified and run without that option.
