# Plan: reference-export-drift-gate

> **AMENDED — coordinator scope amendment SA-1, 2026-08-15T16:40:42Z.** The authoritative amendment
> record is `scope-amendment.md` in this slice directory. SA-1 authorizes exactly one additional
> **test-only** implementation path and classifies `fresh-browser` as **N/A / waived**. Where this
> plan and SA-1 conflict, **SA-1 governs**. The author's original text is preserved verbatim below
> and annotated inline as `**AMENDED (SA-1)**`; nothing is deleted, so the original reasoning stays
> readable in git history.

## Run metadata

| Field                     | Value                                                                          |
| ------------------------- | ------------------------------------------------------------------------------ |
| Run ID                    | `release-0.0.7-internals--orchestration/slices/reference-export-drift-gate`    |
| Leaf / lane               | `reference-export-drift-gate` / wave 2 internals                               |
| Branch / base             | `fix/reference-export-drift-gate` / `baf1cdf67a4e931af17b4772ddf6101f36152184` |
| Phase                     | research + plan only; implementation prohibited in this pass                   |
| Closing issue             | exactly `Closes #1296`                                                         |
| Archetype                 | frozen `6 — CLI / Tooling`                                                     |
| Overlays                  | `frontend`, `docs`                                                             |
| Package doctrine subjects | Contracts: Archetype 1 / Keep; Fresh UI: Archetype 4 / Keep                    |

## Goal

Make the claimed reference boundary falsifiable: correct the remaining shipped Contracts query
import, reconcile Fresh UI's reference with its six-entrypoint/168-symbol published surface, make
every symbol-coverage omission an explicit machine-readable policy decision, document the maintainer
update path, and expose/run the already-existing drift gate through named local and Pages
verification edges.

The leaf preserves the already-correct Contracts root exports/examples and does not manufacture a
`docs/exports` inventory.

## Exact narrowed edit surface (locked)

The nine frozen implementation paths are narrowed as follows. Run artifacts requested by the
coordinator (`research.md`, `plan.md`, and later harness evidence) are control-plane records, not a
tenth implementation path.

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

**AMENDED (SA-1).** A **tenth** implementation path is now authorized, **test-only**:

| Amended path                                  | Planned action                   | Per-path justification                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.llm/tools/docs/check-exports-drift_test.ts` | **Edit — test assertions only.** | S1 lands fail-closed coverage-policy semantics (D2-D5) whose refusal paths are load-bearing: empty/malformed reasons, unknown coverage modes, invented symbols, and omitted symbols must each exit nonzero. Proving that with one-off probes leaves no artifact that can fail a future CI run. Persistent test cases are the only durable proof. No product, config, or generated file may be edited under this path. |

The original prohibition stands for **everything else**: do not touch the Contracts reference page,
any Fresh UI package source/config, MySQL package/reference paths, `deno.lock`, doctrine/debt,
central cluster state, or another lane's worktree. An **eleventh** path is rescope — stop and
request it from the coordinator.

~~No tenth implementation path is authorized. In particular, do not touch
`.llm/tools/docs/check-exports-drift_test.ts`~~ (superseded by SA-1) ~~, the Contracts reference
page, any Fresh UI package source/config, MySQL package/reference paths, `deno.lock`,
doctrine/debt, central cluster state, or another lane's worktree. If implementation needs one, stop
and request rescope from the coordinator.~~

## Locked decisions

| ID  | Decision                                                                                                                                                                                                                           | Rationale                                                                                                                                                                                                            |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Keep package `deno.json.exports` and per-entrypoint `deno doc --json` as the sole export/symbol authority; never materialize `docs/exports`.                                                                                       | Avoids a second generated/handwritten inventory and preserves A1/A14 dependency direction.                                                                                                                           |
| D2  | Replace `checkSymbols` + free-standing `excludedSymbols` with a discriminated `symbolCoverage` policy.                                                                                                                             | A boolean `false` silently disables proof. A discriminant makes completeness versus deliberate entrypoint-only coverage machine-readable and exhaustively consumable.                                                |
| D3  | `symbolCoverage` has two modes: `complete` with reason-bearing omission groups, and `entrypoints-only` with one required nonempty reason.                                                                                          | A skipped symbol gate is a policy fact, not absence of configuration. Empty/malformed reasons are refusal, never pass.                                                                                               |
| D4  | Complete-mode mappings may name reason-bearing `documentedNonExports` groups for copy-source/API-adjacent symbols that the page explicitly labels as non-package exports.                                                          | Fresh UI's Dropzone section is useful and honest. The checker must distinguish explicit copy-source docs from invented package exports without globally weakening invented-symbol detection.                         |
| D5  | Parse symbol inventories only from Markdown tables whose first header cell is exactly `Symbol`; ignore prop/field/shape tables, strip display generic suffixes such as `<T>`, and retain grouped symbol-cell support.              | Eliminates the measured false positives (`columns`, `label`, `layout`, generic display names) before enabling enforcement. Exclusions must never compensate for parser defects.                                      |
| D6  | Fresh UI uses `complete` mode. Document user-facing components/functions/constants/namespaces and their public contract families; every intentionally omitted low-level member type is enumerated in sorted reason-bearing groups. | Repairs the reproduced Fresh UI surface and makes remaining curation auditable. A newly exported symbol must be documented or explicitly classified before the gate returns green.                                   |
| D7  | Existing currently entrypoint-only mappings remain entrypoint-only only with explicit reasons; Config, Contracts, Fresh UI, and Telemetry remain/enter complete mode.                                                              | Satisfies machine-readable omission policy without pretending this leaf authored complete prose for unrelated packages. Promotion of other packages can occur independently.                                         |
| D8  | Correct only `paginated-query.ts` to `/query`; preserve `contract-primitives.ts` and `src/public/mod.ts`.                                                                                                                          | Independent `deno doc` proves the briefed root symbols are already valid, while `paginatedQuery` is absent from root and present on `/query`.                                                                        |
| D9  | Add `docs:exports-drift`; make `docs:accuracy` call it; add the same named task as a Pages build step.                                                                                                                             | Gives maintainers a fast direct command, retains the existing aggregate local/maintenance gate, and makes workflow execution explicit on already-correct triggers. No duplicate execution occurs within either path. |
| D10 | The Fresh UI runbook documents derivation, not file generation: inspect every `deno.json.exports` entry with `deno doc --json`, update the page and coverage policy, run the direct drift task, then the aggregate accuracy task.  | There is no generator today. Calling a manual derived update "regeneration" is honest only when the source of truth and verification steps are explicit.                                                             |
| D11 | Do not tune the checker to baseline green. First land semantics that refuse malformed coverage, then reconcile the page/policy until the unchanged live export authority passes.                                                   | Coverage and compliance remain distinct. A real red after wiring is reported red.                                                                                                                                    |

## Open-decision sweep

| Decision                                                       | Status                        | Resolution                                                                                          |
| -------------------------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------- |
| Whether `docs/exports` should be created                       | resolved now                  | No; stale frozen entry, explicitly non-touched.                                                     |
| Machine-readable omission format                               | resolved now                  | D2-D4 discriminated, reason-bearing mapping policy.                                                 |
| Symbol-table parser boundary                                   | resolved now                  | D5 exact `Symbol` header plus display-name normalization.                                           |
| Direct task versus aggregate versus workflow wiring            | resolved now                  | D9 combination: named task, existing accuracy/maintenance aggregate, Pages step.                    |
| Whether the briefed Contracts root exports need edits          | resolved now                  | No; baseline-earned and explicitly reported.                                                        |
| Whether package-source doc-lint debt should be fixed           | safe to defer                 | Outside frozen paths; record baseline reds without weakening gates.                                 |
| Whether every mapped package should become symbol-complete now | safe to defer                 | This leaf makes non-complete status explicit/reasoned; unrelated prose expansion is separate scope. |
| Whether Fresh browser proof must run                           | **resolved by SA-1**          | **N/A / waived.** No route/component/island/interaction behavior changes. `NOT_RUN` preserved; no runtime lease. |

No unresolved decision besides the coordinator-owned browser classification would force source
rework. Browser classification affects evidence only, not implementation design.

## Ordered implementation slices

### S1 — make reference coverage explicit and reconcile the live surfaces

- Files: `.llm/tools/docs/check-exports-drift.ts`, `docs/site/reference/fresh-ui/index.md`,
  `packages/contracts/src/application/paginated-query.ts`, and slice run artifacts.
- Introduces:
  - the discriminated reason-bearing coverage policy and fail-closed validation;
  - table-aware symbol parsing and generic normalization;
  - Fresh UI complete-mode enforcement, documented non-export classification, and exact omission
    groups;
  - repaired Fresh UI reference sections and the maintainer derivation/update runbook;
  - the `/query` import in shipped Contracts JSDoc.
- Proves: direct drift command raw exit 0 only after all six Fresh UI entrypoints and the curated
  symbol boundary reconcile; the existing negative-fixture test still proves an added entrypoint is
  red. ~~One-off negative policy probes must report nonzero for empty reasons/unknown modes; they are
  recorded as diagnostic evidence because the frozen surface forbids editing the test file.~~
  **AMENDED (SA-1):** those negative policy cases become **persistent test cases** in
  `.llm/tools/docs/check-exports-drift_test.ts` — empty/malformed reason, unknown coverage mode,
  invented symbol, and omitted symbol must each be asserted nonzero by the committed test, so the
  refusal paths can fail a future CI run rather than only this author's terminal.
- Slice review: confirm exclusions classify real exported symbols only, each reason is substantive,
  Dropzone remains visibly non-exported, and no Contracts runtime/export changes entered the diff.

### S2 — expose and execute the gate through the documentation path

- Files: `deno.json`, `.llm/tools/docs/check-accuracy-and-discoverability.ts`,
  `.github/workflows/pages.yml`, and slice run artifacts.
- Introduces: named least-permission `docs:exports-drift` task, aggregate invocation from
  `docs:accuracy`, and a named Pages verification step.
- Proves:
  - direct search now finds explicit task/workflow wiring;
  - `deno task docs:exports-drift` and `deno task docs:accuracy` each return raw exit 0;
  - Pages workflow tests and source-format gates remain green;
  - a controlled drift diagnostic makes the named task nonzero and therefore would fail both
    aggregate and workflow edges. No product file is left modified after the diagnostic.
- Slice review: ensure the task executes once per path, child stdout/stderr remain visible on
  failure, permissions are no broader than required, and workflow triggers were not widened.

### S3 — history-bound contract and publication evidence

- Files: slice run artifacts only; no implementation path edits.
- Proves at the exact committed head: `check`, `test`, `publish-dry-run`, `quality-job`,
  `arch-check`, `docs-source-format`, and `docs-accuracy` through durable receipts; focused direct
  drift and JSR evidence; exact nine-path diff audit; no lock churn.
- Handoff: coordinator performs Tier-A substantive review and grants/dispatches PLAN-EVAL and later
  IMPL-EVAL according to the recorded gates. The author neither self-certifies nor advances the PR
  to ready.

## Validation plan

Durable merge evidence must use `.llm/tools/gates/run-gate.ts` at committed heads. Structured
wrapper selections must be nonempty. Raw exit codes are captured unpiped; a command that never fires
is `NOT FIRED`.

| Order | Gate                 | Classification and evidence                                                                                                                                                                                                                    |
| ----- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Focused checker test | **AMENDED (SA-1):** the existing negative export fixture must still pass, and the invalid-coverage-policy and invented/omitted-symbol cases are added as **committed test cases** in `.llm/tools/docs/check-exports-drift_test.ts` rather than one-off probes. Assertions only — no product/config/generated edit under this path; no scratch under measured roots. |
| 2     | Direct export drift  | `deno task docs:exports-drift`; must enumerate/compare the configured surfaces and exit 0 only after reconciliation.                                                                                                                           |
| 3     | `check`              | Frozen contract gate via durable receipt; wrapper-backed type selection must be nonempty.                                                                                                                                                      |
| 4     | `test`               | Frozen full behavior gate via durable receipt, including docs/tool/workflow tests selected by the repository task.                                                                                                                             |
| 5     | `quality-job`        | Frozen CI-quality composite; records wrapper-backed lint/fmt/dependency evidence.                                                                                                                                                              |
| 6     | `arch-check`         | Required because published Contracts JSDoc is touched; no doctrine/debt regression.                                                                                                                                                            |
| 7     | `docs-source-format` | Run from the required docs-site context through the cataloged gate; proves source/Vento formatting. Also run its existing test if the coordinator's receipt set requires it, but do not substitute that extra test for the contracted gate.    |
| 8     | `docs-accuracy`      | Must fire the named drift child and propagate its real exit; terminal PASS alone is accepted only with the source/task binding reviewed.                                                                                                       |
| 9     | `publish-dry-run`    | Canonical workspace simulation at the exact head; proves the shipped Contracts JSDoc and isolated declarations package statically. Review member/file output; do not infer real-publish success.                                               |
| 10    | JSR audit            | Re-run package audit for Contracts and reference-subject audit for Fresh UI; preserve/report sanctioned or pre-existing reds exactly. Verify exact NetScript pins from member config.                                                          |
| 11    | Git/path/lock audit  | Direct raw Git commands prove only frozen implementation paths plus run artifacts changed; `docs/exports`, `deno.lock`, package export maps, and MySQL paths remain untouched.                                                                 |

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
is modified. The author asks the coordinator to record an explicit waiver/N/A. If Tier-A instead
requires rendered-reference assurance, the coordinator must grant and execute the gate in an
authorized lane; that changes evidence, not scope or implementation.

## JSR audit plan

| JSR concern                        | Contracts                                                                                                                                         | Fresh UI reference subject                                                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Publish delta                      | Shipped `paginated-query.ts` JSDoc changes; call this a publish delta even though runtime/types/exports do not.                                   | No member file changes, but inspect all six exports before authoring the reference.                                              |
| Export audit                       | `deno doc` on `.`, `./crud`, `./query`, `./transform`; assert `paginatedQuery` only from `/query` and preserve root symbols verified in research. | `deno doc --json` on all six entrypoints; 168-symbol union is checker input, not a remembered count baked into docs tooling.     |
| Exact `@netscript/*` pins          | None; explicitly zero rows, not "not examined."                                                                                                   | Preserve `sdk/auto-update` and `sdk/desktop` exact at `@netscript/sdk@0.0.6`; no source/config change.                           |
| Documentation                      | Correct copyable module import. Baseline `doc:lint` has nine private-type-ref reds; report as baseline and do not claim zero.                     | Reference corrected. Baseline package `doc:lint` has 123 `/interactive` reds; source fix is out of scope and remains honest red. |
| Slow types / isolated declarations | `audit-jsr-package` sanctioned oRPC slow-type INFO; final canonical `publish:dry-run` required under root `isolatedDeclarations:true`.            | Audit currently reports slow types plus structural warnings; no package change, no waiver invention.                             |
| Publish set / assets               | Confirm edited JSDoc source is included by `src/**/*.ts`; no new asset/import/read.                                                               | No package file or runtime asset delta.                                                                                          |

If implementation changes a public export, type signature, member dependency, version, publish
filter, or any other publishable member, stop and rescope before continuing. A green dry-run is a
static prerequisite, never permission to publish.

## Anti-patterns and fitness gates

| AP/F           | Plan                                                                                                                                                                                                 |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1/A2/A14, F-5 | Live export maps and `deno doc` lead; the doc/checker follows. Coverage policy prevents boolean false-green claims.                                                                                  |
| A7/AP-2/AP-9   | Reuse Deno, existing mapping, existing task/gate/workflow. No generator or second inventory.                                                                                                         |
| AP-18          | Negative checks assert semantic omitted/invented names and exit behavior, not giant full-page snapshots.                                                                                             |
| F-6            | Canonical workspace publish dry-run plus per-member JSR inspection; preserve sanctioned/pre-existing findings.                                                                                       |
| F-7            | Reference accuracy improves, but package-source doc-lint baselines remain red and are not mislabeled PASS.                                                                                           |
| F-19           | Contracted check/test/quality evidence comes from repository wrappers/receipts; empty selection refuses.                                                                                             |
| F-CLI-1..31    | No product CLI package shape changes. Manual review applies the relevant tooling concerns: one focused checker, edge-owned subprocess, explicit failure exit, no new barrel/adapter/command surface. |

## Risk register

| Risk                                                                             | Mitigation                                                                                                                                             |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Exclusion list becomes a hiding place                                            | Require complete mode, exact exported names, sorted reason-bearing groups, reject unknown names/empty reasons, and Tier-A review every Fresh omission. |
| Markdown parser mistakes prose tables for exports                                | D5 exact header boundary plus negative field/prop table probe; never quiet false positives with exclusions.                                            |
| Duplicate symbol re-exports across root/subpaths inflate or conflict             | Preserve Set de-duplication while checking every entrypoint derived from `deno.json.exports`.                                                          |
| Page truth changes while hardcoded count stays green                             | Do not encode 168 as a permanent expected constant; derive it every run and report the measured count.                                                 |
| Hidden wiring is mistaken for absent wiring                                      | PR/research state baseline indirect edge explicitly; S2 improves discoverability/workflow coverage without claiming prior work as leaf-earned.         |
| Pages CI duplicates or bypasses local gate                                       | Both edges call the same named task; `docs:accuracy` remains the local aggregate and Pages gets one direct step.                                       |
| Workflow edit requires an unauthorized test edit                                 | Run existing workflow tests unchanged. If they fail and require source changes outside the nine paths, stop for rescope rather than editing tests.     |
| Existing package JSR/doc-lint debt is mistaken for regression or silently waived | Record baseline raw reds in research/JSR table and compare final results; do not weaken checker/audit settings or enter package source.                |
| Large Fresh reference edit renders poorly                                        | Docs format/build/links are required; browser remains coordinator-classified and may be granted externally.                                            |
| Lock or package surface churn appears during validation                          | Direct diff audit; do not stage `deno.lock`; stop if exports, pins, versions, or unrelated publishable source changes.                                 |

## Explicit deferrals and non-scope

- `docs/exports` creation or any generated inventory artifact.
- The already-correct Contracts root exports and `contract-primitives.ts` JSDoc.
- Contracts reference-page prose outside the frozen surface.
- Fresh UI package source, namespace/type exports, doc-lint/slow-type/structure remediation, visual
  design, component behavior, CSS, or registry contents.
- MySQL/#1293/#1112 paths and acceptance.
- Symbol-complete prose expansion for unrelated entrypoint-only package mappings; their policy must
  become explicit in this leaf, but their pages do not enter scope.
- New/edited tests outside the frozen paths **except** the single path authorized by SA-1,
  `.llm/tools/docs/check-exports-drift_test.ts` (test assertions only); dependency/version/catalog/
  lock changes, doctrine/debt, central milestone state, issue checkbox mutation, merge, publish,
  ready flip, or release work.
- Aspire, Docker, browser execution, `e2e:cli`, scaffold/static/runtime smokes.

## PLAN-EVAL judgement

**AMENDED (SA-1) — GRANTED.** The coordinator accepted the author's judgement and granted **exactly
one** fresh PLAN-EVAL cycle 1, run in a **separate session** over the **amended immutable head**
after this amendment passes a fresh Tier-A. Route: native **Fable 5 / medium / Remote Control**,
**artifact-only** — the evaluator writes `plan-eval.md` and nothing else. On `PASS` the preserved
original Codex author resumes through the serial slices, each followed by a fresh Tier-A gate. A
`FAIL_PLAN` is reported as `FAIL_PLAN`.

**Original author judgement: Fresh PLAN-EVAL: REQUIRED, but not granted or performed by this
author.**

The implementation volume is bounded, but the plan is decision-heavy: it changes what a green
cross-package documentation gate means, introduces a reason-bearing omission contract, must separate
parser errors from real omissions, and reconciles a materially false carried-in wiring claim.
Deferring any of those decisions would force checker/doc rework. Harness policy therefore requires a
fresh separate-session opposite-family PLAN-EVAL before implementation.

The coordinator owns the grant/dispatch and must run Tier-A on this exact pushed planning head. This
author does not assume a verdict, does not create `plan-eval.md`, and must not begin implementation
until the coordinator records `PASS`. A failure is reported as `FAIL_PLAN`, not worked around.
