# Worklog — #290 AI MCP scaffolder

## Design

- Public surface: `plugin install ai --mcp`; generated `ai/tools/skill-loader.ts` consumes `SkillLoaderPort` from `@netscript/ai/skills`.
- Domain vocabulary: `mcp` is a boolean install option; the MCP stub exposes a tool definition backed by an injected `SkillLoaderPort`.
- Ports: consume the already-published `SkillLoaderPort`; add no new framework port.
- Constants: the generated path and tool id are fixed in the scaffolder/stub.
- Commit slices: (1) conditional plugin scaffolder + unit tests; (2) CLI forwarding + scaffold E2E variant and targeted gates; (3) evidence/worklog commit and push.
- Deferred scope: default AI topology, `--persist-threads`, runtime MCP transport/server behavior, and full `scaffold.runtime` execution.
- Contributor path: follow `src/adapter/resources/mcp-tool/`, then the AI scaffold entrypoint, then the E2E plugin variant state.

## Plan

Archetype 5 is primary because the emitted source belongs to `plugins/ai`; the CLI/E2E extension is an embedded Archetype 6 concern. Keep the default starter resource list byte-for-byte unchanged. Add the MCP artifact only when scaffold context has `mcp: true`, forward that flag only from `plugin install ai --mcp`, and add a targeted plugin-suite variant that installs AI with the flag before generated-workspace type-checking.

Risks: accidental default emission (guard with exact path tests); generated import mismatch (use `deno doc`-verified `@netscript/ai/skills` surface and type-check fixture); generic CLI leakage (reject/ignore outside AI explicitly); E2E duplicate gate ids (give the variant a distinct id).

PLAN-EVAL is owner-waived in the slice brief (carried drift D1).

## Evidence

| Gate | Result |
| --- | --- |
| `deno doc packages/ai/src/skills/mod.ts` | PASS; verified `SkillLoaderPort.matchByTag`, `matchByQuery`, `list`, and `load`. |
| scoped check `plugins/ai` | PASS; 32 files, 0 findings. |
| scoped check `packages/cli/e2e` | PASS; 86 files, 0 findings. |
| scoped lint `plugins/ai` | PASS; 32 files, 0 findings. |
| scoped lint `packages/cli/e2e` | PASS; 86 files, 0 findings. |
| scoped check/lint `packages/cli/src` | PASS; wrapper exits clean with 0 findings. |
| scoped fmt `plugins/ai` | PASS; 32 files, 0 findings. |
| scoped fmt `packages/cli/e2e` | PASS; 86 files, 0 findings. |
| resource + suite-builder unit tests | PASS; 13 passed, 0 failed. |
| `deno task e2e:cli gates scaffold.plugins` | PASS; lists distinct `scaffold.plugin.ai.mcp` before generated check. |
| `deno task e2e:cli run scaffold.plugins --cleanup --format pretty` | PASS; 12 passed, 0 failed, including AI default, AI MCP, and generated workspace/plugin check. |
| `deno task --cwd /home/codex/repos/ns-b8-290/packages/cli test` | PASS after CI expectation repair; 329 tests / 401 steps passed, 0 failed. |

No full `scaffold.runtime` run was performed, per the slice brief.

## Reconcile

- Issue #290 remains open and scoped exactly to the opt-in MCP scaffolder and E2E variant.
- Default AI install remains six starter artifacts; unit coverage proves flag-off emits no MCP artifact.
- No `deno.lock` or cache changes were introduced.

## CI expectation repair

- Updated the exact third-party scaffolder argv expectation to retain the full confined permission list and include the intentional `mcp: false` context option.
- Updated the exact plugin-suite gate expectation to include `GATE.SCAFFOLD_PLUGIN_AI_MCP` between the default AI install and plugin-list/generated checks.
- Assertions remain exact; none were removed or weakened.
