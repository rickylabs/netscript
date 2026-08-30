# Drift — S10 #1722

## D-01 — `rtk` is absent on the authoritative host

The repository guidance prefers `rtk`, but the executable is not on PATH. Focused raw `git`/`rg`
reads replace it. Durable verdicts still come from the structured Deno wrappers, so this is an
environment/tooling presentation drift only.

## D-02 — S7 ownership contract is not in this branch ancestry

The post-stop probe mirrors S7 pending S7's merge. Authority is
`origin/fix/aspire-13-5-s7-teardown-leak-check:.llm/tools/agentic/teardown/probes.ts`: the
`ASPIRE_MOUNTS` label at line 8, DCP environment key at lines 11-12 and 116-123, exact AppHost argv
at lines 107-113, and `aspire-managed`/`dcp` identities at lines 99-104. S10 duplicates only the
contract inside `packages/cli/e2e`; it does not copy S7 commits or import `.llm/tools`.

## D-03 — S9 runtime gate is not in S10 ancestry

The dispatched branch is explicitly based on S8 `9dd06647`, while S9 is a sibling stack. S10 can
guarantee `runtime.resource-command` precedes cleanup on both tiers. The supervisor must preserve
S9-before-S10 ordering when the stacks meet; Phase A does not import or cherry-pick S9.
