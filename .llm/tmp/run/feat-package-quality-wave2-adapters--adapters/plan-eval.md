# PLAN-EVAL — feat-package-quality-wave2-adapters--adapters

- Plan evaluator session: separate-session PLAN-EVAL, 2026-06-06
- Run: `feat-package-quality-wave2-adapters--adapters`
- Surface / archetype: 8 units, all Archetype 2 — Integration
  (`logger → telemetry → aspire → kv → database → prisma-adapter-mysql → queue → cron`)
- Scope overlays: `SCOPE-docs.md` (README ≥ 150 + `/docs` per STANDARDS § 7)

## Inputs available at evaluation time

| Required input (plan-protocol.md §Inputs)        | Present? | Location |
| ------------------------------------------------ | -------- | -------- |
| `research.md`                                    | ✅ yes   | run dir (structural re-baseline only) |
| `plan.md`                                         | ❌ **MISSING** | not in run dir; no `plan.md` for this run on the branch |
| `worklog.md` `## Design` section                  | ❌ **MISSING** | `worklog.md` does not exist in run dir |
| Archetype profile + gate matrix                   | ✅ yes   | `archetypes/ARCHETYPE-2-integration.md`, `gates/archetype-gate-matrix.md` |
| `debt/arch-debt.md`                               | ✅ yes   | read |

Two of the three required plan-evaluation inputs (`plan.md`, `worklog.md` Design
section) do not exist. The PR comment "Plan & Design complete — ready for
PLAN-EVAL" is contradicted by the run's own `context-pack.md` **Status** checklist
(lines 34–38), which still shows the following boxes **unchecked**:

- [ ] Research step 1 — MEASURE-FIRST dynamic sweep (`release-readiness.ts`,
      per-unit `deno publish --dry-run` / `deno doc --lint`)
- [ ] `plan.md`
- [ ] `worklog.md` Design checkpoint
- [ ] `drift.md` re-baseline delta
- [ ] commit slices

`commits.md` and `drift.md` are still scaffolds (drift OQ-1 row reads "(pending
plan agent)"). The generator's Plan & Design phase has **not been executed**; only
the reviewer-seeded Research staging exists.

## Spot-check of a load-bearing research finding (protocol §Procedure step 1)

- Finding D1 ("`@netscript/database` has no README"): **verified** —
  `ls packages/database/README.md` → "No such file or directory". The structural
  re-baseline in `research.md` is trustworthy; the gap is the **missing plan**, not
  bad research.

## Checklist results

| Plan-Gate item                          | Result      | Evidence / location |
| --------------------------------------- | ----------- | ------------------- |
| Research present and current            | **FAIL**    | `research.md` exists and is structurally re-baselined, but it explicitly defers the load-bearing dynamic numbers (slow-types, `doc --lint`) as `MEASURE-FIRST` "Research step 1", and that step was **not run** (context-pack Status unchecked). Research is not yet current on the numbers every downstream decision depends on. |
| Decisions locked                        | **FAIL**    | No `plan.md` → zero architecture decisions are stated/locked. OQ-1…OQ-7 remain open questions in `research.md` §"Open questions", none resolved. |
| Open-decision sweep                     | **FAIL**    | OQ-1 (slice-budget / sub-wave split) is flagged in `research.md` as "deferring this forces a mid-implementation rescope → must resolve now" and is **unresolved**. Per Plan-Gate, an open decision that forces rework when deferred is an automatic `FAIL_PLAN`. OQ-3 (AP-17 `interfaces/`→`ports/` rename vs debt) and OQ-4 (aspire `./helpers` drop) are also rework-forcing and unresolved. |
| Commit slices (< 30, gate + files each) | **FAIL**    | No slices enumerated. `commits.md` is a scaffold ("no commits yet"). No ordered, sized, gate-named, file-named slice list exists. |
| Risk register                           | **FAIL**    | `research.md` carries Wave 1 lessons R-1…R-7 and "dominant surface risks", but there is no plan-level risk register pairing each risk with a mitigation slice. |
| Gate set selected                       | **FAIL**    | No `plan.md` locks the gate set. Additionally the seed's stated A2 fitness set (R-7: "F-1..F-12 + F-14 + F-15") is **under-selected** vs the current `gates/archetype-gate-matrix.md`, which marks **F-16, F-17, F-18 `required` for Arch 2** (and F-2/F-4 required). The plan must select the full current matrix, not the stale list. |
| Deferred scope explicit                 | **FAIL**    | No `plan.md` → no explicit deferred-scope statement. |
| jsr-audit surface scan (pkg/plugin)     | **FAIL**    | A surface scan table is present in `research.md` §"jsr-audit surface scan", but plan-protocol step 4 requires **each named risk to have a slice that addresses it** — no slices exist, so no named risk is sliced. |

## Open-decision sweep (evaluator-run)

Rework-forcing decisions left open by the current artifacts:

1. **OQ-1 — slice budget / sub-wave split.** At Wave-1 density (~9 slices/unit) 8
   units ≈ 50–70 slices, which violates the Plan-Gate `< 30` hard cap. This must be
   resolved (single PR vs 2a/2b/2c sub-waves) **before** any slice list can be
   written; deferring it forces a mid-implementation rescope.
2. **OQ-3 — AP-17 `interfaces/` → `ports/`** on `database` / `queue` / `cron`.
   Renaming breaks published subpaths (`./interfaces`, `./types`, `./validation`);
   doing it later forces consumer rework. Needs a consumer-impact grep and a
   rename-now-vs-debt decision now.
3. **OQ-4 — aspire `./helpers` alias drop.** Same class: a public-surface removal
   that forces consumer updates if deferred.
4. **MEASURE-FIRST dynamic gates (OQ-2 / OQ-7).** Per-unit real slow-type and
   `doc --lint` counts are unmeasured; `research.md` itself states the scope of each
   unit (especially `database` and `prisma-adapter-mysql` with `skipLibCheck:true`)
   depends on these numbers. Slicing before measuring risks mis-sized slices.

Each of the above is an independent unchecked box under the Open-decision sweep rule.

## Verdict

`FAIL_PLAN`

The Plan & Design deliverables do not exist. `research.md` (structural staging) is a
sound starting point, but `plan.md` and the `worklog.md` `## Design` checkpoint —
the two artifacts PLAN-EVAL exists to judge — are absent, and every downstream
Plan-Gate box is consequently unchecked. This is the **entire generator
deliverable**, not a small reviewer-side correction; per `gates/plan-gate.md`
("Why this gate exists") and the harness self-evaluation prohibition, the PLAN-EVAL
evaluator must not author the plan it then certifies. The run returns to Plan &
Design. No implementation slice may be committed.

### Required fixes (return to Plan & Design)

1. **Run Research step 1 (MEASURE-FIRST).** Execute
   `tools/fitness/release-readiness.ts --include-plugins` and, per unit in dependency
   order, `deno publish --dry-run --allow-dirty` (slow-type count) and
   `deno doc --lint <every entrypoint in deno.json exports>` (error count). Record
   real numbers and log every delta vs the carried-in counts in `drift.md`.
   Note: the doc-lint sweep must cover **every** `exports` entrypoint (root + all
   subpaths), not only `mod.ts`.
2. **Resolve OQ-1 first and record it in `drift.md`.** Decide single-PR vs sub-wave
   split (reviewer recommendation: 2a logger·telemetry·aspire / 2b
   kv·database·prisma-adapter-mysql / 2c queue·cron). Each sub-wave's slice list must
   be independently `< 30`.
3. **Resolve OQ-2…OQ-7** with rationale (AP-17 renames + consumer grep, aspire
   `./helpers` drop + consumer grep, `./testing` entrypoint scope, `kv/ARCHITECTURE.md`
   + `prisma-adapter-mysql/examples/` publish hygiene, `skipLibCheck` removal).
4. **Write `plan.md`** with: locked decisions + rationale; the open-decision sweep
   (each item "safe to defer" or "must resolve now"); an ordered, `< 30` (per
   sub-wave) commit-slice list where **each slice names what it proves, its proving
   gate, and the files it touches**; a risk register pairing each risk (R-1…R-7 +
   surface risks) with a mitigation slice; the **full** A2 gate set from the current
   `gates/archetype-gate-matrix.md` (Static; Fitness **F-1…F-12, F-14, F-15, F-16,
   F-17, F-18**, F-13 n/a; Consumer import validation; Runtime where a real backend
   is exercised; merge-readiness `deno task e2e:cli`); and explicit deferred scope.
5. **Write the `worklog.md` `## Design` checkpoint**: per-unit port/adapter shape,
   composition root, required permissions, consumer-import impact, and vocabulary
   renames.
6. **Tie each named jsr-audit surface risk to a specific slice** so the surface scan
   is sliced, not just tabulated.
7. Re-submit for a separate-session PLAN-EVAL. (Cycle 1 of the two allowed
   `FAIL_PLAN` cycles before escalation.)

## Notes

- Why no reviewer-side fix: the comment invited fixing a "relatively small surface
  of correction" in place. The correction surface here is the whole Plan & Design
  deliverable (measurement + 7 open decisions + plan.md + Design checkpoint), and
  the evaluator authoring it would violate the Plan-Gate's separation-of-sessions
  rationale. Returned as `FAIL_PLAN` instead.
- `research.md`'s structural findings are accurate (spot-checked) and can be reused
  as-is; the failure is missing Plan & Design, not bad research.
