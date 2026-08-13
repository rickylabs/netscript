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
| Draft PR metadata | GitHub PR/label/milestone/comment inspection | draft PR | PENDING | create only after P0 commit and explicit push | no |
| PLAN-EVAL | fresh opposite-family evaluator | research/plan and PR | PENDING | implementation remains blocked | no |

### Planned S3 docs-audit rows

| Gate | Commands / procedure | Scope | Result | Findings | Proceeded |
| --- | --- | --- | --- | --- | --- |
| Links | `deno task --cwd docs/site verify`; `deno task docs:links` | new/changed public pages and whole site | NOT RUN | implementation not started | no |
| Clean site build | `deno task --cwd docs/site verify` from clean generated output | full docs site | NOT RUN | implementation not started | no |
| Changed-line internal wording | exact diff/`awk`/`rg` command from `plan.md` | added public lines only | NOT RUN | implementation not started | no |
| Specifier scan | exact versionless `jsr:@netscript` scan from `plan.md` | comparisons and migration trees | NOT RUN | implementation not started | no |
| Command/API sampling | three `deno doc` commands from `plan.md` | cited builder/defer mechanisms | NOT RUN | implementation not started | no |
| Navigation/front matter | rendered nav plus front-matter/title/description inspection | five planned public pages | NOT RUN | implementation not started | no |
| Prose | neutral-language/evidence/private-detail review | all changed public prose | NOT RUN | implementation not started | no |
| Cross-page contradictions | compare broad explanation, methodology, case, migration, builder/defer docs, and matrix rows | related public surfaces | NOT RUN | implementation not started | no |

No S1–S3 implementation gate, release gate, scaffold suite, or E2E suite has been run in this planning turn.
