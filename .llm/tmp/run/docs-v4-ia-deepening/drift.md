# Drift log — docs-v4-ia-deepening

Append-only. Severity ∈ {minor, significant, architectural, process}.

---

## D1 — PROCESS — Caveats identified but never tracked (doctrine violation)

**Severity:** process (systemic)
**Found:** 2026-06-22, on user review of the freshly-merged v3 docs site (PR #106).

**What happened.** Across the v3 docs program, caveats and capability gaps were written
into page prose (alpha warnings, "this page does not cover…", GET double-handling, etc.) but
were **not** harvested into any tracked surface — not `drift.md`, not `arch-debt.md`, not a
backlog issue. AGENTS.md operating rule 5 ("Drift is explicit") and the harness skill require
that, **at minimum**, every identified caveat/gap is recorded in the run drift file. That step
was skipped repeatedly.

**Worst instance — better-auth seam gap.** The `tutorials/workspace` track is explicitly about
**organizations / multi-tenancy**, yet it does not use better-auth's first-class `organization`
plugin (nor `twoFactor`, `magicLink`, `admin`, `passkey`, `multiSession`). Either NetScript
lacks the **seam** to mount better-auth plugins (a framework MAJOR) or it has the seam and the
tutorial simply ignored it (a docs gap). Neither possibility was investigated or flagged. This
is the canonical example the user raised: "if we are lacking seams then it's a major issue that
should be flagged."

**Why it matters.** Soft-failing on caveats produces docs that look complete while silently
omitting flagship capability and leaving framework gaps undiscovered. It also let a FLAT IA
ship (one page for @netscript/fresh, the Next.js/TanStack-equivalent container) without anyone
— supervisor, PLAN-EVAL, or the adversarial Codex panel — flagging the structural problem.

**How to apply (the permanent fix, Phase 2 of this run):**
1. **Caveat-harvest gate.** Every authored caveat/gap must carry a tracked reference
   (drift entry, arch-debt id, or GH issue #). A caveat in prose with no reference fails review.
2. **Link-integrity build gate.** A `featureGrid`/`xref`/nav href to a non-existent or
   non-corresponding page fails the build (no more soft-degrade to the nearest index).
3. **Seam-coverage discipline.** "Documented or implied but unseamed" features are recorded as
   arch-debt + backlog issues; the seam-coverage matrix (Phase 0 scout) is the source of truth.

**Status:** OPEN — Phase-0 seam audit LANDED (see `seam-coverage.md`). Result: the framework has
**one** real build-seam gap (better-auth plugin passthrough on `createNetscriptBetterAuth`); every
other capability is already honestly seamed or honestly documented-as-limitation. So the systemic
risk was process, not breadth. Per-feature build-vs-doc disposition surfaced to the user 2026-06-22.
Remediation gates (caveat-harvest, link-integrity build gate, seam-coverage discipline) move into
Phase 2 of this run.
