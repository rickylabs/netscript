# PLAN-EVAL — chore-prod-readiness--cleanup (cycle 2)

- Plan evaluator session: openhands run 27755852001-1 (2026-06-18, branch `chore/prod-readiness` off `release/jsr-readiness`, re-baselined @ `main` @ `cc3b8731`)
- Run: `chore-prod-readiness--cleanup`
- Cycle: **2 of 2** (post-`FAIL_PLAN` cycle 1; this is the final cycle before escalation per `plan-protocol.md` §"Loop limit")
- Surface / archetype: CLI / chore-cleanup
- Scope overlays: L-no-backcompat (alpha = delete/rename, no alias/shim)
- Off-limits guardrail: `packages/aspire/src/public/mod.ts`, `packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts`, version pins, catalog/`catalog:` references
- Public-surface smoke gate: `e2e:cli run scaffold.runtime`

## Cycle-1 remediation — spot-check (the 7 required fixes)

Each fix from cycle 1 is re-walked against the tree on `chore/prod-readiness` @ `cc3b8731`. "Verified" = the cycle-1 claim now has observable evidence in the plan **and** in the tree (not just asserted in the plan).

| # | Cycle-1 fix | Tree evidence | Plan evidence | Verdict |
|---|-------------|---------------|---------------|---------|
| 1 | **F3 — record the resolution** (functional + arch-debt) | `packages/cli/src/kernel/adapters/windows/servy/servy-environment.ts:138-139` (writer, "legacy alias" comment); `env-file-values.ts:130`; `env-file-content.ts:98` (writers). **Readers** at `packages/service/src/diagnostics/database-connectivity.ts:48,71,94` (read `ConnectionStrings__mysqldb`/`postgresdb`/`mssqldb`). | `research.md` F3 row → "OFF-LIMITS — FUNCTIONAL (confirmed)"; `research.md` Open-Questions → "F3 ... RESOLVED (functional, off-limits)" with readers; `plan.md` PR-5 → "F3 ... VERIFIED functional"; `plan.md` Open-Decision Sweep → "RESOLVED"; `arch-debt.md` → full entry with Owner / Reason / Target / Linked plan / Created / Status / Gate. | **VERIFIED** |
| 2 | **S4 deprecate-first (PR-7) → G1-3 split** | `packages/database/extensions/sql-json.extension.ts:547` `LEGACY COMPATIBILITY` header; L554 `@deprecated Use sqlJsonExtension instead` on `mssqlJsonExtension` (L556); `mysqlJsonExtension` at L571 with **no** `@deprecated` marker — confirming the asymmetric deprecation state PR-7 hinges on. | `plan.md` PR-7 row → "un-marked public alias (S4′ mysqlJsonExtension) is deprecated this run, removal deferred"; `plan.md` G1-3b row → "S4′ — ADD @deprecated to mysqlJsonExtension (:571); DEFER its removal (PR-7)"; `plan.md` Open-Decision Sweep → "RESOLVED"; `worklog.md` Design → same. | **VERIFIED** |
| 3 | **S5 name the internal rewrite (G1-3c refactor, not delete)** | `packages/database/adapters/mssql.adapter.ts:65-66` → `/** @deprecated Use authentication.type = 'ntlm' instead */ trustedConnection?: boolean;`. **Live internal writer** at L414-415: `if (integratedSecurity || (!username && !password)) { config.options!.trustedConnection = true; }` (plan says 415-416, actual writer body starts at 414-415; substantive content matches). | `plan.md` G1-3c row → "S5 — **refactor** trustedConnection: migrate internal writer (`mssql.adapter.ts:415–416`) to `authentication.type='ntlm'`, then remove the public option (`:66`). Not a delete (PR-7)"; Gate focus includes "mssql adapter behavioural test"; `plan.md` Risk Register → "PR-7: G1-3c migrates the internal writer ... before dropping the option; adapter behavioural test"; `worklog.md` Design → same. | **VERIFIED** |
| 4 | **S6 — scaffolder consumer in G1-5** | `plugins/workers/src/scaffolding/job-scaffolders.ts:64-65` → emits `` `  .schedule(${JSON.stringify(input.schedule)})` `` into generated worker code (confirmed). `packages/plugin-workers-core/streams/schema.ts:106` (`schedule?: unknown` @deprecated); `builders/job-builder.ts:48, 130` (`.schedule()` @deprecated, JSDoc at L131-134); `public/root.ts:179` (deprecated `schedule` method). **No existing scaffolder test files** in the tree — the "scaffolder test fixture" named in the plan is a **new** file the implementer must add. | `plan.md` G1-5 row → "S6 — `plugin-workers-core` public deprecated recurring-job API **+ its generated-output consumer** `plugins/workers/src/scaffolding/job-scaffolders.ts:64–65` and the scaffolder's test fixture (migrate to scheduled-trigger API)"; `plan.md` Per-slice file list → G1-5 includes the scaffolder + fixture; Gate focus → "scaffold-template scan + scaffolder+fixture update + full `e2e:cli scaffold.runtime`"; `plan.md` Risk Register → "Scaffolder emits a removed API (S6 `.schedule`) → `scaffold.runtime` typecheck break | G1-5 updates `job-scaffolders.ts:64–65` + fixture in the same slice"; `worklog.md` Design → same. | **VERIFIED** (with a minor implementation note: the scaffolder test fixture does not pre-exist; the implementer must create it as part of G1-5. The plan correctly names the file as part of the touch list.) |
| 5 | **`scaffold.runtime` smoke on every public slice (G1-3a/b/c, G1-4, G1-5)** | n/a (gate is post-implementation) | `plan.md` Slice table — G1-3a → "**`e2e:cli scaffold.runtime` smoke**"; G1-3b → "**`scaffold.runtime` smoke**"; G1-3c → "**`scaffold.runtime` smoke**"; G1-4 → "**`e2e:cli scaffold.runtime` smoke**"; G1-5 → "**full `e2e:cli scaffold.runtime`**". `plan.md` Fitness Gates → "`scaffold.runtime` smoke (per public slice) | yes (G1-3a/b/c, G1-4, G1-5)". `plan.md` prose → "Every public-surface slice (G1-3a/b/c, G1-4, G1-5) carries a `scaffold.runtime` smoke because the scaffold templates are a consumer surface". | **VERIFIED** |
| 6 | **Per-slice file list + LOC budget; single-concern; sub-split flag for G1-5** | n/a (file lists are pre-implementation) | `plan.md` §"Per-slice file list + LOC budget (PLAN-EVAL fix, cycle 1)" — table with file lists and LOC estimates for G1-0 through G1-6. G1-0 (4 files, +90/-95), G1-1 (deletions only, scan-first), G1-2 (3 files, -25), G1-3a (1 file, -5), G1-3b (1 file, -15), G1-3c (1 file + test, +8/-3), G1-4 (1 file, -12), G1-5 (4 files, ~30-50, **explicitly flagged for sub-split**), G1-6 (bounded deletions). G1-1 keeps scan-first protocol; cycle-1 fix said "enumerate OR split into per-file commits" — the plan keeps the enumeration-deferred approach with grep-first gate, acceptable. | **VERIFIED** |
| 7 | **G1-6 bounded** | n/a (scope is pre-implementation) | `plan.md` PR-6 row → "G1-6 is bounded: it sweeps only surfaces already touched by G1-0..G1-5 plus `.llm/tools/`; any newly-discovered dead surface beyond that list is *recorded and deferred*, not removed this run". `plan.md` G1-6 row → "**Bounded** dead-code sweep (PR-6 proof) over surfaces already touched by G1-0..G1-5 plus `.llm/tools/`. New dead surfaces beyond that list are *recorded + deferred*, not removed". `plan.md` Per-slice file list → "G1-6 | only files within G1-0..G1-5 surfaces + `.llm/tools/` proven dead". `worklog.md` Design → same. | **VERIFIED** |

### Cycle-1 verification of off-limits guardrail (re-confirmed)

`packages/aspire/src/public/mod.ts`, `packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts`, version pins, and catalog/`catalog:` references appear **only** in the plan's `## Non-Scope` exclusion rows (L49-50). They are **not** present in any slice's touch list. **PASS.**

## Plan-Gate checklist walk

Each box from `gates/plan-gate.md` is re-walked against the cycle-2 plan.

| Plan-Gate item | Result | Evidence / location |
|----------------|--------|---------------------|
| Research present and current | **PASS** | `research.md` re-baselined at `main` @ `cc3b8731`; F1–F3 + S1–S8 inventory; F3 now RESOLVED with readers and writers documented. Spot-checked against tree: writer/reader line numbers match. |
| Decisions locked | **PASS** | PR-1..PR-7 (cycle 2 added PR-7 deprecate-before-remove as a 7th decision). PR-5 fences F1–F3 off-limits with F3 evidence. PR-7 governs S4′ and S5. |
| Open-decision sweep | **PASS** | `plan.md` §"Open-Decision Sweep" — every previously-open decision moved to RESOLVED. F3 functional/off-limits (with arch-debt); S4′ deprecate-then-defer; S5 refactor. No new open decisions. |
| Commit slices (< 30, gate + files each) | **PASS** | G1-0..G1-6 enumerated, risk-ordered, each with scope / risk / gate focus. G1-3 split into G1-3a/b/c; G1-5 flagged for sub-split if >30 LOC. Per-slice file list + LOC budget present. |
| Risk register | **PASS** | 8 risks with mitigations: shim-breaks-consumer, doc-link-references, root-doc-stray, `publish:dry-run` regression, functional-workaround, S4′ silent-delete, S5 internal-writer, S6 scaffolder-emit. Each mitigation ties to a PR-# or a specific slice. |
| Gate set selected | **PASS** | `publish:dry-run`, scoped `check`, `test`, `lint/fmt`, `validate-claude-surface` (G1-0), `arch:check`, `scaffold.runtime` smoke (G1-3a/b/c, G1-4, G1-5), full `e2e:cli scaffold.runtime` (G1-5 + eval pass). All required for chore-cleanup. |
| Deferred scope explicit | **PASS** | `## Non-Scope` (doc content, dep hygiene, version pins, catalog, F1–F3 functional, new abstractions). `## Hidden Scope` (scaffold templates as consumer surface, "dead" requires proof, `.llm/tmp/` mix). `PR-6` bounds G1-6. `PR-7` defers S4′ removal. Drift Watch section names escalation paths. |
| jsr-audit surface scan (pkg/plugin) | **PASS** | `plan.md` Slice Plan + Risk Register identify public-surface slices (G1-3a/b/c @netscript/database, G1-4 @netscript/fresh, G1-5 @netscript/plugin-workers-core). Slow-type and surface risks named. `deno doc --lint` + `publish:dry-run` + `scaffold.runtime` smoke are the gates; cycle-1 §"S6 consumer undercount" is closed by Fix #4 above. |

**All 8 boxes checked.**

## Open-decision sweep (evaluator-run)

| Decision | Status in plan | Verdict |
|----------|----------------|---------|
| F3 classification | RESOLVED (functional, off-limits) with arch-debt | **CLOSED** |
| S4′ `mysqlJsonExtension` removal | RESOLVED (deprecate-only this run, removal deferred to post-alpha cycle) | **CLOSED** |
| S5 `trustedConnection` shape | RESOLVED (behavioural refactor in G1-3c, not delete) | **CLOSED** |
| G1-1 file enumeration | scan-first protocol with grep-references-first gate | **ACCEPTABLE** (cycle-1 fix said "enumerate OR split into per-file commits" — the plan keeps enumeration-deferred; the grep-first gate prevents blind deletes) |
| Scaffolder test fixture for G1-5 | plan names it as part of the G1-5 touch list; fixture does not pre-exist in the tree | **ACCEPTABLE** (the plan correctly names a new file the implementer must create; the alternative would be to defer G1-5, which is worse) |
| `mysqljsonextension-deprecated-removal-deferred` arch-debt entry | named in `plan.md` §"Arch-Debt Implications" with action "add" | **ACCEPTABLE** (the plan correctly marks it as add-when-G1-3b-runs rather than pre-existing; the implementer adds the entry alongside the deprecation marker) |

**No decision the plan leaves open would force rework if deferred.**

## Subtle observations (informational, not gate-blocking)

1. **Scaffolder test fixture is new.** The plan's G1-5 touch list includes a scaffolder test fixture that does not pre-exist in the tree. The implementer must create it as part of G1-5. This is the correct plan decision (alternative: defer G1-5, but that strands S6 recurring-job API as a no-progress). Not a plan defect.
2. **`mysqljsonextension-deprecated-removal-deferred` arch-debt entry is not pre-existing.** The plan's Arch-Debt Implications table correctly marks it "add". The implementer adds the entry alongside the `@deprecated` marker in G1-3b. Acceptable.
3. **`mssql.adapter.ts` writer line numbers.** Plan says `:415-416`; actual writer body is at L414-415 (`if (integratedSecurity || (!username && !password)) { config.options!.trustedConnection = true; }`). One-line offset. Substantive content matches. The cycle-1 fix said the plan must name the specific lines — the plan does. Not a defect.
4. **`mod.ts` line number.** Plan says `:254` for `buildConnectionString`; actual location is L252-256 (the JSDoc `@deprecated` starts at L252, the function declaration is L256). The cycle-1 fix said "name the symbol" — the plan does. Minor offset, not a defect.

## Cycle-2 verdict

**`PASS`**

### Rationale (one paragraph)

All 7 cycle-1 required fixes are resolved — each is visible in the plan (`plan.md`), the design section of `worklog.md`, and the tree at `cc3b8731`. F3 is recorded as functional with an arch-debt entry that names readers, writers, owner, reason, and target. S4′ is governed by the new PR-7 deprecate-before-remove rule and split into G1-3b (deprecate-only this run, removal deferred). S5 is correctly classified as a G1-3c behavioural refactor with the internal writer at `mssql.adapter.ts:415-416` named, plus an adapter behavioural test gate. S6's scaffolder consumer at `job-scaffolders.ts:64-65` is now in G1-5's touch list with the scaffolder test fixture. Every public-surface slice (G1-3a/b/c, G1-4, G1-5) carries a `scaffold.runtime` smoke. Per-slice file lists + LOC budgets are present, and G1-5 is explicitly flagged for sub-split if its migration exceeds ~30 LOC. G1-6 is bounded to G1-0..G1-5 surfaces + `.llm/tools/`, with newly-discovered dead surfaces recorded + deferred, not removed. The off-limits guardrail holds: `packages/aspire/src/public/mod.ts`, `scaffold-versions.ts`, version pins, and `catalog:` references appear only in the plan's Non-Scope exclusion rows, never in a touch list. All 8 `plan-gate.md` checklist boxes are satisfied; no open decision would force rework if deferred. Implementation may begin.

### Subtle plan-level note for the implementer (not gate-blocking)

- The `mysqljsonextension-deprecated-removal-deferred` arch-debt entry must be **added** by the implementer in G1-3b (alongside the `@deprecated` marker on `mysqlJsonExtension` at `sql-json.extension.ts:571`), not pre-existing. The plan correctly identifies this as an "add" row.
- The scaffolder test fixture for G1-5 is a new file the implementer must create; the plan correctly lists it as part of the touch list but it has no predecessor in the tree.
- Line numbers in the plan are off by 1 in two places (`mssql.adapter.ts:415-416` actual 414-415; `mod.ts:254` actual 252-256). Substantive content matches; implementer should grep for the symbol, not the line number.

No implementation slice may begin before this verdict. This is the cycle-2 verdict — per `plan-protocol.md` §"Loop limit", two `FAIL_PLAN` cycles are allowed and the second escalates to the user. This run passes on the second cycle, so implementation proceeds.
