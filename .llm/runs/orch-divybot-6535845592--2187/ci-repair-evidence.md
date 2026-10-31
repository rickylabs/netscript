# S2 — CI and shutdown review repairs

## Failed CI cause

[Quality job](https://github.com/rickylabs/netscript/actions/runs/41147825236/job/124377136211) failed the agent-docs-prose gate with “Agent docs prose is stale: agent-docs-prose.generated.ts”. Earlier lint/format steps passed. This is caused by the owned triggers Markdown update, not the broad-quality baseline or a test discovery problem.

Native generation: `deno task gen:agent-docs-prose`, then `deno task gen:publish-assets`. Only one compressed carrier row changed. Decoding via the existing transport verifies 202 stored pages, no additions/removals, and only pages/durable-workflows/triggers/index.md changed; it exactly equals the rendered Markdown. No hand-edited compressed payload or lock change.

## Review 4429496686

[Augment thread](https://github.com/rickylabs/netscript/pull/2479#discussion_r4429496686) correctly identified processor admission closing while a metadata SHA-256 digest was still pending. The runtime now settles scheduler/watcher shutdown before stopping the processor, and propagates rejected source-stop results after draining.

Two deterministic disk-KV tests block the real adapter's WebCrypto digest and abort while hashing. After source stop begins, releasing the digest must run the handler without stopping errors or DLQ. Both normal shutdown and a scheduler.stop rejection are covered, including original stop-error propagation. Reverting only plugins/triggers/src/runtime/trigger-processor.ts makes both cases fail the dropped-observation assertion (0 passed, 2 failed); no type/setup/process failure. Fixed bytes were restored before final regression validation.

## Validation

| Command | Result |
| --- | --- |
| Structured core + plugin-runtime suite (same command as gate-evidence.md) | 90 passed, 0 failed, 3 Redis-only ignored |
| Structured check/lint/fmt on plugins/triggers/src/runtime | 11 files, zero diagnostics/findings |
| Scoped quality on plugins/triggers/src/runtime | zero findings, zero allowances |
| arch:check | PASS, exit 0 |
| Independent S2 review | PASS; 31 tests passed, 3 Redis-only ignored |
| agent-docs-prose via run-gate | PASS, exit 0; this is the exact failed CI gate |
| check:mcp-export-corpus | PASS |
| gen:assets-barrel --check | PASS, all generated carriers current |
| check:publish-assets | PASS |
| check:assets-barrel | Final diff-based verdict runs after committing the reviewed generated row |

The native asset-barrel task includes git diff --exit-code, so it cannot report green while the intentional generated row is uncommitted. This is recorded rather than bypassed. Raw structured outputs and the gate receipt remain outside Git because they contain environment paths; the hashes below identify the evidence.

## Output digests

| Output | SHA-256 |
| --- | --- |
| s2-agent-docs-receipt.json | `e6d1e3861debd707be5db30f33138cd97da3b6e426e0f26932e1d06c595f8e47` |
| s2-page-integrity.json | `c852e62f66018b5e68c4c0fde7a8264e80cf33eb3f1570cf040c27f1b861a0b3` |
| s2-mcp-check.log | `70ac0b0607b58fdf2cb00299197bdc0aeb53d280ffd7436a1e98063aa03aa8e9` |
| s2-assets-check.log | `fe413ce25d4a9936468fa02a2407e9ed0d2f4e236407fe26a3fbf31bf850ba8b` |
| s2-publish-check.log | `70bc4b06374ff6f561f02b223ee735b7bf25bb21e4a9811a8183d6279a83735b` |
| s2-shutdown-negative.json | `8ed1ec33b6497571a117c63f460c311b86ec9ec9f94da557bd097be77ca3bb79` |
| s2-regression-tests.json | `25f89fac7397bbc3fae2bb2c99ac72a1d2a9878c5eea80958137f86be8ced852` |
| s2-check.json | `63a9949e3146f1592b1551d19cb926df5441482fa683a7b226130a197d699038` |
| s2-lint.json | `f22f0449923b0117b36d789402380bfa8e1c0c63c174e45b478a2715f60b0d57` |
| s2-fmt.json | `5ba2403ad083d6da0ac3e23e15179553a174f579ed5f929e084ceb677e24f651` |
| s2-quality.json | `57d2f81175c8411e45229dc4b96dab6cfa6e922eade191e6907b78d8e18ecce6` |
