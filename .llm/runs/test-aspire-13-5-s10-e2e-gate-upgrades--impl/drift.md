# Drift — S10 #1722

## D-01 — `rtk` is absent on the authoritative host

The repository guidance prefers `rtk`, but the executable is not on PATH. Focused raw `git`/`rg`
reads replace it. Durable verdicts still come from the structured Deno wrappers, so this is an
environment/tooling presentation drift only.

## D-02 — S7 ownership contract is not in this branch ancestry

The post-stop probe mirrors S7 pending S7's merge. Authority is
`origin/fix/aspire-13-5-s7-teardown-leak-check:.llm/tools/agentic/teardown/probes.ts`: the
`ASPIRE_MOUNTS` label at line 8, DCP environment key at lines 11-12 and 116-123, exact AppHost argv
at lines 107-113, and `aspire-managed`/`dcp` identities at lines 99-104. Boundary-safe containment
comes from `ownership.ts:70-132`. S10 duplicates only the contract inside `packages/cli/e2e`; it
does not copy S7 commits or import `.llm/tools`.

## D-03 — S9 runtime gate is not in S10 ancestry

The dispatched branch is explicitly based on S8 `9dd06647`, while S9 is a sibling stack. S10 can
guarantee `runtime.resource-command` precedes cleanup on both tiers. The supervisor must preserve
S9-before-S10 ordering when the stacks meet; Phase A does not import or cherry-pick S9.

## D-04 — Explicit skip exit is a gate-edge doctrine warning

`arch:check` exits zero but its broad A13 heuristic reports `Deno.exit` in
`e2e/src/application/gates/scaffold/runtime/evidence/resource-command.ts`. This is intentional IO at
the executable gate edge: exit 75 is the existing `CommandGateSkipPolicy` contract that turns an
absent `runtime.aspire-start` receipt into a visible `skipped` gate verdict. Replacing it with a
throw would erase the required skip semantics. The domain parser and command contract remain pure;
there is no exit in framework/domain code.

## D-05 — Phase-A cleanup does not claim S7's complete live ownership registry

IMPL-EVAL cycle 1 corrected the container ownership root from `dirname(appHost)` equality to S7's
path-containment rule under `projectRoot`. The live S10 probe still records `processes: []`, and a
creator-process label alone remains unproven because S7's PID/start-time registry is not in this
branch ancestry. Env/argv process rules and creator-only behavior are fixture-tested. Phase B must
capture live process evidence and retain zero owned containers; S7 integration later supplies the
stable registry identity without importing `.llm/tools` into the E2E package.

## D-06 — Named 13.5.3 capture does not end with Healthy postgres evidence

Cycle-2 steering requested that the full named capture prove postgres converges Healthy. The exact
18-line file (SHA-256 `36fe0e3329455d38234d3b44cde28c9ff13eaf6ca180c8f1f66108a722554549`)
instead ends postgres at `Running`, `healthStatus: Unhealthy`, and
`postgres_check.status: Unhealthy`. Its web report is the observation that transitions from an
omitted status to `Healthy`. The fixture remains an unmodified copy: tests prove pending parsing,
last-seen Healthy convergence on the web report, and fail-closed non-convergence on postgres rather
than manufacturing evidence or weakening the health gate.

## D-07 — Initial follow parser modeled observations instead of the nullable DTO boundary

Three hosted runs successively exposed wrapper, nullable report-status, and nullable resource-state
assumptions. The cycle-3 correction replaces field-by-field patching with a `DescribeResourceLine`
contract covering all nullable root `ResourceJson` properties from Aspire v13.5.3. Gate behavior
interprets only identity, state, health status, and health reports; all other DTO fields are optional
and ignored. The stable `displayName`-first identity preference remains deliberate because real
Aspire instance `name` values carry generated suffixes while suite expectations use display names.
