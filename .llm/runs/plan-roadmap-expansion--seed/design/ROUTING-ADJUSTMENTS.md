# Owner routing adjustments — beta.5+ implementation waves (2026-07-06)

> **Authoritative override.** These owner directives supersede the per-slice `Model/effort` lines in
> every `design/*/agent-briefs.md` and the lane defaults in `beta5-launch-brief.md` where they
> conflict. Apply them when instantiating any slice brief; do not re-litigate per slice.

## Model / lane routing

1. **UI-related tasks** (fresh-ui components, dashboard surfaces, islands, design-sync, anything
   whose acceptance is visual/interaction quality): conducted by **Claude Opus 4.8, high effort** —
   not WSL Codex.
2. **Complex implementation tasks that require thinking** (unclear failure modes, load-bearing
   design forks, type-soundness seams, concurrency/context-propagation correctness): launched with
   **Claude Opus 4.8, high effort**.
3. **WSL Codex slices always launch at `high` effort.** `medium` is allowed only for small, easy,
   mechanical tasks (rename sweeps, const tables, single-file plumbing). Never launch a Codex slice
   at medium by default. (Supersedes every "GPT-5 Codex, medium" line in `E-desktop/agent-briefs.md`
   and the "Opus, medium" defaults elsewhere.)
4. **Docs tasks are conducted by Claude agents** (Opus workflows per the documentation-authoring
   exception; Sonnet 5 for trivial link-fix/cleanup — unchanged). **GPT-5.5/Codex is bad at prose
   and must not author docs**; it MAY be used as an **adversarial validator** for docs (fact/link/
   API-surface checking against the repo), never as the writing lane.
5. Unchanged laws: never route workflow fan-out stages to Fable 5; OpenHands remains the evaluator
   (IMPL-EVAL qwen 3.7 max, separate session); the Fable supervisor never writes framework code.

## Supervisor sequencing

6. **Pre-flight cross-reference (recommended, do it):** before launching any lane, run a **Claude
   dynamic workflow (Sonnet 5, high)** that cross-references the beta.5-milestone epics/issues on
   GitHub against the full detail in `.llm/runs/plan-roadmap-expansion--seed/` (design, analysis,
   context, matrix) so the Fable supervisor has the whole picture — gaps, stale issue bodies,
   missing deps — before committing lane order.
7. **Repo-optimization wave first.** The supervisor starts with all repo optimizations, chores,
   tooling/harness improvements queued for the milestone, merges them, and only then launches the
   feature implementation lanes — so every feature lane benefits from the improved agentic surface.
8. **eis-chat validation gate (post-AI-epic).** Once the AI epic lands, launch a **Fable 5
   sub-agent against `https://github.com/rickylabs/eis-chat`** to validate that the shipped seams
   could actually replace the proven in-place patterns there. Goal is coverage of the repo's needs,
   NOT reducing/hardcoding patterns to match eis-chat. Features that ship after beta.5 are fine and
   not blockers; a **blocker** is a *shipped* feature that misses the quality bar or the coverage
   eis-chat needs.
9. **Overnight autonomy.** The Fable supervisor runs in full autonomy through the night (enable the
   built-in overnight/autonomous mode if required). It keeps the harness run artifacts
   (`worklog.md`, `phase-registry.md`, `context-pack.md`, `commits.md`, `drift.md`) up to date and
   re-reads them between each compaction to maintain quality and context awareness.
