# D1 — Open questions (owner forks only)

Only decisions the owner must pick at Stage H. Everything resolvable from the corpus is resolved in
`proposal.md`; those are **not** repeated here. Each fork below is a genuine choice with no
corpus-forced answer.

1. **Static-asset ownership default.** proposal.md §3.3 proposes the default "Fresh owns its
   island/`_fresh` namespace; Nitro owns the host public directory." The corpus establishes that
   ownership *must be declared* and cannot be inferred (orpc-fresh.md "Static assets"), but does not
   dictate *which* framework owns a shared public namespace. **Owner fork:** ratify the proposed
   default, or assign host-level static serving to Nitro wholesale (single asset pipeline) at the
   cost of routing Fresh's asset requests through the outer host.

2. **WebSocket/upgrade scope for v1.** The corpus marks WebSocket as opt-in via CrossWS/H3 and a
   distinct conformance case (orpc-fresh.md, nitro-v3.md), but does not say whether the unified
   runtime must ship WS-upgrade support in the first cut or defer it behind a capability flag.
   **Owner fork:** include WebSocket-upgrade conformance in v1 (`wave:v1`), or defer it to a later
   wave with ordinary + streamed responses only in the first cut.

3. **oRPC v1.14.6 pin vs v2-beta adoption timing.** The corpus mandates pinning the current
   generation and adding a conformance gate (drift-ledger D-11), but the *choice of when* to adopt
   the live oRPC v2 beta is a roadmap decision, not a corpus fact. **Owner fork:** hold at pinned
   `^1.14.6` for the unified-runtime v1 and treat v2 as a separate tracked migration, or authorize a
   v2-beta spike inside this epic.

4. **Milestone train binding for the D1 cards.** *(RESOLVED by Stage-F rework → fork F-9: one
   train.)* All UR cards (incl. the D1 cards UR-0…UR-4, UR-10) land at `0.0.1-beta.13`, which exists
   live (verified 2026-07-18). No new milestone is created (F-15). The prior "beta.12 vs existing
   milestone" fork is withdrawn.

5. **`@netscript/data` facade vs shipped `@netscript/database`.** D1 normalizes board language to the
   shipped `@netscript/database` name (drift-ledger D-12, synthesis §6). If the owner actually wants
   a new `@netscript/data` facade, that is a separate contract card — not an assumed rename.
   **Owner fork:** confirm the shipped-name normalization, or commission a `@netscript/data` facade
   contract card (which would add a dependency for D1-4's context/data seam).
