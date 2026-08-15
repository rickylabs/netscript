# Context pack — comparison docs programme #1551

## Current state

Phase: S1 is signed off by the topic orchestrator at
`98fc58997c3ff5ca21403ba67521c584a5d26a0e`. The coordinator provisioned the exact immutable S2
input, and the S2 tool, tests, manifest, and aggregate have completed their applicable gates. The
topic orchestrator ruled the literal lint row N/A because root configuration deliberately excludes
`.llm/**`; the wrapper's raw exit `2` remains recorded as fail-closed evidence, not as a pass, skip,
or waiver. S2 stops for Tier-A review. S3 has not started.

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
- S1 must reference only pages that exist in S1. All `/migration/` navigation, xrefs, and body or
  next/previous links land in S3 with `docs/site/migration/index.md` and
  `docs/site/migration/nextjs.md`.
- `S1-method-nav` now runs `rtk proxy deno task --cwd docs/site check:links` immediately after the
  site build. The build and repository-level `docs:links` task do not replace this rendered-site
  link proof.
- The S2 lint row is N/A: root `deno.json` deliberately excludes `.llm/**` repo-wide, and the exact
  wrapper therefore exits `2` instead of manufacturing a false green. Do not borrow a docs-site
  config or change root configuration to make the row appear applicable.

- The EIS-Chat authority is only commit `5191de83f3da97559f21d8891c6c8afdf1cf473a`; its Session route uses `ctx.path`, generated route binding, stable generated-route aliases, an `entries` resource, cached entry reads, and three authoritative partial routes.
- Context/MCP topology I/O lives in the context partial, not a page-level resource.
- `defineRegion` and generic region presentation are consumer-local, not NetScript exports.
- The consumer pins NetScript `0.0.6` and Fresh `^2.3.3`; do not relabel it as 0.0.7 behavior.
- Provisional #1551 LOC/ASC estimates are discarded.
- Next.js is pinned to exact stable `16.3.0`. Cache Components are opt-in. Its `stale`, `revalidate`, and `expire` clocks, tag invalidation, Suspense, parallel-route failure isolation, and RSC transport must remain distinct.
- Ordinary sibling components do not by themselves prove independent error isolation; the inspected closest mechanism is parallel-route slots with scoped error files.
- Private code/CSS/fixtures never enter the repository. Publish identifiers, classifications, procedures, and aggregates only.

## Planned slices

- S1: `_data.ts`, xrefs, comparison index/methodology, worklog/context, plus the authorized
  significant/no-rescope `drift.md` corrections. The Tier-A fix removes premature migration
  references and adds the rendered-link gate; complete at handoff for re-review.
- S2: measurement tool/test, immutable source manifest, aggregate JSON, worklog/context, plus the
  significant/no-rescope lint-applicability drift record; complete at handoff for Tier-A review.
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

Commit and explicitly push the complete seven-path S2 slice, post one structured implementation
comment on draft PR #1652, then stop for topic-orchestrator Tier-A review. Do not begin S3 or treat
the generator's gate execution as certification. Keep `/home/codex/repos/eis-chat-007-input`
strictly read-only.
