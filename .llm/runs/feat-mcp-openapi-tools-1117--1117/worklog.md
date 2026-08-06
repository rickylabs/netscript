# Worklog — #1117

## Progress

| Date | Slice | Evidence |
| --- | --- | --- |
| 2026-08-05 | Research | live #1117/#1197 and merged S4–S10 surfaces read on canary.13 |
| 2026-08-05 | Plan | ordered three-tool funnel locked; D6 composed evaluation recorded |
| 2026-08-05 | RED | focused public scaffold test failed because generated conventions omit `list_api_services` |

## Gates

- RED command: `deno test --allow-all packages/cli/src/public/features/root/public-command-tree_test.ts`
- Result: exit 1; 2 passed / 1 failed. The failure prints the current two-tool instruction and the
  expected ordered three-tool funnel, proving the activation defect before implementation.
- The MCP stdio instruction regression also failed pre-fix (`stdio_test.ts`: 0 passed / 1 failed):
  the server-injected agent context omits `list_api_services` in the same way as the scaffolded
  convention. Both user-facing activation seams are therefore held RED before their implementation.

## Ordered activation implementation

- Both agent-facing instruction surfaces now expose the complete ordered funnel:
  `list_api_services → list_service_operations → get_operation_schema`.
- The existing scaffold runtime verifier now reads the generated app `AGENTS.md`, rejects a missing
  or reordered funnel, and then calls all three tools through the MCP JSON-RPC server. It discovers
  `users` from the first result, selects an operation from the second, and supplies both to the
  third; no endpoint, port, or operation id is hardcoded.
- Focused convention + stdio tests: 4 passed / 0 failed. Targeted E2E verifier type-check: passed.

## Gate evidence

| Gate | Result |
| --- | --- |
| MCP full package tests | PASS — 110 passed / 0 failed |
| Scoped check | PASS — MCP 103 files; CLI touched verifier/template/runtime files |
| Scoped lint | PASS with package configs — 0 findings; the no-config wrapper attempt was a did-not-run because canary.13's root glob workspace is rejected by Deno 2.9.3 lint |
| Scoped format | PASS after formatting the owned verifier; 0 findings |
| `quality:gate` | PASS — code-quality scan has 0 findings; doctrine gate has baseline warnings only |
| MCP doc-lint | PASS — 3 entrypoints, 0 combined errors |
| MCP publish dry-run | PASS |
| New-ignore diff audit | PASS — no added `deno-lint-ignore`, `as unknown as`, or `@ts-ignore` |
| Full `scaffold.runtime` | PASS — 73 passed / 0 failed with cleanup |

The decisive runtime gate `behavior.mcp-endpoint-directory` passed in 11.258s under its truthful
description, “Follow the documented MCP OpenAPI discovery path.” It read the generated app-scoped
convention and completed all three JSON-RPC tool calls against the live Aspire-assigned `users`
service. No hosted dependency, credential, fixed port, endpoint, service id, or operation id was
introduced.

`deno.lock` remains the pre-existing modified file and is unstaged.

## Composed evaluation

- Hosted canary applicability required both `e2e-cli-gate` and `ci:full`; after the post-label push,
  every substantive core and scaffold lane executed.
- Hosted check-test, quality, deps-report, code-quality, surface diff, static scaffold, PostgreSQL
  runtime, SQLite runtime, and desktop-native contexts passed.
- `evaluate.md` records PASS composed per `milestone-run.md` (orchestrator waiver). Acceptance box 6
  uses its issue-authored routing alternative: uncontrolled adoption remains #1140/#1090, while
  this PR supplies a deterministic follow-the-generated-path runtime gate.
