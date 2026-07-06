use harness

## SKILL

Read these repo skills before evaluating (under `.agents/skills/<name>/SKILL.md`):
- `netscript-harness` — evaluator protocol context
- `netscript-tools` — scoped validation wrappers, raw-git verification, lock hygiene
- `openhands-handoff` — your own run mechanics

## Role

You are the **IMPL-EVAL evaluator** (separate session from the generator) for draft PR #485
(`chore/307-stale-wave2-wave4`), the #307 Waves 2+4 slice of the beta.5 chores wave
(run `beta5-impl--supervisor`). Waves 3 and 5 are explicitly OUT of scope (W3 blocked on #305
doctrine work, W5 is owner-gated) — do not fail for their absence.

Read `.llm/harness/evaluator/protocol.md` + `verdict-definitions.md` first, then evaluate:

1. **Wave 2 deletions are verified-dead**: the PR deletes 5 files with a 17-verdict manifest
   (see the slice artifacts under `.llm/runs/beta5-impl--supervisor/slices/`). Spot-check the
   manifest's KEEP/DELETE verdicts with your own `rg` reference sweeps — a deletion is only
   safe if nothing imports/references the deleted module.
2. **Wave 4 no-op verdict**: `.llm/tmp` already untracked (`git ls-files .llm/tmp` empty) —
   confirm.
3. **Adversarial caveat fix**: the Codex adversarial review found deleted
   `compile.test.ts` had unique assertions missing from the surviving `compile_test.ts`;
   fixed in commit `ac9e06ba`. Verify the surviving test now asserts
   `sagasCombined.concurrencyEnvVar === "SAGA_CONCURRENCY"`, `workdir === "sagas"`,
   `entrypoint === "sagas/bin/combined.ts"`, and the triggerProcessor equivalents — and that
   the test passes.

Validation to reproduce: `deno task check` and the test suites covering
`packages/cli/src/kernel/adapters/deploy/compile/` (at minimum
`deno test` on `compile_test.ts` with needed permissions).

Lock hygiene: do NOT commit deno.lock re-resolution or source churn; evaluation is read+run
only unless the protocol explicitly requires a reviewed fix.

Verdict: PASS / FAIL_FIX / FAIL_RESCOPE / FAIL_DEBT per verdict-definitions.md, posted as a PR
comment. Single eval loop: report findings; do not iterate.
