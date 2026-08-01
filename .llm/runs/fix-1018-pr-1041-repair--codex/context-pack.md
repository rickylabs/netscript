# Context pack

- Goal: repair PR #1041 without shrinking the AI scaffold, make the emitted-sample gate execute in CI, and cover install plus add surfaces.
- Slice baseline: `25379a543731d6d6976d79829181b260dcb90dfb`.
- Preserve good earlier stream and trigger commits.
- Restore the six-route AI router and normalize readonly runtime results at its wire boundary.
- Expanded the release gate to the measured 40 TypeScript/TSX emissions (23 install + 17 add),
  represented by 30 de-duplicated artifact paths.
- External evaluator calls are explicitly prohibited by the owner; supervisor evaluation is authoritative.
- Final focused/static gates are green: 88 plugin tests passed; scoped check/lint/format selected
  196 files with no diagnostics or findings.
- The full scaffold sequence stopped at the 117340 ms users-service timeout, but the targeted
  `behavior.ai-chat-route` gate passed against the generated project in 1493 ms.
