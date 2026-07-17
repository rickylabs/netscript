# Final Gate Evidence — #811 canary publish channel

Date: 2026-07-17

| Gate                      | Result | Evidence                                                                |
| ------------------------- | ------ | ----------------------------------------------------------------------- |
| Release tests             | PASS   | post-merge repair suite: 61 passed, 0 failed                            |
| Agentic token/lib tests   | PASS   | `agentic-lib_test.ts`: 63 passed, 0 failed                              |
| Combined focused suite    | PASS   | 122 passed, 0 failed                                                    |
| Touched TypeScript check  | PASS   | scoped wrapper, `--unstable-kv`, 25 files, 0 findings                   |
| Touched TypeScript lint   | PASS   | scoped wrapper, 25 files, 0 findings                                    |
| Touched TypeScript format | PASS   | scoped wrapper, 25 files, 0 findings                                    |
| Workflow YAML             | PASS   | `@std/yaml` parsed canary, stable publish, and production-E2E workflows |
| Workflow contracts        | PASS   | included in the 61-test release suite                                   |
| Skill mirror              | PASS   | `agentic:sync-claude:check`: 17 skills, 21 mirrored files               |
| Changed-file quality      | PASS   | 25 TypeScript files, 0 findings, 0 allowances                           |
| Seeded negative checks    | PASS   | every composed readiness row has a witnessed failing fixture/test       |
| Live import-attribute seed | PASS  | readiness exited 1 with #35546 + authenticated-canary sunset            |
| Live versionless seed     | PASS   | readiness exited 1 with version-required finding                        |
| Live README-standard seed | PASS   | readiness exited 1 with production README rule findings                 |
| Seed-free readiness       | PASS   | all eight composed rows PASS, exit 0                                    |
| Supervisor IMPL-EVAL      | FAIL_FIX repaired | F1/F2 repaired; fresh supervisor verdict pending             |

The first quality scan identified two pre-existing `any` suppressions because this slice touched
`agentic-lib.ts`. They were removed by narrowing rollout JSON as `unknown` and changing the GitHub
transport response body from `any` to `unknown`; all seven internal consumers now narrow fields at
the boundary. The repeated changed-file scan passed with `--max-allow 0`, so this slice adds no
suppressions or allowances.

Live canary publication is intentionally not part of PR validation. It remains an OWNER action after
merge because it mutates JSR and repository refs and may require scope permissions.

The earlier Qwen evaluator artifact is retained as historical evidence but does not authorize this
repair cycle. The supervisor-triggered Fable verdict is authoritative; this branch does not
self-certify and remains draft pending its fresh re-evaluation.
