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
