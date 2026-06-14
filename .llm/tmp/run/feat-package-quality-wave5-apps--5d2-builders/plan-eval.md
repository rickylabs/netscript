# PLAN-EVAL: 5d2 builders — definePage DSL decomposition

**Evaluator session:** openhands (independent, did not write the plan)
**Date:** 2026-06-13
**Artifacts reviewed:**
- `.llm/tmp/run/feat-package-quality-wave5-apps--5d2-builders/plan.md` (689 lines)
- `.llm/tmp/run/feat-package-quality-wave5-apps--5d2-builders/design.md` (236 lines)
- `.llm/tmp/run/feat-package-quality-wave5-apps--5d2-builders/research.md`
- `.llm/tmp/run/feat-package-quality-wave5-apps--5d2-builders/drift.md`
- `.llm/tmp/run/feat-package-quality-wave5-apps--5d2-builders/context-pack.md`
- `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/plan.md` (umbrella)
- `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/handover-5d2-plan.md`
- `.llm/harness/evaluator/plan-protocol.md`
- `.llm/harness/gates/archetype-gate-matrix.md`
- `.llm/harness/gates/plan-gate.md`

**Previous eval:** FAIL_PLAN (4 blockers)

---

## Prior Blocker Resolution

### Blocker 1: One-plan vs two decision — ✓ RESOLVED (PASS)

**Finding:** L-6 (plan.md §101) states "One plan, not two" with measurement-grounded rationale:
> "5 over-cap source files + 1 test file + 40 doc-lint errors can be sequenced in a single lock"

**Verification:**
- Decision locked, not deferred
- Rationale cites specific measurements (5 source files, 1 test file, 40 errors)
- Open-decision sweep table marks "One plan or two plans" as RESOLVED
- Context-pack.md echoes the decision

**Minor finding:** L-6 claims "28-slice rationale" but the plan lists 27 slices (Slice 1–27). Counting error (off-by-one), not material to the decision.

---

### Blocker 2: Actionable implementation sequence — ✓ RESOLVED (PASS)

**Finding:** 27 slices enumerated (plan.md §214–591), each with:
- Purpose (what it achieves)
- Files touched (explicit list)
- Proving gates (deno check, deno doc --lint, file-size checks, surface snapshot test)
- Budget retired (doc-lint error count, private-type-refs, file size reduction)

**Slice structure:**
- Slices 1–2: Surface snapshot + form-package leak fix (40 doc-lint errors)
- Slices 3–6: Builder split (state, factory, validators, barrel)
- Slices 7–10: Runtime split (context, render, handlers, barrel)
- Slices 11–14: Navigation split (context, hooks, link, barrel)
- Slices 15–18: Barrel updates (builders/mod.ts, define-page/types.ts, define-page/mod.ts, deno.json)
- Slices 19–22: Test splits (builder, runtime, navigation, search-params)
- Slices 23–25: Fixtures + fitness gates (playground routes, arch:check)
- Slice 26: Final validation (doc-lint, publish dry-run)
- Slice 27: Drift/context-pack/worklog updates

**Verification:**
- All 27 slices under 30 cap (handover allowed ≤30 per plan if split into two; single plan gets 30)
- Each slice names specific proving gates (not generic "run tests")
- Budget retired is quantified (e.g., "Retire 19 private-type-refs + 18 missing-jsdoc")
- Slice ordering is logical (surface first, form leaks, then decomposition, then tests, then validation)

**Comparison to prior eval:** Prior plan had no slices. This revision has the full sequence.

---

### Blocker 3: Slow-type risk listing — ✓ RESOLVED (PASS)

**Finding:** plan.md §156–164 has explicit slow-type risk table:

| Symbol | File | Slow-type reason | Blocks JSR publishing? |
|--------|------|------------------|------------------------|
| InferDefinePageLayerLoaderProps | builders/define-page/types.ts | Conditional infer over function return | Only while ResolveDefinePageLayerLoaderOutput is private; after slice 2, publishable but may be flagged slow |
| FieldDescriptorMap | form/types.ts | Recursive mapped type | Yes if exported without slow-type opt-in |
| RuntimeFormState | form/types.ts | Uses recursive FieldDescriptorMap | Same as above |
| DefinePageLayerConfigFor | builders/define-page/types.ts | Multiple generic + conditional type state | Not a private-type-ref; slow-type only if inference explodes |
| DefinePageLayerLoaderFor | builders/define-page/types.ts | Complex generic over type state and loader output | Same as above |

**Verification:**
- Table names 5 symbols with file location and slow-type reason
- "Blocks JSR publishing?" column distinguishes hard blockers (private-type-refs) from slow-type warnings
- Verdict text (plan.md §166–169) states: "only hard JSR blockers are the private-type-refs"
- Retiring slices named (slice 1, slice 2)

**Drift cross-check:**
- D-5d2-3 (drift.md §66–81) documents slow-type opt-in decision deferred to slice 26
- Consistent with plan table

---

### Blocker 4: design.md completeness — ✓ RESOLVED (PASS)

**Finding:** All 7 required sections present and populated (design.md §1–236).

**Section-by-section:**

1. **Decomposition target (§1–93)** — PASS
   - Current topology (design.md §21–35): 6 files with byte sizes
   - Proposed topology (design.md §39–70): 4 folders (builder/, runtime/, navigation/, types/) with 15 files
   - Public-surface contract (design.md §72–79): "same export specifiers, same public type names"
   - File-cap targets (design.md §81–93): table mapping current size → target size per file

2. **DSL market bar (§94–142)** — PASS
   - TanStack Start comparison (§97–108): route/loader APIs, typed search params, pending UI
   - Next.js comparison (§110–119): server components, layouts, streaming, error boundaries
   - Remix comparison (§121–131): loader/action pattern, form actions, typed navigation
   - Gap synthesis (§133–142): table of 7 DX gaps with verdicts (in-scope polish vs RFC-deferred)

3. **Island/partial bridge (§143–175)** — PASS
   - Serialization seam (§146–158): builder context → route context → HTML → island props
   - 5d6 query/island hook-in (§160–168): "runtime/context.ts accepts optional queryClient"
   - Partial route support (§170–175): f-partial response headers, Link component, usePartial hook

4. **RFC 14 protection seams (§176–193)** — PASS
   - Table (§181–189): 6 Fresh-specific builder options mapped to adapter abstractions
   - Verdict (§191–193): "isolation points documented; no RFC 14 implementation in 5d2"

5. **Browser validation strategy (§194–210)** — PASS
   - 6 fixture routes named (§201–209): static, routed, search, layer, form, partial
   - Each route proves specific behavior (SSR, path params, search params, pending, form submission, partial navigation)
   - apps/playground location explicit

6. **Test decomposition (§211–224)** — PASS
   - 4 test files named: builder.test.tsx, runtime.test.tsx, navigation.test.tsx, search-params.test.tsx
   - Each maps to source seam (builder/, runtime/, navigation/, search-params.ts)
   - define-page.test.tsx deleted after migration

7. **Risk and trade-offs (§225–236)** — PASS
   - 7 risks with mitigations
   - Addresses: private-type-refs, public surface drift, form-package leak, barrel move propagation, test split coordination, fixture browser tests, merge conflicts

**Research.md TODOs:** §4 (streaming call-sites), §5 (island hydration), §6 (DSL market bar) marked TODO but design.md §2–3 completes the analysis. Acceptable: research captures initial findings, design operationalizes them.

---

## Standard Plan-Gate Items

### Research present and current — ✓ PASS

- research.md exists
- §2.1 byte-size baseline (6 over-cap files named with byte counts)
- §2.2 doc-lint baseline (40 errors: 21 private-type-refs + 19 missing-jsdoc)
- §2.3 type-check baseline (`deno check` exits 0)
- Carried-in work re-baselined (§26–40: "carried in from Phase 1")
- §4, §5, §6 TODOs completed in design.md §2–3

### Decisions locked — ✓ PASS

- L-1 through L-8 stated with rationale (plan.md §94–103)
- L-6: One plan, not two (rationale: measurements fit in 27 slices under 30 cap)
- L-7: Form-package leak fix in 5d2 (rationale: unblocks 19 private-type-refs + 18 missing-jsdoc)
- L-8: No new subpath exports (rationale: umbrella plan forbids new subpaths in wave 5)
- Open-decision sweep table separates "safe to defer" from resolved decisions

### Open-decision sweep — ✓ PASS

- Table at plan.md §105–114
- 2 decisions marked RESOLVED (one plan vs two, form-package leak ownership)
- 3 decisions marked "safe to defer" (types.ts sub-split, fixture route names, slow-type opt-in)
- No deferred decisions would force rework if left open

### Commit slices — ✓ PASS

(See Blocker 2 above)

- 27 slices enumerated
- Under 30 cap
- Each names: purpose, files, gates, budget
- Ordered logically

### Risk register — ✓ PASS

- plan.md §115–127 has 7 risks with mitigations
- Risks are specific (not generic "tests might fail")
- Mitigations are actionable (surface snapshot test, drift entries, coordination with 5d6)

### Gate set selected — ✓ PASS (with advisory findings)

- plan.md §171–210 has full fitness gate table (F-1 through F-18)
- Static gates mapped (deno check, publish dry-run)
- Runtime/SCOPE-frontend mapped (slice 24 fixtures, slice 25 test suite)
- Consumer import validation marked "optional" in matrix for A3 — correctly omitted

**Gate coverage detail:**
- F-1 through F-18 all present with verification commands
- F-4, F-17 skipped with rationale (no new classes / no abstract classes)
- F-13 skipped with rationale (no sagas in builders) — see finding below

**Gate-slice mapping inconsistency (advisory):** The gate table says F-18 retiring in "Slices 7, 11, 15, 18" but the commit lock actually creates the sub-barrels at slices 6 (builder/mod.ts), 10 (runtime/mod.ts), 14 (navigation/mod.ts), and 17 (define-page/mod.ts). The slice numbers in the gate table are off by one for F-18. Similarly, F-8 and F-9 reference "Slice 19" (test split) rather than Slice 18 (deno.json verification). F-5 references "Slices 1, 16, 17, 18, 27" but the surface snapshot test is in Slice 1 and the barrel updates in 15, 17 — Slice 16 is types.ts trim, which is adjacent. Not a blocker, but should be reconciled before implementation to avoid gate confusion.

**F-13 Saga/runtime invariants:** Required for A3 per archetype-gate-matrix. Plan marks N/A with rationale (no sagas). Acceptable under Phase A reporting as PENDING_SCRIPT with manual evidence (no saga code exists; no violation detected).

### Deferred scope explicit — ✓ PASS

- plan.md §75–82 lists deferred scope:
  - Streaming primitives (5d4)
  - Query/island-bridge (5d6)
  - Form-field/validation behavior (5d5)
  - RFC 14 unified-mode implementation
  - New DSL features (definePage signature unchanged)
  - New subpath exports (umbrella plan forbids)
- Each deferred item names owning unit

### jsr-audit (package/plugin waves) — ✓ PASS

- plan.md §141–164 has jsr-audit publishability rubric
- Baseline: 40 doc-lint errors (21 ptr + 19 missing)
- Breakdown by source: form/types.ts (19 ptr + 18 missing), builders/define-page/types.ts (2 ptr + 1 missing)
- Slow-type risk table (see Blocker 3)
- Retiring slices named for each risk

---

## Plan Tail Sections

### Review map — ✓ PASS

- plan.md §644–654 present
- Self-verification checklist: AGENTS.md, doctrine, gate matrix, umbrella plan, measurement artifacts, drift cross-check

### Assumptions — ✓ PASS

- plan.md §656–663 present
- 4 assumptions:
  - 5d1 merge before implementation
  - deno task arch:check exists
  - Manual browser validation acceptable if Playwright unavailable
  - Umbrella target = zero doc-lint errors over combined exports

### Questions for supervisor — ✓ PASS

- plan.md §665–672 present
- 3 questions:
  - Form-package leak ownership (5d2 vs 5d5)
  - Error-boundary fixture scope (accept 5d1 dependency or stub?)
  - Slow-type opt-in timing (slice 26 vs later?)

### Dependencies & merge impact — ✓ PASS

- plan.md §605–622 present
- Dependencies: 5d1 (binding), streaming primitives, DeferPage, form/types.ts leak, route/contract.ts
- Merge impact: no new subpath exports, internal import churn, 5d4/5d6 not blocked

### Side-effect ledger — ✓ PASS

- plan.md §631–640 present
- Lists: drift.md (appended), context-pack.md (updated), worklog.md (updated), arch-debt.md (F-18 entries), deno.json (read-only), deno.lock (no changes)

---

## Umbrella Divergence Check

**Finding:** No divergences detected.

**Verification:**
- Plan aligns with umbrella §48–52 target topology (4 folders: builder/, runtime/, navigation/, types/)
- Plan aligns with umbrella §34 public surface targets (same export specifiers, same public type names)
- Plan aligns with umbrella §82–86 quality bar (zero doc-lint errors, all files <20K)
- Umbrella §93 allows 5d2 to split into two plans if justified; 5d2 chose one plan (permitted)
- Plan.md §622 acknowledges RFC 14 seams documented in design.md §176–193 (consistent)

---

## Drift Cross-Check

**Finding:** All drift entries referenced in plan.

- D-5d2-1 (form-package leak fix): referenced in plan.md L-7, slice 2
- D-5d2-2 (F-18 sub-barrel lint exceptions): referenced in plan.md slice 22
- D-5d2-3 (slow-type opt-in): referenced in plan.md slice 26, open-decision sweep table

No phantom drift entries (no drift references in plan that lack a D-* entry).

---

## Minor Findings (Non-Blocking)

1. **Slice count discrepancy:** L-6 claims "28-slice rationale" but plan lists 27 slices (Slice 1–27). Off-by-one counting error, not material to plan viability.

2. **Research.md TODOs:** §4 (streaming call-sites), §5 (island hydration), §6 (DSL market bar) marked TODO but design.md §2–3 completes the analysis. Acceptable: research captures initial findings, design operationalizes them.

3. **Consumer import validation:** Marked "optional" in matrix for A3 (archetype-gate-matrix.md row 29). Plan correctly omits dedicated gate. Not a blocker.

4. **Slice 27 (drift/context-pack/worklog):** Meta-slice for run artifacts. Legitimate (ensures artifacts are updated before implementation phase).

---

## Verdict

**PASS**

All 4 prior blockers resolved:
1. ✓ One-plan vs two decision made (L-6, measurement-grounded)
2. ✓ Actionable implementation sequence (27 slices, each with files/gates/budget)
3. ✓ Slow-type risk listing (table at plan.md §156–164)
4. ✓ design.md complete (all 7 sections present)

All standard plan-gate items satisfied:
- ✓ Research present and current
- ✓ Decisions locked
- ✓ Open-decision sweep
- ✓ Commit slices
- ✓ Risk register
- ✓ Gate set selected
- ✓ Deferred scope explicit
- ✓ jsr-audit (package/plugin waves)
- ✓ Review map, assumptions, questions, dependencies, side-effect ledger

No umbrella divergences. No phantom drift entries.

**Plan cleared for implementation.**
