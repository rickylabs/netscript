# Worklog

## Design

1. Public surface: unchanged `MemoryKvAdapter`, `KvStore.atomic`, `watch` and
   `watchPrefix`; a delivered commit event implies all sibling writes are applied.
2. Domain vocabulary: mutation (one storage update); commit (checked synchronous
   batch); event (existing `WatchEvent` payload); notification (handler dispatch
   after storage updates). No new domain abstraction.
3. Ports: existing `WatchableKv`/`KvStore`; Web Platform promises and timers;
   existing BinaryHeap TTL storage. No additional ports.
4. Constants: use existing mutation/event discriminants and key serialization;
   no new production literal IDs. Named test keys/values define fixtures.
5. Commit slices: S0 design/draft, S1 tests plus ordering fix and gate evidence,
   S2 review/handoff records, as enumerated with paths and gates in plan.md.
6. Deferred scope: adapter restructuring, failed-mutation rollback, cloning and
   backend provisioning; bounded successful-commit ordering fix only.
7. Contributor path: `packages/kv/adapters/memory.adapter.ts` owns mutation and
   notification policy; the focused atomic-watch test demonstrates the boundary.

## Routing authority

Exact owner grant: “Run PLAN-EVAL before implementing and IMPL-EVAL after, both
in a separate session with claude -p --model claude-opus-5-5 --effort high,
read-only, stdin closed, blockers only.”

This overrides the queried default evaluation cells and preserves vendor/session
independence. Operator effort is high. Native repo Claude print launcher closes
stdin; prompts require read-only operation and blockers-only verdicts.

## Intake / S0

- Read assignment fully, repository skills/rules, doctrine and harness guidance.
- Consulted existing environment, validation, KV/watch and quality-baseline memory.
- Main equals intake SHA. No unrelated working-tree changes.
- MCP guidance consulted in prescribed order; no specific KV recipe returned.
- RTK absent: direct commands and structured wrappers used instead.
- No triage comment or duplicate implementation; #2313 verified unrelated.
- PLAN-EVAL required explicitly by owner; implementation has not started.
- Reconcile: issue scope and coordinator ownership retained; no taxonomy mutation.
