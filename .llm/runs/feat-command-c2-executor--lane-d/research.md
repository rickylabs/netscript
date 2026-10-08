# C2 research and re-baseline

Live #1483 acceptance and comments were refreshed before work. It depends on C1 and #1350 and requires RFC algorithm on a conformant memory fake, identity/replay/mismatch/busy/retry/cancellation/callback-count laws, public boundaries and fault seams. RFC 0003 owns the exact contracts and seven canonical seams. Current service command definitions bind typed handlers privately and provide canonical strict I-JSON codecs. Database has transaction vocabulary but no command-specific bound store. C2 must introduce that raw port for the fake before C3 implements PostgreSQL.

Fresh main 6f6cbdf030d7595d1730272d0a74aedd66225069; C1 predecessor 108b6930f455a2023e3abb7dbb2c91ab46380e6d. No provider support is inferred from this fake. Whole-chain research consulted NetScript find_guidance/search_docs and live prerequisites; follow focused MCP guidance before implementation. Public surface risk is generic transaction erasure or private first-party declaration leakage; real exported positive/negative fixtures and isolated publication must catch it.

## Live issue/comments

Part of #1363. Depends on C1 and #1350. Implements RFC 0003 stage 2.

## Acceptance

- [ ] Executor follows the RFC transaction algorithm over an in-memory conformant fake.
- [ ] Identity, replay, mismatch, busy, retry, cancellation, and callback-count laws are executable.
- [ ] No remote/global transaction or hidden database singleton enters the public surface.
- [ ] Fault seams prove rollback and retry behavior.
- [ ] IMPL-EVAL passes.

## Owner-directed dependency scheduling (2026-10-01)

Required transitive prerequisite of EIS Chat saga producer #1932. C1-C5 land contracts -> executor -> PostgreSQL store/telemetry -> relay -> saga producer; full command programme remains in 0.0.9.

Milestone ordering does not waive acceptance, implementation evaluation or release qualification.


Milestone reconciliation (2026-10-01): Owner-directed RFC train consolidation into new 0.0.9; unrelated runtime defects remain in 0.0.8. Optional/dependency-gated slices retain their gates.

Previous milestone: 0.0.8. Current milestone: 0.0.9.
