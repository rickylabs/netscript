# Plan

## Profile

- Package archetype: Archetype 2 (integration), documentation-only description of `packages/mcp`
- Overlay: `SCOPE-docs.md`
- Doctrine verdict: Keep
- PLAN-EVAL: N/A — the issue fixes a mechanical table shape and the sole policy judgment is
  evidence-checkable from `deno doc --json`.

## Locked decisions

1. Add exactly the requested three-row summary table before the unchanged CLI subsection.
2. Adopt MCP into `AUTHORITATIVE_MAPPING` with `entrypoints-only`, naming concrete symbol gaps.
3. Regenerate the three derived corpora in the requested order.

## Open-decision sweep

No decisions remain open. Expanding per-symbol documentation is explicitly deferred and would not
alter this slice's implementation.

## Slice

1. Prove all MCP entrypoints are checker-visible while preserving honest symbol-coverage scope;
   change the MCP reference, drift mapping, generated corpus chain, and run artifacts; prove with
   the assignment's complete gate list.

## Risks

- Generated drift: regenerate in the specified order and run all three generated-asset checks.
- False complete coverage: use `entrypoints-only` and cite measured omissions.
- Lock churn: compare `deno.lock` directly with `origin/main` before handoff.

## Deferred scope

Package source changes, new per-symbol sections, and the other #1777 packages remain out of scope.
