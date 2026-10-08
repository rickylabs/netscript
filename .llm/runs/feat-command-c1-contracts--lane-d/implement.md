# C1 implementation lane

use harness

## SKILL

Use netscript-harness, netscript-doctrine, netscript-tools, netscript-deno-toolchain, jsr-audit and netscript-pr.

## Authorized scope

Implement locked C1 slices S1–S3 only after the independent whole-chain PLAN-EVAL PASS at `359d17f426592d58a6f6388a9522bc3afbc45dde`. Complete S1 and pause for supervisor review/sign-off before S2; repeat for S2 before S3. No commits, pushes, PR/issue writes or evaluator verdict changes by this lane. No executor, database or relay implementation.

S1 preserves live BaseContractMeta and the six base codes, adds three opt-in command codes, validates safe failure payloads structurally and rethrows every unrecognized error unchanged. Real public export fixtures prove builder/client/safe/isDefinedError literals, metadata and undeclared-code rejection. Each new test receives a reversible meaningful mutation with named failure, nonzero exit and restored pass.

MCP find_guidance and search_docs consulted for C1 command errors; recommendations were general contracts/builders guidance. RFC 0003 and current public declarations govern the specific command contract.

S1 supervisor sign-off is committed; S2 is implemented and frozen for review. See s2-implementation.md and its distinct evidence. S3 must await supervisor S2 sign-off/push/comment. Replay-stable jsonCodec validation compares pre-schema canonical input with validated canonical output; first-party IsolationLevel is type-re-exported from the focused subpath. No runtime capability export or root enlargement.

S2 is signed off at f9d0ccc99f1ecf98de4d8778196be99b4d795c1b. S3 is complete and supervisor signed off; see s3-implementation.md and distinct gate/consumer/mutation/JSR/source artifacts. Complete regressions180 pass, frozen prod-install and clean source/declaration consumers pass. Independent C1 IMPL-EVAL pending. Preserve the SKILL chapter and evaluator artifacts. No later leaf implementation by this lane.
