**[PHASE: IMPL-EVAL] [VERDICT: PASS]**

# IMPL-EVAL cycle 2 — Aspire Deno runtime / NuGet research

## Metadata

| Field                    | Value                                                                                  |
| ------------------------ | -------------------------------------------------------------------------------------- |
| Run                      | `research-aspire-deno-runtime-path--1227-adjacent`                                     |
| Target                   | Draft PR [rickylabs/netscript#1307](https://github.com/rickylabs/netscript/pull/1307)  |
| Baseline                 | `00f96af76e5825422e8bc716a9c27d4c13e16f7f`                                             |
| Requested inspected head | `c3a454da60f03b275eb2ed21b73d71dabbc983e7`                                             |
| Corrected research head  | `e20940838f2c55a65d27445d2e26f04919bffec0`                                             |
| Correction commits       | `9c4f29a5c85bbc950a42cec8c32092ebc0f265ed`, `e20940838f2c55a65d27445d2e26f04919bffec0` |
| Research blob            | `9d3f3f84336845a13c93389818e8b4566000f8fb` at both `e20940838...` and `c3a454da...`    |
| Archetype / overlay      | Archetype 6 subject; `docs`-only changeset                                             |
| Evaluator route          | `openai / gpt-5.6-sol / xhigh`                                                         |
| Evaluator session        | `019fcf98-e1a7-78d2-8066-54076d83d01a`                                                 |
| Evaluation date          | 2026-08-05                                                                             |
| Check mode               | Bounded and read-only except replacement of this verdict artifact                      |

This evaluator session is distinct from the research author/supervisor session
`019fcf6d-f2d4-7fa1-b97a-a50bdd98ec0c`. The requested head adds the cycle-one evaluator artifact
after `e20940838...`; it does not change the corrected `research.md` blob.

During the read-only PR metadata check, the live PR head had advanced to
`d3deb1ccececdebe8db5ffd233360c2cc342d09b`. The intervening commits add the cycle-two brief and
replace evaluator/worklog artifacts only; they do not change `research.md`. This verdict remains
commit-pinned to the user-requested `c3a454da...` head and its `e20940838...` research blob rather
than silently retargeting the evaluation.

## Verdict summary

No blocking findings remain. Both bounded corrections requested after cycle one are present,
accurate, and limited to evidence qualification. No further correction to `research.md` is required.

## Disposition of cycle-one blockers

### B1 — strength of #1308 evidence: RESOLVED

`research.md:14-18` now describes NetScript PR #1308's single fixed-daily restore as
**corroboration** of the #18958 diagnosis and **compatibility** evidence for running the unchanged
13.4.6 SDK graph through the repaired CLI. It retains the actual observation—exit 0 in 13.06 seconds
with no newly leaked helper—without converting that one result into reliability proof.

The same paragraph explicitly keeps five consecutive published-canary runs as the reliability
completion gate and states that one green restore cannot prove an intermittent failure absent. The
research therefore no longer overstates the fixed-daily probe, and #1227 remains open pending the
separate canary evidence owned by #1308.

### B2 — meaning of the 84-library first-party result: RESOLVED

`research.md:24-28`, the table at `research.md:123-131`, and the conclusions at
`research.md:145-150` consistently label 84 as the current `Aspire.Hosting.JavaScript@13.4.6`
**package-identity proxy** for the unreleased #18628 placement. They do not predict the exact stable
13.5 transitive graph.

The supported conclusion is narrower and correct: selecting the currently published JavaScript
package adds one direct integration package to the measured representative 13.4.6 graph, moving it
from 83 to 84 and therefore not creating a zero-NuGet path. The exact 13.5 total is explicitly
reserved for a cold fixture after matching stable CLI, SDK, and package versions are released
(`research.md:286-302`).

## Required acceptance checks

### 1. #18958 lifecycle fix versus Deno feature PRs — PASS

Live primary GitHub metadata on 2026-08-05 confirms:

- [microsoft/aspire#18958](https://github.com/microsoft/aspire/pull/18958) merged on 2026-08-03 and
  fixes the Aspire CLI's orphaned NuGet-search-helper lifecycle;
- [microsoft/aspire#18627](https://github.com/microsoft/aspire/pull/18627) remains open and concerns
  the TypeScript AppHost Deno toolchain resolver; and
- [microsoft/aspire#18628](https://github.com/microsoft/aspire/pull/18628) remains open and places
  first-party `AddDenoApp` / `DenoAppResource` support in `Aspire.Hosting.JavaScript`.

`research.md:9-18`, `research.md:191-210`, and `research.md:286-310` preserve those independent
lifecycles. The #1227 recommendation takes the CLI containing #18958 without waiting for either Deno
feature PR. A coordinated stable 13.5 upgrade is presented only as compatibility value if all three
changes ship, not as a prerequisite for the p0 reliability fix.

### 2. Deno export and runtime evidence — PASS

The corrections leave the validated Aspire 13.4.6 experiment intact (`research.md:47-83`): the
external `CommunityToolkit.Aspire.Hosting.Deno@13.4.0` export generated `addDenoApp`, `addDenoTask`,
and `withDenoPackageInstallation`; the fixture restored successfully; and a Deno 2.9.3 resource
reached Aspire's `up (running)` state.

Cycle two did not start or mutate an AppHost because the brief permits read-only checks only. The
runtime conclusion remains accepted because cycle one independently executed and inspected the
fixture, the correction commits do not alter that evidence, and the reproduction record remains at
`research.md:318-334`. The absent scratch cache in this evaluator worktree is retained as a residual
risk rather than papered over with a new mutable run.

### 3. NuGet package/version evidence and Archetype-6 conclusion — PASS

The official NuGet surface confirms `Aspire.Hosting.JavaScript` is a published 13.4.6 NuGet package
whose dependency list includes `Aspire.Hosting >= 13.4.6`. The seven recorded isolated assets graphs
define their metric precisely as unique `.libraries` identities and distinguish direct dependencies,
transitive identities, and illustrative cache sizes (`research.md:116-154`).

The `netscript-deno-toolchain` workspace dependency wrappers are `N/A` here: this run changes no
npm/JSR dependency, workspace import, package export, or published NetScript surface. The evaluated
dependency is a NuGet integration in an isolated Aspire-generated probe, so the retained
`project.assets.json` identities and official NuGet/first-party Aspire sources are the relevant
version evidence. No “latest stable” decision is inferred from `deno outdated --latest` or an ad hoc
registry query.

Under Doctrine A6/A7 and the Archetype-6 thin-router/upstream-first boundary, the dependency
conclusion is sound: do not add a third-party Toolkit package to solve a reliability failure it
cannot remove; retain the direct upstream primitive for #1227; reconsider the first-party package
later for feature/support value after released evidence. This avoids AP-2 helper renaming and AP-9
speculative integration seams. No architecture debt is introduced or deepened by the docs-only
changeset.

### 4. Scope, lock hygiene, citations, and PR semantics — PASS

| Check                         | Result  | Evidence                                                                                          |
| ----------------------------- | ------- | ------------------------------------------------------------------------------------------------- |
| Requested-head research blob  | PASS    | `e20940838...:research.md` and `c3a454da...:research.md` both resolve to blob `9d3f3f843...`      |
| Merge base                    | PASS    | `git merge-base 00f96af... c3a454da...` returned the requested baseline                           |
| Target diff scope             | PASS    | Baseline-to-`c3a454da...` paths are confined to the run directory                                 |
| Patch integrity               | PASS    | `git diff --check 00f96af... c3a454da...` exited 0 with no output                                 |
| Committed lock hygiene        | PASS    | Baseline-to-`c3a454da...` contains no `deno.lock` path                                            |
| Inherited local lock change   | PASS    | Existing modified `deno.lock` remains present and untouched                                       |
| Citation preservation         | PASS    | Corrections retain the primary GitHub, NuGet, Microsoft documentation, and review links           |
| PR file scope                 | PASS    | Live PR file list contains only `.llm/runs/...` artifacts                                         |
| Non-closing semantics         | PASS    | PR body uses `Refs #1227`; it contains no `Closes`, `Fixes`, or `Resolves` keyword for #1227      |
| PR taxonomy                   | PASS    | Exactly one `status:research`, namespaced type/area/priority labels, and explicit milestone 0.0.5 |
| Product/scaffold gates        | N/A     | No product source, scaffold output, manifest, public API, or generated consumer output changed    |
| Full CLI/scaffold runtime E2E | NOT_RUN | Explicitly prohibited and disproportionate for evidence-only research                             |

The user-owned `deno.lock` modification and pre-existing untracked evaluator-session record are
outside this verdict artifact. Neither was inspected as research evidence, modified, staged, or
included in the target commit.

## Process verification

| Check                                | Result                  | Evidence                                                                                      |
| ------------------------------------ | ----------------------- | --------------------------------------------------------------------------------------------- |
| Separate evaluator session           | PASS                    | Evaluator `019fcf98...` differs from research supervisor `019fcf6d...`                        |
| Plan-Gate                            | N/A — authorized waiver | `plan-eval.md` records D6 `COMPOSED_WAIVER` and explicitly does not claim evaluator PASS      |
| Design evidence contract             | PASS                    | `worklog.md` names the evidence vocabulary, ports, constants, S0/S1, and deferred source work |
| Correction delta                     | PASS                    | `e20940838...` changes qualification prose plus one worklog entry; no product file            |
| Applicable source/product gate suite | N/A                     | Evidence-only run artifact; no package/plugin implementation or public surface changed        |

## Residual risks

1. #1308 still requires five consecutive published-canary runs before #1227 reliability can be
   considered proven; the one fixed-daily restore remains compatibility evidence only.
2. The exact stable 13.5 transitive package graph and Deno behavior remain unknown until matching
   released artifacts are exercised in a cold fixture.
3. #18627 and #18628 remain open and can change before merge; their exact heads and review threads
   must be re-read before contribution or adoption.
4. The original scratch fixture/caches are intentionally absent from this evaluator worktree.
   Reproduction against a future release must recreate them rather than relying on retained cache.
5. The live PR head advanced beyond the requested pin during evaluation. The later changes are
   evaluator/worklog administration only, but the supervisor should reconcile the recorded PASS and
   session provenance before changing lifecycle status.

These are bounded follow-up conditions already represented by `research.md`; none requires another
correction to that artifact.

## PR recommendation

Approve the research content represented by `e20940838f2c55a65d27445d2e26f04919bffec0` and the
requested inspected head `c3a454da60f03b275eb2ed21b73d71dabbc983e7`. The supervisor may reconcile
this PASS and advance PR #1307 through the normal harness review/close process. Retain `Refs #1227`
and the docs-only gate selection; do not couple the #18958 reliability fix to either Deno feature
PR, do not claim the five-canary reliability gate is complete, and do not run full scaffold E2E for
this research-only changeset.

## Verdict

`PASS` — both cycle-one evidence blockers are resolved, the #18958/#18627/#18628 lifecycle split is
accurate, all previously validated Deno/runtime and package evidence remains intact, and no further
correction to `research.md` is required.
