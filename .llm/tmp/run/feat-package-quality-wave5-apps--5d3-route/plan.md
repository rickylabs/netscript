# 5d3 route — proposed slice lock (PLAN phase)

Status: PROPOSED. Implementation deferred until PLAN-EVAL passes.

Authority: `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/plan.md` (binding umbrella),
`AGENTS.md`, `netscript-harness` SKILL, `.llm/harness/gates/archetype-gate-matrix.md`,
`.llm/harness/lessons/package-quality-archetype.md`, `jsr-audit` SKILL.

Research inputs reused without re-measurement:
`.llm/tmp/run/feat-package-quality-wave5-apps--5d3-route/research.md`,
`deno-doc-lint.txt`, `deno-doc-lint-raw.txt`, `deno-doc-route.json`, `dry-run-raw.txt`.

---

## MEASURE-FIRST table

All numbers are taken from committed artifacts in
`.llm/tmp/run/feat-package-quality-wave5-apps--5d3-route/`; no measurements were re-run.

| # | Metric | Value | Source | Target after 5d3 |
|---|--------|-------|--------|------------------|
| 1 | `route/mod.ts` LOC | **755** | `research.md` §1; direct file stats | ≤ 500 |
| 2 | `route/contract.ts` LOC | **764** | `research.md` §1; direct file stats | ≤ 500 |
| 3 | `route/manifest.ts` LOC | **534** | `research.md` §1; direct file stats | ≤ 500 |
| 4 | Combined `deno doc --lint` errors across `route/mod.ts`, `route/contract.ts`, `route/manifest.ts` | **180** | `deno-doc-lint.txt` headline | **0** |
| 5 | · `missing-jsdoc` errors | **106** | `deno-doc-lint.txt` | **0** |
| 6 | · `private-type-ref` errors | **74** | `deno-doc-lint.txt` | **0** |
| 7 | `deno check --unstable-kv` scoped to `packages/fresh/route/` | Unknown baseline; will run as gate | `research.md` §1 | 0 type errors in route modules |
| 8 | `deno publish --dry-run` package-wide problems | **62** | `dry-run-raw.txt` | Route surface contributes 0 new problems; package-wide pre-existing failures remain out of scope |
| 9 | Public exported symbols from `./route/mod.ts` | **49** | `deno-doc-route.json` | 49 unchanged (+ re-export aliases only) |
| 10 | Files over F-1 cap (500 LOC) in `packages/fresh/route/` | **3** | LOC metrics above | **0** |

---

## Slice lock (≤30)

Slices are implementation-order commits. Each slice names the files touched, the gate it must
pass, and the doc-lint / over-cap budget it retires. The total slice count is **25** (≤ 30).

### Phase A — Foundation (decomposition + folder hygiene)

| Slice | Title | Files touched | Gate | Budget retired |
|-------|-------|---------------|------|----------------|
| 1 | Commit PLAN artifacts | `plan.md`, `design.md`, `drift.md`, `worklog.md`, `context-pack.md`, `commits.md` | `F-12`, `F-7` (doc naming) | None — planning only |
| 2 | Scaffold route internal structure | `route/_internal/`, `route/manifest-types.ts`, `route/types.ts`, `route/navigation.ts` (stubs) | `F-11` (forbidden folders), `F-16` (folder cardinality), `F-18` (sub-barrels) | None yet — structural |
| 3 | Extract shared route types | `route/types.ts`, `route/contract.ts`, `route/mod.ts` | `F-1`, `F-3`, `F-5`, `F-15` | Retires ~40 `private-type-ref` by making helpers public |
| 4 | Extract navigation/link helpers | `route/navigation.ts`, `route/contract.ts`, `route/mod.ts`, `builders/define-page/navigation.tsx` (imports adjusted) | `F-1`, `F-3`, `F-5`, `F-15` | Retires remaining `private-type-ref` from builder leaks |
| 5 | Slim contract.ts | `route/contract.ts`, `route/_internal/schema-helpers.ts` | `F-1`, `F-2`, `F-5` | `contract.ts` ≤ 500 LOC |
| 6 | Slim manifest.ts + manifest-types | `route/manifest.ts`, `route/manifest-types.ts`, `route/mod.ts` | `F-1`, `F-3`, `F-14` (no logs in generator) | `manifest.ts` ≤ 500 LOC |
| 7 | Slim mod.ts barrel | `route/mod.ts` only | `F-1`, `F-15` | `mod.ts` ≤ 500 LOC |

### Phase B — Public-surface completeness (doc-lint to zero)

| Slice | Title | Files touched | Gate | Budget retired |
|-------|-------|---------------|------|----------------|
| 8 | JSDoc `route/types.ts` | `route/types.ts` | `F-5`, `F-7` | All missing-jsdoc on route/types |
| 9 | JSDoc `route/contract.ts` | `route/contract.ts` | `F-5`, `F-7` | All missing-jsdoc on route/contract |
| 10 | JSDoc `route/navigation.ts` | `route/navigation.ts` | `F-5`, `F-7` | All missing-jsdoc on route/navigation |
| 11 | JSDoc `route/manifest-types.ts` | `route/manifest-types.ts` | `F-5`, `F-7` | All missing-jsdoc on manifest types |
| 12 | JSDoc `route/manifest.ts` | `route/manifest.ts` | `F-5`, `F-7`, `F-14` | All missing-jsdoc on manifest runtime |
| 13 | JSDoc `route/mod.ts` | `route/mod.ts` | `F-5`, `F-7` | All missing-jsdoc on mod barrel |
| 14 | Doc-lint zero for route | All `route/**/*.ts` | **Combined `deno doc --lint` over `route/mod.ts`, `route/contract.ts`, `route/manifest.ts` = 0** | Retires the full 180 baseline |

### Phase C — Static gates

| Slice | Title | Files touched | Gate | Budget retired |
|-------|-------|---------------|------|----------------|
| 15 | F-1 file-size lint | All `route/**/*.ts` | `F-1` (all route files ≤ 500 LOC) | 3 over-cap files → 0 |
| 16 | F-2 helper-reinvention scan | `route/_internal/*.ts` | `F-2` | Confirms no `@std`/Web-Platform re-wrapping |
| 17 | F-3 layering check | All `route/**/*.ts` | `F-3` | Internal/public layering valid |
| 18 | F-5 public surface audit | All `route/**/*.ts` | `F-5` (every export has JSDoc, no private leaks) | Re-verifies slices 8–14 |
| 19 | F-12 naming-convention lint | All `route/**/*.ts` | `F-12` | Names match doctrine |
| 20 | F-15 re-export-upstream lint | `route/mod.ts`, `route/navigation.ts` | `F-15` | No spurious upstream re-exports |
| 21 | Scoped `deno check` | All `route/**/*.ts` | Static type gate | 0 type errors in route modules |

### Phase D — Consumer + runtime validation

| Slice | Title | Files touched | Gate | Budget retired |
|-------|-------|---------------|------|----------------|
| 22 | Consumer import validation | `packages/fresh/builders/define-page/navigation.tsx`, `packages/fresh/builders/define-page/types.ts`, search consumers | Consumer gate | No consumer broken by route moves |
| 23 | Route contract unit tests | `packages/fresh/route/tests/contract_test.ts`, `packages/fresh/route/tests/manifest_test.ts` | `F-10` (test shape) | Pure function coverage |
| 24 | Aspire / runtime fixture | `apps/playground/routes/contract-demo.*` OR `packages/fresh/tests/_fixtures/route-runtime/` | `F-9` (permissions), `F-13` (runtime invariants), Aspire runtime gate | Runtime proof |
| 25 | Dry-run + task hygiene | `packages/fresh/deno.json` | `F-6` (JSR tasks), `F-7` | `publish:dry-run` route surface clean; package-wide pre-existing issues documented |

Slice count: **25**.

---

## Gate-to-slice map

Each required gate from `.llm/harness/gates/archetype-gate-matrix.md` for the applicable archetype
(Arch 3 runtime-behavior + SCOPE-frontend) is mapped to the slice that satisfies it.

| Gate | Requirement summary | Satisfying slice(s) |
|------|---------------------|---------------------|
| F-1 | Files ≤ 500 LOC; fail over 800 | 2, 3, 4, 5, 6, 7, 15 |
| F-2 | No `@std`/Web-Platform helper reinvention | 16 |
| F-3 | Correct dependency layering | 2, 3, 4, 6, 17 |
| F-4 | Inheritance depth ≤ 3; abstract-only parents | N/A — no classes in route surface |
| F-5 | Public surface audit: JSDoc, no private leaks | 3, 4, 8, 9, 10, 11, 12, 13, 14, 18 |
| F-6 | JSR publishability; `deno.json` tasks for check/fmt/lint/dry-run | 25 |
| F-7 | Doc-score gate (`deno doc --lint` = 0 for public entrypoints) | 8, 9, 10, 11, 12, 13, 14, 25 |
| F-8 | Workspace lib check passes | 21 |
| F-9 | Permission declarations correct in tests/fixtures | 24 |
| F-10 | Test-shape audit | 23, 24 |
| F-11 | Forbidden-folder lint | 2 |
| F-12 | Naming-convention lint | 1, 19 |
| F-13 | Saga/runtime invariants (abort/cleanup) | 24 |
| F-14 | Console-log lint | 6, 12 |
| F-15 | Re-export-of-upstream lint | 3, 4, 7, 20 |
| F-16 | Folder-cardinality ≤ 12 children; depth ≤ 4 | 2 |
| F-17 | Abstract-derived co-location | N/A — no abstract classes in route surface |
| F-18 | Sub-barrel lint | 2 |
| **Static type gate** | Scoped `deno check` = 0 | 21 |
| **Doc-lint gate** | Combined `deno doc --lint` = 0 | 14 |
| **Consumer gate** | No internal consumer broken | 22 |
| **Runtime/Aspire gate** | Runtime proof + abort/cleanup | 24 |
| **Browser validation** | Browser-specific behavior tested | N/A for 5d3 — navigation hooks are server/browser shared; browser specifics covered by 5d2/5d6 |

---

## Review map

| Reviewer focus | Where to look | Acceptance criteria |
|----------------|---------------|---------------------|
| Architecture / decomposition | `design.md` § Decomposition target | Folder roles clear; no `utils/` or `interfaces/` vocabulary; public surface unchanged |
| Public surface / API stability | `design.md` § Measure-first baseline + Public-surface verdict | All 49 existing exports retained; only re-export aliases added |
| Type safety / contracts | `design.md` § E2E typesafety chain + oRPC alignment | Single `defineRouteContract` declaration types handler, SDK, and links |
| Manifest scope | `design.md` § Manifest vs Fresh 2 fsRoutes | Does not replace `fsRoutes`; adds contract sidecars + static codegen only |
| Gate coverage | This file § Gate-to-slice map | Every matrix gate mapped to a slice; N/A items justified |
| Slice feasibility | This file § Slice lock | 25 slices, each < one reviewable commit; no slice mixes doc-lint and decomposition |
| Risk / dependencies | `design.md` § Risks + this file § Dependencies | Supervisor questions answered before IMPL-EVAL |

---

## Assumptions

1. The umbrella plan's public-export lock for `packages/fresh` remains in effect: no existing
   export specifier is renamed or removed during 5d3.
2. 5d2 (`builders/define-page`) will either keep its public navigation/link surface stable or
   coordinate renames with 5d3 slice 4/22.
3. `@netscript/contracts` `ContractSchema<T>` port is stable enough to adopt as the route schema
   type contract; if it changes, only `route/types.ts` and `route/_internal/schema-helpers.ts`
   require adjustment.
4. Aspire runtime validation can reuse `apps/playground` if 5d2 establishes a working fixture;
   otherwise a dedicated `packages/fresh/tests/_fixtures/route-runtime` app is acceptable.
5. Zod 4 is the implementation detail; consumers may only observe the `ContractSchema` port shape.
6. The package-wide 62 dry-run problems are not caused by the route surface and are therefore out
   of 5d3 scope.
7. The `deno check` root excludes `packages/fresh`; scoped route checking is the authoritative
   static gate for this slice.

---

## Questions for supervisor

1. **Runtime fixture location**: Should the Aspire/runtime proof live in `apps/playground` or a
   dedicated `packages/fresh/tests/_fixtures/route-runtime/` app? (Preferred: reuse playground if
   5d2 establishes it.)
2. **Link helper ownership**: Is moving `Link` / `getLinkProps` from
   `builders/define-page/navigation.tsx` into `route/navigation.ts` acceptable to 5d2? If 5d2 keeps
   ownership, route must publicly re-export the types and clear `private-type-ref` via re-exports.
3. **ContractSchema alignment timing**: Should we type-align route schemas to
   `@netscript/contracts` in 5d3 (type-only, no runtime change), or defer to a follow-up wave?
   (Recommended: type-align now to avoid a second public-surface change.)
4. **Manifest generated output**: Should `renderNetScriptRouteManifest` continue emitting `.ts`
   files to disk, or should it be split into a pure string renderer + writer for testability?
   (Recommended: split in slice 6.)
5. **Umbrella entrypoint lock**: Does the umbrella allow adding `route/types.ts` and
   `route/navigation.ts` as new public subpath exports, or must everything route-related be reached
   only through `./route/mod.ts`? (Recommended: keep subpaths internal; expose via `mod.ts`.)

---

## Dependencies & merge impact

### Blockers (must be resolved before implementation starts)

| Dependency | Why it blocks 5d3 | Resolution path |
|------------|-------------------|-----------------|
| 5d2 builders PLAN-EVAL / merge | Route currently re-exports builder types/hooks; moving them requires a stable builder public surface | Wait for 5d2 public surface lock or coordinate cross-wave ownership |
| `@netscript/contracts` version lock | Type alignment assumes `ContractSchema` port | Confirm in umbrella lock; contracts is already a dependency |

### Merge impact on other waves

| Wave | Impact | Mitigation |
|------|--------|------------|
| 5d1 error taxonomy | Route contract violations throw typed errors; need the finalized error shape | Reference 5d1 taxonomy in runtime fixture tests; if 5d1 changes, update only error-construction call sites |
| 5d2 builders | May need to adjust builder imports if link helpers move | Slice 22 is the consumer-import validation gate |
| 5b SDK | Route contract alignment to `ContractSchema` simplifies future SDK serialization | Type-level only; no SDK code touched |
| 5d6 query bridge | Typed search/param helpers become reusable | No direct code change in 5d3; surface prepared for 5d6 |
| Umbrella / 5d4–5d6 | Any new route subfiles must follow the same F-1/F-5/F-11 discipline | Documented in side-effect ledger |

### Branch strategy

- Implement 5d3 on its feature branch.
- Rebase onto `main` after 5d2 merges; run consumer-import gate (slice 22) again.
- Do not merge 5d3 until IMPL-EVAL passes and 5d2 is stable.

---

## Side-effect ledger

| ID | Side effect | Trigger slice | Resolution |
|----|-------------|---------------|------------|
| SE-5d3-001 | New files `route/types.ts`, `route/navigation.ts`, `route/manifest-types.ts`, `route/_internal/*.ts` added to `packages/fresh/deno.json` include if using explicit include | 2 | Update `deno.json` `include` in slice 2; verify with dry-run in slice 25 |
| SE-5d3-002 | `builders/define-page/navigation.tsx` may import from `route/navigation.ts` instead of the reverse | 4 | Record in drift; validated by slice 22 |
| SE-5d3-003 | Package-wide `deno publish --dry-run` will still show 62 pre-existing problems; route surface must not add new ones | 25 | Document baseline delta in `drift.md`; do not treat package-wide failures as 5d3 failure |
| SE-5d3-004 | Test permissions in runtime fixture may require `--allow-read` / `--allow-net` / `--allow-write` | 23, 24 | Add to `deno.json` test task or inline `deno test -A` in fixture; justify under F-9 |
| SE-5d3-005 | Manifest generator split (renderer vs writer) changes internal call graph; no public API change | 6 | Unit tests updated in slice 23 |
| SE-5d3-006 | Route contract type alignment to `ContractSchema` is a public type narrowing, not a runtime breaking change | 3, 9 | Document in `drift.md`; consumer tests in slice 22 confirm compatibility |
