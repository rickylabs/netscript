# W1-A preflight — publish budget and version residue

Observed on 2026-08-06 before dispatch:

- `release-canary.yml` has no authenticated pre-mint publish-attempt budget verdict.
- The release tooling can classify package publication and supports idempotent recovery, but the
  exact reset/report API and fail-before-mint budget contract remain open decisions.
- `findVersionResidue()` in `.llm/tools/deps/bump-version.ts` remains extension-scoped around
  version files and does not generally inspect generated TypeScript assets.
- Release readiness itself documents the JSON-only visibility limitation.
- The milestone plan fixes three remaining content-derived cuts; W1-A must make that cadence
  enforceable against live budget before canary.14 is minted.

## Required supervisor mission

1. Establish the authoritative JSR publish-attempt reset/report semantics from official/current
   evidence and record the source and timestamp in the release skill/run artifacts.
2. Define a typed authenticated budget observation and conservative attempt-cost calculation. The
   canary workflow must refuse before version mint/tag/publish when headroom is absent or unknown.
3. Add negative fixtures proving unknown/insufficient budget cannot mint, tag, or call publish.
4. Reconcile expected package membership against registry truth after a publish attempt and classify
   full, partial, and failed-before-publish outcomes distinctly.
5. Encode the same-semver/partial-canary recovery policy without claiming an incomplete graph is a
   verified pair, and keep real OIDC publication under orchestrator-only workflow authority.
6. Widen version-residue discovery to generated source assets that can embed the release version.
   Seed a stale `.ts` negative and prove exclusions for `.llm/tmp`, `.llm/runs`, `.data`, and
   release baselines remain exact. Measure and record scan cost.
7. Run focused release/dependency tests, workflow parsing, readiness and publish simulation, scoped
   source check/lint/fmt, docs/skill synchronization, JSR audit, and prohibited-diff/lock checks.
8. Open a draft PR with `Closes #1312` and `Closes #1148` only if all rows are actually satisfied;
   leave it at `status:impl-eval` for a separate Qwen evaluator. Never publish during the PR.

The decisive negative is observable absence of mint/tag/publish side effects. A message that merely
says “budget low” while later steps can still execute is false-green and must fail evaluation.
