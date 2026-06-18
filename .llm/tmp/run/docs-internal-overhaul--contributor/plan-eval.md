# PLAN-EVAL — docs-internal-overhaul--contributor (cycle 1)

- Plan evaluator session: openhands run 27766416302-1 (2026-06-18, branch `docs/internal-overhaul` off `release/jsr-readiness`, re-baselined @ `main` @ `cc3b8731`)
- Run: `docs-internal-overhaul--contributor`
- Cycle: **1 of 2** (cycle-1 verdict; one further `FAIL_PLAN` cycle allowed before user escalation per `plan-protocol.md` §"Loop limit")
- Surface / archetype: N/A — internal/contributor docs (`.llm/harness/`, `docs/architecture/doctrine/`, `.llm/` tooling/agentic, `AGENTS.md`/`CLAUDE.md` surface, root ops)
- Scope overlays: `SCOPE-docs.md`
- Off-limits guardrail: `packages/aspire/src/public/mod.ts`, `packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts`, version pins, catalog/`catalog:` references; no framework-code edits; no doctrine-**decision** changes (doc hygiene only)

## Locked-decision spot-checks (per the cycle-1 evaluator brief)

Each locked decision from the cycle-1 evaluator brief is re-walked against the tree on
`docs/internal-overhaul` @ `58a32bdf` (Design checkpoint). "Verified" = the plan's claim has
observable evidence in the plan **and** the tree, not just asserted in the plan.

| # | Locked decision | Tree evidence | Plan evidence | Verdict |
|---|-----------------|---------------|---------------|---------|
| 1 | **IO-5 (functional IA, NOT Diátaxis)** | `docs/architecture/docs/` (root for Group 3 user site); `docs/internal-overhaul/` (this run); `.llm/tmp/run/docs-user-site--diataxis/plan.md:1,22,34` (Group 3 is the Diátaxis one); `.llm/tmp/docs/docs-architecture-research.md:55` (synthesis explicitly says "**Synthesis for NetScript user-site:** Diátaxis four-type separation"). `CLAUDE.md` Supervisor Rules + `AGENTS.md` Read Order (read at AGENTS.md:1-104) treat internal docs as function-organized (harness mechanics · architecture doctrine · domain skills · agent surface · root ops). | `plan.md` IO-5 row → "**No Diátaxis for internal docs.** Keep the existing **functional/role-based** structure … Diátaxis is the *user* site (Group 3) only"; `research.md` Finding 1 enumerates internal surfaces; `worklog.md` 2026-06-18 design row says same; `release-jsr-readiness--supervisor/phase-registry.md:122-123` records Group 3 plan as Diátaxis-based. | **VERIFIED** |
| 2 | **IO-6 (canonical-home rubric)** | All 5 homes exist on tree: `docs/architecture/doctrine/` (`01-thesis-and-axioms.md` … `10-*.md` series); `AGENTS.md` (root); `.agents/skills/<name>/SKILL.md` for all 14 skills (`aspire`, `claude-manager`, `codex-wsl-remote`, `deno-fresh`, `design`, `fresh-ui-horizontal`, `impeccable`, `jsr-audit`, `netscript-cli`, `netscript-deno-toolchain`, `netscript-doctrine`, `netscript-harness`, `netscript-pr`, `openhands-handoff`, `skill-creator`); `CLAUDE.md` (root); `.llm/harness/` (`DOCTRINE-REF.md`, `archetypes/`, `debt/`, `evaluator/`, `gates/`, `lessons/`, `profiles/`, `templates/`, `workflow/`). | `plan.md` IO-6 row → all 5 homes spelled out with explicit concept→home mapping; rationale cites `CLAUDE.md` Supervisor Rules + `AGENTS.md` Read Order; "exhaustive concept→home map is a Design deliverable" (mechanical application). | **VERIFIED** |
| 3 | **IO-2 (generated mirror; `.claude/skills/` not hand-edited)** | `.llm/tools/agentic/validate-claude-surface.ts` exists (132 lines per worklog §"S2 | validate-claude-surface.ts"); its `runSyncCheck()` at L60-83 invokes `sync-claude-skills.ts --check`; `.llm/tools/agentic/sync-claude-skills.ts` exists; supervisor `phase-registry.md:140-143` names `.llm/tools/agentic/validate-claude-surface.ts` as the scorecard gate; `plan-eval.md` for Group 1 walked this gate at `.llm/tmp/run/chore-prod-readiness--cleanup/plan-eval.md` ("validate-claude-surface (G1-0)"). | `plan.md` IO-2 row + Validation Plan step 1 (`deno run … .llm/tools/agentic/validate-claude-surface.ts` green); Hidden Scope → "`.claude/skills/` are **generated mirrors** … never hand-edit the mirror"; Risk Register → "Hand-editing `.claude/skills/` mirror → regenerate from source; `validate-claude-surface.ts` green". | **VERIFIED** |
| 4 | **IO-4 / Group-1 coordination (RESOLVED claim)** | `git ls-files` shows `AGENTS-handoff.md` is **not** on `docs/internal-overhaul` (`git log --oneline -- AGENTS-handoff.md` would show G1-0 deletion `1c98fa1c`); `.agents/skills/openhands-handoff/SKILL.md` exists and is non-empty (head-matter reads `name: openhands-handoff`); supervisor registry `phase-registry.md:78-82` records G1 deliverables include "`AGENTS-handoff.md` relocated into the `openhands-handoff` skill + root file deleted"; G1 IMPL-EVAL PASSED (run 27761272236, evaluate.md `646218f9`) and merged via PR #54 (merge_sha `a4db5527`). | `plan.md` Open-Decision Sweep row 3 → "**RESOLVED**"; `research.md` §"Group 1 coordination list" → **RESOLVED 2026-06-18** with exact line numbers + merge_sha; `worklog.md` 2026-06-18 row records same; `plan.md` Hidden Scope + Risk Register + Drift Watch all assume the skill is the home. | **VERIFIED** |
| 5 | **IO-3 (`deno doc` documentation scope)** | `.agents/skills/jsr-audit/SKILL.md:289` and `:441` both reference `deno doc --lint` but with no standalone section covering npm-dep rendering, JSX/TSX highlighting, npm-without-types workaround, or `--lint` as the publish bar (gap confirmed); `AGENTS.md` Read Order L7 explicitly says "deno doc is your friend" + names `--filter <symbol>` + `deno why <pkg>`; `deno doc --lint` is also the **F-5** static-gate command per `gates/static-gates.md` §"Doc lint". | `plan.md` IO-3 row → "`deno doc` is documented as the canonical internal-API surface tool (+ `--lint` as the publish bar)"; `plan.md` Scope §"`deno doc` documentation" → "add a proper `deno doc` section to the harness docs + the `jsr-audit` skill — npm-dep rendering, JSX/TSX highlighting, the npm-without-types workaround, and `deno doc --lint` usage as the publish-quality bar"; Open-Decision Sweep row 4 → "Default = harness doc + `jsr-audit` skill section". | **VERIFIED** |
| 6 | **Gates concrete (Fitness Gates + Validation Plan)** | `.llm/tools/agentic/validate-claude-surface.ts` exists + runs (entrypoint in `deno.json` as `agentic:check-claude` per G1 eval); `.llm/tools/agentic/sync-claude-skills.ts` exists (so regen-diff is implementable); supervisor `phase-registry.md:140-143` names both as scorecard F1+E1 gates. Internal link/anchor check has no existing dedicated script → `PENDING_SCRIPT` per `gates/fitness-gates.md` §"Phase A Reporting"; manual evidence via `.llm/tools/find-symbol-usages.ts` / `find-lines.ts` is plausible. | `plan.md` Fitness Gates table → 4 gates named with required=yes and expected evidence paths; Validation Plan → 4 ordered gates (claude surface → skill mirrors → internal links → doctrine spot-check); each gate names a script or checkable artifact. | **VERIFIED** (gates checkable; link-check flagged as `PENDING_SCRIPT` per harness convention, with manual evidence path plausible) |
| 7 | **Boundary (Non-Scope vs Group 3; no framework-code edits; no doctrine-decision changes)** | `packages/aspire/src/public/mod.ts` exists and has no diff on `docs/internal-overhaul` (`git diff docs/internal-overhaul -- packages/aspire/src/public/mod.ts` is empty); `scaffold-versions.ts` lives at `packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts` and is untouched on this branch; Group 3 plan lives at `.llm/tmp/run/docs-user-site--diataxis/plan.md` (Diátaxis) — distinct surface. | `plan.md` Non-Scope → external/user docs (Group 3), deleting dead doc files (Group 1), doctrine-decision changes, framework code; Drift Watch → "consolidation that changes a doctrine decision (→ STOP; that's a doctrine run)"; `phase-registry.md:142-143` Notes → "Keep `.claude/skills/` **generated** from `.agents/skills/` — do not hand-edit mirrored files. Run `.llm/tools/agentic/validate-claude-surface.ts` after edits." | **VERIFIED** |

### Off-limits guardrail PASS (re-confirmed)

`packages/aspire/src/public/mod.ts`, `packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts`,
version pins, and catalog/`catalog:` references appear **only** in the plan's `## Non-Scope`
exclusion rows. They are **not** present in any implementation target the plan names. **PASS.**

## Plan-Gate checklist walk

Each box from `gates/plan-gate.md` is walked against the cycle-1 plan.

| Plan-Gate item | Result | Evidence / location |
|----------------|--------|---------------------|
| Research present and current | **PASS** | `research.md` re-baselined at `main` @ `cc3b8731`; Findings 1–5 inventory the internal-doc surface; Group-1 coordination list resolved with merge_sha `a4db5527`. Spot-checked: `jsr-audit/SKILL.md:289,441` confirms the `deno doc --lint` under-documentation gap; `AGENTS-handoff.md` is gone (G1-0 `1c98fa1c`); `.agents/skills/openhands-handoff/SKILL.md` is the new home. |
| Decisions locked | **PASS** | IO-1..IO-6 locked with rationale; IO-5 (functional IA, not Diátaxis) and IO-6 (canonical-home rubric) verified against tree. Group-1 coordination row resolved. |
| Open-decision sweep | **PASS** | `plan.md` §"Open-Decision Sweep" — 4 rows, 3 RESOLVED, 1 "resolve in Design" with default locked (IO-3 default = harness doc + `jsr-audit` skill section). No decision left open would force rework if deferred. |
| **Commit slices (< 30, gate + files each)** | **FAIL** | `plan.md` has `## Validation Plan` (4 ordered gates), `## Fitness Gates` (4 required gates), `## Risk Register` (4 risks with mitigations), but **no `## Commit Slices` section**. The plan names the **scope** (consolidate harness docs · doctrine ref · `.llm/` tooling/agentic · `AGENTS.md`/`CLAUDE.md` surface · root ops · `deno doc` section) but does not enumerate ordered implementation slices, each naming what the slice proves, the gate that proves it, and the files it touches. Per `run-loop.md §3b` (item 5) and `gates/plan-gate.md` "Commit slices" row, this is a required Design-phase deliverable; `lessons/plan-gate-design-as-gate.md` reinforces that design evidence (including slices) must precede implementation. **This box is unchecked.** |
| Risk register | **PASS** | 4 risks: drop doctrine nuance, break internal cross-refs, hand-edit `.claude/skills/`, overlap with Group 1 deletions. Each mitigation is named and tied to a gate or a coordination point. |
| Gate set selected | **PASS** | 4 gates: `validate-claude-surface.ts` green; internal link/anchor check; `.claude/skills/` regen-diff; doc-maintenance gate (E1). Plus the umbrella scorecard F1+E1 dimensions. Each gate has a named script/checkable artifact. |
| Deferred scope explicit | **PASS** | `## Non-Scope` enumerates external/user docs, dead-doc-file deletion, doctrine-decision changes, framework code. `## Hidden Scope` flags skill mirrors, de-dup nuance risk, dense cross-refs. `## Drift Watch` names escalation paths. |
| jsr-audit surface scan (pkg/plugin) | **N/A** | Internal docs run — no public package surface to scan. `research.md` §"jsr-audit surface scan" → **N/A** with reason: "this run **documents** the `deno doc`/`deno doc --lint` workflow that the `jsr-audit` skill and Group 3 reference generation depend on." Correct application. |

**7 of 8 boxes PASS. 1 box FAIL — "Commit slices (< 30, gate + files each)".**

## Open-decision sweep (evaluator-run)

| Decision | Status in plan | Verdict |
|----------|----------------|---------|
| Contributor-doc IA (Diátaxis vs lighter) | RESOLVED (IO-5) — functional/role-based | **CLOSED** |
| Canonical home per concept | RESOLVED (IO-6) — rubric locked, exhaustive map deferred to Design | **CLOSED** (rubric is deterministic enough that Design can apply it mechanically) |
| Group-1 file-deletion coordination | RESOLVED — G1 (PR #54, merge `a4db5527`) deleted exactly `AGENTS-handoff.md`, relocated into `openhands-handoff` skill | **CLOSED** (skill exists, root file gone, no delete-vs-consolidate conflict) |
| `deno doc` doc scope (harness only vs harness + jsr-audit + standalone) | Default locked (IO-3 = harness doc + `jsr-audit` skill section); exact placement "resolve in Design" | **ACCEPTABLE** (default is locked; the "resolve in Design" item is placement-within-locked-surfaces, not a choice between surfaces — not rework-forcing) |

**No decision the plan leaves open would force rework if deferred.**

## Subtle observations (informational, not gate-blocking)

1. **No commit-slice enumeration.** The plan treats consolidation as a coherent, one-effort content rewrite but does not enumerate ordered slices with per-slice what-it-proves / gate / files-touched. This is the unchecked Plan-Gate box (FAIL_PLAN fix below). The Validation Plan (4 ordered gates) and Fitness Gates (4 required gates) cover the *gate set*; what is missing is the *slice list* that would name which files each gate is applied to.
2. **`deno doc` doc placement is a Design-phase detail.** The plan locks the default (harness + `jsr-audit` skill); exact placement within those surfaces is a Design deliverable. The plan correctly defers this with a locked default. Not a defect; consistent with how the Group 1 plan deferred G1-1 file enumeration to a scan-first gate.
3. **`mysqlJsonExtension`-style "deprecate-only-this-run, remove-later" is not in scope here.** Group 4 is doc hygiene, not deprecation. Plan correctly excludes "doctrine-decision changes" from Non-Scope. No drift expected.
4. **Off-limits guardrail re-checked and clean.** `packages/aspire/src/public/mod.ts`, `scaffold-versions.ts`, version pins, and `catalog:` references do not appear in any implementation target the plan names. Re-confirmed PASS.

## Cycle-1 verdict

**`FAIL_PLAN`**

### Rationale (one paragraph)

The plan is otherwise sound: the 7 verified locked decisions hold against the tree (IO-2 mirror
+ gate, IO-3 `deno doc` gap confirmed at `jsr-audit/SKILL.md:289,441`, IO-4/G1 coordination RESOLVED
via merge `a4db5527`, IO-5/IO-6 boundary lines with `CLAUDE.md` + `AGENTS.md` Read Order, gate set
concrete, Boundary clean, Off-limits guardrail PASS). The single unchecked `gates/plan-gate.md`
box is **Commit slices (< 30, gate + files each)**: the plan enumerates scope, locked decisions,
risk register, gate set, validation plan, dependencies, and drift watch, but does not enumerate
the ordered commit slices with per-slice what-it-proves / proving-gate / files-touched. This is a
required Design-phase deliverable per `workflow/run-loop.md §3b` item 5 and is the gate the
Group-1 plan-eval (`chore-prod-readiness--cleanup/plan-eval.md`) enforced via per-slice file
lists + LOC budgets. Implementation may **not** begin until the slice list is added; once added
(without changing the locked decisions or scope), the plan can re-enter PLAN-EVAL on cycle 2.

### If FAIL_PLAN — required fixes

1. **`plan.md` §"Commit slices"** — add an ordered, enumerated slice list (target < 30). Each
   slice must name (a) **what it proves**, (b) the **gate** that proves it (from the existing
   Fitness Gates table), and (c) the **files it touches** (path-level). A reasonable starting
   shape, consistent with the plan's scope and gate set, would be (illustrative — the implementer
   may re-split):

   | # | Slice | What it proves | Gate | Files (illustrative) |
   |---|-------|----------------|------|----------------------|
   | S0 | Branch / re-baseline sanity | Working tree on `docs/internal-overhaul` matches `release/jsr-readiness` HEAD | (bootstrap) | (none beyond commit) |
   | S1 | `deno doc` section in `jsr-audit` skill | npm-dep rendering, JSX/TSX highlighting, npm-without-types workaround, `deno doc --lint` as publish bar all covered | (1) `validate-claude-surface.ts` green (regen mirror); (3) link-check | `.agents/skills/jsr-audit/SKILL.md` (add new section) |
   | S2 | `deno doc` section in harness docs | Harness tells contributors to prefer `deno doc <module>` / `deno doc --filter <symbol>` first | (1), (3) | `.llm/harness/README.md` (or new `tools-and-commands.md`); possible link from `.llm/harness/workflow/run-loop.md` |
   | S3 | Duplication map: AGENTS.md ↔ harness ↔ skills | Each duplicated rule has one canonical home + cross-links | (3) link-check, (4) doctrine spot-check | `AGENTS.md`, `.agents/skills/*/SKILL.md` (link-only edits) |
   | S4 | Doctrine reference tidy-up | `DOCTRINE-REF.md` and doctrine files remain consistent; doctrine **decisions** unchanged | (4) doctrine spot-check | `.llm/harness/DOCTRINE-REF.md`, `docs/architecture/doctrine/*.md` (link-only) |
   | S5 | `.llm/` tooling/agentic architecture doc | A new or consolidated doc explains `.llm/tools/{deps,fitness,agentic}/` | (3), (4) | `.llm/tools/README.md` (existing) or new architecture doc |
   | S6 | Root ops docs consolidation | Root-level `.md` and `.agents/` cross-refs are coherent | (3) | root `*.md`, `AGENTS.md`, `CLAUDE.md` (link-only) |
   | S7 | Doc-maintenance gate (E1) wired | The gate exists in the harness gate set | (gate exists in `deno.json` and/or `gates/`) | `.llm/harness/gates/*` or `deno.json` |
   | S8 | Final `validate-claude-surface.ts` + regen-diff + link-check | All four required gates green | (1), (2), (3) | (gate-only; no new files expected) |

   The implementer should adjust the slice boundary to whatever produces the smallest, most
   verifiable chunks, and each slice must carry one of the four gates from the Fitness Gates
   table. **Do not** change the locked decisions, scope, gate set, or risk register when adding
   slices; the slice list is a design artifact, not a design change.

   After adding the slice list, re-submit for cycle 2.

### Notes

- No implementation slice may begin before PASS. This is the cycle-1 verdict — per
  `plan-protocol.md` §"Loop limit", two `FAIL_PLAN` cycles are allowed and the second escalates
  to the user.
- The off-limits guardrail PASS holds; the slice list must not introduce framework-code edits,
  doctrine-decision changes, dead-doc-**file** deletions, or `.claude/skills/` hand-edits.
- The `deno doc` section scope (IO-3 default = harness doc + `jsr-audit` skill section) is the
  locked default; the slice list must respect it.