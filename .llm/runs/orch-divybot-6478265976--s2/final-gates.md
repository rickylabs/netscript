# Final integrated gate evidence

Audited source checkpoint: `e56893397d3351f01f6254b38db80de4a5d4b15d`. All receipts below identify this exact clean Git head. Private atomic receipts retain command identity, request/stream hashes and raw output; public summaries omit machine-specific runtime identity. No RTK-derived output is used as the durable verdict.

| Allowlisted gate | Result | Exit |
| --- | --- | --- |
| quality-gate | PASS | 0 |
| docs-accuracy | PASS | 0 |
| exports-drift | PASS | 0 |
| mcp-export-corpus | PASS | 0 |
| assets-barrel | PASS | 0 |
| publish-assets | PASS | 0 |
| agent-docs-prose | PASS | 0 |
| publish-dry-run | PASS | 0 |

The full workspace publication command was a dry run only; no package was uploaded. The broader quality gate includes the configured quality scan and architecture checks. Existing non-failing architecture warnings remain visible in its raw output.

## Structured source and behavioral checks

- Check/lint/format: all **76** changed source TS/TSX files selected; all exit **0**, zero dropped files/refusals/findings. The scoped lint/fmt config preserves root rules and removes only path exclusions. Generated assets have separate freshness receipts above.
- Integrated application/command/adapter/token/MCP/schema/build/docs/carrier suite: **357 passed, 0 failed, 0 skipped**, exit **0**. The permanent native subprocess acceptance file is excluded here because it has its own fresh verdict.
- Actual public CLI subprocess acceptance: **2 passed, 0 failed, 0 skipped**, exit **0**. Authenticated namespaced add, exact installed bytes/file hash/source identity, no secret in output or persisted files, and zero writes during a local-edit diff. Actual preset init plus theme-only apply preserves all component/island/library copies and font metadata, installs exact canonical Studio/Tonal docs, persists the selected preset, and survives a later ordinary tokens build.
- Style regeneration: Utility and fixture sources, stable explicit targets, unchanged page contract/type check, protected edited copies including --force, and preflight/rollback negatives are covered by the integrated style tests.
- Documentation census: **109/109 root/direct public commands**, 174 recursive command paths. Full docs site build and static registry generation passed earlier in this same implementation lineage (254 rendered pages, 87 registry JSON artifacts).
- Review thread gate: **0 current unanswered threads**, exit **0**.

## Explicit limitations

- Required exact one-pass `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` was attempted at implementation commit `12ef006`: exit **1**. `preflight.aspire` and `cleanup.aspire-stop` failed. **Docker daemon unavailable; full scaffold runtime and cleanup are unproven.** No generated runtime was started at preflight. Read-only resource inspection left foreign/unproven entries untouched.
- Full Fresh UI doc-lint retains **123 unchanged baseline findings** in component runtime sources (96 private references, 27 missing docs). Both changed registry entrypoints and all three MCP entrypoints pass doc-lint; JSR metadata audits for CLI/Fresh UI/MCP pass.
- Final prescribed native Claude invocation returned weekly quota, exit **1**, before a verdict. Same-model Opus 5.5 High via the documented capable native Antigravity transport also returned individual quota, exit **3**, before a final verdict. The earlier supplemental acceptance review PASS remains valid for its limited scope; it does not establish final evaluation. **Final whole-change IMPL-EVAL and slice 5 sign-off remain unproven.** Catalog/argv identity is observed; provider-side identity attestation is unavailable.
- Remaining transport discovery: the current OpenCode catalog has no Copilot or Go entry for the requested Opus model. The pinned matrix's public assertion rejects exact `openrouter/anthropic/claude-opus-5.5` under the existing owner override. No paid inference, model substitution, fabricated routing entry or allowance bypass was used. The PR stays draft.
