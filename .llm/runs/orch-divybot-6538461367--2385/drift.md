# Drift

- Environment: RTK absent; direct bounded commands used. Prior docs-run memory already records this limitation.
- Owner overrides: fixed existing dispatcher branch name retained; feature-tier evaluation with explicit Claude model and high effort; no labels/milestones changed; PR starts with Refs URL, never a closing keyword; local scaffold.runtime prohibited.
- Privacy: published run artifacts use repo-relative paths and omit private runtime identifiers. Raw evaluator transport data stays outside tracked source.
- Potential scope conflict: docs source changes stale the generated CLI prose carrier, but packages/** is prohibited. Preserve freshness checks and report this if encountered.

- Validation environment: root lint config excludes .llm tools. The first structured lint invocation correctly refused 4 excluded inputs. Passing an isolated empty lint config explicitly to the same wrapper checked all four inputs and passed without suppressions.
- Validation environment: existing Git-probe test could not execute its shebang from the default temporary mount (23 passed, 1 failed). Re-running under an executable project-run TMPDIR is the scoped environment correction; no test weakening.
- Public CLI proof setup: compilation passed. Compiled init failed on a missing optional Rollup module; unchanged public source init passed. No runtime services were started.
- Historical S1 finding (resolved by the S2 amendment below): confirmed generated agent-docs freshness red: read-only build-agent-docs-bundle.ts --site-dir docs/site/_site --check exits 1 for agent-docs-prose.generated.ts. The required quality gate remains intact; carrier refresh is outside this lane.

## CI close-gate follow-up

The owner subsequently instructed: “New activity on your PR — address each item, push fixes, keep the PR green: CI close-gate: FAILURE”. This is treated as authorization for the mechanically necessary generated docs-carrier refresh under packages/cli, superseding the earlier source-only lane restriction for that generated payload only. No CLI/runtime implementation, lockfiles, labels or milestones are in the expanded surface.

The failing close-gate annotation identified the unchecked PR Definition-of-Done item combining carrier refresh with “required CI green”. That clause was also circular: close-gate itself is required CI. Replace the compound claim with the independently provable carrier-freshness result; retain required CI as its own enforced merge prerequisite and report its live state separately. No issue acceptance is removed or weakened (the issue has no checkboxes).

## Rebase follow-up

Owner instruction: “merge-conflict: rebase onto the latest base branch, resolve conflicts, force-push.” This explicitly supersedes the earlier no-force-push instruction for this rebase; push with an exact expected-head lease to preserve any intervening remote work.

New base: `6b7f152f6ac2bbdddcd5f4eb896b3d9f8aaf2db4` (Fresh UI registry v2 publishing and CLI parity). The sole merge conflict is the generated CLI prose carrier. Retain the new base's carrier as the preservation input, rebuild the merged docs site, then regenerate from source instead of manually merging compressed data. The existing plugin-update implementation and regression policy do not change. Previous SHA-specific final verdicts and CI snapshots are superseded; re-evaluate the new pushed head in the same independent session.
