# Drift — comparison docs programme #1551

Append-only.

## 2026-08-13 — carried provisional Session baseline corrected before planning

The live #1551 comment's provisional sketch diverges materially from EIS-Chat commit `5191de83f3da97559f21d8891c6c8afdf1cf473a`: route context access, resource ownership, cache-read flow, generated-route aliases, authoritative partial ownership, and local presentation helpers differ. Its LOC/ASC values were estimates.

Disposition: no implementation drift. Research was re-baselined to the immutable source; estimates were discarded; private contents remain excluded; the plan pins exact evidence inputs and exposes absent measurements. No coordinator rescope is required.

## 2026-08-15 — S1 rendered-navigation assertion deferred to its owning slice

Severity: **significant** — plan-acceptance correction. Rescope: **none**. Scope growth: **none**.

The approved plan assigned `docs/site/migration/index.md` and
`docs/site/migration/nextjs.md` to S3, while S1's manual gate required both
`/comparisons/` and `/migration/` roots to render under Concepts. Folder-derived
navigation cannot render the migration root before its S3-owned index exists, so
that S1 assertion was unsatisfiable from S1's own six-file list. The contradiction
was in the approved acceptance text, not in the implementation boundary.

Topic orchestrator `topic-docs-0.0.7` ruled that S1 asserts only
`/comparisons/` and `/comparisons/methodology/` under Concepts. S3 inherits the
`/migration/` rendered-root assertion and must assert both comparison and migration
roots after it lands the two migration files. No migration content moves into S1.

Formal PLAN-EVAL cycle 1 returned `PASS` on evaluated head `d35cbca30` without
detecting this inconsistency. Recording the miss here keeps it visible to later
IMPL-EVAL rather than burying it in the corrected gate result.

## 2026-08-15 — S1 dangling migration references and link-gate gap corrected

Severity: **significant** — plan-acceptance and gate-coverage correction. Rescope:
**none**. Scope growth: **none**; the fix strictly reduces what S1 publishes.

S1 commit `3a8c73841` shipped four references to a non-existent `/migration/`
root: the Concepts root list, the `migration:index` xref, a comparison-index body
link, and the methodology next-page link. S3 owns the migration pages, so none of
those references could resolve in S1.

The original S1 gate could not detect the defect. Its site `build` checks source
format and selected rendered-output semantics, while the rendered internal-link
checker `check:links` appeared only under the S3 `verify` gate. The repository-level
`docs:links` source check also passed the dangling rendered targets.

Tier-A review required S1 to remove all four references and amended
`S1-method-nav` from now on to run
`rtk proxy deno task --cwd docs/site check:links` immediately after `build`.
S3 retains ownership of the migration pages, xrefs, navigation, and both-root
rendered assertion. Formal PLAN-EVAL cycle 1 passed over both the premature
references and the insufficient S1 link gate; this entry keeps both misses visible
to later IMPL-EVAL.

## 2026-08-15 — S2 pinned local input is unavailable

Severity: **significant** — implementation precondition missing. Status: **blocked**.
Rescope: **none**. Scope growth: **none**.

The approved S2 design requires an authorized local EIS-Chat root whose repository
revision is exactly `5191de83f3da97559f21d8891c6c8afdf1cf473a` before the measurement
tool reads any file. The available read-only checkouts were at `aeaf2df5…`,
`5fdff778…`, and `a08ebe55…`; a bounded filesystem search found no checkout at the
required revision, and the two obvious EIS-Chat object stores did not contain the
required commit object.

The revision is not lost or rewritten. The topic orchestrator independently
verified that `git ls-remote origin` on the authorized
`https://github.com/rickylabs/eis-chat.git` remote reports the pinned commit as
both `HEAD` and `refs/heads/master`; the local clones are parked on other branches
and have never fetched that tip.

The missing input follows from the approved plan itself rather than from remote
availability. `research.md:51` records that the private repository was inspected
only through authorized GitHub access at the immutable commit and that no checkout
was made. The S2 tool contract then requires an authorized local root, but no slice
creates one. Formal PLAN-EVAL cycle 1 passed over that unsatisfied dependency.

S2 stopped before reading consumer files or creating the tool, manifest, or
measurements. No fetch, checkout, clone, worktree creation, private-source copy, or
other attempt to materialize the missing revision was made. Truthful aggregate
reproduction requires an already-authorized local root at the pinned revision; a
different revision or network-derived estimate cannot satisfy the evidence contract.
