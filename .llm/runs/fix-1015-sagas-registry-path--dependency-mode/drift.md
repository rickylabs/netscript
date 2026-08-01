# Drift Log — fix-1015-sagas-registry-path--dependency-mode

Append-only. No implementation drift recorded.

| Date | Severity | Source expectation | Observed reality | Decision / authorization |
| --- | --- | --- | --- | --- |
| 2026-08-01 | minor | Canonical planning lane defaults to the configured orchestrator route. | The owner started this run in the current Codex product session. | Record current session as supervisor/implementer; retain canonical separate open-model formal evaluator. |
| 2026-08-01 | significant — resolved by owner waiver | Local PLAN-EVAL should run on `claude-openrouter` with Qwen. | Session `5e52c824-93f1-49ef-80ae-12fcd8a4c1e8` reached the correct model but failed authentication before a model turn (`Not logged in`, zero tokens/cost). | Owner waived the open-model route for the 0.0.3 fix train on 2026-08-01. Opus 5 performs PLAN-EVAL/IMPL-EVAL in a separate session and model family from GPT-5.6 Sol; do not retry Qwen or dispatch OpenHands. |
| 2026-08-01 | minor, pre-existing | `SagasAspireContribution.declareEnv` was expected to deliver environment values to running resources. | Repository search found no non-test caller of `.declareEnv(`; the seam is presently declaration-only. | Keep the requested forward-looking key, but use and report `NETSCRIPT_PROJECT_ROOT ?? Deno.cwd()` fallback as the actual acceptance mechanism. |
| 2026-08-01 | minor, pre-existing | The sagas project-root resolver appeared plugin-local. | Verbatim `projectFileUrl` bodies already exist in sagas, workers, and triggers runtime glue. | Keep the bounded sagas-local resolver for 0.0.3; defer choosing a canonical shared public home. |
