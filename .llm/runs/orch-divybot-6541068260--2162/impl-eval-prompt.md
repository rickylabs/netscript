use harness
## SKILL
netscript-harness, netscript-doctrine, netscript-tools. Independent read-only IMPL-EVAL and S2
slice review using native Claude Opus high, blockers only. Same evaluator as plan/S1. No edits,
commits, pushes, GitHub mutations, agent launches, or local full scaffold.runtime.
Review entire branch diff against f6839463668c5dae4ca7234d26909e74e10b89c0, including pending S2.
Read approved plan, plan-eval, worklog, context-pack, drift, s1-review and installed-proof in
.llm/runs/orch-divybot-6541068260--2162/. Verify regression coverage and public docs.
All 64 source tests pass; check/lint/fmt cover 14 TS files with zero findings. quality:gate and
JSR audit dry runs pass. Real fresh no-DB no-samples installs, generate and doctor exit zero.
Installed empty-startup.specimen.ts is 1 pass / zero ignored with default resource sanitizers;
it starts actual saga/worker/trigger APIs against isolated KV plus a streams HTTP test double.
All three snapshots ready with registryReady/dependencyReady true; saga definitionCount=0.
Aspire/full scaffold.runtime evidence explicitly remains unproven until coordinator-armed CI.
No claim of full acceptance completion; required e2e-cli-gate must be requested in READY.
No new exports/dependencies. This precommit review will be followed by exact pushed-head review.
Return only blocking findings with locations and minimal evidence, or PASS. End VERDICT: PASS
or VERDICT: CHANGES. Do not surface operational metadata in your result.
