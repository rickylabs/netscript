# Supervisor

Issue #2108; B2; coordinator #2474 / mc009e. Branch `orch/divybot-6543997755`.
Baseline main `a9620a34e14e067c56bb6af025ec015f7252b7aa`, verified against remote.
Implementation: current Codex session, OpenAI family, feature / sol / xhigh.
Matrix queried with `deno task agentic:matrix --tier feature --json`.
Owner evaluator override: `claude -p --model claude-opus-5-5 --effort high`, separate Anthropic session, read-only, stdin closed, blockers only. Reuse across rounds; max 2 plan and 5 implementation rounds, stop after two consecutive terminal failures.

## Authorized write surface

- This run directory (including sanitized evaluation/evidence and memory).
- `packages/cli/e2e/fixtures/kv-only/` — opt-in consumer acceptance proof, not a new CI tier.
- `packages/cli/src/local/composition/kv-only-plugins_test.ts` — clean CLI consumer regression.
- Existing CLI scaffold/install/Aspire helper files and focused tests only if the consumer exposes a defect.
- Existing saga runner/store/projection tests only to close demonstrated proof gaps.
- `docs/site/orchestration-runtime/how-to/add-a-plugin.md`, related source documentation and required generated documentation carriers.
- Local excluded runtime/output under project runs or artifacts; temporary files use TMPDIR.

No unrelated lock churn, labels/milestones, merge, tag or publication. Assignment and final report handoff remain uncommitted. Public records omit operator paths, session IDs, hostnames and allocated endpoints.

Demonstrated acceptance refinements: `packages/cli/src/kernel/adapters/plugin/browser-auth-reconciler.ts`, its BFF template, helper assets/manifest/embedded carrier, helper generator tests, and `plugins/workers/src/cli/runtime-registry-generator.ts` are included to repair the generated lint failures.

Post-ready validation surface: `.llm/tools/validation/fixtures/aspire-surface-manifest.tsv`, canonical generated inventory only (six new fixture/test rows).

CI-repair generated surface: `packages/mcp/src/publish-assets.generated.ts`, canonical publish-assets wrapper for the already-reviewed docs corpus.

CI-repair test support: root `deno.json` declares the emitted BFF's existing cookie dependency for in-process dynamic imports and subprocess fixture maps that inherit root imports. `packages/cli/src/kernel/templates/aspire/helpers/tests/generators-pipeline_test.ts` follows the new empty-tools template's no-op contract. No dependency version or runtime behavior change is intended; the necessary lock metadata exception is documented below.

Necessary lock metadata surface: `deno.lock` and `packages/fresh-ui/deno.lock` must reflect the existing cookie dependency now declared at root. Native lock writers only; require unchanged resolved versions and integrity and explain the exact metadata delta in the PR. This is the operator's reviewed-fix exception, not permission for unrelated lock churn.

Runtime CI repair surface (S4): `packages/cli/e2e/src/application/gates/scaffold/configure-published-workers-block.ts`, `prepare-flow-b-fixture.ts`, and `packages/cli/e2e/tests/application/gates/configure-published-workers-block_test.ts`. Both runtime tiers reject the old fixture's single-line config/published-entrypoint assumptions after local service launch metadata was corrected. Reuse the existing format-independent config rewrite and validate the exact expected local service entrypoint. No product generator, runtime behavior, dependency or lock change.
