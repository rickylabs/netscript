# Worklog

## Design

1. Public surface: optional `DurableStreamProducerOptions.initialEpoch` inherited by service factory. No consumer changes. Explicit epochs fence rather than auto-claim; omitted option retains legacy behavior.
2. Domain vocabulary: producer session = one epoch allocated by application storage; sequence = serial transport request counter in that epoch; duplicate = already committed exact tuple; unchanged source = caller skips producing an event. Existing lifecycle snapshot/states stay intact.
3. Ports: existing transport, clock, random and write lifecycle; persisted allocator belongs to caller, no new storage port. Cancellation continues through supervisor signal.
4. Constants: epoch/sequence zero are protocol values; integer upper bound Number.MAX_SAFE_INTEGER. Existing finite lifecycle/failure unions reused. No new protocol strings.
5. Commit slices: plan bootstrap, one cohesive runtime/proof/docs slice, evidence handoff; see plan for exact files and gates. Each commit includes worklog/context updates.
6. Deferred scope: server handshake endpoint, autonomous epoch storage, semantic value deduplication and crash-persistent queue (requires application contract beyond transport retry safety).
7. Contributor path: `src/application/durable-stream-producer-supervisor.ts` owns identity/retry/fencing policy; README explains callers' epoch responsibilities.

## Bootstrap

Matrix and owner override recorded in supervisor. MCP consulted, prior memory checked. No existing covering PR. Public-safe evidence only; raw reviewer output kept outside Git. PLAN-EVAL selected by owner, not yet run. PR labels/milestone and local scaffold runtime prohibited by owner.

## Plan-Gate and slice 1 reconciliation

Independent PLAN-EVAL: PASS, no blockers. Reviewer confirmed supported initial epoch is explicitly allowed and unchanged-source equality belongs to caller; requested actual checkpoint proof and honest negative-control limits. Draft PR #2510 opened at bootstrap commit 85ab044. No changes to taxonomy.

Baseline structured tests: 77 pass; combined export doc-lint exit 0 (standalone entrypoints have 10 inherited private-reference findings, combined graph none). A wildcard npm alias from exploratory deno info was removed from the lock; no dependency changes needed. Git author identity was absent; configured this repository to the authenticated account's existing commit identity.

## Runtime slice evidence

85 tests pass (77 baseline + 8 new), including five real-server scenarios. Scoped check/lint/fmt: 64 TypeScript files, zero findings. Combined export doc-lint exit 0. JSR audit dry-run OK; its sole “slow-types” warning matches the checker banner, so native checked publish dry-run additionally returns Success without allow-slow-types. Full quality:gate baseline exit 0.

Negative control: fixed focused suite 9/9; baseline production restored temporarily produces 8 failures, including each of five new real-server tests, one existing protocol test remains green. See negative-controls.md for exact limitations. One exploratory TAP run stalled in restart-offset test and was interrupted; same normal-output test and subsequent structured positive/negative run finish normally. Kept incident evidence privately, no false PASS attributed to interrupted run.

Repeated structured runs reproduced the stall. A private instrumented copy localized it to reference-server.stop() after all producer operations and reads had completed. Test-only real network fetch now requests Connection: close so Node HTTP shutdown cannot wait on idle keep-alive sockets. Production transport behavior is unchanged. Re-run stability and negative controls after this harness correction.

After Connection: close in the real-server fixture, 20 consecutive structured focused suites pass (180/180 test results), then the same fixed/baseline negative control again yields 9 pass versus 8 fail/1 pass. No timeout or pending shutdown remains. Docs links: zero broken links/anchors; full docs snippet census PASS (26 checked tier-one fences; the new application-storage illustration is outside that existing floor). Standalone consumer fixture type-check PASS with its config and no private lock. Full quality:gate (including deps:check and all-roots architecture) PASS on implementation working tree.

## Source slice sign-off and reconciliation

Independent source/slice IMPL-EVAL PASS, no blockers; reviewer independently reproduced and localized the test-server shutdown stall and confirmed the test-only fix, then independently passed the focused 9-test suite. Full source gates: 87 passed, 0 failed, 0 ignored; check/lint/fmt 64 files, zero findings. No outstanding PR comments or reviews. Changes remain within declared source/test/docs scope; final generated carriers are next. Reviewed source slice is signed off by the independent supervisor review, not self-certified by implementation.
