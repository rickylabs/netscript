# S3 — reconcile with latest main

Owner explicitly requested a rebase and force-push. Fixed base: 1d467c669dc122174dcea95e39871e8145591114. Previous remote tip and exact force-with-lease expectation: e147deb2464bc6846a8b2cd7bedce957f72ebb58. A local recovery ref retains the old evaluated tip.

## Conflict resolution

- Compose #2187 asynchronous file-change identity with #2484 callback scope: await event construction outside the user-callback scope, then use the existing #invokeCallback wrapper. Keep main's readiness, retry, health, cancellation, and task bookkeeping unchanged.
- Preserve the entire upstream recovery/callback-cancellation test body, then append the seven identity tests. Controlled source fixtures stay open until stopped, matching the recovery contract; early iterable completion is intentionally a watcher failure on the new base.
- Runtime source-drain shutdown replayed beside main's logger/health changes without discarding either behavior.
- Seed the generated prose carrier from the fixed main, then run native prose, MCP, barrel and publish generators. Decoded comparison retains every upstream context/page byte except the owned triggers page, which exactly matches rendered Markdown. 202 pages, zero additions/removals, one approved changed page. No dependency or lock delta relative to main.

## Validation

| Gate | Result |
| --- | --- |
| Structured tests: core + watchers + trigger runtime | 140 passed, 0 failed, 3 Redis-only ignored |
| Structured check/lint/fmt on the three owned roots | 120 files, zero findings |
| quality:gate | PASS, including root coverage, quality scan, dependency checks and architecture |
| Generated page integrity | 202 pages retained, only triggers changed, exact rendered source |
| check:mcp-export-corpus | PASS |
| check:publish-assets | PASS |
| check:assets-barrel | PASS |
| Agent-docs prose | PASS, exit 0; exact freshness receipt retained outside Git |

Previous negative controls remain historical evidence for unchanged key/TTL/shutdown policies. The new combined suite additionally proves the integration with upstream recovery and callback-safe cancellation. Exact pushed-head evaluation and fresh CI are published in the PR phase comments so the recorded verdict does not change its reviewed SHA.

## Output digests

| Output | SHA-256 |
| --- | --- |
| s3-regression-tests.json | `cca86ca2e0cccd6d01a1de3d6aee0b39290445ce669d401cc6931a8dfdb58b18` |
| s3-check.json | `0fc2d07e553a6ad8bb965e747ce5c05d73f850abc1a4d2b2616c990be344bcc5` |
| s3-lint.json | `8ba9c31b8f8c5063afd80f1d4f4c03c012fb7891fa7879c086aeb1425325ff63` |
| s3-fmt.json | `efe960385191075ffd3c4c8b96f70fe3604220d07b061aaf35b4bb62f2051df6` |
| s3-quality-gate.log | `49eb80635bdddea3d26931784314ba93db126dc3d5c3eca58744ff842c6a5c06` |
| s3-page-integrity.json | `82511b57d63a9a6c6aebab7b142278b94010ace114616bd23b51995e9cb75d38` |
| s3-docs-receipt.json | `2709bfc7727c61030d92237fb618976122906ed8dc1999918c215b5046b343e9` |
