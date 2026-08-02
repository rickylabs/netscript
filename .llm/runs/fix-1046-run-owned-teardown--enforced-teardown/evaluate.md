# Evaluation: #1046 run-owned teardown

## Metadata

| Field          | Value                                                                          |
| -------------- | ------------------------------------------------------------------------------ |
| Run ID         | `fix-1046-run-owned-teardown--enforced-teardown`                               |
| Target         | run-owned Aspire/Docker teardown enforcement                                   |
| Archetype      | 6 — CLI / tooling                                                              |
| Scope overlays | docs                                                                           |
| Evaluator      | supervisor in-session, 2026-08-02, under the owner's explicit evaluator waiver |

The owner waiver forbade the normal external evaluator transports and assigned IMPL-EVAL to the
supervisor in-session. No OpenRouter, Qwen, OpenHands, `claude-print`, or provider canary ran.

## Process Verification

| Check                                  | Result | Evidence                                                                                                                 |
| -------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------ |
| Plan-Gate passed before implementation | PASS   | `plan-eval.md` = PASS; first implementation commit follows it                                                            |
| Design section exists                  | PASS   | `worklog.md` § Design                                                                                                    |
| Commit slices match plan               | PASS   | slices 1–11 plus two supervisor A1 review commits in PR #1047                                                            |
| Each slice has a gate                  | PASS   | `worklog.md` gate table and per-slice PR comments                                                                        |
| No speculative seams                   | PASS   | every teardown module is imported by a CLI entry point or focused test                                                   |
| Positive ownership only                | PASS   | ownership, PID-reuse, prefix, malformed-label, foreign-host, and MCP tests                                               |
| Close-gate honesty                     | PASS   | consumer-assets criterion is not evidenced; PR must remove `Closes #1046`, remain draft, and leave acceptance box 5 open |

## Static Gates

| Gate                     | Result | Evidence                                           |
| ------------------------ | ------ | -------------------------------------------------- |
| Scoped typecheck wrapper | PASS   | 17 files selected, 0 findings                      |
| Scoped lint wrapper      | PASS   | 17 files selected, 0 findings                      |
| Scoped format wrapper    | PASS   | 17 files selected, 0 findings                      |
| Focused tests            | PASS   | 25 passed, 0 failed                                |
| Claude mirror check      | PASS   | 17 skills / 21 mirrored files current              |
| Doc lint                 | N/A    | no package export; wrapper requires a package root |
| Publish / JSR audit      | N/A    | no package/plugin public surface                   |

## Runtime and Consumer Gates

| Gate                                          | Result           | Evidence                                                                                                        |
| --------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------- |
| Read-only live leak check                     | PASS             | final `leak-report.md`: zero owned survivors; foreign `fix-1025` and one unproven container reported, untouched |
| Scoped teardown behavior                      | PASS             | dry-run/no-command, per-AppHost stop, re-inspect-per-container, changed-label abandonment tests                 |
| Terminal contract                             | PASS             | owned survivor → BLOCKED; foreign/unproven survivor → DONE                                                      |
| E2E cleanup default                           | PASS             | two focused tests; default true and explicit opt-out retains registry destination                               |
| Consumer bundle install                       | PASS             | `agentic:dogfood-skills` installed the base bundle under `.agents/generated/consumer-skills/`                   |
| `aspire` / `deno` / `help.md` consumer assets | N/A on this base | assets belong to unmerged PR #1034; limitation recorded in drift and PR, not claimed                            |

## Fitness / Doctrine / Debt

`quality:scan`, `arch:check`, JSR fitness, and package Archetype-6 structural gates are N/A because
the diff changes no `packages/**` or `plugins/**` source. The tooling design uses explicit domain
types, command/filesystem ports, per-resource verbs, and no new architecture debt. AP-1–AP-25 are
N/A outside package/plugin source; the shared-host destructive-command anti-pattern is independently
guarded by a repo-wide test.

| Metric                | Count |
| --------------------- | ----- |
| New debt entries      | 0     |
| Resolved debt entries | 0     |
| Deepened violations   | 0     |
| Unrecorded violations | 0     |

## Findings

No implementation-blocking findings remain. Supervisor A1 review found and fixed one reporting gap:
foreign/unproven Docker age now derives from probed creation time without changing ownership or
actionability. A second A1 review completed symptom indexing in both tool guides.

The consumer-assets gap is an explicit upstream dependency, not hidden evidence: this PR proves the
installer/dogfood route, but cannot claim issue acceptance criterion 5 until PR #1034 is merged and
the bundle is regenerated. Therefore this PR is a passing partial implementation and must not carry
a closing keyword or move to ready-merge for issue #1046.

## Verdict

| Field     | Value                                                                                                                                                                                                                 |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Verdict   | `PASS`                                                                                                                                                                                                                |
| Rationale | Approved slices and applicable gates pass; ownership fails closed and enforcement is load-bearing. The PR remains partial/draft because the explicitly unavailable #1034 consumer assets prevent closing issue #1046. |
