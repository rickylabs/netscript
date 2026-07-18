use harness

## SKILL
- netscript-harness; netscript-doctrine; netscript-release (READ IT — the preflight §); netscript-tools; jsr-audit; netscript-pr; rtk

## Slice: p0 hotfix — JSR registry rejects `with { type: "text" }`; @netscript/mcp + @netscript/cli failed to publish at v0.0.1-beta.10

Worktree `/home/codex/repos/b10-textimport`, branch `fix/mcp-readme-text-import`, base = current main. PR base: main.

Evidence (publish.yml run 29558968037): `error: Failed to publish @netscript/mcp@0.0.1-beta.10 … failed to build module graph: The import attribute type of "text" is unsupported. Specifier: file:///README.md at file:///cli.ts:18:27`. Local `deno publish --dry-run` PASSES this — the rejection is REGISTRY-side only. 33 siblings published; cli was dependency-skipped.

Fix:
1. `packages/mcp/cli.ts` (and sweep the ENTIRE publishable surface for other `with { type: "text" }` / `with { type: "json" }`-style import attributes in packages/** and plugins/**): replace with the repo's generated-string-constant pattern (see packages/cli's `embedded.generated.ts` + its generator + `check:assets-barrel` parity gate — mirror that: generate the README/docs-corpus constants into a `*.generated.ts` with a regeneration task and a freshness check wired like check:assets-barrel, so the constant can't drift from README.md silently).
2. **Fix the doctrine that caused this**: `release:preflight` (.llm/tools/release/preflight-release.ts) currently BLESSES text imports as JSR-safe ("publishable source must use text imports or generated string constants"). Flip it: import attributes are NOT registry-safe — preflight must FAIL on any `with { type:` import attribute in publishable source (generated constants are the only sanctioned pattern). Prove the new check fails on a seeded violation (a gate never seen to fail is not a gate), update the skill/docs wording it quotes (.claude/skills/netscript-release source under .agents/skills if mirrored; run the sync check).
3. Gates: focused mcp tests; `deno task release:preflight` green on the fixed tree AND proven-fail on seed; `packages/mcp: deno task publish:dry-run`; `deno task quality:scan` changed-file; `arch:check`; the new freshness check green + proven-fail.

Constraints: no new suppressions; push explicit refspec `git push origin HEAD:refs/heads/fix/mcp-readme-text-import`; DRAFT PR to main titled `fix(mcp): registry-safe README embedding — JSR rejects text-import attributes`, body with the publish-failure evidence + `Refs #808` (no closing keyword; that issue is closed — this is the publish follow-up), labels `type:fix, area:tooling, priority:p0, status:impl-eval`, milestone 12. No self-evals; do not merge.
