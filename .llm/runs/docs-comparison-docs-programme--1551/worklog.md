# Worklog — comparison docs programme #1551

## Design

### Public information architecture

- Existing lane retained: Concepts.
- New roots: `/comparisons/` and `/migration/`.
- Public pages: comparison index, methodology, deferred Next.js Session case, migration index, and Next.js roadmap placeholder.
- Stable xrefs: comparison index/methodology/Session and migration index/Next.js.
- Existing `explanation/compared.md` remains the broad orientation page and must be cross-linked, not replaced.

### Evidence model

- Claim states: measured, inspected, inferred, deferred.
- Pinned sources: NetScript baseline `01e0960494c95ce56eb35892c211a095eb13e6ed`; EIS-Chat `5191de83f3da97559f21d8891c6c8afdf1cf473a`; Next.js `16.3.0`.
- Shared constants: domain projections, leaf components, CSS, test data, and deployment assumptions.
- Measured outputs require a manifest, exact procedure, deterministic script, raw aggregate JSON, and version/environment metadata.
- Private source contents never enter this repository.
- Every case matrix row requires mechanism, evidence, loser overhead, confidence, version sensitivity, and residual owner.

### Equivalence contract

The Session case holds constant the route shape, header/transcript/context regions, cached-entry projections and ages, fast shell, loading/settled/failed states, freshness intent, typed navigation goal, metadata input, and presentation/domain leaves. It explicitly records that NetScript named partial endpoints and Next.js RSC/parallel-route slots are non-isomorphic transports.

### Closure decision

The draft PR is partial and must say `Part of #1551`. Follow-ups #1645–#1650 own all residuals, but live #1551 still retains the original broad acceptance contract. No closing keyword is truthful at this phase.

### Implementation slices

- P0: run bootstrap/research/plan only; stop for PLAN-EVAL.
- S1: methodology and minimum Concepts navigation.
- S2: immutable source manifest, deterministic aggregate measurement tool/tests, and raw aggregate output.
- E0: owner-priority in-place correction of the two canonical #1551 case comments at the unchanged pin.
- S3: deferred Session case, migration roadmap, complete docs audit, then Tier-A stop.

## Progress log

| Time (UTC) | Step | Evidence |
| --- | --- | --- |
| 2026-08-13 | Leaf worktree/run created. | no-upstream branch `docs/comparison-docs-programme` at `01e096049` |
| 2026-08-13 | Required skills and harness/coordinator authorities read. | harness, tools, PR, doctrine, Deno toolchain, RTK; docs overlay/run loop/lane policy/audit/handoff/plan protocols; approved coordinator artifacts |
| 2026-08-13 | Baseline reconciled to live main. | `git fetch origin main`; branch and `origin/main` both `01e0960494c95ce56eb35892c211a095eb13e6ed`; no upstream |
| 2026-08-13 | Live #1551 and both comments inspected. | 17 unchecked deliverables; provisional comments rejected as benchmark evidence |
| 2026-08-13 | Current docs IA, tasks, comparison/migration surfaces, public builder/defer APIs, and prior history inspected. | no existing comparison/migration trees; current Concepts lane and broad comparison preserved |
| 2026-08-13 | Private Session route/support inspected through authorized GitHub access at the immutable commit. | corrected resource, cache-read, route-binding, partial, helper-ownership, and presentation claims; no code copied |
| 2026-08-13 | Next.js features pinned to official primary sources. | exact stable `16.3.0`; Cache Components, cache clocks, revalidation, Suspense, parallel routes, errors, and metadata re-baselined |
| 2026-08-13 | Residual programme split into linked owners. | #1645–#1650, Backlog / Triage, docs labels, exactly one `status:triage`, explicit priority |
| 2026-08-13 | P0 research/design/plan completed. | exact file slices, risks, decisions, closure semantics, structured gate plan; PLAN-EVAL pending |
| 2026-08-13 | P0 committed, explicitly pushed, and handed off in draft PR #1652. | commit `75a231053`; canonical body, 0.0.7 milestone, docs CI skips, exactly one `status:plan`, RESEARCH and PLAN comments |
| 2026-08-15 | Formal PLAN-EVAL cycle 1 reconciled. | fresh native Claude Opus 5/low opposite-family session; `PASS` on `d35cbca30872d1f55118d63437638e93270c2ac3`; evaluator-only commits `9ae97c934` and `a790e91e2`; verdict is external authority, not generator self-certification |
| 2026-08-15 | S1 authored within the exact six-file content boundary and gated. | build, links, terminology, front matter, prose, and comparison navigation pass; topic-orchestrator correction defers the S3-owned `/migration/` rendered-root assertion without rescope |
| 2026-08-15 | Tier-A S1 review found premature migration references and an insufficient link gate. | four `/migration/` references removed; rendered `check:links` added to S1; significant/no-rescope correction recorded for later IMPL-EVAL |
| 2026-08-15 | Topic orchestrator signed off S1 and authorized S2. | Tier-A PASS at `98fc58997c3ff5ca21403ba67521c584a5d26a0e`; generator entered S2 without treating the sign-off as self-certification |
| 2026-08-15 | S2 immutable local-input precondition checked. | no authorized checkout at `5191de83f3da97559f21d8891c6c8afdf1cf473a`; stopped before private source reads, tool/JSON creation, gates, commit, push, or PR comment |
| 2026-08-15 | Coordinator provisioned the exact immutable input and S2 resumed. | `/home/codex/repos/eis-chat-007-input`; detached clean HEAD `5191de83f3da97559f21d8891c6c8afdf1cf473a`; treated strictly read-only |
| 2026-08-15 | S2 tool, tests, manifest, and aggregate drafted. | same-timestamp checked-in output reproduces; removing `/observedAt` yields stable digest `b9e96ed24fa64fe4a9d06bc4c51e5be1c6da8938ff4cba0baec7945cb5cdbaa9` (**superseded:** this digest does not reproduce; see the merge-readiness cleanup row and `drift.md`, where fixed-`--observed-at` regeneration with `cmp` raw exit `0` is the reproducible evidence); measured-file output has path/classification/hash/counts only; Next.js is absent/deferred |
| 2026-08-15 | Literal S2 lint gate refused a false green. | mandatory wrapper exit `2`: root config excludes `.llm/`; explicit existing-config diagnostic exit `0`, two files and zero findings; stopped for gate correction |
| 2026-08-15 | Topic orchestrator corrected the S2 lint row to N/A and S2 gates completed. | root `.llm/` exclusion is deliberate repo-wide configuration, so exit `2` is fail-closed evidence rather than a pass, skip, or waiver; all applicable tool, site, diff, privacy, reproduction, scope, and lock checks pass |
| 2026-08-15 | Topic orchestrator signed off S2 and inserted an owner-priority evidence correction before S3. | Tier-A PASS at `4e6d52b3d`; S3 remained unstarted and the repository tree was clean when E0 began |
| 2026-08-15 | Unchanged EIS-Chat authority and comment-time baselines re-verified. | local `HEAD == origin/master == 5191de83…`; `834a2b36` has the identical tree and is evidence-only; all eight material commits are ancestral; input remains clean and read-only |
| 2026-08-15 | Current Session and Channel surfaces inspected and route counts reproduced. | Session `94 / 92` physical/nonblank versus published `119 / 117` and inspected snapshot `121 / 119`; Channel `181 / 178` versus `208 / 204`; stale ASC, feature, effort, and time figures removed rather than estimated |
| 2026-08-15 | Both canonical #1551 comment bodies replaced in place. | Session `5265826161` updated `2026-08-15T04:58:05Z`; Channel `5265971722` updated `2026-08-15T04:58:11Z`; API bodies byte-match the prepared definitive replacements; no follow-up comment posted |
| 2026-08-15 | Topic orchestrator signed off E0 and authorized final slice S3. | Tier-A PASS at `54e1c3bff`; local/remote/PR head agreed and tree was clean; canonical comments and S2 evidence remained settled |
| 2026-08-15 | S3 case, xrefs, migration roadmap, and Concepts wiring authored. | case uses only S2 measured numbers, labels all other evidence, preserves the complete equivalence contract, and maps only case-proven migration concepts; `_data.ts` divergence recorded append-only |
| 2026-08-15 | Early rendered-link verification found site-relative evidence JSON links unresolved. | evidence JSON is intentionally not copied to `_site`; links changed to immutable blobs at signed-off S2 commit `4e6d52b3d`, then the complete verifier passed |
| 2026-08-15 | S3 docs audit and manual review completed. | all named commands raw exit `0`; 36,084 rendered links resolve across 229 pages; both roots render under Concepts; matrix, evidence, privacy, terminology, front matter, and cross-page consistency assertions pass |
| 2026-08-15 | Formal IMPL-EVAL cycle 1 returned `FAIL_FIX`. | evaluated head `15429cf8487cfe3504ae0443fd435d2a72d4528b`; evaluator-only commit `e95f4838038a27a0f209d2ce37c9f53bd4ed4299`; verdict comment `5300794391`; two blocking and three minor findings accepted for bounded repair |
| 2026-08-15 | Immutable evidence metadata repaired first. | tool `1.1.0`, manifest, aggregate, and tests add `frameworkVersions`, `featureFlags`, and `inspectedAt`; regeneration at fixed `--observed-at 2026-08-15T03:57:30Z` is byte-identical by `cmp` raw exit `0`; prerequisite commit `43c702b973a71b539ec16e4b93f2c7a2c09d9ab6` pushed explicitly |
| 2026-08-15 | Both canonical comments repaired in place. | Session comment `5265826161` now uses immutable `43c702b…` evidence permalinks and was updated at `2026-08-15T05:53:57Z`; Channel comment `5265971722` labels `181 / 178` inspected, restores the shared measured definition, and was updated at `2026-08-15T05:53:58Z`; no follow-up comment |
| 2026-08-15 | Public case and final repair gates completed. | case evidence permalinks target `43c702b…`, tool metadata matches `1.1.0`, matrix says `Residual owner`; all applicable proportional gate rows raw exit `0`; lint remains N/A by deliberate root configuration |
| 2026-08-15 | Topic orchestrator signed off the cycle-1 repair. | Tier-A PASS comment `5300864119` on repaired source `c7ce58a19494024c219e9970deeb3ece878232d6` |
| 2026-08-15 | Formal IMPL-EVAL cycle 2 returned `PASS`. | evaluated source `c7ce58a19494024c219e9970deeb3ece878232d6`; evaluator-only commit `71cc5a02cde091f862c9892464ea77cc962b3675`; verdict comment `5300916189`; no further formal evaluator will run |
| 2026-08-15 | Merge-readiness evidence receipt corrected. | the claimed normalized digests do not reproduce; the tool's canonical normalization yields `0be43e05…`, so the record now uses the independently reproduced fixed-timestamp command and `cmp` raw exit `0` instead |

## Gate log

### P0-plan-integrity

| Gate | Commands / procedure | Scope | Result | Findings | Proceeded |
| --- | --- | --- | --- | --- | --- |
| Baseline/branch | raw `git rev-parse`, `git fetch origin main`, branch config inspection | current worktree only | PASS | exact requested baseline; no upstream | yes |
| Live authority | GitHub issue/comments and coordinator artifacts | #1551 and approved 0.0.7 run | PASS | carried estimates are provisional; leaf is partial | yes |
| Private inspection | authorized GitHub reads at exact SHA | declared Session route/support only | PASS | material carried claims corrected; no code copied | yes |
| Framework freshness | official Next.js docs/release | Next.js mechanisms used by the case | PASS | exact stable pin is `16.3.0`; cache/failure semantics are non-isomorphic | yes |
| Residual ownership | inspect created issues/labels/milestones | #1645–#1650 | PASS | every residual has a Backlog / Triage owner | yes |
| Plan diff | `git diff --check`; changed-path and lock inspection | P0 artifacts | PASS | eight run-bootstrap/research/plan files only; no lock or product/docs implementation diff | yes |
| Draft PR metadata | GitHub PR/label/milestone/comment inspection | draft PR #1652 | PASS | draft to `main`; milestone 0.0.7; `type:docs`, `area:docs`, `priority:p2`, both docs CI skips, exactly one `status:plan`; two phase comments | yes |
| PLAN-EVAL | fresh opposite-family evaluator | research/plan and PR | PASS | external evaluator artifact at `plan-eval.md`; evaluated `d35cbca30872d1f55118d63437638e93270c2ac3` | yes, S1 only |

### S1-method-nav

| Gate | Commands / procedure | Scope | Result | Findings | Proceeded |
| --- | --- | --- | --- | --- | --- |
| Site build | `rtk proxy deno task --cwd docs/site build` (raw exit `0`) | full rendered docs site | PASS | source format and rendered-output checks pass; 635 files generated, 226 HTML files checked, four documented syntax allowances | yes |
| Rendered links | `rtk proxy deno task --cwd docs/site check:links` (raw exit `0`) | generated `_site` after the S1 build | PASS | 34,980 internal links across 226 rendered pages all resolve; this row is now mandatory in S1 after Tier-A exposed that build plus source-link checks could not prove the rendered link contract | yes |
| Links | `rtk proxy deno task docs:links` (raw exit `0`) | 103 published docs sources | PASS | zero broken links, anchors, or enforced orphans | yes |
| Terminology | `rtk proxy deno task docs:accuracy` (raw exit `0`) plus prose comparison with `docs/site/glossary.md` | comparison index/methodology and published docs corpus | PASS | evidence, contract, request-scoped resource, presentation, domain, route, mechanism, and framework vocabulary are consistent with the glossary; existing peer-dependency/build-script warnings are non-failing and unrelated | yes |
| Navigation | inspect the Concepts lane in `docs/site/_site/comparisons/index.html` after the clean build | S1-owned `/comparisons/` and `/comparisons/methodology/` routes | PASS | Comparisons and Comparison methodology render under Concepts; the topic orchestrator corrected the unsatisfiable S1 assertion by deferring `/migration/` to S3, which owns both migration pages and must then assert both roots | yes |
| Front matter | inspect both new sources and their rendered `<title>`/`<h1>` | comparison index and methodology | PASS | both sources have title and description; rendered pages use `Comparisons` and `Comparison methodology` consistently | yes |
| Prose and contradictions | compare both new pages with `docs/site/explanation/compared.md`, the approved evidence vocabulary, and the roadmap | changed public prose | PASS | no case-result claim or measured number exists; the broad orientation remains linked and non-contradictory; all six residual issues are linked with descriptive roadmap text | yes |
| Diff hygiene | `git diff --check` (raw exit `0`) | complete dirty S1 diff | PASS | no whitespace errors | yes |
| Scope and locks | raw changed-path enumeration; `git diff --exit-code a790e91e26a4fb84636b4f3c57bd6444196b4ca9 -- deno.lock docs/site/deno.lock` (raw exit `0`) | exact S1 baseline through dirty worktree | PASS | the approved six S1 paths plus the specifically authorized `drift.md`; both lockfiles unchanged; no `packages/**`, `plugins/**`, S2, or S3 path | yes |

The topic-orchestrator ruling corrects the plan-acceptance inconsistency without changing scope:
S1 proves its comparison routes, while S3 inherits the migration-root assertion when it lands the
S3-owned migration pages. The correction and the PLAN-EVAL miss are recorded append-only in
`drift.md` with severity `significant`, no rescope, and no scope growth.

### S1 Tier-A fix — existing-page navigation only

| Gate | Commands / procedure | Scope | Result | Findings | Proceeded |
| --- | --- | --- | --- | --- | --- |
| Site build | `rtk proxy deno task --cwd docs/site build` (raw exit `0`) | full rendered docs site after Tier-A fixes | PASS | source format and rendered output pass; 635 files generated, 226 HTML files checked, four documented syntax allowances | yes |
| Rendered links | `rtk proxy deno task --cwd docs/site check:links` (raw exit `0`) | generated `_site` after build | PASS | all 34,980 internal links across 226 rendered pages resolve; no additional unresolved target was found | yes |
| Source links | `rtk proxy deno task docs:links` (raw exit `0`) | 103 published docs sources | PASS | zero broken links, anchors, or enforced orphans | yes |
| Terminology | `rtk proxy deno task docs:accuracy` (raw exit `0`) plus retained glossary prose review | comparison pages and published docs corpus | PASS | accuracy/discoverability passes; the existing peer-dependency warning is non-failing and unrelated | yes |
| Diff hygiene | `git diff --check` (raw exit `0`) | complete Tier-A fix diff | PASS | no whitespace errors after final run-artifact updates | yes |
| Manual assertions | rendered nav/source inspection after build | S1 comparison navigation, xrefs, front matter, and prose | PASS | `/comparisons/` and `/comparisons/methodology/` render under Concepts; no `/migration/` href, xref, nav root, or next/previous target remains; both new pages retain title/description; no case result or measured number exists; `explanation/compared` remains linked and non-contradictory; issue #1650 remains the plain-text migration owner | yes |
| Scope and locks | raw changed-path enumeration; `git diff --exit-code 3a8c738411a69b3cea18edbd7f3909b1998c3ed2 -- deno.lock docs/site/deno.lock` | Tier-A fix baseline through dirty worktree | PASS | exactly seven authorized existing S1 paths; both lockfiles unchanged; no package/plugin, migration-page, S2, or S3 path | yes |

The fix strictly reduces S1's published surface. S3 still owns all migration pages, xrefs,
navigation, and the assertion that both comparison and migration roots render. Stop again for
topic-orchestrator Tier-A re-review; no S2 or S3 work has begun.

### S2 immutable-input precondition

| Gate | Commands / procedure | Scope | Result | Findings | Proceeded |
| --- | --- | --- | --- | --- | --- |
| Branch baseline | raw local HEAD, branch, status, upstream, and remote-ref inspection | S2 worktree | PASS | clean `98fc58997c3ff5ca21403ba67521c584a5d26a0e`; remote matches; no upstream | yes |
| Authorized local root | read-only `git rev-parse HEAD` on available EIS-Chat checkouts plus bounded exact-head search | existing local checkouts only | **BLOCKED** | observed heads `aeaf2df5…`, `5fdff778…`, and `a08ebe55…`; none equals required `5191de83…` | no |
| Required revision object | read-only `git cat-file -t 5191de83f3da97559f21d8891c6c8afdf1cf473a` | the two obvious EIS-Chat object stores | **BLOCKED** | required commit object is absent, so no existing detached local root can be resolved without fetching or copying private source | no |
| Remote revision | topic-orchestrator-verified `git ls-remote origin` | authorized EIS-Chat remote | PASS | pinned commit is current `HEAD` and `refs/heads/master`; it is not lost or rewritten, only absent from the parked local clones | no |
| Plan dependency | reconcile `research.md:51` with the S2 local-roots contract | approved research and plan | **BLOCKED** | research explicitly used GitHub-only inspection with no checkout; no approved slice provisions the local input later required by S2; formal PLAN-EVAL cycle 1 passed over the gap | no |
| Privacy/scope containment | observe stop conditions | S2 authorization | PASS | no consumer file read; no fetch, checkout, clone, new worktree, source copy, tool/JSON creation, S2 gate, or external mutation | no |

The planned S2 aggregate cannot be truthfully produced until an already-authorized local checkout
at the exact pinned revision is available. A different head, estimate, or network-fetched input is
not an acceptable substitute.

### S2-evidence-repro — complete after lint applicability correction

| Gate | Commands / procedure | Scope | Result | Findings | Proceeded |
| --- | --- | --- | --- | --- | --- |
| Pinned input | raw Git revision, detached-state, status, and tracked-file inspection before source reads | `/home/codex/repos/eis-chat-007-input` | PASS | exact clean detached `5191de83f3da97559f21d8891c6c8afdf1cf473a`, 1,830 tracked files; no external mutation | yes |
| Reproduction | run the checked-in tool at the checked-in timestamp and two alternate timestamps; compare serialized output after deleting `/observedAt` | manifest, measurement JSON, authorized input root | PASS | same-timestamp output exactly matches the checked-in JSON; timestamp-normalized outputs are byte-stable with SHA-256 `b9e96ed2…` (**superseded:** this digest does not reproduce; see the merge-readiness cleanup row and `drift.md`, where fixed-`--observed-at` regeneration with `cmp` raw exit `0` is the reproducible evidence); no private source text field is emitted | yes |
| Check | exact approved structured `run-deno-check.ts` command | tool and test | PASS / raw exit `0` | two files, one batch, zero TypeScript occurrences | yes |
| Lint | exact approved structured `run-deno-lint.ts` command | tool and test | **N/A — not applicable / raw exit `2`** | root `deno.json` deliberately excludes `.llm/` repo-wide; the wrapper selected both paths, observed one excluded batch, and correctly failed closed instead of reporting a false green. The topic orchestrator ruled this row not applicable—not passed, skipped, or waived | yes |
| Format | exact approved structured `run-deno-fmt.ts` command | tool and test | PASS / raw exit `0` | two files, one batch, zero findings | yes |
| Tests | exact approved structured `run-deno-test.ts` command | tool test | PASS / raw exit `0` | five passed, zero failed or ignored | yes |
| Site build | `rtk proxy deno task --cwd docs/site build` | full rendered docs site | PASS / raw exit `0` | source format and rendered-output checks pass; 635 files generated and 226 HTML files checked. The evidence JSON files are not rendered as pages or copied into `_site` | yes |
| Rendered links | `rtk proxy deno task --cwd docs/site check:links` | generated `_site` after the S2 build | PASS / raw exit `0` | all 34,980 internal links across 226 pages resolve | yes |
| Diff hygiene | `git diff --check` | complete dirty S2 diff | PASS / raw exit `0` | no whitespace errors after final run-artifact updates | yes |
| Privacy/deferred shape | parse both public JSON files and inspect emitted fields and credential patterns | manifest and aggregate only | PASS | twelve measured file records expose only path, classification, SHA-256, and counts; no private source content, CSS, fixtures, business prose, credentials, source-text fields, or credential-like material; all unmatched Next.js metrics are `deferred` under an `absent` source | yes |
| Methodology consistency | compare the manifest procedure and access precondition with `docs/site/comparisons/methodology.md` | S1 public contract and S2 evidence | PASS | both require authorized access to the pinned private revision, publish only derived metadata and aggregates, and make repeatability conditional on that access; no contradiction | yes |
| Scope and locks | raw changed-path enumeration; lockfile diff from S2 baseline | complete S2 slice | PASS | exactly six approved S2 paths plus the authorized `drift.md`; both lockfiles unchanged; no `packages/**`, `plugins/**`, migration, or S3 path | yes |

The topic orchestrator ruled the lint row not applicable because the repository deliberately
excludes `.llm/**` from lint coverage. No alternate config was used as gate evidence and no root
configuration changed. Regeneration from the exact pinned input reproduces the checked-in
aggregate byte-for-byte at the same declared observation timestamp. The later merge-readiness
correction records that the separately claimed normalized digest did not reproduce.

### E0-canonical-comment-correction

| Gate | Commands / procedure | Scope | Result | Findings | Proceeded |
| --- | --- | --- | --- | --- | --- |
| Immutable authority | raw `git rev-parse`, `git status`, `git rev-parse <rev>^{tree}`, `git diff --exit-code`, and named-commit ancestry checks | strictly read-only `/home/codex/repos/eis-chat-007-input` | PASS / raw exit `0` | `HEAD` and `origin/master` are the exact unchanged pin; `834a2b36` has the identical tree and is evidence-only; all named improvements are ancestral; input clean | yes |
| Route metrics | deterministic physical/nonblank line counting at the inspected comment-time snapshots and pin | two primary example routes only | PASS / raw exit `0` | Session published `119 / 117`, inspected snapshot `121 / 119`, pin `94 / 92`; Channel `208 / 204` to `181 / 178`; every delta reproduced | yes |
| Feature inventory | focused source inspection at the pin | routes, generated-route aliases, partials, form/schema, helpers, and fallbacks named in the replacements | PASS | route-bound partials, typed document form navigation, generated route contracts, cache-seed preservation, layout-faithful deferred states, and cold-navigation stabilization confirmed against source rather than commit subjects | yes |
| Primary Next.js evidence | exact `16.3.0` release and official routing, Cache Components, request-input, cache-clock, Suspense, parallel-route, navigation, forms, typed-routes, and metadata docs | mechanisms discussed in the two comments | PASS | NetScript improvements are described as current NetScript capabilities; Next.js mechanisms are not scored as regressions where no isomorphic equivalent exists | yes |
| In-place publication | GitHub issue-comment edit API for comments `5265826161` and `5265971722` | existing canonical #1551 comments only | PASS | both bodies are complete definitive replacements from the first line; no update/addendum framing and no follow-up comment | yes |
| Publication verification | exact API-body byte comparison and metadata readback | both edited comments | PASS / raw exit `0` | bodies match exactly; `updated_at` values are `2026-08-15T04:58:05Z` and `2026-08-15T04:58:11Z` | yes |
| S2 evidence currency | compare S2 manifest, tool, and measurements pin/procedure with the unchanged authority | four S2 evidence files | PASS | they already target the exact pin and reproduce byte-identically; no edit is warranted and none was made | yes |
| Locked-plan check | compare current implementations with the approved equivalence contract, matrix shape, and presentation/domain-held-constant premise | locked S3 architecture and evidence contract | PASS | no premise breaks and no mechanism-matrix shape changes; this is an evidence/publication correction, so no fresh PLAN-EVAL is required | yes |
| Diff hygiene | `git diff --check` | complete E0 diff | PASS / raw exit `0` | no whitespace errors | yes |
| Scope and locks | raw changed-path enumeration (raw exit `0`); `git diff --exit-code origin/main -- deno.lock docs/site/deno.lock` (raw exit `0`); S2 evidence-file diff from `HEAD` (raw exit `0`) | E0 repository changes | PASS | exactly five run artifacts; no `docs/site/**`, package/plugin, lock, S2 evidence, or S3 path | yes |
| Site gates | docs build and rendered-link checks | `docs/site/**` | N/A | E0 changes no docs-site file, so the conditional site gates do not apply | yes |
| PR state/body | read-only #1652 inspection | draft PR metadata and body | PASS | remains draft and partial with `Part of #1551`; the body records no stale example estimate, so no body/checklist or label mutation is warranted | yes |

### S3-docs-audit

| Gate | Commands / procedure | Scope | Result | Findings | Proceeded |
| --- | --- | --- | --- | --- | --- |
| Clean site, rendered links, caveats | `rtk proxy deno task --cwd docs/site verify` | full docs site | PASS / raw exit `0` | 644 files generated; 229 HTML pages pass rendered semantics; all 36,084 internal links resolve; 18 caveat markers across 14 pages resolve | yes |
| Source links | `rtk proxy deno task docs:links` | 103 published docs sources | PASS / raw exit `0` | zero broken links, anchors, or orphans | yes |
| Terminology and discoverability | `rtk proxy deno task docs:accuracy` plus manual comparison with `docs/site/glossary.md` | 201 published source pages and changed prose | PASS / raw exit `0` | accuracy/discoverability passes; evidence, contract, request-scoped resource, route, partial, presentation, domain, and deferred vocabulary is consistent with the glossary; existing peer warning is unrelated and non-failing | yes |
| `definePage` API sample | `deno doc --filter definePage packages/fresh/src/application/builders/mod.ts` | public builder surface only | PASS / raw exit `0` | public page-builder factory and composition surface support the inspected attribution | yes |
| `definePartial` API sample | `deno doc --filter definePartial packages/fresh/src/application/builders/mod.ts` | public partial-builder surface only | PASS / raw exit `0` | public partial binding surface supports the inspected attribution | yes |
| Defer API sample | `deno doc packages/fresh/src/application/defer/mod.ts` | public defer surface only | PASS / raw exit `0` | published defer policy surface supports the freshness terminology; no package source edit | yes |
| Diff hygiene | `git diff --check` | complete dirty S3 diff | PASS / raw exit `0` | no whitespace errors | yes |
| Lock hygiene | `git diff --exit-code origin/main -- deno.lock docs/site/deno.lock` | both lockfiles | PASS / raw exit `0` | both lockfiles unchanged | yes |
| Changed-line internal wording | dirty-tree equivalent of the plan's diff/`awk`/`rg` scan, run from `origin/main` and from S3 baseline `54e1c3bff` | branch-wide and S3-only added public lines | PASS / branch `rg` raw exit `0`; S3 `rg` raw exit `1` | branch-wide scan's only match is the already-signed-off S2 manifest's literal reproduction command containing `.llm/tools`; S3 has the expected no matches, so no new public prose exposes issue-number shorthand, harness, evaluator, worktree, or orchestrator wording | yes |
| Versionless specifier scan | exact `rg` scan from `plan.md` | comparisons and migration trees | PASS / raw `rg` exit `1` | expected no matches; no versionless `jsr:@netscript` specifier appears | yes |
| Navigation and front matter | manual source/rendered inspection after final verifier | comparison case, migration pages, and Concepts menu | PASS | both `/comparisons/` and `/migration/` render under Concepts; the new case, migration index, and Next.js roadmap have title/description and matching rendered title/H1; `_data.ts` necessity is recorded in `drift.md` | yes |
| Matrix completeness | inspect each matrix source row and delimiter shape | case mechanism matrix | PASS | every responsibility row has populated NetScript/Next.js mechanisms plus evidence, loser overhead, confidence, version sensitivity, and follow-up; no row declares an unsupported winner | yes |
| Evidence and privacy | compare every case number with S2 aggregate/manifest; prose/privacy review | case, index, migration pages | PASS | measured Session `94 / 92` and every aggregate cell trace exactly to S2; unmatched Next.js values remain absent/deferred; no private contents, CSS, fixtures, domain models, business prose, or credentials appear | yes |
| Prose and migration scope | compare with methodology, glossary, broad explanation, public builder/defer docs, and residual map | all changed public prose | PASS | migration maps only case-proven concepts and links the full-parity owner; `explanation/compared` stays linked and non-contradictory; unmeasured conclusions are inspected, inferred, or deferred with owners | yes |
| Canonical-comment consistency | compare case page with live comment `5265826161` and S2 authority | pin, counts, feature inventory, labels, deferrals | PASS | same pin, `94 / 92` measurement, generated routes, route-bound partials, cache-seed preservation, layout-faithful fallbacks, cold-navigation behavior, ownership boundaries, evidence labels, and deferred owners; no contradiction | yes |
| Scope | raw changed-path enumeration from S3 baseline | complete S3 slice | PASS | seven planned non-drift paths plus anticipated `_data.ts` and required `drift.md`; no package/plugin, lock, S2 evidence, external input, or unrelated path | yes |

At the original S3 handoff, no release gate, scaffold suite, E2E suite, expensive-gate lease, or
evaluator had been run. S3 stopped for topic-orchestrator Tier-A review without self-certification.

### IMPL-EVAL cycle 1 repair

| Gate / finding | Commands / procedure | Result | Findings |
| --- | --- | --- | --- |
| F1 — Channel evidence label | in-place edit and API readback of comment `5265971722` | PASS | `181 / 178` remains an honestly inspected count with its inline procedure; it is no longer called measured; the shared measured definition again requires a published script, pinned inputs, raw aggregate output, and environment metadata; no Channel evidence or remeasurement was added |
| F2 — immutable evidence links | land evidence commit `43c702b973a71b539ec16e4b93f2c7a2c09d9ab6`, then edit comment `5265826161` and the Session case to use its SHA permalinks | PASS | both comment links and both page links resolve through the immutable evidence commit rather than a mutable branch or superseded S2 commit |
| F3 — manifest metadata | `deno run --allow-read --allow-write --allow-run .llm/tools/docs/measure-comparison-surface.ts --manifest docs/site/comparisons/evidence/session-source-manifest.json --root eis-chat=/home/codex/repos/eis-chat-007-input --observed-at 2026-08-15T03:57:30Z --output .llm/tmp/session-measurements-repro.json`; then `cmp .llm/tmp/session-measurements-repro.json docs/site/comparisons/evidence/session-measurements.json` | PASS / raw `cmp` exit `0` | manifest and aggregate carry `frameworkVersions`, `featureFlags`, and `inspectedAt`; fixed-timestamp output is byte-identical; aggregates are unchanged |
| F4 — PR truthfulness | rewrite draft PR #1652 body after repository repair lands | PENDING external publication step | prepared body records landed P0/S1/S2/E0/S3 and cycle-1 repair, preserves `Part of #1551`, keeps Tier-A repair review and IMPL-EVAL cycle 2 unchecked, and does not change draft state or labels |
| F5 — matrix terminology | inspect the case-study matrix against methodology section 7 | PASS | final column is `Residual owner`, matching `## 7. Complete every matrix row` and its contract |
| Docs verifier | `rtk proxy deno task --cwd docs/site verify` | PASS / raw exit `0` | 644 files generated; 229 rendered pages pass semantics; all 36,084 internal links and 18 caveat markers resolve |
| Source links | `rtk proxy deno task docs:links` | PASS / raw exit `0` | 103 docs sources; zero broken links, anchors, or enforced orphans |
| Accuracy | `rtk proxy deno task docs:accuracy` | PASS / raw exit `0` | 201 published source pages pass; unrelated existing peer-dependency warning remains non-failing |
| Tool check | exact structured `run-deno-check.ts` command for the measurement tool and test | PASS / raw exit `0` | two files, one batch, zero occurrences |
| Tool lint | approved lint row | **N/A — not applicable** | root `deno.json` excludes `.llm/` from lint by deliberate repo-wide configuration; the wrapper correctly fails closed rather than reporting a false green. This is not passed, skipped, or waived |
| Tool format | exact structured `run-deno-fmt.ts` command for the measurement tool and test | PASS / raw exit `0` | two files, one batch, zero findings |
| Tool tests | exact structured `run-deno-test.ts` command for the measurement test | PASS / raw exit `0` | five passed, zero failed or ignored |
| Diff hygiene | `git diff --check` | PASS / raw exit `0` | no whitespace errors before run-artifact recording; repeated after the artifacts below |
| Lock hygiene | `git diff --exit-code origin/main -- deno.lock docs/site/deno.lock` | PASS / raw exit `0` | both lockfiles unchanged |
| Publication/privacy | API readback plus JSON and changed-prose inspection | PASS | comment `5265826161` updated `2026-08-15T05:53:57Z`; comment `5265971722` updated `2026-08-15T05:53:58Z`; no follow-up, private contents, credentials, CSS, fixtures, domain models, or business prose added |

The evaluator independently reconciled every S2 per-file aggregate, so this repair does not alter
those totals or the immutable consumer pin. It corrects evidence metadata, labels, permalinks, PR
state description, and matrix terminology only. The two-commit order is required because a page
cannot contain a permalink to the not-yet-known SHA of its own commit: `43c702b…` creates the
immutable evidence target, and the following docs/run-artifact commit links and records it. Stop
after the draft-PR handoff for topic-orchestrator Tier-A review; do not launch IMPL-EVAL cycle 2.

### Merge-readiness record cleanup after IMPL-EVAL cycle 2

| Finding / gate | Command or evidence | Result | Finding |
| --- | --- | --- | --- |
| N1 — normalized digest | delete `observedAt`, serialize with `JSON.stringify(value, null, 2) + "\n"`, then SHA-256 the immutable `43c702b…` aggregate | DOES NOT REPRODUCE | canonical output is `0be43e058bd8fdce8f4076fce9e94101fd43c643eadfef88475576245899c014`, not the claimed `3d9d2ee…`; the digest claim is removed from current records |
| N1 — byte-identical reproduction | exact measurement command recorded in the F3 row above; then `cmp .llm/tmp/session-measurements-repro.json docs/site/comparisons/evidence/session-measurements.json` | PASS / raw exit `0` | fixed `--observed-at 2026-08-15T03:57:30Z` regeneration is byte-identical; scratch output was removed after comparison |
| N2 — plan status | compare `plan.md` status with landed slices, Tier-A comment `5300864119`, and cycle-2 verdict `5300916189` | PASS | only the Status paragraph changed; locked decisions, slice definitions, and gate lists are untouched |
| N3 — internal records | compare the matrix contract with methodology section 7 and the PR checkbox with Tier-A sign-off comment `5300864119` | PASS | worklog citation corrected to section 7; only the already-proven Tier-A repair-review checkbox is authorized for the PR body |
| Diff hygiene | `git diff --check` | PASS / raw exit `0` | no whitespace errors before and after final run-artifact updates |
| Lock hygiene | `git diff --exit-code origin/main -- deno.lock docs/site/deno.lock` | PASS / raw exit `0` | both lockfiles unchanged |
| Conditional docs-site gate | changed-path inspection | N/A | no `docs/site/**` path changed, so the conditional site verifier does not apply |

No canonical #1551 comment, evidence file, product/docs content, pin, label, milestone, issue state,
draft state, or readiness disposition changed. Stop after the single cleanup commit, explicit push,
PR-body correction, and structured PR comment for topic-orchestrator Tier-A verification.

### CI readiness repair — agent docs corpus freshness

CI run `31869720549`, job `94976401345`, failed only the `quality` step **Agent docs corpus
freshness**. Local reproduction with `deno task check:agent-docs-prose` returned raw exit `1` and
`{"fresh":false,"stalePaths":["prose.json.gz","provenance.json"]}`. The canonical
`deno task gen:agent-docs-prose` generator returned raw exit `0`.

The regenerated corpus adds exactly the five expected rendered pages and removes none:

- `pages/comparisons/index.md`
- `pages/comparisons/methodology/index.md`
- `pages/comparisons/nextjs-session/index.md`
- `pages/migration/index.md`
- `pages/migration/nextjs/index.md`

| Asset | Before | After |
| --- | ---: | ---: |
| `.llm/assets/agent-docs/prose.json.gz` | 1,352,808 bytes | 1,372,269 bytes |
| `.llm/assets/agent-docs/provenance.json` | 8,857 bytes | 9,057 bytes |

New provenance records source commit `c8e3f26d8`, extraction timestamp
`2026-08-15T06:37:52.605Z`, 183 files, 4,783,855 uncompressed bytes, 1,372,269 compressed bytes,
and SHA-256 `6f25560210cae276a3a5149e7315b1e9682406acdfe342cadbe1c7f35c629efb`.

| Gate | Command / evidence | Result | Finding |
| --- | --- | --- | --- |
| Durable corpus freshness | `deno run --allow-read --allow-write --allow-run --allow-env .llm/tools/gates/run-gate.ts --gate agent-docs-prose --id docs-comparison-1551-agent-docs-prose --output .llm/tmp/gate-receipts/docs-comparison-docs-programme--1551/agent-docs-prose.json` | PASS / raw exit `0` | receipt `.llm/tmp/gate-receipts/docs-comparison-docs-programme--1551/agent-docs-prose.json` attests immutable head `c8e3f26d85c201827812e8292adb668d88b9c19d` and `fresh:true` |
| Site verification | `rtk proxy deno task --cwd docs/site verify` | PASS / raw exit `0` | 644 generated files, 229 rendered pages, 36,084 internal links, and 18 caveat markers verified |
| Docs links | `rtk proxy deno task docs:links` | PASS / raw exit `0` | 103 docs; no broken links, anchors, or orphans |
| Docs accuracy | `rtk proxy deno task docs:accuracy` | PASS / raw exit `0` | 201 published source pages and 183 shipped corpus files; existing peer warning remains non-blocking |
| Diff hygiene | `git diff --check` | PASS / raw exit `0` | no whitespace errors before run-artifact updates |
| Lock hygiene | `git diff --exit-code origin/main -- deno.lock docs/site/deno.lock` | PASS / raw exit `0` | both lockfiles unchanged |
| Source preservation | tracked changed-path enumeration after generation | PASS | only the two authorized generated assets changed before these append-only run-artifact updates; `_site` regeneration changed no tracked source |

Final slice scope is the two generated assets plus append-only updates to `worklog.md`,
`context-pack.md`, and `drift.md`. No evaluated docs page, evidence input, product path, lockfile,
consumer pin, canonical comment, or PR/issue metadata changed.

### Derived CLI asset amendment — embedded agent docs

The coordinator authorized the deterministic consequence of the approved corpus refresh:
`.llm/tools/generate-cli-assets-barrel.ts` reads the refreshed agent-docs provenance and gzip and
emits `packages/cli/src/kernel/assets/agent-docs.generated.ts`. **PLAN-EVAL: N/A** because this is
deterministic regenerated output from an already-approved input change, with no new architecture,
sequencing, scope, risk, or trade-off decision.

`deno task gen:assets-barrel` returned raw exit `0`. Changed-path inspection immediately afterward
showed only `plan.md` plus the authorized agent-docs target; no other barrel target moved. The
generated target has exactly 11 insertions and 6 deletions and carries source commit `c8e3f26d8`,
4,783,855 uncompressed bytes, 1,372,269 compressed bytes, and SHA-256
`6f25560210cae276a3a5149e7315b1e9682406acdfe342cadbe1c7f35c629efb`.

| Gate | Command / evidence | Result | Finding |
| --- | --- | --- | --- |
| Barrel freshness, unstaged diagnostic | exact durable command below before staging the generated delta | FAIL / raw exit `1` | `check:assets-barrel` ends with `git diff --exit-code` against the index, so it truthfully saw the unstaged intended delta |
| Barrel freshness, staged diagnostic | `deno run --allow-read --allow-write --allow-run --allow-env .llm/tools/gates/run-gate.ts --gate assets-barrel --id quality-assets-barrel --output .llm/tmp/gate-receipts/quality/assets-barrel.json` after staging only the generated target | PASS / raw exit `0` | regeneration matched the staged bytes, but this is not the authoritative CI-equivalent proof because the target still differed from `HEAD`; the exact command will be rerun after commit and its receipt reported on PR #1652 |
| Framework quality | `rtk proxy deno task quality:gate` | PASS / raw exit `0` | `quality:scan` reported no findings; chained `arch:check` ran distinctly and passed, so no duplicate standalone run was needed |
| Scoped type check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli/src/kernel/assets --ext ts` | PASS / raw exit `0` | 7 files selected, 1 batch, 0 findings |
| Scoped format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli/src/kernel/assets --ext ts` | N/A — not applicable / raw exit `2` | root `deno.json` excludes `packages/cli/` from `fmt` by deliberate repo-wide configuration; the wrapper selected the batch, observed the exclusion, and failed closed rather than reporting a false green |
| CLI publish surface | `deno publish --dry-run --allow-dirty` from `packages/cli` | PASS / raw exit `0` | chosen as the narrower, directly relevant proof that the embedded generated source is accepted in the CLI publish surface; existing dynamic-import warnings are unrelated |

The format row is not passed, skipped, or waived. A package-config diagnostic also returned raw
exit `2`, confirming that substituting `packages/cli/deno.json` does not manufacture a meaningful
format verdict. Root `lint.exclude` also excludes `packages/cli/`; no inapplicable lint row was run.

The post-commit durable receipt is intentionally not claimed in this pre-commit record. The
one-commit slice contract requires the final exact wrapper run against the committed head; its raw
exit, immutable head, and receipt path will be posted in the structured PR handoff.

| Preservation gate | Command / evidence | Result | Finding |
| --- | --- | --- | --- |
| Diff hygiene | `git diff --check && git diff --cached --check` | PASS / raw exit `0` | no whitespace errors across staged and unstaged portions of the one slice |
| Lock hygiene | `git diff --exit-code origin/main -- deno.lock docs/site/deno.lock` | PASS / raw exit `0` | both lockfiles unchanged |
| Exact scope | union of `git diff --name-only` and `git diff --cached --name-only` | PASS / raw exit `0` | exactly the generated target, `plan.md`, `worklog.md`, `context-pack.md`, and `drift.md`; no other source, docs content, or barrel target changed |
