# PLAN-EVAL — beta5-impl--supervisor

- Plan evaluator session: PLAN-EVAL (separate session from generator), 2026-07-06
- Run: `beta5-impl--supervisor`
- Surface / archetype: cross-repo public-surface hygiene; mixed package/plugin archetypes (1-7) + Archetype 5 (plugin) — packages keep their current doctrine archetype; no package is restructured
- Scope overlays: `frontend` / `service` only where existing package surfaces already expose them; no new behavior
- Branch: `chore/303-enterprise-surface-sweep` at `0ea1e76df274bfcd683c43fa588151074e0e2687`
- Baseline (re-derived 2026-07-06): `1c1759908e99c68a3bb0cccfd7a35aeafd8d40e0` — confirmed against `origin/main` (`1c175990 chore(harness): owner routing adjustments for beta.5+ waves (Opus 4.8 high for UI/complex, Codex high default, docs=Claude-only prose) (#482)`)

## Checklist results

| Plan-Gate item | Result | Evidence / location |
| --- | --- | --- |
| Research present and current | PASS | `.llm/runs/beta5-impl--supervisor/research.md` exists; re-baseline `1c1759908` is current `origin/main` HEAD; three carried-in claims spot-checked against tree (see "Independent spot-checks" below) |
| Decisions locked | PASS | `plan.md` "Locked Decisions" table LD-1…LD-4 each carry rationale; no decision is left as "TBD" |
| Open-decision sweep | PASS | Plan's own sweep (`plan.md` §"Open-Decision Sweep") is complete; evaluator-run sweep below found no decision that would force rework if deferred |
| Commit slices (< 30, gate + files each) | PASS | `worklog.md` §"Commit Slices" lists 5 slices; none exceeds 30; each names its proving gate. Slice 1 (meta-bootstrap) is already committed (acceptable for run bootstrap). Slices 2-4 are finding-driven — file lists expand at implementation time once `deno task doc:lint` findings land, which is the correct shape for a hygiene sweep |
| Risk register | PASS | `plan.md` §"Risk Register" enumerates 4 risks (private-type redesign, lockfile churn, unreviewable sweep, sibling-subpath false flags); each has a mitigation |
| Gate set selected | PASS | `plan.md` §"Fitness Gates" names F-5/F-6/F-7/F-19 explicitly. F-1…F-18 (other universal gates) are exercised through the scoped check/lint/fmt wrappers in the Validation Plan |
| Deferred scope explicit | PASS | `plan.md` §"Non-Scope", §"Hidden Scope", and `worklog.md` §"Deferred Scope" collectively cover DB / AI / stale-file / doctrine-prose / e2e:cli / lockfile churn / public-API redesign |
| jsr-audit surface scan (pkg/plugin) | PASS | `research.md` §"jsr-audit surface scan (package/plugin waves)" names the planned surface (full export map, not just `mod.ts`), the oRPC-bound allowance from `86eca907` (preserved), the prohibition on new slow-types allowances, and the multi-subpath false-flag risk. Each named risk is mapped to a slice in `worklog.md` §"Commit Slices" |

## Independent spot-checks

Three load-bearing claims were independently verified against the tree:

1. **Inventory of `@netscript/*` roots.** Plan claims 35 publishable roots with a JSR export map. Independent count: 35 direct-child roots under `packages/` (29) + `plugins/` (6) have `deno.json` with `"name": "@netscript/*"`. **34 of those are publishable**; `@netscript/bench` (`packages/bench/deno.json`) has `"publish": false` and is therefore non-publishable. The plan's "35 publishable" wording is off-by-one in the strict sense — the actual count is **34 publishable + 1 non-publishable** — but the doc-lint/dry-run sweep will naturally skip `@netscript/bench` (no `deno publish` target; the existing `audit-jsr-package.ts` would skip it via the `publish: false` short-circuit). The misstatement is a documentation slip, not a structural plan failure: the implementation can and will sweep the 34 publishable roots without any rework.
2. **Existence and shape of the full-export-map doc-lint wrapper.** Verified `.llm/tools/run-deno-doc-lint.ts` exists (370 lines), is wired into `deno task doc:lint` (`deno.json` line for `"doc:lint"`), exposes `--root` and `--entrypoints` flags, and auto-discovers entrypoints from each package's `deno.json` exports map (the `discoverEntrypoints()` function reads `${root}/deno.json` exports). The plan's LD-1 and the worklog's "Contributor Path" are accurate.
3. **Sanctioned slow-types exception from `86eca907`.** Verified the commit exists on the current history (made by rickylabs on 2026-07-03, "docs(doctrine): sanction --allow-slow-types for oRPC-bound packages (#358)"). Verified `docs/architecture/doctrine/02-public-surface.md` §"Sanctioned exception: slow-types for oRPC-bound packages" names the oRPC-bound allowance with the `declare`d-internals rationale. Verified `.llm/tools/fitness/audit-jsr-package.ts` `ORPC_SLOW_TYPES_ALLOWLIST` (4 packages: `@netscript/contracts`, `@netscript/service`, `@netscript/plugin`, `@netscript/plugin-triggers-core`) implements the carve-out as an INFO finding for the allow-list and a WARN for all others. **Note:** the plan phrases this as "the single sanctioned oRPC-bound slow-types allowance" — this is one sanctioned *policy* (one commit / one doctrine section) that covers **4 packages**, not a single package. The plan's wording is semantically defensible ("single sanctioned decision") but slightly misleading on first read. Implementation must preserve the 4-package allow-list, not assume one package.

## Open-decision sweep (evaluator-run)

| Decision | Verdict | Notes |
| --- | --- | --- |
| 35 vs 34 publishable inventory | safe to defer | Doc-lint and dry-run iterate by export map; non-publishable `@netscript/bench` is naturally skipped. Plan-wording fix desirable, not a rework trigger. |
| oRPC allowance = 1 package vs 4-package allow-list | safe to defer | Plan preserves the policy (LD-2 + Risk Register). Implementation reads `ORPC_SLOW_TYPES_ALLOWLIST` directly, so it will hit the correct 4 packages. |
| Slice 2/3/4 file lists ("Selected `packages/*` files") | safe to defer | Doc-lint sweep is finding-driven; the exact file list cannot be known until the lint run completes. Slice 1 (bootstrap) is already committed and is the correct shape for a run-bootstrap slice. |
| Whether to add new slow-types allowances | already resolved (LD-2: no) | Doctrine and user brief both prohibit. |
| Whether to run `deno task e2e:cli` | already resolved: no | User brief and locked constraint prohibit; supervisor owns runtime smoke at merge readiness. |
| Whether to run stale-file deletion | already resolved: no | #307 owns that work. |
| Whether to redesign public API to clear a slow-type diagnostic | already resolved: defer to `notes.md` | Locked in LD-3 and `notes.md` Stops/Deferrals section. |

No open decision found that would force rework if deferred. The plan-gate's "If any open decision would force rework when deferred → `FAIL_PLAN`" bar is not tripped.

## Notes

- Slice 1 ("Harness bootstrap + draft PR surface") is already committed (`1178e727` per `worklog.md` Progress Log). This is the run-bootstrap slice and is acceptable; the plan-gate does not require all slices to be uncommitted at PLAN-EVAL time.
- The "Selected `packages/*` files" phrasing in slices 2-4 is below the "files it touches" ideal but is the correct shape for a finding-driven hygiene sweep. The supervisor is expected to commit slice 2/3/4 as separate, small commits once `deno task doc:lint` findings are known, with the per-slice file list recorded in the slice's commit message.
- The plan's claim of "35 publishable" is off-by-one (the actual count is 34 publishable + 1 non-publishable). The plan should ideally be tightened to "34 publishable roots (one additional root, `@netscript/bench`, is `publish: false` and out of sweep scope)", but the off-by-one does not change the implementation work list, gate selection, or risk register.
- The "single sanctioned oRPC-bound slow-types allowance" phrasing is one policy / one commit covering 4 packages (`@netscript/contracts`, `@netscript/service`, `@netscript/plugin`, `@netscript/plugin-triggers-core`); the audit gate's `ORPC_SLOW_TYPES_ALLOWLIST` is the source of truth.

## Verdict

`PASS`

All eight `plan-gate.md` boxes are satisfied. Implementation may begin.
