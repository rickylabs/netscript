# Advisory PLAN-EVAL evidence — quality-scan-allowance-rail

> **Current status: advisory only; formal Plan-Gate unsatisfied.** This Claude-compatible OpenRouter
> run occurred after the owner hold and was stopped. Coordinator comment `5286261678` and central
> commit `874eacc0d` retain its findings as planning evidence, resolve D-1 through D-4, and require
> a fresh formal opposite-family PLAN-EVAL after the Saturday 2026-08-15 00:00 Europe/Zurich reset.
> This historical `FAIL_PLAN` neither authorizes implementation nor counts as the fresh formal
> verdict for the repaired head.

- Advisory evaluator session: `977b0618-1b0c-4957-8369-698d3c5274c6` (Claude Code, requested Minimax
  M3 / high over OpenRouter — see "Route escalation" below)
- Date: 2026-08-13
- Run: `quality-scan-allowance-rail` (Wave 0 internals, milestone 0.0.7)
- Surface / archetype: `6-cli-tooling`, overlays `frontend`, `service`, `docs`
- Plan head evaluated: `c573beda9e6f1508e9263062c425641da7f35d44`
- Live `origin/main` and immutable leaf base: `01e0960494c95ce56eb35892c211a095eb13e6ed`
- Draft PR: #1653 (`status:plan-eval`, draft against `main`)
- Issues: #1378 + #1545, inseparable
- Generator route recorded in `supervisor.md`: Codex GPT-5.6 Sol · high
- Scope overlays: none beyond the leaf's own contract

## Checklist results

| Plan-Gate item                          | Result | Evidence / location                                                                                                                                                                                                                                                                                                                               |
| --------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS   | `research.md` re-baselines at `01e0960494c95ce56eb35892c211a095eb13e6ed`, names three prior-cycle corrections (stale population, prior landed #1549 work, 6 soundness tests), and re-measures the live population (7) and allowance list. `receipts/baseline/{quality-scan,quality-scan-repo,quality-tests}.json` bind to the exact base SHA.     |
| Decisions locked                        | PASS   | `plan.md` §"Locked design" pins public reachability (export-graph + token-aware pass, no `deno doc` oracle), allowance record, injectable `AllowanceIssueResolver` fail-closed, budgets converging to 7, preserved #1549 behaviour, kept CLI/Fresh topology, workers bridge registered as debt.                                                   |
| Open-decision sweep                     | FAIL   | `drift.md` D-2, D-3, D-4 are explicitly marked "Must resolve before implementation / PLAN-EVAL PASS" — i.e. three must-resolve-now items the plan itself acknowledges it cannot pass without. `plan.md` §"Open-decision sweep" lists the same. Plan-Gate rule: open decisions that would force rework if deferred → `FAIL_PLAN`.                  |
| Commit slices (< 30, gate + files each) | PASS   | 4 slices in `plan.md` §"Ordered Design slices", each ≤ 4 named files, each names a proof gate set, ordered Registration → Export-Any → Consumer/JSR → Final, registration precedes enforcement as required by milestone rationale.                                                                                                                |
| Risk register                           | PASS   | `drift.md` table D-1 through D-5; severity, exact evidence, required disposition, and state per item.                                                                                                                                                                                                                                             |
| Gate set selected                       | PASS   | `plan.md` §"Gate map" enumerates focused structured test, scoped check, scoped lint/fmt, durable `check`/`test`/`quality-scan`/`quality-scan-repo`/`allowance-budget`/`quality-job`/`arch-check`/`fresh-browser`/`docs-source-format`/`docs-accuracy`, generated-asset freshness, full-export `doc:lint`, scoped publish dry-run, git/lock truth. |
| Deferred scope explicit                 | PASS   | `plan.md` §"Deferred and excluded work" names #1278 Inventory B, #1276 T1–T5, #1245, #1249, #1379, #1380; also excludes root-cause cast removal. `worklog.md` repeats the same list.                                                                                                                                                              |
| jsr-audit surface scan (pkg/plugin)     | PASS   | `plan.md` §"JSR audit plan" names per-member risks (CLI 3 exports, Workers 13 exports, Fresh/docs), exact JSDoc + dependency-pin + publish-file checks, no-publish rule, and isolated-declaration handling. JSR audit applicable per leaf contract.                                                                                               |

## Open-decision sweep (evaluator-run)

`plan.md` §"Open-decision sweep" and `drift.md` flag four items. The evaluator finds three of them
are must-resolve-now under Plan-Gate semantics; the fourth is implementation-only and acceptable as
a safe deferral. Detail:

1. **D-2 — durable allowance ownership (#1545 closes; allowances still need a verified open,
   milestoned owner).** The PR body carries `Closes #1378` and `Closes #1545`. After merge, #1545 is
   closed, so every allowance that references it would point at a closed issue. The rail's own rule
   (open + milestoned, fail-closed) is violated by the very first day of the rail's existence. There
   is no in-leaf fix: the plan itself defers to "topic/coordinator names or authorizes a separate
   durable open, milestoned debt issue, or explicitly amends the acceptance semantics" (`drift.md`
   D-2). Implementing without that decision either re-opens #1545, breaks #1378's rule, or coerces
   the PR body. **Rework-forcing → must resolve now.**

2. **D-3 — contract surface for RED-first proof and shipped assets.** Plan lists
   `.llm/tools/quality/scan-code-quality_test.ts` (RED-first tests),
   `packages/cli/src/kernel/assets/agent-tools.generated.ts` (embedded consumer copy of the
   scanner), and `.llm/tools/consumer-tools.json` (permission manifest) as required for an honest
   deliverable. None is in the approved leaf contract surfaces in `leaf-contracts.json`. Without an
   amendment or an approved alternative that still proves RED-first behaviour and ships a fresh
   consumer asset, the PR cannot truthfully close acceptance boxes "RED-first cases prove exported
   vs local `any`, linked vs unlinked allowances, docs fences, soundness preservation, and overflow"
   (#1378 box 8 / DoD §) and "Generated CLI assets are regenerated through the checked-in task and a
   second run is clean" (DoD §). The plan correctly does not pretend to widen the leaf itself
   (`plan.md` §"Architecture" + `worklog.md` "Contributors must not silently widen the leaf").
   **Rework-forcing → must resolve now.**

3. **D-4 — workers full-export `doc:lint` baseline (20 pre-existing `private-type-ref` diagnostics
   across 13 export targets).** Plan acknowledges these are unrelated to this leaf, but a JSR claim
   for the workers package at final head requires either (a) a no-increase debt baseline with a
   separately owned debt entry or (b) prerequisite repair. Neither is currently present in
   `arch-debt.md` (the plan's research section names this absence explicitly). The JSR audit is
   applicable per leaf contract, and `jsr-audit` records an obligation per `plan-gate.md`; absent
   resolution, the final JSR claim would be false or silently scope-widen to absorb unrelated
   workers export repairs. **Rework-forcing → must resolve now.**

4. **D-1 — population 7 vs stale 8.** The plan's locked outcome uses the measured 7 and proposes
   implementing at 7, but `#1545`'s live Acceptance section still names 8 and asks for
   `--max-allow 8` on both tasks. The plan cannot move live-issue prose. This is a small editorial
   contradiction that does not block implementation once the durable owner is named (D-2) — the
   issue text gets reconciled to the measured population as part of the same PR. **Safe to defer to
   implementation, but the live #1545 prose must be reconciled before the PR carries
   `Closes #1545`.**

## Historical advisory verdict

`FAIL_PLAN`

The locked design, research re-baseline, slice ordering, gate map, JSR audit surface, and deferred
scope are sound and aligned with the binding leaf contract. The plan itself, however, identifies
three open decisions it cannot silently authorize — durable allowance ownership (D-2),
contract-surface amendment for the required RED-first test and generated-asset peers (D-3), and the
workers JSR no-increase baseline decision (D-4). Under `gates/plan-gate.md` and
`verdict-definitions.md`, any open decision that would force rework when deferred → `FAIL_PLAN`. A
clean baseline receipt is evidence, not permission to weaken the contract.

### Required fixes (return to Plan & Design; no implementation slice may be committed)

1. **D-2 — durable open, milestoned allowance owner.** Topic or milestone coordinator must either
   (a) authorize a separate, open, milestoned debt issue (or list of issues) to own the seven
   `// quality-allow:` records, or (b) explicitly amend the live `#1545` Acceptance semantics so the
   requirement that every allowance reference an open, milestoned issue is satisfied without
   renaming the closing owner. The plan must then name the chosen path and bind the seven records to
   it in the same draft head.

2. **D-3 — leaf contract surface amendment.** Topic or milestone coordinator must amend
   `leaf-contracts.json` `quality-scan-allowance-rail.fileSurfaces` to include
   `.llm/tools/quality/scan-code-quality_test.ts`,
   `packages/cli/src/kernel/assets/agent-tools.generated.ts`, and `.llm/tools/consumer-tools.json`,
   or supply a truthful approved alternative that still (i) proves RED-first behaviour for exported
   vs local `any`, linked vs unlinked allowances, docs fences, soundness preservation, and overflow,
   and (ii) ships a fresh, deterministic consumer copy of the scanner with a clean second-generation
   run.

3. **D-4 — workers JSR baseline decision.** Topic or milestone coordinator must either (a) accept an
   explicit no-increase baseline with a separately owned debt entry (`arch-debt.md` or equivalent
   registry) naming the 20 pre-existing workers `private-type-ref` diagnostics and an owner for the
   prerequisite repair, or (b) schedule and prove the prerequisite repair in a separate leaf that
   lands before this PR is readied. The plan must not claim a green workers full-export JSR audit
   without one of these.

4. **Editorial — `#1545` acceptance count.** Before the PR body carries `Closes #1545`, the live
   `#1545` Acceptance prose ("8", `--max-allow 8`) must be reconciled to the measured 7 in the same
   change so the close keyword matches an honest acceptance claim. This can ride the same edit as
   the durable owner decision in (1).

The findings above were resolved by coordinator authority after this advisory run. No evaluator may
be relaunched before the reset. After the reset, a fresh separate evaluator must judge the repaired
head and replace/update this artifact with the current formal verdict.

## Coordinator resolution after this advisory run

1. D-1/D-2: live #1545 now states seven; all seven source records bind to open, milestoned #1276 T3
   with their specific reasons.
2. D-3: the exact scanner test, consumer manifest, generated CLI asset, and debt registry surfaces
   are authorized in central `leaf-contracts.json`; no others are added.
3. D-4: #1655 in milestone 0.0.8 owns removal of the 20 Workers diagnostics. This leaf records only
   a strict no-increase `DEBT_ACCEPTED` baseline and never claims full-export lint green.

## Historical notes

- The four drift items the supervisor surfaced for adversarial judgment are answered above. Three
  are blockers for `PASS`; the fourth (D-1) is not.
- The leaf contract surfaces in `leaf-contracts.json` are otherwise consistent with the plan. No
  silent widening has been attempted in `plan.md`.
- Plan's evidence trail (baselined receipts, six-soundness preservation,
  `TriggerEventSubscriptionMessage[]` already typed, `#1549` behaviour preserved rather than
  reimplemented) is solid and does not need rework.
- No product, package, plugin, generated, or workflow source has been inspected, edited, or staged
  in this evaluator session. The only changes anticipated are the canonical `plan-eval.md`, minimal
  evaluator identity edits in `context-pack.md` and `worklog.md`, and the existing
  `codex-thread-ids.md` whitespace cleanup that was already staged by the orchestrator.
