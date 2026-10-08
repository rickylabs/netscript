# Worklog

## Design

Public surface and domain: Capture native document epoch in the existing SDK default binding adapter; Fresh synchronously closes the retired logical port and upgrades a replacement behind one stable physical binding, with stale/final admission guards and strict actual CEF reload proof

Ports: preserve existing owning package contracts. Constants: existing finite vocabulary; additional values only when needed by the issue. Contributor path: extend existing implementation and adjacent regressions.

Commit slices: bootstrap plan, source/test/mutation evidence, independent evaluation evidence. No speculative files.

PLAN-EVAL: Selected: decision-heavy cross-package native lifecycle/protocol metadata, hard stop until independent PLAN-EVAL PASS; workload capped at feature

## Nine phases

1. Bootstrap: clean clone, fetch, fresh branch from current main.
2. Research: issue, MCP, selected skills/doctrine and existing implementation examined.
3. Plan & Design: locked design recorded above.
4. Plan-Gate: Selected: decision-heavy cross-package native lifecycle/protocol metadata, hard stop until independent PLAN-EVAL PASS; workload capped at feature
5. Implement: pending.
6. Gate: pending; raw exit codes to be recorded.
7. Evaluate: pending; independent different-vendor session mandatory.
8. Release: N/A, owner explicitly requires unmerged PRs.
9. Close: pending source delivery and handoff; publication remains owner work.

## Locked Design detail

State/identity: stable native bindingName owned by one supplied window; current logical SDK MessagePort server, optional finite-positive document epoch, final isClosed admission flag and one shared closePromise. Lifecycle: initial bound legacy slot -> first stamped document adopts epoch -> strictly newer document retires/closes old logical slot and synchronously upgrades new one -> final closed/unbinding; stale epochs always CLOSED and never mutate current slot. Cancellation: old pending RECEIVE resolves CLOSED, terminating old SDK receive loop/ports; final close does the same then unbinds once. Shared final closePromise includes synchronous/asynchronous unbind failure and prevents repeated unbind attempts. Transport/context/serializer: existing DesktopBindingInvoke, SDK server MessageChannel and oRPC RPCHandler/custom JSON serializers; no new serialization/auth/origin policy. Clock/identity boundary: existing native adapter captures Web performance.timeOrigin once as document identity, not a live clock inside handlers; explicit two-argument invoke port unchanged. Concurrency: no awaiting while changing epoch/slot; each dispatched receive captures its own logical server, so old outstanding receives cannot lock replacement. Existing Desktop constants statuses/operations retained; no new lifecycle enum exported. Diagnostics: existing protocol error classes, invalid supplied epoch rejects without changing slot; runtime receipts/errors remain private. Contributor path: extend existing bind-channel native adapter, Fresh binder and adjacent tests; no abstraction/package/handler registry added for one existing transport. Source, native fixture, corpus and independent review slices follow locked S1-S5; selected Plan-Gate is a hard stop.

Independent PLAN-EVAL PASS at 27b27db11eba23c2147bc6f7f8632430c3235061, all eight boxes checked. Evaluator exited zero before source implementation; selected hard stop lifted. Type budget/public seam/native capability classification and strict actual native CI reload obligation accepted. Additional private research verifies real CEF reload on an ephemeral listener and explicit task-scratch output; no framework source touched. Baseline all-entrypoint doc raw exits: SDK one (3 private references), Fresh one (28 private/17 missing); complete private reports retained for final per-entrypoint comparison, not hidden. S2 source/lifecycle tests next.
