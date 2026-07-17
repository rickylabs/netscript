# Evaluation: `@netscript/mcp` S6 CLI trigger tools

Result values: `PASS`, `FAIL`, `N/A`, `PENDING_SCRIPT`, `DEBT_ACCEPTED`, `NOT_RUN`.

## Metadata

| Field          | Value                                                            |
| -------------- | --------------------------------------------------------------- |
| Run ID         | `mcp-skills--orchestrator/s6`                                    |
| Target         | `packages/mcp` (#730, epic #721, umbrella PR #715)              |
| Archetype      | `6 — CLI / Tooling` (horizontal shape under accepted `MCP-A6-V2-SHAPE`) |
| Scope overlays | `none`                                                          |
| Evaluator      | Separate opposite-family IMPL-EVAL session (Claude), 2026-07-12  |
| Commits        | `4a191070`, `3629613c`, `67c60e8b`; HEAD `67c60e8b`, tree clean |

## Process Verification

| Check                                  | Result | Evidence |
| -------------------------------------- | ------ | -------- |
| Plan-Gate passed before implementation | PASS   | `plan-eval.md` verdict `PASS` (cycle 1, all 8 checklist items); dated before first slice commit. |
| Design section exists in worklog       | PASS   | `worklog.md` §Design (Public Surface / Domain Vocabulary / Ports and Adapters / Constants / Commit Slices). |
| Commit slices match design plan        | PASS   | 3 commits = 3 planned slices, ordered domain→adapters→composition: `4a191070` (S1 ports/policy/flows), `3629613c` (S2 static/spawn adapters), `67c60e8b` (S3 composition). Each references `#730` with no closing keyword (correct for sub-work under umbrella #715). |
| Each slice has a passing gate          | PASS   | S1 policy/flow tests + scoped check; S2 adapter tests + all MCP tests; S3 full gate set. Re-verified independently below. |
| No speculative seams (unused files)    | PASS   | Both ports are consumed: `CommandCatalogPort`→`StaticCommandCatalog`/`createListCommandsFlow`; `CommandExecutorPort`→`SpawnCommandExecutor`/`createExecuteCommandFlow`; both wired in `cli.ts:75-79` and exercised by tests. No dead exports. |
| Constants used for finite vocabularies | PASS   | `DEFAULT_COMMAND_POLICY` rules are named constants; `MAX_COMMAND_DESCRIPTOR_LENGTH`, `DEFAULT_CLI_COMMAND`, `DEFAULT_COMMAND_TIMEOUT_MS`, `DEFAULT_OUTPUT_TAIL_BYTES` all named; no policy `switch` / closed registry (AP-24 clear). |

## Static Gates

| Gate            | Command                                                                  | Result | Evidence |
| --------------- | ------------------------------------------------------------------------ | ------ | -------- |
| Narrow typecheck | `run-deno-check.ts --root packages/mcp --ext ts`                        | PASS   | 57 files, 1 batch, 0 findings, exit 0. |
| Format          | `run-deno-fmt.ts --root packages/mcp --ext ts --exclude .../fixtures`    | PASS   | 54 files, 0 findings, 0 failed batches. |
| Lint            | `run-deno-lint.ts --root packages/mcp --ext ts --exclude .../fixtures`   | PASS   | 54 files, 0 occurrences, exit 0. |
| Doc lint        | `deno doc --lint mod.ts cli.ts`                                           | PASS   | "Checked 2 files", exit 0 — full public-export coverage on both entrypoints. |
| Publish dry-run | `deno publish --dry-run --allow-dirty`                                   | PASS   | `Success — Dry run complete`; slow-type check passed with NO `--allow-slow-types`. |
| Lock/dep churn  | `git diff 0b8ed075..HEAD -- deno.lock packages/mcp/deno.json`            | PASS   | Empty diff. `packages/mcp/deno.json` imports contain no `@netscript/cli`; the only `jsr:@netscript/cli` occurrence is a subprocess-arg string in `spawn-command-executor.ts`, not an import. Whole diff confined to `packages/mcp/**` + run dir. |

Fixture exclusion for lint/fmt is intentional and correct: `tests/fixtures/` holds deliberately invalid `.ts` (per `worklog.md` Slice 3 reconcile). Check ran over 57 files including tests without those fixtures parse-failing the wrapper.

## Fitness Gates

| Gate | Function                     | Result        | Evidence |
| ---- | ---------------------------- | ------------- | -------- |
| F-1  | File-size lint               | PASS          | Largest new file `spawn-command-executor.ts` = 108 LOC; all new files well under caps. |
| F-2  | Helper-reinvention scan      | PASS          | Wraps `Deno.Command`, Web streams, `TextDecoder`/`TextEncoder`, `performance.now`; no reinvented std helpers. |
| F-3  | Layering check               | PASS          | Domain (ports/policy) pure; application flows import domain only; `Deno.Command` confined to `src/infrastructure/spawn-command-executor.ts`; composition in `cli.ts`. `arch:check` doctrine FAIL=0. |
| F-4  | Inheritance audit            | PASS          | No new inheritance; adapters implement interfaces; `TailCollector` is a plain leaf class. |
| F-5  | Public surface audit         | PASS          | New exports in `mod.ts` are annotated + JSDoc'd; doc lint clean. |
| F-6  | JSR publishability gate      | PASS          | Publish dry-run Success, no slow types. |
| F-7  | Doc-score gate               | PASS (INFO)   | Direct doctrine `INFO A9: docs/architecture.md missing (public symbols > 25)` only — informational, covered by accepted `MCP-A6-V2-SHAPE` (docs surface deferred to S7). |
| F-8  | Workspace `lib` override      | N/A          | No lib override touched. |
| F-9  | Permission declaration check | PASS          | `deno.json` `test` task declares `--allow-run`; runtime subprocess permission for the default executor documented in `worklog.md` §Design. See Findings (low) for the standalone-server README note. |
| F-10 | Test-shape audit             | PASS          | Semantic assertions (exit codes, truncation bounds, deny-wins/default-deny, real subprocess), not string snapshots (AP-18 clear). |
| F-11 | Forbidden-folder lint        | PASS          | New files land in `domain/`, `application/flows/`, `infrastructure/`; no forbidden folders. |
| F-12 | Naming-convention lint       | PASS          | Role-named files (`command-policy.ts`, `spawn-command-executor.ts`, `static-command-catalog.ts`); lint clean. |
| F-13 | Saga/runtime invariants      | N/A           | Archetype 6, not a runtime package. |
| F-14 | Console-log lint             | N/A (clean)   | A6 = n/a; verified no `console.*` in new source anyway. |
| F-15 | Re-export-of-upstream lint   | PASS          | No upstream types re-exported; ports are locally defined. |
| F-16 | Folder-cardinality lint      | PASS          | Additions stay within existing horizontal folders; cardinality unchanged materially. |
| F-17 | Abstract-derived co-location | PASS          | No layer-2 abstract added. |
| F-18 | Sub-barrel lint              | PASS          | No new barrels; single `mod.ts` aggregation. |
| F-19 | Scoped source gate runners   | PASS          | Scoped wrappers used for check/lint/fmt evidence. |

F-CLI-1…31 (v2 kernel/vertical shape): `DEBT_ACCEPTED` under `MCP-A6-V2-SHAPE` — the package intentionally remains on the owner-locked horizontal `src/{domain,application,presentation,infrastructure}` shape; the debt gate names S7 (not S6) as the v2 migration point. No F-CLI false-done state present (no inline `.command()/.option()/.action()`, no `Deno.exit`, no console in command files, no monolith relocation).

## Runtime Gates

| Gate                        | Validation | Result | Evidence |
| --------------------------- | ---------- | ------ | -------- |
| All MCP tests (`--allow-run`) | `deno test --no-lock --allow-env --allow-net --allow-run --allow-read packages/mcp/tests/` | PASS | 39 passed, 0 failed. Covers real subprocess capture (`db|status|fixture`), deadline kill (exit 124 + `timed_out`), byte-tail truncation, deny-before-execute, catalog filter/limit. |
| Subprocess timeout safety   | deadline test | PASS | `SpawnCommandExecutor` races `child.status` vs `setTimeout`, `SIGTERM`-kills on deadline, awaits terminal status, clears timer, drains readers; returns stable `exitCode:124, timedOut:true`. `Deno.errors.NotFound` on kill is swallowed correctly. |
| Output-tail bound safety    | truncation test | PASS | `TailCollector` retains only last N bytes; `truncated` from `#seen > maximum`; decode via `TextDecoder` (replacement-safe). 5000→64-byte case asserts `outputTail.length <= 64` and `truncated`. |

## Consumer Gates

| Consumer                    | Validation | Result | Evidence |
| --------------------------- | ---------- | ------ | -------- |
| Public import + registry    | `import { createToolRegistry, DEFAULT_COMMAND_POLICY, decideCommand } from mod.ts` | PASS | `tools=13`, `list_commands` + `execute_command` present; `allow=17 deny=5`. |
| Policy decisions            | `decideCommand` smoke | PASS | `db reset`→`deny_db_reset`; `db migrate`→`allow_db_migrate`; `plugin remove`→`deny_plugin_remove`; `agent`→`default_deny` (S7 command group correctly NOT allowed). |
| Composition (`cli.ts`)      | `McpCliOptions` injection | PASS | `commandCatalog`/`commandExecutor`/`commandPolicy` injectable; defaults `StaticCommandCatalog`/`SpawnCommandExecutor`/`DEFAULT_COMMAND_POLICY`; additive to existing flows. |

## Anti-Pattern Check

| AP    | Status  | Notes |
| ----- | ------- | ----- |
| AP-1  | CLEAR   | Files small; no monolith. |
| AP-2  | CLEAR   | Both ports map real S7/test seams (not speculative); each consumed this slice. |
| AP-3  | CLEAR   | Contracts narrow (descriptor 3 fields; result 5 fields); no oversized backend contract. |
| AP-8  | CLEAR   | No DI container; explicit inline composition in `cli.ts`. |
| AP-11 | CLEAR   | Effects (`Deno.Command`) only in infrastructure; domain/application pure. |
| AP-13 | CLEAR   | No `console.warn` runtime reporting added. |
| AP-18 | CLEAR   | Semantic test assertions, not output snapshots. |
| AP-19 | CLEAR   | `--allow-run` declared on the test task and named in design/risk register. |
| AP-22 | CLEAR   | No new barrels. |
| AP-23 | CLEAR   | Declarative additive composition; no hidden wiring. |
| AP-24 | CLEAR   | Policy is immutable data + pure `decideCommand`; no switch/closed registry; overrideable via options. |
| AP-25 | CLEAR   | No effects leaked outside infrastructure edge. |
| others | N/A    | Outside slice scope. |

## Arch-Debt Delta

| Metric                | Count | Evidence |
| --------------------- | ----- | -------- |
| New entries           | 0     | None required; work stays within accepted `MCP-A6-V2-SHAPE`. |
| Resolved entries      | 0     | S6 does not close `MCP-A6-V2-SHAPE` (S7 owns v2 migration). |
| Deepened violations   | 0     | Horizontal shape preserved; no F-CLI v2 seam invented (would deepen). |
| Unrecorded violations | 0     | Direct doctrine FAIL=0 WARN=0; S7 boundary recorded in `drift.md`. |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| low (non-blocking) | README §Permissions lists env/net/read + run-for-tests, but does not yet state the standalone server needs `--allow-run` at runtime when the default `SpawnCommandExecutor` handles `execute_command`. | `packages/mcp/README.md:47-52` | None for S6 — docs are explicitly out of S6 scope, permission is declared on the test task (F-9), and the runtime need is recorded in `worklog.md` §Design. Fold the standalone-runtime permission note into S7's real CLI-composition docs. |
| low (advisory) | On timeout, the `timed_out` marker is appended after the tail bound, so `truncated` can flip true near a full buffer purely from the marker. | `spawn-command-executor.ts:96-98` | None — cosmetic on the truncated flag in an already-timed-out result; behavior and `timedOut` are correct. |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | `PASS` |
| Rationale | Approved #730 scope is complete: MCP-owned `CommandCatalogPort`/`CommandExecutorPort`, immutable deny-wins/default-deny `CommandPolicy` (deny precedence + default deny verified), bounded `list_commands` filter/limit and policy-gated `execute_command` with structured `command_denied`, injectable `SpawnCommandExecutor` (timeout-kill, combined byte-tail truncation) and `StaticCommandCatalog` unwired stub, additive `cli.ts` composition, and accurate tool descriptions/schemas. Design traces to the plan's locked decisions D1–D10. S7 dependency inversion is intact — no `@netscript/cli` import, `agent` group falls to `default_deny`, live registry/default wiring deferred and recorded in `drift.md`. All required gates independently green: scoped check (57/0), lint (54/0), fmt (54/0), 39 MCP tests, doc lint (2 files/0), publish dry-run Success with no slow types, direct doctrine FAIL=0 WARN=0 (INFO A9 debt-covered), consumer smoke. No lock/dependency churn; diff confined to `packages/mcp/**` + run dir. Work stays within accepted `MCP-A6-V2-SHAPE` with no new/deepened debt. Two low-severity findings are non-blocking (docs out of S6 scope; cosmetic truncated-flag edge). Close-gate and release-gate rules are N/A (not a cut; no PR opened). |
