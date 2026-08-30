# S10 Phase-A handoff

Phase A is implemented on draft PR #1760, stacked on S8. The branch remains `status:impl` and draft;
the implementation session does not mark ready or self-certify.

The separate Tier-A / IMPL-EVAL reviewer should inspect the four structured evidence contracts,
verify receipt path freshness and suite ordering, and decide whether the intentional exit-75 gate
edge in D-04 is acceptable. The supervisor must preserve S9-before-S10 adjacency when sibling stacks
meet and owns the later lease-backed dual-tier Phase-B execution.

Independent IMPL-EVAL cycle 1 returned `FAIL_FIX` at `14daa764`. This follow-up commit addresses
F-1/F-2/F-3/F-4/F-7 as one static slice and documents F-5/F-6/F-8. A separate evaluator must decide
the next verdict; this implementation session does not self-certify.

Phase-B acceptance remains environment-blocked on this host per D-42/D-43. It requires both
`scaffold.runtime --cleanup` tiers, durable receipts under `.llm/tmp/gate-receipts/`, and zero
persistent owned containers. The MSSQL tier must set `ASPIRE_CLI_START_TIMEOUT=600`; the default
300-second budget bounds the entire convergence, not each resource. Phase B must also replace the
Phase-A live cleanup receipt's `processes: []` with live process evidence. None of those runtime
claims are certified by this Phase-A handoff.
