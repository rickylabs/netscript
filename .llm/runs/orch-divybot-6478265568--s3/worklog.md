# Worklog

## Design

1. Public surface: documented `@netscript/fresh-ui/contracts`, serializable per-component contracts, data attributes on shipped markup, `netscript ui:migrate variants`.
2. Domain vocabulary: contract = shared prop/anatomy/attribute/accessibility interface; style = implementation preserving that interface; part = stable kebab-case anatomy; axis = independent attribute dimension; planned = specified but not implemented in Utility.
3. Ports: Preact rendering, browser computed styles, existing CLI app-root and filesystem ports. Contract data has no IO.
4. Constants: contract vocabulary and legacy modifier-to-attribute mappings centralized; defaults explicit. No listener-based state synchronization.
5. Commit slices: format → category contracts → component migration → CLI migration → render/parity/consumer proof. See plan for owned files and gates.
6. Deferred scope: gap components, token changes, non-Utility styles and S2 registry work, per owner instruction.
7. Contributor path: `packages/fresh-ui/src/contracts/README.md` explains adding a contract and style fixture.

## Routing override (verbatim)

“Run PLAN-EVAL before implementing and IMPL-EVAL after, both with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only. Fix once, record both verdicts.”

## Bootstrap

Read the complete assignment, prior S0/S8 memory, harness/doctrine/CLI/PR/tooling/JSR guidance and full component spec. Queried matrix feature row. Consulted NetScript MCP. No duplicate implementation found. Implementation has not started; PLAN-EVAL pending.
