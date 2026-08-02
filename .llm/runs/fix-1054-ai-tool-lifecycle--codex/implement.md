use harness

## SKILL

netscript-harness, netscript-doctrine, netscript-cli, netscript-tools, netscript-pr

## Assignment — 0.0.3 release blocker: #1054 `scaffold.plugin.ai.lifecycle`

Branch: `fix/1054-ai-tool-lifecycle` (already checked out in this worktree).
Worktree: `/home/codex/repos/fix-1054`
Run dir: `.llm/runs/fix-1054-ai-tool-lifecycle--codex/`
Milestone: 0.0.3 · Closes #1054

> The Plan-Gate open-model evaluator is waived by the owner (2026-08-01); the supervisor performs
> PLAN-EVAL and IMPL-EVAL. Do not attempt `claude-print`, `provider-canary`, OpenRouter, Qwen or
> OpenHands, do not stop at the Plan-Gate, and do not fabricate a `plan-eval.md`. Write your plan,
> then proceed directly to implementation.

This is the ONLY thing blocking the 0.0.3 stable publish. Move fast; do not fake green.

---

## The real failure — already reproduced by the supervisor. Do not re-diagnose from scratch.

The issue body's "suspected cause" (a newly added tool resolving to **zero** definitions and being
filtered out by `selectToolDefinitionModules`) is **WRONG**. Do not implement against it.

Reproduction (verbatim, reproduce it yourself before you change anything):

```
mkdir -p /tmp/ns-1054 && cd /tmp/ns-1054
deno run -A --minimum-dependency-age=0 \
  https://jsr.io/@netscript/plugin-ai/0.0.3-canary.1/cli.ts \
  add tool e2e-tool --workspaceRoot=$PWD
```

Actual error:

```
error: Uncaught (in promise) TypeError: Import "@netscript/ai/tools" not a dependency
  hint: If you want to use a JSR or npm package, try running `deno add jsr:@netscript/ai/tools` ...
    at file:///tmp/ns-1054/ai/tools/e2e-tool.ts:3:30
  const module: unknown = await import(specifier);
    at async loadProjectModule (.../src/cli/ai-registry-compiler.ts:140:27)
    at async selectToolDefinitionModules (.../src/cli/ai-registry-compiler.ts:131:20)
    at async compileAiRegistry (.../src/cli/ai-registry-compiler.ts:110:7)
    at async Object.syncAiProject [as afterWrite] (.../src/cli/sync-ai-project.ts:12:3)
```

**Root cause.** `selectToolDefinitionModules` (PR #1029, commit `a838df5d0`) decides membership by
**executing** the app-owned tool module: `loadProjectModule` does `await import(files.toImportUrl(path))`.
The scaffolded tool stub's first statement is `import { defineAiTool } from '@netscript/ai/tools';`.
The plugin CLI process cannot resolve that bare specifier — when the CLI is run from its **published
https:// entrypoint** no local config/import map applies to the module graph at all. The dynamic
import throws, the throw propagates out of `afterWrite`, and the whole `add tool` command aborts.
The zero-definition filter never even runs.

Confirmations the supervisor already made — you do not need to redo these, but do not contradict them:

- It fails **even** when the project has a `deno.json` mapping `@netscript/ai/tools` and cwd ==
  `--workspaceRoot`. It is not a cwd or missing-import-map bug; it is the remote entrypoint.
- `scaffold.plugin.ai.mcp` passes because it is an **install** command. `afterWrite` (and therefore
  `syncAiProject` -> `compileAiRegistry`) only runs on the resource-command path
  (`packages/plugin/src/adapter/runner/plugin-cli-runner.ts:84`), which `add tool` takes and install
  does not. That asymmetry is the tell, and it matches the CI result exactly.
- The local-path variant of the same gate passes because the local repo's import map resolves the
  specifier. Only the JSR/published lane is red — which is exactly the lane `e2e-cli-prod.yml` runs.

## What the fix must do

Stop executing app-owned modules at scaffold time. Registry membership must be decided by **static
analysis of the module source text**, never by `await import()`.

Both of these must hold at once, in the SAME e2e run. The supervisor will verify this and will not
accept one gate fixed by breaking the other:

1. `scaffold.plugin.ai.lifecycle` — a freshly added, not-yet-wired tool is included in the registry
   and `add tool` exits 0.
2. `behavior.ai-chat-route` — a module that exports no ready tool definition stays OUT of the
   registry. Concretely `ai/tools/skill-loader.ts` must not enter the AI tool registry.

**Do NOT revert to filename exclusion.** That was the circular approach #1029 replaced.

### The discriminator to implement

The two cases are cleanly separable by source shape — no execution needed:

- A real tool (`plugins/ai/src/adapter/resources/tool/tool.stub.ts`) has an **exported binding whose
  initializer is a `defineAiTool(...)` call chain**:
  `export const e2eToolTool = defineAiTool('e2e-tool').describe(...)...server(...)`.
- `skill-loader.ts` (`plugins/ai/src/adapter/resources/mcp-tool/mcp-tool.stub.ts`) calls
  `defineAiTool` only **inside a factory function body** and exports
  `createSkillLoaderTool(skills: SkillLoaderPort)` — a function requiring a port argument. It exports
  **no** ready definition, so it is excluded on merit, not by name.

So: include a module iff its source declares an exported const/`export default` (or an exported
array of such) whose initializer is a `defineAiTool(...)` chain. A `defineAiTool` call that appears
only inside a function/method body does not qualify.

Implement this as a pure, testable function over module **text** in
`plugins/ai/src/cli/ai-registry-compiler.ts`, replacing `selectToolDefinitionModules` /
`loadProjectModule` / the runtime `resolveAiToolDefinitions` used for selection. It must:

- take no `AiRegistryModuleLoader`, do no I/O beyond reading the file text via `ProjectFiles`, and
  make no network calls;
- be deterministic and never throw on unparseable input — an unrecognised module is simply excluded;
- keep the **generated** registry module's own runtime `resolveAiToolDefinitions` / `isAiToolDefinition`
  helpers unchanged (those run inside the app, where specifiers resolve fine).

There is no AST dependency in the workspace; a careful, well-commented lexical scan over the source
is acceptable and is the expected shape here. Handle at minimum: `export const X = defineAiTool(`,
`export default defineAiTool(`, aliased/multiline chains, and `defineAiTool` appearing inside a
function body (must NOT match). Comments and strings containing `defineAiTool` must not produce a
false positive — strip or skip them.

`ProjectFiles` must be able to read a file's text. If `packages/plugin/src/cli/adapters/project-files.ts`
has no read method on the `ProjectFiles` port, add a minimal `readTextFile` to the port and its
`LocalProjectFiles` implementation. That is a `packages/plugin` change — keep it minimal and
documented; it is a new capability, not a behaviour change to existing callers.

### Also remove the leftover filename exclusion

`skill-loader.ts` is STILL listed in the `exclude` array in both:

- `plugins/ai/src/cli/ai-registry-compiler.ts` (`AI_TOOLS_TARGET.exclude`)
- `plugins/ai/scaffold.runtime.json` (`runtimeRegistries[0].exclude`)

With content-based selection it is redundant, and leaving it means the circular filename approach is
still load-bearing and the new rule is never actually exercised. **Remove the `"skill-loader.ts"`
entry from both** (keep `_registry.ts`, `mod.ts`, `types.ts` — those are structural, not tool-identity,
exclusions). This is what makes `behavior.ai-chat-route` a real proof of the new rule.

If — and only if — removing it demonstrably turns `behavior.ai-chat-route` red, stop and report to
the supervisor with the evidence rather than quietly putting it back.

## Regression tests (required — acceptance criterion 3)

In `plugins/ai/src/cli/ai-registry-compiler.test.ts`:

1. **The gate's flow.** A module whose source is the actual scaffolded tool stub output (generate it
   through `toolScaffolder.emit({ id: 'e2e-tool' })` so the test tracks the real stub, not a copy) is
   **included** in the compiled registry. Assert on `result.files` / `result.count` and on the emitted
   registry source containing the tool's import + entry.
2. **The #1029 property.** A module with the actual `skill-loader.ts` stub source (from
   `mcpToolStub`) is **excluded**, with `skill-loader.ts` NOT in the target's `exclude` list — i.e.
   excluded on content, proving the rule and not the filename.
3. **No module execution.** Assert `compileAiRegistry` succeeds for a tool module whose source
   imports a specifier that is unresolvable from the CLI process (e.g. `@netscript/ai/tools`). This
   is the direct regression for this bug: under the old code this path threw.

Prove RED-then-GREEN: run these tests against the pre-fix compiler (e.g. `git stash` the src change,
or temporarily point the test at the old selector) and record in the worklog that tests 1 and 3 fail
before the fix and pass after. Paste the actual failing output into
`.llm/runs/fix-1054-ai-tool-lifecycle--codex/worklog.md`.

**Never weaken or delete an existing assertion to reach green.** The existing test at
`ai-registry-compiler.test.ts:104-118` asserts skill-loader stays out — it currently does so via a
fake loader. Rewrite it to the new static mechanism, but it must still assert exclusion at least as
strongly as it does today. If you change an assertion, say so explicitly in the worklog and justify it.

## Diagnostics gap (acceptance criterion 4)

`.github/workflows/e2e-cli-prod.yml` already writes `--report .llm/tmp/cli-e2e-prod-report.json`, but
its `if: failure()` step (around line 110) only echoes a generic
`::error::Production CLI E2E failed ...` and never prints the failed gate's own message. That is why
run 30739345727 showed only `FAILED 1099ms`.

Apply the PR #1036 treatment used in `.github/workflows/e2e-cli.yml:237`: in that `if: failure()`
step, additionally run

```
deno run --allow-read .llm/tools/e2e/print-failed-report-steps.ts .llm/tmp/cli-e2e-prod-report.json
```

Keep the existing `::error::` line and keep the step resilient if the report file is absent (the job
can fail before the report is written) — the step must not mask the original failure.

## Verification you must run and paste output for

- `deno task check` / `deno task test` for `plugins/ai` and `packages/plugin`.
- `.llm/tools/run-deno-check.ts` — **do NOT pass `--unstable-kv`**.
- `run-deno-fmt.ts`, `run-deno-lint.ts`, `run-deno-doc-lint.ts` as the harness skill requires.
- The reproduction command above, re-run against your **local** `plugins/ai/cli.ts` — it must now
  exit 0 and write `.netscript/generated/plugin-ai/tools.registry.ts` containing the new tool.
- The e2e suite locally, far enough to show `scaffold.plugin.ai.lifecycle` AND
  `behavior.ai-chat-route` passing **in the same run**, with `--report` so the report JSON is
  available. Paste the summary line and both gate lines.

Note: the published-CLI lane can only be fully proven post-publish; prove the plugin-CLI behaviour
locally and state plainly in the PR body what is proven locally vs. what the prod lane will confirm.

## Scope discipline

Touch only: `plugins/ai/src/cli/ai-registry-compiler.ts`, its test,
`plugins/ai/scaffold.runtime.json`, `.github/workflows/e2e-cli-prod.yml`, and the minimal
`packages/plugin` `ProjectFiles` read capability if required. No version bumps. No unrelated
refactors. Do not dispatch the canary workflow — the orchestrator does that after merge.

## PR

Open a PR against `main` with:

- `Closes #1054` in the body
- colon labels: `type:fix`, `area:plugins`, and exactly ONE `status:` label
- milestone `0.0.3`
- `--repo rickylabs/netscript`
- a body that states the REAL root cause (module execution from a remote entrypoint), explicitly
  notes that the issue's suspected zero-definition over-selection was refuted, and shows both gates
  green in one run.

Push explicitly and confirm local HEAD sha == remote sha.
