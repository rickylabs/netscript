# Context pack — comparison docs programme #1551

## Current state

Phase: S1, S2, E0, and S3 landed and received topic-orchestrator Tier-A sign-off. Formal IMPL-EVAL
cycle 1 returned `FAIL_FIX` on `15429cf8487cfe3504ae0443fd435d2a72d4528b`; its five findings were
repaired at `c7ce58a19494024c219e9970deeb3ece878232d6` and signed off in comment `5300864119`. Formal
IMPL-EVAL cycle 2 returned `PASS` on that repaired source (evaluator-only commit
`71cc5a02cde091f862c9892464ea77cc962b3675`, verdict comment `5300916189`). No further evaluator
will run. This bounded merge-readiness cleanup corrects three non-blocking record findings before
topic-orchestrator Tier-A verification.

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
- `origin/master` has not advanced beyond that pin. `834a2b36a5c9ef4acf82f8f1f400522d8dab234b`
  has the same tree and is evidence-only, not a newer product baseline.
- Canonical comment `5265826161` is the definitive current Session analysis and was updated in place
  at `2026-08-15T05:53:57Z`; its evidence URLs are immutable `43c702b…` permalinks. Comment
  `5265971722` is the definitive current Channel/form analysis and was updated in place at
  `2026-08-15T05:53:58Z`; its `181 / 178` count is inspected, not measured, and its measured legend
  requires a published script, pinned inputs, raw aggregate output, and environment metadata. No
  follow-up comment was posted.
- Reproduced primary-route counts are Session `94 / 92` physical/nonblank (published claim
  `119 / 117`, inspected snapshot `121 / 119`) and Channel `181 / 178` (formerly `208 / 204`).
- The pinned examples now prove generated route contracts, route-bound partials, layout-faithful
  deferred fallbacks, cache-seed preservation across partial navigation, typed document form
  navigation, and cold-navigation stabilization. Framework capabilities remain distinguished from
  consumer-owned helpers and presentation.
- Context/MCP topology I/O lives in the context partial, not a page-level resource.
- `defineRegion` and generic region presentation are consumer-local, not NetScript exports.
- The consumer pins NetScript `0.0.6` and Fresh `^2.3.3`; do not relabel it as 0.0.7 behavior.
- Provisional #1551 LOC/ASC estimates are discarded.
- Next.js is pinned to exact stable `16.3.0`. Cache Components are opt-in. Its `stale`, `revalidate`, and `expire` clocks, tag invalidation, Suspense, parallel-route failure isolation, and RSC transport must remain distinct.
- Ordinary sibling components do not by themselves prove independent error isolation; the inspected closest mechanism is parallel-route slots with scoped error files.
- Private code/CSS/fixtures never enter the repository. Publish identifiers, classifications, procedures, and aggregates only.
- The owner-authorized comments use only minimal illustrative current excerpts and contain no
  business data, credentials, domain models, CSS, fixtures, or wholesale source dumps.
- The correction does not change the equivalence contract, matrix shape, or held presentation/domain
  premise. No fresh PLAN-EVAL was required; E0 is signed off.
- The public Session case matches canonical comment `5265826161`: exact pin, measured `94 / 92`
  primary route, current feature inventory and ownership, evidence labels, and deferred owners.
- Every number in the case is carried from the S2 manifest/aggregate. The complete included total is
  `5 / 325 / 307 / 14 / 2,669` for files/physical/nonblank/comment/tokens; Next.js remains an absent
  source with every static measurement deferred.
- Evidence tool `1.1.0`, the manifest, and the aggregate carry `frameworkVersions`, `featureFlags`,
  and `inspectedAt`. Running the documented tool with `--observed-at 2026-08-15T03:57:30Z` and then
  comparing its output with the checked-in aggregate using `cmp` reproduces byte-identical output
  (raw `cmp` exit `0`). No normalized digest is used as evidence.
- The case and Session comment link the evidence through prerequisite commit `43c702b…`, never a
  mutable branch ref or the superseded `4e6d52b…` evidence version. The matrix heading is
  `Residual owner`, matching the methodology.
- S3 adds the case-proven migration placeholder only. Full concept parity remains with #1650.
- Both `/comparisons/` and `/migration/` render under Concepts. S3 had to touch `docs/site/_data.ts`
  because the approved S3 list omitted the sole Concepts-root registry; the anticipated significant,
  no-rescope/no-growth correction is append-only in `drift.md`.

## Planned slices

- S1: `_data.ts`, xrefs, comparison index/methodology, worklog/context, plus the authorized
  significant/no-rescope `drift.md` corrections. The Tier-A fix removes premature migration
  references and adds the rendered-link gate; complete at handoff for re-review.
- S2: measurement tool/test, immutable source manifest, aggregate JSON, worklog/context, plus the
  significant/no-rescope lint-applicability drift record; complete at handoff for Tier-A review.
- E0: in-place canonical-comment correction plus research/plan/worklog/context/drift reconciliation;
  complete at handoff for Tier-A review, with S2 evidence files deliberately untouched.
- S3: Session case, migration index/roadmap, xrefs/index, worklog/context, full docs audit. S3
  inherits the `/migration/` rendered-root assertion and must assert both `/comparisons/` and
  `/migration/` after its two migration pages land. Complete at handoff, including the anticipated
  `_data.ts` plus `drift.md` correction.

Every slice is under 30 files, has a named gate, commits its worklog/context update, pushes explicitly, and posts a structured draft-PR comment.

## GitHub state

- Parent #1551 remains open and unchanged in 0.0.7.
- Closure phrase: `Part of #1551`; no closing keyword.
- Residual issues: #1645 runnable fixture, #1646 type/LSP, #1647 runtime/freshness, #1648 discovery studies, #1649 post-Session backlog, #1650 full migration map.
- Draft PR: #1652 remains draft against `main`; the topic orchestrator moved it to exactly one
  `status:impl`. The generator made no label, draft-state, body-checkbox, issue, or milestone
  mutation in this turn.

## Next authorized action

Commit and explicitly push the merge-readiness record cleanup, replace the bad digest in draft PR
#1652's body, tick only the already-proven Tier-A cycle-1-repair checkbox, and post one structured
cleanup comment. Then stop for topic-orchestrator Tier-A verification. Keep the PR draft at
`status:impl`, preserve `Part of #1551`, and make no readiness disposition, further evaluation, or
other checkbox change. Keep `/home/codex/repos/eis-chat-007-input` strictly read-only.
