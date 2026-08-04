# Context pack — feat-openapi-mcp-evidence-receipts-s10--1136

## Objective

Resolve #1136 by proving F4a through the public MCP surface: post-S8 introspection receipts authorize
the existing #1078 gate, while a result rejected after flow execution cannot leave green evidence.

## State

- Branch matches fetched `origin/main` baseline `3677973b` before owned commits.
- Pre-existing unrelated `deno.lock` diff: one added line; preserve and never stage.
- S8 hard dependency: PASS, 14 focused tests green.
- Plan: locked; PLAN-EVAL row composed per milestone-run waiver.
- S0: committed as `1282ee551`; PR #1233 is non-draft with required taxonomy and milestone.
- Implementation: complete and locally green; opposite-family S1 review PASS.
- Tests: focused 11/0; package 109/0; configured scoped check/lint/fmt all 0 findings.
- Quality/JSR: focused MCP scan 0 findings/0 allowances; doc-lint and raw publish dry-run pass.
- Doctrine reporter baseline note: local fixture function `describe` is misread as a Jest global;
  changed files introduce no doctrine violation.

## Locked decisions

| Decision | Authority | Consequence |
| --- | --- | --- |
| F4a only | issue #1136 + RFC #1123 F4 | No evidence-kind/operation keys or endpoint-shape-specific predicate |
| Public-path proof | plan D2–D4 | Use `createMcpCliServer`, public ports, JSON-RPC; no internal flow mocking |
| Shared receipt remains generic | plan D1 | Introspection joins doctor/telemetry without schema migration |
| Refusal names introspection | plan D5 | Recovery guidance matches accepted evidence classes |
| Public surface stable | plan D7 | No export, dependency, version, or publish-list changes |

## Resume next

1. Push this final ready-merge evidence record by explicit refspec.
2. Confirm the live acceptance mirror checks issue #1136's mapped box.
3. Require all final-head checks and the unanswered-thread gate to pass before handoff.
