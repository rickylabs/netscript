# Evaluation ledger

Historical artifact filenames used a single ordinal for full implementation evaluations and supplemental slice-only checks. The phase scopes, prompts and outputs are retained in full below so budget accounting can be audited, rather than treating file ordinals as new authority. The operator cap remains five full implementation-evaluation rounds; per-slice supervisor reviews are a separate required gate in the supplied leaf profile. No cap waiver is claimed.

| Invocation / retained record | Actual scope | Full IMPL-EVAL round |
| --- | --- | --- |
| PLAN-EVAL1 / plan-eval.md | Design before implementation, FAIL_PLAN | N/A |
| PLAN-EVAL2 / plan-eval-round2.md | Repaired design, PASS | N/A |
| S1 slice-review.md | S1 substantive supervisor sign-off | N/A |
| evaluate-round1.md | Complete implementation/doc/evidence review before readiness | 1 |
| evaluate-round2.md | Full final exact-pushed-head review at6a62a6f | 2 |
| evaluate-round3.md / inventory-review-prompt.md | S3 supervisor check confined to six generated inventory rows; prompt incorrectly called this IMPL round3 | N/A: slice-only |
| evaluate-round4.md / publish-wrapper-review-prompt.md | Supplemental S3 provenance-only artifact sign-off, no new executable implementation | N/A: slice-only |
| final-review-protocol.md + final PR attestation at d92acd5 | S3 precommit sign-off plus complete final exact-head evaluation, historically called round5 | 3 |

S4 runtime CI repair requires the same independent evaluator to audit this ledger before accepting a further full implementation round. Proposed full round4 performs substantive precommit sign-off and later exact-pushed-head verification in one continuous invocation; full round5 remains unused. If the independent evaluator finds the two artifact-only checks must instead consume full rounds, it must stop rather than exceed the cap. No new evaluator session or terminal-failure reset is authorized.

Independent audit in evaluate-s4-round4.md confirms this classification. This is an after-the-fact reclassification of earlier labels and the prior assumption that the budget was spent; it is disclosed here and must be disclosed in the PR. Full round4 returned FAIL_FIX for mixed Windows separators in the proposed fixture. The last allowed full round5 must review the corrected native path construction and then the exact pushed head; a second consecutive terminal failure ends the leaf. No additional round or evaluator session is assumed.

Full round5 checkpoint1 approved corrected S4 (slice-review-s4.md). The explicit conclusion was printed by the independent reviewer to tool stdout after its initial wait omitted visible sign-off; private thinking was not used as approval. The same invocation remains live for main-integration reconciliation and exact final pushed-head verification.
