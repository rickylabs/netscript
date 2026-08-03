use harness

# Slice: OMB S8 existing-machinery fixes — #1134 (truncation metadata + receipt-after-validation)

You are the implementation supervisor for the PR closing #1134 (epic #1126, RFC #1123 findings
S-13b and S-15). Read #1134's body and the RFC sections it cites first. This slice hard-blocks
S10 (#1136) and S6 (#1132) receipt semantics — correctness over speed.

## SKILL

`.agents/skills/netscript-harness`, `.agents/skills/netscript-pr`,
`.agents/skills/netscript-doctrine` (this is `packages/mcp` framework code — Archetype-2 gate
column per RFC S-20), `.agents/skills/jsr-audit` (if the export surface moves — it should not).

## Deliverable = the gates

1. Fixture: invalid tool output leaves a **failed receipt, not a green one** (receipt commits
   only after output validation — the S-15 ordering fix in `mcp-server.ts` `withReceipt`,
   currently ~lines 96–112).
2. Fixture: 75 rows can never reach the client as 50 rows with `truncated: false` (central
   truncation metadata + byte bound — S-13b, `truncation.ts`).
3. Full framework-wave law: `deno task quality:gate`, scoped check/lint/fmt wrappers on
   `packages/mcp`, targeted `deno test` for the fixtures, `doc:lint --root packages/mcp` if any
   exported type changes. No new `deno-lint-ignore` / `as unknown as` / `@ts-ignore`.

## Anticipated files

`packages/mcp/src/**` — `truncation.ts`, `mcp-server.ts` (receipt ordering), their test files/
fixtures. Internal behavior fix: **no public export-surface change expected**; if one becomes
necessary, record it in slice `drift.md` and run publish dry-run scoped evidence. Doctrine/debt
disposition: the known MCP v2-shape debt is adjacent but **untouched** — do not restructure tool
registration or shapes here; ordering + metadata only.

## PR contract

Branch `fix/mcp-truncation-receipt-ordering` (worktree provided), target `main`. Body:
`Closes #1134` only with both fixture boxes truthfully ticked and quoted test output. Labels:
`type:fix`, `area:tooling`, `epic:openapi-mcp`, exactly one `status:`; milestone `0.0.5`. No
`deno.lock` churn; no e2e:cli (orchestrator's call). Slice `worklog.md`/`drift.md` here as you go.
