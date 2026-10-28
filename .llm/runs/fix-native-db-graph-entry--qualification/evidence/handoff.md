# Native DB graph entry — source review handoff

The accepted two-owner repair is implemented in netscript-native-db-qualification-008 on
fix/native-db-graph-entry at unchanged base HEAD 1582e1c9e1adcaa0a8a92900ec3b5b4b0db3e92d.
No commit/push, model inference or other-worktree modification occurred. This is generator evidence
for root review, not independent acceptance or service/Windows PR gate waiver.

| Owner | Lines / cap | SHA256 |
| --- | --- | --- |
| .llm/tools/deps/check-db-alignment.ts |100 /120|babe9043e1296dac30e9923bbfee9d3c02f96f062c62c3ec1e90e0fdba5186b1|
| .llm/tools/deps/check-db-alignment_test.ts |86 /140|634c289a7f7b60d8212a227294ed096ed70dc35559732de024d6332a2bbaf96b|

The [complete diff](two-owner.diff), +84/-8, has SHA256
406fd7521b3efed90d0c6e26c5e819817400bb6f7f80e5b85f470b0dd20c495e.
The sole path change is native toFileUrl(entry).href. The analyzer additionally rejects no-resolved-
module graphs despite identity metadata; identity and unresolved-module checks remain. No copied
resolver, extra export or public/API/config/dependency change. Original test assertions remain,
with realistic module metadata so each still isolates its original identity/error condition.

| Evidence | Actual result |
| --- | --- |
| [Unchanged-production owning RED](owning-unchanged-production-red.json) |2 pass /4 fail /0 ignored; all four new invalid-graph oracles fail, original and real native URL control pass|
| [Unchanged cold guard RED](cold-unchanged-red.receipt.json) |exit 1; both sdk-fresh and fresh-only identities=<none>|
| [Final owning](owning-green.json) |6/0/0, including actual local spaces/# path resolution|
| [Both real cold graphs](cold-green.receipt.json) |PASS/exit 0; both exactly @tanstack/db@0.13.0_typescript@7.0.2, no findings, 7.775s /120s deadline|
| [Adjacent dependency tests](adjacent-dependency-tests.json) |23/0/0 across six bounded analyzer/read-only test files|
| [Types](selected-check.json) / [format](selected-fmt.json) |two actual selected files, no findings or failed batches|
| [Initial root-config lint](selected-lint.json) |retained FAIL/refusal, two selected /zero processed because canonical config excludes .llm|
| [Canonical-rules selected lint](selected-lint-canonical-rules.json) |two selected /two processed, no findings/drops/refusals; ignored rules-only config exactly matches root rules|
| [Composite architecture](arch-check.receipt.json) |PASS/exit 0, 24.636s /180s deadline; cold prerequisite and direct doctrine both reached|
| [Final audit](final-audit.json) / [cleanup](cleanup.json) |35 protected hashes match; only two tracked source owners changed; source diff-check passes; zero owned scratch/native fixture processes|

Every test command explicitly enables ops/resources sanitizers plus trace-leaks, cached-only,
frozen and check. The five added registrations explicitly enable all three sanitizers; original
shorthand test retains its options and Deno exit sanitation default. The local native info child
has a 10s AbortController deadline, clearTimer/awaited output and finally cleanup.

The cold production info commands intentionally use new caches/network; only their outer source
runner is cached/frozen. The composite task also emitted a react-test-renderer metadata download
and existing warnings. Its standard receipt preserves full stream hashes and bounded tails
(stdout tail truncated=true), not the full 48KB doctrine output. No unsupported all-offline or
full-raw-output claim. No broad service/publication/app/CEF/installer gates were repeated.

The full dependency test directory includes release bump, full-repository-copy and unbounded
native subprocess controls; the proposal made that breadth conditional. Those controls were not
skipped or weakened; six bounded neighboring suites were selected explicitly. Frozen service
and Windows source sets remain unchanged. The historical service cold gate remains historical
until this separate repair is integrated and its owning coordinator accepts that evidence.

Root's original external-scheme/file-URL native traces remain untouched in the service worktree.
PLAN-EVAL N/A was recorded before editing for this fixed path/graph behavior. Source acceptance,
checkpoint/PR authorization, independent IMPL and all later readiness decisions remain with root.
