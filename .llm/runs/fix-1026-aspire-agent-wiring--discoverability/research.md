# Research

## Baseline

Re-baselined on 2026-08-01 against `origin/main` at `3ab64720f`. The branch began clean with no source changes. The supplied briefing drafts were treated as inputs, not repository truth.

## Findings

1. `init-agent.ts` currently writes only the `netscript` MCP entry, copies the embedded bundle into `.claude/skills`, and upserts a one-sentence marked `AGENTS.md` section.
2. The installed `netscript` router delegates Aspire work to an `aspire` skill that is absent from `skills/manifest.json`; generic Deno work is routed out to documentation rather than an installed skill.
3. The embedded bundle is generated from `skills/manifest.json` and integrity-checked at install time, so manifest, file list, generated barrel, and hash are one atomic contract.
4. The current agent-init composition injects only `AgentInitFileSystem`. A subprocess call inside the use case would violate Archetype 6 R-A6-N8/AP-25. Aspire initialization therefore needs a consumed port and a Deno adapter wired at composition.
5. The user-verified Aspire CLI 13.4.6 behavior is internally consistent with the defect: delegation completes in about seven seconds, installs Aspire skills and optional `playwright-cli`, but writes no `.mcp.json`. Nothing in the current tree contradicts those facts. The non-reproduced historical hang remains a timeout risk, not the diagnosed cause.
6. The defect is discoverability, not file count: generated projects lack the Aspire MCP server and installed Aspire/Deno diagnostic guidance even though routing prose points toward them.

## Planned public-surface / JSR scan

The public command remains `netscript agent init`; no new package export is planned. The dependency seam is internal to the feature and does not widen `mod.ts`. Risks are behavioral compatibility, Deno subprocess API typing, abort behavior, and stable user-visible warning output. Existing publish surface and dependency graph are unchanged; focused type, lint, test, quality, and architecture gates cover the planned delta.

## Open questions

None that force implementation rework. Exact result-message representation will follow the existing `InitAgentResult`/presentation flow found during implementation research; the locked behavior is one non-fatal explanatory line.
