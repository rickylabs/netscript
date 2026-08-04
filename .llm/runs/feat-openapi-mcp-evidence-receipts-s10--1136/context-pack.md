# Context pack — feat-openapi-mcp-evidence-receipts-s10--1136

## Objective

Resolve #1136 by proving F4a through the public MCP surface: post-S8 introspection receipts authorize
the existing #1078 gate, while a result rejected after flow execution cannot leave green evidence.

## State

- Branch matches fetched `origin/main` baseline `3677973b` before owned commits.
- Pre-existing unrelated `deno.lock` diff: one added line; preserve and never stage.
- S8 hard dependency: PASS, 14 focused tests green.
- Plan: locked; PLAN-EVAL row composed per milestone-run waiver.
- S0: committed as `1282ee551`; draft PR #1233 open with required taxonomy and milestone.
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

1. Recheck the reviewer-requested hand-authored site-reference update.
2. Commit S1 with updated run evidence, excluding the pre-existing `deno.lock` diff.
3. Push by explicit refspec and update PR #1233 phase/acceptance evidence.
4. Complete composed milestone evaluation, review-thread/check gates, and mark ready when green.
