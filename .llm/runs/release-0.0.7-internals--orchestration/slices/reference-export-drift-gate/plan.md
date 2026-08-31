# Plan: reference-export-drift-gate

> **AMENDED — coordinator scope amendments SA-1/SA-1a/SA-2/SA-3, 2026-08-15.** The authoritative
> amendment record is `scope-amendment.md` in this slice directory. SA-1 adds one test-only path and
> waives `fresh-browser`; SA-1a corrected that path audit; SA-2 grants exactly three
> JSDoc-import-line paths, corrects the inherited CI premise, and resolves PLAN-EVAL cycle-1
> findings N1-N5. After CI exposed the tracked agent-docs mirrors omitted by the original plan, SA-3
> grants exactly four generator-owned paths. The live authorized implementation surface is
> **seventeen paths**. Where older text conflicts, SA-3 governs.

## Run metadata

| Field                     | Value                                                                          |
| ------------------------- | ------------------------------------------------------------------------------ |
| Run ID                    | `release-0.0.7-internals--orchestration/slices/reference-export-drift-gate`    |
| Leaf / lane               | `reference-export-drift-gate` / wave 2 internals                               |
| Branch / base             | `fix/reference-export-drift-gate` / `baf1cdf67a4e931af17b4772ddf6101f36152184` |
| Phase                     | SA-3 plan-only amendment; generation prohibited until fresh Tier-A PASS        |
| Closing issue             | exactly `Closes #1296`                                                         |
| Archetype                 | frozen `6 — CLI / Tooling`                                                     |
| Overlays                  | `frontend`, `docs`                                                             |
| Package doctrine subjects | Contracts: Archetype 1 / Keep; Fresh UI: Archetype 4 / Keep                    |

## Goal

Make the claimed reference boundary falsifiable: correct all four remaining shipped Contracts
example import lines, reconcile Fresh UI's reference with its six-entrypoint/168-symbol published
surface, make every symbol-coverage omission an explicit machine-readable policy decision, document
the maintainer update path, and make the already-enforced drift gate directly discoverable through
named local and Pages verification edges.

SA-3 additionally restores the tracked publication cascade that the Fresh UI reference edit makes
stale: canonical agent-docs prose/provenance, its published CLI embedding, and the MCP publish
mirror that carries the corpus provenance. These files will be regenerated only through their
canonical generators after coordinator Tier-A PASS.

The leaf preserves the already-correct Contracts root exports/examples and does not manufacture a
`docs/exports` inventory.

## Live acceptance contract

| Live row                                                | Baseline truth                                                                                                                                                                                                                                                     | Planned closure                                                                                                                                                            |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contracts reference inventory advertises no non-exports | **Partially satisfied.** Five of nine implementation-example lines are baseline-correct (two CRUD plus three root); all four specifically briefed root symbols resolve, but four implementation examples import six symbols from a root that does not export them. | S1 changes only those four `@example` import subpaths. `Closes #1296` is honest because SA-2 covers the full measured residual, not because the baseline row was complete. |
| Fresh UI reference matches published exports            | Unsatisfied: six entrypoints exist, 168 unique symbols derive live, and symbol checking is disabled.                                                                                                                                                               | S1 repairs the page and enables complete-mode enforcement after fixing parser false positives.                                                                             |
| Intentional omissions are machine-readable              | Unsatisfied: boolean `checkSymbols: false` can silently skip coverage.                                                                                                                                                                                             | S1 adds reason-bearing discriminated coverage, refusal semantics, and N2's always-visible coverage report.                                                                 |
| Maintainer runbook and drift verification               | Enforcement already exists fail-closed in non-draft CI through quality -> gate catalog -> `docs:accuracy` -> checker; no named direct task/Pages identity/runbook exists.                                                                                          | S1 documents the runbook; S2 adds named local and Pages identities while preserving, not claiming, the existing enforcement chain.                                         |

The five issue checkboxes remain separately mapped to Contracts example imports, Contracts reference
inventory, Fresh UI reference truth, machine-readable omissions, and runbook/discoverable
verification. SA-3 does not check or rewrite any box; it repairs the generated publication evidence
required by the already-authored Fresh UI reference change.

## Exact narrowed edit surface (locked)

The frozen contract's nine implementation paths are narrowed below. SA-1 adds one test-only path;
SA-2 adds three JSDoc-import-line-only paths; SA-3 adds four verified generator-owned paths. The
live authorized surface is therefore **seventeen paths**. Run artifacts requested by the coordinator
are control-plane records, not implementation paths.

| Frozen path                                                 | Planned action                           | Per-path justification                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/`                                        | Edit only `.github/workflows/pages.yml`. | Add one named `deno task docs:exports-drift` step in the existing build job. Current triggers already cover docs, packages, plugins, docs tooling, and root task configuration; no new workflow or path filters.                                                        |
| `.llm/tools/docs/check-accuracy-and-discoverability.ts`     | Edit only the existing child invocation. | Call the named task instead of a hidden raw script argv while preserving fail-closed child-exit handling and single execution under `docs:accuracy`.                                                                                                                    |
| `.llm/tools/docs/check-exports-drift.ts`                    | Edit.                                    | Introduce reason-bearing symbol coverage policy, reject invalid/empty policy, parse only actual symbol-inventory tables, normalize display generics, support explicitly labeled doc-only copy-source symbols, and enable Fresh UI symbol checking without false greens. |
| `deno.json`                                                 | Edit tasks only.                         | Add `docs:exports-drift` with least required permissions. Keep `docs:accuracy` and therefore `docs:maintenance` as the aggregate local path; do not duplicate the drift command in the same maintenance run.                                                            |
| `docs/exports`                                              | **Do not create or edit.**               | No baseline/history path, producer, or consumer exists. The live checker derives inventories in memory; creating this directory would add a drifting second authority. This frozen entry is stale.                                                                      |
| `docs/site/reference/fresh-ui/index.md`                     | Edit.                                    | Correct stale public-surface claims; add the missing desktop, ActionMenu/Combobox, registry, render-UI, DataGrid, namespace/contract inventory; keep Dropzone visibly copy-source; add maintainer regeneration/update runbook.                                          |
| `packages/contracts/src/application/contract-primitives.ts` | **Do not edit.**                         | The named examples already import valid root exports. Editing would falsely claim work already present at baseline and would create unnecessary published JSDoc delta.                                                                                                  |
| `packages/contracts/src/application/paginated-query.ts`     | Edit JSDoc only.                         | Change the shipped module example from the non-exporting root to `@netscript/contracts/query`. No runtime/type semantics.                                                                                                                                               |
| `packages/contracts/src/public/mod.ts`                      | **Do not edit.**                         | The briefed contract symbols already resolve from the root. No export addition/removal is warranted.                                                                                                                                                                    |

**SA-1.** One additional implementation path is authorized, **test-only**:

| Amended path                                  | Planned action                   | Per-path justification                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.llm/tools/docs/check-exports-drift_test.ts` | **Edit — test assertions only.** | S1 lands fail-closed coverage-policy semantics (D2-D5) whose refusal paths are load-bearing: empty/malformed reasons, unknown coverage modes, invented symbols, and omitted symbols must each exit nonzero. Proving that with one-off probes leaves no artifact that can fail a future CI run. Persistent test cases are the only durable proof. No product, config, or generated file may be edited under this path. |

**SA-2.** Exactly three additional implementation paths are authorized, and only the published JSDoc
example import line may change:

| Amended path                                              | Planned action                           | Per-path justification                                                                                                            |
| --------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `packages/contracts/src/application/transform-helpers.ts` | Edit the `@example` import subpath only. | `createTransformer` is absent from root (`EXIT=1`) and present on `/transform` (`EXIT=0`).                                        |
| `packages/contracts/schemas/filters.ts`                   | Edit the `@example` import subpath only. | `FilterConditionSchema` and `buildPrismaWhere` are absent from root (`EXIT=1` each) and present on `/query` (`EXIT=0` each).      |
| `packages/contracts/schemas/pagination.ts`                | Edit the `@example` import subpath only. | `PaginationInputSchema` and `createPaginatedOutput` are absent from root (`EXIT=1` each) and present on `/query` (`EXIT=0` each). |

**SA-3.** Exactly four additional generated paths are authorized. They must be changed only by the
named canonical generator; hand-editing any generated content is prohibited:

| Amended path                                             | Owner / planned action              | Per-path justification                                                                                                                                                                 |
| -------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.llm/assets/agent-docs/prose.json.gz`                   | `gen:agent-docs-prose`; regenerate. | The rendered corpus includes `pages/reference/fresh-ui/index.md`; the repaired page changes from 18,895 to 26,411 bytes in the scratch-derived payload and therefore changes the gzip. |
| `.llm/assets/agent-docs/provenance.json`                 | `gen:agent-docs-prose`; regenerate. | Records canonical corpus sizes, digest, file set, and source commit; it must describe the regenerated gzip exactly.                                                                    |
| `packages/cli/src/kernel/assets/agent-docs.generated.ts` | `gen:assets-barrel`; regenerate.    | Embeds the exact gzip bytes and provenance in published `@netscript/cli`; scratch generation changed source commit, sizes, digest, and base64 payload.                                 |
| `packages/mcp/src/publish-assets.generated.ts`           | `gen:publish-assets`; regenerate.   | Fresh UI is not in MCP's bounded 12-document selection, so prose bytes stay fixed, but the published fallback provenance legitimately advances its `sourceCommit`.                     |

The scratch control also proved what is **not** in the cascade. `gen:mcp-export-corpus` changes
`packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts` at both base
and leaf head, and the two regenerated files are byte-identical. Its check is already raw-exit-1 red
at base `baf1cdf67`; that is pre-existing drift, not propagation from this leaf, so SA-3
deliberately excludes the file and will not regenerate it. The broad `PUBLISH_ASSET_OUTPUTS` list is
likewise not authority to rewrite unaffected outputs; scratch generation found no other changed
path.

The prohibition stands for **everything else**: do not touch the Contracts reference page, any Fresh
UI package source/config, MySQL package/reference paths, `deno.lock`, doctrine/debt, central cluster
state, or another lane's worktree. SA-3 supersedes the former fourteenth-path refusal for only the
four paths above. An **eighteenth** implementation path is rescope: stop and request it from the
coordinator.

## Locked decisions

| ID  | Decision                                                                                                                                                                                                                                   | Rationale                                                                                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Keep package `deno.json.exports` and per-entrypoint `deno doc --json` as the sole export/symbol authority; never materialize `docs/exports`.                                                                                               | Avoids a second generated/handwritten inventory and preserves A1/A14 dependency direction.                                                                                                      |
| D2  | Replace `checkSymbols` + free-standing `excludedSymbols` with a discriminated `symbolCoverage` policy.                                                                                                                                     | A boolean `false` silently disables proof. A discriminant makes completeness versus deliberate entrypoint-only coverage machine-readable and exhaustively consumable.                           |
| D3  | `symbolCoverage` has two modes, both with a required nonempty coverage reason: `complete` additionally has reason-bearing omission groups; `entrypoints-only` records why symbol comparison is deferred.                                   | Every package can print mode + reason on every run. A skipped gate is a policy fact, not missing configuration; empty/malformed reasons refuse.                                                 |
| D4  | Complete-mode mappings may name reason-bearing `documentedNonExports` groups for copy-source/API-adjacent symbols that the page explicitly labels as non-package exports.                                                                  | Fresh UI's Dropzone section is useful and honest. The checker must distinguish explicit copy-source docs from invented package exports without globally weakening invented-symbol detection.    |
| D5  | Parse symbol inventories only from Markdown tables whose first header cell is exactly `Symbol`; ignore prop/field/shape tables, strip display generic suffixes such as `<T>`, and retain grouped symbol-cell support.                      | Eliminates the measured false positives (`columns`, `label`, `layout`, generic display names) before enabling enforcement. Exclusions must never compensate for parser defects.                 |
| D6  | Fresh UI uses `complete` mode. Document user-facing components/functions/constants/namespaces and their public contract families; every intentionally omitted low-level member type is enumerated in sorted reason-bearing groups.         | Repairs the reproduced Fresh UI surface and makes remaining curation auditable. A newly exported symbol must be documented or explicitly classified before the gate returns green.              |
| D7  | Existing currently entrypoint-only mappings remain entrypoint-only only with explicit reasons; Config, Contracts, Fresh UI, and Telemetry remain/enter complete mode.                                                                      | Satisfies machine-readable omission policy without pretending this leaf authored complete prose for unrelated packages. Promotion of other packages can occur independently.                    |
| D8  | Correct the example import line in `paginated-query.ts` to `/query`, `transform-helpers.ts` to `/transform`, and `schemas/filters.ts` plus `schemas/pagination.ts` to `/query`; preserve `contract-primitives.ts` and `src/public/mod.ts`. | Independent `deno doc` proves the briefed root symbols are valid and all six residual symbols are absent from root but present on the ruled subpaths. All changes are shipped JSDoc prose only. |
| D9  | Add `docs:exports-drift`; make `docs:accuracy` call it; add the same named task as an explicit Pages build step.                                                                                                                           | Improves the direct discoverability of a gate already enforced fail-closed through non-draft CI quality, while retaining the aggregate and avoiding duplicate execution within either path.     |
| D10 | The Fresh UI runbook documents derivation, not file generation: inspect every `deno.json.exports` entry with `deno doc --json`, update the page and coverage policy, run the direct drift task, then the aggregate accuracy task.          | There is no generator today. Calling a manual derived update "regeneration" is honest only when the source of truth and verification steps are explicit.                                        |
| D11 | Do not tune the checker to baseline green. First land semantics that refuse malformed coverage, then reconcile the page/policy until the unchanged live export authority passes.                                                           | Coverage and compliance remain distinct. A real red after wiring is reported red.                                                                                                               |
| D12 | Regenerate only the verified four-file agent-docs publication cascade: prose and provenance first, MCP publish assets second, CLI assets barrel third. Do not run `gen:mcp-export-corpus`.                                                 | Scratch generation assigns clear ownership and proves no other output changes; the export corpus is an unrelated baseline red whose base/head regenerated bytes are identical.                  |
| D13 | Prove idempotence by comparing the first and second canonical regeneration diffs, committing the content, rerunning all three generators at that clean committed head, and requiring no further diff or non-cascade path.                  | A generated tree is trustworthy only when rerunning its owners is a no-op; a broad output manifest is not permission to accept unrelated churn.                                                 |
| D14 | Treat the CLI and MCP generated files as real publish deltas and re-audit both members.                                                                                                                                                    | Both members publish generated source under `src/**/*.ts`; upgrading consumers receive refreshed offline agent-docs content/provenance even though no export map, runtime API, or pin changes.  |

## Open-decision sweep

| Decision                                                       | Status               | Resolution                                                                                                                      |
| -------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Whether `docs/exports` should be created                       | resolved now         | No; stale frozen entry, explicitly non-touched.                                                                                 |
| Machine-readable omission format                               | resolved now         | D2-D4 discriminated, reason-bearing mapping policy.                                                                             |
| Symbol-table parser boundary                                   | resolved now         | D5 exact `Symbol` header plus display-name normalization.                                                                       |
| Direct task versus aggregate versus workflow discoverability   | resolved now         | D9 combination: named task, already-enforced accuracy/maintenance aggregate, explicit Pages step.                               |
| Whether the briefed Contracts root exports need edits          | resolved now         | No; baseline-earned. Four other shipped import lines are repaired under SA-2.                                                   |
| Whether the three PLAN-EVAL-discovered files may change        | resolved by SA-2     | Yes, exactly the `@example` import subpath; no runtime/type/export/schema edits.                                                |
| Which tracked agent-docs outputs the Fresh UI edit invalidates | resolved by SA-3     | Exactly the four D12 paths; scratch generation and a base control exclude the MCP export corpus and all other manifest outputs. |
| Whether package-source doc-lint debt should be fixed           | safe to defer        | Outside frozen paths; record baseline reds without weakening gates.                                                             |
| Whether every mapped package should become symbol-complete now | safe to defer        | This leaf makes non-complete status explicit/reasoned; unrelated prose expansion is separate scope.                             |
| Whether Fresh browser proof must run                           | **resolved by SA-1** | **N/A / waived.** No route/component/island/interaction behavior changes. `NOT_RUN` preserved; no runtime lease.                |

No unresolved implementation decision remains. `fresh-browser` is already N/A/waived. SA-3
generation remains prohibited until the coordinator's fresh Tier-A returns PASS.

## Ordered implementation slices

### S1 — make reference coverage explicit and reconcile the live surfaces

- Files: `.llm/tools/docs/check-exports-drift.ts`, `docs/site/reference/fresh-ui/index.md`,
  `.llm/tools/docs/check-exports-drift_test.ts`,
  `packages/contracts/src/application/paginated-query.ts`,
  `packages/contracts/src/application/transform-helpers.ts`,
  `packages/contracts/schemas/filters.ts`, `packages/contracts/schemas/pagination.ts`, and slice run
  artifacts.
- Introduces:
  - the discriminated reason-bearing coverage policy and fail-closed validation;
  - **N2:** an unconditional per-package coverage report on every run containing coverage mode, the
    reason (including complete-mode rationale), and omission-group counts, before the terminal
    verdict, so `PASS` cannot hide entrypoint-only packages;
  - **N3:** an injectable, exported `checkDrift(mapping: AuthoritativeMapping): Promise<number>`
    seam. It validates the supplied mapping and returns nonzero for malformed policy or drift; the
    `if (import.meta.main)` guard passes `AUTHORITATIVE_MAPPING` and binds process status with
    `Deno.exit(await checkDrift(AUTHORITATIVE_MAPPING))`. Tests import `checkDrift` and pass invalid
    fixture mappings directly without triggering `main`, so the hardcoded production constant does
    not make the four refusal cases untestable;
  - table-aware symbol parsing and generic normalization;
  - Fresh UI complete-mode enforcement, documented non-export classification, and exact omission
    groups;
  - repaired Fresh UI reference sections and the maintainer derivation/update runbook;
  - the corrected import subpaths in all four shipped Contracts JSDoc examples.
- Proves: the existing negative export fixture remains green, while empty/malformed reason, unknown
  coverage mode, invented symbol, and omitted symbol fixture mappings each make the injected
  `checkDrift` result nonzero. The direct drift command reports the honestly reconciled live state.
- **N1:** raw exit 0 is not an S1 commit condition. If honest reconciliation leaves a residual red,
  S1 is committed with that residual reported **red**, including the exact omissions/inventions and
  raw exit. It is never tuned away or withheld merely to manufacture green; D11 governs.
- Slice review: confirm exclusions classify real exported symbols only, each reason is substantive,
  Dropzone remains visibly non-exported, and no Contracts runtime/export changes entered the diff.

### S2 — expose and execute the gate through the documentation path

- Files: `deno.json`, `.llm/tools/docs/check-accuracy-and-discoverability.ts`,
  `.github/workflows/pages.yml`, and slice run artifacts.
- Introduces: named least-permission `docs:exports-drift` task, aggregate invocation from
  `docs:accuracy`, and a named Pages verification step.
- Proves:
  - direct search now finds the task and Pages identity, while the record continues to attribute
    pre-existing non-draft CI enforcement to the quality/catalog/accuracy chain;
  - `deno task docs:exports-drift` and `deno task docs:accuracy` each return raw exit 0;
  - Pages workflow tests and source-format gates remain green;
  - a controlled drift diagnostic makes the named task nonzero and therefore would fail both
    aggregate and workflow edges. No product file is left modified after the diagnostic.
- **N4:** the Pages step is `deno task docs:exports-drift` from repository root (no
  `working-directory`) because the checker resolves repo-relative paths from `Deno.cwd()`. It sits
  behind the same `if: env.RUN == 'true'` guard as the other build steps.
- **N5:** `docs:accuracy` invokes the named task through the existing `--allow-run=deno` permission.
  Its child handling continues to decode and print both stdout and stderr before throwing on
  nonzero, exactly preserving the current failure visibility at
  `check-accuracy-and-discoverability.ts:296-300`.
- Slice review: ensure the task executes once per path, N4/N5 hold, permissions are no broader than
  required, and workflow triggers were not widened.

### S3 — history-bound contract and publication evidence

- Files: slice run artifacts only; no implementation path edits.
- Proves at the exact committed head: `check`, `test`, `publish-dry-run`, `quality-job`,
  `arch-check`, `docs-source-format`, and `docs-accuracy` through durable receipts; focused direct
  drift and JSR evidence; its historical exact-path audit was bound to all **thirteen
  then-authorized** paths; no lock churn. SA-3 later supersedes that historical fourteenth-path
  refusal for only the four generated paths listed above.
- Handoff: coordinator performs Tier-A substantive review and grants/dispatches PLAN-EVAL and later
  IMPL-EVAL according to the recorded gates. The author neither self-certifies nor advances the PR
  to ready.

### S4 — regenerate the verified publication cascade (only after fresh Tier-A PASS)

- Files: the four SA-3 generated paths plus slice run artifacts. No checker, product source,
  workflow, task, export-map, dependency, or lock edit is permitted.
- Canonical order: `deno task gen:agent-docs-prose`, `deno task gen:publish-assets`, then
  `deno task gen:assets-barrel`. Each raw exit is captured unpiped.
- First-pass scope proof: direct Git diff must show exactly the four SA-3 paths and no other new
  implementation path. Any eighteenth path is a hard refusal and coordinator rescope.
- Idempotence proof: record a checksum of the complete first regeneration diff; run the same three
  generators again and require the same diff/checksum; commit the generated content; require a clean
  tree; run the three generators once more at that immutable content head and require no diff.
- Content-head proof: recut every applicable receipt named below at the one clean committed content
  head. Receipt artifacts are append-only and committed separately; preserved old/red receipts and
  the pre-finding IMPL-EVAL PASS are not rewritten.
- Stop after explicit-refspec push and structured comment for a second fresh Tier-A. A fresh delta
  IMPL-EVAL is required before readiness can be restored; the author does not run it, flip ready, or
  touch labels/issue boxes.

## Validation plan

Durable merge evidence must use `.llm/tools/gates/run-gate.ts` at committed heads. Structured
wrapper selections must be nonempty. Raw exit codes are captured unpiped; a command that never fires
is `NOT FIRED`.

| Order | Gate                 | Classification and evidence                                                                                                                                                                                                                                                                                      |
| ----- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Focused checker test | The existing negative export fixture must still pass. Through N3's injectable `checkDrift(mapping)` seam, committed tests assert nonzero for empty/malformed reason, unknown mode, invented symbol, and omitted symbol. Assertions only under the test path; no scratch under measured roots.                    |
| 2     | Direct export drift  | `deno task docs:exports-drift`; must enumerate/compare configured surfaces, print N2's per-package mode/reason/omission counts every run, and report the honest exit. A residual red is preserved under N1 rather than blocking the S1 commit.                                                                   |
| 3     | `check`              | Frozen contract gate via durable receipt; wrapper-backed type selection must be nonempty.                                                                                                                                                                                                                        |
| 4     | `test`               | Frozen full behavior gate via durable receipt, including docs/tool/workflow tests selected by the repository task.                                                                                                                                                                                               |
| 5     | `quality-job`        | Frozen CI-quality composite; records wrapper-backed lint/fmt/dependency evidence.                                                                                                                                                                                                                                |
| 6     | `arch-check`         | Required because published Contracts JSDoc is touched; no doctrine/debt regression.                                                                                                                                                                                                                              |
| 7     | `docs-source-format` | Run from the required docs-site context through the cataloged gate; proves source/Vento formatting. Also run its existing test if the coordinator's receipt set requires it, but do not substitute that extra test for the contracted gate.                                                                      |
| 8     | `docs-accuracy`      | Must fire the named task under `--allow-run=deno`, propagate its real exit, and surface child stdout/stderr on failure. Terminal PASS alone is accepted only with the source/task binding reviewed.                                                                                                              |
| 9     | `publish-dry-run`    | Canonical workspace simulation at the exact head; proves the shipped Contracts JSDoc and isolated declarations package statically. Review member/file output; do not infer real-publish success.                                                                                                                 |
| 10    | JSR audit            | Re-run package audit for Contracts and reference-subject audit for Fresh UI; preserve/report sanctioned or pre-existing reds exactly. Verify exact NetScript pins from member config.                                                                                                                            |
| 11    | Git/path/lock audit  | Direct raw Git commands prove only the **seventeen authorized** implementation paths plus run artifacts changed; `docs/exports`, `deno.lock`, package export maps, MySQL paths, and the excluded MCP export corpus remain untouched. An eighteenth implementation path refuses and requires coordinator rescope. |

**SA-3 recut set at the clean generated-content head.** The historical seven-receipt sets remain
append-only evidence for their old heads; they do not attest the changed content head. Recut:

| Class                 | Required evidence at the SA-3 content head                                                                                                                                                                                                                                                |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Binding receipts      | `check`, `test`, `quality-job`, `arch-check`, `docs-source-format`, `docs-source-format-test`, `docs-tagline`, `docs-accuracy`, `agent-docs-prose` (`check:agent-docs-prose`), `assets-barrel` (`check:assets-barrel`), `publish-assets` (`check:publish-assets`), and `publish-dry-run`. |
| Focused/static checks | Direct `docs:exports-drift`, checker tests, the Pages workflow tests already used by S2, exact seventeen-path diff audit, and byte-identical `deno.lock` proof.                                                                                                                           |
| Publication checks    | JSR audits for Contracts, Fresh UI, CLI, and MCP; exact `@netscript/*` pin audit from all four member configs; review CLI/MCP member file lists in the isolated-declaration workspace `publish:dry-run`. Static dry-run is not real-publish proof.                                        |
| Honest baseline red   | Re-run `check:mcp-export-corpus` read-only and record its raw exit as red if unchanged; do not generate or waive it. Preserve the existing Contracts/Fresh UI doc-lint reds exactly as red.                                                                                               |
| History binding       | Record the immutable generated-content commit in every new receipt index. Fresh delta IMPL-EVAL is coordinator-owned and required before readiness. Close-gate is `NOT_RUN` and must not be rerun in this pass.                                                                           |

No Aspire, Docker, browser, `e2e:cli`, scaffold runtime, service runtime, publish, release cut, or
resource cleanup is planned.

## `fresh-browser` classification and request

**AMENDED (SA-1) — RESOLVED: `fresh-browser` is classified N/A / WAIVED for this leaf.** The
coordinator accepted the author's argument below: the verified plan changes checker, docs, shipped
JSDoc, task, and workflow wiring only, and no route, component, island, CSS, or interaction
behavior. **`NOT_RUN` evidence is preserved and reported as `NOT_RUN`** — it is never restated as a
pass — and **no runtime lease is acquired**. Aspire, Docker, browsers, and `e2e:cli` remain
prohibited in this lane.

**Original author status: NOT FIRED — this lane is not authorized to execute it.**

If granted, `fresh-browser` would prove only that the edited reference page builds/renders with
usable headings, anchors, tables, code blocks, and responsive presentation in the real Fresh docs
site. It would not prove that a symbol exists, that an omission policy is complete, or that the
Contracts import resolves; the checker, snippet/static gates, and `deno doc` own those facts.

This plan judges `fresh-browser` **not genuinely required** for the frozen surface because no route,
component, CSS, island, interaction, loading/error state, or application workflow changes. The
frontend overlay is present because Fresh UI is the documented package, not because browser behavior
is modified. SA-1 resolved the classification as N/A/waived. The implementation lane will not
request a runtime lease or execute it; the evidence remains `NOT_RUN`.

## JSR audit plan

| JSR concern                        | Contracts                                                                                                                                                                                                                                       | Fresh UI reference subject                                                                                                                                                                          |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Publish delta                      | Shipped JSDoc text changes in `src/application/paginated-query.ts`, `src/application/transform-helpers.ts`, `schemas/filters.ts`, and `schemas/pagination.ts`; this is a publish delta even though runtime/types/exports/schemas do not change. | No Fresh UI member source changes, but its reference edit propagates into published CLI/MCP generated assets under SA-3; the earlier leaf-wide “prose-only/no publish delta” framing is superseded. |
| Export audit                       | `deno doc` on `.`, `./crud`, `./query`, `./transform`; assert all six affected symbols are absent from root and present only on their ruled `/query` or `/transform` entrypoint; preserve baseline-correct root/CRUD symbols.                   | `deno doc --json` on all six entrypoints; 168-symbol union is checker input, not a remembered count baked into docs tooling.                                                                        |
| Exact `@netscript/*` pins          | None; explicitly zero rows, not "not examined."                                                                                                                                                                                                 | Preserve `sdk/auto-update` and `sdk/desktop` exact at `@netscript/sdk@0.0.6`; no source/config change.                                                                                              |
| Documentation                      | Correct all four copyable implementation example imports. Baseline `doc:lint` has nine private-type-ref reds; report as baseline and do not claim zero.                                                                                         | Reference corrected. Baseline package `doc:lint` has 123 `/interactive` reds; source fix is out of scope and remains honest red.                                                                    |
| Slow types / isolated declarations | `audit-jsr-package` sanctioned oRPC slow-type INFO; final canonical `publish:dry-run` required under root `isolatedDeclarations:true`.                                                                                                          | Audit currently reports slow types plus structural warnings; no package change, no waiver invention.                                                                                                |
| Publish set / assets               | Confirm the two `src/**/*.ts` and two `schemas/**/*.ts` JSDoc files are included; no new asset/runtime import/read.                                                                                                                             | Fresh UI's own publish set is unchanged; downstream CLI/MCP asset deltas are audited separately below.                                                                                              |

**SA-3 publication correction.** The following table supersedes any earlier claim that the leaf has
no generated or consumer-visible publish delta:

| Member                 | Generated publish delta                                                                                                                                                                                                                             | Publish-set proof                                                                                                 | Exact `@netscript/*` pins / planned audit                                                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@netscript/cli@0.0.6` | `src/kernel/assets/agent-docs.generated.ts` changes: refreshed gzip/base64 corpus plus provenance. Consumers upgrading receive the repaired Fresh UI reference in offline agent docs.                                                               | `publish.include` contains `src/**/*.ts`; the generated file is imported by the public Deno agent-docs generator. | Audit every member pin: Aspire, Config, Fresh UI, MCP, Plugin, and SDK are exact `jsr:@netscript/*@0.0.6`; run package JSR audit and isolated-declaration dry-run. |
| `@netscript/mcp@0.0.6` | `src/publish-assets.generated.ts` changes its embedded-doc provenance `sourceCommit`. The selected fallback prose excludes Fresh UI and therefore its document bytes/hash stay fixed, but consumers still receive refreshed publication provenance. | `publish.include` contains `**/*.ts`; runtime infrastructure imports the generated file.                          | Aspire and both Telemetry subpaths are exact `jsr:@netscript/*@0.0.6`; run package JSR audit and isolated-declaration dry-run.                                     |

No package export map, version, runtime API/type/schema, or dependency pin changes. The two
`.llm/assets/agent-docs/*` files are tracked canonical inputs rather than direct JSR publish files;
their consumer-visible effect is the generated CLI/MCP source above.

If implementation changes a public export, type signature, member dependency, version, publish
filter, or any other publishable member, stop and rescope before continuing. A green dry-run is a
static prerequisite, never permission to publish.

## Anti-patterns and fitness gates

| AP/F           | Plan                                                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1/A2/A14, F-5 | Live export maps and `deno doc` lead; the doc/checker follows. Coverage policy prevents boolean false-green claims.                                                 |
| A7/AP-2/AP-9   | Reuse Deno, the existing mapping/tasks/gates/workflow, and the three canonical generators. Add no generator or second inventory.                                    |
| AP-18          | Negative checks assert semantic omitted/invented names and exit behavior, not giant full-page snapshots.                                                            |
| F-6            | Canonical workspace publish dry-run plus per-member JSR inspection; preserve sanctioned/pre-existing findings.                                                      |
| F-7            | Reference accuracy improves, but package-source doc-lint baselines remain red and are not mislabeled PASS.                                                          |
| F-19           | Contracted check/test/quality evidence comes from repository wrappers/receipts; empty selection refuses.                                                            |
| F-CLI-1..31    | No CLI command/API shape changes. The existing generated agent-docs asset is refreshed through its owner; no new barrel, adapter, or command surface is introduced. |

## Risk register

| Risk                                                                             | Mitigation                                                                                                                                                                               |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exclusion list becomes a hiding place                                            | Require complete mode, exact exported names, sorted reason-bearing groups, reject unknown names/empty reasons, and Tier-A review every Fresh omission.                                   |
| Markdown parser mistakes prose tables for exports                                | D5 exact header boundary plus negative field/prop table probe; never quiet false positives with exclusions.                                                                              |
| Duplicate symbol re-exports across root/subpaths inflate or conflict             | Preserve Set de-duplication while checking every entrypoint derived from `deno.json.exports`.                                                                                            |
| Page truth changes while hardcoded count stays green                             | Do not encode 168 as a permanent expected constant; derive it every run and report the measured count.                                                                                   |
| Gate-catalog indirection is mistaken for absent enforcement                      | PR/research record the complete non-draft CI chain; S2 improves discoverability without claiming enforcement as leaf-earned.                                                             |
| Pages CI duplicates or bypasses local gate                                       | Both edges call the same named task; `docs:accuracy` remains the enforced aggregate and Pages gets one root-cwd direct step under `env.RUN`.                                             |
| Workflow or generator verification requires an unauthorized edit                 | Run existing tests/generators unchanged. If they require source changes outside the **seventeen authorized** paths, stop for rescope. The checker test path remains assertions-only.     |
| Broad generator manifests create unrelated churn                                 | Accept only the four scratch-verified outputs. Compare first/second regeneration diffs and refuse an eighteenth path; do not run the unrelated baseline-red MCP export-corpus generator. |
| Existing package JSR/doc-lint debt is mistaken for regression or silently waived | Record baseline raw reds in research/JSR table and compare final results; do not weaken checker/audit settings or enter package source.                                                  |
| Large Fresh reference edit renders poorly                                        | Docs format/build/links are required; browser remains coordinator-classified and may be granted externally.                                                                              |
| Lock or package surface churn appears during validation                          | Direct diff audit; do not stage `deno.lock`; stop if exports, pins, versions, or unrelated publishable source changes.                                                                   |

## Explicit deferrals and non-scope

- `docs/exports` creation or any new hand-invented inventory artifact. The four existing canonical
  generated mirrors authorized by SA-3 are explicitly in scope.
- The already-correct Contracts root exports, `contract-primitives.ts` JSDoc, CRUD examples, and
  entrypoint self-documentation. The four incorrect implementation imports are explicitly in S1, not
  deferred.
- Contracts reference-page prose outside the frozen surface.
- Fresh UI package source, namespace/type exports, doc-lint/slow-type/structure remediation, visual
  design, component behavior, CSS, or registry contents. Only its already-edited reference page
  propagates into the four SA-3 mirrors.
- `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`: its
  base/head regenerated bytes are identical and its freshness red predates the leaf. Do not
  regenerate, stage, or waive it.
- MySQL/#1293/#1112 paths and acceptance.
- Symbol-complete prose expansion for unrelated entrypoint-only package mappings; their policy must
  become explicit in this leaf, but their pages do not enter scope.
- New/edited tests outside the frozen paths **except** the single path authorized by SA-1,
  `.llm/tools/docs/check-exports-drift_test.ts` (test assertions only); dependency/version/catalog/
  lock changes, doctrine/debt, central milestone state, issue checkbox mutation, merge, publish,
  ready flip, or release work.
- Aspire, Docker, browser execution, `e2e:cli`, scaffold/static/runtime smokes.

## Evaluation judgement

PLAN-EVAL cycle 1 returned **`FAIL_PLAN`** at evaluator commit `5d229e0f3`; the coordinator then
ruled B1 and N1-N5. PLAN-EVAL cycle 2 returned **`PASS`** at evaluator commit `45c249b9c`, after
which S1-S3 and the refusal-test repair were implemented and evaluated. Those records remain
append-only.

IMPL-EVAL later passed at `ee67d12b4`, but that PASS is pre-finding evidence only: CI then exposed
the missing generated publication cascade, readiness was revoked, and the PR returned to draft
`status:impl`. It is not amended or presented as attesting the future generated-content head.

**SA-3 gate:** the coordinator explicitly requires fresh Tier-A on this plan-only amendment before
any generation. No new PLAN-EVAL is author-launched or assumed. After the four generated files and
coherent receipts land, a fresh **delta IMPL-EVAL is required** before readiness can be restored;
that grant, dispatch, and verdict are coordinator-owned. Close-gate, issue boxes, labels, and draft
state remain untouched.
