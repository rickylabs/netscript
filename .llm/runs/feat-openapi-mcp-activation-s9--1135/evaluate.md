# Evaluation: OMB S9 activation surfaces and migration fixture

## Metadata

| Field          | Value                                                    |
| -------------- | -------------------------------------------------------- |
| Run ID         | `feat-openapi-mcp-activation-s9--1135`                   |
| Target         | `packages/mcp` activation plus CLI scaffold consumers    |
| Archetype      | `2 - Integration`                                        |
| Scope overlays | `none`                                                   |
| Evaluator      | `open-model evaluator (Qwen 3.7 Max) / 2026-08-04`      |

## Process Verification

| Check                                  | Result   | Evidence                                                                                               |
| -------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------ |
| Plan-Gate passed before implementation | `PASS`   | `plan-eval.md` — composed per milestone-run.md orchestrator waiver; owner directive replaces PLAN-EVAL |
| Design section exists in worklog       | `PASS`   | `worklog.md` "Design" section: Public Surface, Domain Vocabulary, Ports, Constants, Commit Slices      |
| Commit slices match design plan        | `PASS`   | 2 slices (activation bytes + S-18 migration) match worklog design; 3 commits on branch                 |
| Each slice has a passing gate          | `PASS`   | Slice 1: focused MCP+CLI fixtures 29/29; Slice 2: S-18 migration test PASS                             |
| No speculative seams (unused files)    | `PASS`   | All 14 changed source files trace to plan scope; no dead imports or unused additions                   |
| Constants used for finite vocabularies | `PASS`   | `OPERATION_SCHEMA_HINT` string constant; `OPENAPI_TOOL_TRIAD` const tuple; `MIGRATION_TARGET_SPECIFIER`|

## Static Gates

| Gate             | Command or check                                        | Result | Evidence                                          | Notes                                                                  |
| ---------------- | ------------------------------------------------------- | ------ | ------------------------------------------------- | ---------------------------------------------------------------------- |
| Narrow typecheck | scoped check wrapper, `--config=packages/mcp/deno.json` | PASS   | 103 files, 0 diagnostics (worklog)                | Independently verified via focused test run                            |
| Slice typecheck  | scoped check wrapper, `--config=packages/cli/deno.json` | PASS   | 16 files, 0 diagnostics (worklog)                 | CLI command-tree and init tests typecheck during test run              |
| Format           | scoped fmt wrappers with package config                  | PASS   | MCP 103 + CLI 16 files, 0 findings (worklog)      |                                                                        |
| Lint             | scoped lint wrappers with package config                 | PASS   | MCP 103 + CLI 16 files, 0 occurrences (worklog)   |                                                                        |
| Doc lint         | `deno task doc:lint --root packages/mcp`                | PASS   | combined total 0 across 3 entrypoints             | Independently re-run: `combinedTotal: 0`                               |
| Publish dry-run  | `deno publish --dry-run --allow-dirty` in packages/mcp  | PASS   | "Success Dry run complete"                        | Independently re-run: success, no slow types                           |
| Link/path check  | fixture paths in init-agent_test.ts                     | PASS   | `./fixtures/prior-release.mcp.json` resolves      | `./fixtures/prior-release-tools.json` resolves; both read during test  |

## Fitness Gates

| Gate | Function                        | Result           | Evidence                                                    | Violations |
| ---- | ------------------------------- | ---------------- | ----------------------------------------------------------- | ---------- |
| F-1  | File-size lint                  | PASS             | `quality:gate` exit 0; no new large files                   | none       |
| F-2  | Helper-reinvention scan         | PASS             | `OPERATION_SCHEMA_HINT` is one constant, not a helper class | none       |
| F-3  | Layering check                  | PASS             | hint added at flow/domain layer; no layer violation         | none       |
| F-4  | Inheritance audit               | N/A              | no class hierarchy involved                                 | none       |
| F-5  | Public surface audit            | PASS             | `operationSchemaHint` added to existing `DoctorCheck` and `ErrorGroupSummary` contracts; no new export | none |
| F-6  | JSR publishability gate         | PASS             | publish dry-run success                                     | none       |
| F-7  | Doc-score gate                  | PASS             | doc-lint combined total 0; new fields have JSDoc            | none       |
| F-8  | Workspace lib override check    | N/A              | no workspace lib involved                                   | none       |
| F-9  | Permission declaration check    | PASS             | no new permission required                                  | none       |
| F-10 | Test-shape audit                | PASS             | tests use `Deno.test` with descriptive names; no shape violation | none  |
| F-11 | Forbidden-folder lint           | PASS             | no new folders created                                      | none       |
| F-12 | Naming-convention lint          | PASS             | `operationSchemaHint` follows camelCase convention          | none       |
| F-14 | Console-log lint                | PASS             | no new console.log added                                    | none       |
| F-15 | Re-export-of-upstream lint      | N/A              | no re-exports involved                                      | none       |
| F-16 | Folder-cardinality lint         | PASS             | no new files in cardinality-sensitive folders               | none       |
| F-17 | Abstract-derived co-location    | N/A              | no abstract-derived types                                   | none       |
| F-18 | Sub-barrel lint                 | N/A              | no new barrel files                                         | none       |
| F-19 | Scoped source gate runners      | PASS             | targeted scan: 0 findings, 0 allowances (worklog)           | none       |

## Runtime Gates

| Gate              | Validation                                          | Result | Evidence                                            |
| ----------------- | --------------------------------------------------- | ------ | --------------------------------------------------- |
| Focused MCP tests | `deno test stdio_test.ts telemetry-flows_test.ts doctor_test.ts` | PASS | 11 passed, 0 failed (independently re-run)         |
| Focused CLI tests | `deno test init-agent_test.ts`                      | PASS   | 15 passed, 0 failed (independently re-run)         |
| CLI command-tree  | `deno test public-command-tree_test.ts`             | PASS   | 3 passed, 0 failed (independently re-run)          |
| scaffold.runtime  | `deno task e2e:cli run scaffold.runtime --cleanup`  | PASS   | 71 passed, 0 failed (worklog; serialized gate)     |

## Consumer Gates

| Consumer              | Validation                                                     | Result | Evidence                                                                                                   |
| --------------------- | -------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------- |
| MCP initialize        | byte fixture in stdio_test.ts                                  | PASS   | `assertStringIncludes` confirms the curl-moment sentence in `result.instructions`                          |
| App-scoped AGENTS.md  | byte fixture in public-command-tree_test.ts                    | PASS   | `assertStringIncludes` confirms `list_service_operations` and `get_operation_schema` in generated markdown |
| Doctor failure path   | byte fixture in doctor_test.ts                                 | PASS   | `operationSchemaHint` present on non-pass checks; absent on pass checks                                    |
| Error group path      | byte fixture in telemetry-flows_test.ts                        | PASS   | `operationSchemaHint` present with service name and `get_operation_schema` reference                       |
| S-18 migration        | `init-agent_test.ts` S-18 test                                 | PASS   | Prior 0.0.4 pin → initAgent rewrites to 0.0.5 → subprocess restart lists 21 tools including triad         |

## Anti-Pattern Check

| AP    | Status  | Evidence                                                                                          | Notes                                       |
| ----- | ------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| AP-1  | N/A     | scope does not touch module boundaries                                                            |                                             |
| AP-2  | N/A     | no new module structure                                                                           |                                             |
| AP-3  | N/A     | no port expansion                                                                                 |                                             |
| AP-4  | N/A     | no adapter pattern change                                                                         |                                             |
| AP-5  | N/A     | no dependency direction change                                                                    |                                             |
| AP-6  | CLEAR   | One named constant `OPERATION_SCHEMA_HINT`; no generic hint helper or abstraction factory         | Plan D1 honored                             |
| AP-7  | N/A     | no composition root change                                                                        |                                             |
| AP-8  | N/A     | no DI container introduced                                                                        |                                             |
| AP-9  | N/A     | no shared helper flag                                                                             |                                             |
| AP-11 | CLEAR   | No module-load IO, no hidden env reads, no implicit `Deno.openKv()`                               | `cliSpecifier` is an explicit dep injection |
| AP-13 | N/A     | no saga or event pattern                                                                          |                                             |
| AP-14 | N/A     | no test-only production code                                                                      |                                             |
| AP-16 | N/A     | no new folder                                                                                     |                                             |
| AP-17 | N/A     | no interfaces/ folder introduced                                                                  |                                             |
| AP-19 | CLEAR   | No permission change; `deno publish --dry-run` succeeds without new permission declarations       |                                             |
| AP-20 | N/A     | no config pattern change                                                                          |                                             |
| AP-22 | N/A     | no sub-folder mod.ts                                                                              |                                             |
| AP-23 | N/A     | no composition root wiring                                                                        |                                             |
| AP-24 | N/A     | no engine switch                                                                                  |                                             |
| AP-25 | CLEAR   | Filesystem behavior stays in existing `agent-init` adapter tests; new fixture reads are test-only | Plan AP-25 honored                          |

## Arch-Debt Delta

| Metric                | Count | Evidence                                           |
| --------------------- | ----- | -------------------------------------------------- |
| New entries           | 0     | No new doctrine violations introduced              |
| Resolved entries      | 0     | No existing debt entries targeted                  |
| Deepened violations   | 0     | No existing debt entries deepened                  |
| Unrecorded violations | 0     | No unrecorded doctrine violations found in changes |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| none     | —       | —        | —               |

### Audit Notes (non-blocking)

1. **Schema consistency.** `operationSchemaHint` is optional on `DoctorCheck` (correct — pass checks
   get no hint) and required on `ErrorGroupSummary` (correct — error groups always have a service
   name). The asymmetry is intentional and schema-valid.

2. **Doctor pointer scope.** `withOperationSchemaHint` returns the check unchanged when
   `status === 'pass'`, and adds the hint otherwise. Family-summary checks also get the hint only
   when non-passing. This matches plan D2 (attach only to warn/fail findings) and avoids
   pass-only noise.

3. **Migration causal chain.** The S-18 fixture establishes the documented path:
   - prior-release `.mcp.json` with `jsr:@netscript/cli@0.0.4` exact pin (14 tools, no triad)
   - `initAgent` rewrites the netscript server args to `jsr:@netscript/cli@0.0.5`
   - unrelated servers (`other`) and top-level keys (`project`) are preserved
   - a real CLI subprocess models the host restart and lists 21 tools including the OpenAPI triad

4. **Lock hygiene.** `deno.lock` has zero diff on the branch. The pre-existing user-owned queue
   entry is excluded from commits as planned.

5. **New ignores/casts.** Zero new `@ts-ignore`, `ts-expect-error`, `as any`, `as unknown as`, or
   `eslint-disable` directives in the diff.

6. **Zero-install wording.** No existing-project zero-install claim is made. The canonical rev-2
   design limit (zero-install for new scaffolds only) is honored.

7. **PR #1232 close-gate.** PR body contains `Closes #1135`. Issue #1135 acceptance boxes are
   currently unticked — expected, as the supervisor updates evidence after this evaluate.md lands.
   Required labels present: `type:feat`, `priority:p2`, `area:sdk`, `epic:openapi-mcp`,
   `status:impl`. Milestone: `0.0.5`.

## Lessons for Promotion

| Lesson    | Pattern                                                            | Applies to     | Confidence |
| --------- | ------------------------------------------------------------------ | -------------- | ---------- |
| —         | —                                                                  | —              | —          |

## Verdict

| Field     | Value                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Verdict   | `PASS`                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Rationale | All applicable acceptance gates are satisfied with byte-level evidence. The three activation surfaces (initialize instructions, scaffolded AGENTS.md, failure-path pointers) each carry an independent test fixture asserting the expected bytes. The S-18 migration fixture proves the documented causal path: prior-release exact pin persists until agent init rewrites it, and a restarted current host exposes all 21 tools including the OpenAPI triad. All Archetype-2 static, fitness, runtime, and consumer gates pass with evidence. No new ignores, casts, lock churn, doctrine violations, or speculative seams. The composed milestone PLAN-EVAL waiver is valid per owner directive. |
