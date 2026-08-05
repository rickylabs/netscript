**[PHASE: IMPL-EVAL] [VERDICT: PASS]**

# IMPL-EVAL — Aspire Deno runtime / NuGet research

## Metadata

| Field               | Value                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------- |
| Run                 | `research-aspire-deno-runtime-path--1227-adjacent`                                    |
| Target              | Draft PR [rickylabs/netscript#1307](https://github.com/rickylabs/netscript/pull/1307) |
| Baseline            | `00f96af76e5825422e8bc716a9c27d4c13e16f7f`                                            |
| Inspected commit    | `e20940838f2c55a65d27445d2e26f04919bffec0`                                            |
| Archetype / overlay | Archetype 6 subject; `docs`-only changeset                                            |
| Evaluator route     | `openai / gpt-5.6-sol / xhigh`                                                        |
| Evaluator session   | `019fcf85-364e-72d2-a1ea-bdb507850da1`                                                |
| Evaluation date     | 2026-08-05                                                                            |

The implementation/research author and evaluator are separate sessions. This re-evaluation is
commit-pinned to `e20940838...`; a later PR-head commit containing the previous evaluator artifact
does not change the primary `research.md` evaluated here.

## Blocking findings

None. No further correction to `research.md` is required.

## Prior finding closure

### #1308 evidence strength — resolved

`research.md:14-18` now says that PR #1308 **corroborated** the #18958 diagnosis and proved only the
specific compatibility result: the unchanged Aspire 13.4.6 SDK graph restored through the fixed
daily CLI in 13.06 seconds with no newly leaked helper. It explicitly preserves five consecutive
published-canary runs as the reliability completion gate and says that one green restore cannot
prove an intermittent failure absent.

That is faithful to the retained #1308 evidence and no longer overstates a one-run compatibility
probe as independent causal or reliability proof.

### First-party 84-library evidence — resolved

`research.md:24-28` now identifies 84 as the current `Aspire.Hosting.JavaScript@13.4.6`
package-identity proxy for unreleased #18628, not a prediction of the 13.5 transitive graph. The
table labels that row explicitly at `research.md:131`, and `research.md:147-150` limits the
conclusion to one additional direct integration package while requiring the exact 13.5 total to be
remeasured after release.

The corrected claim matches the evidence: the published 13.4.6 proxy proves that selecting
`Aspire.Hosting.JavaScript` grows the current graph from 83 to 84 and cannot create a zero-NuGet
path; it does not claim the future stable graph will retain the same absolute count.

## Load-bearing claim assessment

### 1. External `[AspireExport]` and runtime viability — PASS

The 13.4.6 Toolkit fixture proves more than code generation (`research.md:47-83`). The external
`CommunityToolkit.Aspire.Hosting.Deno@13.4.0` assembly generated `addDenoApp`, `addDenoTask`, and
`withDenoPackageInstallation`, and its RPC handle named the external package export. The fixture
then called `addDenoApp`; Aspire started the Deno 2.9.3 resource, and `aspire wait` observed it up
before the exact AppHost was stopped.

Independent evaluator repetition also observed the resource as running and healthy in
`aspire describe`, with executable `deno` and the expected `run --allow-net --allow-env main.ts`
arguments. This is executed runtime viability rather than generated-code inspection alone.

Residual risk: this proves local 13.4.6 Toolkit viability, not first-party feature parity for
publishing, telemetry, or debugging. The research does not claim otherwise.

### 2. NuGet counts and dependency trade-off — PASS

`research.md:116-154` uses one coherent unit: unique `.libraries` entries in each generated NuGet
`project.assets.json`, with direct dependencies reported separately. Seven fixtures used distinct
empty package and HTTP-cache roots. Independent parsing reproduced:

| Comparison                                   | Resolved libraries | Exact added identity                          |
| -------------------------------------------- | -----------------: | --------------------------------------------- |
| empty/core TypeScript probe                  |                 75 | baseline                                      |
| core + Toolkit Deno                          |                 76 | `CommunityToolkit.Aspire.Hosting.Deno/13.4.0` |
| core + JavaScript 13.4.6                     |                 76 | `Aspire.Hosting.JavaScript/13.4.6`            |
| representative Browsers + PostgreSQL + Redis |                 83 | representative baseline                       |
| representative + Toolkit Deno                |                 84 | Toolkit package only                          |
| representative + JavaScript 13.4.6 proxy     |                 84 | JavaScript package only                       |

The exact set difference is one library in every added-package comparison. The evidence supports the
architectural conclusion that Toolkit Deno and the current first-party package proxy grow, rather
than shrink, the restore surface. Approximate cold-cache sizes are correctly labelled as
illustrative rather than a stable package-size contract.

Under the Doctrine's upstream-first and dependency-justification rules, the conclusion is sound: do
not add a third-party Toolkit dependency to solve a failure it cannot remove; reconsider the
first-party integration later for feature/support value, not NuGet reduction.

Residual risk: exact stable 13.5 transitive identities remain volatile. The release-time cold
fixture at `research.md:286-302` is the correct closing measurement.

### 3. #18627 and #18628 placement — PASS

[microsoft/aspire#18627](https://github.com/microsoft/aspire/pull/18627) changes the TypeScript
AppHost guest toolchain resolver: Deno project-file detection, install/check/run/watch/task
commands, and associated CLI/scaffolding tests. It does not replace the managed integration probe or
its `Aspire.Hosting` and `Aspire.Hosting.CodeGeneration.TypeScript` restore floor. The distinction
at `research.md:156-167` is accurate.

[microsoft/aspire#18628](https://github.com/microsoft/aspire/pull/18628) places `DenoAppResource`,
`AddDenoApp`, and the `WithDeno*` APIs in the packable first-party `Aspire.Hosting.JavaScript`
project. Its playground selects that NuGet package. The research correctly distinguishes first-party
ownership from being built into the CLI with no NuGet.

Residual risk: both Deno PRs remain open and review-required. Only merged code and released stable
artifacts can establish the final shipped surface.

### 4. Current blockers and proposed upstream contribution — PASS

The live #18628 snapshot has six unresolved current threads matching `research.md:228-250`: real
polyglot call sites, Kubernetes OTLP HTTP/protobuf, package-script Docker initialization/caching,
endpoint-conditional native OTLP, README consistency, and NetScript's Deno-version recommendation.
The linked exact-head review additionally supports the task-argument, debugger-warning,
cache-permission, endpoint-ownership, and deploy-telemetry findings.

The proposed contribution order at `research.md:252-270` is faithful to those blockers: reproduce
and repair the debugger E2E, add a real TypeScript polyglot call site, then address Kubernetes OTLP
projection. It explicitly requires separate authority and exact-head validation before upstream
work.

Residual risk: review state is volatile; any contribution must re-read the live head and threads.

### 5. Timeline and actionable watch signal — PASS

The 13.5 snapshot is qualified: 787 closed / 71 open, no due date, and two unapproved Deno PRs.
“Plausibly weeks rather than quarters” is presented as an inference, not a schedule
(`research.md:272-284`).

The watch signal at `research.md:286-302` is exact and actionable: stable provenance for merged
#18958; both Deno merges with named concerns resolved; matching stable CLI, SDK, and JavaScript
package versions; and a cold repeated fixture proving no leaked helper, Deno resolver selection,
generated/running `addDenoApp`, and the actual NuGet graph. It separately defines the stronger
signal required for genuine NuGet elimination.

Crucially, the research does not gate #1227 on the Deno feature PRs: if stable 13.5 contains #18958
and either Deno PR misses the cut, NetScript takes the CLI fix and retains
`builder.addExecutable('deno', ...)` (`research.md:207-210,298-302`).

### 6. Zero-NuGet/loss analysis, #1227 verdict, and 0.0.6 recommendation — PASS

The empty TypeScript fixture still restores the managed host and TypeScript code generator. The
literal zero-NuGet alternatives at `research.md:169-189` require leaving or bypassing the supported
TypeScript AppHost pipeline, placing versioned SDK generation, the resource/DCP lifecycle, service
discovery, ordering, telemetry/health, publishing, and compatibility outside the supported path. A
C# AppHost still consumes NuGet PackageReferences.

The corrected conclusions follow without overclaiming:

- #1227 belongs to the CLI containing merged #18958, with #1308's five-canary gate still pending.
- Deno adoption is neither the cause nor cure for #1227.
- One coordinated stable 13.5 upgrade is preferable only if both Deno features also ship; otherwise
  the p0 CLI fix proceeds alone.
- Optional integration trimming can reduce architectural exposure but is not a leak cure.
- No 0.0.6 epic should be created on the false premise that Deno removes NuGet. A broader future
  Deno feature epic remains an owner/product choice, separate from restore remediation
  (`research.md:304-316`).

### 7. Research-only scope, lock hygiene, and PR metadata — PASS

Baseline through `e20940838...` contains eight added files, all under the run directory: 787
insertions and no product, scaffold, package manifest, workflow, test, or lockfile path.
`git diff --check` passed, and the merge base is the requested baseline. `deno.lock` has no
baseline-to-target diff. The inherited worktree modification remains present and was neither
restored nor included (`research.md:336-337`).

Draft PR #1307 remains research-only. Its body uses `Refs #1227`, not a closing keyword; that is
correct because #1308 owns the restore fix and this research does not resolve #1227. It has exactly
one `status:research`, namespaced type/area/priority labels, and an explicit 0.0.5 milestone. Its
slice and substantive Definition-of-Done items are complete; the independent-evaluation checkbox
appropriately remains pending until this verdict is incorporated.

The PLAN-EVAL artifact records the owner-authorized D6 `COMPOSED_WAIVER` and does not claim a
self-issued PASS. The worklog contains the Design contract and both planned slices. Its final gate
rows are stale at commit `e20940838...`, but the PR body records the completed format, link, diff,
runtime, and restore-graph evidence. This ledger cleanup is administrative and does not require a
correction to the primary `research.md`.

## Validation record

| Check                                | Result  | Evidence                                                                                      |
| ------------------------------------ | ------- | --------------------------------------------------------------------------------------------- |
| Exact correction delta               | PASS    | `9c4f29a...e20940838` changes only `research.md` and `worklog.md`; 13 insertions, 7 deletions |
| Complete target scope                | PASS    | Eight run artifacts only; no product/scaffold/lock path                                       |
| Merge base                           | PASS    | `00f96af76e5825422e8bc716a9c27d4c13e16f7f`                                                    |
| Patch integrity                      | PASS    | `git diff --check 00f96af... e20940838`                                                       |
| Lock hygiene                         | PASS    | No committed `deno.lock` delta; inherited working-tree delta preserved                        |
| Toolkit export/runtime               | PASS    | Generated export plus healthy running Deno resource                                           |
| NuGet graph                          | PASS    | Seven isolated assets graphs and exact package-identity deltas                                |
| Upstream state                       | PASS    | Primary PR/issue/source/review and milestone inspection on 2026-08-05                         |
| Full CLI E2E                         | NOT RUN | Explicitly prohibited and disproportionate for docs-only research                             |
| Product typecheck/lint/publish gates | N/A     | No product/package source or public surface changed                                           |

## Residual risks

1. PR #1308's five consecutive published-canary proof is still required before #1227 reliability is
   considered complete.
2. Stable 13.5 package counts and Deno behavior must be measured from the exact released versions;
   the 13.4.6 JavaScript package is intentionally only a package-identity proxy.
3. #18627/#18628 review and merge state can change; re-read their exact heads before contribution or
   adoption.
4. Milestone percentage has no scheduling force because 13.5 has no due date.

None of these risks requires another correction to `research.md`; each is already represented by the
artifact's conditions and watch signal.

## PR recommendation

Approve the research content at `e20940838f2c55a65d27445d2e26f04919bffec0`. The supervisor may
record this PASS, refresh the remaining phase/gate ledger, and advance the draft through the normal
harness close process. Keep `Refs #1227`; do not couple the #18958 reliability fix to either Deno
feature PR, and do not run the full scaffold E2E for this docs-only research change.

## Verdict

`PASS` — both requested evidence qualifications are correct, every load-bearing claim remains
supported, and no further correction to `research.md` is required.
