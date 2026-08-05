**[PHASE: IMPL-EVAL] [VERDICT: FAIL_FIX]**

# IMPL-EVAL — Aspire Deno runtime / NuGet research

## Metadata

| Field               | Value                                                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Run                 | `research-aspire-deno-runtime-path--1227-adjacent`                                                                     |
| Target              | Draft PR [rickylabs/netscript#1307](https://github.com/rickylabs/netscript/pull/1307), commit-pinned research artifact |
| Baseline            | `00f96af76e5825422e8bc716a9c27d4c13e16f7f`                                                                             |
| Inspected commit    | `2951d612165125e6013168b158c9d80fdb4b1d9f`                                                                             |
| Archetype / overlay | Archetype 6 subject; `docs`-only changeset                                                                             |
| Evaluator route     | `openai / gpt-5.6-sol / xhigh`                                                                                         |
| Evaluator session   | `019fcf85-364e-72d2-a1ea-bdb507850da1`                                                                                 |
| Evaluation date     | 2026-08-05                                                                                                             |

## Blocking finding

### B1 — the #1227 action is based on an incomplete upstream root-cause read

The pinned research correctly proves that neither Deno integration removes the managed NuGet probe,
but it gives the wrong operational follow-through for #1227. It says to continue hardening the
restore path directly (`research.md:23-31`) and specifically prioritizes feed/timeout behavior,
caching, and bounded retries (`research.md:273-275`). Before the inspected commit was authored,
[microsoft/aspire#18958](https://github.com/microsoft/aspire/pull/18958) had already merged on
2026-08-03 for Aspire 13.5 with the directly relevant fix, “Stop leaking orphaned aspire-managed
NuGet search helpers.”

The upstream patch is not merely a similarly named issue. It changes
`NuGetPackagePrefetcher.ExecuteAsync` from discarded `Task.Run` calls to collected tasks awaited by
the background service, removes the one-second command-selection fallback, disables unused package
prefetching for `aspire ls` and `aspire ps`, and adds regression coverage that keeps the service
open until in-flight searches unwind. Its PR report describes the resulting orphaned helpers holding
NuGet scratch locks until an unrelated restore deadlocks. That is the same failure layer and
observable hang recorded by [NetScript #1227](https://github.com/rickylabs/netscript/issues/1227).

There is also direct adjacent NetScript evidence rather than only upstream prose:
[PR #1308](https://github.com/rickylabs/netscript/pull/1308) records an isolated restore of the
13.4.6 SDK through the fixed daily CLI completing with exit 0 in 13.06 seconds and no newly leaked
helper. Its five-run published-canary proof remains pending, so that evidence does not yet prove the
whole issue closed; it does prove that the pinned research's generic cache/retry recommendation is
no longer the evidence-led primary action.

Required correction: preserve the negative Deno conclusion, but state that #1227 should take a CLI
build containing #18958. Keep the two open Deno PRs as a separate feature-quality decision. If the
three changes ship together in stable 13.5, one coordinated upgrade is sensible; the p0 CLI repair
must not wait for #18627 or #18628. The exact watch signal should include stable provenance for
#18958, and the 0.0.6 recommendation should point #1227 at that repair rather than speculative
feed/cache/retry work.

This is a bounded research correction, not a rescope. Therefore the verdict is `FAIL_FIX`, not
`FAIL_RESCOPE`.

## Commit-pin note

The requested evaluation target is `2951d612...`. During evaluation, the remote PR head advanced to
`9c4f29a5c85bbc950a42cec8c32092ebc0f265ed`; that later commit modifies `research.md` and
`worklog.md` to incorporate #18958. It is outside this commit-pinned verdict. The later patch
appears aimed at the blocker above, but this verdict does not certify it; a formal re-evaluation
must inspect that exact head (or its successor) before the PR moves out of draft/research state.

## Load-bearing claim assessment

### 1. External `[AspireExport]` and runtime viability — PASS

The artifact's claim is stronger than code-generation-only evidence (`research.md:33-69`). The
retained 13.4.6 Toolkit fixture generated `addDenoApp`, `addDenoTask`, and
`withDenoPackageInstallation` from the external `CommunityToolkit.Aspire.Hosting.Deno/13.4.0`
assembly. I repeated the bounded fixture with Aspire CLI 13.4.6 and Deno 2.9.3.
`aspire wait deno-app --status up` succeeded, and `aspire describe` reported the resource as
`Running` and `Healthy`, with executable `deno` and arguments `run --allow-net --allow-env main.ts`.
The exact AppHost was then stopped, and no AppHost remained.

Assessment: the experiment proves external export discovery, generated API usability, process
launch, and Aspire-observed runtime health. It falsifies the categorical local claim that external
NuGet exports are skipped.

Residual risk: the scratch fixture and caches are intentionally untracked, so durability rests on
the reproduction record at `research.md:277-293`. This does not weaken the executed result, but a
future version comparison must recreate the cold fixture rather than rely on the retained cache.

### 2. The 75 / 76 / 83 / 84 NuGet counts — PASS

The definition at `research.md:102-129` is coherent: each number is the count of unique entries in
the generated probe's `project.assets.json` `.libraries` object, not a download count, byte size, or
direct-dependency count. All seven fixtures use isolated `NUGET_PACKAGES` and
`NUGET_HTTP_CACHE_PATH` locations.

Independent parsing reproduced these package-identity results:

| Comparison                                   | Count | Exact added library                                                               |
| -------------------------------------------- | ----: | --------------------------------------------------------------------------------- |
| empty TypeScript probe                       |    75 | baseline includes `Aspire.Hosting` and `Aspire.Hosting.CodeGeneration.TypeScript` |
| empty + Toolkit Deno                         |    76 | `CommunityToolkit.Aspire.Hosting.Deno/13.4.0`                                     |
| empty + current JavaScript assembly          |    76 | `Aspire.Hosting.JavaScript/13.4.6`                                                |
| representative Browsers + PostgreSQL + Redis |    83 | representative baseline                                                           |
| representative + Toolkit Deno                |    84 | `CommunityToolkit.Aspire.Hosting.Deno/13.4.0`                                     |
| representative + current JavaScript assembly |    84 | `Aspire.Hosting.JavaScript/13.4.6`                                                |

No hidden transitive delta accounts for the increments: the exact set difference is one library in
each Deno-package comparison. The counts support the claimed direction—both package choices grow,
rather than shrink, the measured restore surface.

Residual risk: 84 is a sound current package-identity proxy for putting Deno APIs in the already
selected `Aspire.Hosting.JavaScript` package, not a prediction that every 13.5 transitive graph will
have exactly 84 entries. The artifact's exact-version watch fixture (`research.md:248-263`)
appropriately requires remeasurement after stable publication. Approximate cache MiB values are
illustrative only, as the artifact states.

### 3. Separation of #18627 and #18628 — PASS

Live file and head inspection confirms that
[microsoft/aspire#18628](https://github.com/microsoft/aspire/pull/18628) adds `DenoAppResource`,
`AddDenoApp`, and the `WithDeno*` surface in the packable first-party `Aspire.Hosting.JavaScript`
project. Its TypeScript playground declares `Aspire.Hosting.JavaScript`; it is not a CLI-builtin,
zero-package integration. This supports `research.md:86-100` and the one-package restore comparison.

[microsoft/aspire#18627](https://github.com/microsoft/aspire/pull/18627) changes Deno detection and
commands in the TypeScript AppHost toolchain resolver and its CLI/scaffolding tests. It does not
replace the managed integration probe or remove the generated probe's `Aspire.Hosting` and
`Aspire.Hosting.CodeGeneration.TypeScript` dependencies. The distinction at `research.md:139-150` is
accurate.

Residual risk: both PRs remain open and can change before merge. Only the merge commits and a stable
release fixture can establish the final shipped surface.

### 4. #18628 blockers and proposed contribution — PASS

At the live snapshot, #18628 was open, review-required, without approval, and had exactly six
unresolved current threads. Five substantive maintainer threads covered real polyglot call sites,
Kubernetes OTLP HTTP/protobuf, package-script Docker initialization/caching, endpoint-conditional
native OTLP, and README consistency; the sixth was NetScript's Deno-version recommendation. The
exact-head review linked at `research.md:207-212` additionally reported the task-argument,
experimental-warning, cache-permission, endpoint-ownership, and telemetry findings represented in
the research.

The proposed contribution at `research.md:214-232` is faithful to that state: a focused debugger E2E
fix plus a real polyglot call site, followed by an OTLP publish test/fix, addresses current
maintainer requests rather than inventing a new seam.

Residual risk: review-thread state is volatile. Any upstream contribution must re-read the exact
head and unresolved-thread set before editing; this research gives no authority to push upstream.

### 5. Timeline and watch signal — FAIL_FIX only for the omitted #1227 repair signal

The Deno timeline itself is responsibly qualified. The 13.5 milestone API reported 787 closed, 71
open, no due date, and an update on 2026-08-05. “Plausibly weeks rather than quarters” is explicitly
presented as a planning read, not a promise (`research.md:234-246`). Requiring both Deno PRs merged,
stable matching artifacts, and a cold exact-version fixture is actionable for the first-party Deno
feature decision (`research.md:248-263`).

However, the complete #1227 signal must now include #18958 in a stable CLI's release provenance.
That merged fix is independent of the two unapproved Deno feature PRs. Omitting it causes the pinned
research to recommend the wrong immediate work and is part of blocking finding B1.

### 6. Zero-NuGet loss analysis, #1227 verdict, and 0.0.6 recommendation — PARTIAL / FAIL_FIX

The zero-NuGet analysis at `research.md:152-172` follows from the measured 75-library floor. Leaving
the supported TypeScript AppHost pipeline or treating checked-in generated output as an unsupported
cache forfeits or moves outside support the version-matched SDK, resource graph, DCP lifecycle,
service discovery, ordering, telemetry/health, and publish projections. A C# AppHost also consumes
NuGet packages. Under the Doctrine's upstream-first and dependency-justification rules, the research
correctly rejects a Toolkit dependency that adds restore surface without solving the stated
reliability problem.

The narrow conclusions remain sound:

- Deno adoption is not a #1227 mitigation.
- The Community Toolkit package should not be added for that purpose.
- First-party Deno should be assessed as a feature/support trade-off after a stable release.
- A 0.0.6 epic premised on “Deno removes NuGet” should not be created.

The operational #1227 recommendation does not follow from the full live evidence because it misses
#18958 and #1308. It must be corrected as described in B1. The broader feature epic remains a valid
conditional option, but it must not be coupled to the p0 CLI repair.

### 7. Research-only scope, lock hygiene, and PR metadata — PASS with administrative cleanup

The pinned baseline-to-commit diff contains seven added files, all under the run directory: 691
insertions and no product, scaffold, package manifest, workflow, or test changes. `git diff --check`
passed. `deno.lock` has no baseline-to-commit delta. The local worktree still shows an inherited
`deno.lock` modification, but it is outside the inspected commit and was neither restored nor used
as evidence (`research.md:295-296`).

The current PR file list remains research/harness-only. Its body uses `Refs #1227` and contains no
`Closes`, `Fixes`, or `Resolves` keyword, which is correct for adjacent research that does not close
the p0 issue. It is draft, has exactly one `status:research` label, namespaced type/area/priority
labels, and the explicit `0.0.5` milestone. Those metadata choices match the partial scope.

Administrative issue: the PR body still marks S1, controlled experiments, citation audit, and all
Definition-of-Done items pending, while `worklog.md:81-88` also leaves scope and documentation gates
pending. Those stale records are not the substantive reason for `FAIL_FIX`, but they must be
refreshed with final gate evidence before the corrected head is proposed as ready.

## Process and validation record

| Check                           | Result                  | Evidence                                                                                                                                                |
| ------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Separate evaluator              | PASS                    | Session and route recorded above and in `codex-thread-ids.md:1-10`                                                                                      |
| Plan gate                       | N/A — authorized waiver | `plan-eval.md:1-16,29-32` records `COMPOSED_WAIVER`, explicitly not a self-issued PASS; this is a controlled research slice, not product implementation |
| Design / slices                 | PASS                    | `worklog.md:12-55` defines the evidence contract and S0/S1 slices                                                                                       |
| Pinned diff scope               | PASS                    | Seven run-artifact additions, 691 insertions; no source or lockfile path                                                                                |
| Diff whitespace                 | PASS                    | `git diff --check 00f96af... 2951d612...`                                                                                                               |
| Scoped Markdown format          | PASS                    | `deno fmt --check` on the seven pinned files: `Checked 7 files`                                                                                         |
| Toolkit runtime                 | PASS                    | Repeated 13.4.6 start/wait/describe/stop; Deno resource `Running`, `Healthy`                                                                            |
| NuGet graph                     | PASS                    | Seven isolated `project.assets.json` graphs; exact 75/76/83/84 identities above                                                                         |
| Upstream review state           | PASS                    | Live PR files, reviews, GraphQL thread state, and milestone API inspected on 2026-08-05                                                                 |
| Full CLI E2E                    | NOT RUN                 | Explicitly prohibited and disproportionate for the research-only pinned diff                                                                            |
| Product fitness / publish gates | N/A                     | No package, plugin, public API, or product-source change                                                                                                |

Doctrine result: the Archetype-6 subject classification and docs overlay are appropriate. The
research avoids a helper wrapper (AP-2) and a speculative migration seam (AP-9), prefers first-party
upstream capability over an extra Toolkit dependency, and uses executed evidence for an external
runtime claim. No architecture-debt entry is created or required by the pinned diff.

## Findings summary

| Severity | Finding                                                                                                                         | Required action                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| High     | Pinned `research.md` omits merged upstream lifecycle fix #18958 and consequently recommends generic restore hardening for #1227 | Correct the verdict, watch signal, and #1227/0.0.6 action; then re-evaluate the corrected commit |
| Medium   | Remote PR head advanced beyond the inspected commit during evaluation                                                           | Do not apply this verdict to `9c4f29a...`; pin and inspect the replacement head                  |
| Low      | PR body and worklog gate/checklist state are stale                                                                              | Refresh S1, validation, DoD, and final gate evidence before ready-for-review transition          |

## PR recommendation

Keep PR #1307 draft and in `status:research`. Do not merge or mark it ready on the basis of
`2951d612...`. Preserve its validated Deno runtime, NuGet-count, dependency, upstream-blocker, and
zero-NuGet analysis; correct the #1227 action around #18958, retain `Refs #1227`, refresh the stale
harness/PR ledger, and request a new commit-pinned IMPL-EVAL for the corrected head.

## Verdict

`FAIL_FIX` — most load-bearing Deno and package evidence is sound, but a correction to `research.md`
is required because the inspected commit omits a merged, directly relevant Aspire CLI repair and
therefore gives an outdated primary recommendation for #1227. The fix is contained within the
existing research scope.
