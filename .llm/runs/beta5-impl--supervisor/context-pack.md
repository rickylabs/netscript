# Context Pack - beta5-impl--supervisor

## Current State

- Branch: `chore/303-enterprise-surface-sweep`.
- Baseline: `1c1759908e99c68a3bb0cccfd7a35aeafd8d40e0`.
- Scope: issue #303 remainder only - full-export-map doc-lint sweep, publish dry-run cleanliness,
  trivial type-soundness residue checks.
- Draft PR: #483 (`https://github.com/rickylabs/netscript/pull/483`).

## Locked Constraints

- Use `Refs #303`, not a closing keyword.
- No new `--allow-slow-types`; preserve the `86eca907` oRPC-bound carve-out.
- No stale-file deletion.
- No DB/AI/doctrine-prose work.
- No `deno task e2e:cli`.
- No `deno.lock` churn.
- Push only with explicit refspec:
  `git push origin HEAD:refs/heads/chore/303-enterprise-surface-sweep`.

## Next Steps

1. Run separate PLAN-EVAL.
2. After PASS, run doc-lint inventory and fix package clusters in reviewable slices.

## Open Questions

- Requested labels `area:packages`, `priority:high`, and `epic:road-to-stable` are absent from the
  current repository label set. Applied existing labels `type:chore`, `area:plugins`, `gate:jsr`,
  `priority:p1`, and `status:impl`; milestone `0.0.1-beta.5` is set.
