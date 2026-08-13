# Plan — comparison docs programme #1551

Status: implementation blocked pending a separate opposite-family PLAN-EVAL `PASS` supplied through the topic orchestrator.

## Objective

Ship only the 0.0.7 comparison-docs leaf:

1. a comparison methodology and minimum Concepts navigation;
2. one immutable-source, evidence-backed but deferred `NetScript vs Next.js` Session case;
3. one `Migrate from Next.js` placeholder/roadmap entry; and
4. linked follow-up issues #1645–#1650 owning every residual #1551 deliverable.

The result teaches readers how to evaluate mechanisms without presenting provisional evidence as a benchmark. It changes no framework or plugin surface.

## Non-goals and stop conditions

- No public runnable Session fixture, comparative runtime/LSP benchmark, human/agent study, 50-topic programme, or full migration guide.
- No `packages/**`, `plugins/**`, dependency, lockfile, generated route, release, publication, scaffold, or expensive E2E change.
- No copy of private EIS-Chat code, CSS, domain models, fixtures, or business prose.
- No update to #1551's body, status, milestone, or completion state from this leaf.
- No ready-for-review transition, merge, self-evaluation, Tier-A certification, or release action.

Any need to cross those boundaries is significant drift and a hard stop for topic-orchestrator direction.

## Locked design decisions

1. **IA:** add `/comparisons/` and `/migration/` as roots in the existing Concepts lane; do not create a sixth top-level lane.
2. **Cross-references:** register stable xrefs for the methodology, Session case, migration index, and Next.js roadmap page.
3. **Evidence labels:** every claim is `measured`, `inspected`, `inferred`, or `deferred`. “Provisional” is source status, never measurement status.
4. **Version pin:** Next.js is exact `16.3.0`, verified from the official stable release on 2026-08-13. The private consumer is exact EIS commit `5191de83f3da97559f21d8891c6c8afdf1cf473a`, using NetScript `0.0.6` and Fresh `^2.3.3`.
5. **Presentation:** domain projections, leaf components, test data, CSS, and deployment assumptions are held constant by the equivalence contract and excluded or separately classified. They are never copied.
6. **Numbers:** only aggregate outputs produced by the checked-in script from a pinned manifest are measured. No estimated Next.js number will appear beside a measured NetScript number.
7. **Matrix:** each row records mechanism, evidence locator/status, loser overhead, confidence, version sensitivity, and residual owner.
8. **Closure:** the PR body says `Part of #1551`. The issue cannot be truthfully auto-closed while its live acceptance contract still includes deferred work.

## Ordered slices

Each implementation slice remains below 30 changed files, runs its named gate before commit, updates `worklog.md` and `context-pack.md` in the same commit, pushes only with `git push origin HEAD:refs/heads/docs/comparison-docs-programme`, and posts the matching structured PR comment.

### P0 — research and plan bootstrap (this turn)

Files:

- `.llm/runs/docs-comparison-docs-programme--1551/research.md`
- `.llm/runs/docs-comparison-docs-programme--1551/plan.md`
- `.llm/runs/docs-comparison-docs-programme--1551/worklog.md`
- `.llm/runs/docs-comparison-docs-programme--1551/context-pack.md`
- `.llm/runs/docs-comparison-docs-programme--1551/drift.md`
- `.llm/runs/docs-comparison-docs-programme--1551/supervisor.md`
- `.llm/runs/docs-comparison-docs-programme--1551/implement.md`
- `.llm/runs/docs-comparison-docs-programme--1551/codex-thread-ids.md`

Gate `P0-plan-integrity`:

- raw Git confirms exact baseline, branch, and no upstream;
- `git diff --check` passes;
- changed paths are run artifacts only;
- neither lockfile differs;
- follow-ups #1645–#1650 have the approved labels and Backlog / Triage milestone;
- draft PR exists with milestone 0.0.7, docs CI-skip labels, and exactly one lifecycle status;
- RESEARCH and PLAN comments are posted;
- separate PLAN-EVAL remains pending.

Stop after this slice. Do not begin S1 without an external PLAN-EVAL `PASS`.

### S1 — methodology and minimum navigation

Files:

- `docs/site/_data.ts`
- `docs/site/_data/xref.ts`
- `docs/site/comparisons/index.md`
- `docs/site/comparisons/methodology.md`
- `.llm/runs/docs-comparison-docs-programme--1551/worklog.md`
- `.llm/runs/docs-comparison-docs-programme--1551/context-pack.md`

Content contract:

- define audience, equivalence contract, ASC rules, evidence labels, source manifests, measurement repeatability, presentation normalization, version/freshness metadata, matrix columns, and update policy;
- identify the existing broad `explanation/compared` page as related orientation rather than replace or contradict it;
- add the two folder roots under Concepts and stable xrefs;
- link the six residual issues as the public programme roadmap.

Gate `S1-method-nav`:

```text
rtk proxy deno task --cwd docs/site build
rtk proxy deno task docs:links
git diff --check
```

Manual assertions: both roots appear under Concepts in rendered navigation; front matter/title/description are present; no case-result claim exists yet; the current broad comparison page remains linked and non-contradictory.

Commit intent: `docs(comparison): establish evidence methodology and navigation`.

### S2 — immutable evidence manifest and measurement procedure

Files:

- `.llm/tools/docs/measure-comparison-surface.ts`
- `.llm/tools/docs/measure-comparison-surface_test.ts`
- `docs/site/comparisons/evidence/session-source-manifest.json`
- `docs/site/comparisons/evidence/session-measurements.json`
- `.llm/runs/docs-comparison-docs-programme--1551/worklog.md`
- `.llm/runs/docs-comparison-docs-programme--1551/context-pack.md`

Tool contract:

- accept an explicit manifest plus authorized local roots rather than fetching or storing private source;
- require the immutable repository revision before reading files;
- classify each path as framework glue, consumer orchestration, presentation/domain held constant, generated, or excluded;
- count physical, nonblank, comment, and token inputs with a fully documented deterministic policy;
- emit stable JSON with tool version, timestamp, source revision, file hashes, inclusion classes, and totals;
- refuse missing/mismatched files or revisions;
- never emit file contents;
- record unmatched Next.js values as absent/deferred, not zero or estimated.

Gate `S2-evidence-repro`:

```text
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/docs/measure-comparison-surface.ts --root .llm/tools/docs/measure-comparison-surface_test.ts --ext ts
deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root .llm/tools/docs/measure-comparison-surface.ts --root .llm/tools/docs/measure-comparison-surface_test.ts --ext ts
deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root .llm/tools/docs/measure-comparison-surface.ts --root .llm/tools/docs/measure-comparison-surface_test.ts --ext ts
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-read --allow-write .llm/tools/docs/measure-comparison-surface_test.ts
git diff --check
```

Manual assertions: regenerated JSON is byte-stable after removing the declared observation timestamp; the checked-in aggregates reproduce from authorized pinned inputs; no private source content or credentials are present; unmatched values remain explicitly deferred.

Commit intent: `docs(comparison): publish reproducible Session evidence inputs`.

### S3 — deferred Session case and migration roadmap

Files:

- `docs/site/_data/xref.ts`
- `docs/site/comparisons/index.md`
- `docs/site/comparisons/nextjs-session.md`
- `docs/site/migration/index.md`
- `docs/site/migration/nextjs.md`
- `.llm/runs/docs-comparison-docs-programme--1551/worklog.md`
- `.llm/runs/docs-comparison-docs-programme--1551/context-pack.md`
- `.llm/runs/docs-comparison-docs-programme--1551/drift.md` only if implementation reality diverges

Case-study structure:

1. versions, immutable sources, freshness date, and evidence legend;
2. complete shared equivalence contract;
3. corrected inspected NetScript Session architecture, with consumer-owned helpers distinguished from framework APIs;
4. official Next.js 16.3.0 mechanism mapping for routing, Cache Components, request inputs, cache clocks, Suspense, parallel-route failure isolation, navigation transport, and metadata;
5. matrix with mechanism/evidence/loser overhead/confidence/version sensitivity/follow-up in every row;
6. reproducible aggregate evidence and explicit absent/deferred measurements;
7. limitations and links to #1645–#1649;
8. migration roadmap that maps only case-proven concepts and sends the full parity checklist to #1650.

Gate `S3-docs-audit` is the merge-readiness docs audit, not a release or scaffold gate:

```text
rtk proxy deno task --cwd docs/site verify
rtk proxy deno task docs:links
rtk proxy deno task docs:accuracy
deno doc --filter definePage packages/fresh/src/application/builders/mod.ts
deno doc --filter definePartial packages/fresh/src/application/builders/mod.ts
deno doc packages/fresh/src/application/defer/mod.ts
git diff --check
git diff --exit-code origin/main -- deno.lock docs/site/deno.lock
```

Changed-line internal-wording scan, expected no matches:

```text
git diff --unified=0 --no-color origin/main...HEAD -- docs/site | awk '/^\+[^+]/ { print }' | rg -n '(#1551|#164[5-9]|#1650|\.llm/|harness|PLAN-EVAL|IMPL-EVAL|Tier-A|worktree|orchestrator)'
```

Versionless NetScript specifier scan, expected no matches:

```text
rg -n 'jsr:@netscript/[^@[:space:]`"]+(?:[/[:space:]`"]|$)' docs/site/comparisons docs/site/migration
```

The worklog gate table records these required rows separately: links, clean site build, changed-line internal-wording scan, specifier scan, command/API sampling, navigation/front matter, prose, and cross-page contradictions. For every row it records command/procedure, exact scope, result, findings, and whether work proceeded. The prose review verifies neutral language, evidence labels, no winner claim, no hidden private detail, and no contradiction with `explanation/compared.md`, builder/defer docs, the migration placeholder, or another matrix row.

Commit intent: `docs(comparison): add deferred Next.js Session case`.

## Risk register

| Risk | Likelihood / impact | Control | Stop condition |
| --- | --- | --- | --- |
| Private consumer details leak into public docs | Medium / critical | Publish immutable identifiers, classifications, and aggregates only; never code, CSS, fixtures, secrets, or business data. | Any public text requires copying non-public source. |
| Stale provisional comment becomes “measurement” | High / high | Discard estimates; generate numbers only through the S2 script. | A number lacks pinned raw inputs and procedure. |
| False Next.js cache equivalence | High / high | Pin 16.3.0; distinguish `stale`, `revalidate`, `expire`, `revalidateTag`, and `updateTag`; mark mapping confidence. | Primary docs cannot support the mechanism claim. |
| Failure-isolation overclaim | Medium / high | Map independent failure to parallel-route slots plus error files; mark ordinary sibling/Suspense behavior insufficient. | No inspected mechanism preserves the equivalence invariant. |
| Consumer helper misattributed to NetScript | Medium / high | Separate local `defineRegion`/region components from public `definePage`, `definePartial`, and defer APIs. | Public API cannot be proven by `deno doc`. |
| Nav churn or contradictory positioning | Low / medium | Reuse Concepts; preserve and cross-link the broad comparison explanation. | Clean build/nav rendering disagrees with planned IA. |
| Scope expands into framework behavior | Medium / critical | SCOPE-docs overlay and hard path gate. | Any required edit under `packages/**` or `plugins/**`. |
| PR falsely closes #1551 | Medium / high | `Part of #1551`, residual map, no closing keyword. | Live acceptance remains unreconciled, as it does now. |
| Lock or dependency churn from docs commands | Low / high | Snapshot/diff both lockfiles; no reload. | Either lockfile changes. |

## Deferred acceptance map

| #1551 residual | Follow-up |
| --- | --- |
| Runnable/linkable public pair, complete ASC inventory, comparable LOC/file/token and presentation measurements | #1645 |
| Type continuity, unsafe seams, contract mutations, diagnostic quality, cold/warm LSP | #1646 |
| Runtime/freshness/navigation/failure-isolation measurement | #1647 |
| Human and coding-agent discovery evidence | #1648 |
| Channel form case and remaining comparison topics | #1649 |
| Full concept map and parity-derived migration guide | #1650 |

## Review and handoff

After external PLAN-EVAL `PASS`, implement one slice at a time. After each slice: run its gate, update run artifacts, commit, push explicitly, and post the structured slice comment. After S3, stop for topic-orchestrator Tier-A review. Address Tier-A findings in bounded fix slices with the same gate/update/push/comment rhythm, then stop for a fresh opposite-family IMPL-EVAL. The generator never marks the draft ready or merges it.
