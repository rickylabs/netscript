# Opus-CD — Per-slice authoring briefs

> **ROUTING OVERRIDE (2026-07-06):** model/effort lines below are superseded where they conflict —
> see `../ROUTING-ADJUSTMENTS.md` (UI + complex-thinking slices → Opus 4.8 high; Codex always high
> unless trivially easy; docs prose = Claude only, Codex = adversarial validator only).

Lane law (CLAUDE.md documentation-authoring exception + proposal §5):
- **S0 (IA-reconciliation) = WSL Codex** daemon-attached (structural nav/redirect plumbing).
- **All C + D prose = Claude dynamic workflows** — Opus medium (concept/story/reference), Opus low
  (thin/mechanical), Sonnet 5 (trivial link-fix). **Never Fable in the fan-out.** Workflow agents
  **RETURN prose bodies; the Fable supervisor commits** to the worktree (agents cannot redirect
  Write to another worktree — MEMORY `workflow-subagent-worktree-pin`).
- **Validation = OpenHands** (qwen 3.7 max, separate session), per-track / per-pillar verdict. The
  workflow is generator-only; it does not self-certify.

Every brief carries a `## SKILL` chapter (MEMORY `handover-prompts-need-skill-chapter`).

---

## Brief S0 — IA-reconciliation (WSL Codex, mechanical/structural)

**Model/lane:** WSL Codex daemon-attached slice (mobile-visible). Not a prose workflow.
**Depends on:** owner-created `0.0.1-beta.7` milestone + epic-fork decision.
**Deliverable:** the moves/redirects/nav edits in epic-and-issues §2; returns a worklog of moved
files + redirect map + `deno task verify` output.

**Do:** move `capabilities/*.md` into pillar targets (proposal §2.2 mapping); add a URL redirect per
old path; retarget `comp.xref` `cap:` keys; fix the 3 rerouted `_data.ts` "Overview & Concepts"
cards; add the 2 net-new leaf stubs; delete `capabilities/index.md` last.
**Do NOT:** touch tutorial-chapter nav anchors; rewrite prose; touch `packages/`/`plugins/`; churn
`deno.lock`.
**Gate:** `deno task verify` green + manual redirect nav-check of all 15 pages + grep-clean of
`capabilities/` refs.

### ## SKILL
- `netscript-harness` (SCOPE-docs overlay; run-loop, commit-per-slice, `.llm/tmp` path caveat).
- `netscript-tools` (raw git verification, lock hygiene, scoped-wrapper evidence).
- `netscript-pr` (branch naming, `Part of #<epic>`, `Closes #S0` on the PR body, docs labels,
  path-filter `ci:` awareness).
- `deno-fresh` (Lume/Vento site mechanics — redirect frontmatter, `_data.ts` nav shape).

---

## Brief template C — tutorial-track rewrite (Opus medium workflow)

Instantiate once per track C1–C6. **Model:** Opus medium (all tracks — narrative-dominated).
**Depends on:** S0 merged. **Return:** rewritten chapter bodies (Markdown) for the Fable supervisor
to commit; a per-chapter accuracy worklog (each API/symbol → `deno doc` citation); a nav-anchor
delta (which slugs changed, if any, + the paired `_data.ts` edit).

**Fixed structure (preserve the proven mechanic — proposal §3.0):** learningPath nav →
"What you will build" → "Before you begin" runnable check → numbered `Step N — <verb>` with real
runnable code → callouts/apiTable → "Verify your progress" checklist ending in a runnable command →
"What you built" (real screenshot/`curl`/log) → nextPrev. **Change premise + prose, not mechanic.**

**Per-track specifics:** pull the track's real-project backing, chapter list, and gate from
proposal §3.2–§3.5 and the matching row of epic-and-issues §3. Style bar =
`research/C-tutorials/medusa-inspired-writing-style-contract.md` (every step → literal checkpoint).
Track-C5 (chat) + any AI step: shipped `@netscript/fresh/ai` only; `@netscript/ai` engine = caveated
forward-ref; **pre-flight the publish state via `deno doc` before authoring.**

**Landmines (bake in):** no `function` keyword inside a comp-tag arg (aborts build); do NOT run
repo-wide `deno task fmt` (reflows `.vto/.md`); pre-flight every page with a real `deno task verify`,
not a visual read (`analysis/C-tutorials/04-lume-vento-authoring-observations.md`). Any framework
defect a chapter exposes (e.g. `WORKER_CONCURRENCY`, `createJobTools` no-op) is a **separate Codex
side-fix**, never edited into the docs slice.

### ## SKILL
- `netscript-harness` (SCOPE-docs overlay).
- `deno-fresh` (Fresh 2.x patterns the tutorials teach — single-`ctx` handlers, islands, `define`
  helpers; must be current, not 1.x).
- `netscript-doctrine` (contract-first A2/A3 ordering the build arc follows; verify taught APIs
  against public surface).
- `netscript-cli` (scaffold/`plugin add`/`ui:add` commands the tutorials invoke).
- `deno-fresh` + `jsr-audit` for any published-surface claim; `netscript-pr` for the landing PR
  (`Closes #C<n>`, docs labels, beta.7 milestone).

---

## Brief template D — per-pillar positioning (Opus medium/low workflow)

Instantiate once per pillar D1–D9. **Model:** Opus medium for Tier-1/2 story pages; Opus low for
Tier-3 thin pages (proposal §4.3 tiers). **Depends on:** S0 merged. **Return:** rewritten pillar
`index.md` + feature story pages for the Fable supervisor to commit; a per-claim accuracy worklog
(present-tense capability → `deno doc` citation); the competitor-comparison source line per Tier-1/2
page (which teardown finding, which shape).

**Per-page structure (proposal §4.2):** elevator pitch (eis-chat-led, from
`context/D-positioning/elevator-pitch-raw-material.md`) → story spine (concrete failure/workflow;
model = `tutorials/storefront/04-checkout-saga` + `capabilities/durable-sagas.md`) → mechanism
(cross-linked, not duplicated) → **one factual competitor comparison for Tier-1/2** (Trigger.dev/
Convex factual-table shape from `research/D-positioning/competitor-teardown.md` §2) → cross-links.

**Positioning law (hard, every page):** build-efficiency for AI agents NOT throughput; no
superlatives/absolutes; every present-tense capability traces to shipped `deno doc` (not `_plan/`,
not research prose); **no honesty/candor framing**; no fabricated %/social proof (`netscript-bench`
#302 unavailable → qualitative/mechanism claims only). **Do NOT lift `_plan/*` verbatim** — it is
the exact tree carrying the banned framing + a throughput phrase.
**Per-pillar specifics + fixes:** the pages, competitor angles, and folded side-fixes are the
matching row of epic-and-issues §4 (D5 = plugin-system auth-telemetry contradiction fix; D9 = gated
AI/MCP; auth story from package docs not eis-chat).

### ## SKILL
- `netscript-harness` (SCOPE-docs overlay).
- `netscript-doctrine` (public-surface truth for every capability claim; archetype vocabulary).
- `netscript-deno-toolchain` (`deno doc` / `deno doc --filter` to verify each claimed symbol is
  shipped — the cheapest accuracy check).
- `deno-fresh` (Lume/Vento comp-tags: callout/apiTable/featureGrid/xref/nextPrev; landmines).
- `jsr-audit` (publish-state of `@netscript/ai` and any surface a page claims as shipped).
- `netscript-pr` (landing PR `Closes #D<n>`, docs labels, beta.7 milestone, path-filter `ci:`).

---

## Brief V — validation (OpenHands, per-domain)

**Model/lane:** OpenHands, qwen 3.7 max, **separate session** from the authoring workflow.
**Input:** each merged/branch C and D slice. **Output:** per-track (V-C) / per-pillar (V-D) verdict
`PASS` / `CHANGES_REQUESTED` (PR-comment), two fail-cycles → escalate.

**Checks (epic-and-issues §5):** `deno task verify` green; every capability claim traces to
`deno doc`; positioning-law grep clean (no honesty/throughput/superlative/`_plan`-lifted phrasing);
(C) no `_data.ts` hub anchor broken by a slug rename; (D) no page orphaned from nav; Diátaxis
cross-link-not-duplicate respected.

### ## SKILL
- `openhands-handoff` (trigger template, PR-comment output, per-domain verdict).
- `netscript-harness` (IMPL-EVAL protocol, verdict vocabulary, separate-session rule).
- `netscript-deno-toolchain` (`deno doc` accuracy re-check).
- `netscript-tools` (raw-git verification of the actual file set; lock hygiene — flag any
  `deno.lock`/source churn snuck into a docs slice).

---

## Routing summary

| Slice | Lane | Model/effort |
|-------|------|--------------|
| S0 IA-reconciliation | WSL Codex | daemon-attached structural |
| C1–C6 tutorial rewrites | Claude workflow | Opus **medium** (narrative) |
| D1–D9 Tier-1/2 story pages | Claude workflow | Opus **medium** |
| D Tier-3 thin pages | Claude workflow | Opus **low** |
| concepts.vto alpha-drift fix | Claude workflow | **Sonnet 5** (trivial) |
| V-C / V-D validation | OpenHands | qwen 3.7 max (separate session) |

**Never Fable in the fan-out** (priciest; reserve for a single deliberately-spawned sub-agent on an
extremely complex single-threaded task). Fable's role here is supervisor: lock the design at Stage E,
commit returned prose, and run the board.
