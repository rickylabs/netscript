use harness

# Slice W5-V1: custom-job registry generation — #1234 (p2, verified)

You are the implementation supervisor for the PR resolving #1234. Read the live issue body
FIRST — it carries an independent verifier's clean-scaffold transcripts on 0.0.4, canary.2, and
canary.6; the defect is long-standing, not a regression. Trust the transcripts; re-verify the
RED locally before designing.

## The defect (verified)

`netscript generate plugins` cannot emit a job registry for a custom job: the workers plugin's
published `scaffold.runtime.json` declares its generator run with `--profile scaffold`, whose
include list admits only the official sample files. Replace the sample with your own job →
generator finds zero registrable files → skips the registry → CLI fails on the missing declared
artifact. `--official-samples false` only stops writing sample config — no public override
exists. The repo's own E2E fixtures hand-edit the generated registry to work around it — the
exact state the regenerate-don't-hand-edit rule exists to prevent.

## SKILL

- `.agents/skills/netscript-harness`
- `.agents/skills/netscript-pr`
- `.agents/skills/netscript-doctrine` (generator + plugin manifest surfaces)
- `.agents/skills/netscript-cli` (generate plugins, scaffold.runtime.json contract)

## Milestone-run evaluator rule

Per `.llm/harness/workflow/milestone-run.md` § Evaluator protocol + ruling D6: composed
evaluation; mark the gate row "composed per milestone-run.md (orchestrator waiver)"; lock plan,
implement same run.

## Deliverable = the gates

1. RED-first: a test reproducing the verifier's scenario — fresh scaffold, official sample
   replaced by a custom job, `generate plugins` today skips the registry and the CLI fails on
   the missing declared artifact.
2. The fix: a public, documented path by which user-authored jobs are registrable (contract
   first — decide whether the profile include-list widens, a new profile ships, or the
   generator discovers jobs structurally; record the decision and its doctrine rationale in
   your plan). GREEN through the same public path — no hand-edited registries.
3. The repo's own E2E fixtures stop hand-editing the generated registry — regenerate through
   the fixed path (this is part of the acceptance: the workaround must die with the defect).
4. Archetype gates on touched packages: `quality:gate`, scoped wrappers, doc-lint + publish
   dry-run if the export/manifest surface moves, no new lint ignores, no `deno.lock` churn.
   Docs that describe the generator/profile behavior update in the same PR.

## PR

Branch `fix/generate-plugins-custom-job-registry`; body `Closes #1234`; labels
`type:fix` + `area:cli` + `area:workers` + `priority:p2` + exactly one `status:`; milestone
0.0.5. Draft while implementing; ready when green; explicit-refspec pushes only. End DONE when
ready, or BLOCKED: <reason>.
