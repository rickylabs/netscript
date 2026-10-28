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

## Slice 1 — contract format

PLAN-EVAL round 2 PASS before product implementation. Added explicit documented readonly contract types and pure JSON serialization on ./contracts. No runtime implementation imports or dependencies. Format/serialization tests and scoped check/lint/fmt pending; separate review pending.

Slice 1 terminal: separate Claude review FAIL_FIX repaired once → PASS; scoped test (1 passed), check/lint/fmt and quality:gate all exit 0. Published contributor guide included; full metadata round-trip covered. Reconciled against bootstrap head; no registry/lock changes.

Slice 2: 87 typed catalog entries (66 shipped + 21 approved Figma-category designs), JSON export, coverage/consistency/serialization tests. Source files partitioned into category groups capped below 500 lines; exceeds the target file count because explicit data stays readable. Gate and review pending.

Slice 2 terminal: catalog tests 4/4 PASS; scoped check/lint/fmt and quality:gate exit 0. Separate reviewer FAIL_FIX keyboard findings repaired once → PASS. CI docs export/symbol omission corrected; targeted Fresh UI docs drift checker PASS. Reconciled source catalog and JSON; no lock changes. Next: source migration and parity.
