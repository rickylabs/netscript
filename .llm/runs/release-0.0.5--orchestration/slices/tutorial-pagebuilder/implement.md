use harness

# URGENT docs slice (owner p0): tutorials must demonstrate the page builder — #1208 phase 1

You are the documentation-authoring agent for the PR closing #1208's phase-1 boxes (run
`release-0.0.5--orchestration`). Owner context, verbatim intent: every tutorial underleverages
NetScript; not one demonstrates the page builder; another agent launch waits on these docs
being right because the MCP will serve them — wrong tutorials multiply into wrong agent
behavior.

## SKILL

- `.agents/skills/netscript-harness`
- `.agents/skills/netscript-pr`
- `.agents/skills/deno-fresh` (Fresh 2.x context for the web layer)

## Ground rules — discover, never invent

The page-builder feature inventory MUST come from the actual exported surface: run
`deno doc` against the relevant `@netscript/fresh-ui` / web-layer entrypoints (check
`packages/fresh-ui/deno.json` exports and the existing manual pages under `docs/site/web-layer/`
first). The owner names at minimum: `withResource`, `withLayer`, `withLayout`, `withForm`,
cache-first against the SDK, server + client-side dehydration, traces, contract-first route
implementation — verify each exists, discover what else ships, and demonstrate the real API
with real signatures. If a named feature does not match the surface, record the discrepancy in
your slice worklog — do not paper over it.

## Scope — phase 1 ONLY

Rewrite the primary tutorials (`docs/site` tutorials — locate the tutorial set; storefront/
workspace/chat etc.) so the page builder is the default way pages are built: replace hand-rolled
route/page patterns with the builder wherever a builder feature exists, naming each replaced
usage in the PR. Every example type-checks against published entrypoints
(`.llm/tools/run-deno-check.ts`, quote command + result). Docs only — no `packages/`/`plugins/`
source. Phase 2 (the broader inconsistency sweep) is NOT this turn — it launches after this
merges.

## PR contract

Branch `docs/tutorials-page-builder` (this worktree), target `main`. Labels: `type:docs`,
`area:docs`, `priority:p0`, exactly one `status:`; milestone `0.0.5`. `Closes #1208` is WRONG —
phase 2 stays open: use `Refs #1208` and state phase-1 scope. Authoritative
`## Definition of Done`, all truthful template boxes ticked. Push via explicit refspec, open
draft PR, record handoff in this slice dir's worklog.
