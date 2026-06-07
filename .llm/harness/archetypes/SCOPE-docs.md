# Scope Overlay — Docs

Use this overlay for RFCs, README files, knowledge-base pages, harness docs, run artifacts, and
doctrine-facing documentation.

## Doctrine Boundary

Docs may describe either current state or doctrine target state. Keep those separate:

- `.claude/` describes current repo reality and points to doctrine status.
- doctrine files define package/plugin target rules.
- harness files describe agent operating procedure.
- run artifacts describe one run.

## Additional Read First

- current authoritative doc being changed
- source code, package README, RFC, or run artifact the doc must match
- doctrine file and section when the doc references package/plugin rules
- `../DOCTRINE-REF.md`

## Additional Gates

| Gate             | Requirement                                                     |
| ---------------- | --------------------------------------------------------------- |
| Source alignment | Every prescriptive claim points to doctrine, RFC, or code       |
| Scope separation | Current-state docs do not silently become target-state doctrine |
| Link integrity   | Referenced local paths exist                                    |
| Terminology      | Names match doctrine and `.claude/09-glossary.md`               |
| Drift log        | Material mismatch is recorded in run `drift.md`                 |

## False-Done States

- Polished prose duplicates doctrine instead of referencing it.
- A README declares compliance while `arch-debt.md` still has open entries.
- Knowledge-base docs describe only current state and omit doctrine status.
- Harness docs grow into a second doctrine.

## Rescope Triggers

- The doc cannot be accurate without a code audit.
- A knowledge-base update discovers stale architecture claims.
- A docs request reveals a doctrine conflict that needs a new plan.
