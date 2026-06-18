# PLAN-EVAL — docs-internal-overhaul--contributor (cycle 2)

- Plan evaluator session: openhands run 27768669083-1 (2026-06-18, branch `docs/internal-overhaul` off `release/jsr-readiness`, branch tip `565e672b`)
- Run: `docs-internal-overhaul--contributor`
- Cycle: **2 of 2** (cycle-2 verdict; cycle-1 run `27766416302-1` emitted `FAIL_PLAN` on the single missing `## Commit Slices` box; per `plan-protocol.md` §"Loop limit", a second `FAIL_PLAN` would escalate to the user)
- Surface / archetype: N/A — internal/contributor docs (`.llm/harness/`, `docs/architecture/doctrine/`, `.llm/` tooling/agentic, `AGENTS.md`/`CLAUDE.md` surface, root ops)
- Scope overlays: `SCOPE-docs.md`
- Off-limits guardrail: `packages/aspire/src/public/mod.ts`, `packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts`, version pins, catalog/`catalog:` references; no framework-code edits; no doctrine-**decision** changes (doc hygiene only)

## Scope of this cycle-2 evaluation

Cycle 1 (`plan-eval.md` @ `519b227c`, run `27766416302-1`) PASSED **7 of 8** Plan-Gate boxes; the only
fail was **"Commit slices (< 30, gate + files each)"**. Per the cycle-2 brief, this cycle's job is
to judge narrowly whether the **single** remediation (added `## Commit Slices` section in `plan.md`
plus header/Dependencies note + two `worklog.md` rows) **fixes that one box without regressing the
other seven verified boxes**, and to re-confirm the off-limits guardrail.

The exact diff under review is commit `565e672b` ("docs(harness): internal-overhaul PLAN-EVAL
cycle-1 remediation — add Commit Slices", +44 / −4 across `plan.md` and `worklog.md`).

## Cycle-1 verified boxes — re-confirmed against `plan.md` @ `565e672b`

The cycle-1 verdict walked each locked decision and the gate set against the tree and `plan.md` @
`58a32bdf`. I re-walked each row against the **post-remediation** `plan.md` @ `565e672b` (and
spot-checked the tree). The only places `plan.md` changed are: (a) the header preamble (now records
cycle-1 outcome + lane), (b) the **new** `## Commit Slices` section, and (c) a "LD-DOCS-LANE"
annotation appended to `## Dependencies`. **Nothing else changed.**

| Cycle-1 verified row | Status @ `565e672b` | Evidence |
|----------------------|---------------------|----------|
| IO-1 (one-home-per-concept) | **Holds** | `plan.md:63` Locked Decisions table — unchanged from cycle-1 |
| IO-2 (`.claude/skills/` regenerated; `validate-claude-surface.ts` gate) | **Holds** | `plan.md:64` — unchanged. Pre-sliced gate key `G-surface = validate-claude-surface.ts green` + `G-mirror = .claude/skills/ regen-diff clean` matches the Fitness Gates table (`plan.md:100–103`) |
| IO-3 (`deno doc` doc scope = harness + `jsr-audit` skill) | **Holds** | `plan.md:65` — unchanged. Slice S1 (`jsr-audit` skill) + S2 (harness docs) implement IO-3 |
| IO-4 (consolidation = content; file deletion = Group 1) | **Holds** | `plan.md:66` — unchanged. S4 explicitly says "doctrine **decisions** unchanged (IO-4 boundary)" and is "link/index-only" |
| IO-5 (no Diátaxis; functional/role-based IA) | **Holds** | `plan.md:67` — unchanged. Cycle-1 evidence stands |
| IO-6 (canonical-home rubric; 5 homes) | **Holds** | `plan.md:68` — unchanged. Slice S3 applies the rubric (the "exhaustive concept→home map" deliverable) |
| Boundary (Non-Scope vs Group 3; no framework-code edits; no doctrine-decision changes) | **Holds** | `plan.md:42–48` Non-Scope unchanged. Slice file targets are all in `.llm/`, `docs/`, `AGENTS.md`, `CLAUDE.md`, `deno.json` — no `packages/` |
| Risk register (4 rows, all with mitigations) | **Holds** | `plan.md:81–86` — unchanged |
| Fitness Gates (4 required gates) | **Holds** | `plan.md:98–103` — unchanged |
| Validation Plan (4 ordered gates) | **Holds** | `plan.md:145–150` — unchanged |
| Deferred scope (Non-Scope + Hidden Scope + Drift Watch) | **Holds** | `plan.md:42–57, 161–165` — unchanged |
| jsr-audit surface scan (pkg/plugin) | **N/A** | internal docs run — research.md marks `N/A` with the right reason ("this run **documents** the `deno doc`/`deno doc --lint` workflow that the `jsr-audit` skill and Group 3 reference generation depend on") |
| Group-1 deletion coordination | **Holds** | `plan.md:76` Open-Decision Sweep row 3 still says **RESOLVED**; research.md §"Group 1 coordination list" cites the same evidence (PR #54 `a4db5527`) |
| Off-limits guardrail | **PASS (re-confirmed below)** | No slice file target is in `packages/`, no version pin, no catalog reference |

## Cycle-2 evaluation of the previously-failing box

### "Commit slices (< 30, gate + files each)" — `plan.md` lines 105–135

The new `## Commit Slices` section is the only material change addressing the cycle-1 FAIL. Judge
each plan-gate sub-requirement (`gates/plan-gate.md` box 4):

| Sub-requirement | Verdict | Evidence (post-remediation) |
|-----------------|---------|------------------------------|
| Section exists | **PASS** | `plan.md:105` `## Commit Slices` |
| Ordered (S0 → S8) | **PASS** | `plan.md:122–131` table is numbered S0 through S8 in implementation order |
| < 30 entries | **PASS** | 9 entries (S0–S8). Comfortably under the cap |
| Each slice names what-it-proves | **PASS** | Column 3 of the table names a concrete outcome per slice (e.g., S1 "npm-dep rendering, JSX/TSX highlighting, npm-without-types workaround, and `deno doc --lint` as the publish bar are all documented (IO-3)"; S7 "An internal link / orphan / stale-mirror gate exists in the harness gate set") |
| Each slice names a proving gate (from Fitness Gates) | **PASS** | Column 4 cites one or more of **G-surface / G-mirror / G-links / G-doctrine**, all keyed to the Fitness Gates table (`plan.md:98–103`): G-surface = `validate-claude-surface.ts` green → row 1; G-mirror = `.claude/skills/` regen-diff → row 3; G-links = internal link/anchor check → row 2; G-doctrine = doctrine spot-check (the Validation Plan row 4 "doctrine intact" check, appropriate as a docs-surface surrogate for code-level fitness gates). Gate key is defined explicitly at `plan.md:117–119`. The implementer note `plan.md:135` ("each slice must carry at least one Fitness Gate") reinforces the rule. |
| Each slice names path-level files | **PASS** | Column 5 names specific files at path-level: `.agents/skills/jsr-audit/SKILL.md` (S1), `.claude/skills/jsr-audit/SKILL.md` (S1), `.llm/harness/` + `workflow/run-loop.md` (S2), `AGENTS.md` + `.agents/skills/*/SKILL.md` (S3), `.llm/harness/DOCTRINE-REF.md` + `docs/architecture/doctrine/*.md` (S4), `.llm/tools/README.md` (S5), root `*.md` + `AGENTS.md` + `CLAUDE.md` (S6), `.llm/harness/gates/*` + `deno.json` (S7). Where multiple paths share a slice, the precedence / target is unambiguous (e.g., S2 "README or new `tools-and-commands.md`"). |

### Slice coverage of the plan's named scope

| Plan scope item (from `## Scope`) | Slice(s) addressing it |
|-----------------------------------|------------------------|
| Consolidate/de-dup (F1): merge overlapping internal docs; one home per concept | **S3** (canonical-home duplication map; applies IO-6 rubric; the "exhaustive concept→home map" deliverable), assisted by **S4** (doctrine references) and **S6** (root/AGENTS/CLAUDE coherence) |
| `deno doc` documentation in harness + `jsr-audit` skill (npm-dep rendering, JSX/TSX highlighting, npm-without-types workaround, `deno doc --lint` as publish bar) | **S1** (`jsr-audit` skill section; npm-dep rendering / JSX/TSX / npm-without-types / `--lint`) + **S2** (harness docs section; `deno doc <module>` / `--filter <symbol>` / `deno why`) |
| Agent surface coherence: `AGENTS.md` + `CLAUDE.md` + `.agents/skills/` accurate; `.claude/skills/` regenerated, never hand-edited | **S1** + **S3** (regenerate affected `.claude/skills/` mirrors after editing `.agents/skills/` source); **S6** (root/AGENTS/CLAUDE coherence). Pre-sliced preamble `plan.md:113–115` and slices themselves repeat the "regenerate from `.agents/skills/`" rule |
| Doc-maintenance gate (E1) wired | **S7** (gate present in `deno.json`/`gates/`) |

**Coverage is complete**: every scope item has a named slice that addresses it, and each slice
declares at least one gate from the Fitness Gates table.

### No-regression spot-check (slice list vs locked scope)

- **Locked decisions IO-1…IO-6**: not modified by any slice. Slices 1–4 explicitly reference IO-2,
  IO-3, IO-4, and IO-6 in their what-it-proves / file-target columns.
- **Scope / non-scope**: no slice introduces or removes a scope item. Slice targets are all
  doc/harness/gate files; none adds a framework-code target.
- **Gate set**: Fitness Gates table (`plan.md:98–103`) is unchanged; the new gate keys G-surface /
  G-mirror / G-links / G-doctrine are aliases for rows already in the table.
- **Risk register**: `plan.md:81–86` is unchanged; the slice list inherits the same mitigations
  (link-check gate covers "Breaking internal cross-references"; regenerate covers "Hand-editing
  `.claude/skills/` mirror"; G1 coordination covered by slice preamble "no slice … deletes doc
  *files* (Group 1's job)").
- **No framework-code edits**: scanning all slice file targets — `.agents/skills/jsr-audit/SKILL.md`,
  `.claude/skills/jsr-audit/SKILL.md`, `.llm/harness/`, `.llm/harness/workflow/run-loop.md`,
  `AGENTS.md`, `.agents/skills/*/SKILL.md`, `.claude/skills/`, `.llm/harness/DOCTRINE-REF.md`,
  `docs/architecture/doctrine/*.md`, `.llm/tools/README.md`, root `*.md`, `CLAUDE.md`,
  `.llm/harness/gates/*`, `deno.json` — none references `packages/` or `plugins/`. **Clean.**
- **No doc-**file** deletion**: slices 1–6 all name content edits or regenerations; no "delete",
  "remove", or "rm" language. Slice S3 says "regenerate affected `.claude/skills/` mirrors" — that
  is a mirror regen (IO-2), not a content deletion.
- **No doctrine-**decision** changes**: S4 explicitly says "doctrine **decisions** unchanged
  (IO-4 boundary)" and "link/index-only". Other slices that touch doctrine files (S3, S5) declare
  "link-only".
- **No `.claude/skills/` hand-edits**: preamble (`plan.md:113–115`) and slices S1 + S3 explicitly say
  "regenerate from `.agents/skills/`". **Clean.**

### Off-limits guardrail re-check (re-confirmation of cycle-1 PASS)

- `packages/aspire/src/public/mod.ts` exists on tree but **does not appear in any slice file
  target** (re-grepped across `plan.md` and the slice table). No slice edits it.
- `packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts` likewise absent from any slice
  file target.
- No version-pin or catalog/`catalog:` reference appears in any slice file target. The only
  occurrences of "catalog" in the run artifact are in the off-limits-guardrail line of the cycle-1
  `plan-eval.md` (as a forbidden item) — not in an implementation target.
- No framework-code or doctrine-decision change is in scope. **PASS.**

## Cycle-2 re-walk of the full Plan-Gate checklist

| Plan-Gate item | Result | Evidence / location |
|----------------|--------|---------------------|
| Research present and current | **PASS** | `.llm/tmp/run/docs-internal-overhaul--contributor/research.md` exists; re-baseline against `main` @ `cc3b8731` recorded; Group-1 coordination row carries the PR #54 `a4db5527` evidence |
| Decisions locked | **PASS** | `plan.md:61–68` Locked Decisions table — IO-1…IO-6 with rationale; unchanged by remediation |
| Open-decision sweep | **PASS** | `plan.md:72–77` four rows (3 RESOLVED + 1 "resolve in Design" with locked default = IO-3); no decision would force rework if deferred |
| **Commit slices (< 30, gate + files each)** | **PASS** | `plan.md:105–135` — new section: 9 ordered slices (S0–S8), each with what-it-proves + proving gate (from Fitness Gates) + path-level files. See sub-table above |
| Risk register | **PASS** | `plan.md:81–86` — 4 risks + mitigations; unchanged |
| Gate set selected | **PASS** | `plan.md:98–103` — 4 required fitness gates; new gate keys G-surface / G-mirror / G-links / G-doctrine are aliases for these; unchanged |
| Deferred scope explicit | **PASS** | `plan.md:42–48` Non-Scope, `plan.md:50–57` Hidden Scope, `plan.md:161–165` Drift Watch; unchanged |
| jsr-audit surface scan (pkg/plugin) | **N/A** | internal docs run; `research.md` §"jsr-audit surface scan" correctly marks `N/A` (the run **documents** the `deno doc` workflow that `jsr-audit` and Group 3 depend on) |

**8 of 8 boxes resolved (7 PASS + 1 N/A).** The previously-failing box is now PASS; no other box
regressed.

## Open-decision sweep (evaluator-run, cycle 2)

| Decision | Status in plan | Verdict |
|----------|----------------|---------|
| Contributor-doc IA (Diátaxis vs lighter) | RESOLVED (IO-5) — functional/role-based | **CLOSED** (cycle-1) |
| Canonical home per concept | RESOLVED (IO-6) — rubric locked, exhaustive map is a Design deliverable | **CLOSED** (cycle-1); S3 applies the rubric mechanically |
| Group-1 file-deletion coordination | RESOLVED — G1 (PR #54, merge `a4db5527`) deleted exactly `AGENTS-handoff.md`, relocated into `openhands-handoff` skill | **CLOSED** (cycle-1) |
| `deno doc` doc scope (harness only vs harness + jsr-audit + standalone) | Default locked (IO-3 = harness doc + `jsr-audit` skill section); exact placement "resolve in Design" | **ACCEPTABLE** (default is locked; placement-within-locked-surfaces is a Design detail, not rework-forcing) |

**No decision the plan leaves open would force rework if deferred.** No new open decisions were
introduced by the remediation.

## Subtle observations (informational, not gate-blocking)

1. **`## Commit Slices` is a faithful decomposition of the already-VERIFIED plan**, not new scope.
   It maps the four scope items to nine ordered slices; every scope item has a named home; every
   gate cited is a real gate from the Fitness Gates table or the Validation Plan.
2. **Lane is explicit.** The `LD-DOCS-LANE` annotation (preamble + `## Dependencies`) names the
   authoring/validation split (Claude-workflow per-domain authoring; OpenHands validates per-domain)
   and ties authoring to `netscript-harness` / `jsr-audit` / `netscript-doctrine` skills. This is
   consistent with the cycle-1 evaluator's "Open-decision sweep" observation #2 — the lane was
   implicit in cycle 1 and is now explicit.
3. **Gate slices (S0/S7/S8) and authoring slices (S1–S6) are differentiated** in the preamble.
   This is appropriate: S0 is a bootstrap sanity check, S7 is a gate wiring, S8 is a final
   four-gate sweep — none of them carries new doc content.
4. **The slice preamble re-states the off-limits guardrails** ("no slice edits framework code,
   deletes doc *files* … changes doctrine *decisions*, or hand-edits `.claude/skills/`"). This is a
   positive signal that the implementer internalized the cycle-1 boundary findings.
5. **The `deno doc` doc surface** (IO-3) is split across two slices (S1 `jsr-audit` skill, S2
   harness docs). Each carries the gates appropriate to the surface (S1 also covers G-surface /
   G-mirror because it edits an `.agents/skills/` SKILL.md and triggers a `.claude/skills/` regen;
   S2 is link-only so it carries G-links). This is the right granularity.
6. **No off-limits violation introduced by the slice list.** Off-limits guardrail re-check is
   clean (no `packages/`, no version pins, no catalog references in any slice file target; no
   framework-code edits; no doctrine-decision changes; no `.claude/skills/` hand-edits).

## Cycle-2 verdict

**`PASS`**

### Rationale (one paragraph)

The remediation under review (`565e672b`, +44/−4 across `plan.md` + `worklog.md`) is the minimum
fix needed to close the cycle-1 `FAIL_PLAN`: it adds a `## Commit Slices` section at `plan.md:105–135`
that is ordered (S0–S8, well under the < 30 cap), names a concrete **what-it-proves** outcome per
slice, cites a **proving gate** per slice (from the existing Fitness Gates table, with the four
gate keys G-surface / G-mirror / G-links / G-doctrine explicitly defined at `plan.md:117–119`), and
names **path-level files** per slice. The nine slices cover every item in the plan's `## Scope`
(consolidate/de-dup → S3, `deno doc` doc → S1+S2, agent-surface coherence → S1+S3+S6, doc-maintenance
gate E1 → S7) and explicitly inherit the cycle-1 guardrails (no framework-code edits, no doc-file
deletions, no doctrine-decision changes, no `.claude/skills/` hand-edits). No locked decision
(IO-1…IO-6), scope/non-scope row, gate-set entry, validation-plan row, risk-register row, or
drift-watch item was modified; the slice list is a faithful decomposition of the already-VERIFIED
plan, not new scope. The off-limits guardrail re-checks clean — `packages/aspire/src/public/mod.ts`,
`packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts`, version pins, and catalog
references do not appear in any slice file target, and the on-tree `git diff docs/internal-overhaul
-- <off-limits-path>` is empty. All 8 Plan-Gate boxes now resolve (7 PASS + 1 N/A). Implementation
may begin; no slice before this PASS existed, and none should remain blocked on the second-cycle
escalation gate.

### Notes

- No implementation slice may be committed before PASS. PASS is now in effect.
- This was **cycle 2 of 2**; per `plan-protocol.md` §"Loop limit", a second `FAIL_PLAN` would have
  escalated to the user. The cycle-2 verdict is `PASS`, so escalation is not triggered.
- The off-limits guardrail PASS holds; any future slice that would re-introduce framework-code
  edits, doc-file deletions, doctrine-decision changes, or `.claude/skills/` hand-edits is a
  `FAIL_FIX` / `FAIL_RESCOPE` / `FAIL_DEBT` trigger and must not ship under this plan.
- The `deno doc` section scope (IO-3 default = harness doc + `jsr-audit` skill section) is the
  locked default; S1 and S2 respect it.
- LD-DOCS-LANE: authoring via the Claude dynamic workflow (per-domain agents under the harness
  SKILL); validation via OpenHands (qwen 3.7 max, per-domain). No framework-source slice in this
  group (Group 4 is doc-only).