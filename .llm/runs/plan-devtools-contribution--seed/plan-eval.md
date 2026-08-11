# PLAN-EVAL — plan-devtools-contribution--seed — cycle 2

> **OWNER WAIVER — 2026-08-11.** This file records the Codex evaluator's **cycle-2 `FAIL_PLAN`**.
> After the stage-D2 design passes ran, the owner cleared the Plan-Gate directly and waived a third
> evaluation cycle (`gates/plan-gate.md`: a Plan-Gate clears on `PASS` **or a written owner waiver**).
> See `drift.md` **D-18**.
>
> **This is not an evaluator `PASS`.** The evaluator returned `FAIL_PLAN` twice. Its remaining
> blockers were owner-gated (the unlaunchable design lane, forks F-1 and F-3), and the owner has
> cleared the gate over them. Every supervisor-fixable finding was closed before the waiver, and the
> stage-D2 amendments were applied after it.



PLAN-EVAL-VERDICT: FAIL_PLAN

- Plan evaluator session: separate Codex evaluator-of-record session, cycle 2, 2026-08-11
- Evaluated commit: `143c315741fc4bc9d0c5069d6cb3c69321c7762b`
- Baseline: `main` @ `2256a67bf`
- Run: `plan-devtools-contribution--seed`
- Surface / archetype: proposed A1 `packages/devtools-core` contracts + existing A6 CLI emission +
  A5 `plugins/devtools`; generated host app described as userland; conditional A3 trigger
- Scope overlays: `SCOPE-docs.md` + `SCOPE-frontend.md`

## Cycle-2 result

The Plan-Gate is not cleared. The mandatory GLM 5.2 design pass remains absent, the execution
surface is still unlaunchable, and no owner amendment or waiver exists. **That item alone blocks
`PASS`.** Honest escalation in `decision-brief.md` and risk R12 is correct evidence of the blocker;
it is not evidence that the required design lane ran or that its requirement was waived.

Independent verification also found supervisor-fixable residuals: the authoritative corpus still
contains incompatible package/archetype, identity, and ordering variants; the A1+A6+A5 gate union
omits required families; the 16 implementation rows do not each name an executable proving command
or exact file set; and the newly added filing artifacts are not reconciled with `worklog.md`, the
filing manifest, or drift D-11.

## Checklist results

| Plan-Gate item | Result | Evidence / location |
| --- | --- | --- |
| Research present and current | **PASS** | `research.md` remains tied to baseline `2256a67bf` and provides cited current-state findings. Independent source checks reconfirmed the top-level manifest schema is `.strict()` at `packages/plugin/src/protocol/manifest.ts:271-283` and the generator subprocess receives bare `--allow-read` / `--allow-write` at `packages/cli/src/public/features/generate/plugins/installed-runtime-registry-generator.ts:413-418`. The cycle-1 citation sampling therefore remains reproducible at the evaluated commit. |
| Decisions locked | **FAIL** | The corrected ownership table in RFC §13.1 (`:3463-3496`) is doctrinally coherent in isolation: A1 contracts, A6 emission, A5 thin plugin, generated userland host, and an A3 trigger. It is not the sole authority in the committed corpus. The same normative RFC still assigns host runtime/panels to A2 `packages/plugin-devtools-core` (`:629-632`), keeps O-2/O-3 open and `@netscript/contribution-core` (`:897-915`, `:1312-1320`), imports `plugin-devtools-core` (`:978`, `:1434`, `:3510`), derives gates from A2+A5 (`:3546`), wires the old root (`:3572`), and says F-8 is “A2 now” (`:3663`). `decision-brief.md:44-49`, `rfc-sections/05-host.md`, `06-family.md`, `13-integration.md`, and T1/T2 retain the old boundary too. The identity/order authority at RFC `:964-1001`, `:1164-1200`, and `:1401-1412` is contradicted by the surviving compound-id statements at `:1784`, `:2227`, `rfc-sections/08-data-plane.md:79`, `09-trust.md:112,131`, `11-ia.md:304`, T3/T5/T6/T8, and flat `(order,id)` variants in T3 and `rfc-sections/07-kinds.md`. |
| Open-decision sweep | **FAIL** | `plan.md:134-159` now correctly classifies F-1 and F-3 as `MUST RESOLVE — would force rework`; `filing/filing-manifest.md:22-25` confirms owner ratification, D-10, F-1, and F-3 are all `NOT MET`. No owner decision is recorded. The GLM requirement likewise needs either a working launcher and completed pass or an explicit owner amendment/waiver. These are implementation-shaping decisions, not board-only scheduling choices. |
| Commit slices (< 30, gate + files each) | **FAIL** | RFC §14 has exactly 16 rows (`:3622-3637`), below the limit, and every row has columns for roots, introduced contract, gate, and dependency. The claimed per-row proving-command standard is not met: W1-b/c/d, W2-a, W3-b, W4-a/b, W5-a, and W6-a/b describe tests/evidence without naming the command that runs them; W0-a/b are manual probes, which is acceptable only as an explicitly reproducible manual gate. Several roots are not exact (`throwaway branch`, `host renderer`, `packages/cli/...`, `respective plugins/*`). `worklog.md:37,43` is also stale at this commit, reporting the epic/issues/briefs/manifest absent after they were added. |
| Risk register | **FAIL** | R1 is correctly changed to non-reversible and unmitigated, and R12 accurately records the GLM blocker (`plan.md:168,178`). R13 is now factually stale: it says the filing deliverables do not exist (`:179`), although `filing/` contains the epic, 16 issue drafts, 7 briefs, and manifest. `decision-brief.md:44` also still calls F-1 reversible. A risk register whose current-state fields disagree with the committed deliverables and owner brief does not pass the current-plan gate. |
| Gate set selected | **FAIL** | RFC §13.3 claims the A1+A6+A5 union (`:3551-3567`) but omits required gates. The matrix requires A5 F-3, runtime/Aspire validation, and consumer validation (`.llm/harness/gates/archetype-gate-matrix.md:20-40,60-65`; A5 profile `:70-78`), while RFC `:3558` limits F-3 to A6 and names no A5 runtime gate. The matrix also says A6-specific F-CLI-1…F-CLI-31 extend the universal gates (`:42-46`); RFC substitutes the scaffold-runtime E2E surface at `:3562` without selecting/reporting those gates. The absence of a script permits `PENDING_SCRIPT` plus manual evidence, not omission (`matrix:78-91`). |
| Deferred scope explicit | **FAIL** | Implementation and board mutation are explicitly deferred, and read-only checks found no filing mutation. But the charter-mandated GLM 5.2 pass is a selected design deliverable, not ordinary deferred scope. `plan.md:40-43`, drift D-10, `decision-brief.md:12-34`, and risk R12 all prove it did not run and has not been waived. Under lane-policy invariant 5, this alone prevents `PASS`. |
| jsr-audit surface scan (pkg/plugin) | **FAIL** | RFC §13.2 (`:3521-3538`) now contains the full package checklist: metadata, exports/subpaths, publish filtering/file list, ESM shape, module/symbol docs and examples, README, slow types, `any`/casts, coupling, provenance, and runtime compatibility. The scan is not yet coherent for the selected published surface: its API sketch still targets `@netscript/plugin-devtools-core` (`:3510`) while its metadata targets `@netscript/devtools-core` (`:3528`), and it does not apply the rubric or an explicit N/A disposition to planned published A5 `plugins/devtools`. Package/plugin ownership must be singular before this gate can pass. |

## Verification of the cycle-1 fixes and new claims

| Claim | Result | Independent evidence |
| --- | --- | --- |
| 1. One identity law and one ordering law | **FAIL** | The canonical RFC sections now state `mountId` + slug `id` + `apiMajor` and anchors then `(order,mountId,id)`, but the cross-file searches above found surviving compound/version-suffixed identity and flat-sort variants in normative RFC text, `rfc-sections/`, and design packs. |
| 2. A1 + A6 + A5 boundary; A3 trigger; O-2 closed | **FAIL** | RFC §13.1 passes the doctrine trigger test, but RFC §§5–6, §13.3, §15, the owner brief, intermediate sections, and design packs still specify A2 / `plugin-devtools-core` / `contribution-core`; the corpus still labels O-2 open. |
| 3. Gate union redrawn | **FAIL** | A6 is mentioned, but F-CLI-1…F-CLI-31 are omitted; A5 F-3 and its runtime/consumer family are not completely selected. |
| 4. Sixteen slices with files, contract, and proving command | **FAIL** | The count is 16 and the columns exist. Not every row names exact files/roots or the command that executes the described proving test. |
| 5. Full JSR rubric | **PARTIAL** | The checklist content is materially complete for an A1 package. Its package name/API sketch conflict and the lack of an A5 plugin disposition leave the planned package/plugin scan incomplete. |
| 6. `worklog.md` reflects actual status | **FAIL** | `worklog.md:37` and `:43` still say the draft epic/issues/briefs/manifest are absent, although the evaluated commit added them. |
| 7. F-1 reversibility withdrawn; R1 corrected; R12/R13 added | **PARTIAL** | `plan.md:134-149,168,178-179` contains those changes. `decision-brief.md:44` still recommends F-1 as reversible, and R13 is stale after the filing commit. |
| 8. Seed deliverables added, draft-only, no mutation, valid-label blockers | **PARTIAL** | `filing/` contains one epic draft, 16 issue drafts, 7 wave briefs, and a manifest. All 16 issue drafts have `## Acceptance`; no closing keyword was found in the issue bodies. Read-only live searches found no matching newly filed W-slice issues; #400's update timestamp predates this cycle; PR #1450 remains draft; and the forbidden labels are absent from both `.github/labels.yml` and the live set. However `filing/epic.md:18-45,271-276` still proposes a second epic and invented `epic:devtools-contribution`, contrary to manifest §4.0's AMEND-#400 default. Several issue-draft label/type/priority fields also disagree with the manifest's ordered table. |
| 9. Drift D-11/D-12 recorded | **PARTIAL** | Both entries exist. D-12 honestly records label-file/live-label and milestone-guidance drift without mutating either. D-11 says #400 is AMEND rather than a second umbrella, but that resolution was not propagated to `filing/epic.md`. |

## Open-decision sweep (evaluator-run)

These still force rework if deferred:

1. **F-1 — package/spine ownership and imports (owner-gated).** `plan.md` correctly acknowledges
   that the choice changes public import specifiers, emitter ownership, dependency graph, and #922
   re-baselining. The owner has not selected an option.
2. **F-3 — manifest evolution compatibility (owner-gated).** `.passthrough()`/reserved catchall and
   schema v2 produce different old-CLI behavior and tests. The owner has not selected the contract.
3. **D-10 / GLM 5.2 design pass (owner-gated or launcher repair).** No authorized fallback exists.
   A repaired launcher plus the actual pass, or an explicit owner amendment/waiver, is required.

Board-only dispositions may wait for owner ratification because they do not determine implementation
contracts. They remain protected by the manifest's no-filing preconditions.

## Independent verification evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Immutable evaluation input | **PASS** | Initial and final pre-write `git rev-parse HEAD` were `143c315741fc4bc9d0c5069d6cb3c69321c7762b`; worktree was clean. |
| Cross-file contract search | **FAIL (plan claim)** | `rg` over the RFC, run Markdown, `rfc-sections/`, and design packs found the residual package/A2, compound-id, and flat-sort forms listed above. |
| RFC links | **PASS** | `deno task docs:links --root docs/architecture/rfc --pretty` exited 0: 1 document, 0 broken links, 0 broken anchors, 0 orphans. |
| Docs accuracy | **PASS** | `deno task docs:accuracy` exited 0. |
| Seed artifact census | **PASS (existence only)** | 16 issue drafts, 7 briefs, one epic body, and one filing manifest exist. Existence does not cure the consistency findings above. |
| GitHub no-mutation boundary | **PASS (no contrary evidence found)** | Read-only `gh` checks found no newly filed matching issue set, no forbidden label, no cycle update to #400, and PR #1450 still draft. No GitHub write command was run by this evaluator. |
| Lock hygiene | **PASS** | `deno.lock` SHA-256 remained `d4d00f600bd9cc9ae3c468e46bb2fa603e578da31a383ce13fdc110917fef35a`; no lock-rewriting command was run. |

## Verdict

`FAIL_PLAN`

This is the second formal failure. Per the Plan-Eval protocol, the unresolved owner-gated items are
escalated rather than routed around. No board filing may occur from this verdict.

### If FAIL_PLAN — required fixes still unmet

1. **Owner-gated — satisfy or waive the mandatory GLM pass.** Repair the declared GLM 5.2 design
   launcher and run/disposition the pass, or obtain an explicit owner amendment/waiver of the
   charter and lane-policy invariant. **This item alone blocks `PASS`.**
2. **Owner-gated — resolve F-1 and F-3.** Record the package/spine/import decision and manifest
   compatibility decision before implementation slices are treated as locked.
3. **Supervisor-fixable — make the committed corpus singular.** Propagate the A1+A6+A5 boundary,
   `packages/devtools-core` name, identity law, and two-tier ordering law through the normative RFC,
   owner brief, `rfc-sections/`, design packs, filing drafts, and JSR target; then re-run the
   cross-file variant searches.
4. **Supervisor-fixable — complete the derived gate union and slices.** Select A5 F-3/runtime/
   consumer gates and A6 F-CLI-1…F-CLI-31 with `PENDING_SCRIPT`/manual dispositions where needed.
   Give each of the 16 slices exact files/roots and one exact executable command or reproducible
   manual gate.
5. **Supervisor-fixable — reconcile current-state and filing artifacts.** Update `worklog.md`, R13,
   `decision-brief.md`, `filing/epic.md`, issue metadata, and the manifest so they agree that #400 is
   AMEND by default, use only verified labels, and accurately describe the deliverables now present.

## Notes

The independently green documentation gates prove link and source-alignment mechanics. They do not
override the Plan-Gate requirement that the architecture, gate union, slices, planned publish
surface, and mandatory design evidence be complete and mutually consistent.
