# Architecture Debt Registry

`arch-debt.md` is the persistent registry for acknowledged doctrine violations
that cannot be resolved in the current run.

## When to Add an Entry

Add or update a debt entry when a package/plugin violates the doctrine and the
current run will not fix it. Examples:

- a file exceeds the F-1 threshold,
- a package retains a forbidden folder name,
- a runtime package lacks a complete stop/cancellation path,
- a package remains in `Refactor`, `Restructure`, or `Rewrite` verdict.

## Entry Rules

Every entry must include:

- package or file,
- AP code or doctrine reference,
- reason,
- owner,
- target,
- linked plan,
- created date,
- status.

Entries without a time-bounded target are evaluator findings.

## Closing Entries

Close an entry only when the violating condition is fixed and the relevant gate
passes or is no longer applicable. Do not delete closed entries unless a later
cleanup plan explicitly says to compact the registry.
