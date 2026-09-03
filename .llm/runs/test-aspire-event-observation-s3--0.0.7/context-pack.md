# Context pack — #1906 slice 3

- Branch: `test/aspire-event-observation-s3`
- Base: `3149d18e1`; brief head: `ea2c912b4`
- Run dir: `.llm/runs/test-aspire-event-observation-s3--0.0.7/`
- Current phase: S1 RED captured; next is S2 fenced GREEN
- Contract: complete the cleared six-file fence, dispose Bucket C, empty the guard allowlist, and
  avoid all local Aspire runtime execution.
- Evaluator: separate opposite-family session after implementation.
- S1 receipt: `receipts/s1-red-polling-guard.json` records 4 passing tests and the intentional tree
  failure naming only `runtime/verify-listener-readiness.ts:187`.
