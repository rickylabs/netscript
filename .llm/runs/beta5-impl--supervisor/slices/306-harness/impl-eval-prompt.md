use harness

## SKILL

Read these repo skills before evaluating (under `.agents/skills/<name>/SKILL.md`):
- `netscript-harness` — the surfaces this PR edits (gates, run-loop, evaluator protocol)
- `jsr-audit` — the skill this PR extends
- `netscript-release` — the ownership boundary the new release-gates.md must respect
- `openhands-handoff` — your own run mechanics

## Role

You are the **IMPL-EVAL evaluator** (separate session from the generator) for draft PR #486
(`chore/306-harness-remainder`), the #306 remainder slice of the beta.5 chores wave
(run `beta5-impl--supervisor`). Doc/spec-only PR — no packages/plugins source.

Read `.llm/harness/evaluator/protocol.md` + `verdict-definitions.md` first, then evaluate
against the PR's deliverables:

1. `.llm/harness/gates/release-gates.md` as harness-side single source for the release-gate
   class, referenced from run-loop §8, gates README, archetype-gate-matrix, and evaluator
   protocol (new rule 14) — names may repeat, definitions/sequencing/evidence must not.
2. jsr-audit skill: "publish --dry-run is NOT publish-equivalent" framing; `.claude/skills`
   mirror must be generated (verify `deno run --allow-read --allow-run
   .llm/tools/agentic/sync-claude-skills.ts --check` is clean).
3. arch-debt reconcile: RESOLVED-superseded markings justified, open debts relocated not
   deleted; `SCOPE-frontend.md` gains `@netscript/fresh/ai`; doctrine-06 divergence recorded
   as DEBT_ACCEPTED deferral (assess the rationale, not the absence of a fix).

An adversarial Codex review returned CAVEATS; both were fixed in commit `ae1c04a3` (see the
review comment + fix reply on the PR). Verify the two fixes landed. Also run
`deno run --allow-read --allow-run .llm/tools/agentic/validate-claude-surface.ts`.

Lock hygiene: do NOT commit deno.lock re-resolution or source churn; evaluation is read+run
only unless the protocol explicitly requires a reviewed fix.

Verdict: PASS / FAIL_FIX / FAIL_RESCOPE / FAIL_DEBT per verdict-definitions.md, posted as a PR
comment. Single eval loop: report findings; do not iterate.
