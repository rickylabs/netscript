# R1 dispositions for independent R2 review

R1 remains **FAIL** at `e3b5ff75ba65ee15347504896df38262332d4755`.
Original plan/manifest hashes are unchanged. The full received verdict is
`plan-R1-verdict.md`, SHA-256
`731003f7a6101fa00b594d6578f6232533ac68b2b775427e977bc7a4521d3cb1`.
These are builder corrections and evidence, **not** independent resolution/PASS.
R2 is the next round; no evaluator, family or round-count reset occurred.

| Finding | R2 correction and evidence | Remaining gate |
| --- | --- | --- |
| B1 — signalled queryUtils dedupe impact | plan-R2.md's per-API table, actual api-path-controls-R2_test.ts, and api-path-evidence-R2.json. Two real observers on different keys/QueryClients supply two signals; planned policy requires two native fetches and independent wire cancellation. Unsignalled queries still coalesce; one key in one QueryClient still shares TanStack execution. S3 explicitly revises README transport policy and the two-dialects section to avoid a global dedupe promise. | New controls are 2 semantic RED / 2 GREEN on unchanged source. Their complete GREEN/cancellation assertions require authorized product implementation. |
| B2 — content LEAK gate and sanitizers | Named LEAK-S1, LEAK-S2 and LEAK-S3 in each product slice, separate from maint:leak-check. Run-local scan-leaks-R2.ts scans committed run files plus added source patch for secrets, operator paths, addresses, session identities and usage; reports no matched payload. LEAK-S0-R2 qualifies this checkpoint. All new controls explicitly set sanitizeOps/sanitizeResources true; future commands must not disable them. | Scanner/manual review and sanitizer evidence are required per slice; resource ownership reports do not substitute. |
| B3 — complete mutation protocol | mutation-protocol-R2.md locks compiler 0, semantic assertion RED, exact committed-H restore, restored GREEN, immutable file/test/dependency identity and evidence locations. M-ACTUAL-GET and M-DEFAULT-CATCHALL are mandatory; P-INNOCUOUS must remain GREEN. | Product mutation experiments are explicitly unexecuted until continuation; independent implementation evaluation verifies the saved receipts. |
| A1 — actual 1.15.5 / 1.16.1 evidence | upstream-comparison-R2.json records package-relative files, exact exported source/declaration hashes, extraction boundaries and byte-identical relevant snippets for both released versions. Dedupe/context, batch signal and Fetch adapter excerpts are equal. No dependency edit or version-fix claim. | Full consumer graph and released cohort qualification remain separate; snippet equality is not complete version parity. |
| A2 — explicit override versus auth metadata | Required-auth metadata no-store is a default, not a new hard cache prohibition. Explicit force-cache wins; only-if-cached is forwarded unchanged on an independent path, retaining Fetch's mode constraints/errors. The plan includes explicit/omitted/override rows and M-EXPLICIT-OVERRIDE. | Execute wire-init and native Request-compatibility controls after authorization; no auth/query-cache redesign. |
| A3 — predicate signal fidelity | Eligibility consumes options.request.signal from the optional-signal **encoded standard request**, before Web Request conversion. This must correspond to the wrapper's existing top-level-over-context selection. Tests cover top-level-only, context-only, distinct simultaneous signals and queryUtils. M-SIGNAL-SOURCE guards against consulting context.signal alone. | Exact runtime callback/predicate conformance and causal cancellation tests in S2. |
| A4 — strengthen old catch-all assertions | The plan lists transport-policy_test.ts's old default-group true-for-cached assertion for deliberate replacement with exact negative matches. Lock group order force-cache/no-store/default, contexts and truth table. Preserve existing method inference, override and raw-mode normalization assertions. No old tests edited in R2. | Parent-approved S1 implements the stronger assertions; M-DEFAULT-CATCHALL must kill their old behavior. |
| A5 — queries.* pre-existing no-cancel behavior | Per-API table explicitly states that queries queryOptions ignores TanStack's supplied signal today. Improving that bridge is deferred; no claim of new cancellation support or global query dedupe is made. Its unsignalled coalescing control remains GREEN. | No change to this surface is authorized by this repair; any later enhancement needs a separate scoped decision. |

Parent must review the exact R2 plan/manifest and issue an independent verdict.
Even an R2 PASS does not authorize source work without explicit parent product
continuation. Two terminal plan failures still escalate under the existing leaf
contract; this correction does not create a third attempt or start implementation.
