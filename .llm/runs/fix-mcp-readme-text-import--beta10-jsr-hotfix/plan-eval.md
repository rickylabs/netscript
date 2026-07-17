# PLAN-EVAL — fix-mcp-readme-text-import--beta10-jsr-hotfix

- Plan evaluator session: Claude Code + OpenRouter (open-model qwen3.7-max) / 2026-07-17
- Run: fix-mcp-readme-text-import--beta10-jsr-hotfix
- Surface / archetype: `@netscript/mcp` + cross-workspace publish surface / Archetype 6 — CLI / Tooling
- Scope overlays: none

## Checklist results

| Plan-Gate item                          | Result            | Evidence / location |
| --------------------------------------- | ----------------- | ------------------- |
| Research present and current            | PASS              | `research.md` exists; re-baselined against `origin/main` @ `a5adb706` on 2026-07-17. Spot-checked: `packages/mcp/cli.ts:18` confirmed `import packageReadme from './README.md' with { type: 'text' }`; `.llm/tools/generate-cli-assets-barrel.ts` exists and follows the described pattern; `gen:assets-barrel` + `check:assets-barrel` tasks confirmed in root `deno.json:80-81`; `preflight-text-imports.ts` confirmed to check `import.meta`-relative reads (not import attributes) with message recommending text imports at line 455. |
| Decisions locked                        | PASS              | `plan.md` D1–D4 stated with rationale. D1 (generated constants) justified by witnessed JSR registry rejection. D2 (extend generation pattern) justified by proven barrel pattern. D3 (preflight rejects all `with { type: }`) justified by registry attribute-type-agnostic limitation. D4 (tests/scaffold excluded) justified by published-module-graph boundary. |
| Open-decision sweep                     | PASS              | Plan lists 3 items: generator/file placement (resolved now), attribute parser strategy (resolved now — lexical scan preserves line numbers), post-publish beta retry (safe to defer — explicitly non-scope). Evaluator own sweep: no additional decisions found that would force rework if deferred. |
| Commit slices (< 30, gate + files each) | PASS              | 4 slices, ordered. Each names what it proves, the proving gate, and files/categories: (1) harness bootstrap → PLAN-EVAL → run artifacts; (2) generated assets + sweep → freshness green/red + focused checks/tests → generator, tasks, generated files, consumers; (3) preflight + guidance → scanner tests + preflight green/red + skill sync → release tool/tests + skills; (4) final evidence → required gates + IMPL-EVAL → run artifacts + PR phase trail. |
| Risk register                           | PASS              | 5 risks with mitigations in `plan.md`. Scope miss → reuses `scanPublishSurface` publish-rule filtering. False-positive gate → lexical tests for syntax vs inert text. Metadata drift → regeneration + `git diff --exit-code` + negative seed proof. Docs contradiction → dual-skill update + `agentic:check-claude`. Dry-run false sense → recorded as static-only evidence; registry failure rationale retained. |
| Gate set selected                       | PASS              | Required gates from archetype-gate-matrix for Arch 6: F-5 (public surface), F-6 (JSR publishability), F-7 (doc-score), F-9 (permissions — reviewed, no expansion), F-10 (test shape), F-19 (scoped runners), code quality (check/lint/fmt), `arch:check` (fitness gates incl. F-CLI where applicable), `agentic:check-claude` (skill mirror validation). Validation plan table (9 ordered entries) includes focused MCP checks, generator freshness green/red, release scanner tests, preflight green/red, MCP JSR static gate, quality scan, doctrine fitness, skill mirror, and IMPL-EVAL. |
| Deferred scope explicit                 | PASS              | `plan.md` Non-Scope: test-only JSON import attributes; scaffold template strings (userland-generated, not published module syntax); cutting/publishing/retrying beta.10/merging PR/closing #808; unrelated archetype restructuring debt. Deferred Scope section: actual publish retry and `e2e-cli-prod` remain post-merge release operations. |
| jsr-audit surface scan (pkg/plugin)     | PASS              | `research.md` "jsr-audit surface scan" section names: `@netscript/mcp` exports (`.` + `./cli`); all publishable TS under `packages/**` and `plugins/**` per each member's publish rules. Risks named: static dry-run is necessary but not sufficient (local passes registry-rejected syntax); registry risk is any import attribute in publishable source; slow-type risk is nil (no public signature change). Plan addresses each risk through generated constants (registry-safe), preflight rejection (attribute-agnostic), and publish:dry-run evidence (static-only). |

## Open-decision sweep (evaluator-run)

**Additional sweep performed by evaluator:** The tree contains 18+ non-test, non-generated `with { type: ... }` attributes across publishable source: 3 in `packages/cli` (`public-command-tree.ts`, `jsr-specifiers.ts`, `editor-config.ts`; all `type: 'json'`), 1 in `packages/mcp` (`spawn-command-executor.ts`; `type: 'json'`), 1 + 1 test fixture in `packages/mcp` (`cli.ts`; `type: 'text'`), 2–4 in `plugins/streams` (`main.ts`, `verify-plugin.ts`, `mod.ts`), 1–3 in `plugins/sagas` (`verify-plugin.ts`, `mod.ts`), 1–4 in `plugins/workers` (`verify-plugin.ts`, `init.ts`), 1–3 in `plugins/auth` (`constants.ts`, `verify-plugin.ts`), 1–4 in `plugins/triggers` (`verify-plugin.ts`, `main.ts`), 1–2 in `plugins/ai` (`constants.ts`, `verify-plugin.ts`). The plan's D3 scope ("all publishable source" + each member's publish rules via `scanPublishSurface`) and slice 2 ("full publish-surface sweep") correctly encompass this surface. The worklog Design and worklog Handoff Notes (`worklog.md` line 75) reference the sweep scope. No additional decisions forced open by this surface.

**None.** All decisions are either resolved in the plan or explicitly safe to defer.

## Verdict

`PASS`

## Notes

- The worklog Design section is appropriately minimal for this hotfix: it does not enumerate spine abstracts, layer-2 abstracts, vertical-feature catalogs, or extension axes because the run touches no abstract hierarchy or feature structure. The archetype 6 design-checkpoint items that apply (public surface, domain vocabulary, ports, constants, contributor path, slice ordering) are present.
- The evaluator confirmed that `packages/mcp/cli.ts:18` carries the registry-rejected `with { type: 'text' }` attribute and that the existing `.llm/tools/generate-cli-assets-barrel.ts` generator pattern provides a proven structural basis for the plan's D2 extension.
- The evaluator confirmed the risk that local `deno publish --dry-run` passes the rejected attribute syntax (research finding 1). The plan correctly retains the registry failure rationale and treats dry-run as static-only evidence.
- The evaluator verified that `preflight-text-imports.ts` currently scans for `import.meta`-relative file reads only (check `file-url-import-meta`) and does not scan for import attributes — confirming the plan's need for a preflight correction slice (slice 3).
