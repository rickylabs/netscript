use harness

## SKILL

Read these repo skills before evaluating (under `.agents/skills/<name>/SKILL.md`):
- `netscript-harness` — evaluator protocol context
- `netscript-doctrine` — the doctrine chapters this PR edits
- `netscript-tools` — scoped validation wrappers, gate-evidence rules, lock hygiene
- `openhands-handoff` — your own run mechanics

## Role

You are the **IMPL-EVAL evaluator** (separate session from the generator) for draft PR #484
(`chore/305-doctrine-quickwin`), the #305 quick-win slice of the beta.5 chores wave
(run `beta5-impl--supervisor`).

Read `.llm/harness/evaluator/protocol.md` and `.llm/harness/evaluator/verdict-definitions.md`
first, then evaluate this PR against its scope:

1. Retire the misfiring `@netscript/shared` Result rule in `.llm/tools/fitness/check-doctrine.ts`
   (inline-Result guidance preserved, no other rule weakened).
2. Zero remaining `phase-0-research` dead links in `docs/architecture/doctrine/` with live
   replacements.
3. `docs/architecture/doctrine/ref-migration-map.md` (old→new AP/F refs) consistent with
   `.llm/harness/debt/arch-debt.md` + `.llm/harness/evaluator/anti-pattern-catalog.md`.

Full 12-chapter doctrine rewrite is explicitly OUT of scope (owner-gated) — do not fail for
its absence. An unoriented adversarial Codex review already returned CLEAN (see the
[PHASE: ADVERSARIAL-REVIEW] PR comment); re-verify what you can cheaply, do not rubber-stamp.

Validation to reproduce: `deno task arch:check` (no @netscript/shared misfire, no regressions),
`rg phase-0-research docs/architecture/doctrine` (zero hits),
`deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools --ext ts`.

Lock hygiene: do NOT commit deno.lock re-resolution or source churn; evaluation is read+run only
unless the protocol explicitly requires a reviewed fix.

Verdict: PASS / FAIL_FIX / FAIL_RESCOPE / FAIL_DEBT per verdict-definitions.md, posted as a PR
comment. Single eval loop: report findings; do not iterate.
