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

## 2026-08-15 — S2 lint gate excludes its own approved files

Severity: **significant** — gate-coverage correction required. Status: **blocked**.
Rescope: **none**. Scope growth: **none**.

After the coordinator provisioned the exact read-only EIS-Chat input, S2 created the
approved tool, test, manifest, and derived aggregate. The literal approved lint gate
selected both `.llm/tools/docs/measure-comparison-surface*.ts` files, but root
`deno.json` excludes `.llm/` from `deno lint`. Deno therefore reported “No target
files found”; the structured wrapper correctly refused a false green and exited `2`
with one excluded batch and no lint occurrences.

A diagnostic rerun using the existing `docs/site/deno.json` via the wrapper's
documented `--config` option selected both files and exited `0` with zero findings.
That proves the sources are lint-clean under an existing config, but it cannot be
substituted for the mandatory command without topic-orchestrator authority. Changing
root config or adding another config file would exceed the approved S2 file list.

Formal PLAN-EVAL cycle 1 passed over the incompatibility between the S2 file paths
and its lint command. S2 stopped without a commit, push, PR comment, root-config
change, or S3 work pending a gate correction.

## 2026-08-15 — S2 lint row ruled not applicable

Severity: **significant** — gate-applicability correction. Status: **resolved for
S2**. Rescope: **none**. Scope growth: **none**.

Topic orchestrator `topic-docs-0.0.7` independently reproduced the exact lint
command's raw exit `2` with two selected files and one excluded batch, then ruled
the row **N/A — not applicable**. Root `deno.json` deliberately excludes `.llm/`
from lint coverage repo-wide; there is no `.llm/deno.json`, and CI does not lint
`.llm/tools`. The wrapper therefore worked as designed by failing closed instead
of reporting a false green. The result is not recorded as passed, skipped, or
waived.

No alternate config is used as gate evidence, and root lint configuration remains
unchanged. Formal PLAN-EVAL cycle 1 passed over this incompatibility. The correction
changes only the applicability of an unsatisfiable gate row; it does not change the
S2 files, evidence contract, milestone scope, or planned S3 work.

## 2026-08-15 — canonical case comments corrected at the unchanged pin

Severity: **significant** — public evidence correction. Status: **resolved in E0**.
Rescope: **none**. Scope growth: **none**.

The two canonical #1551 case comments described older inspected snapshots even though the locked
EIS-Chat pin itself remained current. Read-only verification established that local `HEAD` and
`origin/master` are still `5191de83f3da97559f21d8891c6c8afdf1cf473a`; no newer product commit
exists. Commit `834a2b36a5c9ef4acf82f8f1f400522d8dab234b` resolves to the same tree as the
pin and is evidence-only, not a replacement baseline.

Focused source inspection confirmed the pinned examples already contain the material improvements
that the old comment prose omitted: generated route contracts, route-bound partials, typed document
form navigation, cache-seed preservation across partial navigation, layout-faithful deferred states,
and cold-navigation stabilization. The primary Session route is `94 / 92` physical/nonblank lines
at the pin, versus the comment's published `119 / 117` claim and the inspected `121 / 119` snapshot.
The Channel route is `181 / 178`, versus `208 / 204` at the inspected snapshot.

Owner authority required complete in-place replacement of comments `5265826161` and `5265971722`.
The definitive bodies use minimal current illustrative excerpts, enumerate the inspected surfaces,
distinguish framework capability from consumer ownership, remove unreproducible ASC/feature/effort
estimates, and keep the Next.js `16.3.0` comparison tied to primary documentation. They contain no
business data, credentials, domain models, CSS, fixtures, or wholesale private-source dump.

The S2 manifest, measurement procedure, and measurement JSON already target the unchanged pin and
remain correct; manufacturing changes to them would reduce reproducibility, so they are deliberately
untouched. The current implementation does not break the approved equivalence contract, change the
mechanism-matrix shape, or invalidate the presentation/domain-held-constant premise. This correction
therefore needs no fresh PLAN-EVAL. S3 remained unstarted throughout.

## 2026-08-15 — S3 Concepts-root assertion requires `_data.ts`

Severity: **significant** — approved slice-boundary correction. Status: **resolved in S3**.
Rescope: **none**. Scope growth: **none**.

The S1 correction explicitly deferred the assertion that both `/comparisons/` and `/migration/`
render under Concepts until S3, when the migration pages exist. The approved S3 file list includes
the migration pages and xrefs but omits `docs/site/_data.ts`, the only source of the Concepts root
list. At the E0 baseline that list contains `/explanation/` and `/comparisons/` only, so the inherited
assertion is unsatisfiable without changing `_data.ts`.

Topic-orchestrator authority anticipated this exact divergence and required it to be recorded rather
than added silently. S3 therefore adds `/migration/` to the existing Concepts roots in `_data.ts`
alongside the pages that make the route resolve. This changes neither the approved information
architecture nor milestone scope; it is the minimum file needed to satisfy the already-approved
two-root acceptance statement. No package, plugin, lockfile, or additional content scope is added.
