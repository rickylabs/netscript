# Plan

## Scope and doctrine

- Profile: `SCOPE-docs`; the page describes the existing package public surface.
- Subject archetype: Archetype 3 (runtime/behavior), descriptive context only because no package
  source or export map changes.
- Doctrine: A1/A2/A14 and `02-public-surface.md`; published entrypoints and their reference mapping
  must remain explicit and mechanically checked.
- Current doctrine verdict and debt are unchanged; no new or deepened debt is expected.

## Locked decisions

1. Rename only `## Entrypoints` to `## Exports`; preserve all seventeen table rows and other page
   content.
2. Add only `plugin-workers-core` to `AUTHORITATIVE_MAPPING`.
3. Use `entrypoints-only` based on the measured symbol gaps in `research.md`.
4. Regenerate the three derived corpora in the issue-specified order.

## Open-decision sweep

No open decision remains. Package source changes, symbol-table restructuring, `plugin-sagas-core`,
and `fresh` are deferred and out of scope.

## Slice

S1 proves the existing seventeen-entrypoint table is checker-visible, carries an honest coverage
policy, and has current derived corpora. It changes the page heading, mapping, generated outputs,
and this run directory; the issue-specified docs and generated-corpus gates prove it.

## Risks

| Risk | Mitigation |
| --- | --- |
| Overclaiming complete symbol coverage | Compare every entrypoint with the entire page before selecting the mode. |
| Accidental table/prose churn | Inspect the page diff and require only the heading line to change. |
| Generator drift | Run the three generators in the exact required order, then all check tasks. |
| Scope creep | Reject changes to package source and the other #1777 packages. |

## PLAN-EVAL

N/A — this is a mechanical, single-page fix with scope, contract, acceptance, and gates locked by
issue #1812; the only judgment call was resolved by the reproducible symbol audit in `research.md`.
