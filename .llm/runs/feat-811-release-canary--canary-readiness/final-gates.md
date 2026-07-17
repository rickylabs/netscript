# Final Gate Evidence — #811 canary publish channel

Date: 2026-07-17

| Gate                      | Result | Evidence                                                                |
| ------------------------- | ------ | ----------------------------------------------------------------------- |
| Release tests             | PASS   | `deno test --allow-all .llm/tools/release/`: 59 passed, 0 failed        |
| Agentic token/lib tests   | PASS   | `agentic-lib_test.ts`: 63 passed, 0 failed                              |
| Combined focused suite    | PASS   | 122 passed, 0 failed                                                    |
| Touched TypeScript check  | PASS   | scoped wrapper, `--unstable-kv`, 25 files, 0 findings                   |
| Touched TypeScript lint   | PASS   | scoped wrapper, 25 files, 0 findings                                    |
| Touched TypeScript format | PASS   | scoped wrapper, 25 files, 0 findings                                    |
| Workflow YAML             | PASS   | `@std/yaml` parsed canary, stable publish, and production-E2E workflows |
| Workflow contracts        | PASS   | included in the 59-test release suite                                   |
| Skill mirror              | PASS   | `agentic:sync-claude:check`: 17 skills, 21 mirrored files               |
| Changed-file quality      | PASS   | 25 TypeScript files, 0 findings, 0 allowances                           |
| Seeded negative checks    | PASS   | every composed readiness row has a witnessed failing fixture/test       |
| Separate IMPL-EVAL        | PASS   | Qwen session `a06700df-b15b-43e4-a35b-e9d0a97c2f06`; no blockers       |

The first quality scan identified two pre-existing `any` suppressions because this slice touched
`agentic-lib.ts`. They were removed by narrowing rollout JSON as `unknown` and changing the GitHub
transport response body from `any` to `unknown`; all seven internal consumers now narrow fields at
the boundary. The repeated changed-file scan passed with `--max-allow 0`, so this slice adds no
suppressions or allowances.

Live canary publication is intentionally not part of PR validation. It remains an OWNER action after
merge because it mutates JSR and repository refs and may require scope permissions.
