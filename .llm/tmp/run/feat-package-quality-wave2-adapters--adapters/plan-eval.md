# PLAN-EVAL — feat-package-quality-wave2-adapters--adapters

- Plan evaluator session: separate-session PLAN-EVAL, **cycle 2**, 2026-06-06
- Run: `feat-package-quality-wave2-adapters--adapters`
- Surface / archetype: 8 units, all Archetype 2 — Integration
  (`logger → telemetry → aspire → kv → database → prisma-adapter-mysql → queue → cron`)
- Scope overlays: `SCOPE-docs.md` (README ≥ 150 + `/docs` per STANDARDS § 7)
- Plan under review: branch `feat/package-quality-wave2-adapters` @ `1933bce`
  (`research.md`, `plan.md`, `worklog.md` `## Design`, `drift.md`)

## Cycle history

- **Cycle 1** (`971fd4a`): `FAIL_PLAN` — `plan.md` and the `worklog.md` Design section did
  not exist; MEASURE-FIRST and OQ-1…OQ-7 unresolved.
- **Cycle 2** (this verdict): the plan agent produced `plan.md`, the `worklog.md` Design
  checkpoint, real dynamic numbers in `drift.md`, and resolved all seven open questions.

## Inputs available at evaluation time

| Required input (plan-protocol.md §Inputs) | Present? | Location |
| ----------------------------------------- | -------- | -------- |
| `research.md`                              | ✅ | run dir (structural re-baseline) |
| `plan.md`                                  | ✅ | run dir — locked decisions, slices, gates, risk register |
| `worklog.md` `## Design` section           | ✅ | run dir — public surface, vocab, ports, composition roots, permissions, consumer impact |
| Archetype profile + gate matrix            | ✅ | `archetypes/ARCHETYPE-2-integration.md`, `gates/archetype-gate-matrix.md` |
| `debt/arch-debt.md`                        | ✅ | read |

## Spot-checks (protocol §Procedure step 1 — verify load-bearing findings)

All verified against the worktree in this evaluator session:

- **Consumer-impact claim ("zero external consumers")** — the load-bearing claim that
  unblocks every rename. Grep (excluding `.llm/tmp`) for
  `@netscript/aspire/helpers`, `@netscript/database/interfaces`,
  `@netscript/queue/{types,validation}`, `@netscript/cron/types` → **all NONE**. ✓ Holds.
- **Rename targets exist** — `aspire` `./helpers` and `./application` both map to
  `./src/application/mod.ts` (duplicate alias confirmed); `database` `./interfaces`,
  `queue` `./types`+`./errors`+`./validation`, `cron` `./types` all map into
  `interfaces/`/`utils/` as the plan states. ✓
- **`database` slow-type source** — `packages/database/extensions/sql-json.extension.ts`
  exists (drift names line 286 as the 1 slow type). ✓
- **`prisma-adapter-mysql` `skipLibCheck:true`** — present in `deno.json` (OQ-7 target). ✓
- **`database` has no README** (re-confirmed from cycle 1). ✓

**Limitation noted:** `deno` is not available in this evaluator sandbox, so the dynamic
counts in `drift.md` (slow-types, `doc --lint` per unit) could not be independently
re-executed. They are accepted as **generator-recorded manual evidence** (run on
`ca4d9c4`), consistent with every structural precondition I *could* verify above. The
implementing agent must re-confirm each count at slice time (the plan already makes
"verify `publish:dry-run` 0 slow types + `doc --lint` clean" an explicit slice per unit).

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | **PASS** | `research.md` (structural) + `drift.md` §"Dynamic re-baseline — REAL numbers" (per-unit slow-type + `doc --lint` counts, deltas vs carried-in). MEASURE-FIRST done. Structural preconditions spot-checked. |
| Decisions locked                        | **PASS** | `plan.md` §"Locked decisions" 1–6 — sub-wave split, `interfaces/`→`ports/`, `./helpers` drop, `./testing` scope, publish hygiene, `skipLibCheck` removal, each with rationale. |
| Open-decision sweep                     | **PASS** | `plan.md` §"Open-decision sweep" — OQ-1…OQ-7 all RESOLVED; "No open decisions remain." My independent sweep (below) found no rework-forcing decision left open. |
| Commit slices (< 30, gate + files each) | **PASS** | `plan.md` §"Commit slices" — 2a=10, 2b=23, 2c=17 slices; each names what it proves, its gate, and files. All three sub-waves < 30. |
| Risk register                           | **PASS** | `plan.md` §"Risk register" — 5 risks with likelihood/impact/mitigation. |
| Gate set selected                       | **PASS (after self-applied fix)** | `plan.md` §"Full A2 gate set" — Static + Fitness + Consumer + Runtime(deferred) + merge-readiness. **Fix applied this session:** the fitness table stopped at F-15; per `gates/archetype-gate-matrix.md` (source of truth) Arch 2 also requires **F-16/F-17/F-18**. Added all three (F-13 correctly n/a). See "Self-applied corrections". |
| Deferred scope explicit                 | **PASS** | `plan.md` §"Deferred scope" + `worklog.md` §"Deferred scope (Design)" — runtime backends → S2, telemetry instrumentation extraction, kv AP-1 god-file, Prisma deep doc-lint. |
| jsr-audit surface scan (pkg/plugin)     | **PASS** | `plan.md` §"jsr-audit surface scan (post-plan)" — per-unit meta/README/docs/slow-type/doc-lint/`./testing`; named risks tied to sub-wave slices in §"Risk register" + §"Commit slices". |

## Open-decision sweep (evaluator-run)

No rework-forcing decision is left open. Items I checked specifically:

1. **Sub-wave split (OQ-1).** 2a/2b/2c each < 30 slices; natural dependency chain
   (2a → 2b via kv→logger, 2b → 2c via queue→kv) preserves ordering. The plan correctly
   flags that this changes the registry's single-group assumption and requires a
   `phase-registry.md` escalation — recorded in `drift.md`. Not rework-forcing here.
2. **Renames (OQ-3/OQ-4).** Decided "rename now"; zero external consumers verified;
   consumer `deno check` gate scheduled after each rename slice. Safe to lock.
3. **kv folder consolidation (evaluator-found nuance).** `packages/kv/` already contains an
   `adapters/` folder alongside `bridges/`, so slice 2b-1 is a *merge into* `adapters/`,
   not a clean rename. This is an implementation detail, not a plan-level open decision —
   I clarified the slice wording in place rather than fail the plan.
4. **`skipLibCheck` removal (OQ-7).** Plan includes a dedicated slice (2b-19) to fix any
   type errors the removal surfaces, so deferral risk is contained.

## Self-applied corrections (instruction #10 — small surface, fixed in place)

Rather than return a cycle-2 `FAIL_PLAN` for small, well-defined gaps, I corrected them in
`plan.md` directly:

1. **Gate-set completeness.** Added **F-16 (Folder-cardinality), F-17 (Abstract-derived
   co-location), F-18 (Sub-barrel lint)** to the fitness gate table, each with a concrete
   verification note tied to the rename / `./testing` slices, and noted the
   matrix-vs-archetype-doc conflict (the matrix governs). This closes the exact gap raised
   in cycle 1.
2. **kv slice accuracy.** Reworded slice 2b-1 to "consolidate `bridges/` into existing
   `adapters/`" (with a do-not-overwrite note) and added F-16 to its gate set, since
   `adapters/` already exists.

Both are confined to the plan document; neither changes scope, slice count, or any locked
decision.

## Follow-up the implementing agent must honor (not blocking)

- Re-run and record the real `deno publish --dry-run` / `deno doc --lint` numbers at slice
  time (deno was unavailable to this evaluator). The `doc --lint` sweep must cover **every**
  entrypoint in each `deno.json` `exports` map (root + all subpaths), not only `mod.ts`.
- `queue` `./errors` keeps its subpath name but its target moves from `interfaces/errors.ts`
  to `ports/errors.ts` during slice 2c-1/2 — update the `deno.json` target accordingly.
- File the `phase-registry.md` escalation for the 2a/2b/2c split before opening the first
  sub-wave implementation PR.

## Verdict

`PASS`

All eight Plan-Gate boxes are satisfied (the gate-set box after a small, in-place correction
permitted by instruction #10). Research is current with real dynamic numbers; all seven open
questions are resolved with verified consumer-impact evidence; commit slices are ordered,
gated, file-named, and < 30 per sub-wave; the risk register and deferred scope are explicit;
the jsr-audit surface scan ties each risk to a slice. Implementation may begin, **slice by
slice, per the 2a → 2b → 2c sub-wave decision**, each sub-wave carrying its own Plan-Gate-clean
slice list and its own separate-session IMPL-EVAL.

## Notes

- `research.md`'s structural findings remain accurate (re-spot-checked) and are correctly
  reused.
- This is cycle 2 of the two allowed; the verdict is `PASS`, so no escalation is required.
