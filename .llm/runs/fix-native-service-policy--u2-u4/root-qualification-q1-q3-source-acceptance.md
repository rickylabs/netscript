# Root Q1-Q3 qualification source acceptance

Root read the complete four-owner diff and native TCP implementation, actual final owning and
broad test receipts,127-file type coverage, quality/publication disposition and protected baseline.
Root independently verified all15 protected hashes; no mismatch. Exact accepted source:

| Owner | Lines | SHA256 |
| --- | --- | --- |
| service/src/diagnostics/database-connectivity.ts |473|854e3c3356065560ebfb5759e1665ef0fc3ee8cecf8c75773d09f5df24147ee6|
| service/tests/database-connectivity_test.ts |293|f1f8ee2dc7fdd8ce7861edcca412f74b9724cb382bee43529d30d491bfae5f3a|
| service/tests/legacy-abort_test.ts |199|8781d5d9144250b5554d6e53b84d7b54f54938c5b0f685ee484082d935a56a0c|
| plugin/tests/service/create-plugin-service-auth_test.ts |204|24cd6d86f27e147f09d71c1afaf9b66f9a0a13fb5c694763f9ea62846db42c28|

Paths are relative to packages/. The TCP probe now supplies the native AbortSignal, closes any
resolved connection in finally, treats a late aborted connection as failure, and clears its
deadline on every outcome. Existing three attempts/two retry delays/query/provider/endpoint/
soft-failure behavior stays. Native loopback EOF and refusal controls remain distinct from four
explicitly labeled deterministic unit scheduling cases; no unit simulation is platform proof.
Original seven provider tests remain. Child stdout is consumed through EOF, canceled on owned
shutdown deadline and released in finally; Windows config/fixture URLs use native fromFileUrl.
The plugin JavaScript policy control retains all four malformed inputs and the U4 health401 oracle.

Actual Q1 final18/0, Q2 final3/0, plugin owning11/0; all26 broad consumers pass. Runner receipts
explicitly enable ops/resources sanitizers, with exit sanitation retained. Whole service626/3/0:
two unchanged requestBody leaks and one mapped-IPv4 Windows refusal remain failed, not waived.
127 selected types and lint/format pass without drops. Eight export roots, quality, direct
doctrine, JSR and full workspace publication dry-run pass; publication scratch returned to its
baseline. Existing repository quality allowances remain, not new slice debt. Composite arch
fails the existing database-identity prerequisite and its attempted metadata fetch is retained.

Authorize scoped checkpoint/push and draftPR2422 update AFTER final handoff/hash/cleanup audit,
provided these exact bytes remain and all original failure records are retained. Byte-audit raw
evidence before staging; no private profiles/credentials. Preserve failed first-GREEN cleanup
and diagnostic command attempts. No full-green/readiness/merge/independent-review claim.

Q4 remains diagnostic/proposal only: distinguish declared-length and chunked rejection, actual
request body ownership versus client response/shutdown, preserve all native413/200/auth/framing
and bounded-read controls. Do not patch two further owners or copy Hono before root scope review.
Mapped IPv4 and database identity remain separate; no test skip/ignore/platform camouflage.
