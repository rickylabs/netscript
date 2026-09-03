# Context pack — #1906 slice 2

- Branch: `test/aspire-event-observation-s2`
- Base: `79adb103b`; brief head: `9059e2042`
- Run dir: `.llm/runs/test-aspire-event-observation-s2--0.0.7/`
- Current phase: S1 RED guard ready to commit
- Contract: consume `resource-state-stream.ts`; never poll Aspire resource state; fenced files are
  immutable; no local hosted runtime suite.
- RED evidence: wrapper result 3 passed / 1 failed, naming only
  `scaffold/verify-endpoint-readiness.ts:8`.
- Next: commit and push intentional RED guard evidence, then convert in-scope sites and turn it GREEN.
- Evaluator: separate opposite-family session after implementation.
