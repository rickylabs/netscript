# Evaluation: `@netscript/mcp` S5 doctor aggregation

IMPL-EVAL, separate opposite-family session. Generator was a Codex GPT-5 implementation session;
this evaluator is a local Claude (Opus 4.8) session — opposite family per `evaluator/protocol.md`.

## Metadata

| Field          | Value                                                         |
| -------------- | ------------------------------------------------------------- |
| Run ID         | `mcp-skills--orchestrator/s5`                                 |
| Target         | `packages/mcp` (commit `efa6cbe5` vs baseline `dd89ced9`)     |
| Archetype      | `6 — CLI / Tooling` (horizontal shape under `MCP-A6-V2-SHAPE`) |
| Scope overlays | `none`                                                        |
| Evaluator      | Opus 4.8 local IMPL-EVAL, 2026-07-12, cycle 1                 |

## Process Verification

| Check                                  | Result | Evidence |
| -------------------------------------- | ------ | -------- |
| Plan-Gate passed before implementation | PASS   | `plan-eval.md` = `PASS`, opposite-family (Opus 4.8) cycle 1; all eight plan-gate items checked. |
| Design section exists in worklog       | PASS   | `worklog.md` §Design (Public Surface, Domain Vocabulary, Ports/Adapters, Constants, Commit Slices, Deferred Scope, Contributor Path). |
| Commit slices match design plan        | PASS   | Design named 3 slices (contract/aggregation → families+composition → merge evidence); squashed into single commit `efa6cbe5` by explicit brief ("no leaf PR … local commit plus run artifacts are the commit trail"). `worklog.md` Progress Log documents all three slices. No PR ⇒ no per-slice PR comments expected. |
| Each slice has a passing gate          | PASS   | `worklog.md` Gate Results table; independently re-verified below. |
| No speculative seams (unused files)    | PASS   | Every new file is reachable: `doctor-check-family.ts` (imported by flow + families + mod), `telemetry-doctor-family.ts` (flow), `project-doctor-port.ts` (plugin family + mod), `aspire/project/plugin-doctor-family.ts` (cli.ts composition + tests). `ProjectDoctorPort` maps the real S7 injection seam, not a speculative one (AP-2 clear). |
| Constants used for finite vocabularies | PASS   | `DoctorFamilyName` union (`telemetry\|aspire\|project\|plugins`); family names are `as const` literals; severity rank centralized in `doctorStatusRank`. |

## Static Gates

| Gate            | Command | Result | Evidence |
| --------------- | ------- | ------ | -------- |
| Typecheck       | `run-deno-check.ts --root packages/mcp --ext ts` | PASS | 44 files, 0 occurrences, exit 0. |
| Format          | `deno fmt --check` src+tests ts | PASS | 41 source/test files, 0 findings. (Wrapper's `--ext ts` batch flags 3 pre-existing markdown fixtures `tests/fixtures/docs/*.md` from #726 — untouched by S5, not a TS finding.) |
| Lint            | `deno lint` src+tests | PASS | 41 files, 0 findings. |
| Doc lint        | `deno doc --lint mod.ts cli.ts` | PASS | 2 entrypoints, 0 errors, exit 0. |
| Publish dry-run | `deno publish --dry-run` (strict, no `--allow-slow-types`) | PASS | "Checking for slow types…" → Success, exit 0; new files present in 33-file list. |

## Fitness Gates

| Gate | Function | Result | Evidence |
| ---- | -------- | ------ | -------- |
| F-1  | File-size lint | PASS | Largest new file `project-wiring-doctor-family.ts` = 99 LOC (≤ 350 adapter cap). |
| F-2  | Helper-reinvention scan | PASS | Wraps upstream `inspectAspire`; no telemetry-resolver duplication (shared `resolveTelemetryEndpoint` reused). |
| F-3  | Layering check | PASS | `arch:check` no mcp findings; domain (`doctor-check-family`, `project-doctor-port`) pure; application (`doctor-flow`, `telemetry-doctor-family`) imports domain only; infrastructure owns all `Deno.*`. |
| F-4  | Inheritance audit | PASS | No new abstracts; families are interface implementations, not base-class orchestration. |
| F-5  | Public surface audit | PASS | mod.ts adds typed exports with return types; doc-lint clean. |
| F-6  | JSR publishability | PASS | Strict dry-run success, no slow types. |
| F-7  | Doc-score gate | PASS | doc-lint 0 missing-docs; every new exported decl has a JSDoc one-liner. |
| F-8  | Workspace lib override | N/A | No lib override touched. |
| F-9  | Permission declaration | PASS | README Permissions block updated to name read access for `deno.json`, `netscript.config.ts`, generated registries, docs, Aspire markers. |
| F-10 | Test-shape audit | PASS | Fixture/fake ports; semantic assertions (name+status tuples, counts, family status order), not string snapshots (AP-18 clear). |
| F-11 | Forbidden-folder lint | PASS | New files under existing `domain/`, `application/flows/`, `infrastructure/` role folders. |
| F-12 | Naming-convention lint | PASS | `*-doctor-family.ts`, `*-port.ts` consistent with package vocabulary. |
| F-13 | Saga/runtime invariants | N/A | No saga/durable runtime. |
| F-14 | Console-log lint | PASS | No `console.*` in new code. |
| F-15 | Re-export-of-upstream lint | PASS | `InspectionReport` type imported for use, not re-exported from mod. |
| F-16 | Folder-cardinality lint | PASS | No folder exceeds 12 children. |
| F-17 | Abstract-derived co-location | PASS | No multi-concrete abstract introduced. |
| F-18 | Sub-barrel lint | PASS | No new sub-directory `mod.ts`/`index.ts`. |
| F-19 | Scoped source gate runners | PASS | Scoped wrappers used as evidence above. |

F-CLI-1…31 remain `PENDING_SCRIPT` under accepted `MCP-A6-V2-SHAPE` (horizontal shape); applicable
layering, side-effect isolation, permission, and test-shape rules verified manually above. Command
tree / template / renderer / composition-declarativity rules are N/A (no Cliffy command surface).

## Runtime Gates

| Gate | Validation | Result | Evidence |
| ---- | ---------- | ------ | -------- |
| MCP tests | `deno test packages/mcp/tests/` | PASS | 26 passed, 0 failed — incl. explicit-endpoint fail, no-running-app warn (counts `{pass:0,warn:1,fail:0}`, families len 1), family-exception isolation (`{pass:1,warn:1,fail:1}`, family status order `pass/warn/fail`), per-family fixture tests, stdio round trip. |
| Aspire family | fixture-injected `inspect`/`exists` | PASS | `inspectAspire(string)→InspectionReport` signature verified via `deno doc`; fixture matches real `{package,target,summary,details}` shape; no live app required (per matrix, runtime optional for Arch 6). |

## Consumer Gates

| Consumer | Validation | Result | Evidence |
| -------- | ---------- | ------ | -------- |
| `mod.ts` import + server | construct + `tools/list` | PASS | `tools=13`, exit 0. Output contract change (`families` now required in `DoctorResult` + output schema) is internally consistent — `doctor` is the sole producer and always emits it; runner output validation test passes. |

## Anti-Pattern Check

| AP    | Status | Evidence |
| ----- | ------ | -------- |
| AP-1  | CLEAR  | No monolith; largest new file 99 LOC. |
| AP-2  | CLEAR  | `ProjectDoctorPort`/`DoctorCheckFamily` map real S7 injection + per-family test seams; PLAN-EVAL and design self-flagged this. |
| AP-6  | CLEAR  | Families are stub-free implementations; no base-class lifecycle orchestration. |
| AP-8  | CLEAR  | No container/god-object growth; `createDoctorFlow` aggregates via injected list. |
| AP-11 | CLEAR  | `Deno.stat`/`readTextFile`/`cwd` only in `infrastructure/**` and `cli.ts` composition edge; application/domain pure. |
| AP-18 | CLEAR  | Semantic per-check assertions, not generated-string snapshots. |
| AP-19 | CLEAR  | README permissions updated for new filesystem reads. |
| AP-22 | CLEAR  | No re-export barrels added. |
| AP-23 | CLEAR  | `cli.ts` composition wires families additively; no inline command bodies. |
| AP-24 | CLEAR  | Severity handled by rank function over a status union, not switch-over-tag proliferation. |
| AP-25 | CLEAR  | All side effects at infrastructure/composition edges. |
| others | N/A   | Outside S5 scope. |

Wrap-don't-reimplement / dependency-inversion: MCP never imports or duplicates the CLI plugin
doctor; it owns `ProjectDoctorPort` and ships an explicit informational-`warn` `UnwiredProjectDoctor`
stub, with S7 injecting the real CLI-side adapter (drift.md + README record the decision). Aspire is
a clean leaf workspace dependency (`@netscript/aspire@0.0.1-beta.8` added to `deno.json` imports;
lock updated by 1 line, no reload).

## Arch-Debt Delta

| Metric | Count | Evidence |
| ------ | ----- | -------- |
| New entries | 0 | No new violation introduced. |
| Resolved entries | 0 | — |
| Deepened violations | 0 | `MCP-A6-V2-SHAPE` preserved, not broadened (no kernel/vertical seams invented). |
| Unrecorded violations | 0 | `arch:check` shows no `packages/mcp` FAIL/WARN; the 47 repo-wide FAILs are pre-existing cli/plugins debt tracked by "repo doctrine task — full historical scan remains red". |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| low | `families` is a **required** output field (not optional-additive as D2's "additive" wording implies). Stricter than a pure additive change, but internally consistent: `doctor` is the sole producer, always emits it, and the pre-release beta line has no external consumer of the prior shape. | `tool-contracts.ts` required-key list now includes `families`; 26 tests + runner output validation green. | None (informational). |
| low | Three planned commit slices squashed into one commit. Acceptable under the explicit no-PR brief; commit trail is the single commit + worklog Progress/Gate tables. | brief "Do NOT open a PR"; `worklog.md`. | None. |

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Port + injected stub over cross-package import to break a future cycle | Define an owned port with a visible-`warn` stub; the outer composition injects the real adapter later | Archetype 6 / integration ports | medium |

## Verdict

| Field | Value |
| ----- | ----- |
| Verdict | `PASS` |
| Rationale | Approved scope is complete (four aggregated families, deterministic severity math, explicit-endpoint fail vs no-running-app warn, family-exception isolation, S7-ready plugin injection seam). All required static, doc-lint, publish, test, and consumer gates pass on independent re-run; fitness gates pass or are N/A under the accepted `MCP-A6-V2-SHAPE` horizontal shape. No doctrine violation introduced or deepened; no new debt required; `MCP-A6-V2-SHAPE` correctly preserved. Plan-Gate passed opposite-family before implementation, the design checkpoint exists and was followed, and the two findings are low-severity informational notes requiring no action. |
