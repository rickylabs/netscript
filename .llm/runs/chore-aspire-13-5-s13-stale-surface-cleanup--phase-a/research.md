# Research — S13 stale surface cleanup

## Re-baseline

- Carried-in source: supervisor run
  `/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/`.
- Re-derived against this leaf's immutable stack base `a46ea16d` on 2026-08-30.
- The S13 contract and D-17 are owner-ratified. S1's phase-1 parity files are available on
  `origin/chore/aspire-13-5-s1-pin-bump` but are not ancestors of this sibling S10 stack.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | Existing endpoint order is explicit → NetScript env → Aspire port → default; the resolver is synchronous and pure. | `packages/mcp/src/domain/telemetry-endpoint.ts` |
| 2 | Generated `.netscript/aspire-cli.ts` already contains banner-tolerant `aspire ps` discovery, but the logic is embedded in generated source. | `packages/cli/src/kernel/templates/workspace/aspire-cli-task.ts` |
| 3 | The telemetry example embeds a bare `18888`; both Windows env writers synthesize dashboard defaults. | telemetry template and `env-file-{values,content}.ts` |
| 4 | The consumer compose workflow restores Aspire without installing the scaffold-paired CLI. | `deploy-compose-ghcr.yml.template` |
| 5 | S7's converged MCP process spelling is not in this stack: teardown still matches `aspire mcp`. | `.llm/tools/agentic/teardown/ownership.ts` |
| 6 | Host static preflight is authoritative and clean: Deno 2.9.5, Aspire 13.5.3, .NET 10.0.400, `aspire ps` = `[]`, Docker container count = 0. | 2026-08-30 command transcript in `worklog.md` |

## jsr-audit surface scan

- Surface scanned: `packages/mcp/deno.json`, `mod.ts`, and the existing telemetry endpoint imports.
- Planned public surface: no new export map or root export. The resolver's injected port remains an
  internal domain contract consumed by the infrastructure edge; templates do not acquire a new JSR
  dependency.
- Risks: exported declarations keep explicit return types and JSDoc; no new slow-type or subpath
  surface. Package tests, doc lint, and the package publish dry-run are final evaluator inputs.

## Open questions

- None that force implementation rework. The CI phase-2 flip is an ordering check, not a design
  decision: it remains deferred until S1, S9, and S11 are on `main`.
