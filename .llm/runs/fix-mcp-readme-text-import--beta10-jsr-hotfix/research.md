# Research — fix-mcp-readme-text-import--beta10-jsr-hotfix

## Re-baseline

- Carried-in source: user evidence from `publish.yml` run `29558968037`.
- Re-derived against `origin/main` @ `a5adb706` on 2026-07-17.
- The branch is clean and points at current `origin/main`; no carried implementation exists.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | `packages/mcp/cli.ts:18` imports `README.md` with `type: 'text'`; the registry rejected this while local dry-run passed. | `rg -n "with \\{ type:" packages/mcp/cli.ts`; publish run 29558968037 |
| 2 | The repo already embeds publish-time assets as generated string constants and protects them with regeneration-plus-diff parity. | `.llm/tools/generate-cli-assets-barrel.ts`; root tasks `gen:assets-barrel` and `check:assets-barrel` |
| 3 | The existing release preflight scans the actual include/exclude-filtered publish surface, but only rejects import-meta filesystem reads and self-imports; its messages recommend text imports. | `.llm/tools/release/preflight-text-imports.ts` |
| 4 | Publishable `with { type: ... }` syntax exists beyond MCP: MCP package metadata, CLI metadata/schema, and plugin package metadata. Test-only attributes and generated string contents are not publishable syntax. | publish rules in affected `deno.json` files plus `rg -n --glob '*.ts' 'with\\s*\\{\\s*type\\s*:' packages plugins` |
| 5 | Release and JSR-audit skills in both `.agents/skills` and `.claude/skills` currently bless import attributes; the publish-workspace comment already records the correct registry behavior. | `rg -n "import attributes|text imports" .agents/skills .claude/skills .llm/tools/release/publish-workspace.ts` |

## jsr-audit surface scan

- Surface scanned: `@netscript/mcp` exports `.` and `./cli`, plus every publishable TypeScript file selected by workspace publish rules under `packages/**` and `plugins/**`.
- Static dry-run risk: local `deno publish --dry-run` is known to pass the rejected text attribute, so it is necessary but not sufficient.
- Registry risk: any import attribute (`with { type: ... }`) in publishable source can fail module-graph construction; the only sanctioned bundled-asset pattern is a checked-in generated constant.
- Public API/slow-type risk: no public signature is intentionally changed; generated constants remain internal.

## Open questions

- None. The user locked the branch, PR metadata, registry-safe pattern, sweep scope, negative-proof requirements, and gate set.
