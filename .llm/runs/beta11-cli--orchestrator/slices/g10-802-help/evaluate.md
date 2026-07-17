# Evaluation: beta11-cli--orchestrator/slices/g10-802-help

## Metadata

| Field          | Value                          |
| -------------- | ------------------------------ |
| Run ID         | `beta11-cli--orchestrator/slices/g10-802-help` |
| Target         | Plugin CLI `usage:` string truthfulness (#802) |
| Archetype      | `6 — CLI / Tooling`           |
| Scope overlays | none                          |
| Evaluator      | `qwen/qwen3.7-max` / `formal_evaluation` lane / 2026-07-18 |

## Process Verification

| Check                                  | Result        | Evidence                    |
| -------------------------------------- | ------------- | --------------------------- |
| Plan-Gate passed before implementation | PASS          | `plan-eval.md` verdict: `PASS` by Tier-A Fable 5 supervisor |
| Design section exists in worklog       | PASS          | `worklog.md` "## Design" section with public surface, vocabulary, ports, constants, slices |
| Commit slices match design plan        | PASS          | 1 slice committed as planned (`bffeeae5`); 10 files changed (+230/-65) |
| Each slice has a passing gate          | PASS          | All named gates green (see Static/Fitness/Runtime/Consumer below) |
| No speculative seams (unused files)    | PASS          | Diff touches only planned source + test files; no dead code introduced |
| Constants used for finite vocabularies | N/A           | Per plan rationale: three package-local literals; shared constant would widen scope (AP-6/AP-11 avoidance) |

## Static Gates

| Gate             | Command or check | Result | Evidence | Notes |
| ---------------- | ---------------- | ------ | -------- | ----- |
| Workers typecheck | `.llm/tools/run-deno-check.ts --root plugins/workers --ext ts,tsx` | PASS | 95 files, 0 occurrences | |
| Sagas typecheck   | `.llm/tools/run-deno-check.ts --root plugins/sagas --ext ts,tsx` | PASS | 69 files, 0 occurrences | |
| Triggers typecheck | `.llm/tools/run-deno-check.ts --root plugins/triggers --ext ts,tsx` | PASS | 73 files, 0 occurrences | |
| Workers lint      | `.llm/tools/run-deno-lint.ts --root plugins/workers --ext ts,tsx` | PASS | 95 files, 0 occurrences | |
| Sagas lint        | `.llm/tools/run-deno-lint.ts --root plugins/sagas --ext ts,tsx` | PASS | 69 files, 0 occurrences | |
| Triggers lint     | `.llm/tools/run-deno-lint.ts --root plugins/triggers --ext ts,tsx` | PASS | 73 files, 0 occurrences | |
| Phantom `ns-<plugin>` scan (usage metadata) | `grep -rn "ns-workers\|ns-sagas\|ns-triggers\|ns-streams" plugins/*/src` | PASS | Only 2 hits remain: `saga-inspector.ts:19` and `codemod.ts:21` — both JSDoc prose (`/** Result returned by ns-sagas inspect/codemod. */`), NOT `usage:` metadata. Docs-prose is explicit non-scope per plan and issue #802. | See findings below |
| Phantom scan in tests | `grep -rn "ns-workers\|ns-sagas\|ns-triggers\|ns-streams" plugins/*/tests` | PASS | 0 hits | |
| Streams audit (no usage fields) | `grep -rn "usage" plugins/streams/src/cli/streams-cli.ts` | PASS | Streams constructs commands with `{name, description, run}` only — no `usage` property anywhere in CLI source. Its composition entrypoint documents the direct `deno x -A jsr:@netscript/plugin-streams/cli` form in JSDoc line 26. Audited no-change is legitimate. | |
| `/cli` export reality | `deno eval` read of `plugins/{workers,sagas,triggers,streams}/deno.json` exports | PASS | All four plugins have `"./cli"` as a real export: workers → `./src/cli/composition/main.ts`, sagas → `./src/cli/mod.ts`, triggers → `./src/cli/composition/main.ts`, streams → `./src/cli/composition/main.ts`. The emitted `deno x -A jsr:@netscript/plugin-<name>@<version>/cli` form resolves to a real module. | |

## Fitness Gates

| Gate | Function                     | Result | Evidence | Violations |
| ---- | ---------------------------- | ------ | -------- | ---------- |
| F-1  | File-size lint               | N/A    | No new large files introduced | |
| F-2  | Helper-reinvention scan      | N/A    | No new helpers; metadata-only change | |
| F-3  | Layering check               | PASS   | `arch:check` exit 0; no FAIL findings | |
| F-4  | Inheritance audit            | N/A    | No class hierarchy changes | |
| F-5  | Public surface audit         | PASS   | No new exports; `deno.json` exports unchanged | |
| F-6  | JSR publishability gate      | PASS   | No export/dependency/permission/publish-file change; slow-type risk unchanged | |
| F-7  | Doc-score gate               | N/A    | JSDoc additions are test-local only | |
| F-8  | Workspace `lib` override     | N/A    | No deno.json changes | |
| F-9  | Permission declaration       | N/A    | No permission changes | |
| F-10 | Test-shape audit             | PASS   | Tests follow existing `*_test.ts` pattern; use existing test helpers | |
| F-11 | Forbidden-folder lint        | N/A    | No new folders | |
| F-12 | Naming-convention lint       | PASS   | Consistent with sibling test naming | |
| F-13 | Saga/runtime invariants      | N/A    | No saga runtime behavior changed | |
| F-14 | Console-log lint             | PASS   | No `console.log` introduced | |
| F-15 | Re-export-of-upstream lint   | N/A    | No new re-exports | |
| F-16 | Folder-cardinality lint      | PASS   | No new folder children | |
| F-17 | Abstract-derived co-location | N/A    | | |
| F-18 | Sub-barrel lint              | N/A    | No new barrels | |
| F-19 | Scoped source gate runners   | PASS   | `quality:scan` exit 0, `findings: []`, 7 pre-existing documented allowances | |

### Quality scan

```
deno task quality:scan → exit 0
{"ok":true,"mode":"repository","findings":[],"allowCount":7}
```

### Architecture check

```
deno task arch:check → exit 0
```

All WARN/INFO entries are pre-existing doctrine debt (file-size caps, directory-cardinality, missing architecture.md in unrelated packages) — none introduced or deepened by this slice.

## Runtime Gates

| Gate     | Validation     | Result | Evidence |
| -------- | -------------- | ------ | -------- |
| Metadata-only change | No service/scaffold/runtime behavior altered | N/A | Usage strings are static metadata returned in command definitions |

## Consumer Gates

| Consumer     | Validation     | Result | Evidence |
| ------------ | -------------- | ------ | -------- |
| Workers CLI metadata (21 commands) | Exhaustive `RecordingWorkersBackend` assert: every `WORKERS_CLI_COMMANDS` definition passes through backend with `usage.startsWith('deno x -A jsr:@netscript/plugin-workers@<version>/cli ')` | PASS | Test `WorkersCli usage metadata uses the runnable versioned JSR entrypoint` passed |
| Sagas CLI metadata (8 commands) | Exhaustive `RecordingSagasBackend` assert: every `SAGAS_CLI_COMMANDS` definition passes through backend with `usage.startsWith('deno x -A jsr:@netscript/plugin-sagas@<version>/cli ')` | PASS | Test `SagasCli usage metadata uses the runnable versioned JSR entrypoint` passed |
| Triggers CLI metadata (12 commands) | Exhaustive `RecordingTriggersBackend` assert: every `TRIGGERS_CLI_COMMANDS` definition passes through backend with `usage.startsWith('deno x -A jsr:@netscript/plugin-triggers@<version>/cli ')` | PASS | Test `TriggersCli usage metadata uses the runnable versioned JSR entrypoint` passed |
| Full workers tests | `deno test --allow-all plugins/workers/tests` | PASS | 11 passed, 0 failed |
| Full sagas tests | `deno test --allow-all plugins/sagas/tests` | PASS | 18 passed, 0 failed |
| Full triggers tests | `deno test --allow-all --unstable-kv plugins/triggers/tests` | PASS | 15 passed, 0 failed, 12 ignored (pre-existing environment-dependent) |
| Help-output regression coverage per touched definition | All 41 affected command definitions (21+8+12) covered by exhaustive iteration tests | PASS | Each test iterates `cli.commands()` and asserts prefix for every definition; command count matched against exported `*_CLI_COMMANDS` constant |

## Anti-Pattern Check

| AP    | Status | Evidence | Notes |
| ----- | ------ | -------- | ----- |
| AP-1  | N/A    | File sizes unchanged | |
| AP-2  | N/A    | No new type hierarchies | |
| AP-3  | N/A    | No new conditional dispatch | |
| AP-4  | N/A    | No framework-level change | |
| AP-5  | N/A    | No new coupling | |
| AP-6  | CLEAR  | Plan explicitly avoids extracting shared formatter constant for 3 literals — would be speculative shared abstraction | |
| AP-7  | N/A    | No cross-package coupling | |
| AP-8  | N/A    | No new adapters | |
| AP-9  | N/A    | No new configuration surface | |
| AP-10 | N/A    | No new error types | |
| AP-11 | CLEAR  | Same as AP-6 — shared help contract would widen scope of this truthfulness fix | |
| AP-12 | N/A    | No new CLI verbs | |
| AP-13 | N/A    | No runtime behavior change | |
| AP-14 | N/A    | No string building | |
| AP-15 | CLEAR  | The entire slice IS the fix for misleading CLI surface; 0 phantom `ns-<plugin>` usage strings remain | |

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           | 0     | No new doctrine violations |
| Resolved entries      | 0     | N/A |
| Deepened violations   | 0     | Pre-existing WARN/INFO in `arch:check` output unchanged — all relate to file-size, directory-cardinality, and missing architecture.md in unrelated packages |
| Unrecorded violations | 0     | |

## Findings

| Severity            | Finding     | Evidence     | Required action      |
| ------------------- | ----------- | ------------ | -------------------- |
| low                 | Two JSDoc prose comments in `plugins/sagas/src/cli/saga-inspector.ts:19` and `plugins/sagas/src/cli/codemod.ts:21` still reference `ns-sagas` (e.g., `/** Result returned by ns-sagas inspect. */`). These are NOT `usage:` metadata strings and thus fall outside both issue #802 scope and the approved plan's scope ("Docs prose … separately owned"). | `grep -rn "ns-sagas" plugins/*/src` returns exactly these 2 hits | Advisory only — belongs to docs-prose lane or a separate cleanup slice. Does not block PASS. |

## Lessons for Promotion

| Lesson    | Pattern     | Applies to     | Confidence          |
| --------- | ----------- | -------------- | ------------------- |
| Metadata regression via backend recording | Iterating all command definitions through a recording backend and asserting a prefix property is an exhaustive, low-cost regression pattern for CLI metadata truthfulness | CLI / Tooling (Archetype 6) | high |
| JSDoc prose as phantom-command residual | JSDoc comments describing CLI behavior may retain phantom command names even after `usage:` strings are fixed — a docs-prose sweep would be needed for full cleanup | CLI / Tooling (Archetype 6) | medium |

## Verdict

| Field     | Value                                    |
| --------- | ---------------------------------------- |
| Verdict   | PASS |
| Rationale | All 41 phantom `ns-<plugin>` usage strings replaced with versioned `deno x -A jsr:@netscript/plugin-<name>@<version>/cli` form across workers (21), sagas (8), and triggers (12). Streams audited and legitimately needs no change (no `usage` fields in any command). Every plugin's `deno.json` has a real `./cli` export confirming the emitted invocation shape is executable. Exhaustive regression tests iterate every command definition (41 total) through recording backends and assert the correct prefix, covering all touched command definitions. All three plugin test suites pass independently (workers 11/0, sagas 18/0, triggers 15/0+12 ignored). Scoped typecheck and lint pass for all three plugins (95+69+73 files, 0 occurrences). `quality:scan` and `arch:check` exit 0 with no new findings. Two residual JSDoc prose mentions of `ns-sagas` are outside both the issue and plan scope and do not block. No architecture debt introduced or deepened. Plan-Gate passed before implementation. All stop-lines honored — no merge, publish, or milestone action taken. |

PASS
