use harness

# Slice W5-V3: plugin remove JSR dispatch + rollback — #1236 (p2, verified)

You are the implementation supervisor for the PR resolving #1236. Read the live issue body
FIRST — independent verifier transcripts from clean scaffolds on 0.0.4/canary.2/canary.6.
Long-standing, not a regression.

## The defect (verified)

`plugin remove` dispatches the bare configured plugin name to JSR as a package specifier and
fails — AFTER already dropping the plugin from `netscript.config.ts`. Result: half-removed
project, non-zero exit, no rollback, and the error text talks about *installing* during a
remove. The command's own help documents the bare name as the argument form — this is not user
error.

## SKILL

- `.agents/skills/netscript-harness`
- `.agents/skills/netscript-pr`
- `.agents/skills/netscript-doctrine`
- `.agents/skills/netscript-cli` (plugin lifecycle commands, config mutation surfaces)

## Milestone-run evaluator rule

Composed per milestone-run.md + D6; mark the gate row accordingly; lock plan, implement same
run.

## Deliverable = the gates

1. RED-first: a test reproducing the verifier's scenario — bare-name remove fails after config
   mutation, leaving the half-removed state.
2. The fix, contract first: resolve/validate everything the removal needs BEFORE mutating any
   project state; the bare configured name (the documented argument form) resolves correctly;
   on any failure after mutation begins, roll back to the pre-command state. Error text
   describes removal, not installation.
3. Post-fix lifecycle proof: install → remove → project state equals pre-install (config,
   registries, generated wiring), demonstrated by test through the public CLI surface, plus
   `plugin doctor` clean.
4. Archetype gates on touched packages; docs/help text corrected if the argument contract
   changed; no new lint ignores; no `deno.lock` churn.

## PR

Branch `fix/plugin-remove-bare-name-rollback`; body `Closes #1236`; labels `type:fix` +
`area:cli` + `area:plugins` + `priority:p2` + exactly one `status:`; milestone 0.0.5. Draft
while implementing; ready when green; explicit-refspec pushes only. End DONE when ready, or
BLOCKED: <reason>.
