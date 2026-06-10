# PLAN-EVAL — feat-package-quality-wave4-runtimes--4b-workers

- Plan evaluator session: PLAN-EVAL / 2026-06-09
- Run: `feat-package-quality-wave4-runtimes--4b-workers`
- Surface / archetype: `@netscript/plugin-workers-core` (A3) + `@netscript/plugin-workers` (A5)
- Scope overlays: none applicable (no frontend/service/docs scope)

## Checklist results

| Plan-Gate item                          | Result              | Evidence / location |
| --------------------------------------- | ------------------- | ------------------- |
| Research present and current            | **PASS**            | `research.md` exists. Carried-in 4b plan re-baselined against umbrella `2c24662` (4a merged). Base-sync merge `173357c`, merge-base `2c24662`. Spot-checks confirmed: contracts duplicate alias (`./contracts` and `./contracts/v1` both → `src/contracts/v1/mod.ts`), over-cap file sizes (500 / 468 LOC), version mismatch (`0.1.0` in `src/public/mod.ts` vs `0.0.1-alpha.0` in `deno.json`), `check` task enumerates only 4 files in plugin, dry-run PASS both units. |
| Decisions locked                        | **PASS**            | All load-bearing decisions in `plan.md` §1, §2, §5, §6, §7 with rationale: A3 core (long-running stateful behavior), A5 plugin (first-party plugin pattern), core/plugin split (sizing/headroom), `./contracts` fold (consumer-only `plugins/workers/contracts.ts`), ptr-fix strategy by type origin (Wave 3 LD-8 + 4a precedent), F-1 split filenames, test-layer mock-vs-real Aspire. |
| Open-decision sweep                     | **PASS**            | Plan §13 lists all open decisions. "Must resolve now" decisions (A3, split, fold, ptr strategy, F-1 filenames, test mock strategy) are **Locked**. Deferred decisions (zero-consumer trim, manifest type cast, Prisma artifacts) are marked "safe to defer" with explicit target gates/post-alpha. No deferred decision would force rework on the 27 committed slices. |
| Commit slices (< 30, gate + files each) | **PASS**            | 27 slices total (14 core + 13 plugin), under <30 cap per sub-wave. Every slice in `worklog.md` §Design "Commit slices" names the work item, the gate(s) it proves, and the files/concerns it touches. |
| Risk register                           | **PASS**            | Plan §8 lists 5 risks with likelihood, impact, and concrete mitigations. Highest-likelihood risk (Zod ptr leaks resist structural fix) has `@ignore` fallback and explicit debt recording path. |
| Gate set selected                       | **PASS**            | Plan §11 lists gates for both units, aligned with `gates/archetype-gate-matrix.md`: A3 core gets F-13 required + Runtime/Aspire required + consumer-import required (gate delta from n/a/optional justified in drift.md). A5 plugin gets F-13 subtype + Runtime/Aspire required + consumer-import required. All required/n/a/subtype mappings match the matrix. |
| Deferred scope explicit                 | **PASS**            | Plan §9 lists 5 deferred items with "why deferred" and target gate for each: Prisma artifacts → CI/Wave 6, `check:workers` → environment, zero-consumer trim → post-alpha review, dynamic-import warnings → future lint config, manifest type cast → Wave 3 follow-up. |
| jsr-audit surface scan (pkg/plugin)     | **PASS**            | Research §7 applies publishability rubric to both units. Scoped names, descriptions, valid exports, 0 slow types, clean file list, ESM-only all ✓. Missing module docs and 603 missing symbol docs are named as the dominant score factor — each has associated slices (C14, P12 for module docs; C5–C12, P5–P6 for symbol docs). Missing `publish:dry-run` task (plugin) and non-enumerating `check` tasks (both) are named as F-6 gaps with fix slices (C2, P1). |

## Open-decision sweep (evaluator-run)

**None.** All decisions that would force rework if deferred are locked in plan §13. Deferred items have safe deferral paths.

## Verdict

**PASS**

Every Plan-Gate checklist box is satisfied. The 27-slice plan (14 core + 13 plugin) is ordered, sized, and gated. Research is current and re-baselined. Archetype selection (A3 + A5) is justified and gate-aligned. Risk register has mitigations. Deferred scope is explicit with targets. The jsr-audit surface scan names every publishability gap and assigns it to a slice.

Implementation may begin.

## Notes

1. **Spot-check sample:** Verified `packages/plugin-workers-core/deno.json` exports show 17 keys including the duplicate `./contracts` + `./contracts/v1` pair. Verified `plugins/workers/deno.json` tasks lack `publish:dry-run` and `check` only covers 4 files. Verified `deno publish --dry-run --allow-dirty` passes for both units.
2. **Pre-existing carry:** `packages/cli` TS9016/TS9027 failures are documented in `drift.md` and `arch-debt.md` as Wave 6 CLI debt, byte-identical to base. Correctly excluded from 4b scope.
3. **4a pull-forward confirmed:** `workers-core ./streams` re-exports `@netscript/plugin-streams-core` which was cleaned in 4a (1→0 doc-lint, A1→A3). No merge work required.
4. **Monitor during IMPL-EVAL:** Slice count buffer is thin (27/30). If drift pushes either sub-wave over 18 slices, rescope per plan risk register.
