# Worklog: #1054 AI tool lifecycle

## Design

### Public Surface

- `compileAiRegistry` keeps its public purpose but drops the module-loader seam.
- A pure source-text predicate decides ready tool membership.

### Domain Vocabulary and Ports

- ready tool module: exported const/default initialized by `defineAiTool` (or alias), or array thereof.
- `ProjectFiles.readTextFile`: existing consumed port; no new capability required.

### Constants

- Canonical structural exclusions remain `_registry.ts`, `mod.ts`, `types.ts`.

### Commit Slices

See `plan.md`; three ordered slices, all within the owner-approved scope.

### Deferred Scope

- Full TypeScript grammar and post-publish published-CLI confirmation.

### Contributor Path

Add a tool through the existing scaffolder; registry membership follows the exported initializer,
while dependency-injected factories remain excluded by content.

## Progress Log

- 2026-08-02: published canary reproduction failed with the expected unresolved bare import.
- 2026-08-02: owner waiver reviewed; supervisor PLAN-EVAL checks every plan-gate item as PASS.
  Per directive, no `plan-eval.md` was fabricated and implementation proceeds immediately.

## Gate Results

### RED — pre-fix compiler

Command: `deno test --allow-all plugins/ai/src/cli/ai-registry-compiler.test.ts` with only the
compiler restored to baseline. Exit 1. Actual failure excerpt:

```text
compileAiRegistry includes the emitted tool stub without executing it ... FAILED
compileAiRegistry never resolves imports from app-owned tool modules ... FAILED
error: TypeError: Module not found "file:///project/ai/tools/e2e-tool.ts".
  const module: unknown = await import(specifier);
                          ^
    at async loadProjectModule (.../ai-registry-compiler.ts:140:27)
FAILED | 2 passed | 4 failed
```

The actual skill-loader assertion was strengthened: it now consumes the real `mcpToolStub`, asserts
`skill-loader.ts` is absent from `TOOLS_TARGET.exclude`, and still asserts the file is absent from
both `result.files` and emitted registry source. No existing property was weakened.

### GREEN — static selector

```text
running 6 tests
ok | 7 passed | 0 failed
```

### Verification

| Gate | Result | Evidence |
| --- | --- | --- |
| `plugins/ai` check/test | PASS | check exit 0; 25 tests passed |
| `packages/plugin` check/test | PASS | check exit 0; 77 tests passed; package source unchanged |
| scoped check/fmt/lint | PASS | 38 files, zero findings (check wrapper invoked without a user-supplied `--unstable-kv`) |
| scoped doc-lint | BASELINE | 17 existing private/other diagnostics, zero missing JSDoc; no changed exported entrypoint |
| `quality:scan` | PASS | `ok:true`, zero findings |
| `arch:check` | PASS | exit 0; existing warnings only |
| JSR dry-run | PASS | `@netscript/plugin-ai@0.0.3` dry-run complete; no version change |
| local plugin CLI reproduction | PASS | exit 0; generated registry imports and resolves `e2e-tool.ts` |
| paired default E2E attempt 1 | BLOCKED | lifecycle PASS 65ms; unrelated `behavior.service-health` failed before chat gate |
| paired default E2E attempt 2 | BLOCKED | lifecycle PASS 63ms; identical service-health failure before chat gate |
| paired sqlite E2E attempt | BLOCKED | lifecycle PASS 75ms; service-health expects aggregate JSON but observed plain `Healthy` |
| exact AI chat gate script on same generated sqlite project | PASS | `AI chat route contract import smoke passed`; registry has e2e-tool and no skill-loader |

The full-suite reports are `.llm/tmp/cli-e2e-1054-report.json`,
`.llm/tmp/cli-e2e-1054-report-rerun.json`, and `.llm/tmp/cli-e2e-1054-sqlite-report.json` (scratch,
not committed). The required two gates could not both appear in one completed report because the
unrelated service-health gate aborts the sequential suite first. This is reported plainly and is
not treated as green.

### Supervisor substantive review / IMPL-EVAL

- Static selection performs only `ProjectFiles.readTextFile`; no dynamic import or network path remains.
- Actual tool and skill-loader stubs exercise the discriminator with filename exclusion removed.
- Generated runtime `resolveAiToolDefinitions` and `isAiToolDefinition` code is unchanged.
- Lexer tests cover aliases, multiline arrays, comments, strings, factory bodies, and malformed input.
- Scope is limited to the four authorized product/workflow files; `packages/plugin` required no edit.
- Verdict: implementation content PASS; merge-readiness BLOCKED pending a single completed report
  showing both required gates because the unrelated service-health baseline fails first.

### Reconcile

- Issue #1054 remains the closing target; PR must use `Closes #1054`, milestone 0.0.3,
  `type:fix`, `area:plugins`, and one `status:` label.
