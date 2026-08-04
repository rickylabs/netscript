# Context pack — feat-openapi-mcp-evidence-receipts-s10--1136

## Objective

Resolve #1136 by proving F4a through the public MCP surface: post-S8 introspection receipts authorize
the existing #1078 gate, while a result rejected after flow execution cannot leave green evidence.

## State

- Branch matches fetched `origin/main` baseline `3677973b` before owned commits.
- Pre-existing unrelated `deno.lock` diff: one added line; preserve and never stage.
- S8 hard dependency: PASS, 14 focused tests green.
- Plan: locked; PLAN-EVAL row composed per milestone-run waiver.
- Implementation: pending S1.

## Locked decisions

| Decision | Authority | Consequence |
| --- | --- | --- |
| F4a only | issue #1136 + RFC #1123 F4 | No evidence-kind/operation keys or endpoint-shape-specific predicate |
| Public-path proof | plan D2–D4 | Use `createMcpCliServer`, public ports, JSON-RPC; no internal flow mocking |
| Shared receipt remains generic | plan D1 | Introspection joins doctor/telemetry without schema migration |
| Refusal names introspection | plan D5 | Recovery guidance matches accepted evidence classes |
| Public surface stable | plan D7 | No export, dependency, version, or publish-list changes |

## Resume next

1. Commit/push S0 and open the draft PR with required labels/milestone.
2. Implement S1 tests and bounded guidance change.
3. Run focused, package, scoped wrapper, quality, doctrine, doc/JSR, and publish gates.
4. Obtain composed milestone evaluation/review, reconcile issue/PR evidence, mark ready when green.

