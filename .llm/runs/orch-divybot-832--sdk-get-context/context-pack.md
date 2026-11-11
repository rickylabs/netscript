# Resume source #2610 from here

**STOP: exact-plan parent review required.** Planning-only assignment #832.
No product changes, evaluator/design dispatch, runtime, consumer cohort edits,
merge or publication are authorized. Product continuation requires both an
independent PASS for the sealed exact plan and explicit parent authorization.

Baseline `12c981104c1d13812d7119798911a0937e74348c`; branch `orch/divybot-832`.
Current main matched at intake. Ownership checks found no competing SDK repair.
Repeat ownership/default-branch checks before any future implementation.

Review `plan.md`; verify its hash and all listed files against
`immutable-manifest.json`. Start evidence with `red-evidence.json` and
`get-context.repro_test.ts`. The latter uses public SDK/contracts/canonical bearer
and only intercepts final fetch: 5 PASS, 5 semantic FAIL, 0 ignored. Single-call
effective Request abort/deadline already works; init signal/no-store and
cache/cancellation isolation fail. SDK 0.0.9 resolves local oRPC 1.15.5, distinct
from the consumer's 1.16.1. No bump is proposed.

Proposed narrow fix: explicit separate policy cache groups; independent direct
SDK path for signalled/additional Fetch-cache-mode calls; materialize metadata
cache before dispatch; preserve the upstream effective Request/init signal.
Retain native GET dedupe for safe unsignalled equivalents and all public APIs.
No implementation or release acceptance is claimed.

The draft PR is the mobile review surface; it must remain draft pending the
specified reviews and continuation. Source #2610 receives one sealed checkpoint
comment. Final assignment reporting uses only the excluded `.divybot-final-report`
file handoff, not an additional manual inbox comment. Parent owns review, merge,
authorized runtime qualification and downstream notifications; Eric cuts releases.
