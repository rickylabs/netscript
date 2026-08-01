# Worklog: fix public plugin registry generation (#1010)

## Run Metadata

| Field          | Value                                        |
| -------------- | -------------------------------------------- |
| Run ID         | `fix-1010-plugin-registry-generation--codex` |
| Branch         | `fix/1010-plugin-registry-generation`        |
| Archetype      | `6 - CLI / Tooling`                          |
| Scope overlays | `none`                                       |

## Design

### Public Surface

- `netscript generate plugins` — authoritative registry generation command.
- `netscript plugin sync` — compatibility command delegating to authoritative generation.
- No new `@netscript/cli` library export.

### Domain Vocabulary

- `InstalledPluginRuntime` — installed package identity/version and its runtime manifest source.
- `RuntimeRegistryManifest` / `RuntimeRegistryTarget` — existing `scaffold.runtime.json` contract
  subset.
- `RegistryGenerationResult` — per-plugin declared/written registry evidence.
- `EmptyPluginRegistryError` — named failure when an installed runtime has no registrable output.

### Ports

- Existing `ProcessPort` — execute plugin-owned generator in a project-rooted child Deno process.
- Existing `FileSystemPort` — read project metadata and validate emitted files.
- Existing JSR HTTP/file-fetch seam where published manifest bytes are required; no new generic SDK
  port.

### Constants

- No plugin identity constants. Manifest field names and Deno flags remain finite command vocabulary
  local to the adapter.

### Commit Slices

| # | Slice                                              | Gate                                 | Files                                                  |
| - | -------------------------------------------------- | ------------------------------------ | ------------------------------------------------------ |
| 1 | Manifest-driven generation and zero-result failure | focused generate tests/check         | generate feature + composition + tests + run artifacts |
| 2 | Sync delegation/docs and clean-install integration | targeted plugin/generate integration | plugin host/docs/integration + run artifacts           |
| 3 | Final gates/evaluator remediation                  | required validation and IMPL-EVAL    | owned fixes + run artifacts                            |

### Deferred Scope

- Installed-plugin ownership ledger — issue #167 uninstall follow-up owns it.
- Non-runtime plugins — legitimately produce no runtime registry and do not fail.

### AI follow-up design (2026-08-02)

- Public surface: no new exports or commands; retain `generate plugins` as authoritative.
- Domain vocabulary: existing runtime manifest targets and generated AI tool/agent registries.
- Ports: existing `FileSystemPort` and `ProcessPort`; no new effect seam.
- Constants: one E2E failure-hint constant beside the existing app-home hint.
- Commit slices: gate diagnostics; evidence-led generator fix and imported registry test; final
  harness/gate evidence.
- Deferred scope: AI runtime/provider behavior outside registry regeneration.
- Contributor path: AI registry discovery remains declared by `plugins/ai/scaffold.runtime.json`
  and rendered by the plugin-owned compiler.

### Rebase follow-up design (2026-08-02)

- Public surface: no intended source or export change; this is history integration and verification.
- Conflict policy: generated assets regenerate from merged sources; unexpected source conflicts
  stop the slice.
- Commit slices: plan; rebased conflict resolution; validation/teardown evidence; explicit
  force-with-lease push verification.
- Deferred scope: no rediagnosis or widening of issue #1010 behavior fixes.

### Contributor Path

Add a runtime generator by publishing `scaffold.runtime.json` with `runtimeRegistryGenerator` and
`runtimeRegistries`; the public CLI discovers and executes that contract without editing a host-side
plugin-name registry.

## Progress Log

| Time       | Slice     | Step           | Notes                                                                                                                                                                                                                      |
| ---------- | --------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-01 | bootstrap | reproduced     | Published 0.0.2 clean-room output saved at `.llm/tmp/issue-1010-clean-room-repro.log`.                                                                                                                                     |
| 2026-08-01 | plan      | root cause     | Confirmed generic generation defect; narrowed sync defect to parent-process manifest import after project-rooted config load.                                                                                              |
| 2026-08-01 | plan-eval | blocked launch | Canonical OpenRouter evaluator canary reported missing credential; no evaluation occurred.                                                                                                                                 |
| 2026-08-01 | plan-eval | PASS           | Separate Claude Code + OpenRouter Qwen session completed PLAN-EVAL. All 8 Plan-Gate items checked. D3/D4 spot-checked against source — both confirmed. Verdict written to `plan-eval.md`. Implementation hard stop lifted. |
| 2026-08-01 | slice 1   | implemented    | Added manifest-driven generation, project-configured subprocess execution, canonical target reporting, dry-run behavior, and named empty-runtime failure. |
| 2026-08-01 | slice 2   | implemented    | `plugin sync` delegates to authoritative generation; CLI reference/embedded build skill updated; real workers/sagas/triggers generators emit and assert canonical non-empty exports. |
| 2026-08-01 | slice 3   | validation     | All scoped/static/quality/JSR gates exited 0. Full runtime passed 44 gates; unrelated `behavior.service-health` timed out and raw command exited 1 after all registry-specific gates passed. |
| 2026-08-01 | follow-up | workspace resolver | Added workspace-first runtime manifest/generator resolution through `FileSystemPort`, with package-name-guarded upward discovery and the published HTTP fallback preserved. Commit `0e466f6a9`. |
| 2026-08-01 | follow-up | trigger manifest | Excluded scaffold-only `triggers/runtime.ts` from the published trigger runtime registry manifest; retained the generator's invalid-definition throw. Commit `9e93f757f`. |
| 2026-08-01 | follow-up | executable integration | Replaced text-only registry assertions with four tests: real generated-registry load, invalid-module rejection, workspace-first/no-fetch, and JSR-only published fallback. Commit `1ce434a4a`. |
| 2026-08-01 | follow-up | coverage restoration | Added real generated-module loading for workers and sagas. Workers asserts `example-job` is registered and excluded `job-tools.ts` is absent; sagas asserts `order-processing` is registered and a non-`-saga.ts` file is absent. Commit `e42696ae5`. |
| 2026-08-01 | follow-up | fixture correction | First saga run failed 5 passed/1 failed because `not-a-saga.ts` does end in `-saga.ts`; renamed the negative fixture to `saga-tools.ts`, after which all six integration tests passed. |
| 2026-08-02 | AI slice 1 | diagnostics | Made `behavior.ai-chat-route` explicitly capture subprocess output and added a registry/import-focused failure hint. Gate-definition tests: 5 passed, 0 failed; targeted check exit 0. |
| 2026-08-02 | AI slice 2 | reproduced | Ran the exact behavior import script against retained scaffold `plugin-smoke-20260801-205015`; exit 1: `AI tool module ai/tools/skill-loader.ts does not export an AiToolDefinition.` Generated registry retained `e2e-tool.ts` but also imported scaffold factory `skill-loader.ts`. |
| 2026-08-02 | AI slice 2 | root cause | Manifest-driven generation correctly passed `plugins/ai/scaffold.runtime.json`, but that manifest omitted the compiler's canonical `skill-loader.ts` exclusion. Added the exclusion to the published asset; invalid AI modules continue to throw. |
| 2026-08-02 | AI slice 2 | regression proof | Added an integration test that runs the real AI generator, imports both emitted registries, asserts `Map` entries `e2e-tool` and `assistant`, and proves `skill-loader` is absent. Seven integration tests passed. Regenerated the retained failing scaffold and the exact behavior script then exited 0. |
| 2026-08-02 | rebase | integrated main | Fetched `origin/main` at `8b69d78f0` and rebased 17 branch commits. The only conflict was generated `packages/cli/src/kernel/assets/skills.generated.ts`; regenerated it from merged skill sources, then `check:assets-barrel` passed. Rebased head before evidence commit: `2e35aeed9`. |
| 2026-08-02 | rebase | manifest audit | `plugins/ai/scaffold.runtime.json` retained main's surrounding manifest and the branch's `skill-loader.ts` exclusion without manual reconciliation. Trigger `runtime.ts` exclusion also survived. |

## Decisions

| Decision                                   | Reason                                                          | Source                        |
| ------------------------------------------ | --------------------------------------------------------------- | ----------------------------- |
| Generate is authoritative; sync delegates. | One command must own registry state and project context.        | issue acceptance + plan D1/D2 |
| Plugin manifests own paths/shapes.         | Runtime loaders and plugin generators are existing authorities. | plan D5                       |

## Drift

| Drift                                                                                                              | Severity | Logged in drift.md |
| ------------------------------------------------------------------------------------------------------------------ | -------- | ------------------ |
| Sync root cause is later than suspected: project config loading is already correct; parent resolver import is not. | minor    | yes                |

## Gate Results

### Static Gates

| Gate         | Command or check                    | Result                   | Notes                                 |
| ------------ | ----------------------------------- | ------------------------ | ------------------------------------- |
| Reproduction | published 0.0.2 clean-room sequence | FAIL (expected baseline) | generate exit 0/zero; sync exit 1/zod |
| Slice 1 focused tests | `deno test -A packages/cli/src/public/features/generate/plugins/*_test.ts` | PASS (exit 0) | 2 files, 4 steps passed |
| Slice 1 targeted check | targeted `deno check --unstable-kv` | PASS (exit 0) | Generator, command, and composition type-check. |
| Slice 2 focused tests | `deno test -A packages/cli/src/public/features/generate/plugins/*_test.ts packages/cli/src/public/features/plugins/host/plugin-loader_test.ts` | PASS (exit 0) | 4 files, 6 steps; real official generators covered. |
| Slice 2 targeted check | targeted `deno check --unstable-kv` | PASS (exit 0) | Sync adapter, composition, and integration test type-check. |
| Required CLI check | scoped wrapper, `--root packages/cli --ext ts,tsx` | PASS (exit 0) | 747 files, 7 batches, 0 findings. |
| Required plugin check | scoped wrapper, `--root packages/plugin --ext ts,tsx` | PASS (exit 0) | 153 files, 2 batches, 0 findings. |
| Required CLI lint | scoped wrapper, `--root packages/cli --ext ts,tsx` | PASS (exit 0) | 747 files, 4 batches, 0 findings. |
| Required targeted tests | `deno test -A packages/cli/src/public/features/generate packages/cli/src/public/features/plugins` | PASS (exit 0) | 26 groups, 62 steps, 0 failed. |
| CLI format | scoped format wrapper | PASS (exit 0) | 747 files, 4 batches, 0 findings. |
| Follow-up workspace check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages --root plugins --ext ts,tsx` | PASS (exit 0) | 2635 files, 22 batches, 0 findings. |
| Follow-up quality | `deno task ci:quality` | PASS (exit 0) | Check/lint/fmt/dependency and specifier/port guards completed; catalog warnings are pre-existing non-failing output. |
| Follow-up focused tests | `deno test -A packages/cli/src/public/features/generate/plugins/` | PASS (exit 0) | 6 passed (4 steps); generated trigger module was imported in-process. |
| Follow-up publish dry-run | `deno task publish:dry-run` | PASS (exit 0) | Workspace publish simulation included `plugins/triggers/scaffold.runtime.json`; terminal output ended `Success Dry run complete`. |
| Coverage follow-up workspace check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages --root plugins --ext ts,tsx` | PASS (exit 0) | 2635 files, 22 batches, 0 findings. |
| Coverage follow-up focused tests | `deno test -A packages/cli/src/public/features/generate/plugins/` | PASS (exit 0) | 8 passed (4 steps), 0 failed; workers, sagas, and triggers registries imported. |
| Coverage follow-up quality | `deno task ci:quality` | PASS (exit 0) | Check/lint/fmt and repository guards passed; existing dependency catalog warnings remained non-failing. |
| Coverage follow-up publish | `deno task publish:dry-run` | PASS (exit 0) | 2420-line output ended `Success Dry run complete`; existing dynamic-import warnings remained non-failing. |

### Fitness Gates

| Gate      | Result  | Evidence                                                              | Notes                                                      |
| --------- | ------- | --------------------------------------------------------------------- | ---------------------------------------------------------- |
| Plan-Gate | PASS | Separate Qwen evaluator `plan-eval.md` | Hard stop lifted before source implementation. |
| Code quality | `deno task quality:gate` | PASS (exit 0) | Scanner clean; doctrine checks report existing warnings only. |
| CLI JSR audit | `audit-jsr-package.ts --root packages/cli --text` | PASS (exit 0) | Dry-run OK; 16 existing doctrine/slow-type warnings recorded. |
| CLI publish dry-run | `deno publish --dry-run --allow-dirty --no-check=remote` | PASS (exit 0) | `Success Dry run complete`. |

### Runtime Gates

| Gate               | Result  | Evidence                          | Notes                   |
| ------------------ | ------- | --------------------------------- | ----------------------- |
| `scaffold.runtime` | FAIL (raw exit 1) | `.llm/tmp/issue-1010-validation/scaffold-runtime.log` | 44 passed; only unrelated `behavior.service-health` timed out at 117796ms; cleanup passed. Registry generation/check/readiness/behavior gates passed. |

### Consumer Gates

| Consumer                               | Result  | Evidence                          | Notes                               |
| -------------------------------------- | ------- | --------------------------------- | ----------------------------------- |
| workers/sagas/triggers runtime loaders | PASS | `installed-runtime-registry-integration_test.ts` | Canonical paths and non-empty source/import/export shapes asserted using each real plugin generator. |

## Handoff Notes

- PLAN-EVAL should inspect D3/D4 carefully: generic installed-package discovery and project-rooted
  subprocess execution are the load-bearing decisions.

## Raw Validation Output

```text
{"command":"deno check --quiet --unstable-kv <files>","selection":{"filesSelected":747,"batches":7,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}
RAW_EXIT_CODE=0
{"command":"deno check --quiet --unstable-kv <files>","selection":{"filesSelected":153,"batches":2,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}
RAW_EXIT_CODE=0
{"source":{"mode":"command","cwd":"/home/codex/repos/fix-1010","exitCode":0},"selection":{"filesSelected":747,"batches":4},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueRules":0,"uniquePaths":0},"groups":[]}
RAW_EXIT_CODE=0
ok | 26 passed (62 steps) | 0 failed
RAW_EXIT_CODE=0
{"command":"deno fmt --check","summary":{"filesSelected":747,"batches":4,"failedBatches":0,"findings":0,"ignoredFindings":0},"findings":[]}
RAW_EXIT_CODE=0
quality:gate: quality scan ok=true, findings=[]; doctrine FAIL=0 (existing WARN/INFO retained)
RAW_EXIT_CODE=0
JSR audit: # @netscript/cli@0.0.2; dry-run: OK; findings: 16 existing warnings
RAW_EXIT_CODE=0
Success Dry run complete
RAW_EXIT_CODE=0
generated.plugins-check: Generate plugin registries from discovered manifests — PASSED 1935ms
generated.deno-check: Type-check generated workspaces — PASSED 38750ms
runtime.wait.workers — PASSED 1615ms
runtime.wait.sagas — PASSED 604ms
runtime.wait.triggers — PASSED 580ms
behavior.workers-jobs — PASSED 27ms
behavior.service-health — FAILED 117796ms
cleanup.aspire-stop — PASSED 378ms
Summary: passed=44 failed=1
RAW_EXIT_CODE=1

FOLLOW-UP WORKSPACE CHECK
{"source":{"mode":"selection","cwd":"/home/codex/repos/fix-1010"},"command":"deno check --quiet --unstable-kv <files>","selection":{"filesSelected":2635,"batches":22,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}
RAW_EXIT_CODE=0

FOLLOW-UP CI QUALITY (verdict-bearing raw lines; dependency scan also emitted existing WARN lines)
[fmt:check] {"command":"deno fmt --check","cwd":"/home/codex/repos/fix-1010","mode":"check","summary":{"filesSelected":1883,"batches":10,"failedBatches":0,"findings":0,"ignoredFindings":0},"findings":[]}
[lint] {"source":{"mode":"command","cwd":"/home/codex/repos/fix-1010","exitCode":0},"selection":{"filesSelected":1734,"batches":9},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueRules":0,"uniquePaths":0},"groups":[]}
[check] {"source":{"mode":"selection","cwd":"/home/codex/repos/fix-1010"},"command":"deno check --quiet --unstable-kv <files>","selection":{"filesSelected":2486,"batches":21,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}
Task ci:quality (no command)
RAW_EXIT_CODE=0

FOLLOW-UP FOCUSED TESTS
running 1 test from ./packages/cli/src/public/features/generate/plugins/generate-plugin-registries-command_test.ts
generate plugin registries command ... ok (3ms)
running 1 test from ./packages/cli/src/public/features/generate/plugins/installed-runtime-registry-generator_test.ts
installed runtime registry generator ... ok (5ms)
running 4 tests from ./packages/cli/src/public/features/generate/plugins/installed-runtime-registry-integration_test.ts
generated trigger registry loads valid definitions and excludes scaffold runtime glue ... ok (83ms)
generated trigger registry rejects a non-definition module that is not excluded ... ok (67ms)
workspace import resolves the on-disk trigger manifest without fetching JSR ... ok (4ms)
JSR-only imports retain the published manifest and generator fallback ... ok (2ms)
ok | 6 passed (4 steps) | 0 failed (356ms)
RAW_EXIT_CODE=0

FOLLOW-UP PUBLISH DRY RUN (2676-line file listing truncated by the terminal; exact final output)
Success Dry run complete
RAW_EXIT_CODE=0

COVERAGE FOLLOW-UP FIXTURE ITERATION
$ deno test -A packages/cli/src/public/features/generate/plugins/installed-runtime-registry-integration_test.ts
generated workers registry loads jobs and excludes job tools ... ok (150ms)
generated sagas registry loads saga definitions and ignores other TypeScript files ... FAILED (188ms)
AssertionError: Values are not equal. Actual true / Expected false
FAILED | 5 passed | 1 failed (634ms)
error: Test failed
RAW_EXIT_CODE=1

COVERAGE FOLLOW-UP WORKSPACE CHECK
$ deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages --root plugins --ext ts,tsx
{"source":{"mode":"selection","cwd":"/home/codex/repos/fix-1010"},"command":"deno check --quiet --unstable-kv <files>","selection":{"filesSelected":2635,"batches":22,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}
RAW_EXIT_CODE=0

COVERAGE FOLLOW-UP FOCUSED TESTS
$ deno test -A packages/cli/src/public/features/generate/plugins/
generate plugin registries command ... ok (7ms)
installed runtime registry generator ... ok (9ms)
generated trigger registry loads valid definitions and excludes scaffold runtime glue ... ok (134ms)
generated trigger registry rejects a non-definition module that is not excluded ... ok (146ms)
workspace import resolves the on-disk trigger manifest without fetching JSR ... ok (12ms)
generated workers registry loads jobs and excludes job tools ... ok (133ms)
generated sagas registry loads saga definitions and ignores other TypeScript files ... ok (153ms)
JSR-only imports retain the published manifest and generator fallback ... ok (17ms)
ok | 8 passed (4 steps) | 0 failed (891ms)
RAW_EXIT_CODE=0

COVERAGE FOLLOW-UP CI QUALITY
$ deno task ci:quality
[fmt:check] {"command":"deno fmt --check","cwd":"/home/codex/repos/fix-1010","mode":"check","summary":{"filesSelected":1883,"batches":10,"failedBatches":0,"findings":0,"ignoredFindings":0},"findings":[]}
[lint] {"source":{"mode":"command","cwd":"/home/codex/repos/fix-1010","exitCode":0},"selection":{"filesSelected":1734,"batches":9},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueRules":0,"uniquePaths":0},"groups":[]}
[check] {"source":{"mode":"selection","cwd":"/home/codex/repos/fix-1010"},"command":"deno check --quiet --unstable-kv <files>","selection":{"filesSelected":2486,"batches":21,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}
Task ci:quality (no command)
RAW_EXIT_CODE=0

COVERAGE FOLLOW-UP PUBLISH DRY RUN (2420-line file listing truncated by terminal)
$ deno task publish:dry-run
Success Dry run complete
RAW_EXIT_CODE=0

AI DIAGNOSTICS SLICE
$ deno test -A packages/cli/e2e/tests/application/gates/scaffold-gates_test.ts
ok | 5 passed | 0 failed (46ms)
$ deno check packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts
Check packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts
RAW_EXIT_CODE=0

AI CHAT ROUTE REPRODUCTION
$ deno eval <VALIDATE_AI_CHAT_ROUTE_SCRIPT> /home/codex/repos/fix-1010/.llm/tmp/cli-e2e/plugin-smoke-20260801-205015
error: Uncaught (in promise) Error: AI tool module ai/tools/skill-loader.ts does not export an AiToolDefinition.
    at resolveAiToolDefinitions (.../.netscript/generated/plugin-ai/tools.registry.ts:34:11)
    at .../.netscript/generated/plugin-ai/tools.registry.ts:17:6
RAW_EXIT_CODE=1

AI MANIFEST PUBLISH SURFACE
$ deno task --cwd plugins/ai publish:dry-run
Task publish:dry-run deno publish --dry-run --allow-dirty
Simulating publish of @netscript/plugin-ai@0.0.2 with files:
   file:///home/codex/repos/fix-1010/plugins/ai/scaffold.runtime.json (916B)
Success Dry run complete
RAW_EXIT_CODE=0

AI IMPORTED-REGISTRY REGRESSION
$ deno test -A packages/cli/src/public/features/generate/plugins/installed-runtime-registry-integration_test.ts
generated AI registries load resources and exclude the skill-loader factory ... ok (178ms)
ok | 7 passed | 0 failed (1s)
RAW_EXIT_CODE=0

AI RETAINED-SCAFFOLD RE-VERIFICATION
$ deno run --config <project>/deno.json --allow-read --allow-write plugins/ai/src/cli/generate-runtime-registries.ts --project-root <project> --manifest plugins/ai/scaffold.runtime.json --profile scaffold --official-samples false
generated .netscript/generated/plugin-ai/tools.registry.ts (2 ai-tools)
generated .netscript/generated/plugin-ai/agents.registry.ts (1 ai-agents)
$ deno eval <VALIDATE_AI_CHAT_ROUTE_SCRIPT> <project>
AI chat route contract import smoke passed
RAW_EXIT_CODE=0

AI FINAL SCOPED CHECK
$ deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx
{"source":{"mode":"selection","cwd":"/home/codex/repos/fix-1010"},"command":"deno check --quiet --unstable-kv <files>","selection":{"filesSelected":747,"batches":7,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}
RAW_EXIT_CODE=0

## 2026-08-02 — scaffold workspace manifest resolution follow-up

### Design

- **Public surface:** unchanged. The change is internal to the installed-runtime adapter and the
  scaffold E2E gate definition.
- **Domain vocabulary:** a workspace member is a directory declared by the project's Deno
  `workspace` configuration whose `deno.json`/`deno.jsonc` `name` exactly matches the installed
  package name.
- **Ports:** all resolver filesystem access remains through the existing `FileSystemPort`; generator
  execution remains through `ProcessPort`.
- **Constants:** no new finite public IDs. Existing gate and package metadata remain authoritative.
- **Commit slices:** (1) correct AI gate capture placement; (2) resolve generic workspace members
  and prove scaffold-shaped AI registry loading; (3) record raw gates, teardown, and push evidence.
- **Deferred scope:** no generator shape relaxation, plugin-name special cases, release/version
  changes, PR body, issue checkboxes, or unrelated scaffold repairs.
- **Contributor path:** start at `resolveRuntimeManifest()` and its colocated loading integration
  tests; workspace and published resolution remain two inputs to the same adapter flow.

### Baseline evidence

`./.llm/tmp/cli-e2e/plugin-smoke-20260802-005521/deno.json` declares `"./plugins/*"` in
`workspace`. Its imports include local paths for `@netscript/plugin-workers/runtime` and
`@netscript/plugin-triggers/runtime`, but contain no `@netscript/plugin-ai` key. The AI package is
present as the local workspace member `plugins/ai`; the imports-only resolver therefore misses it
and selects the published 0.0.2 manifest.

The interrupted pre-follow-up local E2E log
`.llm/tmp/issue-1010-rebased-scaffold-runtime.log` ends at `database.init` with no summary. It is
not treated as gate evidence.

AI FINAL SCOPED LINT
$ deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli --ext ts,tsx
{"source":{"mode":"command","cwd":"/home/codex/repos/fix-1010","exitCode":0},"selection":{"filesSelected":747,"batches":4},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueRules":0,"uniquePaths":0},"groups":[]}
RAW_EXIT_CODE=0

AI FINAL SCOPED FORMAT
$ deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli --ext ts,tsx
{"command":"deno fmt --check","cwd":"/home/codex/repos/fix-1010","mode":"check","summary":{"filesSelected":747,"batches":4,"failedBatches":0,"findings":0,"ignoredFindings":0},"findings":[]}
RAW_EXIT_CODE=0

AI FINAL FOCUSED TESTS
$ deno test -A packages/cli/src/public/features/generate/plugins/ plugins/ai/src/cli/
generated AI registries load resources and exclude the skill-loader factory ... ok (229ms)
ok | 15 passed (4 steps) | 0 failed (2s)
RAW_EXIT_CODE=0

AI FINAL QUALITY GATE
$ deno task quality:gate
{"ok":true,"mode":"repository","scanned":["packages/cli/src","plugins"],"findings":[],"allowCount":7}
Doctrine checks: FAIL=0 for all configured roots; existing WARN/INFO retained.
RAW_EXIT_CODE=0

REBASE GENERATED-ASSET RESOLUTION
$ git rebase origin/main
CONFLICT (content): packages/cli/src/kernel/assets/skills.generated.ts
$ deno task gen:assets-barrel
Task gen:assets-barrel deno run --no-lock --allow-read --allow-write --allow-run=deno .llm/tools/generate-cli-assets-barrel.ts
$ deno task check:assets-barrel
Task check:assets-barrel deno task gen:assets-barrel && git diff --exit-code -- packages/cli/src/kernel/assets/embedded.generated.ts packages/cli/src/kernel/assets/skills.generated.ts packages/plugin/src/kernel/assets/embedded.generated.ts packages/fresh-ui/registry.generated.ts packages/service/src/primitives/scalar.generated.ts
Successfully rebased and updated refs/heads/fix/1010-plugin-registry-generation.
RAW_EXIT_CODE=0
```
