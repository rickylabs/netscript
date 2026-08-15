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
| 2026-08-15 | S2 tool, tests, manifest, and aggregate drafted. | same-timestamp checked-in output reproduces; removing `/observedAt` yields stable digest `b9e96ed24fa64fe4a9d06bc4c51e5be1c6da8938ff4cba0baec7945cb5cdbaa9`; measured-file output has path/classification/hash/counts only; Next.js is absent/deferred |
| 2026-08-15 | Literal S2 lint gate refused a false green. | mandatory wrapper exit `2`: root config excludes `.llm/`; explicit existing-config diagnostic exit `0`, two files and zero findings; stopped for gate correction |
| 2026-08-15 | Topic orchestrator corrected the S2 lint row to N/A and S2 gates completed. | root `.llm/` exclusion is deliberate repo-wide configuration, so exit `2` is fail-closed evidence rather than a pass, skip, or waiver; all applicable tool, site, diff, privacy, reproduction, scope, and lock checks pass |

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
| Reproduction | run the checked-in tool at the checked-in timestamp and two alternate timestamps; compare serialized output after deleting `/observedAt` | manifest, measurement JSON, authorized input root | PASS | same-timestamp output exactly matches the checked-in JSON; timestamp-normalized outputs are byte-stable with SHA-256 `b9e96ed2…`; no private source text field is emitted | yes |
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
aggregate; after deleting the declared `/observedAt` field, the normalized SHA-256 is
`b9e96ed24fa64fe4a9d06bc4c51e5be1c6da8938ff4cba0baec7945cb5cdbaa9`.

### Planned S3 docs-audit rows

| Gate | Commands / procedure | Scope | Result | Findings | Proceeded |
| --- | --- | --- | --- | --- | --- |
| Links | `deno task --cwd docs/site verify`; `deno task docs:links` | new/changed public pages and whole site | NOT RUN | implementation not started | no |
| Clean site build | `deno task --cwd docs/site verify` from clean generated output | full docs site | NOT RUN | implementation not started | no |
| Changed-line internal wording | exact diff/`awk`/`rg` command from `plan.md` | added public lines only | NOT RUN | implementation not started | no |
| Specifier scan | exact versionless `jsr:@netscript` scan from `plan.md` | comparisons and migration trees | NOT RUN | implementation not started | no |
| Command/API sampling | three `deno doc` commands from `plan.md` | cited builder/defer mechanisms | NOT RUN | implementation not started | no |
| Navigation/front matter | rendered nav plus front-matter/title/description inspection | five planned public pages and both Concepts roots | NOT RUN | S3 inherits the `/migration/` rendered-root assertion and must assert both `/comparisons/` and `/migration/` after its migration pages land | no |
| Prose | neutral-language/evidence/private-detail review | all changed public prose | NOT RUN | implementation not started | no |
| Cross-page contradictions | compare broad explanation, methodology, case, migration, builder/defer docs, and matrix rows | related public surfaces | NOT RUN | implementation not started | no |

No S3 implementation gate, release gate, scaffold suite, E2E suite, or expensive-gate lease has
been run. S2 stops here for topic-orchestrator Tier-A review; this generator does not self-certify.
