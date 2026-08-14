# Context pack — comparison docs programme #1551

## Current state

Phase: formal PLAN-EVAL cycle 1 passed; S1 implementation and its corrected `S1-method-nav` gate
are complete. S2/S3 have not started. This pack is being committed in the S1 slice before the
required explicit push and structured PR handoff.

Branch/worktree: `docs/comparison-docs-programme` in
`/home/codex/repos/netscript-007-docs-comparison`, no upstream. The re-baselined branch/remote head
before S1 edits is `a790e91e26a4fb84636b4f3c57bd6444196b4ca9`; immutable product baseline remains
`01e0960494c95ce56eb35892c211a095eb13e6ed`.

Push form only:

```text
git push origin HEAD:refs/heads/docs/comparison-docs-programme
```

## Locked scope

- comparison methodology plus minimum navigation;
- one evidence-backed, explicitly deferred NetScript-versus-Next.js Session case;
- one Migrate-from-Next.js placeholder/roadmap;
- follow-ups #1645–#1650 for every residual;
- run artifacts and focused docs evidence tooling only.

No packages/plugins, locks/dependencies, consumer code copy, publication/release, scaffold/E2E, central issue mutation, ready transition, merge, or self-certification.

## Corrections the next session must retain

- PLAN-EVAL cycle 1 is an external `PASS` on plan head
  `d35cbca30872d1f55118d63437638e93270c2ac3`, recorded by evaluator-only commits `9ae97c934` and
  `a790e91e2`. The evaluator was a fresh native Claude Opus 5/low opposite-family session and did
  not consult the generator; this is authority to implement, not generator certification.

- The EIS-Chat authority is only commit `5191de83f3da97559f21d8891c6c8afdf1cf473a`; its Session route uses `ctx.path`, generated route binding, stable generated-route aliases, an `entries` resource, cached entry reads, and three authoritative partial routes.
- Context/MCP topology I/O lives in the context partial, not a page-level resource.
- `defineRegion` and generic region presentation are consumer-local, not NetScript exports.
- The consumer pins NetScript `0.0.6` and Fresh `^2.3.3`; do not relabel it as 0.0.7 behavior.
- Provisional #1551 LOC/ASC estimates are discarded.
- Next.js is pinned to exact stable `16.3.0`. Cache Components are opt-in. Its `stale`, `revalidate`, and `expire` clocks, tag invalidation, Suspense, parallel-route failure isolation, and RSC transport must remain distinct.
- Ordinary sibling components do not by themselves prove independent error isolation; the inspected closest mechanism is parallel-route slots with scoped error files.
- Private code/CSS/fixtures never enter the repository. Publish identifiers, classifications, procedures, and aggregates only.

## Planned slices

- S1: `_data.ts`, xrefs, comparison index/methodology, worklog/context, plus the specifically
  authorized significant/no-rescope `drift.md` correction. Complete at handoff.
- S2: measurement tool/test, immutable source manifest, aggregate JSON, worklog/context.
- S3: Session case, migration index/roadmap, xrefs/index, worklog/context, full docs audit. S3
  inherits the `/migration/` rendered-root assertion and must assert both `/comparisons/` and
  `/migration/` after its two migration pages land.

Every slice is under 30 files, has a named gate, commits its worklog/context update, pushes explicitly, and posts a structured draft-PR comment.

## GitHub state

- Parent #1551 remains open and unchanged in 0.0.7.
- Closure phrase: `Part of #1551`; no closing keyword.
- Residual issues: #1645 runnable fixture, #1646 type/LSP, #1647 runtime/freshness, #1648 discovery studies, #1649 post-Session backlog, #1650 full migration map.
- Draft PR: #1652 remains draft against `main`; the topic orchestrator moved it to exactly one
  `status:impl`. The generator made no label, draft-state, body-checkbox, issue, or milestone
  mutation in this turn.

## Next authorized action

After the S1 commit, explicit push, and structured PR comment, stop for topic-orchestrator Tier-A
slice review. Do not begin S2 or S3 without a new authorization. Do not treat the external
PLAN-EVAL PASS or the generator's gate report as self-certification.
