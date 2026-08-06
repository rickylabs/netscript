# W1-B preflight — consumer smoke and owned-source quality

Observed on 2026-08-06 before dispatch:

- The eight-tool consumer bundle, symptom routing, excluded-file guard, host-port validator, and
  offline docs shipped through PR #1092 and are present on the current train.
- #1024's sole remaining row requires a scaffolded project to execute the full smoke without a
  framework checkout.
- Generated quality tasks still omit important `.tsx`, plugin, and background/runtime source while
  broad lint/fmt traverses generated/offline material and produced 154 inherited findings in the
  Wave 6 scaffold.
- Current repo tooling already provides scoped check/lint/fmt runners; generated tasks should
  consume that convention instead of introducing another file-selection authority.

## Required supervisor mission

1. Inventory every executable source root generated into a full Fresh/service/contracts plus
   workers/triggers/streams project, including every file the default AppHost executes.
2. Define one generated owned-source manifest/selection contract covering `.ts` and `.tsx` across
   apps, services, contracts, plugins, jobs/tasks/background runtime, without sweeping offline docs,
   installed skills, caches, runtime data, or unrelated generated assets.
3. Make generated check/lint/fmt tasks use the shipped scoped runner conventions and prove a clean
   full scaffold has zero framework-owned findings or formatting churn. Fix owned source defects; do
   not hide them with exclusions.
4. Inject deliberate TypeScript and TSX failures into each owned surface and prove the correct gate
   catches every one. Include a negative for a file outside the owned product surface.
5. From outside any framework checkout, run the installed consumer `scaffold-e2e-test.ts` against a
   scaffolded project through plugin install, DB init/generate/seed, Aspire endpoints/background
   paths, generated check, and exact owned cleanup.
6. Run focused CLI/generator/tool tests, source wrappers, quality/doctrine/docs/package gates, then
   the exact one-pass repository `scaffold.runtime --cleanup --format pretty` gate.
7. Preserve #1092's delivered criteria and offline docs byte stability. Record any changed generated
   assets explicitly and keep lock/resource ownership clean.
8. Open a draft PR with `Closes #1024` and `Closes #1328` only when every remaining row is
   evidenced; leave it at `status:impl-eval` for separate Qwen evaluation.

The consumer smoke must prove its scripts and support files come from the installed project. A smoke
that reaches back into this repository through an absolute path, workspace import, DENO_DIR state,
or undeclared checkout is not acceptance evidence.
